import type { AppRouteRecord } from '@/types/router'

const ddragRoutes: AppRouteRecord[] = [
  {
    path: '/groups',
    name: 'DdragGroups',
    component: '/ddrag/groups/index',
    meta: {
      title: '我的组',
      icon: 'el-icon-group',
      roles: ['USER'],
      requiresAuth: true,
    },
  },
  {
    path: '/documents',
    name: 'DdragDocuments',
    component: '/ddrag/documents/index',
    meta: {
      title: '文档管理',
      icon: 'el-icon-document',
      roles: ['USER'],
      requiresAuth: true,
    },
  },
  {
    path: '/qa',
    name: 'DdragQa',
    component: '/ddrag/qa/index',
    meta: {
      title: '知识问答',
      icon: 'el-icon-chat-dot-round',
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
      icon: 'el-icon-magic-stick',
      roles: ['USER'],
      requiresAuth: true,
      noKeepAlive: true,
    },
  },
  {
    path: '/management',
    name: 'DdragManagement',
    redirect: '/management/overview',
    meta: {
      title: '系统管理',
      icon: 'el-icon-setting',
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

export default ddragRoutes