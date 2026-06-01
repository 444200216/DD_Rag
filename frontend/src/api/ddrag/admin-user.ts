import type { AdminUserItem, UserStatus } from '@/types/ddrag'
import { ddragGet, ddragPatch } from '@/utils/http/ddrag'

export async function fetchAdminUsers(): Promise<AdminUserItem[]> {
  return ddragGet<AdminUserItem[]>('/admin/users')
}

export async function fetchAdminUserDetail(userId: number): Promise<AdminUserItem> {
  return ddragGet<AdminUserItem>(`/admin/users/${userId}`)
}

export async function updateAdminUserStatus(userId: number, status: UserStatus): Promise<void> {
  await ddragPatch<void>(`/admin/users/${userId}/status`, { status })
}