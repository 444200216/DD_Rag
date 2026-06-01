<template>
  <div class="art-full-height flex gap-4" style="flex-direction: row">
    <!-- 左侧：知识库面板 -->
    <ElCard shadow="hover" class="w-64 flex flex-col overflow-hidden" style="flex-shrink: 0">
      <template #header>
        <span class="font-semibold">知识库</span>
      </template>
      <QaGroupPanel />
    </ElCard>

    <!-- 右侧：问答对话区 -->
    <ElCard shadow="hover" class="flex-1 flex flex-col overflow-hidden qa-chat-card">
      <template #header>
        <div class="flex-cb">
          <h4 class="m-0">智能检索</h4>
          <ElTag v-if="groupStore.currentGroupId" type="success" size="small">{{ conversations.length }} 条对话</ElTag>
        </div>
      </template>

      <!-- 无组选中提示 -->
      <div v-if="!groupStore.currentGroupId" class="flex-1 flex items-center justify-center text-g-400">
        <div class="text-center">
          <ElIcon :size="48" class="mb-3"><ChatLineSquare /></ElIcon>
          <p>请先选择一个知识库开始检索</p>
        </div>
      </div>

      <template v-else>
        <!-- 空状态 -->
        <div v-if="conversations.length === 0" class="flex-1 flex items-center justify-center text-g-400">
          <div class="text-center">
            <ElIcon :size="48" class="mb-3"><EditPen /></ElIcon>
            <p>输入问题，开始智能检索</p>
          </div>
        </div>

        <!-- 对话消息区 -->
        <ElScrollbar v-else class="flex-1" ref="chatScrollbar">
          <div v-for="conv in conversations" :key="conv.id" class="px-4 py-2">
            <!-- 用户问题 -->
            <div class="flex justify-end mb-1">
              <div class="qa-msg qa-msg--user">
                <p class="qa-msg__text">{{ conv.question }}</p>
                <p class="qa-msg__time">{{ conv.timestamp }}</p>
              </div>
            </div>

            <!-- AI回答 + 引用来源 -->
            <div v-if="conv.answer" class="flex justify-start mb-1">
              <div class="qa-msg qa-msg--ai">
                <p class="qa-msg__text whitespace-pre-wrap">{{ conv.answer }}</p>
                <p class="qa-msg__time">{{ conv.timestamp }}</p>
                <!-- 引用来源（内嵌在回答气泡中） -->
                <div v-if="conv.citations.length > 0" class="qa-citations">
                  <div class="qa-citations__header">
                    <ElIcon :size="14"><Link /></ElIcon>
                    <span class="qa-citations__title">引用来源</span>
                    <ElTag size="small" type="info">{{ conv.citations.length }} 条证据</ElTag>
                  </div>
                  <div class="qa-citations__list">
                    <div v-for="(c, idx) in conv.citations" :key="idx" class="qa-citation-card">
                      <div class="qa-citation-card__head">
                        <ElIcon :size="14"><Document /></ElIcon>
                        <span class="qa-citation-card__name">{{ c.fileName }}</span>
                        <span class="qa-citation-card__score">{{ (c.score * 100).toFixed(0) }}%</span>
                      </div>
                      <p class="qa-citation-card__snippet">{{ c.snippet }}</p>
                    </div>
                  </div>
                </div>
                <p class="qa-msg__hint">回答基于当前知识库检索证据生成，建议结合引用来源交叉核对。</p>
              </div>
            </div>

            <!-- 证据不足拒答 -->
            <div v-if="conv.reasonMessage" class="flex justify-start mb-3">
              <ElAlert :title="conv.reasonMessage" type="warning" :closable="false" />
            </div>
          </div>
        </ElScrollbar>

        <!-- 底部输入栏 -->
        <div class="qa-composer">
          <div class="flex gap-3">
            <ElInput
              v-model="question"
              placeholder="输入您的问题..."
              size="large"
              @keyup.enter="handleAsk"
              :disabled="asking"
              class="flex-1"
            />
            <ElButton
              type="primary"
              size="large"
              @click="handleAsk"
              :loading="asking"
              :disabled="!question.trim()"
              v-ripple
            >
              {{ asking ? '检索与生成中' : '开始问答' }}
            </ElButton>
          </div>
        </div>
      </template>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ChatLineSquare, EditPen, Document, Link } from '@element-plus/icons-vue'
import { useDdragGroupStore } from '@/store/modules/ddrag-group'
import { askQuestion } from '@/api/ddrag/qa'
import QaGroupPanel from './components/QaGroupPanel.vue'
import type { CitationItem } from '@/types/ddrag'

defineOptions({ name: 'DdragQa' })

const groupStore = useDdragGroupStore()
const question = ref('')
const asking = ref(false)
const chatScrollbar = ref()

interface QAConversation {
  id: number
  question: string
  answer: string | null
  reasonMessage: string | null
  citations: CitationItem[]
  timestamp: string
}

const conversations = ref<QAConversation[]>([])

// 组切换时清空对话
watch(() => groupStore.currentGroupId, () => {
  conversations.value = []
  question.value = ''
})

const handleAsk = async () => {
  if (!question.value.trim() || !groupStore.currentGroupId) return
  asking.value = true
  try {
    const result = await askQuestion({ groupId: groupStore.currentGroupId!, question: question.value.trim() })
    conversations.value.push({
      id: Date.now(),
      question: question.value.trim(),
      answer: result.answer,
      reasonMessage: result.reasonMessage,
      citations: result.citations,
      timestamp: new Date().toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    })
    question.value = ''
    scrollToBottom()
  } finally {
    asking.value = false
  }
}

const scrollToBottom = () => {
  setTimeout(() => { chatScrollbar.value?.setScrollTop(99999) }, 100)
}
</script>

<style scoped>
.qa-chat-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  padding: 0;
}
.qa-composer {
  padding: 12px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.qa-msg {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 12px;
  position: relative;
}
.qa-msg--user {
  background: #ecf5ff;
  color: #1d2129;
}
.qa-msg--ai {
  background: #f4f4f5;
  color: #1d2129;
}
.qa-msg__text {
  font-size: 14px;
  line-height: 1.6;
}
.qa-msg__time {
  font-size: 12px;
  color: #86909c;
  margin-top: 4px;
  text-align: right;
}
.qa-msg--ai .qa-msg__time {
  text-align: left;
}
.qa-msg__hint {
  font-size: 12px;
  color: #86909c;
  margin-top: 2px;
}
.qa-citations {
  margin: 8px 0 16px;
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
  padding: 12px;
}
.qa-citations__header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  color: var(--el-text-color-primary);
}
.qa-citations__title {
  font-size: 13px;
  font-weight: 600;
}
.qa-citations__list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.qa-citation-card {
  border-radius: 8px;
  background: #fff;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  transition: box-shadow 0.2s;
}
.qa-citation-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.qa-citation-card__head {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
}
.qa-citation-card__name {
  font-size: 13px;
  font-weight: 500;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.qa-citation-card__score {
  font-size: 11px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  padding: 1px 6px;
  border-radius: 4px;
}
.qa-citation-card__snippet {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>