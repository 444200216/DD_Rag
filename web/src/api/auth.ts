import { ddragPost, ddragGet } from '@/utils/http/ddrag'
import type { AuthSessionResponse, CurrentUserProfile } from '@/types/ddrag'

export async function fetchLogin(params: { loginId: string; password: string }): Promise<AuthSessionResponse> {
  return ddragPost<AuthSessionResponse>('/auth/login', params)
}

export async function fetchGetUserInfo(): Promise<Api.Auth.UserInfo> {
  const currentUser = await ddragGet<CurrentUserProfile>('/auth/me')
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