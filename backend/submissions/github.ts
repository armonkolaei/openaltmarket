// SPDX ids of OSI-approved licenses that allow anyone to modify, redistribute and sell the software.
const FREE_USE_LICENSES = new Set([
  '0BSD',
  'AGPL-3.0',
  'AGPL-3.0-only',
  'AGPL-3.0-or-later',
  'Apache-2.0',
  'Artistic-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'BSL-1.0',
  'EPL-2.0',
  'GPL-2.0',
  'GPL-2.0-only',
  'GPL-2.0-or-later',
  'GPL-3.0',
  'GPL-3.0-only',
  'GPL-3.0-or-later',
  'ISC',
  'LGPL-2.1',
  'LGPL-2.1-only',
  'LGPL-2.1-or-later',
  'LGPL-3.0',
  'LGPL-3.0-only',
  'LGPL-3.0-or-later',
  'MIT',
  'MPL-2.0',
  'Unlicense',
  'Zlib'
]);

export interface GithubRepoRef {
  owner: string;
  repo: string;
  url: string;
}

export interface GithubRepoInfo {
  githubUrl: string;
  license: string | null;
  licenseCheckedAt: Date;
}

export type GithubLookupFailure = 'not_found' | 'unavailable';

export class GithubLookupError extends Error {
  constructor(
    public readonly kind: GithubLookupFailure,
    message: string
  ) {
    super(message);
    this.name = 'GithubLookupError';
  }
}

const REPO_PATTERN = /^https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9._-]{1,100})(?:[/?#].*)?$/i;

export function parseGithubUrl(input: string): GithubRepoRef | null {
  const match = REPO_PATTERN.exec(input.trim());
  if (!match) {
    return null;
  }

  const owner = match[1];
  const repo = match[2]?.replace(/\.git$/i, '');
  if (!owner || !repo || repo === '.' || repo === '..') {
    return null;
  }

  return { owner, repo, url: `https://github.com/${owner}/${repo}` };
}

export function isFreeUseLicense(license: string | null | undefined): boolean {
  return !!license && FREE_USE_LICENSES.has(license);
}

export async function lookupGithubRepo(
  ref: GithubRepoRef,
  fetchImpl: typeof fetch = fetch
): Promise<GithubRepoInfo> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'openaltmarket'
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  let response: Response;
  try {
    response = await fetchImpl(`https://api.github.com/repos/${ref.owner}/${ref.repo}`, {
      headers,
      signal: AbortSignal.timeout(8000)
    });
  } catch {
    throw new GithubLookupError('unavailable', 'Unable to reach GitHub to verify the repository.');
  }

  if (response.status === 404) {
    throw new GithubLookupError('not_found', 'GitHub repository was not found or is private.');
  }
  if (!response.ok) {
    throw new GithubLookupError('unavailable', `GitHub verification failed (HTTP ${response.status}).`);
  }

  const data = (await response.json().catch(() => null)) as {
    html_url?: string;
    private?: boolean;
    license?: { spdx_id?: string | null } | null;
  } | null;

  if (!data || data.private) {
    throw new GithubLookupError('not_found', 'GitHub repository was not found or is private.');
  }

  const spdx = data.license?.spdx_id;
  return {
    githubUrl: data.html_url ?? ref.url,
    license: spdx && spdx !== 'NOASSERTION' ? spdx : null,
    licenseCheckedAt: new Date()
  };
}

// Verifies a repo URL. A missing repo is an error; a GitHub outage leaves the repo unverified.
export async function verifyGithubUrl(
  githubUrl: string,
  fetchImpl: typeof fetch = fetch
): Promise<{ githubUrl: string; license: string | null; licenseCheckedAt: Date | null }> {
  const ref = parseGithubUrl(githubUrl);
  if (!ref) {
    throw new GithubLookupError('not_found', 'GitHub URL must look like https://github.com/owner/repo.');
  }

  try {
    return await lookupGithubRepo(ref, fetchImpl);
  } catch (error) {
    if (error instanceof GithubLookupError && error.kind === 'unavailable') {
      return { githubUrl: ref.url, license: null, licenseCheckedAt: null };
    }
    throw error;
  }
}
