import type {
  AssistantSessionListItem, AssistantSessionDetail,
  AssistantConversationContext, AssistantMessageItem,
  AssistantChatPayload, AssistantChatResult,
} from '@/types/ddrag'

const mockSessions: AssistantSessionListItem[] = [
  { sessionId: 1, title: '关于产品需求的问题', lastMessageAt: '2026-05-28T14:30:00' },
  { sessionId: 2, title: '技术架构讨论', lastMessageAt: '2026-05-27T10:00:00' },
  { sessionId: 3, title: '新会话', lastMessageAt: null },
]

export async function createAssistantSession(): Promise<AssistantSessionDetail> {
  await delay(200)
  return {
    sessionId: 100 + Math.floor(Math.random() * 900),
    title: '新会话',
    status: 'ACTIVE',
    lastMessageAt: null,
    createdAt: new Date().toISOString(),
  }
}

export async function fetchAssistantSessions(): Promise<AssistantSessionListItem[]> {
  await delay(200)
  return mockSessions
}

export async function fetchAssistantSessionDetail(sessionId: number): Promise<AssistantSessionDetail> {
  await delay(200)
  const session = mockSessions.find((s) => s.sessionId === sessionId)
  return {
    sessionId,
    title: session?.title ?? '会话',
    status: 'ACTIVE',
    lastMessageAt: session?.lastMessageAt ?? null,
    createdAt: '2026-05-25T10:00:00',
  }
}

export async function renameAssistantSession(sessionId: number, title: string): Promise<AssistantSessionDetail> {
  await delay(200)
  return { sessionId, title, status: 'ACTIVE', lastMessageAt: '2026-05-28T14:30:00', createdAt: '2026-05-25T10:00:00' }
}

export async function deleteAssistantSession(_sessionId: number): Promise<void> {
  await delay(200)
}

export async function fetchAssistantConversationContext(sessionId: number): Promise<AssistantConversationContext> {
  await delay(200)
  const mockMessages: AssistantMessageItem[] = [
    { messageId: 1, sessionId, role: 'USER', toolMode: 'CHAT', groupId: 1, content: '产品需求文档中提到了哪些核心功能？', structuredPayload: null, createdAt: '2026-05-28T14:00:00' },
    { messageId: 2, sessionId, role: 'ASSISTANT', toolMode: 'CHAT', groupId: 1, content: '根据知识库中的文档，核心功能包括：\n1. 组级知识管理\n2. 文档上传与智能切分\n3. 混合检索问答\n4. 多轮对话助手', structuredPayload: null, createdAt: '2026-05-28T14:01:00' },
  ]
  return { summaryText: '讨论了产品需求文档中的核心功能', recentMessages: mockMessages }
}

export async function sendAssistantMessage(payload: AssistantChatPayload): Promise<AssistantChatResult> {
  await delay(1000)
  return {
    sessionId: payload.sessionId,
    messageId: 50 + Math.floor(Math.random() * 50),
    reply: `基于知识库的分析，关于"${payload.message}"：\n\n系统采用混合检索策略，结合语义和关键词检索来提高准确率。所有操作在组级隔离范围内进行。`,
    toolMode: payload.toolMode,
    groupId: payload.groupId ?? 1,
    citations: [],
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}