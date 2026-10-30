<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
    <div class="card-surface max-w-md p-8 text-center">
      <p class="text-xs font-semibold uppercase tracking-wide text-brand-700">404</p>
      <h1 class="mt-2 font-display text-3xl font-semibold text-slate-900">Page not found</h1>
      <p class="mt-3 text-sm text-slate-600">The page you are looking for does not exist.</p>
      <router-link
        to="/"
        class="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        Go Home
      </router-link>
    </div>
  </div>
</template>