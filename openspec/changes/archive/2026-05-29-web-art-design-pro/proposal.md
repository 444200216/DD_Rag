## Why

The current frontend uses a fully hand-written CSS design system (~3300 lines, `--wb-*` tokens) with no component library, resulting in inconsistent styling, limited UI capability, and high maintenance cost. Adopting art-design-pro as the base scaffold gives us Element Plus + Tailwind CSS + a rich Art* component library out of the box, enabling professional layout, theme switching (light/dark), responsive design, and configurable menus — while preserving all existing business logic (API contracts, role-aware routing, SSE streaming, resumable uploads).

## What Changes

- **New `web/` directory**: A fresh frontend application scaffolded from art-design-pro (via `pnpm clean:dev`), placed alongside the existing `frontend/` directory. The old frontend remains untouched for reference.
- **Port 6 API modules**: `auth`, `qa`, `document`, `group`, `assistant`, `admin-user` + `http.ts` (Axios wrapper with JWT/refresh-cookie pattern) — adapted to art-design-pro's HTTP layer.
- **Port 2 Pinia stores**: `auth.ts` (bootstrap, role routing, JWT lifecycle) and `app.ts` (group context state machine) — adapted to art-design-pro's persisted Pinia pattern.
- **Port TypeScript types**: `assistant.ts` streaming event types + inline types from API modules.
- **Port SSE streaming logic**: Native `fetch` + manual SSE parsing from assistant chat — wrapped as a composable.
- **Port resumable upload logic**: Chunk upload state machine from `documentUpload.ts` — wrapped as a composable.
- **Map DD_Rag pages to art-design-pro layout**:
  - Login/Register → art-design-pro's `/auth/login` / `/auth/register` pages (redesigned with DD_Rag branding)
  - Groups workspace → sidebar detail layout using ArtSidebarMenu + ArtTable
  - Document management → ArtTable + ArtForm for filters + upload composable
  - QA page → prompt panel + citation cards layout
  - Assistant chat → ArtChatWindow component + SSE streaming composable
  - Admin pages → existing art-design-pro system management patterns
- **Role-aware routing**: Port USER/ADMIN dual-role guards and `mustChangePassword` enforcement into art-design-pro's `beforeEach` guard system.
- **BREAKING**: Visual appearance will change significantly (from custom CSS to Element Plus + Tailwind). All `--wb-*` tokens are replaced by art-design-pro's design system.

## Capabilities

### New Capabilities
- `web-scaffold`: The new `web/` directory scaffolded from art-design-pro, cleaned of demo data, with base configuration for DD_Rag (app name, theme defaults, proxy target)
- `auth-pages`: Login, register, and account security pages using art-design-pro's auth layout with DD_Rag's auth API integration
- `group-workspace`: Groups page with owned/joined group management, invitations, join requests, and member management using ArtTable + ArtForm
- `document-management`: Document list, resumable chunk upload, preview, and ingestion status using ArtTable + upload composable
- `qa-chat`: Single-turn Q&A page with prompt input, answer display, and citation cards
- `assistant-chat`: Multi-turn assistant chat with session management, SSE streaming, and KB_SEARCH tool mode using ArtChatWindow
- `admin-pages`: Admin overview dashboard and user management pages using art-design-pro's system module patterns
- `role-routing`: USER/ADMIN dual-role route guards with mustChangePassword enforcement, integrated into art-design-pro's routing system

### Modified Capabilities
<!-- No existing openspec specs to modify — this is a new frontend, not a change to existing specs -->

## Impact

- **New directory**: `web/` — complete new frontend application, no changes to existing `frontend/`
- **Dependencies**: art-design-pro codebase as scaffold source; existing DD_Rag backend APIs remain unchanged
- **Backend API**: No backend changes — the new frontend connects to the same `/api` endpoints (auth, qa, document, group, assistant, admin-user)
- **Build config**: Vite dev proxy will target `localhost:8081` (same as current frontend); Docker Compose will need a separate service for the `web/` frontend
- **Verification flow**: Each page design must be verified via `/browse` before API integration begins