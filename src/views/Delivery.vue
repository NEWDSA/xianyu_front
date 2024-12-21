<template>
  <div class="delivery">
    <div class="header">
      <h2>发货管理</h2>
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="订单号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入订单号" />
        </el-form-item>
        <el-form-item label="商品类型">
          <el-select v-model="searchForm.type" placeholder="请选择商品类型">
            <el-option label="全部" value="" />
            <el-option label="虚拟商品" value="virtual" />
            <el-option label="实物商品" value="physical" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane label="待发货" name="pending">
        <el-table
          v-loading="loading"
          :data="pendingOrders"
          border
          style="width: 100%"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="orderNo" label="订单号" width="180" />
          <el-table-column prop="productName" label="商品名称" />
          <el-table-column prop="price" label="价格" width="100">
            <template #default="{ row }">
              ¥{{ row.price.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="payTime" label="支付时间" width="180" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="handleDeliver(row)">
                发货
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="batch-actions" v-if="pendingOrders.length">
          <el-button type="primary" @click="handleBatchDeliver">
            批量发货
          </el-button>
        </div>
      </el-tab-pane>

      <el-tab-pane label="已发货" name="delivered">
        <el-table
          v-loading="loading"
          :data="deliveredOrders"
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
          <el-table-column prop="payTime" label="支付时间" width="180" />
          <el-table-column prop="deliveryTime" label="发货时间" width="180" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="handleDetail(row)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 发货对话框 -->
    <el-dialog
      v-model="deliveryDialogVisible"
      :title="batchDelivery ? '批量发货' : '发货'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="deliveryForm"
        :rules="rules"
        label-width="100px"
      >
        <template v-if="!batchDelivery">
          <el-form-item label="订单号">
            {{ currentOrder?.orderNo }}
          </el-form-item>
          <el-form-item label="商品名称">
            {{ currentOrder?.productName }}
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="选中订单">
            {{ selectedOrders.length }} 个
          </el-form-item>
        </template>
        <el-form-item label="发货方式" prop="method">
          <el-radio-group v-model="deliveryForm.method">
            <el-radio label="auto">自动发货</el-radio>
            <el-radio label="manual">手动发货</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item 
          label="发货内容" 
          prop="content"
          v-if="deliveryForm.method === 'manual'"
        >
          <el-input
            v-model="deliveryForm.content"
            type="textarea"
            rows="4"
            placeholder="请输入发货内容（如卡密、链接等）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="deliveryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleDeliverSubmit" :loading="delivering">
          确认发货
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="发货详情"
      width="600px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单号">{{ currentOrder?.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="商品名称">{{ currentOrder?.productName }}</el-descriptions-item>
        <el-descriptions-item label="价格">¥{{ currentOrder?.price.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="发货方式">
          {{ currentOrder?.deliveryMethod === 'auto' ? '自动发货' : '手动发货' }}
        </el-descriptions-item>
        <el-descriptions-item label="支付时间" :span="2">{{ currentOrder?.payTime }}</el-descriptions-item>
        <el-descriptions-item label="发货时间" :span="2">{{ currentOrder?.deliveryTime }}</el-descriptions-item>
        <el-descriptions-item label="发货内容" :span="2">
          {{ currentOrder?.deliveryContent || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Order } from '@/types'
import { orderApi } from '@/api'

const loading = ref(false)
const activeTab = ref('pending')
const orders = ref<Order[]>([])
const deliveryDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const delivering = ref(false)
const currentOrder = ref<Order | null>(null)
const batchDelivery = ref(false)
const selectedOrders = ref<Order[]>([])
const formRef = ref()

const searchForm = reactive({
  orderNo: '',
  type: ''
})

const deliveryForm = reactive({
  method: 'auto',
  content: ''
})

const rules = {
  method: [
    { required: true, message: '请选择发货方式', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入发货内容', trigger: 'blur' }
  ]
}

// 计算待发货订单
const pendingOrders = computed(() => {
  return orders.value.filter(order => order.status === 'paid')
})

// 计算已发货订单
const deliveredOrders = computed(() => {
  return orders.value.filter(order => order.status === 'delivered')
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
  searchForm.type = ''
  fetchOrders()
}

// 切换标签页
function handleTabClick() {
  selectedOrders.value = []
}

// 发货
function handleDeliver(order: Order) {
  currentOrder.value = order
  batchDelivery.value = false
  deliveryForm.method = 'auto'
  deliveryForm.content = ''
  deliveryDialogVisible.value = true
}

// 批量发货
function handleBatchDeliver() {
  if (selectedOrders.value.length === 0) {
    ElMessage.warning('请选择要发货的订单')
    return
  }
  batchDelivery.value = true
  deliveryForm.method = 'auto'
  deliveryForm.content = ''
  deliveryDialogVisible.value = true
}

// 提交发货
async function handleDeliverSubmit() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    delivering.value = true

    if (batchDelivery.value) {
      // 批量发货
      for (const order of selectedOrders.value) {
        await orderApi.updateOrderStatus(order.id, 'delivered')
        order.status = 'delivered'
        order.deliveryTime = new Date().toISOString()
        order.deliveryMethod = deliveryForm.method
        order.deliveryContent = deliveryForm.content
      }
      ElMessage.success('批量发货成功')
    } else if (currentOrder.value) {
      // 单个发货
      await orderApi.updateOrderStatus(currentOrder.value.id, 'delivered')
      currentOrder.value.status = 'delivered'
      currentOrder.value.deliveryTime = new Date().toISOString()
      currentOrder.value.deliveryMethod = deliveryForm.method
      currentOrder.value.deliveryContent = deliveryForm.content
      ElMessage.success('发货成功')
    }

    deliveryDialogVisible.value = false
  } catch (error: any) {
    ElMessage.error(error.message || '发货失败')
  } finally {
    delivering.value = false
  }
}

// 查看详情
function handleDetail(order: Order) {
  currentOrder.value = order
  detailDialogVisible.value = true
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.delivery {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  margin: 0 0 20px 0;
}

.batch-actions {
  margin-top: 20px;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
}
</style> 