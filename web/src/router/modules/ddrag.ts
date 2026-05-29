import type { AppRouteRecord } from '@/types/router'

export const ddragRoutes: AppRouteRecord[] = [
  {
    path: '/groups',
    name: 'DdragGroups',
    component: '/ddrag/groups/index',
    meta: {
      title: '我的组',
      icon: 'ri:team-line',
      roles: ['USER', 'ADMIN'],
      requiresAuth: true,
    },
  },
  {
    path: '/documents',
    name: 'DdragDocuments',
    component: '/ddrag/documents/index',
    meta: {
      title: '文档管理',
      icon: 'ri:folder-3-line',
      roles: ['USER', 'ADMIN'],
      requiresAuth: true,
    },
  },
  {
    path: '/qa',
    name: 'DdragQa',
    component: '/ddrag/qa/index',
    meta: {
      title: '知识问答',
      icon: 'ri:question-answer-line',
      roles: ['USER', 'ADMIN'],
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
      roles: ['USER', 'ADMIN'],
      requiresAuth: true,
      noKeepAlive: true,
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
      {
        path: 'users/:userId',
        name: 'DdragManagementUserDetail',
        component: '/ddrag/management/user-detail/index',
        meta: {
          title: '用户详情',
          roles: ['ADMIN'],
          requiresAuth: true,
          hidden: true,
        },
      },
    ],
  },
]