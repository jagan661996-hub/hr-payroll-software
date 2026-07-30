# HR Payroll Software

Offline-first Windows HRMS + Payroll desktop application for Industrial Fans India Private Limited, inspired by the Zoho People / Zoho Payroll workflow (no Zoho code used).

## Stack
- **Client**: React + TypeScript + Tailwind CSS + Vite
- **Desktop shell**: Electron
- **Server**: Node.js + Express + TypeScript (MVC: routes → controllers → services → models)
- **Database**: SQLite (`better-sqlite3`), offline-first, path to PostgreSQL migration later
- **PDF**: `pdfkit` for payslips/letters
- **Excel**: `xlsx` for attendance/leave import-export
- **Packaging**: `electron-builder` → NSIS Windows installer, built via GitHub Actions (see below)

## Status
This is **Phase 1 of 11** — project scaffolding only. See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the full phase plan and what's implemented vs. stubbed.

## Getting started (development)
```bash
npm install
npm run dev:server     # http://localhost:4310/api/health
npm run dev:client     # http://localhost:5173
```

## Building the real Windows installer
This sandbox cannot compile a Windows `.exe` directly (no Windows toolchain). Push this repo to GitHub and the included workflow at `.github/workflows/build-windows.yml` will build `HRPayrollSetup.exe` on a `windows-latest` runner and attach it as a downloadable artifact — either automatically on push to `main`, or manually via the Actions tab ("Run workflow").

```bash
git init
git add .
git commit -m "Phase 1: project setup"
git remote add origin <your-repo-url>
git push -u origin main
```

## Folder structure
```
hr-payroll-software/
  client/       React + TS + Tailwind app
  server/       Express + TS API (MVC)
  database/     schema.sql, migrations/
  electron/     main.ts, preload.ts
  docs/         ROADMAP.md and future manuals
  installer/    electron-builder output lands here
  assets/       icons, logos
  reports/      generated report output (gitignored contents)
  templates/    payslip / letter templates
  scripts/      helper scripts
  .github/      CI workflows
```

## License
Proprietary — internal use for Industrial Fans India Private Limited.
