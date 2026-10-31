<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import SiteHeader from '@/components/SiteHeader.vue';
import SiteFooter from '@/components/SiteFooter.vue';
import VoteButtons from '@/components/VoteButtons.vue';
import { fetchSubmission } from '@/lib/api';
import { loadCatalog, useCatalog } from '@/lib/catalog';
import {
  activityClasses,
  activityOf,
  cloneCommand,
  forkUrl,
  formatDate,
  formatNumber,
  languageBreakdown,
  licenseClasses,
  projectAge,
  relativeTime
} from '@/lib/repoInfo';
import type { PublicSubmission } from '@/types/app';

const route = useRoute();
const { apps } = useCatalog();

const fetched = ref<PublicSubmission | null>(null);
const isLoading = ref(true);
const loadError = ref<string | null>(null);
const copied = ref(false);

// Votes are cast through the shared catalog store, so overlay its live counts on the fetched record.
const app = computed<PublicSubmission | null>(() => {
  if (!fetched.value) return null;
  const live = apps.value.find((item) => item.id === fetched.value?.id);
  return live
    ? { ...fetched.value, upvotes: live.upvotes, downvotes: live.downvotes, score: live.score, myVote: live.myVote }
    : fetched.value;
});

const repo = computed(() => app.value?.github ?? null);
const license = computed(() => app.value?.licenseInfo ?? null);
const activity = computed(() => (repo.value ? activityOf(repo.value) : null));
const languages = computed(() => (repo.value ? languageBreakdown(repo.value) : []));
const licenseLabel = computed(() => license.value?.spdxId ?? license.value?.name ?? '');
const siteHost = computed(() => {
  try {
    return new URL(app.value?.websiteUrl ?? '').hostname.replace(/^www\./, '');
  } catch {
    return app.value?.websiteUrl ?? '';
  }
});

const licenseGuideUrl = computed(() => {
  const id = license.value?.spdxId;
  if (!id || license.value?.category === 'unknown' || license.value?.category === 'none') return null;
  return `https://choosealicense.com/licenses/${id.replace(/(-only|-or-later|\+)$/i, '').toLowerCase()}/`;
});

const rights = computed(() =>
  license.value
    ? [
        { label: 'Use commercially', ok: license.value.canUseCommercially },
        { label: 'Modify', ok: license.value.canModify },
        { label: 'Fork and redistribute', ok: license.value.freeToUse },
        { label: 'Sell', ok: license.value.canSell }
      ]
    : []
);

async function load() {
  isLoading.value = true;
  loadError.value = null;
  try {
    fetched.value = await fetchSubmission(String(route.params.id));
    document.title = `${fetched.value.name} · OpenAltMarket`;
  } catch (err) {
    fetched.value = null;
    loadError.value = err instanceof Error ? err.message : 'Unable to load this alternative.';
  } finally {
    isLoading.value = false;
  }
}

async function copyClone() {
  if (!repo.value) return;
  try {
    await navigator.clipboard.writeText(cloneCommand(repo.value));
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch {
    copied.value = false;
  }
}

watch(() => route.params.id, () => void load());
onMounted(() => {
  void load();
  void loadCatalog();
});
</script>

<template>
  <DefaultLayout>
    <template #header>
      <SiteHeader />
    </template>

    <div class="mx-auto max-w-5xl px-4 pt-8 sm:px-6 lg:px-8">
      <router-link :to="{ name: 'explore' }" class="text-sm font-medium text-brand-700 hover:text-brand-900">
        ← Back to Explore
      </router-link>

      <p v-if="isLoading" class="mt-8 text-sm text-slate-600">Loading alternative...</p>
      <div v-else-if="loadError || !app" class="card-surface mt-8 p-8 text-center">
        <p class="font-display text-lg font-semibold text-slate-900">{{ loadError ?? 'Alternative not found.' }}</p>
        <router-link :to="{ name: 'explore' }" class="mt-4 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-900">
          Browse all alternatives
        </router-link>
      </div>

      <template v-else>
        <header class="mt-6 flex items-start gap-4">
          <VoteButtons :app="app" />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-3">
              <img
                v-if="repo?.avatarUrl"
                :src="repo.avatarUrl"
                :alt="`${repo.owner} avatar`"
                class="h-10 w-10 rounded-xl border border-slate-200"
                loading="lazy"
                referrerpolicy="no-referrer"
              />
              <h1 class="font-display text-3xl font-semibold text-slate-900">{{ app.name }}</h1>
            </div>
            <p class="mt-3 max-w-3xl text-base text-slate-700">{{ app.description }}</p>

            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-if="activity"
                class="rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset"
                :class="activityClasses[activity.level]"
              >
                {{ activity.label }}
              </span>
              <span
                v-if="app.isFreeToUse"
                class="rounded-full bg-gradient-to-r from-amber-300 to-yellow-400 px-3 py-1 text-xs font-semibold text-amber-950"
              >
                ★ Open source · {{ licenseLabel }}
              </span>
              <span
                v-else-if="app.githubUrl && license"
                class="rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset"
                :class="licenseClasses[license.category]"
              >
                Licence: {{ licenseLabel }}
              </span>
              <span v-if="app.alternativesTo.length" class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                Alternative to {{ app.alternativesTo.join(', ') }}
              </span>
              <span v-for="tag in app.keywords" :key="tag" class="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                {{ tag }}
              </span>
            </div>

            <div class="mt-5 flex flex-wrap gap-3">
              <a
                :href="app.websiteUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Visit {{ siteHost }} ↗
              </a>
              <a
                v-if="app.githubUrl"
                :href="app.githubUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-brand-600"
              >
                Repository ↗
              </a>
              <a
                v-if="repo"
                :href="forkUrl(repo)"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-brand-600"
              >
                Fork ↗
              </a>
            </div>
          </div>
        </header>

        <section v-if="repo" class="card-surface mt-8 p-6" aria-labelledby="repo-heading">
          <h2 id="repo-heading" class="font-display text-xl font-semibold text-slate-900">
            Source repository
            <span class="text-sm font-normal text-slate-500">
              (from GitHub as of {{ formatDate(repo.fetchedAt) }} · {{ repo.fullName }})
            </span>
          </h2>

          <dl class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <dd class="font-display text-2xl font-semibold text-slate-900">★ {{ formatNumber(repo.stars) }}</dd>
              <dt class="text-sm text-slate-500">Stars</dt>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <dd class="font-display text-2xl font-semibold text-slate-900">{{ formatNumber(repo.forks) }}</dd>
              <dt class="text-sm text-slate-500">Forks</dt>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <dd class="font-display text-2xl font-semibold text-slate-900">
                {{ repo.contributors === null ? '—' : formatNumber(repo.contributors) }}
              </dd>
              <dt class="text-sm text-slate-500">Contributors</dt>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <dd class="font-display text-2xl font-semibold text-slate-900">{{ formatNumber(repo.openIssues) }}</dd>
              <dt class="text-sm text-slate-500">Open issues</dt>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <dd class="font-display text-2xl font-semibold capitalize text-slate-900">{{ relativeTime(repo.pushedAt) }}</dd>
              <dt class="text-sm text-slate-500">Last code push · {{ formatDate(repo.pushedAt) }}</dt>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <dd class="font-display text-2xl font-semibold text-slate-900">{{ new Date(repo.createdAt).getFullYear() }}</dd>
              <dt class="text-sm text-slate-500">Project started · {{ projectAge(repo.createdAt) }}</dt>
            </div>
          </dl>

          <p v-if="repo.latestRelease" class="mt-4 text-sm text-slate-600">
            Latest release: <span class="font-semibold text-slate-900">{{ repo.latestRelease.tag }}</span>
            <template v-if="repo.latestRelease.publishedAt"> · {{ formatDate(repo.latestRelease.publishedAt) }}</template>
          </p>

          <div v-if="languages.length" class="mt-6">
            <p class="text-sm text-slate-600">Codebase languages (by volume)</p>
            <div class="mt-2 flex h-3 overflow-hidden rounded-full bg-slate-100" role="img" aria-label="Language breakdown">
              <span
                v-for="item in languages"
                :key="item.name"
                :style="{ width: `${item.percent}%`, backgroundColor: item.color }"
                :title="`${item.name} ${item.percent.toFixed(1)}%`"
              ></span>
            </div>
            <ul class="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-700">
              <li v-for="item in languages" :key="item.name" class="flex items-center gap-1.5">
                <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: item.color }"></span>
                {{ item.name }} {{ Math.round(item.percent) }}%
              </li>
            </ul>
          </div>

          <div v-if="repo.topics.length" class="mt-5 flex flex-wrap gap-1.5">
            <span v-for="topic in repo.topics" :key="topic" class="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-brand-800">
              {{ topic }}
            </span>
          </div>

          <div class="mt-6 flex flex-wrap items-center gap-2 text-sm">
            <span class="font-semibold text-slate-900">Clone it:</span>
            <code class="break-all rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs text-slate-800">{{ cloneCommand(repo) }}</code>
            <button
              type="button"
              class="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-brand-600"
              @click="copyClone"
            >
              {{ copied ? 'Copied' : 'Copy' }}
            </button>
          </div>
        </section>

        <section v-if="app.githubUrl && license" class="card-surface mt-6 p-6" aria-labelledby="license-heading">
          <h2 id="license-heading" class="font-display text-xl font-semibold text-slate-900">
            Licence in plain English
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            {{ license.name }}<template v-if="license.spdxId"> ({{ license.spdxId }})</template> · {{ license.label }}
          </p>
          <p class="mt-3 text-sm leading-relaxed text-slate-700">{{ license.summary }}</p>

          <ul class="mt-4 grid gap-2 sm:grid-cols-2">
            <li v-for="item in rights" :key="item.label" class="flex items-center gap-2 text-sm">
              <span
                class="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold"
                :class="item.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'"
                aria-hidden="true"
              >
                {{ item.ok ? '✓' : '✕' }}
              </span>
              <span class="text-slate-800">{{ item.label }}</span>
              <span class="sr-only">{{ item.ok ? 'allowed' : 'not allowed' }}</span>
            </li>
          </ul>

          <div v-if="license.obligations.length" class="mt-4">
            <p class="text-sm font-semibold text-slate-900">What you need to do</p>
            <ul class="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li v-for="item in license.obligations" :key="item">{{ item }}</li>
            </ul>
          </div>

          <p class="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <a
              v-if="licenseGuideUrl"
              :href="licenseGuideUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-brand-700 hover:text-brand-900"
            >
              Full licence explainer ↗
            </a>
            <a :href="app.githubUrl" target="_blank" rel="noopener noreferrer" class="font-medium text-brand-700 hover:text-brand-900">
              Read the licence file in the repository ↗
            </a>
          </p>
        </section>

        <section class="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5" aria-labelledby="nuance-heading">
          <h2 id="nuance-heading" class="font-display text-base font-semibold text-amber-900">⚠ Good to know</h2>
          <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
            <li>
              Repository details and the licence summary are collected automatically from GitHub and simplified. They are
              not legal advice.
            </li>
            <li>
              The licence applies to the source code only. Names, logos and trademarks, and any paid or hosted version, may
              have separate terms.
            </li>
            <li>Always read the licence file in the repository before you copy, modify or sell the software.</li>
            <li v-if="activity && (activity.level === 'inactive' || activity.level === 'archived')">
              This project looks {{ activity.level === 'archived' ? 'archived' : 'inactive' }}, so it may not receive fixes
              or security updates.
            </li>
            <li v-if="!app.githubUrl">
              No public repository was provided for this app, so we cannot show its licence or whether it is open source.
            </li>
          </ul>
          <p class="mt-3 text-xs text-amber-800">
            See our <router-link :to="{ name: 'terms' }" class="underline">Terms of Use</router-link> for how we treat
            third-party information.
          </p>
        </section>
      </template>
    </div>

    <template #footer>
      <SiteFooter />
    </template>
  </DefaultLayout>
</template>
