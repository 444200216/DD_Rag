<template>
  <div class="flex h-full">
    <!-- Session List (Left) -->
    <div class="w-64 border-r border-gray-200 flex flex-col">
      <div class="p-4 border-b border-gray-200">
        <ElButton type="primary" size="small" class="w-full" @click="handleCreateSession">新建会话</ElButton>
      </div>
      <ElScrollbar class="flex-1">
        <div v-for="session in sessions" :key="session.sessionId"
          class="p-3 cursor-pointer hover:bg-blue-50 transition-colors"
          :class="{ 'bg-blue-50': currentSessionId === session.sessionId }"
          @click="selectSession(session.sessionId)">
          <p class="text-sm font-medium truncate">{{ session.title }}</p>
          <p v-if="session.lastMessageAt" class="text-xs text-gray-400 mt-1">{{ formatTime(session.lastMessageAt) }}</p>
        </div>
      </ElScrollbar>
    </div>

    <!-- Chat Panel + Composer (Right) -->
    <div class="flex-1 flex flex-col">
      <!-- No session selected -->
      <div v-if="!currentSessionId" class="flex-1 flex items-center justify-center text-gray-400">
        <p>选择或创建一个会话开始对话</p>
      </div>

      <template v-else>
        <!-- Chat Messages -->
        <ElScrollbar class="flex-1 p-6" ref="chatScrollbar">
          <div v-for="msg in messages" :key="msg.messageId" class="mb-6">
            <div v-if="msg.role === 'USER'" class="flex justify-end">
              <div class="bg-blue-50 rounded-lg p-3 max-w-[70%]">
                <p class="text-blue-800">{{ msg.content }}</p>
              </div>
            </div>
            <div v-if="msg.role === 'ASSISTANT'" class="flex justify-start">
              <div class="bg-gray-50 rounded-lg p-3 max-w-[70%]">
                <p class="whitespace-pre-wrap">{{ msg.content }}</p>
              </div>
            </div>
          </div>
        </ElScrollbar>

        <!-- Composer (Bottom) -->
        <div class="p-4 border-t border-gray-200 flex items-center gap-3">
          <GroupSelector />
          <div class="flex items-center gap-2 mr-2">
            <span class="text-xs text-gray-500">模式:</span>
            <ElSwitch
              v-model="kbSearchMode"
              active-text="KB_SEARCH"
              inactive-text="CHAT"
              active-color="#5D87FF"
            />
          </div>
          <ElInput
            v-model="inputMessage"
            placeholder="输入消息..."
            @keyup.enter="handleSendMessage"
            class="flex-1"
          />
          <ElButton type="primary" @click="handleSendMessage" :loading="sending" :disabled="!inputMessage.trim()">发送</ElButton>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useDdragGroupStore } from '@/store/modules/ddrag-group'
import {
  fetchAssistantSessions, createAssistantSession,
  fetchAssistantConversationContext,
  sendAssistantMessage,
} from '@/api/ddrag/assistant'
import GroupSelector from '../groups/components/GroupSelector.vue'
import type { AssistantSessionListItem, AssistantMessageItem, AssistantToolMode } from '@/types/ddrag'

defineOptions({ name: 'DdragAssistant' })

const groupStore = useDdragGroupStore()
const sessions = ref<AssistantSessionListItem[]>([])
const currentSessionId = ref<number | null>(null)
const messages = ref<AssistantMessageItem[]>([])
const inputMessage = ref('')
const sending = ref(false)
const kbSearchMode = ref(false)
const chatScrollbar = ref()

onMounted(async () => {
  sessions.value = await fetchAssistantSessions()
})

const selectSession = async (sessionId: number) => {
  currentSessionId.value = sessionId
  const context = await fetchAssistantConversationContext(sessionId)
  messages.value = context.recentMessages
  scrollToBottom()
}

const handleCreateSession = async () => {
  const session = await createAssistantSession()
  sessions.value.unshift({ sessionId: session.sessionId, title: session.title, lastMessageAt: null })
  currentSessionId.value = session.sessionId
  messages.value = []
}

const handleSendMessage = async () => {
  if (!inputMessage.value.trim() || !currentSessionId) return
  sending.value = true
  const toolMode: AssistantToolMode = kbSearchMode.value ? 'KB_SEARCH' : 'CHAT'

  // Add user message to display
  messages.value.push({
    messageId: Date.now(),
    sessionId: currentSessionId.value!,
    role: 'USER',
    toolMode,
    groupId: groupStore.currentGroupId,
    content: inputMessage.value.trim(),
    structuredPayload: null,
    createdAt: new Date().toISOString(),
  })
  scrollToBottom()

  try {
    const result = await sendAssistantMessage({
      sessionId: currentSessionId.value!,
      message: inputMessage.value.trim(),
      toolMode,
      groupId: groupStore.currentGroupId,
    })

    messages.value.push({
      messageId: result.messageId,
      sessionId: result.sessionId,
      role: 'ASSISTANT',
      toolMode: result.toolMode,
      groupId: result.groupId,
      content: result.reply,
      structuredPayload: null,
      createdAt: new Date().toISOString(),
    })
    inputMessage.value = ''
    scrollToBottom()
  } finally {
    sending.value = false
  }
}

const scrollToBottom = () => {
  setTimeout(() => { chatScrollbar.value?.setScrollTop(99999) }, 100)
}

const formatTime = (iso: string) => new Date(iso).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
</script>