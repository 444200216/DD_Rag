<!-- DD_Rag 登录页面 -->
<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />
    <div class="relative flex-1">
      <AuthTopBar />
      <div class="auth-right-wrap">
        <div class="form">
          <h3 class="title">登录</h3>
          <p class="sub-title">DD_Rag 知识助手</p>
          <ElForm
            ref="formRef"
            :model="formData"
            :rules="rules"
            @keyup.enter="handleSubmit"
            style="margin-top: 25px"
          >
            <ElFormItem prop="loginId">
              <ElInput
                class="custom-height"
                placeholder="用户名"
                v-model.trim="formData.loginId"
              />
            </ElFormItem>
            <ElFormItem prop="password">
              <ElInput
                class="custom-height"
                placeholder="密码"
                v-model.trim="formData.password"
                type="password"
                autocomplete="off"
                show-password
              />
            </ElFormItem>

            <div style="margin-top: 30px">
              <ElButton
                class="w-full custom-height"
                type="primary"
                @click="handleSubmit"
                :loading="loading"
              >
                登录
              </ElButton>
            </div>

            <div class="mt-5 text-sm text-gray-600">
              <span>还没有账号？</span>
              <RouterLink class="text-theme" :to="{ name: 'Register' }">注册</RouterLink>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDdragAuthStore } from '@/store/modules/ddrag-auth'
import { useUserStore } from '@/store/modules/user'
import { ElNotification, type FormInstance, type FormRules } from 'element-plus'

defineOptions({ name: 'Login' })

const authStore = useDdragAuthStore()
const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

const formRef = ref<FormInstance>()
const loading = ref(false)

const formData = reactive({
  loginId: '',
  password: '',
})

const rules: FormRules = {
  loginId: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const handleSubmit = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return

  loading.value = true
  try {
    const { login } = await import('@/api/ddrag/auth')
    const result = await login({ loginId: formData.loginId, password: formData.password })
    authStore.setSession(result.accessToken, result.currentUser)
    userStore.setLoginStatus(true)
    userStore.setToken(result.accessToken)

    ElNotification({
      title: '登录成功',
      type: 'success',
      duration: 2500,
      zIndex: 10000,
      message: `欢迎回来, ${result.currentUser.displayName}!`,
    })

    const redirect = route.query.redirect as string
    router.push(redirect || authStore.homePath)
  } catch (error) {
    console.error('[Login] Error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import './style.css';
</style>