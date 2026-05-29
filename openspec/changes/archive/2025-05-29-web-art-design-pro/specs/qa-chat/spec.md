## ADDED Requirements

### Requirement: Single-turn QA page
The system SHALL provide a single-turn Q&A page at `/qa` scoped to the current group, where users ask a question and receive an evidence-backed answer with citations.

#### Scenario: Ask a question
- **WHEN** a user enters a question in the prompt input (ArtForm) and submits
- **THEN** the system calls `POST /api/qa/ask` with `{ groupId, question }` and displays the answer in a conversation panel

#### Scenario: Display citations
- **WHEN** the QA response includes citation chunks
- **THEN** the system displays a CitationList component showing each citation with: file name, relevance score, text snippet, and chunk metadata

#### Scenario: No group selected
- **WHEN** a user navigates to `/qa` without a selected group
- **THEN** the system displays a message prompting group selection and disables the question input

#### Scenario: Insufficient evidence refusal
- **WHEN** the QA response indicates insufficient evidence for the question
- **THEN** the system displays the model's refusal message indicating lack of relevant evidence in the knowledge base

### Requirement: QA conversation display
The system SHALL display the Q&A interaction as a conversation thread with the user's question and the system's answer.

#### Scenario: Question-answer pair display
- **WHEN** a QA response is received
- **THEN** the system shows the user's question as a prompt card and the answer as a response card with formatted text and citation references