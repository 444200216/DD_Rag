/**
 * useFastEnter - 快速入口管理
 *
 * 管理顶部栏的快速入口功能，提供应用列表和快速链接的配置和过滤。
 * 支持动态启用/禁用、自定义排序、响应式宽度控制等功能。
 *
 * ## 主要功能
 *
 * 1. 应用列表管理 - 获取启用的应用列表，自动按排序权重排序
 * 2. 快速链接管理 - 获取启用的快速链接，支持自定义排序
 * 3. 响应式配置 - 所有配置自动响应变化，无需手动更新
 * 4. 宽度控制 - 提供最小显示宽度配置，支持响应式布局
 *
 * @module useFastEnter
 * @author Art Design Pro Team
 */

import { computed } from 'vue'
import appConfig from '@/config'
import { useUserStore } from '@/store/modules/user'
import type { FastEnterApplication, FastEnterQuickLink } from '@/types/config'

export function useFastEnter() {
  const userStore = useUserStore()
  const userRoles = computed(() => userStore.info?.roles || [])

  // 获取快速入口配置
  const fastEnterConfig = computed(() => appConfig.fastEnter)

  // 获取启用的应用列表（按排序权重排序，按角色过滤）
  const enabledApplications = computed<FastEnterApplication[]>(() => {
    if (!fastEnterConfig.value?.applications) return []

    return fastEnterConfig.value.applications
      .filter((app) => app.enabled !== false)
      .filter((app) => {
        if (!app.roles) return true
        return app.roles.some((role) => userRoles.value.includes(role))
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  })

  // 获取启用的快速链接（按排序权重排序）
  const enabledQuickLinks = computed<FastEnterQuickLink[]>(() => {
    if (!fastEnterConfig.value?.quickLinks) return []

    return fastEnterConfig.value.quickLinks
      .filter((link) => link.enabled !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  })

  // 获取最小显示宽度
  const minWidth = computed(() => {
    return fastEnterConfig.value?.minWidth || 1200
  })

  return {
    fastEnterConfig,
    enabledApplications,
    enabledQuickLinks,
    minWidth
  }
}
