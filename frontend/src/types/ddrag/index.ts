// Auth types
export type SystemRole = 'ADMIN' | 'USER'

export type UserStatus = 'ACTIVE' | 'DISABLED'

export interface CurrentUserProfile {
  userId: number
  userCode: string
  username: string
  displayName: string
  email: string
  systemRole: SystemRole
  status: UserStatus
  mustChangePassword: boolean
  lastLoginAt: string | null
}

export interface AuthSessionResponse {
  accessToken: string
  currentUser: CurrentUserProfile
}

export interface LoginPayload {
  loginId: string
  password: string
}

export interface RegisterPayload {
  username: string
  email: string
  displayName: string
  password: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface UpdateProfilePayload {
  displayName: string
  email: string
}

// Group types
export interface GroupItem {
  groupId: number
  groupCode: string
  groupName: string
}

export interface PendingInvitationItem {
  invitationId: number
  groupId: number
  groupName: string
  inviterUserId: number
  inviterDisplayName: string
  status: string
}

export interface GroupQueryResult {
  ownedGroups: GroupItem[]
  joinedGroups: GroupItem[]
  pendingInvitations: PendingInvitationItem[]
}

export interface CreateGroupPayload {
  name: string
  description?: string
}

export interface GroupMemberItem {
  userId: number
  userCode: string
  displayName: string
  role: string
}

export interface UserLookupResult {
  userId: number
  userCode: string
  displayName: string
}

export interface OwnerJoinRequestItem {
  requestId: number
  groupId: number
  applicantUserId: number
  applicantUserCode: string
  applicantDisplayName: string
  status: string
  createdAt: string
}

// Document types
export type DocumentGroupRelation = 'OWNER' | 'MEMBER'

export interface DocumentListQuery {
  groupId?: number
  groupRelation?: DocumentGroupRelation
  fileName?: string
  status?: string
}

export interface DocumentItem {
  documentId: number
  groupId: number
  fileName: string
  fileExt: string | null
  contentType: string | null
  fileSize: number
  status: string
  failureReason: string | null
  uploadedAt: string
  uploaderUserId: number | null
  uploaderDisplayName: string | null
}

export interface DocumentPreview {
  documentId: number
  groupId: number
  fileName: string
  previewText: string
  status: string | null
}

// QA types
export interface CitationItem {
  documentId: number | null
  chunkId: number | null
  chunkIndex: number | null
  fileName: string
  score: number
  snippet: string | null
}

export interface AskQuestionPayload {
  groupId: number
  question: string
}

export interface AskQuestionResponse {
  answered: boolean
  answer: string | null
  reasonCode: string | null
  reasonMessage: string | null
  citations: CitationItem[]
}

// Assistant types
export type AssistantToolMode = 'CHAT' | 'KB_SEARCH'
export type AssistantMessageRole = 'USER' | 'ASSISTANT' | 'TOOL'

export interface AssistantCitationItem {
  documentId: number | null
  chunkId: number | null
  chunkIndex: number | null
  fileName: string
  score: number
  snippet: string | null
}

export interface AssistantSessionListItem {
  sessionId: number
  title: string
  lastMessageAt: string | null
}

export interface AssistantSessionDetail {
  sessionId: number
  title: string
  status: string
  lastMessageAt: string | null
  createdAt: string
}

export interface AssistantMessageItem {
  messageId: number
  sessionId: number
  role: AssistantMessageRole
  toolMode: AssistantToolMode | null
  groupId: number | null
  content: string
  structuredPayload: string | null
  createdAt: string
}

export interface AssistantConversationContext {
  summaryText: string | null
  recentMessages: AssistantMessageItem[]
}

export interface AssistantChatPayload {
  sessionId: number
  message: string
  toolMode: AssistantToolMode
  groupId?: number | null
}

export interface AssistantChatResult {
  sessionId: number
  messageId: number
  reply: string
  toolMode: AssistantToolMode
  groupId: number | null
  citations: AssistantCitationItem[]
}

export interface AssistantChatStreamEvent {
  event: 'start' | 'delta' | 'done' | 'error'
  sessionId: number
  toolMode: AssistantToolMode
  groupId: number | null
  delta: string | null
  messageId: number | null
  reply: string | null
  citations: AssistantCitationItem[]
  error: string | null
}

// Admin types
export interface AdminUserItem {
  userId: number
  userCode: string
  username: string
  email: string
  displayName: string
  systemRole: SystemRole
  status: UserStatus
  mustChangePassword: boolean
  lastLoginAt: string | null
}