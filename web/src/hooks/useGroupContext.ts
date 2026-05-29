import { computed } from 'vue'
import { useDdragGroupStore } from '@/store/modules/ddrag-group'
import { useRouter } from 'vue-router'

export function useGroupContext() {
  const groupStore = useDdragGroupStore()
  const router = useRouter()

  const currentGroupId = computed(() => groupStore.currentGroupId)
  const currentGroup = computed(() => groupStore.currentGroup)
  const hasSelectedGroup = computed(() => currentGroupId.value !== null)

  function requireGroup(): number {
    if (currentGroupId.value === null) {
      router.push('/groups')
      throw new Error('No group selected')
    }
    return currentGroupId.value
  }

  function selectGroup(groupId: number) {
    groupStore.setCurrentGroupId(groupId)
  }

  return { currentGroupId, currentGroup, hasSelectedGroup, requireGroup, selectGroup }
}