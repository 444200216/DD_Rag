## ADDED Requirements

### Requirement: Admin overview dashboard
The system SHALL provide an admin overview page at `/admin/overview` accessible only to ADMIN role users, displaying system statistics.

#### Scenario: View admin dashboard
- **WHEN** an ADMIN user navigates to `/admin/overview`
- **THEN** the system displays a dashboard with user account statistics (total users, recent registrations) using ArtStatsCard and ArtBarChartCard components

#### Scenario: Non-admin access blocked
- **WHEN** a USER role user attempts to access `/admin/overview`
- **THEN** the route guard redirects the user to `/groups`

### Requirement: Admin user management
The system SHALL provide admin user list and detail pages for managing user accounts.

#### Scenario: View user list
- **WHEN** an ADMIN navigates to `/admin/users`
- **THEN** the system calls `GET /api/admin/users` and displays users in an ArtTable with columns: username, displayName, email, status, creation date, and action buttons

#### Scenario: View user detail
- **WHEN** an ADMIN clicks on a user row
- **THEN** the system navigates to `/admin/users/:userId` and displays the user's full profile and status history

#### Scenario: Update user status
- **WHEN** an ADMIN changes a user's status (e.g., disable/enable account)
- **THEN** the system calls `PUT /api/admin/users/{id}/status` with the new status and updates the user list