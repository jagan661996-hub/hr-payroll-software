import * as XLSX from "xlsx";
import Database from "better-sqlite3";
import { EmployeeRepository } from "../repositories/employee.repository";
import { AttendanceRepository } from "../repositories/attendance.repository";
import { excelSerialToIso, looksLikeExcelDateSerial } from "../utils/dateUtils";

export interface ImportResult {
  daysImported: number;
  employeesMatched: string[];
  employeesUnmatched: string[];
}

// Fixed columns before the daily date columns start, matching the
// sample file layout: Sl:No: | Name | Location | <day 1> | <day 2> ...
const NAME_COLUMN_INDEX = 1;
const FIRST_DATE_COLUMN_INDEX = 3;

// Deliberately forgiving: strips ALL punctuation and whitespace, not
// just collapsing spaces. Real spreadsheets are inconsistent about
// "M.Jagan" vs "M. Jagan" vs "M Jagan" - none of that should matter
// for matching a name that's otherwise identical.
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Different attendance registers use different shorthand for the same
// thing (e.g. this file uses "S" for Sunday where an earlier one used
// blank cells for week-offs). Map every known variant onto the
// system's own status vocabulary so the display is always consistent
// regardless of which spreadsheet convention was used.
const STATUS_SYNONYMS: Record<string, string> = {
  S: "WO",
  SUN: "WO",
  SUNDAY: "WO",
  WEEKOFF: "WO",
  "WEEK OFF": "WO",
  HALFDAY: "HD",
  "HALF DAY": "HD",
  HOLIDAY: "HL",
  ABSENT: "A",
  PRESENT: "P",
  ONDUTY: "OD",
  "ON DUTY": "OD",
  LEAVE: "L",
  WORKFROMHOME: "WFH",
  "WORK FROM HOME": "WFH"
};

function normalizeStatusCode(raw: string): string {
  const upper = raw.trim().toUpperCase();
  return STATUS_SYNONYMS[upper] ?? upper;
}

function toIsoDate(cellValue: unknown): string | null {
  // Deliberately reads the RAW numeric Excel date serial (see
  // dateUtils.ts for why cellDates:true isn't used here at all - it
  // was verified to produce a different underlying value depending on
  // the machine's timezone, which is exactly the bug this file used
  // to have).
  if (typeof cellValue === "number" && looksLikeExcelDateSerial(cellValue)) {
    return excelSerialToIso(cellValue);
  }
  return null;
}

export function importAttendanceExcel(buffer: Buffer, db: Database.Database): ImportResult {
  // Deliberately NOT using cellDates:true - see toIsoDate/dateUtils.ts.
  // Reading raw numeric date serials and converting them ourselves
  // with pure arithmetic is the only genuinely timezone-safe approach.
  const workbook = XLSX.read(buffer, { type: "buffer" });
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
      const statusCode = normalizeStatusCode(String(cell));
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
