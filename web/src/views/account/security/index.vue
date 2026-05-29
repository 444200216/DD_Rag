<!-- DD_Rag 修改密码页面 -->
<template>
  <div class="flex w-full h-screen">
    <LoginLeftView />
    <div class="relative flex-1">
      <AuthTopBar />
      <div class="auth-right-wrap">
        <div class="form">
          <h3 class="title">修改密码</h3>
          <p class="sub-title">请输入当前密码和新密码</p>
          <ElForm ref="formRef" :model="formData" :rules="rules" @keyup.enter="handleSubmit" style="margin-top: 25px">
            <ElFormItem prop="currentPassword">
              <ElInput v-model="formData.currentPassword" type="password" placeholder="当前密码" show-password />
            </ElFormItem>
            <ElFormItem prop="newPassword">
              <ElInput v-model="formData.newPassword" type="password" placeholder="新密码（至少8位，包含字母和数字）" show-password />
            </ElFormItem>
            <ElFormItem prop="confirmPassword">
              <ElInput v-model="formData.confirmPassword" type="password" placeholder="确认新密码" show-password />
            </ElFormItem>
            <div style="margin-top: 30px">
              <ElButton class="w-full custom-height" type="primary" @click="handleSubmit" :loading="loading">
                提交修改
              </ElButton>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElNotification, type FormInstance, type FormRules } from 'element-plus'
import { useDdragAuthStore } from '@/store/modules/ddrag-auth'
import { changePassword } from '@/api/ddrag/auth'

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
      validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
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
  try {
    await changePassword({ currentPassword: formData.currentPassword, newPassword: formData.newPassword })
    if (authStore.currentUser) authStore.currentUser.mustChangePassword = false
    ElNotification({ title: '密码修改成功', type: 'success', duration: 2500, zIndex: 10000 })
    router.push(authStore.homePath)
  } catch (error) {
    console.error('[AccountSecurity] Error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import '@/views/auth/login/style.css';
</style>