## ADDED Requirements

### Requirement: USER/ADMIN dual-role route guards
The system SHALL enforce role-based route access with distinct landing pages and access boundaries for USER and ADMIN system roles.

#### Scenario: Unauthenticated user redirect
- **WHEN** an unauthenticated user attempts to access a route with `requiresAuth: true`
- **THEN** the route guard redirects to `/auth/login` with a `redirect` query parameter preserving the intended destination

#### Scenario: ADMIN user on business route
- **WHEN** an ADMIN role user attempts to access a USER-scoped business route (Groups, Documents, QA, Assistant)
- **THEN** the route guard redirects to `/admin/overview`

#### Scenario: USER role on admin route
- **WHEN** a USER role user attempts to access an ADMIN-scoped route (/admin/*)
- **THEN** the route guard redirects to `/groups`

#### Scenario: Guest-only route enforcement
- **WHEN** an authenticated user attempts to access a `guestOnly` route (login, register)
- **THEN** the route guard redirects to the user's role-appropriate landing page

### Requirement: MustChangePassword enforcement
The system SHALL enforce mandatory password change when the `mustChangePassword` flag is set on the current user.

#### Scenario: MustChangePassword redirect
- **WHEN** a user with `mustChangePassword: true` attempts to navigate to any route other than `/account/security`
- **THEN** the route guard redirects to `/account/security` regardless of the intended destination

#### Scenario: MustChangePassword cleared after change
- **WHEN** a user successfully changes their password on `/account/security`
- **THEN** the `mustChangePassword` flag is cleared in the auth store and the user can navigate freely

### Requirement: DD_Rag route module
The system SHALL provide a `modules/ddrag.ts` route module in art-design-pro's routing system containing all DD_Rag business routes.

#### Scenario: Business route registration
- **WHEN** the dynamic route system processes route modules
- **THEN** the ddrag module registers routes: `/groups` (GroupsPage), `/documents` (DocumentsPage), `/qa` (QaPage), `/assistant` (AssistantPage), `/admin/overview` (AdminOverviewPage), `/admin/users` (AdminUsersPage), `/admin/users/:userId` (AdminUserDetailPage)

#### Scenario: Route meta configuration
- **WHEN** ddrag routes are registered
- **THEN** each route has `meta: { requiresAuth: true, roles: ['USER'] | ['ADMIN'] }` and the assistant route has `meta: { noKeepAlive: true }`