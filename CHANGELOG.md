# Changelog

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
