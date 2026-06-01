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
          <h4 class="m-0">知识库</h4>
          <div class="flex gap-2">
            <ElButton type="primary" size="small" @click="openCreateDrawer" v-ripple>创建知识库</ElButton>
          </div>
        </div>
      </template>

      <ElTabs v-model="activeTab">
        <ElTabPane label="我创建的" name="owned">
          <ArtTable :data="ownedGroups" :columns="ownedColumns" rowKey="groupId">
            <template #role>
              <ElTag type="success">所有者</ElTag>
            </template>
            <template #operation="{ row }">
              <div class="flex">
                <ArtButtonTable type="view" :row="row" @click="openDetail(row, 'OWNER')" />
              </div>
            </template>
          </ArtTable>
        </ElTabPane>
        <ElTabPane label="我加入的" name="joined">
          <ArtTable :data="joinedGroups" :columns="joinedColumns" rowKey="groupId">
            <template #role>
              <ElTag type="info">成员</ElTag>
            </template>
            <template #operation="{ row }">
              <div class="flex">
                <ArtButtonTable type="view" :row="row" @click="openDetail(row, 'MEMBER')" />
              </div>
            </template>
          </ArtTable>
        </ElTabPane>
      </ElTabs>
    </ElCard>

    <!-- Group Detail Drawer -->
    <ElDrawer v-model="showDetail" title="知识库详情" size="400px">
      <p>知识库名称: {{ detailGroup?.groupName }}</p>
      <p>知识库代码: {{ detailGroup?.groupCode }}</p>

      <!-- 邀请成员（仅所有者） -->
      <template v-if="detailRole === 'OWNER'">
        <ElDivider content-position="left">邀请成员</ElDivider>
        <div class="flex gap-2 mb-3">
          <ElInput
            v-model="detailInviteCode"
            placeholder="输入用户账号"
            :disabled="detailInviteLookingUp"
            class="flex-1"
            @keyup.enter="detailLookupAndInvite"
          />
          <ElButton type="primary" @click="detailLookupAndInvite" :loading="detailInviteLookingUp" :disabled="!detailInviteCode.trim()">
            邀请
          </ElButton>
        </div>
        <ElAlert v-if="detailInviteMsg" :title="detailInviteMsg" :type="detailInviteMsgType" :closable="true" @close="detailInviteMsg = ''" class="mb-3" />
      </template>

      <ElDivider content-position="left">成员</ElDivider>
      <ArtTable :data="detailMembers" :columns="memberColumns" rowKey="userId" />
      <ElButton v-if="detailRole === 'MEMBER'" type="danger" class="mt-3" @click="handleLeaveGroup">退出知识库</ElButton>
    </ElDrawer>

    <!-- Create group drawer -->
    <ElDrawer v-model="showCreateDrawer" title="创建知识库" size="400px" :close-on-click-modal="false">
      <ElForm :model="createForm" :rules="createRules" ref="createFormRef" label-position="top">
        <ElFormItem label="知识库名称" prop="name">
          <ElInput v-model="createForm.name" placeholder="请输入知识库名称" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput v-model="createForm.description" type="textarea" placeholder="请输入描述（可选）" :rows="3" />
        </ElFormItem>

        <!-- 邀请成员 -->
        <ElDivider content-position="left">邀请成员</ElDivider>
        <div class="mb-2 text-xs text-g-500">输入用户账号邀请成员加入知识库，可跳过此步骤创建后邀请。</div>
        <div class="flex gap-2 mb-3">
          <ElInput
            v-model="inviteUserCode"
            placeholder="输入用户账号"
            :disabled="inviteLookingUp"
            class="flex-1"
            @keyup.enter="lookupAndAddInvitee"
          />
          <ElButton type="primary" @click="lookupAndAddInvitee" :loading="inviteLookingUp" :disabled="!inviteUserCode.trim()">
            查找
          </ElButton>
        </div>
        <div v-if="invitees.length > 0" class="space-y-2">
          <div v-for="(inv, idx) in invitees" :key="idx" class="flex-cb rounded bg-g-300/60 px-3 py-2">
            <div class="flex-c gap-2 text-sm">
              <span class="font-medium">{{ inv.displayName }}</span>
              <span class="text-g-500">{{ inv.userCode }}</span>
            </div>
            <ElButton type="danger" text size="small" @click="invitees.splice(idx, 1)">
              <ElIcon><Close /></ElIcon>
            </ElButton>
          </div>
        </div>
        <ElAlert v-if="inviteLookupError" :title="inviteLookupError" type="error" :closable="true" @close="inviteLookupError = ''" class="mt-2" />
      </ElForm>
      <template #footer>
        <ElButton @click="closeCreateDrawer">取消</ElButton>
        <ElButton type="primary" @click="handleCreate" :loading="creating">创建</ElButton>
      </template>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Close } from '@element-plus/icons-vue'
import { fetchGroups, createGroup, acceptInvitation, rejectInvitation, fetchGroupMembers, leaveGroup, createInvitation, lookupUserByCode } from '@/api/ddrag/group'
import type { GroupItem, GroupQueryResult, PendingInvitationItem, GroupMemberItem, CreateGroupPayload, UserLookupResult } from '@/types/ddrag'
import type { ColumnOption } from '@/types/component'

defineOptions({ name: 'DdragGroups' })

const activeTab = ref('owned')
const showCreateDrawer = ref(false)
const showDetail = ref(false)
const detailGroup = ref<GroupItem | null>(null)
const detailRole = ref<'OWNER' | 'MEMBER'>('MEMBER')
const detailMembers = ref<GroupMemberItem[]>([])
const detailInviteCode = ref('')
const detailInviteLookingUp = ref(false)
const detailInviteMsg = ref('')
const detailInviteMsgType = ref<'success' | 'error'>('success')
const pendingInvitations = ref<PendingInvitationItem[]>([])
const ownedGroups = ref<GroupItem[]>([])
const joinedGroups = ref<GroupItem[]>([])

const ownedColumns: ColumnOption<GroupItem>[] = [
  { type: 'globalIndex' as const, width: 60, label: '序号' },
  { prop: 'groupName', label: '知识库名称', minWidth: 160 },
  { prop: 'groupCode', label: '知识库代码', minWidth: 120 },
  { prop: 'role', label: '角色', width: 100, useSlot: true },
  { prop: 'operation', label: '操作', width: 100, useSlot: true, fixed: 'right' },
]

const joinedColumns: ColumnOption<GroupItem>[] = [
  { type: 'globalIndex' as const, width: 60, label: '序号' },
  { prop: 'groupName', label: '知识库名称', minWidth: 160 },
  { prop: 'groupCode', label: '知识库代码', minWidth: 120 },
  { prop: 'role', label: '角色', width: 100, useSlot: true },
  { prop: 'operation', label: '操作', width: 100, useSlot: true, fixed: 'right' },
]

const memberColumns: ColumnOption<GroupMemberItem>[] = [
  { prop: 'displayName', label: '成员', minWidth: 120 },
  { prop: 'role', label: '角色', width: 100 },
]

// Create form
const createForm = reactive<CreateGroupPayload>({ name: '', description: '' })
const createFormRef = ref()
const createRules = {
  name: [{ required: true, message: '请输入知识库名称', trigger: 'blur' }]
}
const creating = ref(false)

// Invitation
const inviteUserCode = ref('')
const inviteLookingUp = ref(false)
const inviteLookupError = ref('')
const invitees = ref<UserLookupResult[]>([])

onMounted(() => loadGroups())

async function loadGroups() {
  const result: GroupQueryResult = await fetchGroups()
  ownedGroups.value = result.ownedGroups
  joinedGroups.value = result.joinedGroups
  pendingInvitations.value = result.pendingInvitations || []
}

function openDetail(group: GroupItem, role: 'OWNER' | 'MEMBER') {
  detailGroup.value = group
  detailRole.value = role
  detailInviteCode.value = ''
  detailInviteMsg.value = ''
  showDetail.value = true
  fetchGroupMembers(group.groupId).then((m: GroupMemberItem[]) => detailMembers.value = m)
}

async function detailLookupAndInvite() {
  if (!detailInviteCode.value.trim() || !detailGroup.value) return
  detailInviteLookingUp.value = true
  detailInviteMsg.value = ''
  try {
    const user = await lookupUserByCode(detailInviteCode.value.trim())
    await createInvitation(detailGroup.value.groupId, user.userId)
    detailInviteMsgType.value = 'success'
    detailInviteMsg.value = `已向 ${user.displayName}(${user.userCode}) 发送邀请`
    detailInviteCode.value = ''
    await fetchGroupMembers(detailGroup.value.groupId).then((m: GroupMemberItem[]) => detailMembers.value = m)
  } catch (e: any) {
    detailInviteMsgType.value = 'error'
    detailInviteMsg.value = e.message || '邀请失败'
  } finally {
    detailInviteLookingUp.value = false
  }
}

function openCreateDrawer() {
  createForm.name = ''
  createForm.description = ''
  inviteUserCode.value = ''
  inviteLookupError.value = ''
  invitees.value = []
  showCreateDrawer.value = true
}

function closeCreateDrawer() {
  showCreateDrawer.value = false
}

async function lookupAndAddInvitee() {
  if (!inviteUserCode.value.trim()) return
  inviteLookingUp.value = true
  inviteLookupError.value = ''
  try {
    const user = await lookupUserByCode(inviteUserCode.value.trim())
    if (invitees.value.some(i => i.userCode === user.userCode)) {
      inviteLookupError.value = `用户 ${user.userCode} 已在邀请列表中`
      return
    }
    invitees.value.push(user)
    inviteUserCode.value = ''
  } catch (e: any) {
    inviteLookupError.value = e.message || '查找用户失败'
  } finally {
    inviteLookingUp.value = false
  }
}

async function handleCreate() {
  await createFormRef.value?.validate()
  creating.value = true
  try {
    const groupId = await createGroup(createForm)
    // Send invitations to added invitees
    for (const inv of invitees.value) {
      try {
        await createInvitation(groupId, inv.userId)
      } catch {
        // Skip individual invitation errors — group is already created
      }
    }
    ElMessage.success(invitees.value.length > 0
      ? `创建成功，已向 ${invitees.value.length} 位用户发送邀请`
      : '创建成功')
    showCreateDrawer.value = false
    await loadGroups()
  } finally {
    creating.value = false
  }
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
  ElMessage.success('已退出知识库')
  showDetail.value = false
  await loadGroups()
}
</script>