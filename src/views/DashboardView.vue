<script setup lang="ts">
import { computed } from 'vue';
import SiteHeader from '@/components/SiteHeader.vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const isAdmin = computed(() => authStore.profile?.role === 'admin' || authStore.profile?.role === 'super_admin');

const tabs = computed(() => [
  { label: 'Overview', to: { name: 'dashboard' }, exact: true },
  { label: 'Submit an app', to: { name: 'dashboard-submit' }, exact: false },
  { label: 'My submissions', to: { name: 'dashboard-submissions' }, exact: false }
]);
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <SiteHeader />
    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header class="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="font-display text-3xl font-semibold text-slate-900">Dashboard</h1>
          <p class="mt-1 text-sm text-slate-600">
            Welcome back, {{ authStore.profile?.displayName || authStore.firebaseUser?.email || 'Builder' }}.
          </p>
        </div>
        <router-link
          v-if="isAdmin"
          :to="{ name: 'admin' }"
          class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Admin console
        </router-link>
      </header>

      <section v-if="authStore.error" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ authStore.error }}
      </section>

      <section v-else-if="!authStore.profile" class="rounded-xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-600">
        Loading your profile...
      </section>

      <div v-else class="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Dashboard sections" class="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          <router-link
            v-for="tab in tabs"
            :key="tab.label"
            :to="tab.to"
            :exact-active-class="tab.exact ? 'dash-tab-active' : ''"
            :active-class="tab.exact ? '' : 'dash-tab-active'"
            class="dash-tab"
          >
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
.dash-tab {
  @apply whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-brand-700;
}
.dash-tab-active {
  @apply bg-white text-brand-700 shadow-sm ring-1 ring-slate-200;
}
</style>
