<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const navItems = [
  { label: 'Explore', to: '/' },
  { label: 'Submit App', to: '/dashboard' }
];

const isAuthPage = computed(() => ['/login', '/register', '/reset-password'].includes(route.path));

const logout = async () => {
  await authStore.logout();
  await router.push('/');
};
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
      <router-link to="/" class="flex items-center gap-3">
        <span
          class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 font-display text-lg font-semibold text-white"
        >
          OA
        </span>
        <div>
          <p class="font-display text-lg font-semibold text-slate-900">OpenAltMarket</p>
          <p class="text-xs text-slate-500">Discover. Fork. Customize.</p>
        </div>
      </router-link>

      <nav class="hidden items-center gap-8 md:flex" aria-label="Main navigation">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="text-sm font-medium text-slate-600 transition hover:text-brand-700"
        >
          {{ item.label }}
        </router-link>
      </nav>

      <div class="flex items-center gap-3">
        <template v-if="authStore.isAuthenticated">
          <router-link
            to="/dashboard"
            class="hidden rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-600 hover:text-brand-700 sm:inline-flex"
          >
            Dashboard
          </router-link>
          <button
            type="button"
            class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            @click="logout"
          >
            Logout
          </button>
        </template>
        <template v-else>
          <router-link
            v-if="!isAuthPage"
            to="/login"
            class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-600 hover:text-brand-700"
          >
            Login
          </router-link>
          <router-link
            to="/register"
            class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Register
          </router-link>
        </template>
      </div>
    </div>
  </header>
</template>