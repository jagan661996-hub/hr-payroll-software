import * as XLSX from "xlsx";
import Database from "better-sqlite3";
import { EmployeeRepository } from "../repositories/employee.repository";
import { AttendanceRepository } from "../repositories/attendance.repository";

export interface ImportResult {
  daysImported: number;
  employeesMatched: string[];
  employeesUnmatched: string[];
}

// Fixed columns before the daily date columns start, matching the
// sample file layout: Sl:No: | Name | Location | <day 1> | <day 2> ...
const NAME_COLUMN_INDEX = 1;
const FIRST_DATE_COLUMN_INDEX = 3;

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function toIsoDate(cellValue: unknown): string | null {
  if (cellValue instanceof Date) {
    const y = cellValue.getFullYear();
    const m = String(cellValue.getMonth() + 1).padStart(2, "0");
    const d = String(cellValue.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return null;
}

export function importAttendanceExcel(buffer: Buffer, db: Database.Database): ImportResult {
  // cellDates:true so date-formatted header cells come back as real
  // JS Date objects instead of Excel's numeric serial format.
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });

  if (rows.length < 3) {
    throw new Error("This file doesn't look like the expected attendance sheet layout");
  }

  const headerRow = rows[0];
  // Find every column in the header row that's an actual date - those
  // are the daily attendance columns. Row 2 (day names like "Monday")
  // is a subheader and gets skipped entirely.
  const dateColumns: { index: number; isoDate: string }[] = [];
  for (let i = FIRST_DATE_COLUMN_INDEX; i < headerRow.length; i++) {
    const iso = toIsoDate(headerRow[i]);
    if (iso) dateColumns.push({ index: i, isoDate: iso });
  }

  if (dateColumns.length === 0) {
    throw new Error("No date columns found in row 1 - is this the right file?");
  }

  const employeeRepo = new EmployeeRepository(db);
  const attendanceRepo = new AttendanceRepository(db);
  const allEmployees = employeeRepo.findAll();
  const byName = new Map(allEmployees.map((e) => [normalizeName(e.full_name), e]));

  const matched = new Set<string>();
  const unmatched = new Set<string>();
  let daysImported = 0;

  // Data rows start at index 2 (0-based) - index 0 is the date header,
  // index 1 is the "Monday/Tuesday/..." subheader.
  for (let r = 2; r < rows.length; r++) {
    const row = rows[r];

    // Real data rows always have a numeric Sl:No in the first column.
    // Sheets in this format often have a legend/key section below the
    // data (e.g. "P=Present", "L=Leave") with text in the name column
    // but nothing in Sl:No - skip anything that isn't a real row.
    if (typeof row?.[0] !== "number") continue;

    const rawName = row?.[NAME_COLUMN_INDEX];
    if (!rawName || typeof rawName !== "string") continue;

    const employee = byName.get(normalizeName(rawName));
    if (!employee) {
      unmatched.add(rawName.trim());
      continue;
    }
    matched.add(employee.full_name);

    for (const { index, isoDate } of dateColumns) {
      const cell = row[index];
      if (cell === undefined || cell === null || cell === "") continue; // blank = week off/holiday, don't record
      const statusCode = String(cell).trim().toUpperCase();
      attendanceRepo.upsert(employee.id, isoDate, statusCode, "EXCEL_IMPORT");
      daysImported++;
    }
  }

  return {
    daysImported,
    employeesMatched: Array.from(matched),
    employeesUnmatched: Array.from(unmatched)
  };
}
