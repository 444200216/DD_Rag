<template>
  <div class="p-6">
    <ElButton @click="$router.push('/management/users')" class="mb-4">返回用户列表</ElButton>
    <ElCard v-loading="loading">
      <ElDescriptions :column="2" border>
        <ElDescriptionsItem label="用户名">{{ user?.username }}</ElDescriptionsItem>
        <ElDescriptionsItem label="显示名称">{{ user?.displayName }}</ElDescriptionsItem>
        <ElDescriptionsItem label="邮箱">{{ user?.email }}</ElDescriptionsItem>
        <ElDescriptionsItem label="代码">{{ user?.userCode }}</ElDescriptionsItem>
        <ElDescriptionsItem label="系统角色">
          <ElTag :type="user?.systemRole === 'ADMIN' ? 'danger' : ''">{{ user?.systemRole }}</ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="状态">
          <ElTag :type="user?.status === 'ACTIVE' ? 'success' : 'danger'">{{ user?.status }}</ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="需改密码">{{ user?.mustChangePassword ? '是' : '否' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="最后登录">{{ user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('zh-CN') : '从未登录' }}</ElDescriptionsItem>
      </ElDescriptions>
      <div class="mt-4">
        <ElButton v-if="user?.status === 'ACTIVE'" type="danger" @click="handleToggleStatus('DISABLED')">禁用用户</ElButton>
        <ElButton v-if="user?.status === 'DISABLED'" type="success" @click="handleToggleStatus('ACTIVE')">启用用户</ElButton>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchAdminUserDetail, updateAdminUserStatus } from '@/api/ddrag/admin-user'
import type { AdminUserItem, UserStatus } from '@/types/ddrag'

defineOptions({ name: 'DdragManagementUserDetail' })

const route = useRoute()
const userId = Number(route.params.userId)
const loading = ref(false)
const user = ref<AdminUserItem | null>(null)

onMounted(async () => {
  loading.value = true
  try { user.value = await fetchAdminUserDetail(userId) } finally { loading.value = false }
})

const handleToggleStatus = async (newStatus: UserStatus) => {
  await ElMessageBox.confirm(`确定${newStatus === 'ACTIVE' ? '启用' : '禁用'}用户 ${user.value?.displayName}？`, '确认')
  await updateAdminUserStatus(userId, newStatus)
  if (user.value) user.value.status = newStatus
  ElMessage.success('操作成功')
}