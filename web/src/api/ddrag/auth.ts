import type {
  LoginPayload, RegisterPayload, ChangePasswordPayload,
  AuthSessionResponse, CurrentUserProfile,
} from '@/types/ddrag'

const mockUser: CurrentUserProfile = {
  userId: 1,
  userCode: 'u001',
  displayName: '张锋',
  systemRole: 'USER',
  mustChangePassword: false,
}

const mockAdmin: CurrentUserProfile = {
  userId: 2,
  userCode: 'u002',
  displayName: '管理员',
  systemRole: 'ADMIN',
  mustChangePassword: false,
}

export async function login(payload: LoginPayload): Promise<AuthSessionResponse> {
  await delay(300)
  // Use admin role if loginId contains 'admin'
  const user = payload.loginId.includes('admin') ? mockAdmin : mockUser
  return { accessToken: 'mock-jwt-token-' + Date.now(), currentUser: user }
}

export async function register(_payload: RegisterPayload): Promise<void> {
  await delay(300)
}

export async function refreshSession(): Promise<AuthSessionResponse> {
  await delay(200)
  return { accessToken: 'mock-refreshed-token', currentUser: mockUser }
}

export async function logout(): Promise<void> {
  await delay(100)
}

export async function fetchCurrentUser(): Promise<CurrentUserProfile> {
  await delay(100)
  return mockUser
}

export async function changePassword(_payload: ChangePasswordPayload): Promise<void> {
  await delay(300)
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}