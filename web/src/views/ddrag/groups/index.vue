<template>
  <div class="art-full-height flex flex-col gap-4">
    <!-- Pending invitations -->
    <ElCard v-if="pendingInvitations.length > 0" shadow="hover">
      <template #header><span class="font-semibold">待处理邀请</span></template>
      <div v-for="inv in pendingInvitations" :key="inv.invitationId" class="flex items-center justify-between py-2">
        <span>{{ inv.groupName }} (邀请人: {{ inv.inviterDisplayName ?? '未知' }})</span>
        <div>
          <ElButton type="primary" size="small" @click="handleAccept(inv)">接受</ElButton>
          <ElButton size="small" @click="handleReject(inv)">拒绝</ElButton>
        </div>
      </div>
    </ElCard>

    <!-- Groups card -->
    <ElCard class="flex-1 art-table-card" style="margin-top: 0">
      <template #header>
        <div class="flex-cb">
          <h4 class="m-0">我的组</h4>
          <div class="flex gap-2">
            <ElButton type="primary" size="small" @click="showCreateDialog = true" v-ripple>创建组</ElButton>
          </div>
        </div>
      </template>

      <ElTabs v-model="activeTab">
        <ElTabPane label="我创建的组" name="owned">
          <ArtTable :data="ownedGroups" :columns="ownedColumns" rowKey="groupId">
            <template #role>
              <ElTag type="success">OWNER</ElTag>
            </template>
            <template #operation="{ row }">
              <div class="flex">
                <ArtButtonTable type="view" :row="row" @click="openDetail(row)" />
              </div>
            </template>
          </ArtTable>
        </ElTabPane>
        <ElTabPane label="我加入的组" name="joined">
          <ArtTable :data="joinedGroups" :columns="joinedColumns" rowKey="groupId">
            <template #role>
              <ElTag type="info">MEMBER</ElTag>
            </template>
            <template #operation="{ row }">
              <div class="flex">
                <ArtButtonTable type="view" :row="row" @click="openDetail(row)" />
              </div>
            </template>
          </ArtTable>
        </ElTabPane>
      </ElTabs>
    </ElCard>

    <!-- Group Detail Drawer -->
    <ElDrawer v-model="showDetail" title="组详情" size="400px">
      <p>组名称: {{ detailGroup?.groupName }}</p>
      <p>组代码: {{ detailGroup?.groupCode }}</p>
      <h4 class="mt-4 mb-2">成员</h4>
      <ArtTable :data="detailMembers" :columns="memberColumns" rowKey="userId" />
      <ElButton v-if="detailGroup && detailGroup.role !== 'OWNER'" type="danger" @click="handleLeaveGroup">退出组</ElButton>
    </ElDrawer>

    <!-- Create group dialog -->
    <ElDialog v-model="showCreateDialog" title="创建组" width="400px">
      <ElForm :model="createForm" :rules="createRules" ref="createFormRef">
        <ElFormItem label="组名称" prop="name">
          <ElInput v-model="createForm.name" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput v-model="createForm.description" type="textarea" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showCreateDialog = false">取消</ElButton>
        <ElButton type="primary" @click="handleCreate">创建</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchGroups, createGroup, acceptInvitation, rejectInvitation, fetchGroupMembers, leaveGroup } from '@/api/ddrag/group'
import type { GroupItem, GroupQueryResult, PendingInvitationItem, GroupMemberItem, CreateGroupPayload } from '@/types/ddrag'
import type { ColumnOption } from '@/types/component'

defineOptions({ name: 'DdragGroups' })

const activeTab = ref('owned')
const showCreateDialog = ref(false)
const showDetail = ref(false)
const detailGroup = ref<GroupItem | null>(null)
const detailMembers = ref<GroupMemberItem[]>([])
const pendingInvitations = ref<PendingInvitationItem[]>([])
const ownedGroups = ref<GroupItem[]>([])
const joinedGroups = ref<GroupItem[]>([])

const ownedColumns: ColumnOption<GroupItem>[] = [
  { type: 'globalIndex' as const, width: 60, label: '序号' },
  { prop: 'groupName', label: '组名称', minWidth: 160 },
  { prop: 'groupCode', label: '组代码', minWidth: 120 },
  { prop: 'role', label: '角色', width: 100, useSlot: true },
  { prop: 'operation', label: '操作', width: 100, useSlot: true, fixed: 'right' },
]

const joinedColumns: ColumnOption<GroupItem>[] = [
  { type: 'globalIndex' as const, width: 60, label: '序号' },
  { prop: 'groupName', label: '组名称', minWidth: 160 },
  { prop: 'groupCode', label: '组代码', minWidth: 120 },
  { prop: 'role', label: '角色', width: 100, useSlot: true },
  { prop: 'operation', label: '操作', width: 100, useSlot: true, fixed: 'right' },
]

const memberColumns: ColumnOption<GroupMemberItem>[] = [
  { prop: 'displayName', label: '成员', minWidth: 120 },
  { prop: 'role', label: '角色', width: 100 },
]

const createForm = reactive<CreateGroupPayload>({ name: '', description: '' })
const createFormRef = ref()
const createRules = {
  name: [{ required: true, message: '请输入组名称', trigger: 'blur' }]
}

onMounted(() => loadGroups())

async function loadGroups() {
  const result: GroupQueryResult = await fetchGroups()
  ownedGroups.value = result.ownedGroups
  joinedGroups.value = result.joinedGroups
  pendingInvitations.value = result.pendingInvitations || []
}

function openDetail(group: GroupItem) {
  detailGroup.value = group
  showDetail.value = true
  fetchGroupMembers(group.groupId).then((m: GroupMemberItem[]) => detailMembers.value = m)
}

async function handleCreate() {
  await createGroup(createForm)
  ElMessage.success('创建成功')
  showCreateDialog.value = false
  await loadGroups()
}

async function handleAccept(inv: PendingInvitationItem) {
  await acceptInvitation(inv.invitationId)
  await loadGroups()
}

async function handleReject(inv: PendingInvitationItem) {
  await rejectInvitation(inv.invitationId)
  pendingInvitations.value = pendingInvitations.value.filter(i => i !== inv)
}

async function handleLeaveGroup() {
  if (!detailGroup.value) return
  await leaveGroup(detailGroup.value.groupId)
  ElMessage.success('已退出组')
  showDetail.value = false
  await loadGroups()
}
</script>