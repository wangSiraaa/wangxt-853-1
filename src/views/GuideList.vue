<template>
  <div class="guide-page">
    <h2 class="page-title">
      <el-icon><List /></el-icon>
      导览清单
    </h2>
    <p class="page-subtitle">精选导览路线，为您规划最佳参观体验</p>

    <el-row :gutter="24" class="guide-grid">
      <el-col :lg="12" :md="24" v-for="guide in guideLists" :key="guide.id">
        <el-card class="guide-card card-stars" shadow="hover">
          <div class="card-header">
            <div class="header-left">
              <h3 class="guide-name">{{ guide.name }}</h3>
              <el-tag 
                v-if="guide.recommended" 
                type="warning" 
                effect="dark"
                size="small"
              >
                热门推荐
              </el-tag>
            </div>
            <div class="guide-meta-badge">
              <el-icon color="#ffd700"><Clock /></el-icon>
              <span>{{ guide.duration }}分钟</span>
            </div>
          </div>

          <p class="guide-desc">{{ guide.description }}</p>

          <div class="guide-tags">
            <el-tag type="info" size="small">
              <el-icon><User /></el-icon>
              {{ guide.audience }}
            </el-tag>
            <el-tag :type="getDifficultyType(guide.difficulty)" size="small">
              {{ getDifficultyLabel(guide.difficulty) }}
            </el-tag>
            <el-tag type="success" size="small">
              {{ guide.exhibits.length }}个展项
            </el-tag>
          </div>

          <div class="exhibits-list">
            <h4>包含展项：</h4>
            <div class="exhibit-items">
              <div 
                v-for="(exhibitId, index) in guide.exhibits" 
                :key="exhibitId"
                class="exhibit-item"
              >
                <span class="exhibit-order">{{ index + 1 }}</span>
                <span class="exhibit-name">{{ getExhibitName(exhibitId) }}</span>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <div class="footer-info">
              <el-icon color="#ffd700"><Collection /></el-icon>
              <span>预计参观时间约 {{ formatDuration(guide.duration) }}</span>
            </div>
            <el-button type="primary" @click="viewExhibits(guide)">
              查看场次
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div v-if="customGuide" class="custom-guide-section">
      <h3 class="section-title">
        <el-icon><EditPen /></el-icon>
        我的自定义导览
      </h3>
      <el-card class="custom-guide-card">
        <div class="custom-header">
          <div>
            <h4>{{ customGuide.name }}</h4>
            <p class="custom-desc">{{ customGuide.description }}</p>
          </div>
          <el-button type="danger" size="small" @click="clearCustomGuide">
            <el-icon><Delete /></el-icon>
            清空
          </el-button>
        </div>
        <div v-if="customGuide.exhibits.length > 0" class="custom-exhibits">
          <div 
            v-for="(exhibitId, index) in customGuide.exhibits" 
            :key="exhibitId"
            class="custom-exhibit-item"
          >
            <span class="order">{{ index + 1 }}</span>
            <span class="name">{{ getExhibitName(exhibitId) }}</span>
            <el-button 
              type="danger" 
              link 
              size="small"
              @click="removeFromCustomGuide(exhibitId)"
            >
              移除
            </el-button>
          </div>
        </div>
        <el-empty v-else description="暂无自定义展项，去展项列表添加吧" :image-size="80" />
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { guideListsApi, exhibitsApi } from '@/utils/storage'

const router = useRouter()

const guideLists = ref([])
const exhibits = ref([])

const customGuide = computed(() => {
  const guides = guideListsApi.getAll()
  return guides.find(g => g.id === 'guide_custom')
})

onMounted(() => {
  loadData()
})

const loadData = () => {
  guideLists.value = guideListsApi.getAll().filter(g => g.id !== 'guide_custom')
  exhibits.value = exhibitsApi.getAll()
}

const getExhibitName = (id) => {
  const exhibit = exhibits.value.find(e => e.id === id)
  return exhibit ? exhibit.name : '未知展项'
}

const getDifficultyType = (difficulty) => {
  const map = {
    'easy': 'success',
    'medium': 'warning',
    'hard': 'danger',
    'custom': 'info'
  }
  return map[difficulty] || 'info'
}

const getDifficultyLabel = (difficulty) => {
  const map = {
    'easy': '轻松',
    'medium': '适中',
    'hard': '深度',
    'custom': '自定义'
  }
  return map[difficulty] || difficulty
}

const formatDuration = (minutes) => {
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
}

const viewExhibits = (guide) => {
  if (guide.exhibits.length > 0) {
    router.push({ path: '/sessions', query: { exhibitId: guide.exhibits[0] } })
  } else {
    ElMessage.info('该导览暂无展项')
  }
}

const removeFromCustomGuide = (exhibitId) => {
  const guides = guideListsApi.getAll()
  const custom = guides.find(g => g.id === 'guide_custom')
  if (custom) {
    const exhibit = exhibits.value.find(e => e.id === exhibitId)
    custom.exhibits = custom.exhibits.filter(id => id !== exhibitId)
    custom.duration -= exhibit?.duration || 0
    localStorage.setItem('planetarium_guide_lists', JSON.stringify(guides))
    loadData()
    ElMessage.success('已移除')
  }
}

const clearCustomGuide = () => {
  const guides = guideListsApi.getAll().filter(g => g.id !== 'guide_custom')
  localStorage.setItem('planetarium_guide_lists', JSON.stringify(guides))
  loadData()
  ElMessage.success('已清空自定义导览')
}
</script>

<style scoped>
.guide-grid {
  margin: 0;
}

.guide-card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-bottom: 24px;
  transition: all 0.3s ease;
}

.guide-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 215, 0, 0.3);
}

.guide-card :deep(.el-card__body) {
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.guide-name {
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.guide-meta-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 215, 0, 0.15);
  padding: 6px 12px;
  border-radius: 20px;
  color: #ffd700;
  font-weight: 500;
}

.guide-desc {
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.7;
  margin-bottom: 16px;
}

.guide-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.exhibits-list h4 {
  color: #fff;
  margin: 0 0 12px 0;
  font-size: 14px;
}

.exhibit-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.exhibit-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.exhibit-item:hover {
  background: rgba(255, 215, 0, 0.1);
}

.exhibit-order {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: #0a1628;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
}

.exhibit-name {
  color: #fff;
  flex: 1;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

.section-title {
  color: #fff;
  font-size: 20px;
  margin: 16px 0 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title .el-icon {
  color: #ffd700;
}

.custom-guide-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 12px;
}

.custom-guide-card :deep(.el-card__body) {
  padding: 24px;
}

.custom-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.custom-header h4 {
  color: #ffd700;
  margin: 0 0 8px 0;
  font-size: 18px;
}

.custom-desc {
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.custom-exhibits {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.custom-exhibit-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 215, 0, 0.05);
  border-radius: 8px;
}

.custom-exhibit-item .order {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #ffd700;
  color: #0a1628;
  border-radius: 50%;
  font-weight: 600;
  font-size: 14px;
}

.custom-exhibit-item .name {
  color: #fff;
  flex: 1;
  font-weight: 500;
}

:deep(.el-empty) {
  --el-empty-description-color: rgba(255, 255, 255, 0.5);
}
</style>
