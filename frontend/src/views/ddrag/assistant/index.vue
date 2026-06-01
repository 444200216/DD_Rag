<template>
  <div class="art-full-height flex gap-4" style="flex-direction: row">
    <!-- 左侧：会话面板 -->
    <ElCard shadow="hover" class="w-64 flex flex-col overflow-hidden" style="flex-shrink: 0">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="font-semibold">会话列表</span>
          <ElButton type="primary" size="small" @click="handleCreateSession" v-ripple>新建会话</ElButton>
        </div>
      </template>
      <ElScrollbar class="flex-1">
        <div v-if="sessions.length === 0" class="flex-1 flex items-center justify-start text-g-400 py-8">
          <div class="text-sm px-4">
            <p>这里会保留你的最近会话。</p>
            <p class="mt-1">现在还没有任何记录，先创建一个新会话开始。</p>
          </div>
        </div>
        <div
          v-for="session in sessions"
          :key="session.sessionId"
          class="assistant-session-item"
          :class="{ 'assistant-session-item--active': currentSessionId === session.sessionId }"
          @click="selectSession(session.sessionId)"
        >
          <!-- 重命名模式 -->
          <div v-if="renamingSessionId === session.sessionId" class="flex items-center gap-1">
            <ElInput v-model="renamingTitle" size="small" class="flex-1" @keyup.enter="confirmRename" @keyup.escape="cancelRename" />
            <ElButton size="small" type="primary" @click="confirmRename">确定</ElButton>
          </div>
          <!-- 正常模式 -->
          <div v-else class="flex items-center gap-1">
            <p class="text-sm font-medium truncate flex-1">{{ session.title }}</p>
            <ElIcon
              class="assistant-session-item__action"
              :size="14"
              @click.stop="startRename(session)"
            >
              <EditPen />
            </ElIcon>
            <ElIcon
              class="assistant-session-item__action assistant-session-item__action--danger"
              :size="14"
              @click.stop="handleDeleteSession(session.sessionId)"
            >
              <Close />
            </ElIcon>
          </div>
          <p v-if="session.lastMessageAt" class="text-xs text-g-400 mt-1">{{ formatTime(session.lastMessageAt) }}</p>
        </div>
      </ElScrollbar>
    </ElCard>

    <!-- 右侧：聊天区 -->
    <ElCard shadow="hover" class="flex-1 flex flex-col overflow-hidden assistant-chat-card">
      <template #header>
        <div class="flex-cb">
          <h4 class="m-0">智能助手</h4>
          <ElTag v-if="currentSessionId" type="success" size="small">{{ messages.length }} 条消息</ElTag>
        </div>
      </template>

      <!-- 未选中会话 -->
      <div v-if="!currentSessionId" class="flex-1 flex items-center justify-center text-g-400">
        <div class="text-center">
          <ElIcon :size="48" class="mb-3"><ChatLineSquare /></ElIcon>
          <p>选择或创建一个会话开始对话</p>
        </div>
      </div>

      <template v-else>
        <!-- 空消息 -->
        <div v-if="messages.length === 0 && !streamingReply" class="flex-1 flex items-center justify-center text-g-400">
          <div class="text-center">
            <ElIcon :size="48" class="mb-3"><EditPen /></ElIcon>
            <p>输入消息，开始对话</p>
          </div>
        </div>

        <!-- 消息区 -->
        <ElScrollbar v-else class="flex-1" ref="chatScrollbar">
          <div v-for="msg in messages" :key="msg.messageId" class="px-4 py-2">
            <!-- 用户消息 -->
            <div v-if="msg.role === 'USER'" class="flex justify-end mb-1">
              <div class="assistant-msg assistant-msg--user">
                <p class="assistant-msg__text">{{ msg.content }}</p>
                <p class="assistant-msg__time">{{ formatMsgTime(msg.createdAt) }}</p>
              </div>
            </div>

            <!-- AI回复 -->
            <div v-if="msg.role === 'ASSISTANT'" class="flex justify-start mb-1">
              <div class="assistant-msg assistant-msg--ai">
                <div v-highlight class="markdown-body assistant-msg__md" v-html="renderMarkdown(msg.content)"></div>
                <p class="assistant-msg__time">{{ formatMsgTime(msg.createdAt) }}</p>
              </div>
            </div>
          </div>

          <!-- 流式回复（进行中） -->
          <div v-if="streamingReply" class="px-4 py-2">
            <div class="flex justify-start mb-1">
              <div class="assistant-msg assistant-msg--ai assistant-msg--streaming">
                <div v-highlight class="markdown-body assistant-msg__md" v-html="renderMarkdown(streamingReply)"></div>
                <p class="assistant-msg__streaming-tag">
                  <ElIcon :size="14" class="is-loading"><Loading /></ElIcon>
                  生成中
                </p>
              </div>
            </div>
          </div>
        </ElScrollbar>

        <!-- 底部输入栏 -->
        <div class="assistant-composer">
          <!-- 模式切换 + 知识库 -->
          <div class="assistant-composer__toolbar">
            <ElSegmented v-model="toolMode" :options="modeOptions" size="small" />
            <ElSelect
              v-if="toolMode === 'KB_SEARCH'"
              v-model="selectedGroupId"
              placeholder="选择知识库"
              clearable
              :loading="groupStore.isGroupsLoading"
              size="small"
              class="assistant-composer__group-select"
            >
              <ElOptionGroup v-if="groupStore.ownedGroups.length" label="我拥有的知识库">
                <ElOption v-for="group in groupStore.ownedGroups" :key="group.groupId" :label="group.groupName" :value="group.groupId" />
              </ElOptionGroup>
              <ElOptionGroup v-if="groupStore.joinedGroups.length" label="我加入的知识库">
                <ElOption v-for="group in groupStore.joinedGroups" :key="group.groupId" :label="group.groupName" :value="group.groupId" />
              </ElOptionGroup>
            </ElSelect>
          </div>
          <!-- 输入框 + 按钮 -->
          <div class="flex gap-3 mt-2">
            <ElInput
              v-model="inputMessage"
              placeholder="输入消息..."
              size="large"
              @keyup.enter="handleSendMessage"
              :disabled="streaming"
              class="flex-1"
            />
            <ElButton
              v-if="!streaming"
              type="primary"
              size="large"
              @click="handleSendMessage"
              :disabled="!inputMessage.trim()"
              v-ripple
            >
              发送
            </ElButton>
            <ElButton
              v-if="streaming"
              type="danger"
              size="large"
              @click="handleStopStreaming"
              v-ripple
            >
              停止生成
            </ElButton>
          </div>
        </div>
      </template>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ChatLineSquare, EditPen, Close, Loading } from '@element-plus/icons-vue'
import { marked } from 'marked'
import { useDdragGroupStore } from '@/store/modules/ddrag-group'
import {
  fetchAssistantSessions, createAssistantSession,
  fetchAssistantConversationContext, fetchAssistantSessionDetail,
  streamAssistantMessage, renameAssistantSession, deleteAssistantSession,
} from '@/api/ddrag/assistant'
import type { AssistantSessionListItem, AssistantMessageItem, AssistantToolMode } from '@/types/ddrag'

defineOptions({ name: 'DdragAssistant' })

const groupStore = useDdragGroupStore()
const sessions = ref<AssistantSessionListItem[]>([])
const currentSessionId = ref<number | null>(null)
const messages = ref<AssistantMessageItem[]>([])
const inputMessage = ref('')
const streaming = ref(false)
const streamingReply = ref('')
const chatScrollbar = ref()
const abortController = ref<AbortController | null>(null)

// 重命名状态
const renamingSessionId = ref<number | null>(null)
const renamingTitle = ref('')

const toolMode = ref<AssistantToolMode>('CHAT')
const selectedGroupId = computed({
  get: () => groupStore.currentGroupId,
  set: (val) => groupStore.setCurrentGroupId(val ?? null),
})

const modeOptions = [
  { label: '仅对话', value: 'CHAT' },
  { label: '知识库检索', value: 'KB_SEARCH' },
]

// Markdown渲染配置
marked.setOptions({ breaks: true, gfm: true })
const renderMarkdown = (text: string) => marked.parse(text || '') as string

onMounted(async () => {
  sessions.value = (await fetchAssistantSessions()).sort((a, b) => {
    if (!a.lastMessageAt) return -1
    if (!b.lastMessageAt) return 1
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  })
  groupStore.loadGroupsIfNeeded()
})

const selectSession = async (sessionId: number) => {
  currentSessionId.value = sessionId
  const context = await fetchAssistantConversationContext(sessionId)
  messages.value = context.recentMessages
  streamingReply.value = ''
  scrollToBottom()
}

const handleCreateSession = async () => {
  const session = await createAssistantSession()
  sessions.value.unshift({ sessionId: session.sessionId, title: session.title, lastMessageAt: null })
  currentSessionId.value = session.sessionId
  messages.value = []
  streamingReply.value = ''
}

// 重命名
const startRename = (session: AssistantSessionListItem) => {
  renamingSessionId.value = session.sessionId
  renamingTitle.value = session.title
}

const cancelRename = () => {
  renamingSessionId.value = null
}

const confirmRename = async () => {
  if (!renamingSessionId.value || !renamingTitle.value.trim()) return
  const result = await renameAssistantSession(renamingSessionId.value, renamingTitle.value.trim())
  const idx = sessions.value.findIndex(s => s.sessionId === result.sessionId)
  if (idx >= 0) sessions.value[idx].title = result.title
  renamingSessionId.value = null
  ElMessage.success('重命名成功')
}

const handleDeleteSession = async (sessionId: number) => {
  await ElMessageBox.confirm('确定删除该会话？', '删除确认', { type: 'warning' })
  await deleteAssistantSession(sessionId)
  sessions.value = sessions.value.filter(s => s.sessionId !== sessionId)
  if (currentSessionId.value === sessionId) {
    currentSessionId.value = null
    messages.value = []
  }
  ElMessage.success('已删除')
}

// 流式发送
const handleSendMessage = async () => {
  if (!inputMessage.value.trim() || !currentSessionId) return
  const userContent = inputMessage.value.trim()
  inputMessage.value = ''
  streaming.value = true
  streamingReply.value = ''

  // 添加用户消息到显示
  messages.value.push({
    messageId: Date.now(),
    sessionId: currentSessionId.value!,
    role: 'USER',
    toolMode: toolMode.value,
    groupId: toolMode.value === 'KB_SEARCH' ? groupStore.currentGroupId : null,
    content: userContent,
    structuredPayload: null,
    createdAt: new Date().toISOString(),
  })
  scrollToBottom()

  // 流式请求
  abortController.value = new AbortController()
  try {
    await streamAssistantMessage(
      {
        sessionId: currentSessionId.value!,
        message: userContent,
        toolMode: toolMode.value,
        groupId: toolMode.value === 'KB_SEARCH' ? groupStore.currentGroupId : null,
      },
      {
        onEvent: (event) => handleStreamEvent(event),
        signal: abortController.value.signal,
      },
    )
  } catch (error: any) {
    if (error.name === 'AbortError') {
      if (streamingReply.value) {
        pushAssistantMessage(streamingReply.value)
      }
      refreshCurrentSession()
    } else {
      ElMessage.error('发送失败: ' + (error.message || '未知错误'))
    }
  } finally {
    streaming.value = false
    streamingReply.value = ''
    abortController.value = null
  }
}

const handleStreamEvent = (event: import('@/types/ddrag').AssistantChatStreamEvent) => {
  switch (event.event) {
    case 'start':
      streamingReply.value = ''
      break
    case 'delta':
      if (event.delta) streamingReply.value += event.delta
      scrollToBottom()
      break
    case 'done':
      pushAssistantMessage(event.reply ?? streamingReply.value)
      streamingReply.value = ''
      streaming.value = false
      abortController.value = null
      refreshCurrentSession()
      break
    case 'error':
      ElMessage.error(event.error || '生成失败')
      streamingReply.value = ''
      streaming.value = false
      abortController.value = null
      break
  }
}

const pushAssistantMessage = (content: string) => {
  messages.value.push({
    messageId: Date.now(),
    sessionId: currentSessionId.value!,
    role: 'ASSISTANT',
    toolMode: toolMode.value,
    groupId: toolMode.value === 'KB_SEARCH' ? groupStore.currentGroupId : null,
    content,
    structuredPayload: null,
    createdAt: new Date().toISOString(),
  })
  scrollToBottom()
}

const handleStopStreaming = () => {
  abortController.value?.abort()
}

const refreshCurrentSession = async () => {
  if (!currentSessionId.value) return
  const detail = await fetchAssistantSessionDetail(currentSessionId.value)
  const idx = sessions.value.findIndex(s => s.sessionId === detail.sessionId)
  if (idx >= 0) {
    sessions.value[idx].title = detail.title
    sessions.value[idx].lastMessageAt = detail.lastMessageAt
  }
  // 按最后消息时间排序，最新在前
  sessions.value.sort((a, b) => {
    if (!a.lastMessageAt) return -1
    if (!b.lastMessageAt) return 1
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  })
}

const scrollToBottom = async () => {
  await nextTick()
  chatScrollbar.value?.setScrollTop(99999)
}

const formatTime = (iso: string) => new Date(iso).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
const formatMsgTime = (iso: string) => new Date(iso).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })
</script>

<style scoped>
@import '@/assets/styles/core/md.scss';

.assistant-chat-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  padding: 0;
}
.assistant-composer {
  padding: 12px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.assistant-composer__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}
.assistant-composer__group-select {
  max-width: 220px;
}
.assistant-session-item {
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 6px;
  margin-bottom: 4px;
}
.assistant-session-item:hover {
  background: var(--el-fill-color-light);
}
.assistant-session-item--active {
  background: var(--el-color-primary-light-9);
}
.assistant-session-item__action {
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}
.assistant-session-item:hover .assistant-session-item__action {
  opacity: 1;
}
.assistant-session-item__action:hover {
  color: var(--el-color-primary);
}
.assistant-session-item__action--danger:hover {
  color: var(--el-color-danger);
}
.assistant-msg {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 12px;
}
.assistant-msg--user {
  background: #ecf5ff;
  color: #1d2129;
}
.assistant-msg--ai {
  background: #f4f4f5;
  color: #1d2129;
}
.assistant-msg__text {
  font-size: 14px;
  line-height: 1.6;
}
.assistant-msg__time {
  font-size: 12px;
  color: #86909c;
  margin-top: 4px;
  text-align: right;
}
.assistant-msg--ai .assistant-msg__time {
  text-align: left;
}
.assistant-msg__md {
  font-size: 14px;
  line-height: 1.6;
}
.assistant-msg__md :deep(p) {
  margin: 0 0 8px;
}
.assistant-msg__md :deep(p:last-child) {
  margin-bottom: 0;
}
.assistant-msg__streaming-tag {
  font-size: 12px;
  color: var(--el-color-primary);
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>