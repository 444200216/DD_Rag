## ADDED Requirements

### Requirement: Groups workspace page
The system SHALL provide a groups workspace page at `/groups` that displays the user's owned and joined groups, pending invitations, and group management capabilities.

#### Scenario: View owned and joined groups
- **WHEN** a USER role user navigates to `/groups`
- **THEN** the system displays two sections: "我创建的组" (owned groups) and "我加入的组" (joined groups), each as an ArtTable with columns for group name, member count, and role

#### Scenario: Create a new group
- **WHEN** a user clicks "创建组" and fills in group name and description
- **THEN** the system calls `POST /api/groups` to create the group, the user becomes OWNER, and the new group appears in the owned groups list

#### Scenario: Accept an invitation
- **WHEN** a user has pending invitations and clicks "接受" on an invitation
- **THEN** the system calls `POST /api/group-invitations/{id}/accept` and the group appears in the joined groups list

#### Scenario: Reject an invitation
- **WHEN** a user clicks "拒绝" on a pending invitation
- **THEN** the system calls `POST /api/group-invitations/{id}/reject` and the invitation is removed from the pending list

### Requirement: Group detail panel
The system SHALL provide a group detail view with member management, invitation sending, and join request handling.

#### Scenario: View group members
- **WHEN** a user selects a group from the groups list
- **THEN** the system displays a detail panel showing all members with their roles (OWNER/MEMBER) and join dates

#### Scenario: Invite a member
- **WHEN** an OWNER clicks "邀请成员" and enters the target user's information
- **THEN** the system calls `POST /api/group-invitations` to send the invitation

#### Scenario: Approve a join request
- **WHEN** an OWNER views pending join requests and clicks "批准"
- **THEN** the system calls `POST /api/group-join-requests/{id}/approve` and the requester becomes a MEMBER

#### Scenario: Leave a group
- **WHEN** a MEMBER clicks "退出组"
- **THEN** the system calls `DELETE /api/group-memberships/{groupId}/me` and the group is removed from the joined groups list

### Requirement: Current group context
The system SHALL maintain a `currentGroupId` in the group store that is shared across all group-scoped pages (Documents, QA, Assistant).

#### Scenario: Group context propagation
- **WHEN** a user selects a group in the groups page or group selector
- **THEN** the `currentGroupId` is updated in the Pinia store and all group-scoped API calls on other pages use this groupId as their filter parameter