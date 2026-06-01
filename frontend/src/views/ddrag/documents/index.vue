<template>
  <div class="art-full-height flex flex-col gap-4">
    <!-- 搜索区域 -->
    <ArtSearchBar
      v-model="searchFormState"
      :items="searchItems"
      :show-search-button="true"
      :show-reset-button="true"
      @search="handleSearch"
      @reset="handleReset"
    >
      <template #groupId="{ item, modelValue }">
        <GroupSelector />
      </template>
    </ArtSearchBar>

    <!-- 表格区域 -->
    <ElCard class="flex-1 art-table-card" style="margin-top: 0">
      <template #header>
        <div class="flex-cb">
          <h4 class="m-0">文档中心</h4>
          <div class="flex gap-2">
            <ElTag v-if="loading" type="warning">加载中...</ElTag>
            <ElTag v-else-if="!groupStore.currentGroupId" type="info">请选择知识库</ElTag>
            <ElTag v-else type="success">{{ filteredDocuments.length }} 条数据</ElTag>
          </div>
        </div>
      </template>

      <!-- 表格工具栏 -->
      <ArtTableHeader
        v-model:columns="columnChecks"
        :loading="loading"
        @refresh="loadDocuments"
        layout="refresh,size,fullscreen,columns,settings"
        fullClass="art-table-card"
      >
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" @click="handleUpload" :disabled="!groupStore.currentGroupId" v-ripple>
              <ElIcon><Upload /></ElIcon>
              上传文档
            </ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <!-- 数据表格 -->
      <ArtTable
        :loading="loading"
        :data="filteredDocuments"
        :columns="columns"
        rowKey="documentId"
      >
        <template #fileName="{ row }">
          <div class="flex-c gap-2">
            <ElIcon size="16"><Document /></ElIcon>
            <span>{{ row.fileName }}</span>
          </div>
        </template>
        <template #status="{ row }">
          <ElTag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</ElTag>
        </template>
        <template #operation="{ row }">
          <div class="flex">
            <ArtButtonTable v-if="row.status === 'READY'" type="view" :row="row" @click="handlePreview(row)" />
            <ArtButtonTable v-if="row.status === 'FAILED'" type="edit" :row="row" @click="handleRetry(row)" />
            <ArtButtonTable type="delete" :row="row" @click="handleDelete(row)" />
          </div>
        </template>
      </ArtTable>
    </ElCard>

    <!-- 上传抽屉 -->
    <ElDrawer v-model="showUploadDrawer" title="上传文档" size="400px" :close-on-click-modal="false">
      <ElUpload
        v-if="uploadPhase === 'idle'"
        drag
        :auto-upload="false"
        :on-change="handleFileChange"
        :on-remove="handleFileRemove"
        :limit="1"
        accept=".pdf,.docx,.md,.txt,.xlsx"
        :file-list="uploadFileList"
      >
        <ElIcon class="el-icon--upload" :size="40"><UploadFilled /></ElIcon>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">支持 PDF、DOCX、MD、TXT、XLSX 格式</div>
        </template>
      </ElUpload>
      <div v-if="uploadPhase !== 'idle'" class="mt-4">
        <div v-if="selectedFile" class="flex-c gap-2 mb-3 text-sm text-g-600">
          <ElIcon><Document /></ElIcon>
          <span>{{ selectedFile.name }}</span>
        </div>
        <ElProgress :percentage="uploadProgress" :status="uploadPhase === 'completed' ? 'success' : uploadPhase === 'failed' ? 'exception' : undefined" />
        <p class="mt-2 text-sm text-g-500">{{ uploadPhaseLabel }}</p>
        <p v-if="uploadPhase === 'failed' && uploadErrorMsg" class="mt-1 text-sm text-danger">{{ uploadErrorMsg }}</p>
      </div>
      <template #footer>
        <ElButton @click="cancelUploadDrawer">取消</ElButton>
        <ElButton type="primary" @click="startUpload" :loading="uploadPhase === 'uploading'" :disabled="!selectedFile || uploadPhase !== 'idle'">上传</ElButton>
      </template>
    </ElDrawer>

    <!-- 预览对话框 -->
    <ElDialog v-model="showPreview" title="文档预览" width="600px">
      <div v-if="previewData">
        <h4 class="mb-2 font-semibold">{{ previewData.fileName }}</h4>
        <div class="p-4 bg-gray-50 rounded text-sm whitespace-pre-wrap">{{ previewData.previewText }}</div>
      </div>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, UploadFilled, Document } from '@element-plus/icons-vue'
import { useDdragGroupStore } from '@/store/modules/ddrag-group'
import { useResumableUpload } from '@/hooks/useResumableUpload'
import { useTableColumns } from '@/hooks/core/useTableColumns'
import { fetchDocuments, fetchDocumentPreview, deleteDocument, retryDocumentIngestion } from '@/api/ddrag/document'
import GroupSelector from '../groups/components/GroupSelector.vue'
import type { DocumentItem, DocumentPreview } from '@/types/ddrag'

defineOptions({ name: 'DdragDocuments' })

const groupStore = useDdragGroupStore()
const { phase: uploadPhase, progress: uploadProgress, errorMessage: uploadErrorMsg, startUpload: doUpload, cancel: cancelUpload, reset: resetUpload } = useResumableUpload()

const loading = ref(false)
const documents = ref<DocumentItem[]>([])
const showUploadDrawer = ref(false)
const selectedFile = ref<File | null>(null)
const uploadFileList = ref<any[]>([])
const showPreview = ref(false)
const previewData = ref<DocumentPreview | null>(null)

// 搜索表单
const searchFormState = ref({
  groupId: null as number | null,
  fileName: '',
  status: ''
})

const searchItems = computed(() => [
  {
    key: 'groupId',
    label: '知识库',
    type: 'input',
    span: 6
  },
  {
    key: 'fileName',
    label: '文件名',
    type: 'input',
    props: { placeholder: '请输入文件名', clearable: true },
    span: 6
  },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    clearable: true,
    placeholder: '请选择状态',
    options: [
      { label: '已上传', value: 'UPLOADED' },
      { label: '处理中', value: 'PROCESSING' },
      { label: '就绪', value: 'READY' },
      { label: '失败', value: 'FAILED' }
    ],
    span: 6
  }
])

// 列配置（useTableColumns 提供列勾选、拖拽排序能力）
const { columns, columnChecks } = useTableColumns<DocumentItem>(() => [
  { type: 'globalIndex' as const, width: 60, label: '序号' },
  { prop: 'fileName', label: '文件名', minWidth: 200, useSlot: true },
  { prop: 'fileSize', label: '大小', width: 120, formatter: (row: DocumentItem) => formatFileSize(row.fileSize) },
  { prop: 'uploaderDisplayName', label: '上传者', width: 120 },
  { prop: 'uploadedAt', label: '上传时间', width: 180, formatter: (row: DocumentItem) => formatTime(row.uploadedAt) },
  { prop: 'status', label: '状态', width: 120, useSlot: true },
  { prop: 'operation', label: '操作', width: 190, useSlot: true, fixed: 'right' }
])

// 过滤文档
const filteredDocuments = computed(() => {
  let result = documents.value
  if (searchFormState.value.fileName) {
    const keyword = searchFormState.value.fileName.toLowerCase()
    result = result.filter(d => d.fileName.toLowerCase().includes(keyword))
  }
  if (searchFormState.value.status) {
    result = result.filter(d => d.status === searchFormState.value.status)
  }
  return result
})

const uploadPhaseLabel = computed(() => {
  const labels: Record<string, string> = { idle: '', init: '初始化上传...', uploading: '上传中...', completed: '上传完成', failed: '上传失败' }
  return labels[uploadPhase.value] ?? ''
})

// 监听组切换自动加载
watch(() => groupStore.currentGroupId, (newId) => {
  if (newId) loadDocuments()
  else documents.value = []
})

onMounted(() => { if (groupStore.currentGroupId) loadDocuments() })

async function loadDocuments() {
  if (!groupStore.currentGroupId) return
  loading.value = true
  try {
    documents.value = await fetchDocuments({ groupId: groupStore.currentGroupId! })
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  // 前端过滤，无需重新请求
}

const handleReset = () => {
  searchFormState.value = { groupId: null, fileName: '', status: '' }
}

const handleUpload = () => { resetUpload(); selectedFile.value = null; uploadFileList.value = []; showUploadDrawer.value = true }

const handleFileChange = (file: any) => { selectedFile.value = file.raw }

const handleFileRemove = () => { selectedFile.value = null }

const cancelUploadDrawer = () => { cancelUpload(); showUploadDrawer.value = false }

const startUpload = async () => {
  if (!selectedFile.value || !groupStore.currentGroupId) return
  await doUpload(selectedFile.value, groupStore.currentGroupId)
  if (uploadPhase.value === 'completed') {
    ElMessage.success('上传完成')
    showUploadDrawer.value = false
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

const statusTagType = (status: string): 'info' | 'warning' | 'success' | 'danger' => {
  const map: Record<string, 'info' | 'warning' | 'success' | 'danger'> = { UPLOADED: 'info', PROCESSING: 'warning', READY: 'success', FAILED: 'danger' }
  return map[status] ?? 'info'
}

const statusLabel = (status: string): string => {
  const map: Record<string, string> = { UPLOADED: '已上传', PROCESSING: '处理中', READY: '已就绪', FAILED: '失败' }
  return map[status] ?? status
}
</script>