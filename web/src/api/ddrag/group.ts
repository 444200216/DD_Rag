import type {
  GroupQueryResult, CreateGroupPayload, GroupMemberItem,
  PendingInvitationItem, OwnerJoinRequestItem,
} from '@/types/ddrag'

const mockOwnedGroups = [
  { groupId: 1, groupCode: 'team-alpha', groupName: 'Alpha研发组' },
  { groupId: 2, groupCode: 'team-beta', groupName: 'Beta产品组' },
]

const mockJoinedGroups = [
  { groupId: 3, groupCode: 'team-gamma', groupName: 'Gamma测试组' },
]

const mockPendingInvitations: PendingInvitationItem[] = [
  { invitationId: 10, groupId: 4, groupName: 'Delta运维组', inviterUserId: 99, inviterDisplayName: '李四', status: 'PENDING' },
]

const mockMembers: GroupMemberItem[] = [
  { userId: 1, userCode: 'u001', displayName: '张锋', role: 'OWNER' },
  { userId: 5, userCode: 'u005', displayName: '李明', role: 'MEMBER' },
  { userId: 8, userCode: 'u008', displayName: '王芳', role: 'MEMBER' },
]

export async function fetchGroups(): Promise<GroupQueryResult> {
  await delay(200)
  return { ownedGroups: mockOwnedGroups, joinedGroups: mockJoinedGroups, pendingInvitations: mockPendingInvitations }
}

export async function createGroup(payload: CreateGroupPayload): Promise<number> {
  await delay(300)
  return 100 + Math.floor(Math.random() * 900)
}

export async function acceptInvitation(_invitationId: number): Promise<void> {
  await delay(200)
}

export async function rejectInvitation(_invitationId: number): Promise<void> {
  await delay(200)
}

export async function fetchGroupMembers(_groupId: number): Promise<GroupMemberItem[]> {
  await delay(200)
  return mockMembers
}

export async function leaveGroup(_groupId: number): Promise<void> {
  await delay(200)
}

export async function fetchOwnerJoinRequests(_groupId: number): Promise<OwnerJoinRequestItem[]> {
  await delay(200)
  return []
}

export async function approveJoinRequest(_groupId: number, _requestId: number): Promise<void> {
  await delay(200)
}

export async function rejectJoinRequest(_groupId: number, _requestId: number): Promise<void> {
  await delay(200)
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}