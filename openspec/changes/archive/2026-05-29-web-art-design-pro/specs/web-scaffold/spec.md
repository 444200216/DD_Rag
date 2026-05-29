## ADDED Requirements

### Requirement: Web directory scaffolded from art-design-pro
The system SHALL provide a `web/` directory in the DD_Rag project root, containing a clean frontend application scaffolded from art-design-pro with all demo content removed.

#### Scenario: Clean scaffold creation
- **WHEN** `pnpm clean:dev` is executed inside the `web/` directory
- **THEN** all demo views, mock data, example routes, and placeholder pages are removed, leaving only the layout system, component library, routing infrastructure, theme engine, and core configuration

#### Scenario: Base configuration for DD_Rag
- **WHEN** the scaffold is created
- **THEN** the system SHALL configure: app name as "DD_Rag 知识助手", default theme color, Vite dev proxy targeting `localhost:8081` via `/api`, and the base route redirecting to `/groups`

#### Scenario: Existing frontend preserved
- **WHEN** the `web/` directory is created
- **THEN** the existing `frontend/` directory MUST remain untouched and functional

### Requirement: Vite dev proxy connects to DD_Rag backend
The system SHALL configure Vite's dev server proxy to forward `/api` requests to the DD_Rag backend at `localhost:8081`.

#### Scenario: API proxy configuration
- **WHEN** the dev server starts
- **THEN** all HTTP requests to `/api/*` are proxied to `http://localhost:8081/api/*` with cookie forwarding enabled

#### Scenario: Environment variable override
- **WHEN** `VITE_DEV_PROXY_TARGET` environment variable is set
- **THEN** the proxy target is overridden to the specified URL instead of the default `localhost:8081`