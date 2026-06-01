import type { AppRouteRecord } from '@/types/router'

export const ddragRoutes: AppRouteRecord[] = [
  {
    path: '/groups',
    name: 'DdragGroups',
    component: '/ddrag/groups/index',
    meta: {
      title: '知识库',
      icon: 'ri:book-open-line',
      roles: ['USER'],
      requiresAuth: true,
    },
  },
  {
    path: '/documents',
    name: 'DdragDocuments',
    component: '/ddrag/documents/index',
    meta: {
      title: '文档中心',
      icon: 'ri:folder-3-line',
      roles: ['USER'],
      requiresAuth: true,
    },
  },
  {
    path: '/qa',
    name: 'DdragQa',
    component: '/ddrag/qa/index',
    meta: {
      title: '智能检索',
      icon: 'ri:search-eye-line',
      roles: ['USER'],
      requiresAuth: true,
    },
  },
  {
    path: '/assistant',
    name: 'DdragAssistant',
    component: '/ddrag/assistant/index',
    meta: {
      title: '智能助手',
      icon: 'ri:robot-2-line',
      roles: ['USER'],
      requiresAuth: true,
      noKeepAlive: true,
    },
  },
  {
    path: '/change/log',
    name: 'ChangeLog',
    component: '/change/log',
    meta: {
      title: '更新日志',
      icon: 'ri:gamepad-line',
      showTextBadge: `v${__APP_VERSION__}`,
    },
  },
  {
    path: '/user-center',
    name: 'DdragUserCenter',
    component: '/system/user-center/index',
    meta: {
      title: '个人中心',
      icon: 'ri:user-3-line',
      requiresAuth: true,
      isHide: true,
      isHideTab: true,
    },
  },
  {
    path: '/management',
    name: 'DdragManagement',
    component: '/index/index',
    redirect: '/management/overview',
    meta: {
      title: '系统管理',
      icon: 'ri:settings-3-line',
      roles: ['ADMIN'],
      requiresAuth: true,
    },
    children: [
      {
        path: 'overview',
        name: 'DdragManagementOverview',
        component: '/ddrag/management/overview/index',
        meta: {
          title: '管理概览',
          icon: 'ri:dashboard-line',
          roles: ['ADMIN'],
          requiresAuth: true,
        },
      },
      {
        path: 'users',
        name: 'DdragManagementUsers',
        component: '/ddrag/management/users/index',
        meta: {
          title: '用户管理',
          icon: 'ri:user-line',
          roles: ['ADMIN'],
          requiresAuth: true,
        },
      },
    ],
  },
]