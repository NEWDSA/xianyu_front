import Mock from 'mockjs'
import type { User, Order, Product } from '@/types'

// 模拟延迟
Mock.setup({
  timeout: '300-600'
})

// 用户相关接口
Mock.mock('/api/auth/login', 'post', (options: any) => {
  const { username, password } = JSON.parse(options.body)
  if (username === 'admin' && password === '123456') {
    return {
      code: 200,
      data: {
        token: 'mock-token',
        user: {
          id: 1,
          username: 'admin',
          role: 'admin',
          avatar: 'https://avatars.githubusercontent.com/u/1'
        }
      }
    }
  }
  return {
    code: 401,
    message: '用户名或密码错误'
  }
})

Mock.mock('/api/auth/logout', 'post', {
  code: 200,
  message: '退出成功'
})

Mock.mock('/api/auth/profile', 'get', {
  code: 200,
  data: {
    id: 1,
    username: 'admin',
    role: 'admin',
    avatar: 'https://avatars.githubusercontent.com/u/1'
  }
})

// 订单相关接口
Mock.mock('/api/orders', 'get', {
  code: 200,
  'data|10-20': [{
    'id|+1': 1,
    'orderNo': '@guid',
    'productId|1-100': 1,
    'productName': '@ctitle(5, 10)',
    'price|1-1000': 1,
    'status|1': ['pending', 'paid', 'delivered', 'completed'],
    'createTime': '@datetime',
    'payTime': '@datetime',
    'deliveryTime': '@datetime',
    'deliveryMethod|1': ['auto', 'manual'],
    'deliveryContent': '@paragraph(1)'
  }]
})

// 商品相关接口
Mock.mock('/api/products', 'get', {
  code: 200,
  'data|10-20': [{
    'id|+1': 1,
    'name': '@ctitle(5, 10)',
    'description': '@cparagraph(1, 3)',
    'price|1-1000': 1,
    'stock|0-100': 1,
    'type|1': ['virtual', 'physical'],
    'status|1': ['active', 'inactive']
  }]
})

// 商品创建接口
Mock.mock('/api/products', 'post', (options: any) => {
  const product = JSON.parse(options.body)
  return {
    code: 200,
    data: {
      id: Mock.Random.integer(1000, 9999),
      ...product
    }
  }
})

// 商品更新接口
Mock.mock(/\/api\/products\/\d+/, 'patch', (options: any) => {
  const product = JSON.parse(options.body)
  return {
    code: 200,
    data: product
  }
})

// 商品删除接口
Mock.mock(/\/api\/products\/\d+/, 'delete', {
  code: 200,
  message: '删除成功'
})

// 在现有的 mock 文件中添加
Mock.mock('/api/dashboard/stats', 'get', {
  code: 200,
  data: {
    totalOrders: '@integer(100, 1000)',
    pendingOrders: '@integer(10, 100)',
    todayIncome: '@float(1000, 10000, 2, 2)',
    totalProducts: '@integer(30, 200)'
  }
}) 