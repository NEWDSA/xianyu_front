// 用户类型定义
export interface User {
  id: number
  username: string
  role: string
  avatar?: string
}

// 订单类型定义
export interface Order {
  id: number
  orderNo: string
  productId: number
  productName: string
  price: number
  status: 'pending' | 'paid' | 'delivered' | 'completed'
  createTime: string
  payTime?: string
  deliveryTime?: string
  deliveryMethod?: 'auto' | 'manual'
  deliveryContent?: string
}

// 商品类型定义
export interface Product {
  id: number
  name: string
  description: string
  price: number
  stock: number
  type: 'virtual' | 'physical'
  status: 'active' | 'inactive'
} 