<template>
  <div class="reception-page">
    <h2 class="page-title">
      <el-icon><UserFilled /></el-icon>
      前台查看
    </h2>
    <p class="page-subtitle">前台工作人员查看所有预约草稿和已确认预约</p>

    <div class="filter-bar">
      <el-input 
        v-model="searchPhone" 
        placeholder="输入手机号搜索"
        clearable
        class="search-input"
        style="width: 240px;"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-date-picker
        v-model="searchDate"
        type="date"
        placeholder="选择日期"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        clearable
      />
      <el-select v-model="statusFilter" placeholder="预约状态" clearable style="width: 140px;">
        <el-option label="全部" value="" />
        <el-option label="草稿" value="draft" />
        <el-option label="已确认" value="confirmed" />
        <el-option label="已取消" value="cancelled" />
      </el-select>
      <el-button type="primary" @click="loadData">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <el-row :gutter="16" class="stats-row">
      <el-col :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-icon draft">
            <el-icon :size="28"><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.draftCount }}</div>
            <div class="stat-label">预约草稿</div>
          </div>
        </el-card>
      </el-col>
      <el-col :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-icon confirmed">
            <el-icon :size="28"><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.confirmedCount }}</div>
            <div class="stat-label">已确认</div>
          </div>
        </el-card>
      </el-col>
      <el-col :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-icon people">
            <el-icon :size="28"><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalPeople }}</div>
            <div class="stat-label">预约总人数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-icon amount">
            <el-icon :size="28"><Money /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">¥{{ stats.totalAmount }}</div>
            <div class="stat-label">预约总金额</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="table-card">
      <el-table :data="filteredRecords" class="records-table" stripe>
        <el-table-column label="预约编号" width="180" prop="id">
          <template #default="{ row }">
            <span class="record-id">{{ row.id.substring(0, 12) }}...</span>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="name" label="联系人" width="100" />
        <el-table-column prop="sessionName" label="展项" min-width="120" />
        <el-table-column label="场次时间" width="220">
          <template #default="{ row }">
            {{ row.date }} {{ row.startTime }}
          </template>
        </el-table-column>
        <el-table-column prop="peopleCount" label="人数" width="80" align="center" />
        <el-table-column label="金额" width="100">
          <template #default="{ row }">
            <span class="amount">¥{{ row.totalPrice }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="getStatusType(row.status)" 
              effect="dark"
              size="small"
            >
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small" 
              link
              @click="viewDetail(row)"
            >
              详情
            </el-button>
            <el-button 
              v-if="row.status === 'draft'"
              type="success" 
              size="small" 
              link
              @click="confirmBooking(row)"
            >
              确认
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-empty v-if="filteredRecords.length === 0" description="暂无预约记录" />

    <el-dialog 
      v-model="showDetailDialog" 
      title="预约详情" 
      width="520px"
      class="detail-dialog"
    >
      <el-descriptions :column="2" border v-if="currentRecord">
        <el-descriptions-item label="预约编号">
          {{ currentRecord.id }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentRecord.status)" effect="dark" size="small">
            {{ getStatusLabel(currentRecord.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="手机号">
          {{ currentRecord.phone }}
        </el-descriptions-item>
        <el-descriptions-item label="联系人">
          {{ currentRecord.name }}
        </el-descriptions-item>
        <el-descriptions-item label="展项名称">
          {{ currentRecord.sessionName }}
        </el-descriptions-item>
        <el-descriptions-item label="讲解员">
          {{ currentRecord.guideName }}
        </el-descriptions-item>
        <el-descriptions-item label="场次日期">
          {{ currentRecord.date }}
        </el-descriptions-item>
        <el-descriptions-item label="场次时间">
          {{ currentRecord.startTime }} - {{ currentRecord.endTime }}
        </el-descriptions-item>
        <el-descriptions-item label="预约人数">
          {{ currentRecord.peopleCount }} 人
        </el-descriptions-item>
        <el-descriptions-item label="费用合计">
          <span class="amount">¥{{ currentRecord.totalPrice }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          {{ currentRecord.remark || '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">
          {{ formatTime(currentRecord.createdAt) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { draftsApi, bookingsApi, sessionsApi } from '@/utils/storage'

const searchPhone = ref('')
const searchDate = ref('')
const statusFilter = ref('')
const showDetailDialog = ref(false)
const currentRecord = ref(null)

const allRecords = ref([])

const filteredRecords = computed(() => {
  let result = allRecords.value
  
  if (searchPhone.value) {
    result = result.filter(r => r.phone.includes(searchPhone.value))
  }
  if (searchDate.value) {
    result = result.filter(r => r.date === searchDate.value)
  }
  if (statusFilter.value) {
    result = result.filter(r => r.status === statusFilter.value)
  }
  
  return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const stats = computed(() => {
  const records = allRecords.value
  return {
    draftCount: records.filter(r => r.status === 'draft').length,
    confirmedCount: records.filter(r => r.status === 'confirmed').length,
    totalPeople: records.reduce((sum, r) => sum + (r.peopleCount || 0), 0),
    totalAmount: records.filter(r => r.status === 'confirmed').reduce((sum, r) => sum + (r.totalPrice || 0), 0)
  }
})

onMounted(() => {
  loadData()
})

const loadData = () => {
  const drafts = draftsApi.getAll()
  const bookings = bookingsApi.getAll()
  allRecords.value = [...drafts, ...bookings]
}

const getStatusType = (status) => {
  const map = {
    'draft': 'warning',
    'confirmed': 'success',
    'cancelled': 'info'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status) => {
  const map = {
    'draft': '草稿',
    'confirmed': '已确认',
    'cancelled': '已取消'
  }
  return map[status] || status
}

const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const viewDetail = (record) => {
  currentRecord.value = record
  showDetailDialog.value = true
}

const confirmBooking = (record) => {
  ElMessageBox.confirm(
    `确定要确认此预约吗？\n${record.name} - ${record.sessionName} ${record.date} ${record.startTime}`,
    '确认预约',
    {
      confirmButtonText: '确定确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const result = draftsApi.submit(record.id)
    if (result.success) {
      sessionsApi.updateBookedCount(record.sessionId, record.peopleCount)
      ElMessage.success('预约已确认')
      loadData()
    } else {
      ElMessage.error(result.message)
    }
  }).catch(() => {})
}
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  flex-wrap: wrap;
}

.stats-row {
  margin: 0 0 24px 0;
}

.stat-card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-bottom: 16px;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.draft {
  background: rgba(230, 162, 60, 0.2);
  color: #e6a23c;
}

.stat-icon.confirmed {
  background: rgba(103, 194, 58, 0.2);
  color: #67c23a;
}

.stat-icon.people {
  background: rgba(64, 158, 255, 0.2);
  color: #409eff;
}

.stat-icon.amount {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
}

.stat-value {
  color: #fff;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
}

.stat-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  margin-top: 4px;
}

.table-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.table-card :deep(.el-card__body) {
  padding: 0;
}

.records-table :deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-text-color: #fff;
  --el-table-header-text-color: #ffd700;
  --el-table-row-hover-bg-color: rgba(255, 215, 0, 0.1);
  --el-table-border-color: rgba(255, 255, 255, 0.1);
}

.records-table :deep(.el-table th) {
  background: rgba(255, 255, 255, 0.08);
}

.record-id {
  font-family: monospace;
  color: rgba(255, 255, 255, 0.7);
}

.amount {
  color: #ffd700;
  font-weight: 600;
}

.detail-dialog :deep(.el-dialog) {
  background: #1a2a4a;
  border: 1px solid rgba(255, 215, 0, 0.2);
}

.detail-dialog :deep(.el-dialog__title) {
  color: #fff;
}

.detail-dialog :deep(.el-descriptions__label) {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  width: 100px;
}

.detail-dialog :deep(.el-descriptions__content) {
  color: #fff;
}

:deep(.el-empty) {
  --el-empty-description-color: rgba(255, 255, 255, 0.5);
}
</style>
