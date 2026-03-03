import { create } from 'zustand'
interface User { id: string; email: string; fullName: string; role: string; kycStatus: string }
interface AuthState {
  user: User | null; token: string | null
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
}
export const useAuthStore = create<AuthState>((set) => ({
  user: null, token: null,
  setAuth: (user, token) => { localStorage.setItem('auth_token', token); set({ user, token }) },
  clearAuth: () => { localStorage.removeItem('auth_token'); set({ user: null, token: null }) },
}))
