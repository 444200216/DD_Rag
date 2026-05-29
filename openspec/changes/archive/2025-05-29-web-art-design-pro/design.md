## Context

DD_Rag's current frontend (`frontend/`) is a Vue 3 + Vite + Pinia application with ~3300 lines of hand-written CSS using `--wb-*` custom properties, no component library. It has substantial business logic: JWT auth with refresh cookies, USER/ADMIN role-aware routing, SSE streaming for assistant chat, resumable chunk uploads for documents, and a group-scoped data isolation model.

art-design-pro (`/Users/zhangfeng/Development/workspace-trae/art-design-pro/`) is a Vue 3 + Element Plus + Tailwind CSS + Pinia enterprise template with a rich Art* component library, dual-layer routing (static + dynamic), theme switching, work tabs, and a `pnpm clean:dev` command that strips all demo content to yield a clean scaffold.

The goal is to create a new `web/` directory based on art-design-pro, porting DD_Rag's business logic into the new layout and component system. The old `frontend/` stays untouched. Each page design must be verified via `/browse` before connecting APIs.

## Goals / Non-Goals

**Goals:**
- Produce a clean, production-ready frontend scaffold in `web/` using art-design-pro as base
- Preserve all DD_Rag business logic: auth flow, role routing, group isolation, SSE streaming, resumable uploads
- Map DD_Rag's page structure to art-design-pro's layout patterns (sidebar, work tabs, page content)
- Enable light/dark theme switching and responsive layout via art-design-pro's built-in system
- Verify each page's visual design via `/browse` before API integration

**Non-Goals:**
- Modifying the existing `frontend/` code or deleting it
- Changing any backend API endpoints or contracts
- Porting the `--wb-*` CSS token system (replaced entirely by Element Plus + Tailwind)
- Implementing long-term memory features (already removed in V12 migration)
- Adding new business features not present in the current frontend

## Decisions

### 1. Scaffold Strategy: Full Copy + Clean

**Decision**: Copy the entire art-design-pro project to `web/`, run `pnpm clean:dev` to strip demo pages/data, then build DD_Rag pages on the clean scaffold.

**Alternatives considered**:
- *Git subtree/monorepo*: Would tie DD_Rag's frontend to art-design-pro's release cycle — too tightly coupled.
- *NPM package*: art-design-pro isn't published as a package; copying gives full control over layout, theme, and component customization.

**Rationale**: `pnpm clean:dev` removes all demo views, mock data, and example routes, leaving the layout system, component library, routing infrastructure, and theme engine intact. This is the fastest path to a clean base.

### 2. API Layer: Adapt to art-design-pro's HTTP Utils

**Decision**: Port DD_Rag's 6 API modules into `web/src/api/`, using art-design-pro's `src/utils/http/` Axios wrapper (which already handles token injection, 401 retry, error normalization) instead of DD_Rag's custom `http.ts`.

**Key adaptation**: DD_Rag uses `Authorization: Bearer` header + HttpOnly refresh cookie. art-design-pro's HTTP utils store tokens in localStorage. We MUST override to use cookie-based refresh (matching the backend's JWT pattern) and keep `Authorization` header injection.

**Rationale**: Reusing art-design-pro's interceptor pipeline (request/response transforms, error retry, loading state) saves effort, but the auth token strategy must match DD_Rag's backend contract.

### 3. State Management: Extend art-design-pro's Pinia Stores

**Decision**: Keep art-design-pro's existing stores (user, menu, setting, worktab, table) and add two new DD_Rag-specific stores:
- `auth.ts` — JWT lifecycle, bootstrap, role routing, currentUser with ADMIN/USER system roles
- `group.ts` — currentGroupId, owned/joined groups, pending invitations, group isolation enforcement

Both use `pinia-plugin-persistedstate` (art-design-pro's pattern).

**Rationale**: art-design-pro's user store handles login/permissions generically; DD_Rag's needs are specific (system ADMIN vs USER roles, group-scoped isolation). Separate stores avoid entangling the two domains.

### 4. Layout Mapping: WorkbenchShell → ArtSidebarMenu + ArtPageContent

**Decision**: Map DD_Rag's 3-column WorkbenchShell (sidebar + main + aside) to art-design-pro's layout:
- `ArtSidebarMenu` replaces `WorkbenchSidebar` — navigation menu with DD_Rag's routes (Groups, Documents, QA, Assistant, Admin)
- `ArtHeaderBar` + `ArtWorkTab` replace the simple page header — multi-tab browsing with keepAlive
- `ArtPageContent` wraps `<RouterView>` for each business page
- Context aside panels (Group aside, Document aside, QA aside) become right-side drawers or collapsible panels within the page content area

**Rationale**: art-design-pro's layout is more feature-rich (work tabs, breadcrumbs, global search). DD_Rag's aside panels are contextual — better as page-level drawers than permanent layout columns.

### 5. Auth Pages: art-design-pro Auth Layout + DD_Rag Auth API

**Decision**: Use art-design-pro's auth page layout (`AuthTopBar` + centered form card) instead of DD_Rag's `AuthSplitShell` (brand panel + form panel split). Port DD_Rag's login/register/password-change forms into Element Plus `el-form` components, calling DD_Rag's auth API endpoints.

**Rationale**: art-design-pro's auth layout is cleaner and responsive. The DD_Rag split layout's brand panel doesn't carry essential information; the centered card layout is more standard.

### 6. Routing: Extend art-design-pro's Dual-Layer System

**Decision**: Add DD_Rag business routes as a new `modules/ddrag.ts` route module in art-design-pro's `src/router/modules/`. Port the USER/ADMIN role enforcement and `mustChangePassword` logic into art-design-pro's `beforeEach` guard:

- Static routes: `/auth/login`, `/auth/register`, `/account/security` (no auth required)
- Dynamic routes (ddrag module): `/groups`, `/documents`, `/qa`, `/assistant`, `/admin/overview`, `/admin/users`
- Route meta: `roles: ['USER']` for business routes, `roles: ['ADMIN']` for admin routes, `requiresAuth: true`, `mustChangePassword` flag
- Guard logic: unauthenticated → `/auth/login`; ADMIN on business route → `/admin/overview`; USER on admin route → `/groups`; mustChangePassword → `/account/security`

**Rationale**: art-design-pro's route module pattern makes it easy to add DD_Rag routes as a self-contained module. The role-aware guard logic is DD_Rag-specific and must be added to the existing guard pipeline.

### 7. SSE Streaming: Composable (useSSEStream)

**Decision**: Extract DD_Rag's SSE streaming logic (native `fetch` + manual `\n\n` event parsing) into a Vue composable `useSSEStream` in `web/src/hooks/`. The composable returns `{ data, error, isStreaming, start, stop }` and handles event parsing, reconnection, and cleanup.

**Rationale**: art-design-pro uses composables (`useTable`, `useChart`, etc.) as its primary development pattern. Wrapping SSE as a composable makes it reusable and testable, matching the project's conventions.

### 8. Resumable Upload: Composable (useResumableUpload)

**Decision**: Extract DD_Rag's chunk upload state machine into a composable `useResumableUpload` in `web/src/hooks/`. The composable returns `{ progress, status, startUpload, retry, cancel }` and manages the init → chunk upload → status polling → completion lifecycle.

**Rationale**: Same as SSE — composables are art-design-pro's pattern. The upload logic is complex (state machine with multiple phases) and deserves its own composable.

### 9. Components: ArtTable + ArtForm as Primary Building Blocks

**Decision**: Use art-design-pro's `ArtTable` for document lists, group lists, admin user lists. Use `ArtForm` for QA prompt input, group creation/edit forms, document filter forms. Use `ArtChatWindow` as the base for assistant chat (customized with SSE streaming and KB_SEARCH toggle).

**Rationale**: `useTable` + `ArtForm` are art-design-pro's core development APIs. Using them reduces template code and follows the project's established patterns.

### 10. Verification Flow: Design First, API Second

**Decision**: Implement pages in two phases per page:
1. **Design phase**: Create the page with mock/placeholder data, verify layout and interactions via `/browse`
2. **API phase**: After design approval, connect to DD_Rag backend APIs via the ported API modules

**Rationale**: The user explicitly requested this flow. It prevents wasted API integration work if the layout needs changes, and gives a clear checkpoint for each page.

## Risks / Trade-offs

- **[Visual regression]** → The new frontend will look significantly different (Element Plus + Tailwind vs hand-written CSS). User must accept the visual change before proceeding. Mitigation: `/browse` verification at each page milestone.
- **[Auth token mismatch]** → art-design-pro stores tokens in localStorage; DD_Rag uses HttpOnly refresh cookies. If we accidentally use localStorage for refresh tokens, the backend won't recognize them. Mitigation: Override art-design-pro's HTTP interceptor to use `Authorization` header only; let the browser handle refresh cookies automatically.
- **[Work tab state for chat]** → ArtWorkTab's keepAlive may cause issues with SSE streaming (connections persisting across tab switches). Mitigation: Exclude assistant chat route from keepAlive cache, or implement cleanup in `onDeactivated`.
- **[Demo data residue]** → `pnpm clean:dev` removes demo pages but some config references (menu items, default routes) may remain. Mitigation: Manual review of `src/config/` and `src/router/modules/` after clean.
- **[Element Plus bundle size]** → art-design-pro uses on-demand import, but the total bundle will be larger than the current hand-written CSS frontend. Mitigation: Vite tree-shaking + Element Plus auto-import mitigates this; acceptable tradeoff for the UI capability gain.