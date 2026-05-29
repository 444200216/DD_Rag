import type {
  GroupQueryResult, CreateGroupPayload, GroupMemberItem,
  PendingInvitationItem, OwnerJoinRequestItem,
} from '@/types/ddrag'
import { ddragGet, ddragPost, ddragDelete } from '@/utils/http/ddrag'

export async function fetchGroups(): Promise<GroupQueryResult> {
  return ddragGet<GroupQueryResult>('/groups/my')
}

export async function createGroup(payload: CreateGroupPayload): Promise<number> {
  return ddragPost<number>('/groups', payload)
}

export async function acceptInvitation(invitationId: number): Promise<void> {
  await ddragPost<void>(`/invitations/${invitationId}/accept`)
}

export async function rejectInvitation(invitationId: number): Promise<void> {
  await ddragPost<void>(`/invitations/${invitationId}/reject`)
}

export async function fetchGroupMembers(groupId: number): Promise<GroupMemberItem[]> {
  return ddragGet<GroupMemberItem[]>(`/groups/${groupId}/members`)
}

export async function leaveGroup(groupId: number): Promise<void> {
  await ddragPost<void>(`/groups/${groupId}/leave`)
}

export async function fetchOwnerJoinRequests(groupId: number): Promise<OwnerJoinRequestItem[]> {
  return ddragGet<OwnerJoinRequestItem[]>(`/groups/${groupId}/join-requests`)
}

export async function approveJoinRequest(groupId: number, requestId: number): Promise<void> {
  await ddragPost<void>(`/groups/${groupId}/join-requests/${requestId}/approve`)
}

export async function rejectJoinRequest(groupId: number, requestId: number): Promise<void> {
  await ddragPost<void>(`/groups/${groupId}/join-requests/${requestId}/reject`)
}