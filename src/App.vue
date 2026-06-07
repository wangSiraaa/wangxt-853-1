<template>
  <div class="app-container">
    <el-container>
      <el-header class="app-header">
        <div class="header-content">
          <div class="logo">
            <el-icon :size="28" color="#ffd700"><StarFilled /></el-icon>
            <h1>天文馆展项预约导览</h1>
          </div>
          <el-menu
            :default-active="activeMenu"
            mode="horizontal"
            router
            class="nav-menu"
            background-color="transparent"
            text-color="#fff"
            active-text-color="#ffd700"
          >
            <el-menu-item index="/exhibits">
              <el-icon><Picture /></el-icon>
              <span>展项列表</span>
            </el-menu-item>
            <el-menu-item index="/sessions">
              <el-icon><Calendar /></el-icon>
              <span>星象场次</span>
            </el-menu-item>
            <el-menu-item index="/draft">
              <el-icon><Document /></el-icon>
              <span>我的预约</span>
            </el-menu-item>
            <el-menu-item index="/guide">
              <el-icon><List /></el-icon>
              <span>导览清单</span>
            </el-menu-item>
            <el-sub-menu index="admin">
              <template #title>
                <el-icon><Setting /></el-icon>
                <span>管理后台</span>
              </template>
              <el-menu-item index="/time-slot">
                <el-icon><Clock /></el-icon>
                <span>时段维护</span>
              </el-menu-item>
              <el-menu-item index="/reception">
                <el-icon><UserFilled /></el-icon>
                <span>前台查看</span>
              </el-menu-item>
            </el-sub-menu>
          </el-menu>
        </div>
      </el-header>
      <el-main class="app-main">
        <router-view />
      </el-main>
      <el-footer class="app-footer">
        <p>© 2026 天文馆展项预约导览系统 | 数据存储于本地浏览器</p>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a1628 0%, #1a2a4a 50%, #0a1628 100%);
}

.app-header {
  background: rgba(10, 22, 40, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
  height: 70px;
  padding: 0;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo h1 {
  color: #fff;
  font-size: 20px;
  margin: 0;
  font-weight: 600;
  letter-spacing: 2px;
}

.nav-menu {
  flex: 1;
  max-width: 900px;
  margin-left: 40px;
  border-bottom: none;
}

.nav-menu :deep(.el-menu-item),
.nav-menu :deep(.el-sub-menu__title) {
  height: 70px;
  line-height: 70px;
  font-size: 15px;
}

.app-main {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding: 30px 24px;
  min-height: calc(100vh - 140px);
}

.app-footer {
  background: rgba(10, 22, 40, 0.9);
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  padding: 20px;
  border-top: 1px solid rgba(255, 215, 0, 0.1);
}

.app-footer p {
  margin: 0;
  font-size: 13px;
}
</style>
