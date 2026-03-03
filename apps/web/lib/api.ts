import axios from 'axios'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
export const api = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } })
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
