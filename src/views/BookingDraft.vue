<template>
  <div class="draft-page">
    <h2 class="page-title">
      <el-icon><Document /></el-icon>
      我的预约
    </h2>
    <p class="page-subtitle">查看和管理您的预约记录，同一手机号同日只能保留一个草稿</p>

    <el-card class="phone-verify-card" v-if="!verifiedPhone">
      <h3>
        <el-icon color="#ffd700"><Iphone /></el-icon>
        手机号验证
      </h3>
      <p class="tip-text">请输入您的手机号查看预约草稿和历史记录</p>
      
      <el-form :model="verifyForm" :rules="verifyRules" ref="verifyFormRef" inline>
        <el-form-item prop="phone">
          <el-input 
            v-model="verifyForm.phone" 
            placeholder="请输入11位手机号码"
            maxlength="11"
            clearable
            class="phone-input"
          >
            <template #prefix>
              <el-icon><Iphone /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="verifyPhone">
            <el-icon><Search /></el-icon>
            查询我的预约
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div v-else>
      <div class="user-info-bar">
        <div class="user-info">
          <el-avatar :size="40" class="user-avatar">
            <el-icon><UserFilled /></el-icon>
          </el-avatar>
          <div class="user-detail">
            <span class="user-phone">{{ verifiedPhone }}</span>
            <span class="user-tip">预约记录仅保存在本地浏览器</span>
          </div>
        </div>
        <el-button text @click="logout">
          <el-icon><Switch /></el-icon>
          切换手机号
        </el-button>
      </div>

      <el-tabs v-model="activeTab" class="draft-tabs">
        <el-tab-pane label="预约草稿" name="draft">
          <div v-if="currentDraft" class="draft-card">
            <div class="draft-header">
              <div class="draft-status">
                <el-tag type="warning" effect="dark" size="large">
                  <el-icon><EditPen /></el-icon>
                  待确认
                </el-tag>
                <span class="draft-time">
                  创建于 {{ formatTime(currentDraft.createdAt) }}
                </span>
              </div>
              <div class="draft-actions">
                <el-button type="primary" size="small" @click="confirmDraft(currentDraft)">
                  <el-icon><Check /></el-icon>
                  确认预约
                </el-button>
                <el-button size="small" @click="editDraft(currentDraft)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button type="danger" size="small" @click="cancelDraft(currentDraft)">
                  <el-icon><Delete /></el-icon>
                  取消
                </el-button>
              </div>
            </div>

            <el-descriptions :column="2" border class="draft-info">
              <el-descriptions-item label="展项名称">
                {{ currentDraft.sessionName }}
              </el-descriptions-item>
              <el-descriptions-item label="场次时间">
                {{ currentDraft.date }} {{ currentDraft.startTime }} - {{ currentDraft.endTime }}
              </el-descriptions-item>
              <el-descriptions-item label="联系人">
                {{ currentDraft.name }}
              </el-descriptions-item>
              <el-descriptions-item label="预约人数">
                {{ currentDraft.peopleCount }} 人
              </el-descriptions-item>
              <el-descriptions-item label="讲解员">
                {{ currentDraft.guideName }}
              </el-descriptions-item>
              <el-descriptions-item label="费用合计">
                <span class="total-price">¥{{ currentDraft.totalPrice }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="备注" :span="2">
                {{ currentDraft.remark || '无' }}
              </el-descriptions-item>
            </el-descriptions>

            <div class="warning-box">
              <el-icon color="#e6a23c"><Warning /></el-icon>
              <p>同一手机号当日只能保留一个预约草稿，确认后将自动锁定名额</p>
            </div>
          </div>

          <el-empty v-else description="暂无预约草稿，快去选择场次吧">
            <el-button type="primary" @click="goToSessions">
              <el-icon><Calendar /></el-icon>
              浏览场次
            </el-button>
          </el-empty>
        </el-tab-pane>

        <el-tab-pane label="历史预约" name="history">
          <el-table :data="confirmedBookings" class="history-table" stripe>
            <el-table-column prop="sessionName" label="展项名称" />
            <el-table-column label="场次时间" width="240">
              <template #default="{ row }">
                {{ row.date }} {{ row.startTime }} - {{ row.endTime }}
              </template>
            </el-table-column>
            <el-table-column prop="name" label="联系人" width="100" />
            <el-table-column prop="peopleCount" label="人数" width="80" />
            <el-table-column label="费用" width="100">
              <template #default="{ row }">
                <span class="price">¥{{ row.totalPrice }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag type="success" size="small" effect="dark">已确认</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="预约时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.bookingDate) }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="confirmedBookings.length === 0" description="暂无历史预约记录" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog 
      v-model="showEditDialog" 
      title="编辑预约草稿" 
      width="500px"
      class="edit-dialog"
    >
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px">
        <el-form-item label="场次信息">
          <div class="session-info">
            {{ editingDraft?.sessionName }} | {{ editingDraft?.date }} {{ editingDraft?.startTime }}
          </div>
        </el-form-item>
        <el-form-item label="预约人数" prop="peopleCount">
          <el-input-number 
            v-model="editForm.peopleCount" 
            :min="1" 
            :max="maxEditCount"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="联系人" prop="name">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog 
      v-model="showConfirmDialog" 
      title="确认预约" 
      width="420px"
      class="confirm-dialog"
    >
      <div class="confirm-content">
        <el-icon :size="48" color="#ffd700"><Warning /></el-icon>
        <h3>确认提交预约？</h3>
        <p>确认后将锁定您的预约名额，无法再修改人数</p>
        <div class="confirm-summary">
          <p><strong>{{ editingDraft?.sessionName }}</strong></p>
          <p>{{ editingDraft?.date }} {{ editingDraft?.startTime }} - {{ editingDraft?.endTime }}</p>
          <p>人数：{{ editingDraft?.peopleCount }} 人</p>
          <p>费用：<span class="price">¥{{ editingDraft?.totalPrice }}</span></p>
        </div>
      </div>
      <template #footer>
        <el-button @click="showConfirmDialog = false">再想想</el-button>
        <el-button type="primary" @click="submitConfirm">
          确认预约
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  draftsApi, 
  bookingsApi, 
  sessionsApi, 
  validatePhone,
  getTodayStr
} from '@/utils/storage'

const router = useRouter()

const verifiedPhone = ref('')
const activeTab = ref('draft')
const verifyFormRef = ref(null)
const editFormRef = ref(null)
const showEditDialog = ref(false)
const showConfirmDialog = ref(false)
const editingDraft = ref(null)

const verifyForm = ref({
  phone: ''
})

const editForm = ref({
  peopleCount: 1,
  name: '',
  remark: ''
})

const verifyRules = {
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (!validatePhone(value)) {
        callback(new Error('请输入正确的11位手机号码'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ]
}

const editRules = {
  peopleCount: [{ required: true, message: '请选择人数', trigger: 'change' }],
  name: [{ required: true, message: '请输入联系人', trigger: 'blur' }]
}

const allDrafts = computed(() => draftsApi.getAll())
const currentDraft = computed(() => {
  if (!verifiedPhone.value) return null
  return allDrafts.value.find(
    d => d.phone === verifiedPhone.value && 
         d.date === getTodayStr() && 
         d.status === 'draft'
  )
})

const confirmedBookings = computed(() => {
  if (!verifiedPhone.value) return []
  return bookingsApi.getByPhone(verifiedPhone.value)
    .filter(b => b.status === 'confirmed')
    .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
})

const maxEditCount = computed(() => {
  if (!editingDraft.value) return 1
  const session = sessionsApi.getById(editingDraft.value.sessionId)
  if (!session) return 1
  return Math.min(10, session.capacity - session.bookedCount + (editingDraft.value.peopleCount || 0))
})

onMounted(() => {
  const savedPhone = localStorage.getItem('planetarium_verified_phone')
  if (savedPhone && validatePhone(savedPhone)) {
    verifiedPhone.value = savedPhone
  }
})

const verifyPhone = async () => {
  await verifyFormRef.value.validate()
  verifiedPhone.value = verifyForm.value.phone
  localStorage.setItem('planetarium_verified_phone', verifiedPhone.value)
  ElMessage.success('验证成功')
}

const logout = () => {
  verifiedPhone.value = ''
  verifyForm.value.phone = ''
  localStorage.removeItem('planetarium_verified_phone')
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const goToSessions = () => {
  router.push('/sessions')
}

const editDraft = (draft) => {
  editingDraft.value = { ...draft }
  editForm.value = {
    peopleCount: draft.peopleCount,
    name: draft.name,
    remark: draft.remark || ''
  }
  showEditDialog.value = true
}

const saveEdit = async () => {
  await editFormRef.value.validate()
  
  const session = sessionsApi.getById(editingDraft.value.sessionId)
  if (session && editForm.value.peopleCount > (session.capacity - session.bookedCount + editingDraft.value.peopleCount)) {
    ElMessage.error('剩余名额不足')
    return
  }
  
  const result = draftsApi.update(editingDraft.value.id, {
    ...editForm.value,
    totalPrice: (session?.price || editingDraft.value.price) * editForm.value.peopleCount
  })
  
  if (result.success) {
    ElMessage.success('修改成功')
    showEditDialog.value = false
  }
}

const confirmDraft = (draft) => {
  const validateResult = draftsApi.validateDraftCapacity(draft.id)
  if (validateResult.success && !validateResult.isValid) {
    const { realtime, draft: draftInfo } = validateResult
    if (realtime.remaining <= 0) {
      ElMessageBox.alert(
        `场次「${draftInfo.sessionName}」${draftInfo.date} ${draftInfo.startTime} 已满员，请重新选择场次。`,
        '名额不足',
        { confirmButtonText: '知道了', type: 'warning' }
      )
      return
    } else {
      ElMessageBox.alert(
        `该场次名额已发生变化，剩余${realtime.remaining}个名额，您的草稿预约${draftInfo.peopleCount}人。请减少人数或选择其他场次。`,
        '名额不足',
        { confirmButtonText: '知道了', type: 'warning' }
      )
      return
    }
  }
  editingDraft.value = { ...draft }
  showConfirmDialog.value = true
}

const submitConfirm = () => {
  const result = draftsApi.submitAtomic(editingDraft.value.id)
  if (result.success) {
    ElMessage.success('预约确认成功！')
    showConfirmDialog.value = false
    activeTab.value = 'history'
  } else {
    if (result.error === 'full') {
      ElMessageBox.alert(
        result.message,
        '场次已满员',
        { confirmButtonText: '重新选择', type: 'error' }
      ).then(() => {
        showConfirmDialog.value = false
      })
    } else if (result.error === 'insufficient') {
      ElMessageBox.confirm(
        `${result.message}\n是否修改预约人数？`,
        '名额不足',
        {
          confirmButtonText: '修改人数',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        showConfirmDialog.value = false
        editDraft(editingDraft.value)
      }).catch(() => {})
    } else {
      ElMessage.error(result.message)
    }
  }
}

const cancelDraft = (draft) => {
  ElMessageBox.confirm(
    '确定要取消这个预约草稿吗？',
    '取消确认',
    {
      confirmButtonText: '确定取消',
      cancelButtonText: '再想想',
      type: 'warning'
    }
  ).then(() => {
    draftsApi.delete(draft.id)
    ElMessage.success('已取消预约草稿')
  }).catch(() => {})
}
</script>

<style scoped>
.phone-verify-card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-bottom: 24px;
}

.phone-verify-card :deep(.el-card__body) {
  padding: 32px;
}

.phone-verify-card h3 {
  color: #fff;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
}

.tip-text {
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 20px 0;
  font-size: 14px;
}

.phone-input {
  width: 280px;
}

.user-info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 24px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  background: linear-gradient(135deg, #ffd700, #ff8c00);
}

.user-detail {
  display: flex;
  flex-direction: column;
}

.user-phone {
  color: #fff;
  font-weight: 600;
  font-size: 16px;
}

.user-tip {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.draft-tabs :deep(.el-tabs__item) {
  color: rgba(255, 255, 255, 0.6);
}

.draft-tabs :deep(.el-tabs__item.is-active) {
  color: #ffd700;
}

.draft-tabs :deep(.el-tabs__active-bar) {
  background-color: #ffd700;
}

.draft-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
}

.draft-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: rgba(255, 215, 0, 0.1);
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
}

.draft-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.draft-time {
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
}

.draft-info {
  margin: 24px;
}

.draft-info :deep(.el-descriptions__label) {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
}

.draft-info :deep(.el-descriptions__content) {
  color: #fff;
}

.total-price {
  color: #ffd700;
  font-size: 18px;
  font-weight: 600;
}

.warning-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 0 24px 24px 24px;
  padding: 16px;
  background: rgba(230, 162, 60, 0.1);
  border-radius: 8px;
}

.warning-box p {
  color: #e6a23c;
  margin: 0;
  font-size: 14px;
}

.history-table {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  overflow: hidden;
}

.history-table :deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-text-color: #fff;
  --el-table-header-text-color: #ffd700;
  --el-table-row-hover-bg-color: rgba(255, 215, 0, 0.1);
  --el-table-border-color: rgba(255, 255, 255, 0.1);
}

.history-table :deep(.el-table th) {
  background: rgba(255, 255, 255, 0.08);
}

.price {
  color: #ffd700;
  font-weight: 600;
}

.session-info {
  padding: 12px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 6px;
  color: #fff;
}

.confirm-content {
  text-align: center;
  padding: 20px 0;
}

.confirm-content h3 {
  color: #fff;
  margin: 16px 0 8px 0;
}

.confirm-content > p {
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 20px;
}

.confirm-summary {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 16px;
  text-align: left;
}

.confirm-summary p {
  color: #fff;
  margin: 8px 0;
}

.confirm-summary .price {
  color: #ffd700;
  font-size: 18px;
}

.edit-dialog :deep(.el-dialog),
.confirm-dialog :deep(.el-dialog) {
  background: #1a2a4a;
  border: 1px solid rgba(255, 215, 0, 0.2);
}

.edit-dialog :deep(.el-dialog__title),
.edit-dialog :deep(.el-form-item__label),
.confirm-dialog :deep(.el-dialog__title) {
  color: #fff;
}

:deep(.el-empty) {
  --el-empty-description-color: rgba(255, 255, 255, 0.5);
}
</style>
