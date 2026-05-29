import type { AdminUserItem, UserStatus } from '@/types/ddrag'

const mockUsers: AdminUserItem[] = [
  { userId: 1, userCode: 'u001', username: 'zhangfeng', email: 'zhangfeng@example.com', displayName: '张锋', systemRole: 'USER', status: 'ACTIVE', mustChangePassword: false, lastLoginAt: '2026-05-29T08:00:00' },
  { userId: 2, userCode: 'u002', username: 'admin', email: 'admin@example.com', displayName: '管理员', systemRole: 'ADMIN', status: 'ACTIVE', mustChangePassword: false, lastLoginAt: '2026-05-29T07:30:00' },
  { userId: 3, userCode: 'u003', username: 'liming', email: 'liming@example.com', displayName: '李明', systemRole: 'USER', status: 'ACTIVE', mustChangePassword: false, lastLoginAt: '2026-05-28T16:00:00' },
  { userId: 4, userCode: 'u004', username: 'wangfang', email: 'wangfang@example.com', displayName: '王芳', systemRole: 'USER', status: 'ACTIVE', mustChangePassword: true, lastLoginAt: '2026-05-25T10:00:00' },
  { userId: 5, userCode: 'u005', username: 'zhaoliu', email: 'zhaoliu@example.com', displayName: '赵六', systemRole: 'USER', status: 'DISABLED', mustChangePassword: false, lastLoginAt: null },
  { userId: 6, userCode: 'u006', username: 'sunqi', email: 'sunqi@example.com', displayName: '孙七', systemRole: 'USER', status: 'ACTIVE', mustChangePassword: false, lastLoginAt: '2026-05-27T14:00:00' },
]

export async function fetchAdminUsers(): Promise<AdminUserItem[]> {
  await delay(200)
  return mockUsers
}

export async function fetchAdminUserDetail(userId: number): Promise<AdminUserItem> {
  await delay(200)
  const user = mockUsers.find((u) => u.userId === userId)
  if (!user) throw new Error('用户不存在')
  return user
}

export async function updateAdminUserStatus(userId: number, status: UserStatus): Promise<void> {
  await delay(300)
  const user = mockUsers.find((u) => u.userId === userId)
  if (user) user.status = status
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}