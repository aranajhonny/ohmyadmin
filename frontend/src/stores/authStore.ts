import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  user: string | null
  isAuthenticated: boolean
  setAuth: (token: string, user: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token: string, user: string) =>
        set({ token, user, isAuthenticated: true }),
      clearAuth: () =>
        set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'pma-auth',
    }
  )
)
