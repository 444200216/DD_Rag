## 1. Scaffold Setup

- [x] 1.1 Copy art-design-pro project to `web/` directory in DD_Rag root (保留 demo 数据，后续单独清理)
- [x] 1.2 Configure DD_Rag branding: app name "知识助手", theme color, default route `/groups`
- [x] 1.3 Configure Vite dev proxy: `/api` → `localhost:8081` with cookie forwarding and `VITE_DEV_PROXY_TARGET` env override
- [x] 1.4 Verify scaffold runs: `pnpm dev` starts, layout shell renders correctly

## 2. API Layer Porting

- [x] 2.1 Adapt art-design-pro's `src/utils/http/` to DD_Rag's auth pattern: `Authorization: Bearer` header injection, HttpOnly refresh cookie (not localStorage for refresh token)
- [x] 2.2 Port `api/auth.ts` — login, register, refresh, logout, fetchCurrentUser, changePassword, resetPasswordByIdentity
- [x] 2.3 Port `api/group.ts` — fetchGroups, CRUD groups, invitations, join requests, members
- [x] 2.4 Port `api/document.ts` — fetchDocuments, upload init/chunk/complete, preview, delete, retry
- [x] 2.5 Port `api/qa.ts` — askQuestion (single-turn Q&A)
- [x] 2.6 Port `api/assistant.ts` — session CRUD, chat (SSE streaming endpoint URL only), context fetch
- [x] 2.7 Port `api/admin-user.ts` — fetchAdminUsers, fetchAdminUserDetail, updateAdminUserStatus
- [x] 2.8 Port TypeScript types from `frontend/src/types/assistant.ts` and inline types from API modules into `web/src/types/`

## 3. State Management

- [x] 3.1 Create `store/modules/auth.ts` — JWT access token, currentUser with system role (ADMIN/USER), mustChangePassword flag, bootstrap/login/logout/changePassword actions, role-aware landing path resolution; persisted with pinia-plugin-persistedstate
- [x] 3.2 Create `store/modules/group.ts` — currentGroupId, ownedGroups, joinedGroups, pendingInvitations, group selection/update actions; persisted
- [x] 3.3 Verify stores integrate with art-design-pro's existing store system (no conflicts with user/menu/setting/worktab stores)

## 4. Routing & Guards

- [x] 4.1 Create `router/modules/ddrag.ts` with all DD_Rag business routes (groups, documents, qa, assistant, admin pages)
- [x] 4.2 Add ddrag module to `router/modules/index.ts` exports
- [x] 4.3 Update `router/routes/staticRoutes.ts`: `/auth/login`, `/auth/register`, `/account/security`
- [x] 4.4 Implement USER/ADMIN role guard in `router/core/beforeEach.ts`: unauthenticated → login, ADMIN on business → `/admin/overview`, USER on admin → `/groups`
- [x] 4.5 Implement mustChangePassword guard: force redirect to `/account/security` when flag is true
- [x] 4.6 Mark assistant route with `meta: { noKeepAlive: true }` to prevent stale SSE connections
- [x] 4.7 Verify routing: all routes accessible, guards enforce role boundaries correctly

## 5. Composables

- [x] 5.1 Create `hooks/useSSEStream.ts` — composable wrapping native fetch + SSE parsing, returns `{ data, error, isStreaming, start, stop }`, handles `\n\n` event delimiters and cleanup
- [x] 5.2 Create `hooks/useResumableUpload.ts` — composable for chunk upload lifecycle, returns `{ progress, status, startUpload, retry, cancel }`, manages init → chunk upload → polling → completion state machine
- [x] 5.3 Create `hooks/useGroupContext.ts` — composable that provides `currentGroupId`, group selector, and auto-redirect when no group is selected

## 6. Auth Pages (Design First → Verify via /browse)

- [x] 6.1 Create `/auth/login` page using art-design-pro's auth layout + Element Plus el-form (username + password), with "忘记密码" link
- [x] 6.2 Create `/auth/register` page with el-form (username, email, displayName, password) and validation rules
- [x] 6.3 Create `/account/security` page with password change form (current password + new password + confirm)
- [x] 6.4 Verify auth pages via /browse: layout, form validation, error display, navigation links

## 7. Groups Workspace (Design First → Verify via /browse)

- [x] 7.1 Create `/groups` page with owned/joined groups ArtTable, pending invitations section
- [x] 7.2 Create group creation ArtForm dialog (name + description)
- [x] 7.3 Create group detail panel/drawer: member list, invitation sender, join request handler
- [x] 7.4 Create group selector component (for use in other pages)
- [x] 7.5 Verify groups page via /browse: table layout, detail panel, group selector

## 8. Document Management (Design First → Verify via /browse)

- [x] 8.1 Create `/documents` page with ArtTable (filename, upload time, status, actions) + ArtForm search bar for status filtering
- [x] 8.2 Integrate `useResumableUpload` composable: upload button, progress bar per file, retry button on failure
- [x] 8.3 Create document preview drawer/modal
- [x] 8.4 Create document delete confirmation dialog
- [x] 8.5 Create "刷新" button for re-fetching document list and checking ingestion status
- [x] 8.6 Verify documents page via /browse: table, upload flow, preview, filter

## 9. QA Page (Design First → Verify via /browse)

- [x] 9.1 Create `/qa` page with prompt input (ArtForm) and conversation display panel
- [x] 9.2 Create CitationList component displaying citation cards (file name, score, snippet)
- [x] 9.3 Create insufficient-evidence refusal message display
- [x] 9.4 Verify QA page via /browse: prompt input, answer display, citation cards

## 10. Assistant Chat (Design First → Verify via /browse)

- [x] 10.1 Create `/assistant` page with session list sidebar (ArtSidebarMenu pattern) + chat panel + composer
- [x] 10.2 Integrate `useSSEStream` composable for real-time response streaming in chat panel
- [x] 10.3 Create KB_SEARCH tool mode toggle in composer
- [x] 10.4 Create session management actions: create, rename, delete
- [x] 10.5 Implement `onDeactivated` cleanup for SSE connections (no keepAlive)
- [x] 10.6 Verify assistant page via /browse: session list, streaming chat, tool mode toggle

## 11. Admin Pages (Design First → Verify via /browse)

- [x] 11.1 Create `/admin/overview` page with ArtStatsCard + ArtBarChartCard for user statistics
- [x] 11.2 Create `/admin/users` page with ArtTable (user list with status, actions)
- [x] 11.3 Create `/admin/users/:userId` detail page with user profile and status management
- [x] 11.4 Verify admin pages via /browse: dashboard, user table, detail page

## 12. API Integration (After Design Verification)

- [x] 12.1 Connect auth pages to `api/auth.ts` endpoints (login, register, changePassword)
- [x] 12.2 Connect groups page to `api/group.ts` endpoints (fetchGroups, CRUD, invitations, join requests)
- [x] 12.3 Connect documents page to `api/document.ts` endpoints (fetch, upload, preview, delete)
- [x] 12.4 Connect QA page to `api/qa.ts` endpoint (askQuestion)
- [x] 12.5 Connect assistant page to `api/assistant.ts` endpoints (session CRUD, SSE chat stream, context)
- [x] 12.6 Connect admin pages to `api/admin-user.ts` endpoints (fetchUsers, detail, updateStatus)

## 13. Sidebar Navigation & Layout Polish

- [x] 13.1 Update ArtSidebarMenu items: Groups, Documents, QA, Assistant (USER); Overview, Users (ADMIN)
- [x] 13.2 Configure default menu layout mode (LEFT sidebar) and theme settings for DD_Rag
- [x] 13.3 Remove any remaining art-design-pro demo references from config and menu store defaults
- [x] 13.4 Verify full navigation flow: sidebar → work tabs → page content → group context propagation