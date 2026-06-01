<template>
  <div class="w-full h-full p-0 bg-transparent border-none shadow-none">
    <div class="relative flex-b mt-2.5 max-md:block max-md:mt-1">
      <!-- 左侧：用户信息卡片 -->
      <div class="w-112 mr-5 max-md:w-full max-md:mr-0">
        <div class="art-card-sm relative p-9 pb-6 overflow-hidden text-center">
          <img class="absolute top-0 left-0 w-full h-50 object-cover" src="@imgs/user/bg.webp" />
          <div class="relative z-10 w-20 h-20 mt-30 mx-auto border-2 border-white rounded-full flex-cc bg-theme">
            <ArtSvgIcon icon="ri:robot-2-line" class="text-white text-3xl" />
          </div>
          <h2 class="mt-5 text-xl font-normal">{{ currentUser?.displayName }}</h2>
          <p class="mt-1 text-sm text-g-600">{{ currentUser?.systemRole === 'ADMIN' ? '系统管理员' : '普通用户' }}</p>

          <div class="w-75 mx-auto mt-7.5 text-left">
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:user-line" class="text-g-700" />
              <span class="ml-2 text-sm">{{ currentUser?.username }}</span>
            </div>
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:mail-line" class="text-g-700" />
              <span class="ml-2 text-sm">{{ currentUser?.email }}</span>
            </div>
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:time-line" class="text-g-700" />
              <span class="ml-2 text-sm">{{ currentUser?.lastLoginAt ? new Date(currentUser.lastLoginAt).toLocaleString('zh-CN') : '从未登录' }}</span>
            </div>
          </div>

          <div class="mt-10">
            <h3 class="text-sm font-medium">安全状态</h3>
            <div class="flex flex-wrap justify-center mt-3.5">
              <div class="py-1 px-1.5 mr-2.5 mb-2.5 text-xs border rounded"
                :class="currentUser?.mustChangePassword ? 'border-warning text-warning' : 'border-success text-success'">
                {{ currentUser?.mustChangePassword ? '需修改密码' : '密码已设置' }}
              </div>
              <div class="py-1 px-1.5 mr-2.5 mb-2.5 text-xs border rounded"
                :class="currentUser?.status === 'ACTIVE' ? 'border-success text-success' : 'border-danger text-danger'">
                {{ currentUser?.status === 'ACTIVE' ? '账号正常' : '账号禁用' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：基本设置 + 更改密码 -->
      <div class="flex-1 overflow-hidden max-md:w-full max-md:mt-3.5">
        <!-- 基本设置 -->
        <div class="art-card-sm">
          <h1 class="p-4 text-xl font-normal border-b border-g-300">基本设置</h1>

          <ElForm
            :model="profileForm"
            :rules="profileRules"
            ref="profileFormRef"
            class="box-border p-5 [&>.el-row_.el-form-item]:w-[calc(50%-10px)] [&>.el-row_.el-input]:w-full [&>.el-row_.el-select]:w-full"
            label-width="86px"
            label-position="top"
          >
            <ElRow>
              <ElFormItem label="显示名称" prop="displayName">
                <ElInput v-model="profileForm.displayName" :disabled="!isEditProfile" placeholder="请输入显示名称" />
              </ElFormItem>
              <ElFormItem label="用户名" class="ml-5">
                <ElInput :model-value="currentUser?.username" disabled />
              </ElFormItem>
            </ElRow>

            <ElRow>
              <ElFormItem label="邮箱" prop="email">
                <ElInput v-model="profileForm.email" :disabled="!isEditProfile" placeholder="请输入邮箱" />
              </ElFormItem>
            </ElRow>

            <div class="flex-c justify-end [&_.el-button]:!w-27.5">
              <ElButton v-if="!isEditProfile" type="primary" v-ripple @click="startEditProfile">编辑</ElButton>
              <ElButton v-if="isEditProfile" @click="cancelEditProfile">取消</ElButton>
              <ElButton v-if="isEditProfile" type="primary" v-ripple :loading="savingProfile" @click="handleSaveProfile">保存</ElButton>
            </div>
          </ElForm>
        </div>

        <!-- 更改密码 -->
        <div class="art-card-sm my-5">
          <h1 class="p-4 text-xl font-normal border-b border-g-300">更改密码</h1>

          <ElForm
            :model="pwdForm"
            :rules="pwdRules"
            ref="pwdFormRef"
            class="box-border p-5 [&>.el-row_.el-form-item]:w-[calc(50%-10px)] [&>.el-row_.el-input]:w-full"
            label-width="86px"
            label-position="top"
          >
            <ElFormItem label="当前密码" prop="currentPassword">
              <ElInput v-model="pwdForm.currentPassword" type="password" :disabled="!isEditPwd" show-password placeholder="请输入当前密码" />
            </ElFormItem>

            <ElFormItem label="新密码" prop="newPassword">
              <ElInput v-model="pwdForm.newPassword" type="password" :disabled="!isEditPwd" show-password placeholder="请输入新密码" />
            </ElFormItem>

            <ElFormItem label="确认新密码" prop="confirmPassword">
              <ElInput v-model="pwdForm.confirmPassword" type="password" :disabled="!isEditPwd" show-password placeholder="请再次输入新密码" />
            </ElFormItem>

            <div class="flex-c justify-end [&_.el-button]:!w-27.5">
              <ElButton v-if="!isEditPwd" type="primary" v-ripple @click="startEditPwd">编辑</ElButton>
              <ElButton v-if="isEditPwd" @click="cancelEditPwd">取消</ElButton>
              <ElButton v-if="isEditPwd" type="primary" v-ripple :loading="changingPwd" @click="handleChangePassword">保存</ElButton>
            </div>
          </ElForm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useDdragAuthStore } from '@/store/modules/ddrag-auth'
import { changePassword, updateProfile, fetchCurrentUser } from '@/api/ddrag/auth'
import type { ChangePasswordPayload, UpdateProfilePayload } from '@/types/ddrag'

defineOptions({ name: 'DdragUserCenter' })

const authStore = useDdragAuthStore()
const currentUser = computed(() => authStore.currentUser)

// 基本设置
const isEditProfile = ref(false)
const savingProfile = ref(false)
const profileFormRef = ref<FormInstance>()

const profileForm = reactive({
  displayName: '',
  email: ''
})

const profileRules = reactive<FormRules>({
  displayName: [
    { required: true, message: '请输入显示名称', trigger: 'blur' },
    { max: 128, message: '显示名称最长128个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ]
})

onMounted(() => {
  syncProfileForm()
})

function syncProfileForm() {
  if (currentUser.value) {
    profileForm.displayName = currentUser.value.displayName
    profileForm.email = currentUser.value.email
  }
}

function startEditProfile() {
  syncProfileForm()
  isEditProfile.value = true
}

function cancelEditProfile() {
  syncProfileForm()
  isEditProfile.value = false
}

const handleSaveProfile = async () => {
  const valid = await profileFormRef.value?.validate().catch(() => false)
  if (!valid) return

  savingProfile.value = true
  try {
    const payload: UpdateProfilePayload = {
      displayName: profileForm.displayName,
      email: profileForm.email
    }
    await updateProfile(payload)
    // 刷新当前用户信息
    const freshUser = await fetchCurrentUser()
    authStore.setSession(authStore.accessToken!, freshUser)
    ElMessage.success('保存成功')
    isEditProfile.value = false
  } catch {
    // error handled by interceptor
  } finally {
    savingProfile.value = false
  }
}

// 更改密码
const isEditPwd = ref(false)
const changingPwd = ref(false)
const pwdFormRef = ref<FormInstance>()

const pwdForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const pwdRules = reactive<FormRules>({
  currentPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 64, message: '密码长度在 6 到 64 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== pwdForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

function startEditPwd() {
  isEditPwd.value = true
}

function cancelEditPwd() {
  pwdFormRef.value?.resetFields()
  isEditPwd.value = false
}

const handleChangePassword = async () => {
  const valid = await pwdFormRef.value?.validate().catch(() => false)
  if (!valid) return

  changingPwd.value = true
  try {
    const payload: ChangePasswordPayload = {
      currentPassword: pwdForm.currentPassword,
      newPassword: pwdForm.newPassword
    }
    await changePassword(payload)
    ElMessage.success('密码修改成功')
    if (currentUser.value) {
      currentUser.value.mustChangePassword = false
    }
    pwdFormRef.value?.resetFields()
    isEditPwd.value = false
  } catch {
    // error handled by interceptor
  } finally {
    changingPwd.value = false
  }
}
</script>