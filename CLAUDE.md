# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DD_Rag is a group-scoped knowledge assistant RAG system (组级知识助手). Users create/join groups, upload documents, and perform evidence-backed QA within their group scope. An Assistant mode supports multi-turn ReAct Agent conversations that can call KB_SEARCH as a tool.

## Build & Run Commands

### Local Run (without Docker backend)
```bash
# Prerequisites: PostgreSQL (pgvector) running in Docker as pgvector-db on localhost:5432
# MinIO is a remote server at https://a6-minio.abupdate.com (configured in application-dev.yml)
# Elasticsearch running in Docker on localhost:9200
mvn spring-boot:run                     # run locally (dev profile, port 8081)
mvn -q -Dmaven.test.skip=true spring-boot:run  # skip tests
mvn package                              # build jar
```

### Key ports
Backend: 8081 (local dev) | Frontend: 5174 | PostgreSQL: 5432 (Docker pgvector-db) | Elasticsearch: 9200 (Docker) | MinIO: remote server (not local)

### Local dependency services
- **PostgreSQL**: Docker container `pgvector-db` (pgvector/pgvector:pg17), port 5432, database `dd_rag`, user/password `postgres/postgres`
- **Elasticsearch**: Docker container with IK plugin, port 9200
- **MinIO**: Remote server at `https://a6-minio.abupdate.com`, access-key `skillhub`, secret-key `skillhub`, bucket `skillhub`

## Required Environment

`DASHSCOPE_API_KEY` must be set (or configured in `application-dev.yml`). Chat model: DashScope `glm-5.1`. Embedding: DashScope `text-embedding-v4` (1024 dimensions). Ollama embedding is an alternative (commented out in dev config).

No test suite exists yet — only Flyway seed data (V3).

## Architecture

### Dual Role Boundary (critical to preserve)
- **System roles**: ADMIN / USER — `CurrentUserService.requireSystemAdmin()` vs `requireBusinessUser()` enforce access boundaries. ADMIN cannot access business endpoints; USER cannot access admin endpoints.
- **Group roles**: OWNER / MEMBER — within a group context only.
- **GroupId is the isolation key**: All document, QA, retrieval, and vector/ES queries filter by `groupId` to prevent cross-group data leakage. This must be preserved from API entry to query filters.

### No Spring Security Chain
Authentication is custom: `JwtAuthenticationFilter` (OncePerRequestFilter) + cookie-based refresh tokens. Only `spring-security-crypto` (BCrypt) is used, not Spring Security's full auto-configuration.

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
PgVector semantic retrieval + Elasticsearch BM25 keyword retrieval + RRF (Reciprocal Rank Fusion) merge. Evidence-level gating: model refuses to answer when retrieved chunks lack sufficient evidence.

### Assistant KB_SEARCH is a Spring AI Tool
`AssistantKnowledgeBaseTool` is registered as a `@Tool` callable by `ReactAgent` — it reuses the QA retrieval pipeline. It is NOT a hardcoded service branch.

### Short-term Memory Only
Long-term memory tables were dropped (V12 migration). `AssistantShortTermMemoryHook.beforeModel()` recomposes context from session summaries, not full history dumps.

### DTO/VO Separation
- `model/dto/` — request inputs
- `model/vo/` — response outputs
- `model/entity/` — DB entities (MyBatis-Plus)

### Event-Driven Ingestion
`DocumentIngestionRequestedEvent` + `@Async` listener triggers ETL after upload, keeping the upload API non-blocking.

## Known Pitfalls

1. **ES IK plugin is deployment-critical**: If Elasticsearch lacks the IK analyzer plugin, ingestion and search fail with `ik_max_word tokenizer not found`. Custom Dockerfile at `docker/elasticsearch/Dockerfile` installs it.

2. **PromptTemplate `{variable}` conflict**: Spring AI `PromptTemplate` uses `{var}` syntax, which conflicts with JSON/curly braces in prompt content. Escaping is required when writing `.st` template files.

3. **GroupId isolation must flow end-to-end**: From API controller through service to PgVector/ES queries — never drop the `groupId` filter.

4. **No production Dockerfile**: Docker Compose uses development-mode builds (Maven runs `spring-boot:run` inside container). Production deployment needs a proper multi-stage Dockerfile and Nginx for the frontend.

5. **Stale document recovery**: `StaleProcessingDocumentRecoveryRunner` auto-recovers documents stuck in PROCESSING status on startup.

6. **docs/V5.1 LONG_TERM_MEMORY docs are obsolete**: Long-term memory was removed. Do not reference those design docs as current implementation.

7. **Frontend /auth/reset-password 404**: Frontend calls `/auth/reset-password` for unauthenticated password reset, but the backend has no Controller for this path (only JwtAuthenticationFilter whitelists it). `/account/change-password` (authenticated) works fine. Backend reset-password endpoint is TODO.

## Documentation Map
- `docs/PROJECT_READING_GUIDE.md` — code map and reading route (read first)
- `docs/DEBUG_NOTES.md` — past pitfalls and root causes
- `docs/DEPLOYMENT_RECORD.md` — deployment configs and port mappings
- `docs/VERSION_HISTORY.md` — version evolution
- `docs/V2/` through `docs/V5.1/` — feature design docs per version