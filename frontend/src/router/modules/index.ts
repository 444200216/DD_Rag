import { ddragRoutes } from './ddrag'
import { referenceRoutes } from './reference'
import type { AppRouteRecord } from '@/types/router'

/**
 * 导出所有模块化路由
 *
 * 业务路由（知识库、文档中心、智能检索、智能助手）仅 USER 可见；
 * 系统管理仅 ADMIN 可见；更新日志、参考页面对所有角色可见。
 */
export const routeModules: AppRouteRecord[] = [
  ...ddragRoutes,
  referenceRoutes,
]