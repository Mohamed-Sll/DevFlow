# Architecture

## Overview

DevFlow is a single-page application (SPA) built with React 19, TypeScript, and Vite. It uses Dexie.js (IndexedDB) as its local-first database, requiring no external backend or server.

## Component Architecture

```
App
├── Router (React Router v7)
│   └── AppLayout (nested layout)
│       ├── Sidebar (navigation)
│       ├── Header (title, theme toggle, user info)
│       └── <Outlet /> (page content)
│           ├── DashboardPage
│           ├── FinancePage
│           ├── ProjectsPage
│           ├── InvestmentsPage
│           ├── TimerPage
│           └── ConfigPage
```

### UI Component Tree

```
components/
├── ui/            Generic primitives
│   ├── panel.tsx        Card container with optional actions
│   ├── skeleton.tsx     Loading skeleton
│   ├── stat-card.tsx    KPI display card
│   ├── status-badge.tsx Project status indicator
│   ├── pagination.tsx   Page navigation
│   ├── notice-banner.tsx
│   └── alert-banner.tsx
├── charts/        Data visualization
│   ├── data-viz.tsx     Area, Bar, Donut, Pie charts (Recharts)
│   └── rate-card.tsx
├── layout/        App shell
│   ├── app-layout.tsx   Main layout with sidebar + header
│   └── page-section-nav.tsx
└── shared/        Feature-agnostic components
    ├── error-boundary.tsx
    ├── empty-state.tsx
    ├── full-screen-loader.tsx
    ├── export-dropdown.tsx
    └── month-year-picker.tsx
```

### Data Layer

```
hooks/
└── use-data.ts       useAsyncData (snapshot loading + explicit reload)

lib/
├── data/
│   ├── db.ts          Dexie database class with 9 tables
│   └── index.ts       CRUD operations, snapshot queries, relation resolvers
├── export/            Export generators
│   ├── excel.ts
│   └── pdf.ts
├── format.ts          Formatting and derived-value utilities
├── types.ts           Shared TypeScript interfaces
├── financial-rules.ts Shared financial validation and status rules
├── cn.ts              Class name utility
└── navigation.ts      Route helpers
```

## Data Flow

1. Pages use `useAsyncData` to load a snapshot from Dexie when mounted.
2. User actions call data-access functions in `lib/data/index.ts`; multi-table changes use Dexie transactions.
3. Pages call `reload()` after a successful mutation to refresh the snapshot.
4. Charts and derived values are computed client-side. Investment movements stay separate from operating income and expenses.

## Routing

- React Router v7 with nested layout via `<Outlet />`
- Routes are defined in `App.tsx` with `AppLayout` as the parent
- Page sections are handled via URL path segments (e.g., `/financas/lancamentos`)
- `getWorkspaceSection()` extracts the current section from the pathname

## Theming

- CSS custom properties in `index.css` for all colors
- `data-theme` attribute on `<html>` toggles between `dark` and `light`
- Theme preference is mirrored in IndexedDB and localStorage so it can be applied before the first render.
- Smooth transitions via `transition` on CSS variables

## Browser storage and cache

- Work records are stored in IndexedDB. Clearing site data can remove them, so use the JSON backup before clearing storage or changing browser profiles.
- The service worker caches only the application shell and same-origin, versioned static assets. It never caches IndexedDB records, exports, or requests to an API.
- HTML and the service-worker script are revalidated so a deploy can update promptly. Fingerprinted files under `/assets/` can be cached for a year; their filenames change when their contents change.
- The service worker precaches the app shell and fingerprinted Vite assets. Its cache name follows the built asset list; activation removes older DevFlow caches. The cache is only for offline loading and is separate from user data.
- Private browsing may restrict persistence; the app still opens when `localStorage` is unavailable, though the theme preference may not persist there.
