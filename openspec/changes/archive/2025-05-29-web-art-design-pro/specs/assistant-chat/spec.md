## ADDED Requirements

### Requirement: Multi-turn assistant chat with SSE streaming
The system SHALL provide a multi-turn assistant chat page at `/assistant` with session management, SSE streaming for real-time response display, and KB_SEARCH tool mode.

#### Scenario: Create a new session
- **WHEN** a user clicks "新建会话"
- **THEN** the system calls `POST /api/assistant/sessions` with `{ groupId }` and creates a new chat session, displaying it in the session list sidebar

#### Scenario: Send a message with SSE streaming
- **WHEN** a user sends a message in a session
- **THEN** the system calls `GET /api/assistant/chat/stream` using native `fetch` (not Axios), parses SSE `\n\n` delimited events via the `useSSEStream` composable, and displays the response tokens incrementally in the chat panel

#### Scenario: KB_SEARCH tool mode
- **WHEN** a user toggles the tool mode to KB_SEARCH
- **THEN** the assistant agent uses the KB_SEARCH tool to retrieve relevant chunks from the current group's knowledge base before generating an answer, and the chat panel displays both the tool call results and the final answer

#### Scenario: View session history
- **WHEN** a user selects an existing session from the session list
- **THEN** the system calls `GET /api/assistant/sessions/{id}/context` and displays the full conversation history including tool call results

#### Scenario: Rename a session
- **WHEN** a user clicks "重命名" on a session
- **THEN** the system calls `PUT /api/assistant/sessions/{id}` with the new name and updates the session list

#### Scenario: Delete a session
- **WHEN** a user clicks "删除" on a session and confirms
- **THEN** the system calls `DELETE /api/assistant/sessions/{id}` and removes the session from the list

### Requirement: SSE streaming composable (useSSEStream)
The system SHALL provide a Vue composable `useSSEStream` that encapsulates SSE connection lifecycle, event parsing, and cleanup.

#### Scenario: Start SSE stream
- **WHEN** `start(url, params)` is called
- **THEN** the composable initiates a native `fetch` request to the SSE endpoint, parses `\n\n` delimited events, and emits parsed data through a reactive `data` ref

#### Scenario: Stop SSE stream
- **WHEN** `stop()` is called or the component is unmounted
- **THEN** the composable closes the fetch connection and resets the streaming state

#### Scenario: SSE error handling
- **WHEN** an SSE connection fails or the response stream contains an error event
- **THEN** the composable sets the `error` ref and the `isStreaming` flag to false

### Requirement: Assistant page excludes keepAlive
The assistant chat page MUST NOT be cached by ArtWorkTab's keepAlive to prevent stale SSE connections.

#### Scenario: Tab switch cleanup
- **WHEN** the user switches away from the assistant tab
- **THEN** any active SSE connection is terminated via `onDeactivated` lifecycle hook