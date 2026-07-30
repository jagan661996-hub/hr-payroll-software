# Roadmap

Each phase is delivered separately and waits for review before the next one starts.

| Phase | Scope | Status |
|---|---|---|
| 1 | Project setup: folder structure, configs, draft DB schema, Electron shell, CI build workflow | **Done (this delivery)** |
| 2 | Database: migration runner, seed data, repositories per table | Not started |
| 3 | Authentication: Admin/HR/Employee login, JWT sessions, role guards | Not started |
| 4 | Employee Module: Employee/Department/Designation/Branch/Shift masters | Not started |
| 5 | Attendance: daily/monthly views, Excel import matching Attendance.xlsx layout, corrections, lock | Not started |
| 6 | Leave: leave types/balances/requests matching Staff_Leave_Details.xls, approval workflow, calendar | Not started |
| 7 | Payroll: salary structure editor, monthly run, payslip PDF matching the sample, salary register, bank transfer report | Not started |
| 8 | Reports: PF/ESI/Form 16 data, dashboards, charts | Not started |
| 9 | Settings: company/financial year/policies, backup/restore, audit logs, roles | Not started |
| 10 | Testing | Not started |
| 11 | EXE build hardening: code signing, auto-update, release notes | Not started |

## Known environment constraints
- The actual signed `.exe` is produced by the `build-windows.yml` GitHub Actions workflow (windows-latest runner), not by Claude locally - this sandbox has no Windows toolchain.
- Getting the code onto GitHub requires you (or a git-enabled tool like Claude Code) to `git init` / push this folder, since this environment has no GitHub write credentials.
