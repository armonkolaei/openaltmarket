<script setup lang="ts">
import LegalPage from '@/components/LegalPage.vue';

const issuesUrl = 'https://github.com/armonkolaei/openaltmarket/issues/new';
</script>

<template>
  <LegalPage title="Contact" updated="October 31, 2026">
    <p>
      The fastest way to reach us is to open an issue on our GitHub repository. Please do not post passwords or other
      sensitive personal information in a public issue.
    </p>
    <p>
      <a :href="issuesUrl" target="_blank" rel="noopener noreferrer">Open an issue on GitHub ↗</a>
    </p>

    <h2>What to contact us about</h2>
    <ul>
      <li>Reporting incorrect or outdated listing, repository, or licence information.</li>
      <li>Asking us to remove or correct a listing of your project.</li>
      <li>Privacy requests: access, correction, export, or deletion of your data. Mention the email on your account.</li>
      <li>Reporting abuse, security problems, or content that infringes your rights.</li>
      <li>General feedback and suggestions.</li>
    </ul>

    <p>
      See also our <router-link :to="{ name: 'terms' }">Terms of Use</router-link> and
      <router-link :to="{ name: 'privacy' }">Privacy Policy</router-link>.
    </p>
  </LegalPage>
</template>
