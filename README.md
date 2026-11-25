<div align="center">
  <img src="assets/devflow-readme-banner.svg" alt="DevFlow — projects, finances, time tracking and investments for freelancers" width="100%" />

  <h1>DevFlow</h1>
  <p><strong>Operations dashboard for freelancers: projects, finances, time tracking and investments in one place.</strong></p>

  <p>
    <a href="https://github.com/Mohamed-Sll/DevFlow/actions/workflows/ci.yml"><img src="https://github.com/Mohamed-Sll/DevFlow/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
    <img src="https://img.shields.io/github/license/Mohamed-Sll/DevFlow?style=flat-square" alt="License" />
  </p>

  <p>
    <a href="#features">Features</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#testing">Testing</a> •
    <a href="#documentation">Docs</a>
  </p>
</div>

---

## About

DevFlow helps a freelancer or small team run the day-to-day: which projects are active, what has been paid, where the money went, how many hours went into each client and how investments are progressing.

The repository contains **two independent clients**:

| Client | Stack | Data |
|---|---|---|
| **Web app** (`web/`) — main client | React 19, TypeScript, Vite, Tailwind CSS | Local-first, stored in the browser's IndexedDB through Dexie.js. No server, no account, works offline. |
| **Desktop app** (repository root) | Python 3.12, PyQt6 | Supabase (PostgreSQL). Packaged for Windows with PyInstaller. |

The two clients do not share data. The public web app has no login: each visitor's records stay in that browser profile, without upload, sharing, or sync across devices. The web app replaced Supabase with IndexedDB in June 2026 (see [ADR-007](docs/decisions.md#adr-007-local-first-web-storage-with-dexie)); the desktop client remains a separate Supabase-based app and requires the user to configure their own project.

> [!WARNING]
> **Web data is stored only in your browser.** DevFlow's web app has no hosted database, account, cloud backup, or sync. If you clear this site's/browser's storage, use a private window, or switch browser profiles/devices, your history may disappear or be unavailable. Clearing IndexedDB deletes the local records permanently; DevFlow cannot restore them. Export your records regularly and keep the exported files somewhere safe.

> Before clearing browser data or moving to another profile, use **Settings → Data and backups** to download a complete JSON backup. Restore that file in the destination browser. Keep the backup private: it contains your projects and financial records.

Restoring a backup replaces the records in the current browser. DevFlow checks the file format, values and links between records before doing that. Recurring expenses are locally recorded expenses marked as recurring: the app can show a due date from the saved day, but it does not create future charges or mark bills paid automatically. The recurring count is not a guaranteed monthly forecast. Investments and their movements are listed separately from the operating cash balance.

The public URL is open for anyone to use, but users do not see each other's records: data is isolated in each browser's local IndexedDB. This is an open-source portfolio/demo project, not a hosted multi-user service.

### Demo

- **Live demo:** [dev-flow-wine.vercel.app](https://dev-flow-wine.vercel.app/) — public showcase; each browser profile gets separate local data.
- **Video walkthrough:** coming soon.

---

## Features

### Web app

| Area | What it does |
|---|---|
| Dashboard | Monthly revenue, expenses, operating balance and average ticket; 6-month revenue vs expenses chart; project status distribution; alerts for deadlines, bills due and overdue projects. Investment movements stay separate from operating balance. |
| Projects | CRUD with automatic client creation, total / paid / outstanding amounts, status filters, search, repository and staging links |
| Finances | Income and expenses with categories, filters by period, category and payment status, monthly charts |
| Timer | Start/stop per project, automatic duration, estimated billing using the hourly rate saved when a session starts, session history. Older sessions without a saved rate use the current rate as an estimate. |
| Investments | Assets with value and date goals, contributions, withdrawals and returns, progress per investment |
| Export and backup | CSV for spreadsheet apps, formatted Excel (ExcelJS) and PDF reports (jsPDF); JSON backup and restore for every local table and preference, with format and relation checks before restore |

### Desktop app

Dashboard, projects, finances, investments, timer and settings screens, with Excel and PDF exports (openpyxl, ReportLab) and a configurable backup folder.

---

## Architecture

```mermaid
graph TD
    subgraph Web["Web app (web/)"]
        A[Pages] --> B[Hooks: useAsyncData]
        B --> C[lib/data — data access layer]
        C --> D[Dexie.js]
        D --> E[(IndexedDB)]
    end

    subgraph Desktop["Desktop app (root)"]
        F[PyQt6 UI] --> G[database/queries.py — SupabaseRepository]
        G --> H[(Supabase PostgreSQL)]
    end
```

Key decisions (full log in [`docs/decisions.md`](docs/decisions.md)):

- **Local-first web storage.** Dexie gives an async API over IndexedDB with no server, no environment variables and offline support. Pages only talk to `lib/data/`; records never enter the static-file cache or a server.
- **Single snapshot per page.** Each page loads one snapshot with everything it needs and computes derived values client-side, so totals always come from the same data.
- **Theming with CSS custom properties.** Colours live in `index.css` and switch through a `data-theme` attribute, avoiding duplicated `dark:` classes.

---

## Quick Start

### Web app

Requirements: Node.js 20+.

```bash
git clone https://github.com/Mohamed-Sll/DevFlow.git
cd DevFlow/web
npm install
npm run dev        # http://localhost:5173
```

No environment variables are needed.

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Type check + production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check |
| `npm run test` | Unit tests (Vitest) |

### Desktop app

Requirements: Python 3.12 and a Supabase project with the tables from [`docs/database.md`](docs/database.md).

```bash
python -m venv .venv
.venv\Scripts\activate            # Windows
pip install -r requirements.txt
copy .env.example .env            # then set SUPABASE_URL and SUPABASE_KEY
python main.py
```

`build.bat` packages the app into a Windows executable with PyInstaller (`devflow.spec`).

---

## Testing

| Suite | Command | Scope |
|---|---|---|
| Web | `cd web && npm run test` | Formatting, export and utility functions (Vitest) |
| Desktop | `pytest` | Excel and PDF report generation |
| Lint | `cd web && npm run lint` · `ruff check .` | ESLint for the web app, Ruff for the Python code |

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs type check, lint, tests and build for the web app, and Ruff, a compile check and pytest for the desktop code on every push and pull request to `main`.

---

## Deployment

The web app is a static SPA and deploys to Vercel with no environment variables: root directory `web`, build `npm run build`, output `dist`. `web/vercel.json` adds SPA rewrites and security headers (CSP, HSTS, X-Frame-Options). Details in [`docs/deployment.md`](docs/deployment.md).

---

## Documentation

- [Architecture](docs/architecture.md) — web components, data flow and routing
- [Database](docs/database.md) — Supabase schema and RLS policies used by the desktop client
- [Deployment](docs/deployment.md) — Vercel setup and CI
- [Decision log](docs/decisions.md) — architecture decisions and their status
- [FAQ](docs/faq.md) — common questions about the web app

---

## Roadmap

- [ ] Redeploy the public demo
- [ ] End-to-end tests with Playwright
- [ ] i18n

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Commits follow [Conventional Commits](https://www.conventionalcommits.org/).

## License

MIT — see [LICENSE](LICENSE).
