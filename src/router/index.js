import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // {
    //   path: '/',
    //   name: 'Welcome',
    //   // component: () => import('../views/welcome.vue'),
    //   component: () => import('../views/WelCome3D/Welcome3D.vue'),
    // },
    {
      path: '/Chat',
      name: 'Chat',
      component: () => import('../views/Chat.vue'),
    },
    {
      path: '/show-docx',
      name: 'ShowDocx',
      component: () => import('../views/ShowDocx.vue'),
    },
    {
      path: '/long-term-memory',
      name: 'LongTermMemory',
      component: () => import('../views/WelCome3D/LongTermMemory.vue'),
    },
    {
      path: '/',
      name: 'Timeline3D',
      component: () => import('../views/Timeline3D/Timeline3D.vue'),
    }
  ],
})

export default router
