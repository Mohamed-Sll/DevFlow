# FAQ

## General

### What is DevFlow?
DevFlow is an open-source operations cockpit for freelancers and small teams. It provides dashboard, project management, financial tracking, time tracking, and investment management in a single web application.

### Who is it for?
Solo freelancers, independent professionals, and small teams who need a simple but complete system to manage their day-to-day operations.

### Is it free?
Yes, DevFlow is open source under the MIT License. It runs entirely in your browser with no backend required.

## Technical

### Do I need a server?
No. DevFlow uses Dexie.js (IndexedDB) to store all data locally in your browser. There is no backend, no database server, and no API.

### Can I use my own database?
DevFlow is designed for local-first IndexedDB storage. An adapter pattern is used in `lib/data/` so a future remote backend (e.g., Supabase, REST API) can be added without changing page code.

### Does it work offline?
Yes, completely. All data is stored in your browser's IndexedDB. The app requires no network connection after the initial page load.

### Can I self-host?
Yes. Deploy the frontend to any static host (Vercel, Netlify, Cloudflare Pages) — no server or database needed.

### What happens if I clear my browser data?
DevFlow stores web-app records in this browser's IndexedDB only. Clearing this site's storage or browser data deletes the local records permanently; there is no hosted database, account, or backup from which DevFlow can restore them. Private/incognito windows use temporary or isolated storage, and another browser profile or device will not contain this history. Export your records before clearing storage and keep the exported files somewhere safe.

### Can I sync data between devices?
Not yet. Sync support across devices is on the roadmap.

## Features

### Can I add more currencies?
The available currencies are CVE, USD, and EUR. Multi-currency support with exchange rates is on the roadmap.

### Can I invite team members?
No. The public web app is open for anyone to use, but each browser has its own separate local data. There are no accounts, shared workspaces, or cross-device sync.

### How do I export my data?
Use the export buttons on each page. Available formats: CSV, Excel (.xlsx), and PDF.

## Troubleshooting

### The app shows "Failed to load"
Check that:
1. Your browser supports IndexedDB (all modern browsers do)
2. No browser extensions are blocking IndexedDB access
3. You're not in private/incognito mode with storage restrictions

### Charts are not rendering
Make sure your browser supports SVG (all modern browsers do). Try clearing your cache.

### Data is not updating
Data updates immediately on mutations since all operations are local. If the UI doesn't reflect changes, try refreshing the page.
