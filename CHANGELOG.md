# Changelog

## [0.9.6] - Editable Pay Date on Payslips
- **Root cause of "changing the pay date doesn't reflect on the PDF"**: there was nothing to change - the pay date was hardcoded to whatever today's date was at the moment "Run Payroll" was clicked, with no field anywhere in the app to set it
- Added a **Pay Date** field on the Payroll page, used when running payroll
- Added an **Update Pay Date** button (appears once a month has payslips) that changes the pay date on that month's payslips *without* re-running payroll, so calculated amounts are never touched
- New endpoint `PUT /api/payroll/pay-date` (ADMIN/HR only), recorded in the audit log; rejects malformed dates and months with no payslips
- Fixed a related latent bug: the default date used `toISOString()`, which is the UTC date and would show yesterday's date for part of the day in India - now uses the local calendar date
- Verified against the actual generated PDF text (not just the database), under both UTC and India time: set 5 Nov -> PDF shows November 5, 2026; changed to 20 Oct without re-running -> PDF shows October 20, 2026 with net pay unchanged

## [0.9.5] - Fixed Timezone-Dependent Date Bug (Attendance Import & More)
- **Root cause found**: the underlying spreadsheet library's date conversion (`cellDates: true`) turned out to itself be timezone-sensitive at the moment it parses a file - the exact same cell in the exact same file produced a genuinely different underlying value depending on the machine's local timezone, before any of our own code even touched it. This is why it worked correctly in testing but showed dates shifted by a day on a real Windows PC set to India time.
- **The real fix**: attendance import now reads Excel's raw date-serial *number* directly and converts it to a calendar date with pure arithmetic - no Date-object timezone concept enters at any point, so the result is identical on every machine regardless of timezone. Verified directly against the real diagnostic: the same file's date cell produced serial `46204` (→ `2026-07-01`) consistently under UTC, US Pacific, India, and even an extreme +14:00 timezone.
- Found and fixed the same underlying bug class in three other places that format stored dates for display/PDFs (Payslip PDF, On Duty PDF, Appointment Letter) - these parsed a "YYYY-MM-DD" string with `new Date(str)`, which JavaScript treats as UTC midnight, then read it back with local-timezone getters; fixed to parse the string manually and build the date with the local constructor instead, so construction and reading are always consistent
- Also fixed the Work Experience auto-calculated-months feature, which had the same latent issue
- **Verified with a strict per-day test against the real uploaded file, run under four different timezones** (UTC, US Pacific, India, and Kiritimati at UTC+14) - every single day matched exactly in every timezone, including the one that was actually broken before (India)
- Full regression suite re-run under India's timezone specifically confirmed no other feature (payroll, PDFs, appointment letters, experience calculation) was affected

## [0.9.4] - Attendance Import Fixes + Export
- **Root cause of "not matching"**: your new attendance file uses `S` for Sunday/week-off, a status code the system didn't recognize - it now gets automatically normalized to the existing `WO` (Week Off) status, along with several other common synonyms (SUNDAY, HALFDAY, WEEKOFF, etc.) so different spreadsheet conventions all land on the same consistent vocabulary
- **Name matching made much more forgiving**: previously "M.Jagan" and "M. Jagan" (just a missing space) would fail to match. Matching now strips all punctuation and whitespace before comparing, so formatting differences in how names are typed no longer cause real employees to go unmatched. Applied to both Attendance and Leave register imports.
- **Attendance data export**: "Export (Excel)" button on the Attendance page downloads the current month's grid in the same layout used for import
- Verified directly against your actual uploaded `Attendance_July_2026.xlsx`: 0 unmatched employees (previously would have missed a space-variant name), and confirmed `S` cells are now stored as `WO` instead of an unrecognized raw code
- Full regression pass across every module confirmed nothing broke, plus a clean packaging dry-run

## [0.9.3] - Employee Photo, Data Export, Payslip Redesign
- **Employee photo upload**: click the avatar circle on any employee's profile header to upload a real photo (JPG/PNG/WEBP) - replaces the previous "upload it as a document" workaround. Stored the same safe way as the database and documents (outside the app package, survives reinstalls). Re-uploading replaces the old photo instead of piling up files.
- **Employee data export**: "Export (Excel)" button on the Employees page downloads every employee's core, work, and status fields as a real `.xlsx` file
- **Payslip redesign**: rebuilt the payslip PDF layout to match the provided reference design - a green-highlighted Net Pay box in the header, a two-column Earnings/Deductions table with a divider and shaded totals row, and a full-width green "Total Net Payable" box. Dropped the YTD column to match the simpler reference format.
- Cleaned up a leftover duplicate routes file (`employeeProfile.routes.ts`) found while adding the photo routes - every path in it was already handled by `employee.routes.ts` from an earlier pass, so it was dead code shadowed since the module was first built
- Verified with a 10-step test: photo 404-before-upload, upload, byte-for-byte download match, re-upload replacing the old file, rejecting non-image extensions, delete, Excel export validity, and the redesigned payslip PDF still producing the exact correct amounts (Rs. 22,992.00 net pay, matching the real payslip)
- Full regression pass across every module confirmed nothing broke, plus a clean packaging dry-run

## [0.9.2] - Master Data: Add New Department/Designation/Branch/Shift Inline
- Departments, Designations, Branches, and Shifts were previously fixed to whatever the initial seed data had - no way to add more without editing the database directly
- Added `POST /api/meta/departments`, `/designations`, `/branches`, `/shifts` (ADMIN/HR only), each rejecting case-insensitive duplicates with a clear message
- A "+ New" link now sits next to Designation/Department/Branch/Shift in both the Add/Quick-Edit Employee form and the Work Information tab of the full Employee Profile - opens a small popup to add a new value, which is immediately selected without needing to close and reopen the form
- New master values are recorded in the audit log
- Verified with a 10-step test: create each of the four types, confirm duplicate rejection (including case-insensitive), confirm role restriction (an EMPLOYEE-role account correctly can't create master data), and confirm a newly created designation can immediately be assigned to a new employee
- Full regression pass across all modules confirmed nothing broke, plus a clean packaging dry-run

## [0.9.1] - Employee Profile Expansion (9 Sections)
- Migration 003: extends `employees` with Basic/Work Information fields (name parts, DOB, gender, marital status, blood group, nationality, reporting manager, grade, cost center, probation/notice period, etc.) and adds 9 new tables - Personal Details, Identity, Office Contact, Emergency Contacts, Work Experience, Education, Dependents, Exit Details, Documents
- Employees page now links to a full Employee Profile page (`/employees/:id`) with a sidebar covering all 9 sections and a header showing photo initials, name, ID, designation, department, join date, and status
- **Identity masking**: PAN, Aadhaar, passport, driving licence, voter ID, and UAN are stored in full but only ADMIN accounts see the real values - everyone else sees them masked (e.g. `XXXXX1234X` for PAN, `XXXX XXXX 1234` for Aadhaar), matching the exact format requested. HR/Admin can still edit these fields even without seeing the previous value again.
- Work Experience auto-calculates total months from date joined/left; validates date order (date left can't precede date joined) on both experience entries and exit details (last working date can't precede resignation date)
- Exit Details section is blocked from being saved while an employee's status is Active, and unlocks once their status changes to Resigned/Terminated
- Document upload/download/delete per employee, categorized (Identity/Education/Experience/Appointment Letter/etc.), stored outside the app package the same way the database is, so they survive updates and reinstalls
- All new writes (personal details, identity, exit details) are recorded in the audit log - identity audit entries deliberately never include the actual sensitive values, only the fact that a change was made
- **Verified with an 18-step test covering every section**: empty-state profile, personal details with server-side address-copy logic, identity save/mask-as-admin/mask-as-HR (caught and fixed a masking bug against the spec's own example along the way), emergency contacts CRUD, experience with auto-calculated months and date-order validation, education, dependents with nominee fields, exit details gating and date validation, and document upload/download with byte-for-byte content verification
- Full regression pass across all 9 previously-shipped modules confirmed nothing broke, plus a clean packaging dry-run

## [0.9.0] - Phase 9: Settings
- Migration 002 adds `company_settings` (single-row config: name, address, financial year start month) - proves the migration system genuinely supports incremental schema changes, not just the initial setup
- Company tab: edit company name/address/financial year start month without touching code
- Users tab: Admins can create HR/Employee logins directly (previously only the one seeded admin account existed) - new accounts are immediately usable for login
- Backup & Restore: download a complete copy of the live database file at any time; restore replaces all data from a previously downloaded backup, with a confirmation prompt and validation that the uploaded file is genuinely a SQLite database before touching anything
- Audit Log: the `audit_logs` table has existed in the schema since Phase 1 but nothing ever wrote to it - now login, employee create/update, salary structure changes, payroll runs, company settings changes, user creation, and backup/restore are all recorded with who did what and when
- **Verified the riskiest part directly**: downloaded a real backup, restored it back into the running server, and confirmed via a fresh API call that all data - including a record created moments before the backup - survived the round-trip intact
- Full regression pass across every other module (Employees, Payroll, On Duty, Documents) confirmed nothing broke

## [0.8.1] - Documents Module
- Appointment Letter generation (`GET /api/documents/appointment-letter/:employeeId`, ADMIN/HR only) - a real, editable `.docx` file built with the `docx` library, using the full company terms transcribed from the uploaded `Appointment_Letter_K_Nandhakumar_print.docx` template
- Header fields (name, position, department, branch, date of joining) and the salary annexure table are personalized per employee, pulled live from their actual record and salary structure; the 14 standard legal clauses stay identical for everyone, matching how the real template works
- Documents page: pick an employee, generate and download their appointment letter; Confirmation/Experience/Relieving letters are shown as clearly-marked "coming in a later phase" placeholders rather than looking broken
- Verified the generated file is a genuinely valid, openable `.docx` (correct zip/XML structure) and visually reviewed the rendered output (converted to PDF) to confirm formatting and that real employee data flows through correctly

## [0.8.0] - Phase 8: Reports & Live Dashboard
- Dashboard's four summary cards ("Present Today," "On Leave," "Late Coming," "Pending Approvals") are finally wired to real data instead of the "--" placeholders they've shown since Phase 1
- Added two Dashboard charts: employees by department (doughnut) and attendance percentage over the last 6 months (bar), plus a payroll expense trend chart (line)
- New Reports page (Admin/HR only) with three tabs: Salary Register, PF, and ESI, each for a selected month
- Excel export for the salary register (`GET /api/reports/salary-register/export`) using the same `xlsx` library already used for attendance/leave imports
- Verified PF report numbers against the real payslip data again (EPF contribution of Rs. 1,800 for the sample employee matches exactly), plus a full regression pass across every earlier module (Employees, Attendance, Leave, On Duty) before shipping

## [0.7.1] - On Duty Module
- Apply/approve/reject workflow (`POST /api/on-duty`, `PUT /api/on-duty/:id/status`, ADMIN/HR approve), mirroring the Leave module's pattern
- PDF form generation (`GET /api/on-duty/:id/pdf`) matching the exact layout of the uploaded `ON_DUTY_FORM_INDFANS.doc` - Name/Emp ID/Position/Dept/Date From/To/Purpose plus approval signature lines, pulling designation and department straight from the employee record
- On Duty page with the same request/approve/reject table pattern as Leave, plus a "Form PDF" download per request
- Verified end-to-end (apply, approve, double-approval rejection, PDF download, reject workflow) and visually reviewed the generated PDF against the real uploaded form before shipping

## [0.7.0] - Phase 7: Payroll
- Salary structure editor (`GET`/`PUT /api/payroll/structure/:employeeId`, ADMIN/HR only) - HR edits Basic/DA/HRA/allowances and deductions per employee without touching code
- Monthly payroll run (`POST /api/payroll/run`): computes every active employee's payslip for a given month, prorating earnings against attendance (absent days and half-days reduce paid days; a clean month is paid in full), and reports which employees were skipped for missing a salary structure
- Payslip PDF generation (`GET /api/payroll/payslips/:id/pdf`) styled after the original sample payslip, including a proper Indian-numbering ("Twenty-Two Thousand Nine Hundred Ninety-Two Only") amount-in-words line and a year-to-date column computed from the Indian financial year (April-March)
- **Verified the payroll math against your real payslip**: ran payroll for the seeded sample employee (whose salary structure already matches `Payslip_INDF0026_Jul_2025.pdf` exactly) and confirmed the computed Gross (Rs. 25,000.00), Deductions (Rs. 2,008.00), and Net Pay (Rs. 22,992.00) match the real document exactly, before shipping
- Fixed a packaging bug caught during testing: `pdfkit` needs to read its own bundled font-metric files using a real file path, which the single-file server bundle broke (same class of issue as the earlier `better-sqlite3` fix) - `pdfkit` is now kept as a separate real module in the package, like the database driver
- Payroll page: month navigation, "Run Payroll" button, payslip table with PDF download per employee, and a Salary Structures section for editing each employee's pay configuration

## [0.6.0] - Phase 6: Leave
- Leave request workflow: `POST /api/leave` (apply), `PUT /api/leave/:id/status` (approve/reject, ADMIN/HR only) - approving a request automatically updates that employee's leave balance
- Leave balances (`GET /api/leave/balances?year=`) auto-create with each leave type's default annual allowance the first time they're touched
- Historical register import (`POST /api/leave/import`, ADMIN/HR only) parses the exact layout of the original `Staff_Leave_Details.xls` - handles multiple yearly sheets in one workbook, matches employees by name, and sums each employee's monthly totals into a yearly figure
- Fixed a real bug found via testing against your actual file: two sheets in your workbook both covered 2021 with different totals (13 vs 7 days) - import now takes the larger total instead of silently letting whichever sheet processed last overwrite the other
- Leave page: Requests tab (apply, approve, reject) and Balances tab (opening/accrued/used/remaining per employee and leave type)
- Verified end-to-end with an 8-step test including a real import of your uploaded `Staff_Leave_Details.xls` (5 sheets, correctly matched by name, correctly deduplicated) before shipping, plus a full local packaging dry-run

## [0.5.0] - Phase 5: Attendance
- `attendance_daily` table now fully wired up: `GET /api/attendance?year=&month=` returns the whole month's grid for every employee
- Excel import (`POST /api/attendance/import`, ADMIN/HR only) parses the exact layout of the original `Attendance.xlsx` - Sl:No/Name/Location columns, then one date column per day - matching employees by name and importing their daily status codes (P/A/OD/L/WFH/HD/WO/HL)
- Import correctly skips the legend/key rows some sheets have at the bottom (e.g. "P=Present") by requiring a real numeric Sl:No, and reports back which names matched vs. couldn't be matched
- Manual day-by-day editing: click any cell in the Attendance page grid to change that employee's status for that day (`PUT /api/attendance/:employeeId/:date`, ADMIN/HR only)
- Attendance page: month navigation, color-coded status badges, horizontal-scrolling grid for employees × days
- Verified against your actual uploaded `Attendance.xlsx` file end-to-end (81 real day-records imported and confirmed correct) before shipping, plus a full local packaging dry-run

## [0.4.0] - Phase 4: Employee Module
- Full employee CRUD: `POST /api/employees`, `PUT /api/employees/:id`, in addition to the existing list/summary endpoints
- `GET /api/meta` returns departments, designations, branches, and shifts in one call for dropdown data
- Create/edit restricted to ADMIN/HR roles via `requireRole` (regular EMPLOYEE-role logins can view but not edit)
- Duplicate employee-code checks on both create and edit
- Real Employees page in the app: table of all employees, "+ Add Employee," and an edit form with dropdowns sourced from live master data
- Sidebar navigation now distinguishes real pages (Dashboard, Employees) from not-yet-built placeholders

## [0.3.0] - Phase 3: Authentication
- Real login: `POST /api/auth/login` verifies against the seeded admin user with bcrypt, issues a JWT
- `GET /api/auth/me` and an `authenticate` middleware protecting `/api/employees/*` and `/api/meta`
- `requireRole()` helper for role-gated routes
- Client: login form calls the API, stores the session, shows real error messages
- Dashboard and all its data require being logged in (`RequireAuth` route guard)
- Header shows the logged-in user's email/role and a working Log out button

## [0.2.0] - Phase 2: Database
- Converted `database/schema.sql` into a versioned migration (`database/migrations/001_initial_schema.sql`)
- Migration runner tracks and applies pending `.sql` files on every app start
- Idempotent seed script: reference data, a default admin user, and one real sample employee (INDF0026 / AJEES KHAN M) with the salary structure traced from the sample payslip
- `EmployeeRepository`, `DepartmentRepository`, `LeaveTypeRepository` data-access classes
- Server bundled into a single self-contained file (esbuild) to avoid npm-workspaces dependency resolution issues during packaging
- Electron's main process actually starts the backend server, pointing SQLite at the OS's writable app-data folder
- Dashboard shows a live "Employees in System" count and database connection status

## [0.1.0] - Phase 1: Project Setup
- Initial monorepo structure (client / server / electron / database / docs / installer)
- React + TypeScript + Tailwind client scaffold
- Express + TypeScript server scaffold with MVC layering
- Draft SQLite schema derived from sample Attendance.xlsx, Salary_Statement.xlsx, and Payslip PDF
- Electron main/preload scaffold
- GitHub Actions workflow to build the Windows installer on `windows-latest`
