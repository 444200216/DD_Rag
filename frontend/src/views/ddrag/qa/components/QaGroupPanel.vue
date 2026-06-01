<template>
  <div class="flex flex-col h-full">
    <!-- 组选择 -->
    <div class="py-4 border-b border-g-200">
      <h5 class="text-sm font-medium mb-3">选择知识库</h5>
      <ElSelect
        v-model="selectedGroupId"
        placeholder="请选择问答范围"
        clearable
        :loading="groupStore.isGroupsLoading"
        class="w-full"
      >
        <ElOptionGroup v-if="groupStore.ownedGroups.length" label="我拥有的知识库">
          <ElOption
            v-for="group in groupStore.ownedGroups"
            :key="group.groupId"
            :label="group.groupName"
            :value="group.groupId"
          />
        </ElOptionGroup>
        <ElOptionGroup v-if="groupStore.joinedGroups.length" label="我加入的知识库">
          <ElOption
            v-for="group in groupStore.joinedGroups"
            :key="group.groupId"
            :label="group.groupName"
            :value="group.groupId"
          />
        </ElOptionGroup>
      </ElSelect>
      <p v-if="groupStore.currentGroup" class="mt-2 text-xs text-g-500">
        已锁定：{{ groupStore.currentGroup.groupName }}
      </p>
      <p v-else class="mt-2 text-xs text-g-400">请先选择知识库再开始检索</p>
    </div>

    <!-- 当前组信息 -->
    <div v-if="groupStore.currentGroup" class="py-4 border-b border-g-200">
      <div class="flex items-center gap-2 mb-2">
        <ElTag :type="groupStore.currentGroup.relation === 'OWNER' ? 'success' : 'info'" size="small">
          {{ groupStore.currentGroup.relation === 'OWNER' ? '所有者' : '成员' }}
        </ElTag>
        <span class="text-sm font-medium">{{ groupStore.currentGroup.groupName }}</span>
      </div>
      <p class="text-xs text-g-500 leading-relaxed">
        {{ groupStore.currentGroup.relation === 'OWNER'
          ? '你拥有该知识库，可上传、删除文档，也可进行问答检索。'
          : '你是该知识库成员，可查看内容并问答，但不能上传文件或管理成员。'
        }}
      </p>
    </div>

    <!-- 问答规则 -->
    <div class="py-4 flex-1 overflow-auto">
      <h5 class="text-sm font-medium mb-3">检索规则</h5>
      <ul class="space-y-2.5 text-xs text-g-600 leading-relaxed">
        <li class="flex gap-2">
          <ElIcon class="text-primary mt-0.5" :size="14"><InfoFilled /></ElIcon>
          <span>问答只在当前知识库内检索，不会跨知识库拼接证据。</span>
        </li>
        <li class="flex gap-2">
          <ElIcon class="text-primary mt-0.5" :size="14"><InfoFilled /></ElIcon>
          <span>所有者和成员都可以提问，权限按知识库关系执行。</span>
        </li>
        <li class="flex gap-2">
          <ElIcon class="text-primary mt-0.5" :size="14"><InfoFilled /></ElIcon>
          <span>回答后需结合引用来源一起核对，不建议只看模型正文。</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { InfoFilled } from '@element-plus/icons-vue'
import { useDdragGroupStore } from '@/store/modules/ddrag-group'

defineOptions({ name: 'QaGroupPanel' })

const groupStore = useDdragGroupStore()

const selectedGroupId = computed({
  get: () => groupStore.currentGroupId,
  set: (val) => groupStore.setCurrentGroupId(val ?? null),
})

onMounted(() => groupStore.loadGroupsIfNeeded())
</script>