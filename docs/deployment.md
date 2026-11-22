# Deployment

## Vercel (Recommended)

### Setup

1. Push your repository to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Configure the project:

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Root Directory | `web` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

4. No environment variables are needed — the app runs entirely locally in the browser with IndexedDB
5. Deploy

### vercel.json

The project includes a `vercel.json` with:
- SPA rewrites (all routes → `index.html`)
- Security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy)

## CI/CD

### GitHub Actions

The CI pipeline (`.github/workflows/ci.yml`) runs on every push and pull request to `main`:

| Job | Steps |
|---|---|
| `web` | `npm ci` → `npm run typecheck` → `npm run lint` → `npm run test` → `npm run build` |
| `python` | `ruff check .` → `python -m compileall` on the desktop modules → `pytest` |

## Manual Build

```bash
cd web
npm install
npm run typecheck
npm run test
npm run build
```

The output will be in `web/dist/`.
