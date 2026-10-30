<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { deleteSubmission, fetchPendingSubmissions, updateSubmission, type AdminStatusFilter } from '@/lib/api';
import { loadCatalog } from '@/lib/catalog';
import type { AppSubmission } from '@/types/app';

const statusFilters: { value: AdminStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' }
];

const statusClasses: Record<AppSubmission['status'], string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800'
};

const items = ref<AppSubmission[]>([]);
const status = ref<AdminStatusFilter>('all');
const search = ref('');
const isLoading = ref(false);
const loadError = ref<string | null>(null);
const actionError = ref<string | null>(null);
const actionSuccess = ref<string | null>(null);
const busyId = ref<string | null>(null);
const confirmDeleteId = ref<string | null>(null);

const editingId = ref<string | null>(null);
const form = reactive({ name: '', description: '', websiteUrl: '', alternativesTo: '', keywords: '' });

let searchTimer: ReturnType<typeof setTimeout> | undefined;

async function load() {
  isLoading.value = true;
  loadError.value = null;
  try {
    items.value = await fetchPendingSubmissions(status.value, search.value);
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'Unable to load submissions.';
  } finally {
    isLoading.value = false;
  }
}

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function startEdit(item: AppSubmission) {
  editingId.value = item.id;
  form.name = item.name;
  form.description = item.description;
  form.websiteUrl = item.websiteUrl;
  form.alternativesTo = item.alternativesTo.join(', ');
  form.keywords = item.keywords.join(', ');
  actionError.value = null;
  actionSuccess.value = null;
}

function replaceItem(updated: AppSubmission) {
  items.value = items.value
    .map((item) => (item.id === updated.id ? updated : item))
    .filter((item) => status.value === 'all' || item.status === status.value);
}

async function run(id: string, task: () => Promise<void>) {
  busyId.value = id;
  actionError.value = null;
  actionSuccess.value = null;
  try {
    await task();
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Action failed.';
  } finally {
    busyId.value = null;
  }
}

function saveEdit(id: string) {
  return run(id, async () => {
    const updated = await updateSubmission(id, {
      name: form.name,
      description: form.description,
      websiteUrl: form.websiteUrl,
      alternativesTo: splitList(form.alternativesTo),
      keywords: splitList(form.keywords)
    });
    replaceItem(updated);
    editingId.value = null;
    actionSuccess.value = `${updated.name} updated.`;
    void loadCatalog(true);
  });
}

function setStatus(item: AppSubmission, next: AppSubmission['status']) {
  return run(item.id, async () => {
    const updated = await updateSubmission(item.id, { status: next });
    replaceItem(updated);
    actionSuccess.value = `${updated.name} marked as ${next}.`;
    void loadCatalog(true);
  });
}

function remove(item: AppSubmission) {
  return run(item.id, async () => {
    await deleteSubmission(item.id);
    items.value = items.value.filter((entry) => entry.id !== item.id);
    confirmDeleteId.value = null;
    actionSuccess.value = `${item.name} was removed from the site.`;
    void loadCatalog(true);
  });
}

watch(status, load);
watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(load, 300);
});

onMounted(load);
</script>

<template>
  <article class="card-surface p-5">
    <h2 class="font-display text-xl font-semibold text-slate-900">All submissions</h2>
    <p class="mt-1 text-sm text-slate-600">
      Search every submission, edit its details, change its status or remove it from the site entirely.
    </p>

    <div class="mt-4 flex flex-wrap items-center gap-3">
      <input
        v-model="search"
        type="search"
        placeholder="Search name, URL, submitter, keywords..."
        aria-label="Search submissions"
        class="min-w-[16rem] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <div class="flex gap-1" role="group" aria-label="Filter by status">
        <button
          v-for="filter in statusFilters"
          :key="filter.value"
          type="button"
          class="rounded-lg px-3 py-1.5 text-xs font-semibold transition"
          :class="status === filter.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
          @click="status = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <p v-if="actionError" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ actionError }}</p>
    <p v-if="actionSuccess" class="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{{ actionSuccess }}</p>
    <p v-if="loadError" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ loadError }}</p>
    <p v-else-if="isLoading && items.length === 0" class="mt-3 text-sm text-slate-600">Loading submissions...</p>
    <p v-else-if="items.length === 0" class="mt-3 text-sm text-slate-600">No submissions match.</p>

    <ul class="mt-4 space-y-3">
      <li v-for="item in items" :key="item.id" class="rounded-xl border border-slate-200 p-4">
        <form v-if="editingId === item.id" class="space-y-3" @submit.prevent="saveEdit(item.id)">
          <label class="block text-xs font-medium text-slate-600">
            Name
            <input v-model="form.name" required minlength="2" maxlength="120" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label class="block text-xs font-medium text-slate-600">
            Website URL
            <input v-model="form.websiteUrl" required type="url" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label class="block text-xs font-medium text-slate-600">
            Description
            <textarea v-model="form.description" required minlength="20" maxlength="2000" rows="3" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"></textarea>
          </label>
          <label class="block text-xs font-medium text-slate-600">
            Alternative to (comma separated)
            <input v-model="form.alternativesTo" required class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label class="block text-xs font-medium text-slate-600">
            Keywords (comma separated)
            <input v-model="form.keywords" required class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <div class="flex gap-2">
            <button type="submit" class="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" :disabled="busyId === item.id">
              {{ busyId === item.id ? 'Saving...' : 'Save changes' }}
            </button>
            <button type="button" class="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700" @click="editingId = null">
              Cancel
            </button>
          </div>
        </form>

        <template v-else>
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="font-semibold text-slate-900">{{ item.name }}</h3>
            <span class="rounded-full px-2 py-0.5 text-xs font-semibold capitalize" :class="statusClasses[item.status]">
              {{ item.status }}
            </span>
          </div>
          <p class="mt-1 text-sm text-slate-600">{{ item.description }}</p>
          <a :href="item.websiteUrl" target="_blank" rel="noopener noreferrer" class="mt-2 inline-block break-all text-sm text-brand-700 hover:text-brand-900">
            {{ item.websiteUrl }}
          </a>
          <p class="mt-2 text-xs text-slate-500">Alternative to: {{ item.alternativesTo.join(', ') }}</p>
          <p class="text-xs text-slate-500">Keywords: {{ item.keywords.join(', ') }}</p>
          <p class="mt-1 text-xs text-slate-500">
            Submitted by {{ item.submittedByEmail }} · {{ new Date(item.createdAt).toLocaleString() }}
          </p>

          <div class="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" class="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white" @click="startEdit(item)">
              Edit
            </button>
            <button
              v-if="item.status !== 'approved'"
              type="button"
              class="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              :disabled="busyId === item.id"
              @click="setStatus(item, 'approved')"
            >
              Approve
            </button>
            <button
              v-if="item.status !== 'rejected'"
              type="button"
              class="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              :disabled="busyId === item.id"
              @click="setStatus(item, 'rejected')"
            >
              Reject
            </button>
            <button
              v-if="item.status !== 'pending'"
              type="button"
              class="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
              :disabled="busyId === item.id"
              @click="setStatus(item, 'pending')"
            >
              Move to pending
            </button>

            <template v-if="confirmDeleteId === item.id">
              <span class="text-xs text-rose-700">Remove permanently, including votes?</span>
              <button type="button" class="rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" :disabled="busyId === item.id" @click="remove(item)">
                Yes, remove
              </button>
              <button type="button" class="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700" @click="confirmDeleteId = null">
                Keep
              </button>
            </template>
            <button v-else type="button" class="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50" @click="confirmDeleteId = item.id">
              Remove from site
            </button>
          </div>
        </template>
      </li>
    </ul>
  </article>
</template>
