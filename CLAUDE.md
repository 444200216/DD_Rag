# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DD_Rag is a group-scoped knowledge assistant RAG system (组级知识助手). Users create/join groups, upload documents, and perform evidence-backed QA within their group scope. An Assistant mode supports multi-turn ReAct Agent conversations that can call KB_SEARCH as a tool.

## Build & Run Commands

### Backend (Spring Boot, port 8081)
```bash
# Prerequisites: PostgreSQL pgvector on localhost:5432, Elasticsearch on localhost:9200
# MinIO defaults to remote server in dev profile; local MinIO available via docker-compose
mvn spring-boot:run                                      # run locally (dev profile, port 8081)
mvn -q -Dmaven.test.skip=true spring-boot:run           # quiet run, skip tests
mvn package                                              # build jar
```

### Frontend — `frontend/` (Element Plus admin UI, pnpm)
```bash
cd frontend
pnpm install
pnpm dev                                                 # dev server (port 3006), proxies /api → localhost:8081
pnpm build                                               # production build
pnpm lint                                                # eslint check
pnpm fix                                                 # eslint --fix
```

The project now has **one frontend directory**: `frontend/` (formerly `web/`). It uses Element Plus + Tailwind + ECharts + pnpm toolchain. It proxies `/api` to the backend.

### Docker Compose (all services)
```bash
docker compose up -d --build                             # start all: PG, ES, MinIO, backend, frontend, elasticvue
docker compose up -d postgres elasticsearch              # start only PG + ES for local dev
docker compose logs -f backend                           # tail backend logs
```
Docker Compose backend runs on port 18080; frontend on 5173. Local dev backend runs on 8081; frontend on 5174.

### Key ports
| Service | Local dev | Docker Compose |
|---------|-----------|----------------|
| Backend | 8081 | 18080 |
| Frontend | 3006 | 5173 |
| PostgreSQL | 5432 | 5432 |
| Elasticsearch | 9200 | 9200 |
| MinIO | remote server | 9000/9001 |
| Elasticvue | — | 8088 |

## Required Environment

`DASHSCOPE_API_KEY` must be set (or configured in `application-dev.yml`). Chat model: DashScope `qwen-doc-turbo`. Embedding: DashScope `text-embedding-v4` (1024 dimensions). Ollama embedding is an alternative (commented out in dev config).

No test suite exists — no `src/test/` directory. Only Flyway seed data (V3).

## Architecture

### Dual Role Boundary (critical to preserve)
- **System roles**: ADMIN / USER — `CurrentUserService.requireSystemAdmin()` vs `requireBusinessUser()` enforce access boundaries. ADMIN cannot access business endpoints; USER cannot access admin endpoints.
- **Group roles**: OWNER / MEMBER — within a group context only.
- **GroupId is the isolation key**: All document, QA, retrieval, and vector/ES queries filter by `groupId` to prevent cross-group data leakage. This must be preserved from API entry to query filters.

### No Spring Security Chain
Authentication is custom: `JwtAuthenticationFilter` (OncePerRequestFilter) + cookie-based refresh tokens. Only `spring-security-crypto` (BCrypt) is used, not Spring Security's full auto-configuration. Whitelisted paths (login, register, refresh, logout, reset-password) bypass the filter via `shouldNotFilter()`.

### Backend Package Structure (under `com.dong.ddrag`)
Each domain module follows Controller/Service/Mapper/Model layering:
- `auth` — JWT access/refresh tokens, BCrypt, dev admin seeding
- `identity` — `CurrentUserService` boundary enforcement
- `user` — account security, admin user management
- `groupmembership` — groups, OWNER/MEMBER, invitations, join requests, approval
- `document` — resumable chunk upload, preview, deletion, async ingestion trigger
- `ingestion` — ETL pipeline: parser factory (PDF/DOCX/MD/TXT via Strategy pattern), chunking, PgVector write, ES index
- `retrieval` — PgVector semantic + ES BM25 keyword retrieval adapters
- `qa` — query planning (DIRECT/REWRITE/DECOMPOSE), hybrid retrieval + RRF fusion, evidence-level gating, ChatClient answer generation
- `assistant` — multi-turn sessions, ReAct Agent via Spring AI Alibaba, KB_SEARCH as callable `@Tool`, short-term memory hook, session summary, streaming chat
- `storage` — MinIO object storage abstraction (ObjectStorageService interface)
- `common` — `ApiResponse<T>` record, enums, BusinessException hierarchy, GlobalExceptionHandler

### RAG Pipeline (hybrid, not simple topK)
`HybridChunkRetrievalService` orchestrates: PgVector semantic retrieval + Elasticsearch BM25 keyword retrieval → RRF (Reciprocal Rank Fusion) merge → same-document chunk clustering with neighbor-window expansion → evidence-level gating. The model refuses to answer when retrieved chunks lack sufficient evidence (`EvidenceLevel` enum).

Key constants: `CHANNEL_TOP_K=50`, `RRF_K=60`, `DEFAULT_NEIGHBOR_WINDOW=1`.

### Assistant KB_SEARCH is a Spring AI Tool
`AssistantKnowledgeBaseTool` is registered as a `@Tool` callable by `ReactAgent` — it reuses the QA retrieval pipeline via `ReadyChunkDocumentRetriever`. It is NOT a hardcoded service branch. The tool prevents duplicate calls per turn via `AssistantKnowledgeBaseToolResultHolder`, forcing the agent to produce a final answer after one KB_SEARCH invocation.

### Short-term Memory Only
Long-term memory tables were dropped (V12 Flyway migration). `AssistantShortTermMemoryHook.beforeModel()` recomposes context from session summaries and recent messages, not full history dumps. Maintenance triggers are configurable via `assistant.short-term-memory.*` properties.

### DTO/VO Separation
- `model/dto/` — request inputs
- `model/vo/` — response outputs
- `model/entity/` — DB entities (MyBatis-Plus)

### Prompt Templates
Located in `src/main/resources/prompts/` with domain subdirectories:
- `qa/` — `system.st`, `user.st`, `rag-context.st`
- `assistant/` — `runtime-compact-summary.st`, `session-compact-summary.st`, `session-memory-update.st`
- `query-planning/` — `user.st`

Spring AI `PromptTemplate` uses `{var}` syntax which conflicts with JSON/curly braces in prompt content. Use `\{` and `\}` escaping in `.st` files.

### Event-Driven Ingestion
`DocumentIngestionRequestedEvent` + `@Async` listener triggers ETL after upload, keeping the upload API non-blocking.

### MyBatis Mapper XML
Located in `src/main/resources/mapper/` with domain subdirectories (`assistant/`, `document/`, `groupmembership/`, `ingestion/`). Mapper interfaces in each domain's `mapper/` Java package map to these XMLs.

### Flyway Migrations
`src/main/resources/db/migration/` — 13 migrations (V1–V13). Key milestones:
- V1: core tables, V3: seed test users/groups, V7: auth productization
- V9: assistant tables, V12: **dropped long-term memory tables** (obsolete)
- V13: document upload support (resumable chunk upload schema)

## Known Pitfalls

1. **ES IK plugin is deployment-critical**: If Elasticsearch lacks the IK analyzer plugin, ingestion and search fail with `ik_max_word tokenizer not found`. Custom Dockerfile at `docker/elasticsearch/Dockerfile` installs it.

2. **PromptTemplate `{variable}` conflict**: Spring AI `PromptTemplate` uses `{var}` syntax, which conflicts with JSON/curly braces in prompt content. Escape with `\{` and `\}` in `.st` template files.

3. **GroupId isolation must flow end-to-end**: From API controller through service to PgVector/ES queries — never drop the `groupId` filter.

4. **No production Dockerfile**: Docker Compose uses development-mode builds (Maven runs `spring-boot:run` inside container). Production deployment needs a proper multi-stage Dockerfile and Nginx for the frontend.

5. **Stale document recovery**: `StaleProcessingDocumentRecoveryRunner` auto-recovers documents stuck in PROCESSING status on startup.

6. **docs/V5.1 LONG_TERM_MEMORY docs are obsolete**: Long-term memory was removed in V12. Do not reference those design docs as current implementation.

7. **Frontend /auth/reset-password 404**: Frontend calls `/api/auth/reset-password` for unauthenticated password reset, but `JwtAuthenticationFilter.shouldNotFilter()` whitelists the path while no Controller handles it. `/account/change-password` (authenticated) works fine. Backend reset-password endpoint is TODO.

8. **Single frontend directory**: `frontend/` (pnpm, Element Plus + Tailwind). The old lightweight `frontend/` (npm, Vue 3 + Pinia) has been removed. The old `web/` directory was renamed to `frontend/`.

9. **Docker Compose MinIO vs dev MinIO**: `application-dev.yml` points to remote MinIO at `https://a6-minio.abupdate.com`, but `docker-compose.yml` runs a local MinIO container with different credentials (`minioadmin/minioadmin`, bucket `dd-rag-documents`). When switching between local dev and Docker Compose, check `STORAGE_MINIO_*` environment variables.

## Frontend Component Standards (frontend/ directory)

All frontend pages and components must follow the patterns established in the "高级表格" (Advanced Table) and "组件总览" (Component Overview) example pages at `frontend/src/views/examples/`. Key rules:

1. **Page layout**: Three-section pattern — ArtSearchBar (search) + ElCard with ArtTableHeader (toolbar) + ArtTable (data). Use `useTableColumns` for column visibility/drag control.
2. **ArtSearchBar select items**: `options` must be at item top-level (not inside `props`). When `item.props` exists, `getProps()` only returns `props` — top-level `options` won't be found by `getProps(item)?.options`, causing empty dropdowns.
3. **Detail views**: Use `ElDrawer` on the same page (like groups page), not a separate route/page. Pattern: `ElDrawer v-model="showDetail" title="xxx详情" size="400px"` with content inside.
4. **Operation buttons**: Use `ArtButtonTable` with custom `icon`, `iconColor`, `buttonBgColor` props for human-friendly icons. Don't rely solely on `type` prop's default icons.
5. **Code display**: Never show raw enum codes (ADMIN, USER, ACTIVE, DISABLED) to users. Always map to Chinese labels (管理员, 普通用户, 正常, 禁用).
6. **Route meta**: Use `isHide: true` (not `hidden: true`) to hide menu items. The sidebar `SidebarSubmenu` checks `item.meta.isHide`.

## Documentation Map
- `docs/PROJECT_READING_GUIDE.md` — code map and reading route (read first)
- `docs/DEBUG_NOTES.md` — past pitfalls and root causes
- `docs/DEPLOYMENT_RECORD.md` — deployment configs and port mappings
- `docs/VERSION_HISTORY.md` — version evolution
- `docs/V2/` through `docs/V5.1/` — feature design docs per version