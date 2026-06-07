<template>
  <div class="exhibits-page">
    <h2 class="page-title">
      <el-icon><Picture /></el-icon>
      展项列表
    </h2>
    <p class="page-subtitle">探索天文馆的精彩展项，选择您感兴趣的内容预约体验</p>

    <div class="filter-bar">
      <el-radio-group v-model="filterType" @change="filterExhibits">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="互动展项">互动展项</el-radio-button>
        <el-radio-button value="VR体验">VR体验</el-radio-button>
        <el-radio-button value="天象表演">天象表演</el-radio-button>
        <el-radio-button value="观测体验">观测体验</el-radio-button>
        <el-radio-button value="实物展览">实物展览</el-radio-button>
      </el-radio-group>
      <el-checkbox v-model="showRecommended" @change="filterExhibits">
        仅显示推荐
      </el-checkbox>
    </div>

    <el-row :gutter="24" class="exhibits-grid">
      <el-col :xs="24" :sm="12" :md="8" v-for="exhibit in filteredExhibits" :key="exhibit.id">
        <el-card class="exhibit-card card-stars" shadow="hover">
          <div class="card-image">
            <img :src="exhibit.image" :alt="exhibit.name" />
            <el-tag v-if="exhibit.recommended" class="recommend-tag" type="warning" effect="dark">
              推荐
            </el-tag>
            <el-tag class="type-tag" :type="getTypeTagType(exhibit.type)">
              {{ exhibit.type }}
            </el-tag>
          </div>
          <div class="card-content">
            <h3 class="card-title">{{ exhibit.name }}</h3>
            <p class="card-desc">{{ exhibit.description }}</p>
            <div class="card-meta">
              <div class="meta-item">
                <el-icon><Clock /></el-icon>
                <span>{{ exhibit.duration }}分钟</span>
              </div>
              <div class="meta-item">
                <el-icon><User /></el-icon>
                <span>容纳{{ exhibit.capacity }}人</span>
              </div>
              <div class="meta-item">
                <el-icon><Location /></el-icon>
                <span>{{ exhibit.location }}</span>
              </div>
            </div>
            <div class="card-tags">
              <el-tag size="small" v-for="tag in exhibit.tags" :key="tag" effect="plain">
                {{ tag }}
              </el-tag>
            </div>
            <div class="card-actions">
              <el-button type="primary" @click="viewSessions(exhibit.id)">
                查看场次
                <el-icon><ArrowRight /></el-icon>
              </el-button>
              <el-button @click="addToGuide(exhibit)">
                加入导览
                <el-icon><Plus /></el-icon>
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-empty v-if="filteredExhibits.length === 0" description="暂无符合条件的展项" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { exhibitsApi, guideListsApi } from '@/utils/storage'

const router = useRouter()
const exhibits = ref([])
const filterType = ref('all')
const showRecommended = ref(false)

const filteredExhibits = computed(() => {
  let result = exhibits.value
  if (filterType.value !== 'all') {
    result = result.filter(e => e.type === filterType.value)
  }
  if (showRecommended.value) {
    result = result.filter(e => e.recommended)
  }
  return result
})

onMounted(() => {
  exhibits.value = exhibitsApi.getAll()
})

const filterExhibits = () => {
}

const getTypeTagType = (type) => {
  const typeMap = {
    '互动展项': 'primary',
    'VR体验': 'success',
    '天象表演': 'warning',
    '观测体验': 'danger',
    '实物展览': 'info'
  }
  return typeMap[type] || 'info'
}

const viewSessions = (exhibitId) => {
  router.push({ path: '/sessions', query: { exhibitId } })
}

const addToGuide = (exhibit) => {
  const customGuideId = 'guide_custom'
  let guides = guideListsApi.getAll()
  let customGuide = guides.find(g => g.id === customGuideId)
  
  if (!customGuide) {
    customGuide = {
      id: customGuideId,
      name: '我的自定义导览',
      description: '您自定义选择的展项组合',
      exhibits: [],
      duration: 0,
      difficulty: 'custom',
      audience: '自定义',
      recommended: false
    }
    guides.push(customGuide)
  }
  
  if (!customGuide.exhibits.includes(exhibit.id)) {
    customGuide.exhibits.push(exhibit.id)
    customGuide.duration += exhibit.duration
    localStorage.setItem('planetarium_guide_lists', JSON.stringify(guides))
    ElMessage.success(`已将「${exhibit.name}」加入自定义导览清单`)
  } else {
    ElMessage.info(`「${exhibit.name}」已在导览清单中`)
  }
}
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  flex-wrap: wrap;
  gap: 16px;
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

.filter-bar :deep(.el-checkbox__label) {
  color: rgba(255, 255, 255, 0.8);
}

.exhibits-grid {
  margin: 0;
}

.exhibit-card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-bottom: 24px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.exhibit-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 215, 0, 0.3);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.exhibit-card :deep(.el-card__body) {
  padding: 0;
}

.card-image {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.exhibit-card:hover .card-image img {
  transform: scale(1.05);
}

.recommend-tag {
  position: absolute;
  top: 12px;
  left: 12px;
}

.type-tag {
  position: absolute;
  top: 12px;
  right: 12px;
}

.card-content {
  padding: 20px;
}

.card-title {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 10px 0;
}

.card-desc {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 16px;
  height: 62px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.meta-item .el-icon {
  color: #ffd700;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.card-actions .el-button {
  flex: 1;
}

:deep(.el-empty) {
  --el-empty-description-color: rgba(255, 255, 255, 0.5);
}
</style>
