import * as XLSX from "xlsx";
import Database from "better-sqlite3";
import { EmployeeRepository } from "../repositories/employee.repository";
import { LeaveBalanceRepository } from "../repositories/leaveBalance.repository";

export interface LeaveImportResult {
  sheetsProcessed: string[];
  sheetsSkipped: string[];
  employeesUpdated: { name: string; year: number; totalDays: number }[];
  employeesUnmatched: string[];
}

const HISTORICAL_LEAVE_TYPE_NAME = "Imported Leave (Historical)";
const MONTH_COLUMN_COUNT = 12; // Jan..Dec, always immediately after Sl:No/Name/Location

// Same forgiving normalization as the attendance import - strips all
// punctuation/whitespace so "M.Jagan" / "M. Jagan" / "M Jagan" all
// match the same employee record.
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findHeaderRowIndex(rows: unknown[][]): number {
  for (let i = 0; i < rows.length; i++) {
    const cell = rows[i]?.[0];
    if (typeof cell === "string" && cell.trim().toLowerCase().startsWith("sl:no")) {
      return i;
    }
  }
  return -1;
}

function extractYear(rows: unknown[][], headerRowIndex: number): number | null {
  // The title row above the header usually reads something like
  // "Leave Register from January 2024 to December 2024" - grab the
  // last 4-digit number in the sheet's first few rows as the year.
  for (let i = 0; i < headerRowIndex; i++) {
    const text = rows[i]?.filter(Boolean).join(" ") ?? "";
    const match = text.match(/(20\d{2})(?!.*20\d{2})/); // last 4-digit year in the string
    if (match) return Number(match[1]);
  }
  return null;
}

export function importLeaveRegister(buffer: Buffer, db: Database.Database): LeaveImportResult {
  // No cellDates:true needed - this file only ever reads numbers and
  // text (month totals, names, the year mentioned in a title row),
  // never an actual Date-typed cell.
  const workbook = XLSX.read(buffer, { type: "buffer" });

  const employeeRepo = new EmployeeRepository(db);
  const balanceRepo = new LeaveBalanceRepository(db);
  const allEmployees = employeeRepo.findAll();
  const byName = new Map(allEmployees.map((e) => [normalizeName(e.full_name), e]));

  const historicalType = db
    .prepare("SELECT id FROM leave_types WHERE name = ?")
    .get(HISTORICAL_LEAVE_TYPE_NAME) as { id: number } | undefined;
  if (!historicalType) {
    throw new Error(
      `Leave type "${HISTORICAL_LEAVE_TYPE_NAME}" is missing - it should have been seeded automatically`
    );
  }

  const result: LeaveImportResult = {
    sheetsProcessed: [],
    sheetsSkipped: [],
    employeesUpdated: [],
    employeesUnmatched: []
  };
  const unmatchedSet = new Set<string>();

  // Some registers have overlapping sheets for the same year (e.g. a
  // full-year sheet and a stale mid-year snapshot). Collect every
  // sheet's numbers first and take the larger total per employee/year
  // rather than blindly overwriting - a fuller-year total should
  // never be smaller than a partial one for the same year.
  const totalsByEmployeeYear = new Map<
    string,
    { employeeId: number; employeeName: string; year: number; totalDays: number }
  >();

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });

    const headerRowIndex = findHeaderRowIndex(rows);
    if (headerRowIndex === -1) {
      result.sheetsSkipped.push(sheetName);
      continue;
    }

    const year = extractYear(rows, headerRowIndex);
    if (!year) {
      result.sheetsSkipped.push(`${sheetName} (couldn't determine year)`);
      continue;
    }

    result.sheetsProcessed.push(`${sheetName} (${year})`);

    // Row after the header is month abbreviations (Jan, Feb, ...) -
    // data rows start two rows below the header.
    for (let r = headerRowIndex + 2; r < rows.length; r++) {
      const row = rows[r];
      if (typeof row?.[0] !== "number") continue; // skip anything without a real Sl:No

      const rawName = row[1];
      if (!rawName || typeof rawName !== "string") continue;

      const employee = byName.get(normalizeName(rawName));
      if (!employee) {
        unmatchedSet.add(rawName.trim());
        continue;
      }

      let totalDays = 0;
      for (let m = 0; m < MONTH_COLUMN_COUNT; m++) {
        const cell = row[3 + m];
        if (typeof cell === "number") totalDays += cell;
      }

      const key = `${employee.id}_${year}`;
      const existing = totalsByEmployeeYear.get(key);
      if (!existing || totalDays > existing.totalDays) {
        totalsByEmployeeYear.set(key, {
          employeeId: employee.id,
          employeeName: employee.full_name,
          year,
          totalDays
        });
      }
    }
  }

  for (const { employeeId, employeeName, year, totalDays } of totalsByEmployeeYear.values()) {
    balanceRepo.setUsed(employeeId, historicalType.id, year, totalDays);
    result.employeesUpdated.push({ name: employeeName, year, totalDays });
  }

  result.employeesUnmatched = Array.from(unmatchedSet);
  return result;
}
