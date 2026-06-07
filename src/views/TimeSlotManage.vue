<template>
  <div class="time-slot-page">
    <h2 class="page-title">
      <el-icon><Clock /></el-icon>
      时段维护
    </h2>
    <p class="page-subtitle">讲解员管理开放时段，设置可预约的时间段</p>

    <div class="action-bar">
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        新增时段
      </el-button>
      <el-radio-group v-model="filterType" @change="filterSlots">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="morning">上午</el-radio-button>
        <el-radio-button value="afternoon">下午</el-radio-button>
      </el-radio-group>
    </div>

    <el-table :data="filteredSlots" class="slot-table" stripe>
      <el-table-column label="序号" type="index" width="80" align="center" />
      <el-table-column prop="time" label="时段">
        <template #default="{ row }">
          <div class="time-display">
            <el-icon color="#ffd700"><Clock /></el-icon>
            <span>{{ row.time }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="type" label="时段类型" width="120">
        <template #default="{ row }">
          <el-tag :type="row.type === 'morning' ? 'primary' : 'success'" size="small">
            {{ row.type === 'morning' ? '上午' : '下午' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag 
            :type="row.status === 'active' ? 'success' : 'info'" 
            effect="dark"
            size="small"
          >
            {{ row.status === 'active' ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="关联场次" width="120" align="center">
        <template #default="{ row }">
          <el-badge :value="getSessionCount(row.time)" :max="99" class="session-badge">
            <el-icon color="#ffd700"><Tickets /></el-icon>
          </el-badge>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button 
            size="small"
            :type="row.status === 'active' ? 'warning' : 'success'"
            @click="toggleStatus(row)"
          >
            {{ row.status === 'active' ? '停用' : '启用' }}
          </el-button>
          <el-button size="small" @click="editSlot(row)">
            编辑
          </el-button>
          <el-button 
            size="small" 
            type="danger" 
            :disabled="getSessionCount(row.time) > 0"
            @click="deleteSlot(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="filteredSlots.length === 0" description="暂无时段数据" />

    <el-dialog 
      v-model="showAddDialog" 
      :title="editingSlot ? '编辑时段' : '新增时段'" 
      width="480px"
      class="slot-dialog"
    >
      <el-form :model="slotForm" :rules="slotRules" ref="slotFormRef" label-width="100px">
        <el-form-item label="时段名称" prop="time">
          <el-input 
            v-model="slotForm.time" 
            placeholder="例如：09:00-09:45"
          />
          <div class="form-tip">格式：开始时间-结束时间，如 09:00-09:45</div>
        </el-form-item>
        <el-form-item label="时段类型" prop="type">
          <el-radio-group v-model="slotForm.type">
            <el-radio value="morning">上午</el-radio>
            <el-radio value="afternoon">下午</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="slotForm.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="saveSlot">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { timeSlotsApi, sessionsApi } from '@/utils/storage'

const timeSlots = ref([])
const sessions = ref([])
const filterType = ref('all')
const showAddDialog = ref(false)
const editingSlot = ref(null)
const slotFormRef = ref(null)

const slotForm = ref({
  time: '',
  type: 'morning',
  status: 'active'
})

const slotRules = {
  time: [
    { required: true, message: '请输入时段', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        const pattern = /^\d{2}:\d{2}-\d{2}:\d{2}$/
        if (!pattern.test(value)) {
          callback(new Error('时段格式不正确，请使用 HH:MM-HH:MM 格式'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  type: [
    { required: true, message: '请选择时段类型', trigger: 'change' }
  ]
}

const filteredSlots = computed(() => {
  let result = timeSlots.value
  if (filterType.value !== 'all') {
    result = result.filter(s => s.type === filterType.value)
  }
  return result.sort((a, b) => a.time.localeCompare(b.time))
})

onMounted(() => {
  loadData()
})

const loadData = () => {
  timeSlots.value = timeSlotsApi.getAll()
  sessions.value = sessionsApi.getAll()
}

const filterSlots = () => {
}

const getSessionCount = (timeRange) => {
  if (!timeRange) return 0
  const [startTime] = timeRange.split('-')
  return sessions.value.filter(s => s.startTime === startTime).length
}

const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const toggleStatus = (slot) => {
  const action = slot.status === 'active' ? '停用' : '启用'
  ElMessageBox.confirm(
    `确定要${action}此时段吗？`,
    '确认操作',
    {
      confirmButtonText: `确定${action}`,
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    timeSlotsApi.toggleStatus(slot.id)
    loadData()
    ElMessage.success(`已${action}时段`)
  }).catch(() => {})
}

const editSlot = (slot) => {
  editingSlot.value = { ...slot }
  slotForm.value = {
    time: slot.time,
    type: slot.type,
    status: slot.status
  }
  showAddDialog.value = true
}

const deleteSlot = (slot) => {
  const sessionCount = getSessionCount(slot.time)
  if (sessionCount > 0) {
    ElMessage.warning('此时段有关联场次，无法删除')
    return
  }
  
  ElMessageBox.confirm(
    '确定要删除此时段吗？此操作不可恢复。',
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error'
    }
  ).then(() => {
    timeSlotsApi.delete(slot.id)
    loadData()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const closeDialog = () => {
  showAddDialog.value = false
  editingSlot.value = null
  slotForm.value = {
    time: '',
    type: 'morning',
    status: 'active'
  }
  if (slotFormRef.value) {
    slotFormRef.value.resetFields()
  }
}

const saveSlot = async () => {
  await slotFormRef.value.validate()
  
  if (editingSlot.value) {
    timeSlotsApi.update(editingSlot.value.id, slotForm.value)
    ElMessage.success('编辑成功')
  } else {
    timeSlotsApi.add(slotForm.value)
    ElMessage.success('新增成功')
  }
  
  loadData()
  closeDialog()
}
</script>

<style scoped>
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  flex-wrap: wrap;
  gap: 16px;
}

.action-bar :deep(.el-radio-button__inner) {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
}

.action-bar :deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  background: #ffd700;
  border-color: #ffd700;
  color: #0a1628;
}

.slot-table {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  overflow: hidden;
}

.slot-table :deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-text-color: #fff;
  --el-table-header-text-color: #ffd700;
  --el-table-row-hover-bg-color: rgba(255, 215, 0, 0.1);
  --el-table-border-color: rgba(255, 255, 255, 0.1);
}

.slot-table :deep(.el-table th) {
  background: rgba(255, 255, 255, 0.08);
}

.time-display {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-weight: 500;
}

.session-badge {
  display: inline-flex;
  align-items: center;
}

.form-tip {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  margin-top: 4px;
}

.slot-dialog :deep(.el-dialog) {
  background: #1a2a4a;
  border: 1px solid rgba(255, 215, 0, 0.2);
}

.slot-dialog :deep(.el-dialog__title),
.slot-dialog :deep(.el-form-item__label),
.slot-dialog :deep(.el-radio__label) {
  color: #fff;
}

.slot-dialog :deep(.el-radio__inner) {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.5);
}

:deep(.el-empty) {
  --el-empty-description-color: rgba(255, 255, 255, 0.5);
}
</style>
