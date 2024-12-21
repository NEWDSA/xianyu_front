import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/Default.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue')
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/Orders.vue')
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/views/Products.vue')
      },
      {
        path: 'delivery',
        name: 'Delivery',
        component: () => import('@/views/Delivery.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const token = localStorage.getItem('token')
  
  // 初始化 token
  if (token && !authStore.token) {
    authStore.token = token
  }

  if (to.meta.requiresAuth && !authStore.token) {
    // 需要登录但未登录，重定向到登录页
    next({ 
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else if (to.path === '/login' && authStore.token) {
    // 已登录但访问登录页，重定向到首页
    next('/')
  } else {
    next()
  }
})

export default router 