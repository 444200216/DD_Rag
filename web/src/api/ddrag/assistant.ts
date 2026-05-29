import type {
  AssistantSessionListItem, AssistantSessionDetail,
  AssistantConversationContext, AssistantChatResult,
} from '@/types/ddrag'
import { ddragGet, ddragPost, ddragPatch, ddragDelete } from '@/utils/http/ddrag'

export async function createAssistantSession(): Promise<AssistantSessionDetail> {
  return ddragPost<AssistantSessionDetail>('/assistant/sessions')
}

export async function fetchAssistantSessions(): Promise<AssistantSessionListItem[]> {
  return ddragGet<AssistantSessionListItem[]>('/assistant/sessions')
}

export async function fetchAssistantSessionDetail(sessionId: number): Promise<AssistantSessionDetail> {
  return ddragGet<AssistantSessionDetail>(`/assistant/sessions/${sessionId}`)
}

export async function renameAssistantSession(sessionId: number, title: string): Promise<AssistantSessionDetail> {
  return ddragPatch<AssistantSessionDetail>(`/assistant/sessions/${sessionId}`, { title })
}

export async function deleteAssistantSession(sessionId: number): Promise<void> {
  await ddragDelete<void>(`/assistant/sessions/${sessionId}`)
}

export async function fetchAssistantConversationContext(sessionId: number): Promise<AssistantConversationContext> {
  return ddragGet<AssistantConversationContext>(`/assistant/sessions/${sessionId}/context`)
}

export async function sendAssistantMessage(payload: import('@/types/ddrag').AssistantChatPayload): Promise<AssistantChatResult> {
  return ddragPost<AssistantChatResult>('/assistant/chat', payload)
}