## ADDED Requirements

### Requirement: Login page with DD_Rag auth API
The system SHALL provide a login page at `/auth/login` using art-design-pro's auth layout with DD_Rag's authentication API integration.

#### Scenario: Successful login
- **WHEN** a user enters valid username and password and submits
- **THEN** the system calls `POST /api/auth/login` with the credentials, stores the JWT access token in the auth store, and redirects to the user's landing page (`/groups` for USER role, `/admin/overview` for ADMIN role)

#### Scenario: Login failure
- **WHEN** a user enters invalid credentials
- **THEN** the system displays an error message from the API response and does not redirect

#### Scenario: Password reset request
- **WHEN** a user clicks the "忘记密码" link on the login page
- **THEN** the system navigates to `/auth/forget-password` (placeholder page, backend endpoint is TODO per CLAUDE.md known pitfalls)

### Requirement: Register page
The system SHALL provide a registration page at `/auth/register` using art-design-pro's auth layout.

#### Scenario: Successful registration
- **WHEN** a user fills in username, email, displayName, and password (min 8 chars, must contain alpha + digit) and submits
- **THEN** the system calls `POST /api/auth/register` and on success redirects to `/auth/login`

#### Scenario: Registration validation failure
- **WHEN** a user submits with invalid data (e.g., password too short, missing required fields)
- **THEN** the system displays inline validation errors without making an API call

### Requirement: Account security page with password change
The system SHALL provide a password change page at `/account/security` for authenticated users, and MUST enforce it when `mustChangePassword` flag is true.

#### Scenario: Mandatory password change
- **WHEN** the auth store indicates `mustChangePassword` is true
- **THEN** the route guard redirects the user to `/account/security` and prevents navigation to any other page until the password is changed

#### Scenario: Successful password change
- **WHEN** an authenticated user enters current password and new password (min 8 chars, alpha + digit) and submits
- **THEN** the system calls `POST /api/account/change-password`, clears the `mustChangePassword` flag, and redirects to the user's landing page