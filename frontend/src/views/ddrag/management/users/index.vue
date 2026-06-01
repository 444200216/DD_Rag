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
    />

    <!-- 表格区域 -->
    <ElCard class="flex-1 art-table-card" style="margin-top: 0">
      <template #header>
        <div class="flex-cb">
          <h4 class="m-0">用户管理</h4>
          <div class="flex gap-2">
            <ElTag v-if="loading" type="warning">加载中...</ElTag>
            <ElTag v-else type="success">{{ filteredUsers.length }} 条数据</ElTag>
          </div>
        </div>
      </template>

      <!-- 表格工具栏 -->
      <ArtTableHeader
        v-model:columns="columnChecks"
        :loading="loading"
        @refresh="loadUsers"
        layout="refresh,size,fullscreen,columns,settings"
        fullClass="art-table-card"
      >
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" @click="loadUsers" v-ripple>
              <ElIcon><Refresh /></ElIcon>
              刷新数据
            </ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <!-- 数据表格 -->
      <ArtTable
        :loading="loading"
        :data="filteredUsers"
        :columns="columns"
        rowKey="userId"
      >
        <template #systemRole="{ row }">
          <ElTag :type="row.systemRole === 'ADMIN' ? 'danger' : 'info'" size="small">{{ row.systemRole === 'ADMIN' ? '管理员' : '普通用户' }}</ElTag>
        </template>
        <template #status="{ row }">
          <ElTag :type="row.status === 'ACTIVE' ? 'success' : 'danger'" size="small">{{ row.status === 'ACTIVE' ? '正常' : '禁用' }}</ElTag>
        </template>
        <template #operation="{ row }">
          <div class="flex">
            <ArtButtonTable :row="row" icon="ri:user-line" @click="openDetail(row)" />
            <ArtButtonTable v-if="row.status === 'ACTIVE'" :row="row" icon="ri:forbid-line" iconColor="#e6a23c" buttonBgColor="#fdf6ec" @click="handleToggleStatus(row, 'DISABLED')" />
            <ArtButtonTable v-if="row.status === 'DISABLED'" :row="row" icon="ri:check-line" iconColor="#67c23a" buttonBgColor="#f0f9eb" @click="handleToggleStatus(row, 'ACTIVE')" />
          </div>
        </template>
      </ArtTable>
    </ElCard>

    <!-- 用户详情 Drawer -->
    <ElDrawer v-model="showDetail" title="用户详情" size="420px">
      <template v-if="detailUser">
        <!-- 头部：头像 + 名称 + 状态 -->
        <div class="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-6 pb-6 pt-14 text-center text-white">
          <div class="mx-auto w-16 h-16 rounded-full bg-white flex items-center justify-center text-2xl font-bold text-blue-500 shadow-md">
            {{ detailUser.displayName.charAt(0) }}
          </div>
          <h3 class="mt-3 text-lg font-semibold">{{ detailUser.displayName }}</h3>
          <p class="mt-1 text-sm opacity-80">@{{ detailUser.username }}</p>
          <ElTag class="mt-2" :type="detailUser.status === 'ACTIVE' ? 'success' : 'danger'" size="small" effect="dark">{{ detailUser.status === 'ACTIVE' ? '正常' : '禁用' }}</ElTag>
        </div>

        <!-- 信息行 -->
        <div class="mt-5 space-y-3">
          <div class="flex items-center gap-2 px-1">
            <ArtSvgIcon icon="ri:mail-line" class="text-g-700" />
            <span class="text-sm">{{ detailUser.email }}</span>
          </div>
          <div class="flex items-center gap-2 px-1">
            <ArtSvgIcon icon="ri:shield-user-line" class="text-g-700" />
            <ElTag :type="detailUser.systemRole === 'ADMIN' ? 'danger' : 'info'" size="small">{{ detailUser.systemRole === 'ADMIN' ? '管理员' : '普通用户' }}</ElTag>
          </div>
          <div class="flex items-center gap-2 px-1">
            <ArtSvgIcon icon="ri:barcode-line" class="text-g-700" />
            <span class="text-sm">{{ detailUser.userCode }}</span>
          </div>
          <div class="flex items-center gap-2 px-1">
            <ArtSvgIcon icon="ri:lock-line" class="text-g-700" />
            <span class="text-sm">{{ detailUser.mustChangePassword ? '需修改密码' : '密码已设置' }}</span>
          </div>
          <div class="flex items-center gap-2 px-1">
            <ArtSvgIcon icon="ri:time-line" class="text-g-700" />
            <span class="text-sm">{{ detailUser.lastLoginAt ? new Date(detailUser.lastLoginAt).toLocaleString('zh-CN') : '从未登录' }}</span>
          </div>
        </div>
      </template>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { useTableColumns } from '@/hooks/core/useTableColumns'
import { fetchAdminUsers, fetchAdminUserDetail, updateAdminUserStatus } from '@/api/ddrag/admin-user'
import type { AdminUserItem, UserStatus } from '@/types/ddrag'

defineOptions({ name: 'DdragManagementUsers' })

const loading = ref(false)
const users = ref<AdminUserItem[]>([])
const showDetail = ref(false)
const detailUser = ref<AdminUserItem | null>(null)

// 搜索表单
const searchFormState = ref({
  username: '',
  systemRole: null as string | null,
  status: null as string | null
})

const searchItems = computed(() => [
  {
    key: 'username',
    label: '用户名',
    type: 'input',
    props: { placeholder: '请输入用户名', clearable: true },
    span: 6
  },
  {
    key: 'systemRole',
    label: '角色',
    type: 'select',
    clearable: true,
    placeholder: '请选择角色',
    options: [
      { label: '管理员', value: 'ADMIN' },
      { label: '普通用户', value: 'USER' }
    ],
    span: 6
  },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    clearable: true,
    placeholder: '请选择状态',
    options: [
      { label: '正常', value: 'ACTIVE' },
      { label: '禁用', value: 'DISABLED' }
    ],
    span: 6
  }
])

// 列配置（useTableColumns 提供列勾选、拖拽排序能力）
const { columns, columnChecks } = useTableColumns<AdminUserItem>(() => [
  { type: 'globalIndex' as const, width: 60, label: '序号' },
  { prop: 'username', label: '用户名', width: 150 },
  { prop: 'displayName', label: '显示名称', minWidth: 150 },
  { prop: 'email', label: '邮箱', minWidth: 200 },
  { prop: 'systemRole', label: '角色', width: 100, useSlot: true },
  { prop: 'status', label: '状态', width: 100, useSlot: true },
  { prop: 'lastLoginAt', label: '最后登录', width: 180, formatter: (row: AdminUserItem) => row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString('zh-CN') : '从未登录' },
  { prop: 'operation', label: '操作', width: 190, useSlot: true, fixed: 'right' }
])

// 过滤用户
const filteredUsers = computed(() => {
  let result = users.value
  if (searchFormState.value.username) {
    const keyword = searchFormState.value.username.toLowerCase()
    result = result.filter(u => u.username.toLowerCase().includes(keyword) || u.displayName.toLowerCase().includes(keyword))
  }
  if (searchFormState.value.systemRole) {
    result = result.filter(u => u.systemRole === searchFormState.value.systemRole)
  }
  if (searchFormState.value.status) {
    result = result.filter(u => u.status === searchFormState.value.status)
  }
  return result
})

onMounted(loadUsers)

async function loadUsers() {
  loading.value = true
  try { users.value = await fetchAdminUsers() } finally { loading.value = false }
}

const handleSearch = () => {
  // 前端过滤，无需重新请求
}

const handleReset = () => {
  searchFormState.value = { username: '', systemRole: null, status: null }
}

function openDetail(user: AdminUserItem) {
  detailUser.value = user
  showDetail.value = true
  fetchAdminUserDetail(user.userId).then((u: AdminUserItem) => detailUser.value = u)
}

const handleToggleStatus = async (user: AdminUserItem, newStatus: UserStatus) => {
  await updateAdminUserStatus(user.userId, newStatus)
  user.status = newStatus
  if (detailUser.value?.userId === user.userId) detailUser.value.status = newStatus
  ElMessage.success(`用户 ${user.displayName} 已${newStatus === 'ACTIVE' ? '启用' : '禁用'}`)
}
</script>