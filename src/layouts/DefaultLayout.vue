<template>
  <div class="min-h-screen text-ink">
    <slot name="header" />
    <main>
      <slot />
    </main>
    <slot name="footer" />
  </div>
</template>