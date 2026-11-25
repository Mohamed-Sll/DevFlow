# Architecture Decision Records

## ADR-001: Supabase as Backend

**Date:** 2026-06
**Status:** Superseded for the web app by ADR-007; still applies to the desktop client

### Context
The app needed a backend for persistent data storage, realtime updates, and potential user management.

### Decision
Use Supabase (PostgreSQL + Realtime + Auth) as the sole backend.

### Consequences
- No backend server to maintain
- Rapid development with built-in APIs
- Vendor lock-in to Supabase ecosystem
- Limited to PostgreSQL-compatible data models

---

## ADR-002: React Router v7 with Nested Layouts

**Date:** 2026-06
**Status:** Accepted

### Context
The app has multiple pages that share a common layout (sidebar, header).

### Decision
Use React Router v7 with a parent `AppLayout` component that wraps `<Outlet />` for child pages.

### Consequences
- Consistent navigation and header across all pages
- Shared state for mobile menu and theme
- Simple routing configuration in `App.tsx`

---

## ADR-003: CSS Custom Properties for Theming

**Date:** 2026-06
**Status:** Accepted

### Context
The app needs dark/light theme support with smooth transitions.

### Decision
Define all colors as CSS custom properties in `index.css` and toggle via `data-theme` attribute.

### Consequences
- Dynamic theming without runtime CSS-in-JS
- Smooth theme transitions via `transition` property
- Centralized color management
- No Tailwind dark: prefix duplication

---

## ADR-004: Polling + Realtime Hybrid

**Date:** 2026-06
**Status:** Superseded by ADR-007 (the `useRealtimeSync` hook was removed with Supabase)

### Context
Data needs to stay current across multiple devices/tabs.

### Decision
Use Supabase Realtime subscriptions with a polling fallback (`useRealtimeSync` hook).

### Consequences
- Instant updates when WebSocket is available
- Graceful degradation when realtime fails
- Configurable poll intervals per page
- Higher database read usage due to polling

---

## ADR-005: Auth Removal

**Date:** 2026-06
**Status:** Accepted (single-user model; RLS note applies to the desktop client only)

### Context
The authentication system added complexity for single-user and demo scenarios.

### Decision
Remove all auth code (login page, guards, auth context, session management).

### Consequences
- Simplified codebase (~500 lines removed)
- No login step for users
- Single-user model (multi-user requires re-adding auth)
- All Supabase tables need appropriate RLS for public access

---

## ADR-006: Single Data Snapshot Pattern

**Date:** 2026-06
**Status:** Superseded by ADR-007

### Context
Pages need multiple related data sets (projects, clients, config) and derived calculations.

### Decision
Each page fetches a single snapshot containing all its required data, then computes derived values client-side.

### Consequences
- This described the former network-backed web client.
- The current web client uses the local IndexedDB snapshot flow described in ADR-007.
- Keep this decision as historical context for the desktop client and prior web architecture.

---

## ADR-007: Local-first Web Storage with Dexie

**Date:** 2026-06-27
**Status:** Accepted

### Context
The web app depended on Supabase for every read and write, which meant network latency, a hosted database to maintain and polling to keep tabs in sync, for what is a single-user tool.

### Decision
Store all web data in the browser's IndexedDB through Dexie.js. Pages access data only through `web/src/lib/data/`, and `useLiveQuery` keeps the UI in sync with IndexedDB.

### Consequences
- No server, no environment variables and full offline support
- Instant UI updates after mutations
- Data lives in one browser: no cross-device sync, and clearing site data erases it (exports are the backup)
- The desktop client keeps using Supabase, so the two clients no longer share data
