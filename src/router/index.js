import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/exhibits'
  },
  {
    path: '/exhibits',
    name: 'Exhibits',
    component: () => import('@/views/ExhibitsList.vue'),
    meta: { title: '展项列表' }
  },
  {
    path: '/sessions',
    name: 'Sessions',
    component: () => import('@/views/SessionsList.vue'),
    meta: { title: '星象场次' }
  },
  {
    path: '/session/:id',
    name: 'SessionDetail',
    component: () => import('@/views/SessionDetail.vue'),
    meta: { title: '场次详情' }
  },
  {
    path: '/draft',
    name: 'Draft',
    component: () => import('@/views/BookingDraft.vue'),
    meta: { title: '我的预约' }
  },
  {
    path: '/guide',
    name: 'Guide',
    component: () => import('@/views/GuideList.vue'),
    meta: { title: '导览清单' }
  },
  {
    path: '/time-slot',
    name: 'TimeSlot',
    component: () => import('@/views/TimeSlotManage.vue'),
    meta: { title: '时段维护' }
  },
  {
    path: '/reception',
    name: 'Reception',
    component: () => import('@/views/ReceptionView.vue'),
    meta: { title: '前台查看' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || '天文馆'} - 天文馆展项预约导览`
  next()
})

export default router
