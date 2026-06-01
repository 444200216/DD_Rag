<template>
  <ElSelect v-model="selectedGroupId" placeholder="选择知识库" @change="handleChange" clearable :loading="groupStore.isGroupsLoading">
    <ElOption
      v-for="group in groupStore.visibleGroups"
      :key="group.groupId"
      :label="group.groupName"
      :value="group.groupId"
    />
  </ElSelect>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useDdragGroupStore } from '@/store/modules/ddrag-group'

defineOptions({ name: 'GroupSelector' })

const groupStore = useDdragGroupStore()
const selectedGroupId = computed({
  get: () => groupStore.currentGroupId,
  set: (val) => groupStore.setCurrentGroupId(val),
})

const handleChange = (val: number | null) => {
  groupStore.setCurrentGroupId(val)
}

onMounted(() => groupStore.loadGroupsIfNeeded())
</script>