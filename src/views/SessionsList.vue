<template>
  <div class="sessions-page">
    <h2 class="page-title">
      <el-icon><Calendar /></el-icon>
      星象场次
    </h2>
    <p class="page-subtitle">选择您感兴趣的场次进行预约，满员场次将自动禁用</p>

    <div class="filter-bar">
      <el-date-picker
        v-model="selectedDate"
        type="date"
        placeholder="选择日期"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        :clearable="false"
        class="date-picker"
      />
      <el-select v-model="selectedExhibit" placeholder="选择展项" class="exhibit-select">
        <el-option label="全部展项" value="" />
        <el-option 
          v-for="exhibit in exhibits" 
          :key="exhibit.id" 
          :label="exhibit.name" 
          :value="exhibit.id" 
        />
      </el-select>
      <el-radio-group v-model="statusFilter">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="available">可预约</el-radio-button>
        <el-radio-button value="full">已满员</el-radio-button>
      </el-radio-group>
    </div>

    <el-table 
      :data="filteredSessions" 
      class="sessions-table"
      stripe
      :row-class-name="getRowClassName"
    >
      <el-table-column prop="date" label="日期" width="140">
        <template #default="{ row }">
          <span class="date-text">{{ row.date }}</span>
        </template>
      </el-table-column>
      <el-table-column label="时间" width="160">
        <template #default="{ row }">
          <div class="time-slot">
            <el-icon color="#ffd700"><Clock /></el-icon>
            <span>{{ row.startTime }} - {{ row.endTime }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="exhibitName" label="展项名称" min-width="140" />
      <el-table-column prop="guideName" label="讲解员" width="120" />
      <el-table-column label="预约情况" width="180">
        <template #default="{ row }">
          <div class="capacity-info">
            <el-progress 
              :percentage="Math.round((row.bookedCount / row.capacity) * 100)"
              :color="getProgressColor(row)"
              :stroke-width="8"
              :show-text="false"
            />
            <span class="capacity-text">
              {{ row.bookedCount }}/{{ row.capacity }}人
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="price" label="价格" width="100">
        <template #default="{ row }">
          <span class="price-text">¥{{ row.price }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag 
            :type="row.status === 'full' ? 'danger' : 'success'" 
            effect="dark"
            size="small"
          >
            {{ row.status === 'full' ? '已满员' : '可预约' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button 
            type="primary" 
            size="small"
            :disabled="row.status === 'full'"
            @click="handleBook(row)"
          >
            <el-icon><Tickets /></el-icon>
            立即预约
          </el-button>
          <el-button 
            size="small" 
            @click="viewDetail(row.id)"
          >
            详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="filteredSessions.length === 0" description="暂无符合条件的场次" />

    <el-dialog 
      v-model="showBookDialog" 
      title="预约场次" 
      width="500px"
      class="book-dialog"
    >
      <el-form :model="bookForm" :rules="bookRules" ref="bookFormRef" label-width="100px">
        <el-form-item label="场次信息">
          <div class="session-info">
            <p><strong>{{ selectedSession?.exhibitName }}</strong></p>
            <p>{{ selectedSession?.date }} {{ selectedSession?.startTime }} - {{ selectedSession?.endTime }}</p>
            <p>讲解员：{{ selectedSession?.guideName }}</p>
            <p>票价：¥{{ selectedSession?.price }}/人</p>
          </div>
        </el-form-item>
        <el-form-item label="手机号码" prop="phone">
          <el-input 
            v-model="bookForm.phone" 
            placeholder="请输入手机号码"
            maxlength="11"
            show-password
          />
          <div class="form-tip">同一手机号当日只能保留一个预约草稿</div>
        </el-form-item>
        <el-form-item label="预约人数" prop="peopleCount">
          <el-input-number 
            v-model="bookForm.peopleCount" 
            :min="1" 
            :max="maxBookCount"
            :step="1"
            controls-position="right"
          />
          <div class="form-tip">剩余名额：{{ selectedSession ? selectedSession.capacity - selectedSession.bookedCount : 0 }}人</div>
        </el-form-item>
        <el-form-item label="联系人姓名" prop="name">
          <el-input v-model="bookForm.name" placeholder="请输入联系人姓名" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input 
            v-model="bookForm.remark" 
            type="textarea" 
            :rows="2" 
            placeholder="选填"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBookDialog = false">取消</el-button>
        <el-button type="primary" @click="submitBooking">
          保存预约草稿
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  sessionsApi, 
  exhibitsApi, 
  draftsApi,
  tempFormApi,
  validatePhone, 
  getTodayStr 
} from '@/utils/storage'

const router = useRouter()
const route = useRoute()

const sessions = ref([])
const exhibits = ref([])
const selectedDate = ref(getTodayStr())
const selectedExhibit = ref('')
const statusFilter = ref('all')
const showBookDialog = ref(false)
const selectedSession = ref(null)
const bookFormRef = ref(null)

const bookForm = ref({
  phone: '',
  peopleCount: 1,
  name: '',
  remark: ''
})

const bookRules = {
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (!validatePhone(value)) {
        callback(new Error('请输入正确的11位手机号码'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ],
  peopleCount: [
    { required: true, message: '请选择预约人数', trigger: 'change' }
  ],
  name: [
    { required: true, message: '请输入联系人姓名', trigger: 'blur' }
  ]
}

const maxBookCount = computed(() => {
  if (!selectedSession.value) return 1
  return Math.min(10, selectedSession.value.capacity - selectedSession.value.bookedCount)
})

const filteredSessions = computed(() => {
  let result = sessions.value
  
  if (selectedDate.value) {
    result = result.filter(s => s.date === selectedDate.value)
  }
  if (selectedExhibit.value) {
    result = result.filter(s => s.exhibitId === selectedExhibit.value)
  }
  if (statusFilter.value !== 'all') {
    result = result.filter(s => s.status === statusFilter.value)
  }
  
  return result.sort((a, b) => a.startTime.localeCompare(b.startTime))
})

onMounted(() => {
  loadData()
  if (route.query.exhibitId) {
    selectedExhibit.value = route.query.exhibitId
  }
})

watch(selectedDate, () => {
  loadData()
})

const loadData = () => {
  sessions.value = sessionsApi.getAll()
  exhibits.value = exhibitsApi.getAll()
}

const getRowClassName = ({ row }) => {
  return row.status === 'full' ? 'full-row' : ''
}

const getProgressColor = (row) => {
  const ratio = row.bookedCount / row.capacity
  if (ratio >= 1) return '#f56c6c'
  if (ratio >= 0.8) return '#e6a23c'
  return '#67c23a'
}

const viewDetail = (id) => {
  router.push(`/session/${id}`)
}

const handleBook = async (session) => {
  if (session.status === 'full') {
    ElMessage.warning('该场次已满员，无法预约')
    return
  }
  selectedSession.value = session
  
  const savedForm = tempFormApi.get(session.id)
  if (savedForm) {
    try {
      await ElMessageBox.confirm(
        `检测到您在「${session.exhibitName}」${session.date} ${session.startTime} 场次有未完成的预约输入，是否恢复？`,
        '恢复草稿',
        {
          confirmButtonText: '恢复输入',
          cancelButtonText: '重新填写',
          type: 'info'
        }
      )
      bookForm.value = {
        phone: savedForm.phone || '',
        peopleCount: savedForm.peopleCount || 1,
        name: savedForm.name || '',
        remark: savedForm.remark || ''
      }
    } catch {
      bookForm.value = {
        phone: '',
        peopleCount: 1,
        name: '',
        remark: ''
      }
      tempFormApi.remove(session.id)
    }
  } else {
    bookForm.value = {
      phone: '',
      peopleCount: 1,
      name: '',
      remark: ''
    }
  }
  showBookDialog.value = true
}

const saveTempForm = () => {
  if (selectedSession.value) {
    tempFormApi.save(selectedSession.value.id, { ...bookForm.value })
  }
}

const submitBooking = async () => {
  if (!bookFormRef.value) return
  
  try {
    await bookFormRef.value.validate()
  } catch (e) {
    saveTempForm()
    ElMessage.warning('请完善表单信息后再提交，已自动保存您的输入')
    return
  }
  
  saveTempForm()
  
  const hasConflict = draftsApi.checkPhoneAndDateConflict(
    bookForm.value.phone,
    selectedSession.value.date
  )
  
  if (hasConflict) {
    try {
      await ElMessageBox.confirm(
        '该手机号当日已有预约草稿，是否继续？继续将覆盖原有草稿。',
        '提示',
        {
          confirmButtonText: '继续预约',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      const existingDraft = draftsApi.getByPhoneAndDate(
        bookForm.value.phone,
        selectedSession.value.date
      )
      if (existingDraft) {
        draftsApi.delete(existingDraft.id)
      }
      await createDraft()
    } catch (e) {
      if (e !== 'cancel') {
        saveTempForm()
      }
    }
    return
  }
  
  await createDraft()
}

const createDraft = async () => {
  const draftData = {
    phone: bookForm.value.phone,
    name: bookForm.value.name,
    peopleCount: bookForm.value.peopleCount,
    remark: bookForm.value.remark,
    sessionId: selectedSession.value.id,
    sessionName: selectedSession.value.exhibitName,
    date: selectedSession.value.date,
    startTime: selectedSession.value.startTime,
    endTime: selectedSession.value.endTime,
    guideName: selectedSession.value.guideName,
    price: selectedSession.value.price,
    totalPrice: selectedSession.value.price * bookForm.value.peopleCount
  }
  
  const result = draftsApi.create(draftData)
  
  if (result.success) {
    tempFormApi.remove(selectedSession.value.id)
    ElMessage.success('预约草稿已保存，请到"我的预约"中确认')
    showBookDialog.value = false
    loadData()
  } else {
    saveTempForm()
    
    let errorMsg = result.message
    let errorTitle = '预约失败'
    let showDetail = false
    let detailContent = ''
    
    if (result.error === 'full') {
      errorTitle = '场次已满员'
      detailContent = `「${result.session?.exhibitName}」${result.session?.date} ${result.session?.startTime} 场次已无剩余名额，建议选择其他场次。`
      showDetail = true
    } else if (result.error === 'insufficient') {
      errorTitle = '名额不足'
      const remaining = result.capacity?.remaining ?? 0
      detailContent = `该场次仅剩 ${remaining} 个名额，请调整预约人数或选择其他场次。`
      showDetail = true
    } else if (result.error === 'conflict') {
      errorTitle = '存在冲突草稿'
      detailContent = `您在 ${result.existingDraft?.date} 已有一个预约草稿，请先完成或取消该草稿后再预约。`
      showDetail = true
    } else if (result.error === 'invalid_session') {
      errorTitle = '场次无效'
      detailContent = '该场次可能已被取消，请返回列表重新选择。'
      showDetail = true
    }
    
    if (showDetail) {
      try {
        await ElMessageBox.alert(
          `${errorMsg}\n\n${detailContent}\n\n已自动保存您的输入，您可以修改后重新提交。`,
          errorTitle,
          {
            confirmButtonText: '知道了',
            type: 'error',
            dangerouslyUseHTMLString: false
          }
        )
      } catch (e) {}
    } else {
      ElMessage.error(`${errorMsg}（已自动保存您的输入）`)
    }
  }
}

watch(bookForm, () => {
  if (showBookDialog.value && selectedSession.value) {
    saveTempForm()
  }
}, { deep: true })
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  flex-wrap: wrap;
}

.date-picker {
  width: 180px;
}

.exhibit-select {
  width: 200px;
}

.filter-bar :deep(.el-radio-button__inner) {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
}

.filter-bar :deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  background: #ffd700;
  border-color: #ffd700;
  color: #0a1628;
}

.sessions-table {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  overflow: hidden;
}

.sessions-table :deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-text-color: #fff;
  --el-table-header-text-color: #ffd700;
  --el-table-row-hover-bg-color: rgba(255, 215, 0, 0.1);
  --el-table-border-color: rgba(255, 255, 255, 0.1);
}

.sessions-table :deep(.el-table th) {
  background: rgba(255, 255, 255, 0.08);
}

.sessions-table :deep(.el-table .full-row) {
  opacity: 0.6;
}

.date-text {
  color: #fff;
}

.time-slot {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
}

.capacity-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.capacity-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  white-space: nowrap;
}

.price-text {
  color: #ffd700;
  font-weight: 600;
}

.session-info {
  padding: 12px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 6px;
  line-height: 1.8;
  color: #fff;
}

.session-info p {
  margin: 0;
}

.form-tip {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  margin-top: 4px;
}

.book-dialog :deep(.el-dialog) {
  background: #1a2a4a;
  border: 1px solid rgba(255, 215, 0, 0.2);
}

.book-dialog :deep(.el-dialog__title),
.book-dialog :deep(.el-form-item__label) {
  color: #fff;
}

:deep(.el-empty) {
  --el-empty-description-color: rgba(255, 255, 255, 0.5);
}
</style>
