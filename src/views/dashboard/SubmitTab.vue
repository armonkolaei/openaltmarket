<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { createSubmission } from '@/lib/api';

const authStore = useAuthStore();

const form = reactive({ name: '', description: '', websiteUrl: '', githubUrl: '', alternativesTo: '', keywords: '' });
const isSubmitting = ref(false);
const success = ref<string | null>(null);
const error = ref<string | null>(null);

const parseCsv = (input: string) =>
  input
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

async function submit() {
  isSubmitting.value = true;
  error.value = null;
  success.value = null;
  try {
    await createSubmission({
      name: form.name,
      description: form.description,
      websiteUrl: form.websiteUrl,
      githubUrl: form.githubUrl.trim() || null,
      alternativesTo: parseCsv(form.alternativesTo),
      keywords: parseCsv(form.keywords)
    });
    Object.assign(form, { name: '', description: '', websiteUrl: '', githubUrl: '', alternativesTo: '', keywords: '' });
    success.value = 'Submission received and queued for admin review.';
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to submit suggestion.';
  } finally {
    isSubmitting.value = false;
  }
}

const inputClass =
  'w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2';
</script>

<template>
  <article class="card-surface max-w-2xl p-6">
    <h2 class="font-display text-xl font-semibold text-slate-900">Submit an application</h2>
    <p class="mt-2 text-sm text-slate-600">
      Suggest an alternative. An admin reviews every submission; once approved it appears on the homepage and Explore page.
    </p>
    <p class="mt-2 text-xs text-slate-500">
      Submitting as {{ authStore.profile?.displayName }} ({{ authStore.profile?.email }})
    </p>

    <form class="mt-5 space-y-4" @submit.prevent="submit">
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700" for="submission-name">App name</label>
        <input id="submission-name" v-model="form.name" type="text" required minlength="2" maxlength="120" :class="inputClass" placeholder="Worthgrid" />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700" for="submission-description">Description</label>
        <textarea
          id="submission-description"
          v-model="form.description"
          required
          minlength="20"
          maxlength="2000"
          rows="4"
          :class="inputClass"
          placeholder="What does this app do, and why is it a good alternative? (at least 20 characters)"
        />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700" for="submission-url">Website URL</label>
        <input id="submission-url" v-model="form.websiteUrl" type="url" required :class="inputClass" placeholder="https://worthgrid.com" />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700" for="submission-github">GitHub URL (optional)</label>
        <input id="submission-github" v-model="form.githubUrl" type="url" maxlength="200" :class="inputClass" placeholder="https://github.com/owner/repo" />
        <p class="mt-1 text-xs text-slate-500">
          We verify the repository and read its license. Apps with a free-to-use open source license get a gold badge.
        </p>
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700" for="submission-alternatives">Alternatives to</label>
        <input id="submission-alternatives" v-model="form.alternativesTo" type="text" required :class="inputClass" placeholder="wealthica, mint" />
        <p class="mt-1 text-xs text-slate-500">The apps or websites this replaces, separated by commas.</p>
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700" for="submission-keywords">Keywords</label>
        <input id="submission-keywords" v-model="form.keywords" type="text" required :class="inputClass" placeholder="finance, budgeting, net worth" />
        <p class="mt-1 text-xs text-slate-500">Topics used for search, separated by commas.</p>
      </div>

      <p v-if="error" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{{ error }}</p>
      <p v-if="success" class="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
        {{ success }}
        <router-link :to="{ name: 'dashboard-submissions' }" class="font-semibold underline">View my submissions</router-link>
      </p>

      <button
        type="submit"
        class="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? 'Submitting...' : 'Submit Suggestion' }}
      </button>
    </form>
  </article>
</template>
