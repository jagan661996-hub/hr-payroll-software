# HR Payroll Software

Offline-first Windows HRMS + Payroll desktop application for Industrial Fans India Private Limited, inspired by the Zoho People / Zoho Payroll workflow (no Zoho code used).

## Stack
- **Client**: React + TypeScript + Tailwind CSS + Vite
- **Desktop shell**: Electron
- **Server**: Node.js + Express + TypeScript (MVC), bundled to a single file with esbuild
- **Database**: SQLite (`better-sqlite3`), offline-first
- **Packaging**: `electron-builder` -> NSIS Windows installer, built via GitHub Actions

## Status
Phase 4 of 11 complete. See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the full phase plan.

## Default login
`admin@industrialfans.local` / `Admin@123`

## Getting started (development)
```
npm install
npm run dev:server
npm run dev:client
```

## Building the real Windows installer
Push this repo to GitHub - `.github/workflows/build-windows.yml` builds `HRPayrollSetup.exe` on `windows-latest` automatically and attaches it as a downloadable Actions artifact.

## License
Proprietary - internal use for Industrial Fans India Private Limited.
