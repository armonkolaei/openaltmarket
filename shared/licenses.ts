export type LicenseCategory =
  | 'permissive'
  | 'public-domain'
  | 'weak-copyleft'
  | 'copyleft'
  | 'network-copyleft'
  | 'source-available'
  | 'non-commercial'
  | 'none'
  | 'unknown';

export interface LicenseInfo {
  spdxId: string | null;
  name: string;
  category: LicenseCategory;
  label: string;
  // True only for OSI-style licenses that allow anyone to use, modify, fork and sell the software.
  freeToUse: boolean;
  canUseCommercially: boolean;
  canModify: boolean;
  canSell: boolean;
  mustShareSource: boolean;
  summary: string;
  obligations: string[];
}

interface CatalogEntry {
  name: string;
  category: LicenseCategory;
}

const CATEGORY_DETAILS: Record<
  LicenseCategory,
  { label: string; freeToUse: boolean; mustShareSource: boolean; summary: string; obligations: string[] }
> = {
  permissive: {
    label: 'Permissive open source',
    freeToUse: true,
    mustShareSource: false,
    summary:
      'Free to use, including commercially. You can copy, modify, fork, redistribute and sell it, even inside a closed-source product, as long as you keep the original copyright and license notice.',
    obligations: ['Keep the original copyright and license notice with any copy you distribute.']
  },
  'public-domain': {
    label: 'Public domain',
    freeToUse: true,
    mustShareSource: false,
    summary:
      'The author has given up (or waived) their rights. You can use, modify, fork and sell it for any purpose with essentially no conditions.',
    obligations: []
  },
  'weak-copyleft': {
    label: 'Weak copyleft open source',
    freeToUse: true,
    mustShareSource: true,
    summary:
      'Free to use, including commercially. You can modify, fork and sell it. If you distribute changes to the licensed files themselves, you must share those changes under the same license, but you can combine it with your own proprietary code.',
    obligations: [
      'Share your changes to the licensed files under the same license when you distribute them.',
      'Keep the original copyright and license notices.'
    ]
  },
  copyleft: {
    label: 'Copyleft open source',
    freeToUse: true,
    mustShareSource: true,
    summary:
      'Free to use, including commercially. You can modify, fork and sell it. If you distribute a modified version (or something built on it), you must release your source code under the same license.',
    obligations: [
      'Release the source of any modified version you distribute under the same license.',
      'Keep the original copyright and license notices.',
      'You cannot turn it into a closed-source product.'
    ]
  },
  'network-copyleft': {
    label: 'Network copyleft open source',
    freeToUse: true,
    mustShareSource: true,
    summary:
      'Free to use, including commercially. You can modify, fork and sell it. If you distribute a modified version, or let people use it over a network (for example as a hosted service), you must offer them your source code under the same license.',
    obligations: [
      'Offer the source of your modified version to anyone who uses it, including over a network.',
      'Release it under the same license.',
      'You cannot turn it into a closed-source product or a closed hosted service.'
    ]
  },
  'source-available': {
    label: 'Source-available (not open source)',
    freeToUse: false,
    mustShareSource: false,
    summary:
      'You can read the code, but this license is not open source. It restricts what you can do with it, commonly selling it or offering it as a competing hosted service. Read the license before using it commercially.',
    obligations: ['Check the license text for the exact restrictions before using, modifying or selling it.']
  },
  'non-commercial': {
    label: 'Non-commercial only',
    freeToUse: false,
    mustShareSource: false,
    summary:
      'You may use and modify it for personal or non-commercial purposes, but you may not sell it or use it commercially without separate permission from the author.',
    obligations: ['Do not use it commercially or sell it without the author’s permission.']
  },
  none: {
    label: 'No license',
    freeToUse: false,
    mustShareSource: false,
    summary:
      'No license was detected. By default, code without a license is “all rights reserved”: you can view it, and fork it on GitHub, but you have no permission to copy, modify, distribute or sell it. Ask the author before relying on it.',
    obligations: ['Get the author’s permission before using, modifying or distributing it.']
  },
  unknown: {
    label: 'Custom or unrecognized license',
    freeToUse: false,
    mustShareSource: false,
    summary:
      'This repository uses a custom or unrecognized license, so we cannot summarize it. Read the LICENSE file in the repository before using, modifying or selling it.',
    obligations: ['Read the LICENSE file in the repository to learn the exact terms.']
  }
};

const CATALOG: Record<string, CatalogEntry> = {
  MIT: { name: 'MIT License', category: 'permissive' },
  'MIT-0': { name: 'MIT No Attribution', category: 'permissive' },
  'Apache-2.0': { name: 'Apache License 2.0', category: 'permissive' },
  'BSD-2-Clause': { name: 'BSD 2-Clause License', category: 'permissive' },
  'BSD-3-Clause': { name: 'BSD 3-Clause License', category: 'permissive' },
  'BSD-3-Clause-Clear': { name: 'BSD 3-Clause Clear License', category: 'permissive' },
  ISC: { name: 'ISC License', category: 'permissive' },
  '0BSD': { name: 'BSD Zero Clause License', category: 'permissive' },
  Zlib: { name: 'zlib License', category: 'permissive' },
  'BSL-1.0': { name: 'Boost Software License 1.0', category: 'permissive' },
  'Artistic-2.0': { name: 'Artistic License 2.0', category: 'permissive' },
  'PostgreSQL': { name: 'PostgreSQL License', category: 'permissive' },
  Unlicense: { name: 'The Unlicense', category: 'public-domain' },
  'CC0-1.0': { name: 'Creative Commons Zero v1.0', category: 'public-domain' },
  WTFPL: { name: 'Do What The F*ck You Want To Public License', category: 'public-domain' },
  'MPL-2.0': { name: 'Mozilla Public License 2.0', category: 'weak-copyleft' },
  'EPL-2.0': { name: 'Eclipse Public License 2.0', category: 'weak-copyleft' },
  'EPL-1.0': { name: 'Eclipse Public License 1.0', category: 'weak-copyleft' },
  'LGPL-2.1': { name: 'GNU Lesser General Public License v2.1', category: 'weak-copyleft' },
  'LGPL-3.0': { name: 'GNU Lesser General Public License v3.0', category: 'weak-copyleft' },
  'CDDL-1.0': { name: 'Common Development and Distribution License 1.0', category: 'weak-copyleft' },
  'GPL-2.0': { name: 'GNU General Public License v2.0', category: 'copyleft' },
  'GPL-3.0': { name: 'GNU General Public License v3.0', category: 'copyleft' },
  'EUPL-1.2': { name: 'European Union Public License 1.2', category: 'copyleft' },
  'OSL-3.0': { name: 'Open Software License 3.0', category: 'copyleft' },
  'AGPL-3.0': { name: 'GNU Affero General Public License v3.0', category: 'network-copyleft' },
  'BUSL-1.1': { name: 'Business Source License 1.1', category: 'source-available' },
  'SSPL-1.0': { name: 'Server Side Public License v1', category: 'source-available' },
  'Elastic-2.0': { name: 'Elastic License 2.0', category: 'source-available' },
  'CC-BY-NC-4.0': { name: 'Creative Commons Attribution-NonCommercial 4.0', category: 'non-commercial' },
  'CC-BY-NC-SA-4.0': { name: 'Creative Commons Attribution-NonCommercial-ShareAlike 4.0', category: 'non-commercial' },
  'CC-BY-NC-ND-4.0': { name: 'Creative Commons Attribution-NonCommercial-NoDerivatives 4.0', category: 'non-commercial' },
  'PolyForm-Noncommercial-1.0.0': { name: 'PolyForm Noncommercial License 1.0.0', category: 'non-commercial' },
  'PolyForm-Shield-1.0.0': { name: 'PolyForm Shield License 1.0.0', category: 'source-available' }
};

// GPL-3.0-only, GPL-3.0-or-later and GPL-3.0+ all share one catalog entry.
function normalizeSpdx(spdxId: string): string {
  return spdxId.replace(/(-only|-or-later|\+)$/i, '');
}

function buildInfo(spdxId: string | null, name: string, category: LicenseCategory): LicenseInfo {
  const details = CATEGORY_DETAILS[category];
  return {
    spdxId,
    name,
    category,
    label: details.label,
    freeToUse: details.freeToUse,
    canUseCommercially: details.freeToUse,
    canModify: details.freeToUse || category === 'non-commercial',
    canSell: details.freeToUse,
    mustShareSource: details.mustShareSource,
    summary: details.summary,
    obligations: details.obligations
  };
}

export function getLicenseInfo(spdxId: string | null | undefined, githubName?: string | null): LicenseInfo {
  if (!spdxId) {
    return buildInfo(null, 'No license detected', 'none');
  }

  const entry = CATALOG[spdxId] ?? CATALOG[normalizeSpdx(spdxId)];
  if (!entry) {
    return buildInfo(spdxId, githubName ?? spdxId, 'unknown');
  }

  return buildInfo(spdxId, entry.name, entry.category);
}

export function isFreeUseLicense(spdxId: string | null | undefined): boolean {
  return getLicenseInfo(spdxId).freeToUse;
}
