<template>
  <div class="orders">
    <div class="header">
      <h2>订单管理</h2>
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="订单号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入订单号" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态">
            <el-option label="全部" value="" />
            <el-option label="待支付" value="pending" />
            <el-option label="已支付" value="paid" />
            <el-option label="已发货" value="delivered" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table
      v-loading="loading"
      :data="orders"
      border
      style="width: 100%"
    >
      <el-table-column prop="orderNo" label="订单号" width="180" />
      <el-table-column prop="productName" label="商品名称" />
      <el-table-column prop="price" label="价格" width="100">
        <template #default="{ row }">
          ¥{{ row.price.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column prop="payTime" label="支付时间" width="180" />
      <el-table-column prop="deliveryTime" label="发货时间" width="180" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button 
              type="primary" 
              link
              :disabled="!canDeliver(row.status)"
              @click="handleDeliver(row)"
            >
              发货
            </el-button>
            <el-button type="primary" link @click="handleDetail(row)">
              详情
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 订单详情对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="订单详情"
      width="600px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单号">{{ currentOrder?.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="商品名称">{{ currentOrder?.productName }}</el-descriptions-item>
        <el-descriptions-item label="价格">¥{{ currentOrder?.price.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentOrder?.status)">
            {{ getStatusText(currentOrder?.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ currentOrder?.createTime }}</el-descriptions-item>
        <el-descriptions-item label="支付时间" :span="2">{{ currentOrder?.payTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发货时间" :span="2">{{ currentOrder?.deliveryTime || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Order } from '@/types'
import { orderApi } from '@/api'

const loading = ref(false)
const orders = ref<Order[]>([])
const dialogVisible = ref(false)
const currentOrder = ref<Order | null>(null)

const searchForm = reactive({
  orderNo: '',
  status: ''
})

// 获取订单列表
async function fetchOrders() {
  loading.value = true
  try {
    orders.value = await orderApi.getOrders()
  } catch (error: any) {
    ElMessage.error(error.message || '获取订单列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  fetchOrders()
}

// 重置搜索
function resetSearch() {
  searchForm.orderNo = ''
  searchForm.status = ''
  fetchOrders()
}

// 查看详情
function handleDetail(order: Order) {
  currentOrder.value = order
  dialogVisible.value = true
}

// 发货
async function handleDeliver(order: Order) {
  try {
    await ElMessageBox.confirm('确定要发货吗？', '提示', {
      type: 'warning'
    })
    await orderApi.updateOrderStatus(order.id, 'delivered')
    order.status = 'delivered'
    order.deliveryTime = new Date().toISOString()
    ElMessage.success('发货成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '发货失败')
    }
  }
}

// 判断是否可以发货
function canDeliver(status: Order['status']) {
  return status === 'paid'
}

// 获取状态类型
function getStatusType(status?: Order['status']) {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'paid':
      return 'primary'
    case 'delivered':
      return 'success'
    case 'completed':
      return 'info'
    default:
      return 'info'
  }
}

// 获取状态文本
function getStatusText(status?: Order['status']) {
  switch (status) {
    case 'pending':
      return '待支付'
    case 'paid':
      return '已支付'
    case 'delivered':
      return '已发货'
    case 'completed':
      return '已完成'
    default:
      return '未知'
  }
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.orders {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  margin: 0 0 20px 0;
}
</style> 