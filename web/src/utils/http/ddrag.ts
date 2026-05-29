import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import { useDdragAuthStore } from '@/store/modules/ddrag-auth'
import { useUserStore } from '@/store/modules/user'
import { ElMessage } from 'element-plus'

const { VITE_API_BASE_URL } = import.meta.env
const TIMEOUT = 30000

const ddragAxios: AxiosInstance = axios.create({
  timeout: TIMEOUT,
  baseURL: VITE_API_BASE_URL || '/api',
  withCredentials: true,
  validateStatus: (status) => status >= 200 && status < 300,
})

ddragAxios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const authStore = useDdragAuthStore()
  const token = authStore.accessToken
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

ddragAxios.interceptors.response.use(
  (response) => {
    const data = response.data
    // ApiResponse-wrapped: {success, message, data}
    if (data && typeof data.success === 'boolean') {
      if (data.success) {
        response.data = data.data
        return response
      }
      const msg = data.message || '请求失败'
      ElMessage.error(msg)
      return Promise.reject(new Error(msg))
    }
    // Raw responses pass through unchanged
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useDdragAuthStore()
      const userStore = useUserStore()
      authStore.clearSession()
      userStore.logOut()
      return Promise.reject(error)
    }
    const msg = error.response?.data?.message || error.message || '网络错误'
    ElMessage.error(msg)
    return Promise.reject(error)
  },
)

export async function ddragGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await ddragAxios.get<T>(url, { params })
  return res.data
}

export async function ddragPost<T>(url: string, data?: unknown, params?: Record<string, unknown>): Promise<T> {
  const res = await ddragAxios.post<T>(url, data, { params })
  return res.data
}

export async function ddragPatch<T>(url: string, data?: unknown): Promise<T> {
  const res = await ddragAxios.patch<T>(url, data)
  return res.data
}

export async function ddragDelete<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await ddragAxios.delete<T>(url, { params })
  return res.data
}

export { ddragAxios }