<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { fetchMySubmissions } from '@/lib/api';
import type { AppSubmission } from '@/types/app';

const submissions = ref<AppSubmission[]>([]);
const error = ref<string | null>(null);
const isLoading = ref(false);

onMounted(async () => {
  isLoading.value = true;
  try {
    submissions.value = await fetchMySubmissions();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to load your submissions.';
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <article class="card-surface p-5">
    <div class="flex items-center justify-between gap-3">
      <h2 class="font-display text-xl font-semibold text-slate-900">My Submissions</h2>
      <router-link :to="{ name: 'dashboard-submit' }" class="text-sm font-semibold text-brand-700 hover:text-brand-900">
        + New submission
      </router-link>
    </div>
    <p class="mt-2 text-sm text-slate-600">Track your suggestions and their review status.</p>

    <p v-if="error" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>
    <p v-else-if="isLoading" class="mt-3 text-sm text-slate-600">Loading your submissions...</p>
    <p v-else-if="submissions.length === 0" class="mt-3 text-sm text-slate-600">You have not submitted any alternatives yet.</p>

    <div v-else class="mt-4 space-y-3">
      <article v-for="submission in submissions" :key="submission.id" class="rounded-xl border border-slate-200 p-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="font-semibold text-slate-900">{{ submission.name }}</h3>
          <span
            class="rounded-full px-2.5 py-1 text-xs font-semibold"
            :class="{
              'bg-amber-100 text-amber-800': submission.status === 'pending',
              'bg-emerald-100 text-emerald-800': submission.status === 'approved',
              'bg-rose-100 text-rose-800': submission.status === 'rejected'
            }"
          >
            {{ submission.status }}
          </span>
        </div>
        <p class="mt-1 text-sm text-slate-600">{{ submission.description }}</p>
        <p class="mt-2 text-xs text-slate-500">
          Alternative to {{ submission.alternativesTo.join(', ') }} · Submitted
          {{ new Date(submission.createdAt).toLocaleString() }}
        </p>
      </article>
    </div>
  </article>
</template>
