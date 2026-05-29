# DD_Rag Frontend Rebase on art-design-pro — Design Spec

Date: 2026-05-29

## Overview

Rebuild DD_Rag's frontend using art-design-pro as the base scaffold, preserving all business logic while adopting Element Plus + Tailwind CSS + Art* component library for professional layout, theme switching, and responsive design. The new frontend lives in a `web/` directory alongside the existing `frontend/`. All pages are designed first (mock data), verified via `/browse`, then connected to backend APIs.

## Key Decisions

### 1. Scaffold Strategy: Full Copy, Demo Preserved

Copy entire art-design-pro project to `web/`. Demo data and example pages are preserved per user preference. `pnpm clean:dev` can be run later to strip demo content — it targets only demo views, mock data, and example route modules, not business modules we add.

### 2. Menu Layout: LEFT sidebar (default)

Default menu layout = LEFT sidebar mode. Users can switch to TOP/MIXED/DUAL via art-design-pro's settings panel. LEFT matches DD_Rag's current WorkbenchSidebar and provides the most natural transition.

### 3. Work Tabs: Enabled (ArtWorkTab)

Multi-tab browsing with keepAlive enabled. Users can open Groups, Documents, QA simultaneously and switch between them without losing state. Assistant chat page is excluded from keepAlive (`noKeepAlive: true`) to prevent stale SSE connections.

### 4. Theme Color: #5D87FF (blue)

Default brand color = `#5D87FF`. Applied to Element Plus primary color, sidebar highlights, buttons, and all interactive elements. Dark/light mode toggle available via settings panel.

### 5. Auth Layout: art-design-pro's existing auth layout

Reuse art-design-pro's auth pages (AuthTopBar + centered card form). No custom split-screen layout. Login, register, and forget-password pages use art-design-pro's existing structure with DD_Rag's auth API integration.

### 6. Route Prefix: `/management` (not `/admin`)

Management routes use `/management` prefix instead of `/admin`. URL does not reflect user role — role enforcement happens in the route guard layer, not in URL structure.

### 7. Implementation Approach: Design-first, all pages confirmed before API

All pages are created with mock data first. Each page design is verified via `/browse`. After all page designs are confirmed, APIs are connected in a separate phase. This prevents wasted API integration work if layout needs changes.

## Route Architecture

### Static Routes (no auth required)
- `/auth/login` — login page
- `/auth/register` — registration page
- `/auth/forget-password` — password reset (placeholder, backend TODO)
- `/account/security` — password change (authenticated)

### Dynamic Routes (`modules/ddrag.ts`)
| Route | Page | Role Access |
|---|---|---|
| `/groups` | Group workspace | USER |
| `/documents` | Document management | USER |
| `/qa` | Q&A | USER |
| `/assistant` | Assistant chat (noKeepAlive) | USER |
| `/management/overview` | Management dashboard | ADMIN |
| `/management/users` | User list | ADMIN |
| `/management/users/:userId` | User detail | ADMIN |

### Route Guards
- Unauthenticated → `/auth/login?redirect=...`
- ADMIN on business route → `/management/overview`
- USER on management route → `/groups`
- `mustChangePassword` → `/account/security` (highest priority)

## Page Designs

### Login Page
- Layout: art-design-pro's auth layout (AuthTopBar + centered el-form card)
- Form: username + password inputs, "忘记密码" link to `/auth/forget-password`
- Mock: simulated JWT token response

### Register Page
- Layout: same auth layout
- Form: username, email, displayName, password (≥8 chars, alpha+digit required)
- Mock: simulated success → redirect to login

### Account Security Page
- Layout: centered card (same auth style)
- Form: current password + new password + confirm
- Guard: mustChangePassword enforcement redirects here from any other route

### Groups Workspace (`/groups`)
- Layout: page content area with two Tab sections
- Tab 1: "我创建的组" — ArtTable with owned groups (name, members, role)
- Tab 2: "我加入的组" — ArtTable with joined groups
- Pending invitations: separate card section above tabs
- Create group: el-dialog + ArtForm (name + description)
- Group detail: right-side Drawer — member list, invitation sender, join request handler, leave group button
- Group selector component: reusable `currentGroupId` selector for other pages
- Mock: 3-5 groups with varied roles

### Document Management (`/documents`)
- Layout: top = ArtForm search bar (status filter + group selector + upload button + refresh button) → bottom = ArtTable
- ArtTable columns: filename, upload time, status (el-tag colored: PENDING=info, PROCESSING=warning, COMPLETED=success, FAILED=danger), actions (preview/delete/retry)
- Upload flow: el-dialog → file select → `useResumableUpload` composable → progress bar → completion refresh
- Preview: el-dialog large modal with document content
- Mock: 5-8 documents across all statuses

### Q&A Page (`/qa`)
- Layout: top-bottom split
- Top section: prompt input (ArtForm search bar style) + group selector + "提问" button
- Bottom section: conversation display — user question card + AI answer card + CitationList
- CitationList: el-card per citation (file name, score, snippet, chunk metadata)
- Insufficient evidence: clear "证据不足" message in answer card
- Mock: 2-3 Q&A pairs with citations

### Assistant Chat (`/assistant`)
- Layout: two-column (session list | chat panel with bottom composer)
- Left column: session list — create, rename, delete; each shows name + timestamp
- Right: chat panel — message bubbles (top) + composer (bottom: input + group selector + KB_SEARCH toggle + send button), SSE streaming renders tokens incrementally
- SSE streaming via `useSSEStream` composable
- KB_SEARCH mode: CHAT (pure conversation) vs KB_SEARCH (knowledge base retrieval before answering)
- noKeepAlive route meta — `onDeactivated` disconnects SSE
- Mock: 3 sessions with conversation history

### Management Overview (`/management/overview`)
- Layout: stats dashboard
- ArtStatsCard row: total users, active users, new registrations
- ArtBarChartCard: registration trend chart
- Mock: sample stats data

### Management Users (`/management/users`)
- Layout: ArtTable + ArtForm search bar
- Columns: username, displayName, email, status, created date, actions
- Detail page: `/management/users/:userId` — el-descriptions + status toggle
- Mock: 8-10 user records

## Composables

### useSSEStream
- Wraps native `fetch` + SSE `\n\n` event parsing
- Returns `{ data, error, isStreaming, start(url, params), stop() }`
- Handles connection lifecycle, event parsing, cleanup on unmount/deactivate

### useResumableUpload
- Manages chunk upload state machine: init → chunk upload → status polling → completion
- Returns `{ progress, status, startUpload(file, groupId), retry(), cancel() }`
- Progress tracking per file, chunk-level retry on failure

### useGroupContext
- Provides `currentGroupId`, group selector, auto-redirect when no group selected
- Reactive binding to group store

## State Management (Pinia)

- `store/modules/auth.ts` — JWT token, currentUser (ADMIN/USER role), mustChangePassword, bootstrap/login/logout/changePassword, role-aware landing path; persisted via pinia-plugin-persistedstate
- `store/modules/group.ts` — currentGroupId, ownedGroups, joinedGroups, pendingInvitations; persisted
- Coexists with art-design-pro's existing stores (user, menu, setting, worktab, table)

## API Layer

- Adapt art-design-pro's `src/utils/http/` Axios wrapper for DD_Rag's auth pattern
- Key adaptation: `Authorization: Bearer` header injection only; refresh token via HttpOnly cookie (browser-managed, not localStorage)
- Port 6 API modules: auth, group, document, qa, assistant, admin-user
- Port TypeScript types from DD_Rag frontend

## Verification Flow

1. **Design phase**: Each page created with mock data, verified via `/browse`
2. **API phase**: After all designs confirmed, connect to backend APIs via ported modules
3. **Integration phase**: End-to-end testing with real backend data