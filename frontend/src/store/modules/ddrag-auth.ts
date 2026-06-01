import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { StorageConfig } from '@/utils/storage/storage-config'
import { ddragPost } from '@/utils/http/ddrag'

const ADMIN_HOME_PATH = '/management/overview'
const USER_HOME_PATH = '/groups'
const ACCOUNT_SECURITY_PATH = '/account/security'
const BUSINESS_PATH_PREFIXES = ['/groups', '/documents', '/qa', '/assistant']

export type SystemRole = 'ADMIN' | 'USER'
export type UserStatus = 'ACTIVE' | 'DISABLED'

export interface CurrentUserProfile {
  userId: number
  userCode: string
  username: string
  displayName: string
  email: string
  systemRole: SystemRole
  status: UserStatus
  mustChangePassword: boolean
  lastLoginAt: string | null
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

    async function logout() {
      try {
        await ddragPost<void>('/auth/logout')
      } catch {
        // Logout API may fail; still clear local session
      }
      clearSession()
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
      accessToken, currentUser, isBootstrapping, isAuthenticating,
      isAuthenticated, isAdmin, isUser, homePath,
      setSession, clearSession, logout,
      resolveLandingPath, resolveRedirectForPath,
    }
  },
  {
    persist: {
      key: StorageConfig.generateStorageKey('ddrag-auth'),
      storage: localStorage,
    },
  },
)