import type {
  LoginPayload, RegisterPayload, ChangePasswordPayload, UpdateProfilePayload,
  AuthSessionResponse, CurrentUserProfile,
} from '@/types/ddrag'
import { ddragPost, ddragGet, ddragPatch } from '@/utils/http/ddrag'

export async function login(payload: LoginPayload): Promise<AuthSessionResponse> {
  return ddragPost<AuthSessionResponse>('/auth/login', payload)
}

export async function register(payload: RegisterPayload): Promise<void> {
  await ddragPost<void>('/auth/register', payload)
}

export async function refreshSession(): Promise<AuthSessionResponse> {
  return ddragPost<AuthSessionResponse>('/auth/refresh')
}

export async function logout(): Promise<void> {
  await ddragPost<void>('/auth/logout')
}

export async function fetchCurrentUser(): Promise<CurrentUserProfile> {
  return ddragGet<CurrentUserProfile>('/auth/me')
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await ddragPost<void>('/account/change-password', payload)
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<void> {
  await ddragPatch<void>('/account/profile', payload)
}