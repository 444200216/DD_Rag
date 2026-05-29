<template>
  <div class="p-6">
    <!-- Pending Invitations -->
    <div v-if="pendingInvitations.length > 0" class="mb-6">
      <h4 class="mb-3 text-base font-semibold text-gray-700">待处理的邀请</h4>
      <div class="space-y-3">
        <ElCard v-for="inv in pendingInvitations" :key="inv.invitationId" shadow="hover">
          <div class="flex items-center justify-between">
            <div>
              <span class="font-medium">{{ inv.groupName }}</span>
              <span class="ml-2 text-sm text-gray-500">邀请人: {{ inv.inviterDisplayName }}</span>
            </div>
            <div class="space-x-2">
              <ElButton type="primary" size="small" @click="handleAcceptInvitation(inv.invitationId)">接受</ElButton>
              <ElButton size="small" @click="handleRejectInvitation(inv.invitationId)">拒绝</ElButton>
            </div>
          </div>
        </ElCard>
      </div>
    </div>

    <!-- Tabs: Owned / Joined -->
    <ElTabs v-model="activeTab">
      <ElTabPane label="我创建的组" name="owned">
        <div class="mb-4 flex justify-between items-center">
          <span class="text-sm text-gray-500">共 {{ ownedGroups.length }} 个组</span>
          <ElButton type="primary" @click="showCreateDialog = true">创建组</ElButton>
        </div>
        <ElTable :data="ownedGroups" stripe @row-click="(row: any) => openDetail(row)" style="cursor: pointer">
          <ElTableColumn prop="groupName" label="组名称" />
          <ElTableColumn prop="groupCode" label="组代码" />
          <ElTableColumn label="角色">
            <template #default><ElTag type="success">OWNER</ElTag></template>
          </ElTableColumn>
        </ElTable>
      </ElTabPane>
      <ElTabPane label="我加入的组" name="joined">
        <div class="mb-4">
          <span class="text-sm text-gray-500">共 {{ joinedGroups.length }} 个组</span>
        </div>
        <ElTable :data="joinedGroups" stripe @row-click="(row: any) => openDetail(row)" style="cursor: pointer">
          <ElTableColumn prop="groupName" label="组名称" />
          <ElTableColumn prop="groupCode" label="组代码" />
          <ElTableColumn label="角色">
            <template #default><ElTag>MEMBER</ElTag></template>
          </ElTableColumn>
        </ElTable>
      </ElTabPane>
    </ElTabs>

    <!-- Create Group Dialog -->
    <ElDialog v-model="showCreateDialog" title="创建组" width="400px">
      <ElForm ref="createFormRef" :model="createForm" :rules="createRules">
        <ElFormItem prop="name" label="组名称">
          <ElInput v-model="createForm.name" placeholder="请输入组名称" />
        </ElFormItem>
        <ElFormItem prop="description" label="描述">
          <ElInput v-model="createForm.description" type="textarea" placeholder="可选" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showCreateDialog = false">取消</ElButton>
        <ElButton type="primary" @click="handleCreateGroup" :loading="creating">创建</ElButton>
      </template>
    </ElDialog>

    <!-- Group Detail Drawer -->
    <ElDrawer v-model="showDetailDrawer" :title="detailGroup?.groupName ?? '组详情'" size="400px">
      <div v-if="detailGroup">
        <p class="mb-4 text-sm text-gray-500">组代码: {{ detailGroup.groupCode }}</p>

        <h5 class="mb-2 font-semibold">成员列表</h5>
        <ElTable :data="detailMembers" size="small" stripe>
          <ElTableColumn prop="displayName" label="姓名" />
          <ElTableColumn prop="userCode" label="代码" />
          <ElTableColumn prop="role" label="角色">
            <template #default="{ row }">
              <ElTag :type="row.role === 'OWNER' ? 'success' : ''" size="small">{{ row.role }}</ElTag>
            </template>
          </ElTableColumn>
        </ElTable>

        <div v-if="detailGroupRelation === 'MEMBER'" class="mt-4">
          <ElButton type="danger" size="small" @click="handleLeaveGroup">退出组</ElButton>
        </div>
      </div>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useDdragGroupStore } from '@/store/modules/ddrag-group'
import {
  fetchGroups,
  createGroup,
  acceptInvitation,
  rejectInvitation,
  fetchGroupMembers,
  leaveGroup,
} from '@/api/ddrag/group'
import type { GroupItem, PendingInvitationItem, GroupMemberItem } from '@/types/ddrag'

defineOptions({ name: 'DdragGroups' })

const groupStore = useDdragGroupStore()

const activeTab = ref('owned')
const ownedGroups = ref<GroupItem[]>([])
const joinedGroups = ref<GroupItem[]>([])
const pendingInvitations = ref<PendingInvitationItem[]>([])

const showCreateDialog = ref(false)
const createFormRef = ref<FormInstance>()
const creating = ref(false)
const createForm = reactive({ name: '', description: '' })
const createRules: FormRules = { name: [{ required: true, message: '请输入组名称', trigger: 'blur' }] }

const showDetailDrawer = ref(false)
const detailGroup = ref<GroupItem | null>(null)
const detailGroupRelation = ref<'OWNER' | 'MEMBER'>('OWNER')
const detailMembers = ref<GroupMemberItem[]>([])

onMounted(async () => {
  const result = await fetchGroups()
  ownedGroups.value = result.ownedGroups
  joinedGroups.value = result.joinedGroups
  pendingInvitations.value = result.pendingInvitations
  groupStore.setGroupCollections(result)
})

const openDetail = (group: GroupItem) => {
  detailGroup.value = group
  detailGroupRelation.value = ownedGroups.value.some((g) => g.groupId === group.groupId) ? 'OWNER' : 'MEMBER'
  fetchGroupMembers(group.groupId).then((members) => {
    detailMembers.value = members
  })
  groupStore.setCurrentGroupId(group.groupId)
  showDetailDrawer.value = true
}

const handleCreateGroup = async () => {
  const valid = await createFormRef.value?.validate()
  if (!valid) return
  creating.value = true
  try {
    await createGroup(createForm)
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    createForm.name = ''
    createForm.description = ''
    const result = await fetchGroups()
    ownedGroups.value = result.ownedGroups
    joinedGroups.value = result.joinedGroups
  } finally {
    creating.value = false
  }
}

const handleAcceptInvitation = async (invitationId: number) => {
  await acceptInvitation(invitationId)
  ElMessage.success('已接受邀请')
  pendingInvitations.value = pendingInvitations.value.filter((i) => i.invitationId !== invitationId)
  const result = await fetchGroups()
  joinedGroups.value = result.joinedGroups
}

const handleRejectInvitation = async (invitationId: number) => {
  await rejectInvitation(invitationId)
  ElMessage.success('已拒绝邀请')
  pendingInvitations.value = pendingInvitations.value.filter((i) => i.invitationId !== invitationId)
}

const handleLeaveGroup = async () => {
  if (!detailGroup.value) return
  await leaveGroup(detailGroup.value.groupId)
  ElMessage.success('已退出组')
  showDetailDrawer.value = false
  const result = await fetchGroups()
  joinedGroups.value = result.joinedGroups
}
</script>