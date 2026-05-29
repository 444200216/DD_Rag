<template>
  <div class="p-6">
    <h3 class="mb-4 text-lg font-semibold">用户管理</h3>
    <ElTable v-loading="loading" :data="users" stripe>
      <ElTableColumn prop="username" label="用户名" width="150" />
      <ElTableColumn prop="displayName" label="显示名称" width="150" />
      <ElTableColumn prop="email" label="邮箱" width="200" />
      <ElTableColumn prop="systemRole" label="角色" width="100">
        <template #default="{ row }">
          <ElTag :type="row.systemRole === 'ADMIN' ? 'danger' : ''" size="small">{{ row.systemRole }}</ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="status" label="状态" width="100">
        <template #default="{ row }">
          <ElTag :type="row.status === 'ACTIVE' ? 'success' : 'danger'" size="small">{{ row.status }}</ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="lastLoginAt" label="最后登录" width="180">
        <template #default="{ row }">{{ row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString('zh-CN') : '从未登录' }}</template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="200">
        <template #default="{ row }">
          <ElButton size="small" @click="$router.push(`/management/users/${row.userId}`)">详情</ElButton>
          <ElButton v-if="row.status === 'ACTIVE'" size="small" type="danger" @click="handleToggleStatus(row, 'DISABLED')">禁用</ElButton>
          <ElButton v-if="row.status === 'DISABLED'" size="small" type="success" @click="handleToggleStatus(row, 'ACTIVE')">启用</ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchAdminUsers, updateAdminUserStatus } from '@/api/ddrag/admin-user'
import type { AdminUserItem, UserStatus } from '@/types/ddrag'

defineOptions({ name: 'DdragManagementUsers' })

const loading = ref(false)
const users = ref<AdminUserItem[]>([])

onMounted(async () => {
  loading.value = true
  try { users.value = await fetchAdminUsers() } finally { loading.value = false }
})

const handleToggleStatus = async (user: AdminUserItem, newStatus: UserStatus) => {
  await updateAdminUserStatus(user.userId, newStatus)
  user.status = newStatus
  ElMessage.success(`用户 ${user.displayName} 已${newStatus === 'ACTIVE' ? '启用' : '禁用'}`)
}