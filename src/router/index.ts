import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import LoginView from '@/views/LoginView.vue';
import RegisterView from '@/views/RegisterView.vue';
import ResetPasswordView from '@/views/ResetPasswordView.vue';
import DashboardView from '@/views/DashboardView.vue';
import ExploreView from '@/views/ExploreView.vue';
import NotFoundView from '@/views/NotFoundView.vue';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresGuest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { requiresGuest: true }
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: ResetPasswordView,
      meta: { requiresGuest: true }
    },
    {
      path: '/explore',
      name: 'explore',
      component: ExploreView
    },
    {
      path: '/submit',
      name: 'submit',
      redirect: { name: 'dashboard-submit' }
    },
    {
      path: '/dashboard',
      component: DashboardView,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'dashboard', component: () => import('@/views/dashboard/OverviewTab.vue') },
        { path: 'submit', name: 'dashboard-submit', component: () => import('@/views/dashboard/SubmitTab.vue') },
        {
          path: 'submissions',
          name: 'dashboard-submissions',
          component: () => import('@/views/dashboard/MySubmissionsTab.vue')
        },
      ]
    },
    {
      path: '/admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        { path: '', name: 'admin', redirect: { name: 'admin-review' } },
        { path: 'review', name: 'admin-review', component: () => import('@/views/admin/ReviewQueueTab.vue') },
        { path: 'submissions', name: 'admin-submissions', component: () => import('@/views/admin/AllSubmissionsTab.vue') },
        { path: 'users', name: 'admin-users', component: () => import('@/views/admin/UsersTab.vue') }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView
    }
  ]
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  await authStore.init();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath }
    };
  }

  if (to.meta.requiresAdmin) {
    const role = authStore.profile?.role;
    if (role !== 'admin' && role !== 'super_admin') {
      return { name: 'dashboard' };
    }
  }

  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return { name: 'dashboard' };
  }

  return true;
});

export default router;