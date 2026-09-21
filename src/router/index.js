import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabase'
import { getInviteToken } from '../lib/pending-invite'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('../views/Dashboard.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('../views/ForgotPassword.vue')
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('../views/ResetPassword.vue')
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('../views/Signup.vue')
  },
  {
    path: '/bets',
    name: 'bets',
    component: () => import('../views/Bets.vue')
  },
  {
    path: '/leaderboard',
    name: 'leaderboard',
    component: () => import('../views/GlobalLeaderboard.vue')
  },
  {
    path: '/groups',
    name: 'groups',
    component: () => import('../views/Groups.vue')
  },
  {
    path: '/groups/new',
    name: 'create-group',
    component: () => import('../views/CreateGroup.vue')
  },
  {
    path: '/groups/:id',
    name: 'group-detail',
    component: () => import('../views/GroupDetail.vue')
  },
  {
    path: '/races/:id',
    name: 'race-detail',
    component: () => import('../views/RaceDetail.vue')
  },
  {
    path: '/invite/:token',
    name: 'invite',
    component: () => import('../views/Invite.vue')
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/Profile.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const {
    data: { user }
  } = await supabase.auth.getUser()
  const publicPages = ['login', 'signup', 'invite', 'forgot-password', 'reset-password']
  if (!user && !publicPages.includes(to.name)) {
    return { name: 'login' }
  }
  const pendingToken = getInviteToken()
  if (user && pendingToken && to.name !== 'invite') {
    return { path: `/invite/${pendingToken}` }
  }
})

export default router
