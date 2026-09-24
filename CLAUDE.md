# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

WXT-based Chrome (MV3) extension used internally by Beliani's HTML/marketing team to add productivity tooling on top of an internal admin system at `prologistics.info` (production) / `prolodev.prologistics.info` (dev). It is a collection of independent content scripts injected into specific admin pages (issue tracker, shop content editor, banner uploader, push notifications, etc.), not a single-page app.

## Commands

Package manager is **Bun** (`bun.lock` present); npm/pnpm also work per `README.boilerplate.md`.

- `bun run dev` — start WXT dev server with hot reload against Chrome, opens configured start URLs (`https://prologistics.info`, `https://prolodev.prologistics.info`)
- `bun run dev:firefox` — same, targeting Firefox
- `bun run build` — production build to `.output/chrome-mv3/`
- `bun run build:firefox` — production build for Firefox
- `bun run zip` / `bun run zip:firefox` — build and zip the extension for distribution
- `bun run compile` — `tsc --noEmit`, use this as the type-check/lint gate (no ESLint/test runner configured)
- `bun run format` / `bun run format:check` — Prettier (config in `.prettierrc`; `.prettierc.json` is a duplicate, keep both in sync if editing)

There is no test suite in this repo (`popup/test.js` is a leftover boilerplate stub, not a real test). Verify changes with `bun run compile` and, for UI-affecting changes, `bun run dev` loaded against a real prolodev page.

## Architecture

### Entrypoints = independent mini-apps, not routes

Everything under `src/entrypoints/*.content/` is a **separate WXT content script**, each with its own `matches` URL pattern in its `index.ts`/`index.tsx`, scoped to one specific PHP page or path on `prologistics.info`. There is no shared router — a script only ever runs on the admin pages it matches. When working on a feature, first check the entrypoint's `matches` array to know which page it targets:

| Entrypoint | Matches (approx.) | Purpose |
|---|---|---|
| `issue.content` | `/react/logs/issue_logs/*` | Large mini-app: issue dashboard overlay — checklist generation/tracking, family table, planning modal (spam/newsletter planning), banner updater, comments/mentions. This is the largest and most actively developed entrypoint. |
| `shop_content.content` | `shop_content.php*` | Shop content editing helpers |
| `shop_cat.content` | `shop_cat.php*` | Shop category page helpers |
| `cgb-banners.content` | `shop_banners.php*` | Banner upload buttons/UI |
| `news_email.content` | `news_email.php*` | Newsletter email tooling |
| `push.content` | `push_notifications.php` | Push notification tooling |
| `purge.content` / `purge_date.content` | `purge.php*` / `<all_urls>` | Cache purge helpers |
| `saved_details.content` | `saved_details.php*` | Download/fetch saved product details |
| `paste_button.content` | `news_email.php*`, `shop_content.php*` (`world: "MAIN"`) | Injects a paste-helper button into page (MAIN world, not isolated) |
| `sidemenu.content` | `<all_urls>` on the domain | Side menu injected across all admin pages |
| `updater.content` | whole domain | Background update checker (`checkForUpdate`) |
| `newtab` | new tab page | Custom new-tab override |
| `popup` | extension toolbar popup | Popup UI |
| `background.ts` | service worker | See below |

Root-level `src/entrypoints/index.content.tsx` and `messaging.content.ts` are boilerplate/example content scripts (generic `<all_urls>` table scraper and a placeholder React overlay) — treat as reference scaffolding, not load-bearing features.

### Background service worker (`src/entrypoints/background.ts`)

Central message hub (`browser.runtime.onMessage`) other content scripts talk to via `action`-tagged messages. Key responsibilities:
- IndexedDB-backed zip storage (`ZipStorage_SW`) for banner assets uploaded from `cgb-banners.content`
- Sequential multi-tab processing queue (`processTabsSequentially` / `processNextInQueue`) that opens one admin tab per shop, waits for `tabs.onUpdated` complete, injects scripts via `browser.scripting.executeScript` to fill file inputs, then advances to the next queue item
- `openPurgeAndSubmit` — opens a hidden tab to submit the purge form via `fetch` with `credentials: 'include'`
- Shop id/slug mapping and cashback-campaign language mapping (`COUNTRY_CASHBACK`) live inline in this file, duplicated conceptually with `issue.content/lib/shopConfig.ts` and `shopIdMap.ts` — check both when changing shop lists

Content scripts and the background worker communicate exclusively through `browser.runtime.sendMessage` / `onMessage` with an `action` string field; there is no typed message bus.

### `issue.content` internal structure

This is the most complex entrypoint — treat it as its own app:
- `api/` — all network calls. Two backends are involved: the admin site's own REST-ish endpoints (`${window.location.origin}/api/...`, called via `axios`, cookie/session auth from the page) and an external `zrok` tunnel (`ZROK_BASE`) used for spreadsheet translation lookups, wrapped with timeout/retry helpers (`withZrokTimeout`, `withLongTimeout`, `withRetry`)
- `lib/` — static config/types: shop code ↔ id maps, shop ordering per table type (`shopConfig.ts`, `shopIdMap.ts`, `shopMaps.ts`), shared `types.ts`
- `components/` — feature UI: `FamilyTable` (+ `familytable/` subcomponents), `PlanningModal` (+ `planningmodal/`), `UpdaterModal` (+ `updater/`), comment/mention pickers (`pickers/`)
- `utils/planning/` and `utils/updater/` — business logic (hooks + pure helpers) backing the planning and banner-updater modals, kept separate from presentational components
- Shop codes (`UK`, `PL`, `DE`, `CHDE`, `CHFR`, `BEFR`, `BENL`, etc.) are the recurring domain identifier throughout this entrypoint and in `background.ts` — several countries split into multiple "shops" by language (Switzerland → `CHDE`/`CHFR`/`CHIT`, Belgium → `BEFR`/`BENL`)

### Shared UI shell (`src/components/`)

`AppProviders`, `Overlay`, `OverlayToggleButton`, `TopBar`, `Modal` and the `useOverlayVisibility` hook (cookie-persisted per-issue visibility) form a reusable overlay-panel pattern used by `issue.content` and available to other entrypoints. Prefer reusing this shell rather than building a new floating panel per entrypoint.

### Path alias

`@/*` maps to `src/*` (see `tsconfig.json`). Use it for cross-entrypoint imports (e.g. `@/entrypoints/push.content/helpers/slugMapper`) instead of relative `../../..` paths.

### Extension manifest (`wxt.config.ts`)

- `srcDir: 'src'`, React module via `@wxt-dev/module-react`
- Permissions: `identity`, `tabs`, `scripting`, `activeTab`, `storage`; host permission limited to `*://*.prologistics.info/*`
- Google OAuth2 client configured for Calendar (readonly) + userinfo scopes
- Dev builds get a `(DEV)` suffix appended to the extension name via the `build:manifestGenerated` hook
