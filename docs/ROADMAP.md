# Roadmap

Each phase is delivered separately and waits for review before the next one starts.

| Phase | Scope | Status |
|---|---|---|
| 1 | Project setup: folder structure, configs, draft DB schema, Electron shell, CI build workflow | Done |
| 2 | Database: migration runner, seed data, repositories per table | Done |
| 3 | Authentication: Admin/HR/Employee login, JWT sessions, role guards | Done |
| 4 | Employee Module: Employee/Department/Designation/Branch/Shift masters | Done |
| 5 | Attendance: daily/monthly views, Excel import matching Attendance.xlsx layout, corrections, lock | Done |
| 6 | Leave: leave types/balances/requests matching Staff_Leave_Details.xls, approval workflow, calendar | Done |
| 7 | Payroll: salary structure editor, monthly run, payslip PDF matching the sample, salary register, bank transfer report | Done |
| 7b | On Duty: apply/approve/reject workflow, PDF form matching ON_DUTY_FORM_INDFANS.doc | Done |
| 8 | Reports: PF/ESI dashboards, charts, salary register export, live Dashboard cards | Done |
| 8b | Documents: Appointment Letter DOCX matching the uploaded template, salary annexure | Done |
| 9 | Settings: company/financial year/policies, backup/restore, audit logs, roles | **Done (this delivery)** |
| 10 | Testing | Not started |
| 11 | EXE build hardening: code signing, auto-update, release notes | Not started |

## Known environment constraints
- The actual signed `.exe` is produced by the `build-windows.yml` GitHub Actions workflow (windows-latest runner), not locally - a Linux dev sandbox has no Windows toolchain.
- Getting code onto GitHub requires pushing from a git-enabled environment (Codespaces terminal), since a plain browser session has no git write credentials.

## Login
Default seeded admin account: `admin@industrialfans.local` / `Admin@123`
