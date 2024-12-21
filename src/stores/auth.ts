import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '@/types'
import { authApi } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  async function login(username: string, password: string) {
    const { token: newToken, user: userData } = await authApi.login(username, password)
    token.value = newToken
    user.value = userData
    localStorage.setItem('token', newToken)
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem('token')
    }
  }

  async function getProfile() {
    user.value = await authApi.getProfile()
  }

  return {
    user,
    token,
    login,
    logout,
    getProfile
  }
}) 