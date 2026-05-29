import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { StorageConfig } from '@/utils/storage/storage-config'
import { fetchGroups } from '@/api/ddrag/group'
import type { GroupQueryResult } from '@/types/ddrag'

export type GroupRelation = 'OWNER' | 'MEMBER'

export interface GroupItem {
  groupId: number
  groupCode: string
  groupName: string
}

export interface PendingInvitationItem {
  invitationId: number
  groupId: number
  groupName: string
  inviterUserId: number
  inviterDisplayName: string
  status: string
}

export interface VisibleGroup extends GroupItem {
  relation: GroupRelation
}

export const useDdragGroupStore = defineStore(
  'ddrag-group',
  () => {
    const currentGroupId = ref<number | null>(null)
    const ownedGroups = ref<GroupItem[]>([])
    const joinedGroups = ref<GroupItem[]>([])
    const pendingInvitations = ref<PendingInvitationItem[]>([])
    const isGroupsLoading = ref(false)

    const visibleGroups = computed<VisibleGroup[]>(() => [
      ...ownedGroups.value.map((g) => ({ ...g, relation: 'OWNER' as const })),
      ...joinedGroups.value.map((g) => ({ ...g, relation: 'MEMBER' as const })),
    ])

    const currentGroup = computed<VisibleGroup | null>(() =>
      visibleGroups.value.find((g) => g.groupId === currentGroupId.value) ?? null,
    )

    const canManageCurrentGroup = computed(() => currentGroup.value?.relation === 'OWNER')

    function setCurrentGroupId(groupId: number | null) {
      currentGroupId.value = groupId
    }

    function setGroupCollections(payload: {
      ownedGroups: GroupItem[]
      joinedGroups: GroupItem[]
      pendingInvitations: PendingInvitationItem[]
    }) {
      ownedGroups.value = payload.ownedGroups
      joinedGroups.value = payload.joinedGroups
      pendingInvitations.value = payload.pendingInvitations
    }

    async function loadGroupsIfNeeded() {
      if (visibleGroups.value.length > 0 || isGroupsLoading.value) return
      isGroupsLoading.value = true
      try {
        const result: GroupQueryResult = await fetchGroups()
        setGroupCollections({
          ownedGroups: result.ownedGroups,
          joinedGroups: result.joinedGroups,
          pendingInvitations: result.pendingInvitations || [],
        })
      } finally {
        isGroupsLoading.value = false
      }
    }

    return {
      currentGroupId, ownedGroups, joinedGroups, pendingInvitations, isGroupsLoading,
      visibleGroups, currentGroup, canManageCurrentGroup,
      setCurrentGroupId, setGroupCollections, loadGroupsIfNeeded,
    }
  },
  {
    persist: {
      key: StorageConfig.generateStorageKey('ddrag-group'),
      storage: localStorage,
    },
  },
)