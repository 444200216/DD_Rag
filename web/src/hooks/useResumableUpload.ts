import { ref, computed } from 'vue'

type UploadPhase = 'idle' | 'init' | 'uploading' | 'polling' | 'completed' | 'failed'

export function useResumableUpload() {
  const phase = ref<UploadPhase>('idle')
  const progress = ref(0)
  const errorMessage = ref<string | null>(null)
  const uploadId = ref<string | null>(null)

  const isUploading = computed(() => phase.value === 'init' || phase.value === 'uploading')

  async function startUpload(_file: File, _groupId: number) {
    phase.value = 'init'
    progress.value = 0
    errorMessage.value = null

    for (let i = 0; i <= 100; i += 5) {
      progress.value = i
      await new Promise((r) => setTimeout(r, 100))
    }

    phase.value = 'completed'
    progress.value = 100
  }

  async function retry() {
    if (phase.value !== 'failed') return
    phase.value = 'idle'
    errorMessage.value = null
  }

  function cancel() {
    phase.value = 'idle'
    progress.value = 0
    errorMessage.value = null
    uploadId.value = null
  }

  function reset() {
    phase.value = 'idle'
    progress.value = 0
    errorMessage.value = null
    uploadId.value = null
  }

  return { phase, progress, errorMessage, isUploading, startUpload, retry, cancel, reset }
}