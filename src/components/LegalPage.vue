<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import SiteHeader from '@/components/SiteHeader.vue';
import SiteFooter from '@/components/SiteFooter.vue';

defineProps<{ title: string; updated: string }>();
</script>

<template>
  <DefaultLayout>
    <template #header>
      <SiteHeader />
    </template>

    <article class="mx-auto max-w-3xl px-4 pt-12 sm:px-6 lg:px-8">
      <h1 class="font-display text-3xl font-semibold text-slate-900">{{ title }}</h1>
      <p class="mt-2 text-sm text-slate-500">Last updated: {{ updated }}</p>
      <div
        class="mt-8 space-y-4 text-sm leading-relaxed text-slate-700 [&_a]:font-medium [&_a]:text-brand-700 [&_a:hover]:text-brand-900 [&_h2]:pt-4 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1"
      >
        <slot />
      </div>
    </article>

    <template #footer>
      <SiteFooter />
    </template>
  </DefaultLayout>
</template>
