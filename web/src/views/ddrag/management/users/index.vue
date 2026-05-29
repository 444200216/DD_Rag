<template>
  <div class="art-full-height flex flex-col gap-4">
    <!-- Table Card -->
    <ElCard class="flex-1 art-table-card" style="margin-top: 0">
      <template #header>
        <div class="flex-cb">
          <h4 class="m-0">用户管理</h4>
          <div class="flex gap-2">
            <ElTag v-if="loading" type="warning">加载中...</ElTag>
            <ElTag v-else type="success">{{ users.length }} 条数据</ElTag>
          </div>
        </div>
      </template>

      <!-- Toolbar -->
      <ArtTableHeader
        :loading="loading"
        @refresh="loadUsers"
        layout="refresh,size,fullscreen,columns,settings"
        fullClass="art-table-card"
      >
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" @click="$router.push('/management/users')" v-ripple>刷新数据</ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <!-- Table -->
      <ArtTable
        :loading="loading"
        :data="users"
        :columns="columns"
        rowKey="userId"
      >
        <template #systemRole="{ row }">
          <ElTag :type="row.systemRole === 'ADMIN' ? 'danger' : 'info'" size="small">{{ row.systemRole }}</ElTag>
        </template>
        <template #status="{ row }">
          <ElTag :type="row.status === 'ACTIVE' ? 'success' : 'danger'" size="small">{{ row.status }}</ElTag>
        </template>
        <template #operation="{ row }">
          <div class="flex">
            <ArtButtonTable type="view" :row="row" @click="$router.push(`/management/users/${row.userId}`)" />
            <ArtButtonTable v-if="row.status === 'ACTIVE'" type="edit" :row="row" @click="handleToggleStatus(row, 'DISABLED')" />
            <ArtButtonTable v-if="row.status === 'DISABLED'" type="edit" :row="row" @click="handleToggleStatus(row, 'ACTIVE')" />
          </div>
        </template>
      </ArtTable>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchAdminUsers, updateAdminUserStatus } from '@/api/ddrag/admin-user'
import type { AdminUserItem, UserStatus } from '@/types/ddrag'
import type { ColumnOption } from '@/types/component'

defineOptions({ name: 'DdragManagementUsers' })

const loading = ref(false)
const users = ref<AdminUserItem[]>([])

const columns: ColumnOption<AdminUserItem>[] = [
  { type: 'globalIndex' as const, width: 60, label: '序号' },
  { prop: 'username', label: '用户名', width: 150 },
  { prop: 'displayName', label: '显示名称', width: 150 },
  { prop: 'email', label: '邮箱', width: 200 },
  { prop: 'systemRole', label: '角色', width: 100, useSlot: true },
  { prop: 'status', label: '状态', width: 100, useSlot: true },
  { prop: 'lastLoginAt', label: '最后登录', width: 180, formatter: (row: AdminUserItem) => row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString('zh-CN') : '从未登录' },
  { prop: 'operation', label: '操作', width: 190, useSlot: true, fixed: 'right' },
]

onMounted(loadUsers)

async function loadUsers() {
  loading.value = true
  try { users.value = await fetchAdminUsers() } finally { loading.value = false }
}

const handleToggleStatus = async (user: AdminUserItem, newStatus: UserStatus) => {
  await updateAdminUserStatus(user.userId, newStatus)
  user.status = newStatus
  ElMessage.success(`用户 ${user.displayName} 已${newStatus === 'ACTIVE' ? '启用' : '禁用'}`)
}
</script>