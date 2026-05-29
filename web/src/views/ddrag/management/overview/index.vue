<template>
  <div class="p-6">
    <h3 class="mb-6 text-lg font-semibold">管理概览</h3>
    <div class="grid grid-cols-3 gap-6 mb-8">
      <ElCard shadow="hover">
        <div class="text-center">
          <p class="text-3xl font-bold text-blue-600">{{ stats.totalUsers }}</p>
          <p class="mt-2 text-sm text-gray-500">总用户数</p>
        </div>
      </ElCard>
      <ElCard shadow="hover">
        <div class="text-center">
          <p class="text-3xl font-bold text-green-600">{{ stats.activeUsers }}</p>
          <p class="mt-2 text-sm text-gray-500">活跃用户</p>
        </div>
      </ElCard>
      <ElCard shadow="hover">
        <div class="text-center">
          <p class="text-3xl font-bold text-orange-600">{{ stats.newUsersThisWeek }}</p>
          <p class="mt-2 text-sm text-gray-500">本周新增</p>
        </div>
      </ElCard>
    </div>
    <ElCard shadow="hover">
      <h4 class="mb-4 font-semibold">用户注册趋势</h4>
      <div class="h-64 flex items-center justify-center text-gray-400">
        <!-- Placeholder: will use ArtBarChartCard in polish phase -->
        <p>图表区域 (ECharts/ArtBarChartCard 待实现)</p>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchAdminUsers } from '@/api/ddrag/admin-user'

defineOptions({ name: 'DdragManagementOverview' })

const stats = ref({ totalUsers: 0, activeUsers: 0, newUsersThisWeek: 0 })

onMounted(async () => {
  const users = await fetchAdminUsers()
  stats.value = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status === 'ACTIVE').length,
    newUsersThisWeek: 2,
  }
})