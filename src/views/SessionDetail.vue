<template>
  <div class="session-detail-page">
    <el-page-header @back="goBack" class="page-header">
      <template #content>
        <span class="header-title">场次详情</span>
      </template>
    </el-page-header>

    <div v-if="session" class="detail-content">
      <el-row :gutter="24">
        <el-col :md="16" :xs="24">
          <el-card class="info-card card-stars">
            <div class="card-header">
              <div class="exhibit-badge">{{ session.exhibitName }}</div>
              <el-tag 
                :type="session.status === 'full' ? 'danger' : 'success'" 
                effect="dark"
                size="large"
              >
                {{ session.status === 'full' ? '已满员' : '可预约' }}
              </el-tag>
            </div>
            
            <h2 class="session-title">{{ session.description }}</h2>
            
            <div class="session-meta">
              <div class="meta-row">
                <div class="meta-item">
                  <el-icon color="#ffd700"><Calendar /></el-icon>
                  <span class="meta-label">日期</span>
                  <span class="meta-value">{{ session.date }}</span>
                </div>
                <div class="meta-item">
                  <el-icon color="#ffd700"><Clock /></el-icon>
                  <span class="meta-label">时间</span>
                  <span class="meta-value">{{ session.startTime }} - {{ session.endTime }}</span>
                </div>
              </div>
              <div class="meta-row">
                <div class="meta-item">
                  <el-icon color="#ffd700"><User /></el-icon>
                  <span class="meta-label">讲解员</span>
                  <span class="meta-value">{{ session.guideName }}</span>
                </div>
                <div class="meta-item">
                  <el-icon color="#ffd700"><Tickets /></el-icon>
                  <span class="meta-label">票价</span>
                  <span class="meta-value price">¥{{ session.price }}/人</span>
                </div>
              </div>
            </div>

            <div class="capacity-section">
              <div class="capacity-header">
                <span>预约进度</span>
                <span class="capacity-numbers">
                  <strong>{{ session.bookedCount }}</strong> / {{ session.capacity }} 人
                </span>
              </div>
              <el-progress 
                :percentage="Math.round((session.bookedCount / session.capacity) * 100)"
                :color="progressColor"
                :stroke-width="12"
              />
              <div v-if="isAlmostFull" class="warning-tip">
                <el-icon color="#e6a23c"><Warning /></el-icon>
                即将满员，仅剩 <strong>{{ remainingCount }}</strong> 个名额
              </div>
              <div v-if="isFull" class="full-tip">
                <el-icon color="#f56c6c"><CircleClose /></el-icon>
                该场次已满员，无法预约
              </div>
            </div>

            <div class="exhibit-info" v-if="exhibit">
              <h3>展项介绍</h3>
              <p>{{ exhibit.description }}</p>
              <div class="exhibit-tags">
                <el-tag size="small" v-for="tag in exhibit.tags" :key="tag">
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :md="8" :xs="24">
          <el-card class="action-card">
            <h3>预约此场次</h3>
            
            <el-form :model="bookForm" :rules="bookRules" ref="bookFormRef" label-width="80px">
              <el-form-item label="手机号" prop="phone">
                <el-input 
                  v-model="bookForm.phone" 
                  placeholder="11位手机号码"
                  maxlength="11"
                  show-password
                />
              </el-form-item>
              <el-form-item label="人数" prop="peopleCount">
                <el-input-number 
                  v-model="bookForm.peopleCount" 
                  :min="1" 
                  :max="maxBookCount"
                  :disabled="isFull"
                  controls-position="right"
                />
              </el-form-item>
              <el-form-item label="姓名" prop="name">
                <el-input 
                  v-model="bookForm.name" 
                  placeholder="联系人姓名"
                  :disabled="isFull"
                />
              </el-form-item>
              <el-form-item label="备注">
                <el-input 
                  v-model="bookForm.remark" 
                  type="textarea" 
                  :rows="3" 
                  placeholder="选填"
                  :disabled="isFull"
                />
              </el-form-item>
            </el-form>

            <div class="price-summary">
              <div class="price-row">
                <span>单价</span>
                <span>¥{{ session.price }}</span>
              </div>
              <div class="price-row">
                <span>人数</span>
                <span>× {{ bookForm.peopleCount }}</span>
              </div>
              <div class="price-row total">
                <span>合计</span>
                <span class="total-price">¥{{ totalPrice }}</span>
              </div>
            </div>

            <el-button 
              type="primary" 
              size="large" 
              class="book-btn"
              :disabled="isFull"
              @click="handleBook"
            >
              <el-icon><Tickets /></el-icon>
              {{ isFull ? '场次已满' : '保存预约草稿' }}
            </el-button>

            <div class="tips">
              <p><el-icon color="#ffd700"><InfoFilled /></el-icon> 温馨提示</p>
              <ul>
                <li>同一手机号当日只能保留一个预约草稿</li>
                <li>预约后请在15分钟内确认，否则将自动取消</li>
                <li>满员场次预约按钮将自动禁用</li>
              </ul>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <div v-if="otherSessions.length > 0" class="other-sessions">
        <h3 class="section-title">
          <el-icon><Collection /></el-icon>
          同展项其他场次
        </h3>
        <el-row :gutter="16">
          <el-col :sm="12" :md="8" v-for="s in otherSessions" :key="s.id">
            <el-card class="mini-session-card" @click="switchSession(s.id)">
              <div class="mini-header">
                <span class="mini-date">{{ s.date }}</span>
                <el-tag 
                  :type="s.status === 'full' ? 'danger' : 'success'" 
                  size="small"
                  effect="dark"
                >
                  {{ s.status === 'full' ? '满员' : '可约' }}
                </el-tag>
              </div>
              <div class="mini-time">
                <el-icon><Clock /></el-icon>
                {{ s.startTime }} - {{ s.endTime }}
              </div>
              <div class="mini-footer">
                <span class="mini-capacity">{{ s.bookedCount }}/{{ s.capacity }}人</span>
                <span class="mini-price">¥{{ s.price }}</span>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>

    <el-empty v-else description="场次不存在或已取消" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  sessionsApi, 
  exhibitsApi, 
  draftsApi, 
  validatePhone 
} from '@/utils/storage'

const route = useRoute()
const router = useRouter()

const session = ref(null)
const exhibit = ref(null)
const otherSessions = ref([])
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
        callback(new Error('请输入正确的11位手机号'))
      }
      callback()
    }, trigger: 'blur' }
  ],
  peopleCount: [
    { required: true, message: '请选择人数', trigger: 'change' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ]
}

const isFull = computed(() => session.value?.status === 'full')
const isAlmostFull = computed(() => {
  if (!session.value) return false
  return session.value.bookedCount / session.value.capacity >= 0.8 && !isFull.value
})
const remainingCount = computed(() => {
  if (!session.value) return 0
  return session.value.capacity - session.value.bookedCount
})
const maxBookCount = computed(() => Math.min(10, remainingCount.value))
const totalPrice = computed(() => (session.value?.price || 0) * bookForm.value.peopleCount)
const progressColor = computed(() => {
  if (!session.value) return '#67c23a'
  const ratio = session.value.bookedCount / session.value.capacity
  if (ratio >= 1) return '#f56c6c'
  if (ratio >= 0.8) return '#e6a23c'
  return '#67c23a'
})

onMounted(() => {
  loadSession(route.params.id)
})

const loadSession = (id) => {
  session.value = sessionsApi.getById(id)
  if (session.value) {
    exhibit.value = exhibitsApi.getById(session.value.exhibitId)
    otherSessions.value = sessionsApi.getByExhibitId(session.value.exhibitId)
      .filter(s => s.id !== id)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
      .slice(0, 6)
  }
}

const goBack = () => {
  router.push('/sessions')
}

const switchSession = (id) => {
  loadSession(id)
  router.replace(`/session/${id}`)
}

const handleBook = async () => {
  if (isFull.value) {
    ElMessage.warning('该场次已满员')
    return
  }
  
  await bookFormRef.value.validate()
  
  const hasConflict = draftsApi.checkPhoneAndDateConflict(
    bookForm.value.phone,
    session.value.date
  )
  
  if (hasConflict) {
    try {
      await ElMessageBox.confirm(
        '该手机号当日已有预约草稿，是否覆盖原有草稿？',
        '提示',
        { type: 'warning' }
      )
      const existing = draftsApi.getByPhoneAndDate(bookForm.value.phone, session.value.date)
      if (existing) draftsApi.delete(existing.id)
    } catch {
      return
    }
  }
  
  const result = draftsApi.create({
    phone: bookForm.value.phone,
    name: bookForm.value.name,
    peopleCount: bookForm.value.peopleCount,
    remark: bookForm.value.remark,
    sessionId: session.value.id,
    sessionName: session.value.exhibitName,
    date: session.value.date,
    startTime: session.value.startTime,
    endTime: session.value.endTime,
    guideName: session.value.guideName,
    price: session.value.price,
    totalPrice: totalPrice.value
  })
  
  if (result.success) {
    ElMessage.success('预约草稿已保存')
    router.push('/draft')
  } else {
    ElMessage.error(result.message)
  }
}
</script>

<style scoped>
.page-header {
  margin-bottom: 24px;
}

.page-header :deep(.el-page-header__content .header-title) {
  color: #fff;
  font-size: 20px;
  font-weight: 600;
}

.page-header :deep(.el-page-header__left) {
  color: #ffd700;
}

.detail-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.info-card, .action-card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-bottom: 24px;
}

.info-card :deep(.el-card__body),
.action-card :deep(.el-card__body) {
  padding: 28px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.exhibit-badge {
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: #0a1628;
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
}

.session-title {
  color: #fff;
  font-size: 22px;
  margin: 0 0 24px 0;
}

.session-meta {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.meta-row {
  display: flex;
  gap: 32px;
  margin-bottom: 12px;
}

.meta-row:last-child {
  margin-bottom: 0;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.meta-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.meta-value {
  color: #fff;
  font-weight: 500;
}

.meta-value.price {
  color: #ffd700;
  font-size: 18px;
}

.capacity-section {
  margin-bottom: 24px;
}

.capacity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: #fff;
}

.capacity-numbers strong {
  color: #ffd700;
  font-size: 18px;
}

.warning-tip, .full-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 13px;
}

.warning-tip {
  background: rgba(230, 162, 60, 0.15);
  color: #e6a23c;
}

.full-tip {
  background: rgba(245, 108, 108, 0.15);
  color: #f56c6c;
}

.exhibit-info h3 {
  color: #fff;
  margin: 0 0 12px 0;
  font-size: 16px;
}

.exhibit-info p {
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.8;
  margin-bottom: 12px;
}

.exhibit-tags {
  display: flex;
  gap: 8px;
}

.action-card h3 {
  color: #fff;
  margin: 0 0 20px 0;
  font-size: 18px;
}

.action-card :deep(.el-form-item__label) {
  color: rgba(255, 255, 255, 0.8);
}

.price-summary {
  background: rgba(255, 215, 0, 0.1);
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
}

.price-row {
  display: flex;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
}

.price-row:last-child {
  margin-bottom: 0;
}

.price-row.total {
  border-top: 1px solid rgba(255, 215, 0, 0.2);
  padding-top: 8px;
  margin-top: 8px;
  font-weight: 600;
}

.total-price {
  color: #ffd700;
  font-size: 20px;
}

.book-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  margin-bottom: 20px;
}

.tips {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 16px;
}

.tips p {
  color: #fff;
  margin: 0 0 10px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tips ul {
  margin: 0;
  padding-left: 20px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  line-height: 1.8;
}

.section-title {
  color: #fff;
  font-size: 18px;
  margin: 16px 0 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title .el-icon {
  color: #ffd700;
}

.mini-session-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 16px;
}

.mini-session-card:hover {
  border-color: rgba(255, 215, 0, 0.3);
  transform: translateY(-2px);
}

.mini-session-card :deep(.el-card__body) {
  padding: 16px;
}

.mini-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.mini-date {
  color: #fff;
  font-weight: 500;
}

.mini-time {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 12px;
}

.mini-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.mini-capacity {
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

.mini-price {
  color: #ffd700;
  font-weight: 600;
}

:deep(.el-empty) {
  --el-empty-description-color: rgba(255, 255, 255, 0.5);
}
</style>
