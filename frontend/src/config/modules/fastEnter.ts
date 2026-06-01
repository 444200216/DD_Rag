/**
 * 快速入口配置
 * 包含：应用列表、快速链接等配置
 */
import type { FastEnterConfig } from '@/types/config'

const fastEnterConfig: FastEnterConfig = {
  // 显示条件（屏幕宽度）
  minWidth: 1200,
  // 应用列表
  applications: [
    {
      name: '知识库',
      description: '创建和加入知识库',
      icon: 'ri:book-open-line',
      iconColor: '#377dff',
      enabled: true,
      order: 1,
      routeName: 'DdragGroups',
      roles: ['USER']
    },
    {
      name: '文档中心',
      description: '文档上传与管理',
      icon: 'ri:folder-3-line',
      iconColor: '#ff3b30',
      enabled: true,
      order: 2,
      routeName: 'DdragDocuments',
      roles: ['USER']
    },
    {
      name: '智能检索',
      description: '知识库范围内问答',
      icon: 'ri:search-eye-line',
      iconColor: '#7A7FFF',
      enabled: true,
      order: 3,
      routeName: 'DdragQa',
      roles: ['USER']
    },
    {
      name: '智能助手',
      description: '多轮对话与知识检索',
      icon: 'ri:robot-2-line',
      iconColor: '#13DEB9',
      enabled: true,
      order: 4,
      routeName: 'DdragAssistant',
      roles: ['USER']
    },
    {
      name: '更新日志',
      description: '版本更新与变更记录',
      icon: 'ri:gamepad-line',
      iconColor: '#38C0FC',
      enabled: true,
      order: 5,
      routeName: 'ChangeLog'
    }
  ],
  // 快速链接
  quickLinks: [
    {
      name: '个人中心',
      enabled: true,
      order: 1,
      routeName: 'UserCenter'
    }
  ]
}

export default Object.freeze(fastEnterConfig)
