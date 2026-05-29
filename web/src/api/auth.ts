import request from '@/utils/http'

/**
 * 登录
 * @param params 登录参数
 * @returns 登录响应
 */
export function fetchLogin(params: Api.Auth.LoginParams) {
  return request.post<Api.Auth.LoginResponse>({
    url: '/api/auth/login',
    params
  })
}

/**
 * 获取用户信息
 * 开发模式下后端不可用时返回 mock 数据
 * @returns 用户信息
 */
export async function fetchGetUserInfo(): Promise<Api.Auth.UserInfo> {
  try {
    return await request.get<Api.Auth.UserInfo>({
      url: '/api/user/info'
    })
  } catch {
    // Mock fallback when backend is unavailable
    const ddragAuthStore = (await import('@/store/modules/ddrag-auth')).useDdragAuthStore()
    const currentUser = ddragAuthStore.currentUser
    if (!currentUser) throw new Error('No mock user data available')
    return {
      userId: currentUser.userId,
      userName: currentUser.userCode,
      email: currentUser.userCode + '@ddrag.local',
      roles: [currentUser.systemRole === 'ADMIN' ? 'ADMIN' : 'USER'],
      buttons: currentUser.systemRole === 'ADMIN'
        ? ['admin:dashboard', 'admin:user:view', 'admin:user:edit']
        : ['user:group:view', 'user:document:view', 'user:qa:view', 'user:assistant:view'],
    }
  }
}