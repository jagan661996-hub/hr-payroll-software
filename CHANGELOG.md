# Changelog

## [0.3.0] - Phase 3: Authentication
- Real login: `POST /api/auth/login` verifies against the seeded admin user with bcrypt, issues a JWT
- `GET /api/auth/me` and an `authenticate` middleware protecting `/api/employees/*`
- `requireRole()` helper ready for role-gated routes in later phases (Admin/HR/Employee)
- Client: login form now actually calls the API, stores the session, and shows real error messages on wrong credentials
- Dashboard and all its data now require being logged in (`RequireAuth` route guard) - direct navigation to `/` without a session redirects to `/login`
- Header shows the logged-in user's email/role and a working Log out button
- A 401 response from the API (e.g. expired token) automatically signs the user out instead of silently failing
- Server bundling issues from Phase 2 packaging (Express/better-sqlite3 not found, wrong migrations path) fully resolved and verified locally end-to-end before shipping

## [0.2.0] - Phase 2: Database
- Converted `database/schema.sql` into a versioned migration (`database/migrations/001_initial_schema.sql`)
- Added a migration runner that tracks and applies pending `.sql` files on every app start
- Added an idempotent seed script: reference data (departments, designations, branches, shifts, leave types), a default admin user, and one real sample employee (INDF0026 / AJEES KHAN M) with the salary structure traced from the sample payslip
- Added `EmployeeRepository`, `DepartmentRepository`, `LeaveTypeRepository` data-access classes
- Added `GET /api/employees` and `GET /api/employees/summary` endpoints
- Electron's main process now actually starts the backend server (previously it only served the frontend), pointing the SQLite file at the OS's writable app-data folder
- Dashboard now shows a live "Employees in System" count and database connection status pulled from the real API

## [0.1.0] - Phase 1: Project Setup
- Initial monorepo structure (client / server / electron / database / docs / installer)
- React + TypeScript + Tailwind client scaffold with login screen and dashboard shell placeholder
- Express + TypeScript server scaffold with MVC layering and `/api/health` endpoint
- Draft SQLite schema derived from sample Attendance.xlsx, Salary_Statement.xlsx, and Payslip PDF
- Electron main/preload scaffold
- GitHub Actions workflow to build the Windows installer on `windows-latest`
- README, ROADMAP, LICENSE
