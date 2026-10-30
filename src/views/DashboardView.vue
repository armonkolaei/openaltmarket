<script setup lang="ts">
import SiteHeader from '@/components/SiteHeader.vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <SiteHeader />
    <main class="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header class="mb-8">
        <h1 class="font-display text-3xl font-semibold text-slate-900">Dashboard</h1>
        <p class="mt-2 text-sm text-slate-600">
          Welcome back, {{ authStore.profile?.displayName || authStore.firebaseUser?.email || 'Builder' }}.
        </p>
      </header>

      <section v-if="authStore.error" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ authStore.error }}
      </section>

      <section v-else-if="!authStore.profile" class="rounded-xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-600">
        Loading your profile...
      </section>

      <section v-else class="grid gap-5 md:grid-cols-2">
        <article class="card-surface p-5">
          <h2 class="font-display text-xl font-semibold text-slate-900">Profile</h2>
          <dl class="mt-4 space-y-2 text-sm text-slate-600">
            <div>
              <dt class="font-medium text-slate-900">Name</dt>
              <dd>{{ authStore.profile.displayName }}</dd>
            </div>
            <div>
              <dt class="font-medium text-slate-900">Email</dt>
              <dd>{{ authStore.profile.email }}</dd>
            </div>
            <div>
              <dt class="font-medium text-slate-900">Role</dt>
              <dd class="capitalize">{{ authStore.profile.role }}</dd>
            </div>
          </dl>
        </article>

        <article class="card-surface p-5">
          <h2 class="font-display text-xl font-semibold text-slate-900">Coming next</h2>
          <ul class="mt-4 space-y-2 text-sm text-slate-600">
            <li>Submit open-source alternatives</li>
            <li>Connect GitHub repositories</li>
            <li>Deploy private app instances</li>
            <li>AI-powered customization assistant</li>
          </ul>
        </article>
      </section>
    </main>
  </div>
</template>