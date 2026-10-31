<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import SiteHeader from '@/components/SiteHeader.vue';
import SiteFooter from '@/components/SiteFooter.vue';
import AppCard from '@/components/AppCard.vue';
import { loadCatalog, useCatalog } from '@/lib/catalog';

const router = useRouter();
const { apps, isLoading, loadError, topReplaced, topKeywords, latest, featured } = useCatalog();

const query = ref('');
const latestApps = computed(() => latest.value.slice(0, 6));
const featuredApps = computed(() => featured.value.slice(0, 3));
const replacedCount = computed(() => new Set(apps.value.flatMap((item) => item.alternativesTo.map((name) => name.toLowerCase()))).size);

const steps = [
  { title: 'Search', text: 'Look up the app you want to replace and see community-approved alternatives.' },
  { title: 'Compare', text: 'Filter by the tool you are leaving or by topic, then read what each option offers.' },
  { title: 'Go', text: 'Click a result to open the alternative in a new tab.' },
  { title: 'Contribute', text: 'Know a great alternative? Submit it and our admins will review it.' }
];

function search() {
  router.push({ name: 'explore', query: query.value.trim() ? { q: query.value.trim() } : {} });
}

onMounted(() => {
  void loadCatalog();
});
</script>

<template>
  <DefaultLayout>
    <template #header>
      <SiteHeader />
    </template>

    <section class="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
      <div class="card-surface overflow-hidden p-8 text-center md:p-14">
        <p class="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-800">
          Community-curated alternatives
        </p>
        <h1 class="mx-auto mt-5 max-w-3xl font-display text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
          Find an open alternative to the apps you already use
        </h1>
        <p class="mx-auto mt-5 max-w-2xl text-base text-slate-600 sm:text-lg">
          Search for the tool you want to replace. Every listing is submitted by the community and reviewed by an admin
          before it appears here.
        </p>

        <form class="mx-auto mt-8 max-w-2xl" role="search" aria-label="Search alternatives" @submit.prevent="search">
          <label for="search" class="sr-only">Search alternatives</label>
          <div class="flex flex-col gap-3 sm:flex-row">
            <input
              id="search"
              v-model="query"
              type="search"
              class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-brand-500 placeholder:text-slate-400 focus:ring-2"
              placeholder="Search by app you want to replace, name, or topic"
            />
            <button
              type="submit"
              class="rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-3 text-sm font-semibold text-white transition hover:from-brand-700 hover:to-brand-800"
            >
              Find alternatives
            </button>
          </div>
        </form>

        <div v-if="topReplaced.length > 0" class="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-2">
          <span class="text-xs font-medium text-slate-500">Popular searches:</span>
          <router-link
            v-for="tag in topReplaced.slice(0, 8)"
            :key="tag.label"
            :to="{ name: 'explore', query: { replaces: tag.label } }"
            class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-brand-500 hover:text-brand-700"
          >
            {{ tag.label }}
          </router-link>
        </div>

        <dl class="mx-auto mt-10 grid max-w-xl grid-cols-3 gap-4 text-center">
          <div>
            <dt class="text-xs uppercase tracking-wide text-slate-500">Alternatives</dt>
            <dd class="font-display text-2xl font-semibold text-slate-900">{{ apps.length }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-wide text-slate-500">Apps replaced</dt>
            <dd class="font-display text-2xl font-semibold text-slate-900">{{ replacedCount }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-wide text-slate-500">Topics</dt>
            <dd class="font-display text-2xl font-semibold text-slate-900">{{ topKeywords.length }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <section v-if="featuredApps.length > 0" class="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2 class="font-display text-2xl font-semibold text-slate-900">★ Featured open source</h2>
      <p class="mt-1 text-sm text-slate-600">Free to use, modify and sell — verified from each project's GitHub license.</p>
      <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AppCard v-for="item in featuredApps" :key="item.id" :app="item" />
      </div>
    </section>

    <section class="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex items-end justify-between gap-4">
        <div>
          <h2 class="font-display text-2xl font-semibold text-slate-900">Recently added</h2>
          <p class="mt-1 text-sm text-slate-600">Fresh alternatives approved by our reviewers.</p>
        </div>
        <router-link :to="{ name: 'explore' }" class="text-sm font-semibold text-brand-700 hover:text-brand-900">
          Browse all →
        </router-link>
      </div>

      <p v-if="loadError" class="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ loadError }}</p>
      <p v-else-if="isLoading && apps.length === 0" class="mt-6 text-sm text-slate-600">Loading alternatives...</p>
      <div v-else-if="latestApps.length === 0" class="card-surface mt-6 p-8 text-center">
        <p class="font-display text-lg font-semibold text-slate-900">No alternatives yet</p>
        <p class="mt-1 text-sm text-slate-600">Be the first to suggest one — approved submissions show up here.</p>
        <router-link
          :to="{ name: 'submit' }"
          class="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Submit an app
        </router-link>
      </div>
      <div v-else class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AppCard v-for="item in latestApps" :key="item.id" :app="item" />
      </div>
    </section>

    <section v-if="topKeywords.length > 0" class="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2 class="font-display text-2xl font-semibold text-slate-900">Browse by topic</h2>
      <div class="mt-4 flex flex-wrap gap-2">
        <router-link
          v-for="tag in topKeywords"
          :key="tag.label"
          :to="{ name: 'explore', query: { topic: tag.label } }"
          class="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-700 transition hover:border-brand-500 hover:text-brand-700"
        >
          #{{ tag.label }} <span class="text-xs text-slate-400">{{ tag.count }}</span>
        </router-link>
      </div>
    </section>

    <section class="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2 class="font-display text-2xl font-semibold text-slate-900">How it works</h2>
      <ol class="mt-6 grid gap-4 md:grid-cols-4">
        <li v-for="(step, index) in steps" :key="step.title" class="card-surface p-5">
          <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">
            {{ index + 1 }}
          </span>
          <h3 class="mt-3 font-display text-lg font-semibold text-slate-900">{{ step.title }}</h3>
          <p class="mt-1 text-sm text-slate-600">{{ step.text }}</p>
        </li>
      </ol>
    </section>

    <section class="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="rounded-2xl bg-gradient-to-r from-brand-700 to-brand-900 p-8 text-center text-white md:p-12">
        <h2 class="font-display text-2xl font-semibold">Know an app that deserves a spot?</h2>
        <p class="mx-auto mt-2 max-w-xl text-sm text-brand-100">
          Tell us your name, the app, its URL, and which tools it replaces. We will review it and publish it here.
        </p>
        <router-link
          :to="{ name: 'submit' }"
          class="mt-6 inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
        >
          Submit an application
        </router-link>
      </div>
    </section>

    <template #footer>
      <SiteFooter />
    </template>
  </DefaultLayout>
</template>
