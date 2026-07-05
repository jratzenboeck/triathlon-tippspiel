import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabase'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('../views/Dashboard.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue'),
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('../views/Signup.vue'),
  },
  {
    path: '/groups',
    name: 'groups',
    component: () => import('../views/Groups.vue'),
  },
  {
    path: '/groups/new',
    name: 'create-group',
    component: () => import('../views/CreateGroup.vue'),
  },
  {
    path: '/groups/:id',
    name: 'group-detail',
    component: () => import('../views/GroupDetail.vue'),
  },
  {
    path: '/races/:id',
    name: 'race-detail',
    component: () => import('../views/RaceDetail.vue'),
  },
  {
    path: '/invite/:token',
    name: 'invite',
    component: () => import('../views/Invite.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/Profile.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const { data: { user } } = await supabase.auth.getUser()
  const publicPages = ['login', 'signup', 'invite']
  if (!user && !publicPages.includes(to.name)) {
    return { name: 'login' }
  }
})

export default router
