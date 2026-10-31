<script setup lang="ts">
import { onMounted, ref } from 'vue';
import GithubCheck from '@/components/GithubCheck.vue';
import { deleteSubmission, fetchPendingSubmissions, reviewSubmission } from '@/lib/api';
import { loadCatalog } from '@/lib/catalog';
import type { AppSubmission } from '@/types/app';

const pending = ref<AppSubmission[]>([]);
const loadError = ref<string | null>(null);
const isLoading = ref(false);
const actionError = ref<string | null>(null);
const actionSuccess = ref<string | null>(null);
const busyId = ref<string | null>(null);

async function load() {
  isLoading.value = true;
  loadError.value = null;
  try {
    pending.value = await fetchPendingSubmissions();
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'Unable to load pending submissions.';
  } finally {
    isLoading.value = false;
  }
}

async function moderate(id: string, status: 'approved' | 'rejected') {
  busyId.value = id;
  actionError.value = null;
  actionSuccess.value = null;
  try {
    const updated = await reviewSubmission(id, status);
    pending.value = pending.value.filter((item) => item.id !== id);
    actionSuccess.value = `${updated.name} marked as ${status}.`;
    if (status === 'approved') {
      void loadCatalog(true);
    }
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Unable to update submission.';
  } finally {
    busyId.value = null;
  }
}

async function remove(id: string) {
  busyId.value = id;
  actionError.value = null;
  actionSuccess.value = null;
  try {
    await deleteSubmission(id);
    pending.value = pending.value.filter((item) => item.id !== id);
    actionSuccess.value = 'Submission deleted.';
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Unable to delete submission.';
  } finally {
    busyId.value = null;
  }
}

onMounted(load);
</script>

<template>
  <article class="card-surface p-5">
    <h2 class="font-display text-xl font-semibold text-slate-900">Review queue</h2>
    <p class="mt-2 text-sm text-slate-600">Approved applications go live on the homepage immediately.</p>

    <p v-if="actionError" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ actionError }}</p>
    <p v-if="actionSuccess" class="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{{ actionSuccess }}</p>
    <p v-if="loadError" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ loadError }}</p>
    <p v-else-if="isLoading" class="mt-3 text-sm text-slate-600">Loading submissions...</p>
    <p v-else-if="pending.length === 0" class="mt-3 text-sm text-slate-600">No pending submissions right now.</p>

    <div v-else class="mt-4 space-y-3">
      <article v-for="submission in pending" :key="submission.id" class="rounded-xl border border-slate-200 p-4">
        <h3 class="font-semibold text-slate-900">{{ submission.name }}</h3>
        <p class="mt-1 text-sm text-slate-600">{{ submission.description }}</p>
        <a :href="submission.websiteUrl" target="_blank" rel="noopener noreferrer" class="mt-2 inline-block break-all text-sm text-brand-700 hover:text-brand-900">
          {{ submission.websiteUrl }}
        </a>
        <p v-if="submission.githubUrl" class="mt-1 text-xs text-slate-600">
          GitHub:
          <a :href="submission.githubUrl" target="_blank" rel="noopener noreferrer" class="text-brand-700 hover:text-brand-900">{{ submission.githubUrl }}</a>
          · License: {{ submission.license ?? (submission.licenseCheckedAt ? 'none detected' : 'unverified') }}
          <span v-if="submission.isFreeToUse" class="font-semibold text-amber-700">· Gold (free to use)</span>
        </p>
        <GithubCheck v-if="submission.githubUrl" :url="submission.githubUrl" :auto="false" />
        <p class="mt-2 text-xs text-slate-500">Alternative to: {{ submission.alternativesTo.join(', ') }}</p>
        <p class="text-xs text-slate-500">Keywords: {{ submission.keywords.join(', ') }}</p>
        <p class="mt-1 text-xs text-slate-500">
          Submitted by {{ submission.submittedByEmail }} · {{ new Date(submission.createdAt).toLocaleString() }}
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <button type="button" class="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" :disabled="busyId === submission.id" @click="moderate(submission.id, 'approved')">
            Approve
          </button>
          <button type="button" class="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" :disabled="busyId === submission.id" @click="moderate(submission.id, 'rejected')">
            Reject
          </button>
          <button type="button" class="rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" :disabled="busyId === submission.id" @click="remove(submission.id)">
            Remove
          </button>
        </div>
      </article>
    </div>
  </article>
</template>
