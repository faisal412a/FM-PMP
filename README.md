# Mini Project Management System

A compact full-stack project management system built with Next.js API routes, React, SQLite, role-based authentication, management dashboards, project CRUD, payments, progress tracking, supplier evaluation, activity logs, and report exports.

## Quick Start

```bash
npm install
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

## Deploy To Railway From GitHub

This app is configured for Railway's Next.js standalone deployment. The production start command runs `scripts/ensure-db.mjs` first, which creates the local SQLite database only when it is missing.

1. Create a GitHub repository and push this project.
2. In Railway, create a new project and choose **Deploy from GitHub repo**.
3. Select the repository and deploy.
4. In the Railway service, open **Networking** and choose **Generate Domain**.
5. Optional but recommended for SQLite persistence: add a Railway Volume mounted to `/app/data`. Railway automatically exposes `RAILWAY_VOLUME_MOUNT_PATH`, and this app will use it for `pm.sqlite`.

Railway should auto-detect:

- Build command: `npm run build`
- Start command: `npm run start`

Add this variable in Railway for better session security:

```bash
AUTH_SECRET=<a-long-random-secret>
```

For production-grade data, migrate the database layer to Railway PostgreSQL instead of SQLite.

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@demo.com` | `password123` |
| Data Entry | `data@demo.com` | `password123` |
| Project Finance | `finance@demo.com` | `password123` |
| Management | `management@demo.com` | `password123` |

## Modules

- Role-based login and menu visibility
- Project master data with Quote and PO references
- Payment schedule with balances, overdue states, and financial summaries
- Progress phases with delay calculation and overall progress
- Supplier evaluation and success scoring
- Dashboard cards, filters, charts, delayed projects, and upcoming payments
- Reports with filters, print/PDF flow, and Excel-compatible CSV export
- Activity log for important project, payment, progress, login, and export events

## Database

SQLite is stored at `data/pm.sqlite`. The seed script creates these tables:

- `roles`
- `users`
- `projects`
- `project_quotes`
- `project_pos`
- `payment_terms`
- `payment_transactions`
- `project_phases`
- `project_documents`
- `supplier_evaluations`
- `activity_logs`

Run `npm run db:seed` any time you want to reset demo data.

## Notes

File upload fields are represented in the UI as file name/path inputs for local development. In production, connect `project_documents`, quote files, and PO files to object storage such as S3, Azure Blob Storage, or a private file server.
