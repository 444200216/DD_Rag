# DD_Rag Frontend Rebase on art-design-pro — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild DD_Rag's frontend using art-design-pro as the base scaffold in a new `web/` directory, preserving all business logic while adopting Element Plus + Tailwind + Art* components. Design-first approach: all pages built with mock data, verified via /browse, then connected to backend API.

**Architecture:** Copy art-design-pro to `web/`, configure for DD_Rag, create new route module `ddrag.ts`, DD_Rag-specific stores/composables/API modules, business pages in `views/ddrag/`. Auth pages modified in-place. All pages use mock data until API integration phase.

**Tech Stack:** Vue 3, TypeScript, Element Plus, Tailwind CSS 4, Pinia (persistedstate), Axios (art-design-pro's wrapper), Vite 7, vue-router 4, ECharts 6

---

## Task 1: Scaffold Setup

**Files:**
- Create: `web/` (entire art-design-pro copy)
- Modify: `web/src/config/index.ts`
- Modify: `web/src/config/setting.ts`
- Modify: `web/vite.config.ts`

- [ ] **Step 1: Copy art-design-pro to web/ directory**

```bash
cp -r /Users/zhangfeng/Development/workspace-trae/art-design-pro /Users/zhangfeng/Development/workspace-trae/DD_Rag/web
```

- [ ] **Step 2: Remove art-design-pro's .git directory (web is part of DD_Rag repo)**

```bash
rm -rf /Users/zhangfeng/Development/workspace-trae/DD_Rag/web/.git
```

- [ ] **Step 3: Install dependencies**

```bash
cd /Users/zhangfeng/Development/workspace-trae/DD_Rag/web && pnpm install
```

- [ ] **Step 4: Configure app name and default route in `web/src/config/index.ts`**

Find the `systemInfo` object and change `name` to "DD_Rag 知识助手". Find default route redirect and change to `/groups`.

- [ ] **Step 5: Configure default settings in `web/src/config/setting.ts`**

Set: `menuType = MenuTypeEnum.LEFT`, `systemThemeColor = '#5D87FF'`, `enableWorkTab = true`

- [ ] **Step 6: Configure Vite dev proxy in `web/vite.config.ts`**

Add proxy config in the `server` section:

```ts
server: {
  proxy: {
    '/api': {
      target: process.env.VITE_DEV_PROXY_TARGET || 'http://localhost:8081',
      changeOrigin: true,
      // no rewrite — /api paths stay as /api
    },
  },
},
```

Also add env variable file `web/.env.development`:

```
VITE_DEV_PROXY_TARGET=http://localhost:8081
```

- [ ] **Step 7: Verify scaffold runs**

```bash
cd /Users/zhangfeng/Development/workspace-trae/DD_Rag/web && pnpm dev
```

Expected: dev server starts, layout shell renders, art-design-pro default page loads

- [ ] **Step 8: Commit scaffold**

```bash
git add web/
git commit -m "feat: scaffold web/ directory from art-design-pro"
```

---

## Task 2: DD_Rag Route Module

**Files:**
- Create: `web/src/router/modules/ddrag.ts`
- Modify: `web/src/router/modules/index.ts` (add export)

- [ ] **Step 1: Create `web/src/router/modules/ddrag.ts`**

```ts
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
```

- [ ] **Step 2: Add ddrag module export to `web/src/router/modules/index.ts`**

Add `export { default as ddragRoutes } from './ddrag'` to the existing exports file.

- [ ] **Step 3: Commit route module**

```bash
git add web/src/router/modules/ddrag.ts web/src/router/modules/index.ts
git commit -m "feat: add ddrag route module for DD_Rag business pages"
```

---

## Task 3: DD_Rag Auth Store

**Files:**
- Create: `web/src/store/modules/ddrag-auth.ts`

- [ ] **Step 1: Create `web/src/store/modules/ddrag-auth.ts`**

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { StorageConfig } from '@/utils/storage/storage-config'

const ADMIN_HOME_PATH = '/management/overview'
const USER_HOME_PATH = '/groups'
const ACCOUNT_SECURITY_PATH = '/account/security'
const BUSINESS_PATH_PREFIXES = ['/groups', '/documents', '/qa', '/assistant']

export type SystemRole = 'ADMIN' | 'USER'

export interface CurrentUserProfile {
  userId: number
  userCode: string
  displayName: string
  systemRole: SystemRole
  mustChangePassword: boolean
}

export const useDdragAuthStore = defineStore(
  'ddrag-auth',
  () => {
    const accessToken = ref<string | null>(null)
    const currentUser = ref<CurrentUserProfile | null>(null)
    const isBootstrapping = ref(false)
    const isAuthenticating = ref(false)

    const isAuthenticated = computed(() => accessToken.value !== null && currentUser.value !== null)
    const isAdmin = computed(() => currentUser.value?.systemRole === 'ADMIN')
    const isUser = computed(() => currentUser.value?.systemRole === 'USER')
    const homePath = computed(() => resolveLandingPath(currentUser.value))

    function setSession(token: string, user: CurrentUserProfile) {
      accessToken.value = token
      currentUser.value = user
    }

    function clearSession() {
      accessToken.value = null
      currentUser.value = null
    }

    function resolveLandingPath(user: CurrentUserProfile | null): string {
      if (user === null) return '/auth/login'
      if (user.mustChangePassword) return ACCOUNT_SECURITY_PATH
      return user.systemRole === 'ADMIN' ? ADMIN_HOME_PATH : USER_HOME_PATH
    }

    function resolveRedirectForPath(path: string): string | null {
      const user = currentUser.value
      if (user === null) return '/auth/login'
      if (user.mustChangePassword && path !== ACCOUNT_SECURITY_PATH) return ACCOUNT_SECURITY_PATH
      if (user.systemRole === 'ADMIN' && BUSINESS_PATH_PREFIXES.some((p) => path.startsWith(p))) return ADMIN_HOME_PATH
      if (user.systemRole === 'USER' && path.startsWith('/management')) return USER_HOME_PATH
      return null
    }

    return {
      accessToken,
      currentUser,
      isBootstrapping,
      isAuthenticating,
      isAuthenticated,
      isAdmin,
      isUser,
      homePath,
      setSession,
      clearSession,
      resolveLandingPath,
      resolveRedirectForPath,
    }
  },
  {
    persist: {
      key: `${StorageConfig.versionPrefix}-ddrag-auth`,
      storage: localStorage,
      paths: ['accessToken', 'currentUser'],
    },
  },
)
```

- [ ] **Step 2: Commit auth store**

```bash
git add web/src/store/modules/ddrag-auth.ts
git commit -m "feat: add ddrag-auth Pinia store for DD_Rag authentication"
```

---

## Task 4: DD_Rag Group Store

**Files:**
- Create: `web/src/store/modules/ddrag-group.ts`

- [ ] **Step 1: Create `web/src/store/modules/ddrag-group.ts`**

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { StorageConfig } from '@/utils/storage/storage-config'

export type GroupRelation = 'OWNER' | 'MEMBER'

export interface GroupItem {
  groupId: number
  groupCode: string
  groupName: string
}

export interface PendingInvitationItem {
  invitationId: number
  groupId: number
  groupName: string
  inviterUserId: number
  inviterDisplayName: string
  status: string
}

export interface VisibleGroup extends GroupItem {
  relation: GroupRelation
}

export const useDdragGroupStore = defineStore(
  'ddrag-group',
  () => {
    const currentGroupId = ref<number | null>(null)
    const ownedGroups = ref<GroupItem[]>([])
    const joinedGroups = ref<GroupItem[]>([])
    const pendingInvitations = ref<PendingInvitationItem[]>([])
    const isGroupsLoading = ref(false)

    const visibleGroups = computed<VisibleGroup[]>(() => [
      ...ownedGroups.value.map((g) => ({ ...g, relation: 'OWNER' as const })),
      ...joinedGroups.value.map((g) => ({ ...g, relation: 'MEMBER' as const })),
    ])

    const currentGroup = computed<VisibleGroup | null>(() =>
      visibleGroups.value.find((g) => g.groupId === currentGroupId.value) ?? null,
    )

    const canManageCurrentGroup = computed(() => currentGroup.value?.relation === 'OWNER')

    function setCurrentGroupId(groupId: number | null) {
      currentGroupId.value = groupId
    }

    function setGroupCollections(payload: {
      ownedGroups: GroupItem[]
      joinedGroups: GroupItem[]
      pendingInvitations: PendingInvitationItem[]
    }) {
      ownedGroups.value = payload.ownedGroups
      joinedGroups.value = payload.joinedGroups
      pendingInvitations.value = payload.pendingInvitations
    }

    return {
      currentGroupId,
      ownedGroups,
      joinedGroups,
      pendingInvitations,
      isGroupsLoading,
      visibleGroups,
      currentGroup,
      canManageCurrentGroup,
      setCurrentGroupId,
      setGroupCollections,
    }
  },
  {
    persist: {
      key: `${StorageConfig.versionPrefix}-ddrag-group`,
      storage: localStorage,
      paths: ['currentGroupId'],
    },
  },
)
```

- [ ] **Step 2: Commit group store**

```bash
git add web/src/store/modules/ddrag-group.ts
git commit -m "feat: add ddrag-group Pinia store for group context management"
```

---

## Task 5: DD_Rag Composables

**Files:**
- Create: `web/src/hooks/useSSEStream.ts`
- Create: `web/src/hooks/useResumableUpload.ts`
- Create: `web/src/hooks/useGroupContext.ts`

- [ ] **Step 1: Create `web/src/hooks/useSSEStream.ts`**

```ts
import { ref, onUnmounted } from 'vue'

export interface SSEStreamOptions {
  url: string
  body?: Record<string, unknown>
  accessToken?: string
}

export function useSSEStream() {
  const data = ref<string>('')
  const error = ref<string | null>(null)
  const isStreaming = ref(false)

  let abortController: AbortController | null = null

  async function start(options: SSEStreamOptions) {
    data.value = ''
    error.value = null
    isStreaming.value = true
    abortController = new AbortController()

    const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')
    try {
      const response = await fetch(`${baseUrl}${options.url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: abortController.signal,
      })

      if (!response.ok || !response.body) {
        const msg = await response.text()
        throw new Error(msg || 'SSE connection failed')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        let sep = buffer.indexOf('\n\n')
        while (sep >= 0) {
          const rawEvent = buffer.slice(0, sep)
          buffer = buffer.slice(sep + 2)
          const parsed = parseSseEvent(rawEvent)
          if (parsed) data.value += parsed
          sep = buffer.indexOf('\n\n')
        }
      }
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      isStreaming.value = false
      abortController = null
    }
  }

  function stop() {
    abortController?.abort()
    abortController = null
    isStreaming.value = false
  }

  function parseSseEvent(raw: string): string | null {
    const lines = raw.split(/\r?\n/)
    let dataLines: string[] = []
    for (const line of lines) {
      if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
    }
    if (dataLines.length === 0) return null
    try {
      const json = JSON.parse(dataLines.join('\n'))
      if (json.event === 'delta' && json.delta) return json.delta
      if (json.event === 'error') { error.value = json.error; return null }
      return null
    } catch { return null }
  }

  onUnmounted(stop)

  return { data, error, isStreaming, start, stop }
}
```

- [ ] **Step 2: Create `web/src/hooks/useResumableUpload.ts`**

```ts
import { ref, computed } from 'vue'

type UploadPhase = 'idle' | 'init' | 'uploading' | 'polling' | 'completed' | 'failed'

export function useResumableUpload() {
  const phase = ref<UploadPhase>('idle')
  const progress = ref(0)
  const errorMessage = ref<string | null>(null)
  const uploadId = ref<string | null>(null)

  const isUploading = computed(() => phase.value === 'init' || phase.value === 'uploading')

  // Mock implementation for design phase
  async function startUpload(_file: File, _groupId: number) {
    phase.value = 'init'
    progress.value = 0
    errorMessage.value = null

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 5) {
      progress.value = i
      await new Promise((r) => setTimeout(r, 100))
    }

    phase.value = 'completed'
    progress.value = 100
  }

  async function retry() {
    if (phase.value !== 'failed') return
    phase.value = 'idle'
    errorMessage.value = null
  }

  function cancel() {
    phase.value = 'idle'
    progress.value = 0
    errorMessage.value = null
    uploadId.value = null
  }

  function reset() {
    phase.value = 'idle'
    progress.value = 0
    errorMessage.value = null
    uploadId.value = null
  }

  return { phase, progress, errorMessage, isUploading, startUpload, retry, cancel, reset }
}
```

- [ ] **Step 3: Create `web/src/hooks/useGroupContext.ts`**

```ts
import { computed } from 'vue'
import { useDdragGroupStore } from '@/store/modules/ddrag-group'
import { useRouter } from 'vue-router'

export function useGroupContext() {
  const groupStore = useDdragGroupStore()
  const router = useRouter()

  const currentGroupId = computed(() => groupStore.currentGroupId)
  const currentGroup = computed(() => groupStore.currentGroup)
  const hasSelectedGroup = computed(() => currentGroupId.value !== null)

  function requireGroup(): number {
    if (currentGroupId.value === null) {
      router.push('/groups')
      throw new Error('No group selected')
    }
    return currentGroupId.value
  }

  function selectGroup(groupId: number) {
    groupStore.setCurrentGroupId(groupId)
  }

  return { currentGroupId, currentGroup, hasSelectedGroup, requireGroup, selectGroup }
}
```

- [ ] **Step 4: Commit composables**

```bash
git add web/src/hooks/useSSEStream.ts web/src/hooks/useResumableUpload.ts web/src/hooks/useGroupContext.ts
git commit -m "feat: add SSE stream, resumable upload, and group context composables"
```

---

## Task 6: DD_Rag API Modules (Mock Phase)

**Files:**
- Create: `web/src/api/ddrag/auth.ts`
- Create: `web/src/api/ddrag/group.ts`
- Create: `web/src/api/ddrag/document.ts`
- Create: `web/src/api/ddrag/qa.ts`
- Create: `web/src/api/ddrag/assistant.ts`
- Create: `web/src/api/ddrag/admin-user.ts`
- Create: `web/src/types/ddrag/index.ts` (all types in one file)

- [ ] **Step 1: Create `web/src/types/ddrag/index.ts`** with all DD_Rag types

(Contains SystemRole, CurrentUserProfile, GroupItem, PendingInvitationItem, DocumentItem, CitationItem, AskQuestionPayload, AskQuestionResponse, AssistantSessionListItem, AssistantSessionDetail, AssistantMessageItem, AssistantConversationContext, AssistantChatPayload, AssistantChatResult, AssistantChatStreamEvent, AssistantCitationItem, AdminUserItem, UserStatus — copied verbatim from DD_Rag frontend types)

- [ ] **Step 2: Create `web/src/api/ddrag/auth.ts`** (mock functions returning fake data)

- [ ] **Step 3: Create `web/src/api/ddrag/group.ts`** (mock functions returning fake groups)

- [ ] **Step 4: Create `web/src/api/ddrag/document.ts`** (mock functions returning fake documents)

- [ ] **Step 5: Create `web/src/api/ddrag/qa.ts`** (mock functions returning fake Q&A responses)

- [ ] **Step 6: Create `web/src/api/ddrag/assistant.ts`** (mock functions returning fake sessions)

- [ ] **Step 7: Create `web/src/api/ddrag/admin-user.ts`** (mock functions returning fake users)

- [ ] **Step 8: Commit API modules**

```bash
git add web/src/api/ddrag/ web/src/types/ddrag/
git commit -m "feat: add DD_Rag API modules with mock data for design phase"
```

---

## Task 7: Auth Pages — Login (Design Phase)

**Files:**
- Modify: `web/src/views/auth/login/index.vue`

- [ ] **Step 1: Modify login page — remove art-design-pro's account selector, add DD_Rag's username+password form**

Replace the login form section: remove `ElSelect` account dropdown, keep `ElInput` username and password fields. Remove drag verify (ArtDragVerify) component. Remove "rememberPassword" checkbox. Add "忘记密码" link pointing to `/auth/forget-password`. Remove i18n usage — use Chinese text directly.

Login `handleSubmit` in design phase uses mock: call `useDdragAuthStore().setSession('mock-token', mockUser)` and redirect to homePath.

- [ ] **Step 2: Verify login page via /browse**

Run `pnpm dev`, open `/auth/login`, verify: username input, password input, submit button, "忘记密码" link, no drag verify, no account selector.

- [ ] **Step 3: Commit login page design**

```bash
git add web/src/views/auth/login/
git commit -m "feat: redesign login page for DD_Rag (mock data, design phase)"
```

---

## Task 8: Auth Pages — Register (Design Phase)

**Files:**
- Modify: `web/src/views/auth/register/index.vue`

- [ ] **Step 1: Modify register page — add DD_Rag fields (username, email, displayName, password)**

Replace art-design-pro's register form with DD_Rag fields: username, email, displayName, password (with validation: ≥8 chars, alpha+digit). Mock submit redirects to `/auth/login`.

- [ ] **Step 2: Verify register page via /browse**

- [ ] **Step 3: Commit register page design**

---

## Task 9: Account Security Page (Design Phase)

**Files:**
- Create: `web/src/views/account/security/index.vue`
- Modify: `web/src/router/routes/staticRoutes.ts` (add `/account/security` route)

- [ ] **Step 1: Create account security page**

```vue
<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />
    <div class="relative flex-1">
      <AuthTopBar />
      <div class="auth-right-wrap">
        <div class="form">
          <h3 class="title">修改密码</h3>
          <p class="sub-title">请输入当前密码和新密码</p>
          <ElForm ref="formRef" :model="formData" :rules="rules" @keyup.enter="handleSubmit">
            <ElFormItem prop="currentPassword">
              <ElInput v-model="formData.currentPassword" type="password" placeholder="当前密码" show-password />
            </ElFormItem>
            <ElFormItem prop="newPassword">
              <ElInput v-model="formData.newPassword" type="password" placeholder="新密码（至少8位，包含字母和数字）" show-password />
            </ElFormItem>
            <ElFormItem prop="confirmPassword">
              <ElInput v-model="formData.confirmPassword" type="password" placeholder="确认新密码" show-password />
            </ElFormItem>
            <ElButton class="w-full custom-height" type="primary" @click="handleSubmit" :loading="loading">
              提交修改
            </ElButton>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useDdragAuthStore } from '@/store/modules/ddrag-auth'

defineOptions({ name: 'AccountSecurity' })

const router = useRouter()
const authStore = useDdragAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const formData = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const rules: FormRules = {
  currentPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '密码至少8位', trigger: 'blur' },
    { pattern: /[a-zA-Z]/, message: '密码必须包含字母', trigger: 'blur' },
    { pattern: /\d/, message: '密码必须包含数字', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== formData.newPassword) callback(new Error('两次密码不一致'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  loading.value = true
  // Mock: simulate success
  await new Promise((r) => setTimeout(r, 500))
  authStore.currentUser!.mustChangePassword = false
  ElMessage.success('密码修改成功')
  router.push(authStore.homePath)
  loading.value = false
}
</script>

<style scoped>
@import '@/views/auth/login/style.css';
</style>
```

- [ ] **Step 2: Add route to staticRoutes.ts**

Add entry for `/account/security` with `meta: { requiresAuth: true, title: '修改密码' }`.

- [ ] **Step 3: Verify via /browse**

- [ ] **Step 4: Commit account security page**

---

## Task 10: Groups Workspace Page (Design Phase)

**Files:**
- Create: `web/src/views/ddrag/groups/index.vue`
- Create: `web/src/views/ddrag/groups/components/GroupDetailDrawer.vue`
- Create: `web/src/views/ddrag/groups/components/GroupSelector.vue`
- Create: `web/src/views/ddrag/groups/mock.ts`

- [ ] **Step 1: Create mock data file `mock.ts`**

```ts
export const mockOwnedGroups = [
  { groupId: 1, groupCode: 'team-alpha', groupName: 'Alpha研发组' },
  { groupId: 2, groupCode: 'team-beta', groupName: 'Beta产品组' },
]

export const mockJoinedGroups = [
  { groupId: 3, groupCode: 'team-gamma', groupName: 'Gamma测试组' },
]

export const mockPendingInvitations = [
  { invitationId: 10, groupId: 4, groupName: 'Delta运维组', inviterUserId: 99, inviterDisplayName: '张三', status: 'PENDING' },
]

export const mockMembers = [
  { userId: 1, userCode: 'u001', displayName: '张锋', role: 'OWNER' },
  { userId: 5, userCode: 'u005', displayName: '李明', role: 'MEMBER' },
  { userId: 8, userCode: 'u008', displayName: '王芳', role: 'MEMBER' },
]
```

- [ ] **Step 2: Create GroupsPage Vue component with tabs (owned/joined), invitations section, create group dialog**

Use `ElTabs` with two tab panes. Each tab has `ArtTable` or `ElTable`. Invitations shown as `ElCard` list above tabs. Create group uses `ElDialog` + `ElForm`. Detail uses `GroupDetailDrawer`.

- [ ] **Step 3: Create GroupDetailDrawer.vue** — `ElDrawer` with member list, invitation input, leave group button

- [ ] **Step 4: Create GroupSelector.vue** — `ElSelect` bound to `useDdragGroupStore().currentGroupId`

- [ ] **Step 5: Verify groups page via /browse**

- [ ] **Step 6: Commit groups page design**

---

## Task 11: Documents Page (Design Phase)

**Files:**
- Create: `web/src/views/ddrag/documents/index.vue`
- Create: `web/src/views/ddrag/documents/mock.ts`

- [ ] **Step 1: Create mock data with 8 documents across all statuses**

- [ ] **Step 2: Create DocumentsPage — ArtForm search bar (status filter + group selector) + ArtTable + upload dialog**

`ElTable` columns: filename, upload time (formatted), status (`ElTag` with color: PENDING=info, PROCESSING=warning, COMPLETED=success, FAILED=danger), actions (preview/delete/retry buttons). Upload dialog uses `useResumableUpload` composable with progress bar. Preview uses `ElDialog`.

- [ ] **Step 3: Verify documents page via /browse**

- [ ] **Step 4: Commit documents page design**

---

## Task 12: QA Page (Design Phase)

**Files:**
- Create: `web/src/views/ddrag/qa/index.vue`
- Create: `web/src/views/ddrag/qa/mock.ts`

- [ ] **Step 1: Create mock Q&A data (2-3 question-answer pairs with citations)**

- [ ] **Step 2: Create QaPage — top prompt input + bottom conversation display**

Top: `ElInput` textarea + group selector + "提问" button. Bottom: alternating user/AI message cards. Citation list as `ElCard` grid below answer.

- [ ] **Step 3: Verify QA page via /browse**

- [ ] **Step 4: Commit QA page design**

---

## Task 13: Assistant Chat Page (Design Phase)

**Files:**
- Create: `web/src/views/ddrag/assistant/index.vue`
- Create: `web/src/views/ddrag/assistant/mock.ts`

- [ ] **Step 1: Create mock session data (3 sessions with conversation history)**

- [ ] **Step 2: Create AssistantPage — two-column layout (session list | chat panel with bottom composer)**

Left column: `ElScrollbar` list of sessions with create/rename/delete buttons. Right column: chat messages (`ElScrollbar`) + bottom composer (`ElInput` textarea + group selector + KB_SEARCH `ElSwitch` + send button). Route meta `noKeepAlive: true`.

- [ ] **Step 3: Verify assistant page via /browse**

- [ ] **Step 4: Commit assistant page design**

---

## Task 14: Management Pages (Design Phase)

**Files:**
- Create: `web/src/views/ddrag/management/overview/index.vue`
- Create: `web/src/views/ddrag/management/users/index.vue`
- Create: `web/src/views/ddrag/management/user-detail/index.vue`
- Create: `web/src/views/ddrag/management/mock.ts`

- [ ] **Step 1: Create mock management data (stats + 10 user records)**

- [ ] **Step 2: Create OverviewPage — ArtStatsCard row + ArtBarChartCard**

- [ ] **Step 3: Create UsersPage — ElTable with user list + search bar**

- [ ] **Step 4: Create UserDetailPage — ElDescriptions + status toggle**

- [ ] **Step 5: Verify management pages via /browse**

- [ ] **Step 6: Commit management pages design**

---

## Task 15: Route Guard — DD_Rag Role Enforcement

**Files:**
- Modify: `web/src/router/guards/beforeEach.ts`

- [ ] **Step 1: Add DD_Rag role enforcement logic to beforeEach guard**

After the existing auth check, add:
1. Check `useDdragAuthStore().currentUser.mustChangePassword` → redirect to `/account/security`
2. Check `useDdragAuthStore().isAdmin` + path starts with business prefix → redirect to `/management/overview`
3. Check `useDdragAuthStore().isUser` + path starts with `/management` → redirect to `/groups`

- [ ] **Step 2: Verify guards work — test ADMIN on /groups, USER on /management**

- [ ] **Step 3: Commit route guard modifications**

---

## Task 16: Sidebar Navigation Update

**Files:**
- Modify: `web/src/views/index/index.vue` or menu config

- [ ] **Step 1: Add DD_Rag menu items to sidebar**

Ensure the ddrag route module's menu items appear in the sidebar alongside existing demo items. Verify: Groups, Documents, QA, Assistant, Management menus are visible and clickable.

- [ ] **Step 2: Set default landing route to `/groups`**

Ensure `/` redirects to `/groups` for USER role, `/management/overview` for ADMIN role.

- [ ] **Step 3: Verify full navigation flow via /browse**

- [ ] **Step 4: Commit sidebar navigation**

---

## Task 17: API Integration — Auth

**Files:**
- Modify: `web/src/api/ddrag/auth.ts` (replace mock with real Axios calls)
- Modify: `web/src/views/auth/login/index.vue` (call real API)

- [ ] **Step 1: Replace mock auth functions with real Axios calls using art-design-pro's HTTP wrapper**

Port DD_Rag's `auth.ts` API functions: `login`, `register`, `refreshSession`, `logout`, `fetchCurrentUser`, `changePassword`. Adapt to art-design-pro's `http` instance (baseURL `/api`, `withCredentials: true`).

- [ ] **Step 2: Modify login page to call real `login` API**

- [ ] **Step 3: Verify real login flow with DD_Rag backend**

- [ ] **Step 4: Commit auth API integration**

---

## Task 18: API Integration — Groups

**Files:**
- Modify: `web/src/api/ddrag/group.ts`
- Modify: `web/src/views/ddrag/groups/index.vue`

- [ ] **Step 1: Replace mock group functions with real API calls**

- [ ] **Step 2: Connect groups page to real API**

- [ ] **Step 3: Verify groups page with real backend data**

- [ ] **Step 4: Commit group API integration**

---

## Task 19: API Integration — Documents

**Files:**
- Modify: `web/src/api/ddrag/document.ts`
- Modify: `web/src/views/ddrag/documents/index.vue`
- Modify: `web/src/hooks/useResumableUpload.ts` (replace mock with real upload lifecycle)

- [ ] **Step 1: Replace mock document functions with real API calls**

- [ ] **Step 2: Replace mock upload composable with real chunk upload lifecycle**

- [ ] **Step 3: Connect documents page to real API**

- [ ] **Step 4: Verify documents page with real backend data**

- [ ] **Step 5: Commit document API integration**

---

## Task 20: API Integration — QA

**Files:**
- Modify: `web/src/api/ddrag/qa.ts`
- Modify: `web/src/views/ddrag/qa/index.vue`

- [ ] **Step 1: Replace mock QA function with real `POST /qa/ask`**

- [ ] **Step 2: Connect QA page to real API**

- [ ] **Step 3: Verify QA page with real backend data**

- [ ] **Step 4: Commit QA API integration**

---

## Task 21: API Integration — Assistant

**Files:**
- Modify: `web/src/api/ddrag/assistant.ts`
- Modify: `web/src/views/ddrag/assistant/index.vue`
- Modify: `web/src/hooks/useSSEStream.ts` (replace mock SSE with real stream)

- [ ] **Step 1: Replace mock assistant functions with real API calls**

- [ ] **Step 2: Replace mock SSE composable with real `fetch` + SSE parsing**

- [ ] **Step 3: Connect assistant page to real API**

- [ ] **Step 4: Verify assistant chat with real SSE streaming**

- [ ] **Step 5: Commit assistant API integration**

---

## Task 22: API Integration — Management

**Files:**
- Modify: `web/src/api/ddrag/admin-user.ts`
- Modify: `web/src/views/ddrag/management/overview/index.vue`
- Modify: `web/src/views/ddrag/management/users/index.vue`
- Modify: `web/src/views/ddrag/management/user-detail/index.vue`

- [ ] **Step 1: Replace mock admin-user functions with real API calls**

- [ ] **Step 2: Connect management pages to real API**

- [ ] **Step 3: Verify management pages with real backend data**

- [ ] **Step 4: Commit management API integration**