<template>
  <div class="p-6">
    <!-- Search Bar -->
    <div class="mb-4 flex items-center gap-4">
      <GroupSelector />
      <ElSelect v-model="statusFilter" placeholder="状态筛选" clearable style="width: 160px">
        <ElOption label="PENDING" value="PENDING" />
        <ElOption label="PROCESSING" value="PROCESSING" />
        <ElOption label="COMPLETED" value="COMPLETED" />
        <ElOption label="FAILED" value="FAILED" />
      </ElSelect>
      <ElButton type="primary" @click="handleUpload" :disabled="!groupStore.currentGroupId">
        <ElIcon><ElIconUpload /></ElIcon> 上传文档
      </ElButton>
      <ElButton @click="loadDocuments">刷新</ElButton>
    </div>

    <!-- No Group Warning -->
    <ElAlert v-if="!groupStore.currentGroupId" title="请先选择一个组" type="warning" :closable="false" class="mb-4" />

    <!-- Documents Table -->
    <ElTable v-loading="loading" :data="filteredDocuments" stripe>
      <ElTableColumn prop="fileName" label="文件名" min-width="200" />
      <ElTableColumn prop="fileSize" label="大小" width="120">
        <template #default="{ row }">{{ formatFileSize(row.fileSize) }}</template>
      </ElTableColumn>
      <ElTableColumn prop="uploadedAt" label="上传时间" width="180">
        <template #default="{ row }">{{ formatTime(row.uploadedAt) }}</template>
      </ElTableColumn>
      <ElTableColumn prop="status" label="状态" width="140">
        <template #default="{ row }">
          <ElTag :type="statusTagType(row.status)" size="small">{{ row.status }}</ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="200">
        <template #default="{ row }">
          <ElButton size="small" @click="handlePreview(row)" v-if="row.status === 'COMPLETED'">预览</ElButton>
          <ElButton size="small" @click="handleRetry(row)" v-if="row.status === 'FAILED'">重试</ElButton>
          <ElButton size="small" type="danger" @click="handleDelete(row)">删除</ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <!-- Upload Dialog -->
    <ElDialog v-model="showUploadDialog" title="上传文档" width="400px">
      <ElUpload :auto-upload="false" :on-change="handleFileChange" :limit="1" accept=".pdf,.docx,.md,.txt,.xlsx">
        <ElButton type="primary">选择文件</ElButton>
      </ElUpload>
      <div v-if="uploadPhase !== 'idle'" class="mt-4">
        <ElProgress :percentage="uploadProgress" :status="uploadPhase === 'completed' ? 'success' : uploadPhase === 'failed' ? 'exception' : undefined" />
        <p class="mt-2 text-sm text-gray-500">{{ uploadPhaseLabel }}</p>
      </div>
      <template #footer>
        <ElButton @click="cancelUpload">取消</ElButton>
        <ElButton type="primary" @click="startUpload" :loading="uploadPhase === 'uploading'" :disabled="!selectedFile">上传</ElButton>
      </template>
    </ElDialog>

    <!-- Preview Dialog -->
    <ElDialog v-model="showPreview" title="文档预览" width="600px">
      <div v-if="previewData">
        <h4 class="mb-2 font-semibold">{{ previewData.fileName }}</h4>
        <div class="p-4 bg-gray-50 rounded text-sm whitespace-pre-wrap">{{ previewData.previewText }}</div>
      </div>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload as ElIconUpload } from '@element-plus/icons-vue'
import { useDdragGroupStore } from '@/store/modules/ddrag-group'
import { useResumableUpload } from '@/hooks/useResumableUpload'
import { fetchDocuments, fetchDocumentPreview, deleteDocument, retryDocumentIngestion } from '@/api/ddrag/document'
import GroupSelector from '../groups/components/GroupSelector.vue'
import type { DocumentItem, DocumentPreview } from '@/types/ddrag'

defineOptions({ name: 'DdragDocuments' })

const groupStore = useDdragGroupStore()
const { phase: uploadPhase, progress: uploadProgress, startUpload: doUpload, cancel: cancelUpload, reset: resetUpload } = useResumableUpload()

const loading = ref(false)
const documents = ref<DocumentItem[]>([])
const statusFilter = ref('')
const showUploadDialog = ref(false)
const selectedFile = ref<File | null>(null)
const showPreview = ref(false)
const previewData = ref<DocumentPreview | null>(null)

const filteredDocuments = computed(() => {
  if (!statusFilter.value) return documents.value
  return documents.value.filter((d) => d.status === statusFilter.value)
})

const uploadPhaseLabel = computed(() => {
  const labels: Record<string, string> = { idle: '', init: '初始化上传...', uploading: '上传中...', completed: '上传完成', failed: '上传失败' }
  return labels[uploadPhase.value] ?? ''
})

onMounted(loadDocuments)

async function loadDocuments() {
  if (!groupStore.currentGroupId) return
  loading.value = true
  try {
    documents.value = await fetchDocuments({ groupId: groupStore.currentGroupId! })
  } finally {
    loading.value = false
  }
}

const handleUpload = () => { resetUpload(); selectedFile.value = null; showUploadDialog.value = true }

const handleFileChange = (file: any) => { selectedFile.value = file.raw }

const startUpload = async () => {
  if (!selectedFile.value || !groupStore.currentGroupId) return
  await doUpload(selectedFile.value, groupStore.currentGroupId)
  if (uploadPhase.value === 'completed') {
    ElMessage.success('上传完成')
    showUploadDialog.value = false
    await loadDocuments()
  }
}

const handlePreview = async (doc: DocumentItem) => {
  previewData.value = await fetchDocumentPreview(doc.documentId, doc.groupId)
  showPreview.value = true
}

const handleRetry = async (doc: DocumentItem) => {
  await retryDocumentIngestion(doc.documentId, doc.groupId)
  ElMessage.success('已重新处理')
  await loadDocuments()
}

const handleDelete = async (doc: DocumentItem) => {
  await ElMessageBox.confirm(`确定删除 "${doc.fileName}"？`, '删除确认', { type: 'warning' })
  await deleteDocument(doc.documentId, doc.groupId)
  ElMessage.success('已删除')
  await loadDocuments()
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

const formatTime = (iso: string) => new Date(iso).toLocaleString('zh-CN')

const statusTagType = (status: string) => {
  const map: Record<string, string> = { PENDING: 'info', PROCESSING: 'warning', COMPLETED: 'success', FAILED: 'danger' }
  return map[status] ?? ''
}
</script>