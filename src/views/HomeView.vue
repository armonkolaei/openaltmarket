<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import SiteHeader from '@/components/SiteHeader.vue';
import SiteFooter from '@/components/SiteFooter.vue';
import type { CategorySummary, FeaturedAlternative } from '@/types/app';

const featuredApps: FeaturedAlternative[] = [
  {
    id: '1',
    name: 'BudgetBee',
    category: 'Finance',
    description: 'Open-source budgeting suite with envelope planning and bank import support.',
    stars: 4200,
    license: 'MIT'
  },
  {
    id: '2',
    name: 'TaskLift',
    category: 'Productivity',
    description: 'Kanban and sprint planning workspace for distributed teams.',
    stars: 3100,
    license: 'Apache-2.0'
  },
  {
    id: '3',
    name: 'PaperCircuit',
    category: 'Development',
    description: 'Collaborative API testing platform and mock server toolkit.',
    stars: 5800,
    license: 'GPL-3.0'
  }
];

const categories: CategorySummary[] = [
  { id: 'finance', title: 'Finance', count: 102, description: 'Accounting, invoicing, and personal finance tools.' },
  { id: 'productivity', title: 'Productivity', count: 168, description: 'Task, note, and collaboration applications.' },
  { id: 'business', title: 'Business', count: 84, description: 'CRM, operations, and reporting alternatives.' },
  { id: 'development', title: 'Development', count: 216, description: 'Dev tools, CI/CD, and platform engineering.' },
  { id: 'design', title: 'Design', count: 63, description: 'Design, prototyping, and creative workflow software.' }
];
</script>

<template>
  <DefaultLayout>
    <template #header>
      <SiteHeader />
    </template>

    <section class="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
      <div class="card-surface overflow-hidden p-8 md:p-12">
        <div class="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p class="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-800">
              Open-source marketplace
            </p>
            <h1 class="mt-5 font-display text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
              Discover. Fork. Customize.
            </h1>
            <p class="mt-5 max-w-xl text-base text-slate-600 sm:text-lg">
              OpenAltMarket helps teams replace expensive SaaS subscriptions with trusted, free, and
              customizable alternatives.
            </p>

            <form class="mt-8" role="search" aria-label="Search alternatives">
              <label for="search" class="sr-only">Search alternatives</label>
              <div class="flex flex-col gap-3 sm:flex-row">
                <input
                  id="search"
                  type="search"
                  class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-brand-500 placeholder:text-slate-400 focus:ring-2"
                  placeholder="Search by app name, category, or GitHub repository"
                />
                <button
                  type="submit"
                  class="rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-3 text-sm font-semibold text-white transition hover:from-brand-700 hover:to-brand-800"
                >
                  Explore Apps
                </button>
              </div>
            </form>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <article
              v-for="item in featuredApps"
              :key="item.id"
              class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p class="text-xs font-semibold uppercase tracking-wide text-brand-700">{{ item.category }}</p>
              <h2 class="mt-2 font-display text-lg font-semibold text-slate-900">{{ item.name }}</h2>
              <p class="mt-2 text-sm text-slate-600">{{ item.description }}</p>
              <div class="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>{{ item.stars.toLocaleString() }} stars</span>
                <span>{{ item.license }}</span>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section class="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2 class="font-display text-2xl font-semibold text-slate-900">Featured Alternatives</h2>
      <p class="mt-2 text-sm text-slate-600">Curated open-source projects ready for production adaptation.</p>

      <div class="mt-6 grid gap-4 md:grid-cols-3">
        <article
          v-for="item in featuredApps"
          :key="`featured-${item.id}`"
          class="card-surface p-5 transition hover:-translate-y-0.5"
        >
          <p class="text-xs font-semibold uppercase tracking-wide text-brand-700">{{ item.category }}</p>
          <h3 class="mt-2 font-display text-xl font-semibold text-slate-900">{{ item.name }}</h3>
          <p class="mt-2 text-sm text-slate-600">{{ item.description }}</p>
          <div class="mt-4 flex items-center gap-3 text-xs text-slate-500">
            <span>{{ item.license }}</span>
            <span class="h-1 w-1 rounded-full bg-slate-400" />
            <span>{{ item.stars.toLocaleString() }} stars</span>
          </div>
        </article>
      </div>
    </section>

    <section class="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2 class="font-display text-2xl font-semibold text-slate-900">Browse by Category</h2>
      <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <article v-for="category in categories" :key="category.id" class="card-surface p-5">
          <h3 class="font-display text-lg font-semibold text-slate-900">{{ category.title }}</h3>
          <p class="mt-2 text-sm text-slate-600">{{ category.description }}</p>
          <p class="mt-4 text-sm font-semibold text-brand-700">{{ category.count }} listings</p>
        </article>
      </div>
    </section>

    <section class="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="grid gap-6 lg:grid-cols-3">
        <article class="card-surface p-6">
          <p class="text-xs font-semibold uppercase tracking-wide text-brand-700">How it works</p>
          <h3 class="mt-2 font-display text-xl font-semibold text-slate-900">1. Discover</h3>
          <p class="mt-2 text-sm text-slate-600">Find alternatives by use case, pricing pain point, or technology stack.</p>
        </article>
        <article class="card-surface p-6">
          <p class="text-xs font-semibold uppercase tracking-wide text-brand-700">How it works</p>
          <h3 class="mt-2 font-display text-xl font-semibold text-slate-900">2. Fork</h3>
          <p class="mt-2 text-sm text-slate-600">Jump to source repositories and launch your own tailored instance.</p>
        </article>
        <article class="card-surface p-6">
          <p class="text-xs font-semibold uppercase tracking-wide text-brand-700">How it works</p>
          <h3 class="mt-2 font-display text-xl font-semibold text-slate-900">3. Customize</h3>
          <p class="mt-2 text-sm text-slate-600">Adapt UX, integrations, and deployment flows for your organization.</p>
        </article>
      </div>
    </section>

    <section class="mx-auto mt-16 max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      <div class="card-surface overflow-hidden p-8 md:p-12">
        <div class="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="font-display text-3xl font-semibold text-slate-900">Share your project with builders worldwide</h2>
            <p class="mt-3 max-w-2xl text-sm text-slate-600">
              Submit your open-source alternative and help teams move faster with transparent, hackable software.
            </p>
          </div>
          <router-link
            to="/register"
            class="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Submit Your App
          </router-link>
        </div>
      </div>
    </section>

    <template #footer>
      <SiteFooter />
    </template>
  </DefaultLayout>
</template>