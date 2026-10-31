<script setup lang="ts">
import LegalPage from '@/components/LegalPage.vue';
</script>

<template>
  <LegalPage title="Privacy Policy" updated="October 31, 2026">
    <p>
      This policy explains what personal information OpenAltMarket (the "Service") collects, why, and the choices you have.
      Browsing the directory does not require an account.
    </p>

    <h2>1. Information we collect</h2>
    <ul>
      <li>
        <strong>Account information:</strong> when you register or sign in (with email and password, or with Google) we
        receive your email address, display name, profile photo URL (if provided by Google), and a unique user ID. Passwords
        are handled by Firebase Authentication; we never see or store them.
      </li>
      <li>
        <strong>Profile and activity data:</strong> your role, whether your account is disabled, when you joined and last
        signed in, the apps you submit (including your email as the submitter), and your up and down votes.
      </li>
      <li>
        <strong>Technical data:</strong> our hosting provider and servers may log IP address, browser type, pages
        requested, and timestamps for security and reliability.
      </li>
      <li>
        <strong>Messages:</strong> anything you send us through the Contact page or GitHub.
      </li>
    </ul>

    <h2>2. Information we do not collect</h2>
    <ul>
      <li>We do not run advertising, sell personal information, or use third-party advertising trackers.</li>
      <li>We do not send your personal information to GitHub. Repository checks use only the public repository URL.</li>
    </ul>

    <h2>3. How we use information</h2>
    <ul>
      <li>To create and secure your account and let you submit apps and vote.</li>
      <li>To review submissions, prevent abuse and duplicate voting, and operate the Service.</li>
      <li>To respond to your requests and to keep the Service reliable and secure.</li>
      <li>To comply with legal obligations.</li>
    </ul>

    <h2>4. Public information</h2>
    <p>
      Approved app listings, their vote totals, and the public repository information are visible to everyone. We do not
      publish your email address or name alongside your submissions. Administrators can see the submitter's email for
      moderation.
    </p>

    <h2>5. Service providers and third parties</h2>
    <ul>
      <li><strong>Google Firebase Authentication</strong> to sign you in and store your login credentials.</li>
      <li><strong>MongoDB</strong> database hosting to store profiles, submissions, and votes.</li>
      <li><strong>Vercel</strong> to host and deliver the Service.</li>
      <li>
        <strong>GitHub</strong>: our servers call GitHub's public API to read repository details. Your browser may also load
        repository owner images from GitHub's servers, which then receives your IP address under
        <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">GitHub's privacy statement</a>.
      </li>
    </ul>
    <p>These providers process data only to provide their services to us. We may also disclose information if required by law.</p>

    <h2>6. Cookies and local storage</h2>
    <p>
      We do not use advertising or analytics cookies. Firebase Authentication stores a sign-in session in your browser's
      local storage or IndexedDB so that you stay signed in. You can clear this at any time by signing out or clearing site
      data.
    </p>

    <h2>7. Retention</h2>
    <p>
      We keep account data while your account is active. Submissions and votes are kept until they are removed by an
      administrator or deleted on request. Server logs are kept for a limited period by our hosting provider.
    </p>

    <h2>8. Your choices and rights</h2>
    <p>
      You can ask us to access, correct, export, or delete your personal information, or to delete your account and
      submissions, by using the <router-link :to="{ name: 'contact' }">Contact page</router-link>. Depending on where you
      live (for example under the GDPR or the CCPA/CPRA) you may have additional rights, such as objecting to processing or
      lodging a complaint with your local data protection authority. We will respond within the time the law requires.
    </p>

    <h2>9. Security</h2>
    <p>
      We use access controls, authenticated API requests, and encrypted connections (HTTPS). No system is completely
      secure, so we cannot guarantee absolute security.
    </p>

    <h2>10. Children</h2>
    <p>
      The Service is not directed to children under 13 (or the minimum age in your region), and we do not knowingly collect
      their information. If you believe a child has given us personal information, contact us and we will delete it.
    </p>

    <h2>11. International transfers</h2>
    <p>
      Our providers may process data in countries other than your own, including the United States. Where required, we rely
      on appropriate safeguards for those transfers.
    </p>

    <h2>12. Changes to this policy</h2>
    <p>We may update this policy and will change the date above when we do. Material changes will be highlighted on the Service.</p>

    <h2>13. Contact</h2>
    <p>For privacy questions or requests, visit our <router-link :to="{ name: 'contact' }">Contact page</router-link>.</p>
  </LegalPage>
</template>
