<template>
  <div class="products">
    <div class="header">
      <h2>商品管理</h2>
      <el-button type="primary" @click="handleAdd">
        添加商品
      </el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="products"
      border
      style="width: 100%"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="商品名称" />
      <el-table-column prop="description" label="描述" show-overflow-tooltip />
      <el-table-column prop="price" label="价格" width="100">
        <template #default="{ row }">
          ¥{{ row.price.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" width="100" />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="row.type === 'virtual' ? 'success' : 'warning'">
            {{ row.type === 'virtual' ? '虚拟' : '实物' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === 'active' ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button type="primary" link @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button 
              type="primary" 
              link 
              :type="row.status === 'active' ? 'warning' : 'success'"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'active' ? '下架' : '上架' }}
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)">
              删除
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑商品对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingProduct ? '编辑商品' : '添加商品'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="form.price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="form.stock" :min="0" :precision="0" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type">
            <el-option label="虚拟" value="virtual" />
            <el-option label="实物" value="physical" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status">
            <el-option label="上架" value="active" />
            <el-option label="下架" value="inactive" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Product } from '@/types'
import { productApi } from '@/api'

const loading = ref(false)
const products = ref<Product[]>([])
const dialogVisible = ref(false)
const saving = ref(false)
const editingProduct = ref<Product | null>(null)
const formRef = ref()

const form = reactive({
  name: '',
  description: '',
  price: 0,
  stock: 0,
  type: 'virtual' as Product['type'],
  status: 'active' as Product['status']
})

const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入商品描述', trigger: 'blur' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'blur' }],
  type: [{ required: true, message: '请选择商品类型', trigger: 'change' }],
  status: [{ required: true, message: '请选择商品状态', trigger: 'change' }]
}

// 获取商品列表
async function fetchProducts() {
  loading.value = true
  try {
    products.value = await productApi.getProducts()
  } catch (error: any) {
    ElMessage.error(error.message || '获取商品列表失败')
  } finally {
    loading.value = false
  }
}

// 添加商品
function handleAdd() {
  editingProduct.value = null
  Object.assign(form, {
    name: '',
    description: '',
    price: 0,
    stock: 0,
    type: 'virtual',
    status: 'active'
  })
  dialogVisible.value = true
}

// 编辑商品
function handleEdit(product: Product) {
  editingProduct.value = product
  Object.assign(form, product)
  dialogVisible.value = true
}

// 切换商品状态
async function handleToggleStatus(product: Product) {
  try {
    const newStatus = product.status === 'active' ? 'inactive' : 'active'
    await productApi.updateProduct(product.id, { status: newStatus })
    product.status = newStatus
    ElMessage.success('更新成功')
  } catch (error: any) {
    ElMessage.error(error.message || '更新失败')
  }
}

// 删除商品
async function handleDelete(product: Product) {
  try {
    await ElMessageBox.confirm('确定要删除该商品吗？', '提示', {
      type: 'warning'
    })
    await productApi.deleteProduct(product.id)
    products.value = products.value.filter(p => p.id !== product.id)
    ElMessage.success('删除成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 保存商品
async function handleSave() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    saving.value = true
    
    if (editingProduct.value) {
      await productApi.updateProduct(editingProduct.value.id, form)
      const index = products.value.findIndex(p => p.id === editingProduct.value!.id)
      if (index !== -1) {
        products.value[index] = { ...products.value[index], ...form }
      }
    } else {
      const newProduct = await productApi.createProduct(form)
      products.value.unshift(newProduct)
    }
    
    dialogVisible.value = false
    ElMessage.success(editingProduct.value ? '更新成功' : '创建成功')
  } catch (error: any) {
    ElMessage.error(error.message || (editingProduct.value ? '更新失败' : '创建失败'))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchProducts()
})
</script>

<style scoped>
.products {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
}
</style> 