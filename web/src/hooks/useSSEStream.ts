import { ref, onUnmounted } from 'vue'
import { useDdragAuthStore } from '@/store/modules/ddrag-auth'

export interface SSEStreamOptions {
  url: string
  body?: Record<string, unknown>
}

export function useSSEStream() {
  const data = ref<string>('')
  const error = ref<string | null>(null)
  const isStreaming = ref(false)

  let abortController: AbortController | null = null

  async function start(options: SSEStreamOptions) {
    data.value = ''
    error.value = null
    isStreaming.value = true
    abortController = new AbortController()

    const authStore = useDdragAuthStore()
    const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')
    try {
      const response = await fetch(`${baseUrl}${options.url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authStore.accessToken ? { Authorization: `Bearer ${authStore.accessToken}` } : {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: abortController.signal,
      })

      if (!response.ok || !response.body) {
        const msg = await response.text()
        throw new Error(msg || 'SSE connection failed')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        let sep = buffer.indexOf('\n\n')
        while (sep >= 0) {
          const rawEvent = buffer.slice(0, sep)
          buffer = buffer.slice(sep + 2)
          const parsed = parseSseEvent(rawEvent)
          if (parsed) data.value += parsed
          sep = buffer.indexOf('\n\n')
        }
      }
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      isStreaming.value = false
      abortController = null
    }
  }

  function stop() {
    abortController?.abort()
    abortController = null
    isStreaming.value = false
  }

  function parseSseEvent(raw: string): string | null {
    const lines = raw.split(/\r?\n/)
    let dataLines: string[] = []
    for (const line of lines) {
      if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
    }
    if (dataLines.length === 0) return null
    try {
      const json = JSON.parse(dataLines.join('\n'))
      if (json.event === 'delta' && json.delta) return json.delta
      if (json.event === 'error') { error.value = json.error; return null }
      return null
    } catch { return null }
  }

  onUnmounted(stop)

  return { data, error, isStreaming, start, stop }
}