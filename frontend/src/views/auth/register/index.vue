<!-- AI 知识库平台 注册页面 -->
<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />
    <div class="relative flex-1">
      <AuthTopBar />
      <div class="auth-right-wrap">
        <div class="form">
          <h3 class="title">注册</h3>
          <p class="sub-title">创建 AI 知识库平台账号</p>
          <ElForm
            ref="formRef"
            :model="formData"
            :rules="rules"
            @keyup.enter="handleSubmit"
            style="margin-top: 25px"
          >
            <ElFormItem prop="username">
              <ElInput class="custom-height" placeholder="用户名" v-model.trim="formData.username" />
            </ElFormItem>
            <ElFormItem prop="email">
              <ElInput class="custom-height" placeholder="邮箱" v-model.trim="formData.email" />
            </ElFormItem>
            <ElFormItem prop="displayName">
              <ElInput class="custom-height" placeholder="显示名称" v-model.trim="formData.displayName" />
            </ElFormItem>
            <ElFormItem prop="password">
              <ElInput
                class="custom-height"
                placeholder="密码（至少8位，包含字母和数字）"
                v-model.trim="formData.password"
                type="password"
                show-password
              />
            </ElFormItem>

            <div style="margin-top: 30px">
              <ElButton class="w-full custom-height" type="primary" @click="handleSubmit" :loading="loading">
                注册
              </ElButton>
            </div>

            <div class="mt-5 text-sm text-gray-600">
              <span>已有账号？</span>
              <RouterLink class="text-theme" :to="{ name: 'Login' }">登录</RouterLink>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElNotification, type FormInstance, type FormRules } from 'element-plus'

defineOptions({ name: 'Register' })

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)

const formData = reactive({
  username: '',
  email: '',
  displayName: '',
  password: '',
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
  displayName: [{ required: true, message: '请输入显示名称', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码至少8位', trigger: 'blur' },
    { pattern: /[a-zA-Z]/, message: '密码必须包含字母', trigger: 'blur' },
    { pattern: /\d/, message: '密码必须包含数字', trigger: 'blur' },
  ],
}

const handleSubmit = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return

  loading.value = true
  try {
    const { register } = await import('@/api/ddrag/auth')
    await register(formData)
    ElNotification({ title: '注册成功', type: 'success', duration: 2500, zIndex: 10000, message: '请登录' })
    router.push({ name: 'Login' })
  } catch (error) {
    console.error('[Register] Error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import '@/views/auth/login/style.css';
</style>