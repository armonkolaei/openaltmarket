<script setup lang="ts">
import LegalPage from '@/components/LegalPage.vue';
</script>

<template>
  <LegalPage title="Terms of Use" updated="October 31, 2026">
    <p>
      These Terms of Use ("Terms") govern your use of OpenAltMarket (the "Service"), a directory that helps people
      discover free and open-source alternatives to commercial software. By using the Service you agree to these Terms. If
      you do not agree, do not use it.
    </p>

    <h2>1. What OpenAltMarket is, and is not</h2>
    <ul>
      <li>OpenAltMarket is an index of links and information about software made by third parties.</li>
      <li>
        We do not create, host, distribute, sell, or support the listed software. Downloading, forking, modifying, or
        selling any listed software happens on third-party sites (such as GitHub) under the terms of the software's own
        license.
      </li>
      <li>A listing is not an endorsement, certification, or recommendation of any software or its author.</li>
    </ul>

    <h2>2. Licence information is informational only</h2>
    <ul>
      <li>
        Repository details (stars, forks, activity, languages) and licence details are collected automatically from
        GitHub's public API. We do not rely on, and do not ask submitters to supply, licence details.
      </li>
      <li>
        Plain-English licence summaries and badges, including the gold "open source" badge, are general, simplified
        descriptions. They are not legal advice and do not replace the licence text.
      </li>
      <li>
        Information may be incomplete, out of date, or wrong. A repository's licence can change, can differ for parts of
        the code, and can be affected by third-party components, trademarks, patents, or separate commercial terms.
      </li>
      <li>
        <strong>You are solely responsible</strong> for reading the licence in the repository and complying with it before
        you copy, fork, modify, distribute, or sell any software you find through the Service.
      </li>
    </ul>

    <h2>3. Accounts</h2>
    <ul>
      <li>You need an account to submit apps or vote. You must provide accurate information and keep your login secure.</li>
      <li>You are responsible for activity under your account. We may suspend or disable accounts that break these Terms.</li>
    </ul>

    <h2>4. Submissions</h2>
    <ul>
      <li>
        When you submit an app you confirm that the information is accurate, that you are allowed to share it, and that
        any GitHub URL points to a public repository.
      </li>
      <li>Do not submit malware, illegal content, spam, misleading claims, or software you have no right to promote.</li>
      <li>
        You grant us a non-exclusive, worldwide, royalty-free licence to store, display, and edit (for clarity, formatting,
        or moderation) the text you submit in connection with the Service.
      </li>
      <li>
        Every submission is reviewed by an administrator. We may approve, edit, reject, rank, feature, or remove any
        submission at any time, for any reason, without notice.
      </li>
      <li>Voting must be genuine. Manipulating votes or ranking is not allowed.</li>
    </ul>

    <h2>5. Acceptable use</h2>
    <ul>
      <li>Do not attack, overload, scrape at abusive rates, reverse engineer, or interfere with the Service.</li>
      <li>Do not attempt to access other users' data or admin features.</li>
      <li>Do not use the Service to break any law or anyone's rights.</li>
    </ul>

    <h2>6. Intellectual property and takedowns</h2>
    <ul>
      <li>
        The Service's own design and code belong to us or our licensors, unless stated otherwise. Listed software, names,
        and logos belong to their respective owners.
      </li>
      <li>
        If you believe content on the Service infringes your rights or is inaccurate, please tell us through the
        <router-link :to="{ name: 'contact' }">Contact page</router-link> with enough detail to find and verify it, and we
        will review it promptly.
      </li>
    </ul>

    <h2>7. Third-party services and links</h2>
    <p>
      The Service links to and loads data from third parties (for example GitHub and Google). We do not control them and are
      not responsible for their content, availability, or practices. Your use of them is governed by their own terms.
    </p>

    <h2>8. Disclaimer of warranties</h2>
    <p>
      The Service and all listed information are provided "as is" and "as available", without warranties of any kind,
      whether express or implied, including accuracy, fitness for a particular purpose, non-infringement, security, or
      uninterrupted availability.
    </p>

    <h2>9. Limitation of liability</h2>
    <p>
      To the maximum extent permitted by law, OpenAltMarket and its operators are not liable for any indirect, incidental,
      special, consequential, or punitive damages, or for any loss of profits, data, or business, arising from your use of
      the Service or of any software, licence, or information found through it, including any claim that you used, forked,
      modified, or sold software in a way its licence did not allow. Our total liability for any claim relating to the
      Service is limited to the greater of USD 100 or the amount you paid us (which for a free service is zero). Some
      places do not allow these limits, so they apply only to the extent the law permits.
    </p>

    <h2>10. Indemnity</h2>
    <p>
      You agree to defend and hold us harmless from claims, losses, and costs arising from your submissions, your breach of
      these Terms, or your use of third-party software obtained through the Service.
    </p>

    <h2>11. Changes, suspension, and termination</h2>
    <p>
      We may change the Service or these Terms at any time. When we make material changes we will update the date above.
      Continuing to use the Service after a change means you accept the updated Terms. We may suspend or end access at any
      time, and you may stop using the Service at any time.
    </p>

    <h2>12. General</h2>
    <p>
      These Terms are the entire agreement between you and us about the Service. If a part is found unenforceable, the rest
      stays in effect. Our failure to enforce a right is not a waiver of it. These Terms are governed by the laws of the
      jurisdiction where the Service's operator is based, without regard to conflict-of-law rules.
    </p>

    <h2>13. Contact</h2>
    <p>Questions about these Terms? Visit our <router-link :to="{ name: 'contact' }">Contact page</router-link>.</p>
  </LegalPage>
</template>
