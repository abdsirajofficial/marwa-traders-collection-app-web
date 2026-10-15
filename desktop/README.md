# Marwa Traders — Desktop Application

Tauri + React + Tailwind CSS desktop application for Marwa Traders (Owner, Admin, and Office Staff).

## Features
- Code/PIN authentication (1001: Owner, 2001: Admin, 3001: Staff)
- Executive Real-Time Dashboard (Collections, Settlements, Shortages, Outstanding)
- Customer Directory & Ledger (Opening balance tracking, historical invoices, payment history)
- Manual Invoicing with Initial Payments and real-time outstanding calculation
- Payments Ledger with 58mm Thermal Receipt modal and printing
- Cash Settlement & Shortage Detection workflow
- Payment Correction & Reversal review
- Exportable Financial Reports (CSV / Print / PDF)
- Complete Immutable Audit Trail
- Embedded Cash Collector Mobile Simulator

## Setup & Running
```bash
npm install
npm run dev
```
Runs at `http://localhost:5173`.

## Packaging Windows Desktop App (Tauri)
```bash
npm run tauri dev
npm run tauri build
```
Generates Windows installer packages inside `src-tauri/target/release/bundle/msi/`.
