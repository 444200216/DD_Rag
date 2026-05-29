## ADDED Requirements

### Requirement: Document list page with filters
The system SHALL provide a document management page at `/documents` scoped to the current group, displaying documents in an ArtTable with status filtering and search.

#### Scenario: View documents in current group
- **WHEN** a user navigates to `/documents` with a selected group
- **THEN** the system calls `GET /api/documents?groupId={currentGroupId}` and displays documents in an ArtTable with columns: filename, upload time, status (PENDING/PROCESSING/COMPLETED/FAILED), and actions

#### Scenario: Filter by document status
- **WHEN** a user selects a status filter (PENDING, PROCESSING, COMPLETED, FAILED) using an ArtForm search bar
- **THEN** the document list is filtered to show only documents matching the selected status

#### Scenario: No group selected
- **WHEN** a user navigates to `/documents` without a selected group
- **THEN** the system displays a message prompting the user to select a group first, and does not make an API call

### Requirement: Document upload with resumable chunk support
The system SHALL support document upload with resumable chunk upload, progress display, and completion handling via the `useResumableUpload` composable.

#### Scenario: Upload a new document
- **WHEN** a user selects a file and clicks "上传"
- **THEN** the system initializes resumable upload (`POST /api/documents/upload/init`), uploads chunks sequentially, and displays progress percentage per file

#### Scenario: Large file chunk upload
- **WHEN** a file exceeds the single-upload threshold
- **THEN** the system splits the file into chunks, uploads each chunk via `POST /api/documents/upload/chunk`, and tracks cumulative progress

#### Scenario: Upload completion triggers ingestion
- **WHEN** all chunks are uploaded successfully
- **THEN** the system calls the completion endpoint and the document status transitions to PROCESSING, triggering async ETL ingestion

#### Scenario: Upload retry on failure
- **WHEN** a chunk upload fails
- **THEN** the system displays an error and provides a "重试" button that restarts the upload from the failed chunk

### Requirement: Document preview
The system SHALL allow users to preview document content in a modal or drawer.

#### Scenario: Preview a completed document
- **WHEN** a user clicks "预览" on a COMPLETED document
- **THEN** the system calls `GET /api/documents/{id}/preview` and displays the document content in a modal

### Requirement: Document deletion
The system SHALL allow owners and the document uploader to delete documents.

#### Scenario: Delete a document
- **WHEN** a user clicks "删除" on a document and confirms the deletion
- **THEN** the system calls `DELETE /api/documents/{id}` and removes the document from the list

### Requirement: Document ingestion status refresh
The system SHALL allow users to manually refresh the document list to check ingestion progress.

#### Scenario: Refresh document status
- **WHEN** a user clicks the "刷新" button on the document page
- **THEN** the system re-fetches the document list and updates status display (PROCESSING → COMPLETED or FAILED)