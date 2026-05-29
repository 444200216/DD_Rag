import { ref, computed } from 'vue'
import { uploadDocumentSimple } from '@/api/ddrag/document'

type UploadPhase = 'idle' | 'init' | 'uploading' | 'completed' | 'failed'

export function useResumableUpload() {
  const phase = ref<UploadPhase>('idle')
  const progress = ref(0)
  const errorMessage = ref<string | null>(null)

  const isUploading = computed(() => phase.value === 'init' || phase.value === 'uploading')

  async function startUpload(file: File, groupId: number) {
    phase.value = 'init'
    progress.value = 0
    errorMessage.value = null

    try {
      phase.value = 'uploading'
      progress.value = 50
      await uploadDocumentSimple(groupId, file)
      progress.value = 100
      phase.value = 'completed'
    } catch (e) {
      errorMessage.value = e instanceof Error ? e.message : '上传失败'
      phase.value = 'failed'
    }
  }

  function cancel() {
    phase.value = 'idle'
    progress.value = 0
    errorMessage.value = null
  }

  function reset() {
    phase.value = 'idle'
    progress.value = 0
    errorMessage.value = null
  }

  return { phase, progress, errorMessage, isUploading, startUpload, cancel, reset }
}