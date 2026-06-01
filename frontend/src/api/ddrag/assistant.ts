import type {
  AssistantSessionListItem, AssistantSessionDetail,
  AssistantConversationContext, AssistantChatResult,
  AssistantChatStreamEvent, AssistantChatPayload,
} from '@/types/ddrag'
import { ddragGet, ddragPost, ddragPatch, ddragDelete } from '@/utils/http/ddrag'
import { useDdragAuthStore } from '@/store/modules/ddrag-auth'

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

export async function sendAssistantMessage(payload: AssistantChatPayload): Promise<AssistantChatResult> {
  return ddragPost<AssistantChatResult>('/assistant/chat', payload)
}

export async function streamAssistantMessage(
  payload: AssistantChatPayload,
  handlers: {
    onEvent: (event: AssistantChatStreamEvent) => void
    signal?: AbortSignal
  },
): Promise<void> {
  const authStore = useDdragAuthStore()
  const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

  const response = await fetch(`${baseUrl}/assistant/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authStore.accessToken}`,
    },
    body: JSON.stringify(payload),
    signal: handlers.signal,
  })

  if (!response.ok || response.body == null) {
    const message = await response.text()
    throw new Error(message || '发送流式消息失败')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let separatorIndex = buffer.indexOf('\n\n')
    while (separatorIndex >= 0) {
      const rawEvent = buffer.slice(0, separatorIndex)
      buffer = buffer.slice(separatorIndex + 2)
      const parsed = parseSseEvent(rawEvent)
      if (parsed !== null) handlers.onEvent(parsed)
      separatorIndex = buffer.indexOf('\n\n')
    }
  }
}

function parseSseEvent(rawEvent: string): AssistantChatStreamEvent | null {
  const lines = rawEvent.split(/\r?\n/)
  let eventName = ''
  const dataLines: string[] = []

  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim()
      continue
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim())
    }
  }

  if (dataLines.length === 0) return null

  const parsed = JSON.parse(dataLines.join('\n')) as AssistantChatStreamEvent
  return { ...parsed, event: (eventName || parsed.event) as AssistantChatStreamEvent['event'] }
}