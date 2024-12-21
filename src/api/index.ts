import axios from 'axios'
import type { User, Order, Product } from '@/types'

const api = axios.create({
  baseURL: '/api',
  timeout: 5000
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    const { code, data, message } = response.data
    if (code === 200) {
      return data
    }
    return Promise.reject(new Error(message || '请求失败'))
  },
  error => {
    if (error.response?.status === 401) {
      // 未授权，跳转到登录页
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (username: string, password: string) => 
    api.post<{ token: string, user: User }>('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get<User>('/auth/profile')
}

export const orderApi = {
  getOrders: () => api.get<Order[]>('/orders'),
  getOrder: (id: number) => api.get<Order>(`/orders/${id}`),
  updateOrderStatus: (id: number, status: Order['status']) => 
    api.patch(`/orders/${id}`, { status })
}

export const productApi = {
  getProducts: () => api.get<Product[]>('/products'),
  getProduct: (id: number) => api.get<Product>(`/products/${id}`),
  createProduct: (product: Omit<Product, 'id'>) => 
    api.post<Product>('/products', product),
  updateProduct: (id: number, product: Partial<Product>) => 
    api.patch<Product>(`/products/${id}`, product),
  deleteProduct: (id: number) => api.delete(`/products/${id}`)
} 