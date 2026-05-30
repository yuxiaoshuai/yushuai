import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/auth'

const appChildren = [
  {
    path: 'home',
    name: 'Home',
    component: () => import('@/views/main/Home.vue'),
  },
  // Reserved routes (placeholders)
  {
    path: 'chat',
    name: 'Chat',
    component: () => import('@/components/UnderDevelopPage.vue'),
  },
  {
    path: 'friends',
    name: 'Friends',
    component: () => import('@/components/UnderDevelopPage.vue'),
  },
  {
    path: 'settings',
    name: 'Settings',
    component: () => import('@/components/UnderDevelopPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      // redirect: () => (getToken() ? '/other/home' : '/login'),
      redirect: '/demo',
    },

    {
      path: '/demo',
      name: 'Demo',
      component: () => import('@/views/site/cases/CaseList.vue'),
      meta: { public: true, siteTitle: '案例', siteSlug: 'demo' },
    },
    {
      path: '/demo/:caseId',
      name: 'CaseScreen',
      component: () => import('@/views/site/cases/CaseScreenHost.vue'),
      meta: { public: true, layout: 'blank' },
    },
    {
      path: '/blog',
      name: 'Blog',
      component: () => import('@/components/UnderDevelopPage.vue'),
      meta: { public: true, siteTitle: '博客', siteSlug: 'blog' },
    },
    {
      path: '/guestbook',
      name: 'Guestbook',
      component: () => import('@/components/UnderDevelopPage.vue'),
      meta: { public: true, siteTitle: '留言', siteSlug: 'guestbook' },
    },
    {
      path: '/about',
      name: 'About',
      component: () => import('@/components/UnderDevelopPage.vue'),
      meta: { public: true, siteTitle: '关于', siteSlug: 'about' },
    },

    // Auth
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/auth/Login.vue'),
      meta: { public: true, layout: 'blank' },
    },

    {
      path: '/other',
      alias: '/app',
      component: () => import('@/views/main/MainLayout.vue'),
      meta: { requiresAuth: true },
      redirect: '/other/home',
      children: appChildren,
    },

    // 404
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFound.vue'),
      meta: { public: true },
    },
  ],
})

function isSafeRedirectPath(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
}

// router.beforeEach((to, from, next) => {
//   return '/'
//   // const token = getToken()

//   // if (token && to.path === '/login') {
//   //   return '/other/home'
//   // }

//   // if (to.matched.some((record) => record.meta?.requiresAuth) && !token) {
//   //   return {
//   //     path: '/login',
//   //     query: {
//   //       redirect: isSafeRedirectPath(to.fullPath) ? to.fullPath : '/',
//   //     },
//   //   }
//   // }

//   return true
// })

export default router
