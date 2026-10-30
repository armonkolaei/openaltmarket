<template>
  <footer class="mt-20 border-t border-slate-200 bg-white/85 py-10">
    <div class="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
      <div class="lg:col-span-2">
        <p class="font-display text-xl font-semibold text-slate-900">OpenAltMarket</p>
        <p class="mt-2 max-w-lg text-sm text-slate-600">
          Open marketplace for free and open-source alternatives to commercial software.
          Build faster, fork confidently, and customize without vendor lock-in.
        </p>
      </div>
      <div>
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-900">Platform</h2>
        <ul class="mt-3 space-y-2 text-sm text-slate-600">
          <li>Explore Apps</li>
          <li>Submit App</li>
          <li>Developer Profiles</li>
        </ul>
      </div>
      <div>
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-900">Company</h2>
        <ul class="mt-3 space-y-2 text-sm text-slate-600">
          <li>Privacy</li>
          <li>Terms</li>
          <li>Contact</li>
        </ul>
      </div>
    </div>
    <p class="mx-auto mt-8 max-w-7xl px-4 text-xs text-slate-500 sm:px-6 lg:px-8">
      &copy; {{ new Date().getFullYear() }} OpenAltMarket. All rights reserved.
    </p>
  </footer>
</template>