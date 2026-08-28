// Two distinct date-handling problems live here.
//
// 1. Plain "YYYY-MM-DD" strings that WE generate/store (payslip dates,
//    joining dates, etc.) - `new Date("2026-07-05")` is parsed by
//    JavaScript as UTC MIDNIGHT, not local midnight. Reading it back
//    with local getters (getDate/getMonth/getFullYear) can then show
//    the previous day depending on the machine's timezone. Fix: parse
//    the string ourselves and build the Date with the LOCAL
//    constructor, so construction and reading are always consistent.
export function parseIsoDateLocal(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// 2. Dates read out of an Excel file via the `xlsx` library. Using
//    `cellDates: true` and then reading with EITHER local OR UTC
//    getters turned out to still be timezone-sensitive - verified
//    directly: the same cell in the same file produced a different
//    underlying timestamp depending on the machine's local timezone
//    at the moment the file was parsed, before any getter was even
//    involved (a real quirk in how that library's date conversion
//    works). The only genuinely reliable fix is to bypass that
//    conversion entirely: read the cell as its RAW numeric Excel date
//    serial (do NOT pass cellDates: true) and convert it to a
//    calendar date with pure arithmetic, so no timezone concept
//    enters at any point in the calculation.
export function excelSerialToIso(serial: number): string {
  const utcMs = Math.round((serial - 25569) * 86400 * 1000);
  const d = new Date(utcMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// A plausible numeric range for an Excel date serial representing
// years ~2000-2100 - used to tell a genuine date column apart from an
// ordinary small integer (like a Sl:No value) when scanning a row.
export function looksLikeExcelDateSerial(value: number): boolean {
  return value > 36526 && value < 73415;
}
