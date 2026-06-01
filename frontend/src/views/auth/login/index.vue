<!-- AI 知识库平台 登录页面 -->
<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />
    <div class="relative flex-1">
      <AuthTopBar />
      <div class="auth-right-wrap">
        <div class="form">
          <h3 class="title">欢迎回来</h3>
          <p class="sub-title">输入您的账号和密码登录</p>
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
                placeholder="请输入账号"
                v-model.trim="formData.loginId"
              />
            </ElFormItem>
            <ElFormItem prop="password">
              <ElInput
                class="custom-height"
                placeholder="请输入密码"
                v-model.trim="formData.password"
                type="password"
                autocomplete="off"
                show-password
              />
            </ElFormItem>

            <!-- 拖拽验证 -->
            <div class="relative pb-5 mt-6">
              <div
                class="relative z-[2] overflow-hidden select-none rounded-lg border border-transparent tad-300"
                :class="{ '!border-[#FF4E4F]': !isPassing && isClickPass }"
              >
                <ArtDragVerify
                  ref="dragVerify"
                  v-model:value="isPassing"
                  text="请拖动滑块验证"
                  textColor="var(--art-gray-700)"
                  successText="验证通过"
                  progressBarBg="var(--main-color)"
                  background="#F1F1F4"
                  handlerBg="var(--default-box-color)"
                />
              </div>
              <p
                class="absolute top-0 z-[1] px-px mt-2 text-xs text-[#f56c6c] tad-300"
                :class="{ 'translate-y-10': !isPassing && isClickPass }"
              >
                请先完成滑块验证
              </p>
            </div>

            <div class="flex-cb mt-2 text-sm">
              <ElCheckbox v-model="formData.rememberPassword">记住密码</ElCheckbox>
              <RouterLink class="text-theme" :to="{ name: 'ForgetPassword' }">忘记密码？</RouterLink>
            </div>

            <div style="margin-top: 30px">
              <ElButton
                class="w-full custom-height"
                type="primary"
                @click="handleSubmit"
                :loading="loading"
                v-ripple
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
import { fetchLogin } from '@/api/auth'
import { ElNotification, type FormInstance, type FormRules } from 'element-plus'

defineOptions({ name: 'Login' })

const authStore = useDdragAuthStore()
const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

const dragVerify = ref()
const isPassing = ref(false)
const isClickPass = ref(false)

const formRef = ref<FormInstance>()
const loading = ref(false)

const formData = reactive({
  loginId: '',
  password: '',
  rememberPassword: true,
})

const rules: FormRules = {
  loginId: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const handleSubmit = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return

  if (!isPassing.value) {
    isClickPass.value = true
    return
  }

  loading.value = true
  try {
    const result = await fetchLogin({ loginId: formData.loginId, password: formData.password })
    authStore.setSession(result.accessToken, result.currentUser)
    userStore.setToken(result.accessToken)
    userStore.setLoginStatus(true)

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
    resetDragVerify()
  } finally {
    loading.value = false
  }
}

const resetDragVerify = () => {
  dragVerify.value?.reset()
}
</script>

<style scoped>
@import './style.css';
</style>