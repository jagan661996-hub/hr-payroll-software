# Changelog

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
