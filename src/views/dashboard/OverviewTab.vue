<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { fetchMySubmissions, fetchPendingSubmissions } from '@/lib/api';
import { loadCatalog, useCatalog } from '@/lib/catalog';
import type { AppSubmission } from '@/types/app';

const authStore = useAuthStore();
const { apps, topReplaced, topKeywords, latest } = useCatalog();

const isAdmin = computed(() => authStore.profile?.role === 'admin' || authStore.profile?.role === 'super_admin');
const mine = ref<AppSubmission[]>([]);
const pendingCount = ref<number | null>(null);

const myCounts = computed(() => ({
  pending: mine.value.filter((item) => item.status === 'pending').length,
  approved: mine.value.filter((item) => item.status === 'approved').length,
  rejected: mine.value.filter((item) => item.status === 'rejected').length
}));
const maxReplaced = computed(() => Math.max(1, ...topReplaced.value.map((tag) => tag.count)));

onMounted(async () => {
  void loadCatalog();
  mine.value = await fetchMySubmissions().catch(() => []);
  if (isAdmin.value) {
    pendingCount.value = await fetchPendingSubmissions()
      .then((items) => items.length)
      .catch(() => null);
  }
});
</script>

<template>
  <div class="space-y-6">
    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <router-link :to="{ name: 'dashboard-submit' }" class="card-surface p-5 transition hover:border-brand-400">
        <p class="text-sm font-semibold text-brand-700">+ New submission</p>
        <p class="mt-1 text-sm text-slate-600">Suggest an alternative for review.</p>
      </router-link>
      <router-link :to="{ name: 'dashboard-submissions' }" class="card-surface p-5 transition hover:border-brand-400">
        <p class="font-display text-2xl font-semibold text-slate-900">{{ mine.length }}</p>
        <p class="text-sm text-slate-600">
          Your submissions · {{ myCounts.approved }} approved · {{ myCounts.pending }} pending
        </p>
      </router-link>
      <router-link
        v-if="isAdmin"
        :to="{ name: 'dashboard-review' }"
        class="card-surface border-amber-200 p-5 transition hover:border-amber-400"
      >
        <p class="font-display text-2xl font-semibold text-slate-900">{{ pendingCount ?? '–' }}</p>
        <p class="text-sm text-slate-600">Awaiting your review</p>
      </router-link>
      <div class="card-surface p-5">
        <p class="font-display text-2xl font-semibold text-slate-900">{{ apps.length }}</p>
        <p class="text-sm text-slate-600">Live alternatives on the site</p>
      </div>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <article class="card-surface p-5">
        <h2 class="font-display text-lg font-semibold text-slate-900">Most replaced apps</h2>
        <p class="mt-1 text-sm text-slate-600">What people most want alternatives to.</p>
        <p v-if="topReplaced.length === 0" class="mt-4 text-sm text-slate-500">No data yet.</p>
        <ul v-else class="mt-4 space-y-3">
          <li v-for="tag in topReplaced.slice(0, 6)" :key="tag.label">
            <div class="flex justify-between text-sm">
              <router-link :to="{ name: 'explore', query: { replaces: tag.label } }" class="font-medium text-slate-800 hover:text-brand-700">
                {{ tag.label }}
              </router-link>
              <span class="text-slate-500">{{ tag.count }}</span>
            </div>
            <div class="mt-1 h-2 rounded-full bg-slate-100">
              <div class="h-2 rounded-full bg-brand-500" :style="{ width: `${(tag.count / maxReplaced) * 100}%` }" />
            </div>
          </li>
        </ul>
      </article>

      <article class="card-surface p-5">
        <h2 class="font-display text-lg font-semibold text-slate-900">Trending topics</h2>
        <p class="mt-1 text-sm text-slate-600">Most common keywords across approved apps.</p>
        <p v-if="topKeywords.length === 0" class="mt-4 text-sm text-slate-500">No data yet.</p>
        <div v-else class="mt-4 flex flex-wrap gap-2">
          <router-link
            v-for="tag in topKeywords"
            :key="tag.label"
            :to="{ name: 'explore', query: { topic: tag.label } }"
            class="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:border-brand-500 hover:text-brand-700"
          >
            #{{ tag.label }} <span class="text-xs text-slate-400">{{ tag.count }}</span>
          </router-link>
        </div>
      </article>
    </section>

    <section class="card-surface p-5">
      <h2 class="font-display text-lg font-semibold text-slate-900">Latest approved</h2>
      <p v-if="latest.length === 0" class="mt-3 text-sm text-slate-500">Nothing approved yet.</p>
      <ul v-else class="mt-3 divide-y divide-slate-100">
        <li v-for="item in latest.slice(0, 5)" :key="item.id" class="flex flex-wrap items-center justify-between gap-2 py-3">
          <div>
            <a :href="item.websiteUrl" target="_blank" rel="noopener noreferrer" class="font-medium text-slate-900 hover:text-brand-700">
              {{ item.name }} ↗
            </a>
            <p class="text-xs text-slate-500">Alternative to {{ item.alternativesTo.join(', ') }}</p>
          </div>
          <span class="text-xs text-slate-400">{{ new Date(item.approvedAt).toLocaleDateString() }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>
