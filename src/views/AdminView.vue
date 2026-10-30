<script setup lang="ts">
import SiteHeader from '@/components/SiteHeader.vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const tabs = [
  { label: 'Review queue', to: { name: 'admin-review' } },
  { label: 'All submissions', to: { name: 'admin-submissions' } },
  { label: 'Users & access', to: { name: 'admin-users' } }
];
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <SiteHeader />
    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header class="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-amber-700">
            {{ authStore.profile?.role?.replace('_', ' ') }} console
          </p>
          <h1 class="font-display text-3xl font-semibold text-slate-900">Administration</h1>
          <p class="mt-1 text-sm text-slate-600">Moderate submissions and manage people. Only admins can see this area.</p>
        </div>
        <router-link
          :to="{ name: 'dashboard' }"
          class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-700"
        >
          Back to my dashboard
        </router-link>
      </header>

      <div class="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Admin sections" class="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          <router-link v-for="tab in tabs" :key="tab.label" :to="tab.to" active-class="admin-tab-active" class="admin-tab">
            {{ tab.label }}
          </router-link>
        </nav>

        <div class="min-w-0">
          <router-view />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-tab {
  @apply whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-brand-700;
}
.admin-tab-active {
  @apply bg-white text-brand-700 shadow-sm ring-1 ring-slate-200;
}
</style>
