<template>
  <div class="art-full-height flex flex-col gap-4">
    <!-- No Group Warning -->
    <ElCard v-if="!groupStore.currentGroupId" shadow="hover">
      <ElAlert title="请先选择一个组" type="warning" :closable="false" />
    </ElCard>

    <!-- Search Bar Area -->
    <div class="flex items-center gap-3">
      <GroupSelector />
      <ElInput
        v-model="question"
        placeholder="输入您的问题..."
        size="large"
        @keyup.enter="handleAsk"
        :disabled="!groupStore.currentGroupId || asking"
        class="flex-1"
      />
      <ElButton type="primary" size="large" @click="handleAsk" :loading="asking" :disabled="!groupStore.currentGroupId || !question.trim()" v-ripple>
        提问
      </ElButton>
    </div>

    <!-- Conversation Display -->
    <ElCard shadow="hover" class="flex-1 overflow-hidden">
      <template #header>
        <div class="flex-cb">
          <h4 class="m-0">知识问答</h4>
          <div class="flex gap-2">
            <ElTag type="info">{{ conversations.length }} 条对话</ElTag>
          </div>
        </div>
      </template>
      <div class="h-full overflow-auto space-y-6">
        <div v-if="conversations.length === 0" class="text-center text-gray-400 mt-20">
          <p class="text-lg">输入问题，开始知识问答</p>
        </div>

        <div v-for="conv in conversations" :key="conv.id">
          <!-- User Question -->
          <div class="flex justify-end mb-3">
            <div class="bg-blue-50 rounded-lg p-3 max-w-[70%]">
              <p class="font-medium text-blue-800">{{ conv.question }}</p>
            </div>
          </div>

          <!-- AI Answer -->
          <div v-if="conv.answer" class="flex justify-start mb-3">
            <div class="bg-gray-50 rounded-lg p-3 max-w-[70%]">
              <p class="whitespace-pre-wrap">{{ conv.answer }}</p>
            </div>
          </div>

          <!-- Insufficient Evidence -->
          <div v-if="conv.reasonMessage" class="flex justify-start mb-3">
            <ElAlert :title="conv.reasonMessage" type="warning" :closable="false" />
          </div>

          <!-- Citations -->
          <div v-if="conv.citations.length > 0" class="ml-2 mb-4">
            <h5 class="text-sm font-semibold mb-2 text-gray-600">引用来源</h5>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ElCard v-for="(c, idx) in conv.citations" :key="idx" shadow="hover" class="text-sm">
                <p class="font-medium mb-1">{{ c.fileName }}</p>
                <p class="text-xs text-gray-500 mb-1">相关度: {{ (c.score * 100).toFixed(0) }}%</p>
                <p class="text-gray-600 line-clamp-3">{{ c.snippet }}</p>
              </ElCard>
            </div>
          </div>
        </div>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDdragGroupStore } from '@/store/modules/ddrag-group'
import { askQuestion } from '@/api/ddrag/qa'
import GroupSelector from '../groups/components/GroupSelector.vue'
import type { CitationItem } from '@/types/ddrag'

defineOptions({ name: 'DdragQa' })

const groupStore = useDdragGroupStore()
const question = ref('')
const asking = ref(false)

interface QAConversation {
  id: number
  question: string
  answer: string | null
  reasonMessage: string | null
  citations: CitationItem[]
}

const conversations = ref<QAConversation[]>([])

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
    })
    question.value = ''
  } finally {
    asking.value = false
  }
}
</script>