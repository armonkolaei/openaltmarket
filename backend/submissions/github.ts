import { isFreeUseLicense } from './licenses.js';

export { isFreeUseLicense };

export interface GithubLanguage {
  name: string;
  bytes: number;
}

export interface GithubSnapshot {
  fullName: string;
  owner: string;
  repo: string;
  description: string | null;
  homepage: string | null;
  avatarUrl: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  contributors: number | null;
  createdAt: string;
  pushedAt: string;
  archived: boolean;
  defaultBranch: string;
  primaryLanguage: string | null;
  languages: GithubLanguage[];
  topics: string[];
  licenseName: string | null;
  licenseUrl: string | null;
  latestRelease: { tag: string; publishedAt: string | null } | null;
  fetchedAt: string;
}

export interface GithubRepoRef {
  owner: string;
  repo: string;
  url: string;
}

export interface VerifiedGithub {
  githubUrl: string;
  license: string | null;
  licenseCheckedAt: Date | null;
  github: GithubSnapshot | null;
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

function requestHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'openaltmarket'
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

function get(path: string, fetchImpl: typeof fetch): Promise<Response> {
  return fetchImpl(`https://api.github.com${path}`, {
    headers: requestHeaders(),
    signal: AbortSignal.timeout(8000)
  });
}

const asNumber = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
const asString = (value: unknown) => (typeof value === 'string' && value ? value : null);

async function fetchLanguages(base: string, fetchImpl: typeof fetch): Promise<GithubLanguage[]> {
  const response = await get(`${base}/languages`, fetchImpl);
  if (!response.ok) return [];
  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!data || typeof data !== 'object') return [];
  return Object.entries(data)
    .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
    .map(([name, bytes]) => ({ name, bytes }))
    .sort((a, b) => b.bytes - a.bytes);
}

// One contributor per page, so the `last` page number in the Link header is the total.
async function fetchContributorCount(base: string, fetchImpl: typeof fetch): Promise<number | null> {
  const response = await get(`${base}/contributors?per_page=1&anon=true`, fetchImpl);
  if (!response.ok) return null;
  const link = response.headers.get('link');
  const last = link ? /[?&]page=(\d+)>;\s*rel="last"/.exec(link) : null;
  if (last?.[1]) return Number(last[1]);
  const data = (await response.json().catch(() => null)) as unknown;
  return Array.isArray(data) ? data.length : null;
}

async function fetchLatestRelease(base: string, fetchImpl: typeof fetch): Promise<GithubSnapshot['latestRelease']> {
  const response = await get(`${base}/releases/latest`, fetchImpl);
  if (!response.ok) return null;
  const data = (await response.json().catch(() => null)) as { tag_name?: unknown; published_at?: unknown } | null;
  const tag = asString(data?.tag_name);
  return tag ? { tag, publishedAt: asString(data?.published_at) } : null;
}

export async function lookupGithubRepo(
  ref: GithubRepoRef,
  fetchImpl: typeof fetch = fetch
): Promise<{ githubUrl: string; license: string | null; licenseCheckedAt: Date; github: GithubSnapshot }> {
  const base = `/repos/${ref.owner}/${ref.repo}`;

  let response: Response;
  try {
    response = await get(base, fetchImpl);
  } catch {
    throw new GithubLookupError('unavailable', 'Unable to reach GitHub to verify the repository.');
  }

  if (response.status === 404) {
    throw new GithubLookupError('not_found', 'GitHub repository was not found or is private.');
  }
  if (!response.ok) {
    throw new GithubLookupError('unavailable', `GitHub verification failed (HTTP ${response.status}).`);
  }

  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!data || data.private === true) {
    throw new GithubLookupError('not_found', 'GitHub repository was not found or is private.');
  }

  // Secondary details are best-effort: a failure here must not block the submission.
  const [languages, contributors, latestRelease] = await Promise.all([
    fetchLanguages(base, fetchImpl).catch(() => []),
    fetchContributorCount(base, fetchImpl).catch(() => null),
    fetchLatestRelease(base, fetchImpl).catch(() => null)
  ]);

  const licenseData = data.license as { spdx_id?: unknown; name?: unknown; url?: unknown } | null | undefined;
  // A license GitHub can't identify reports NOASSERTION; no license object means no license at all.
  const license = licenseData ? (asString(licenseData.spdx_id) ?? 'NOASSERTION') : null;
  const owner = (data.owner as { login?: unknown; avatar_url?: unknown } | undefined) ?? {};
  const now = new Date();

  const github: GithubSnapshot = {
    fullName: asString(data.full_name) ?? `${ref.owner}/${ref.repo}`,
    owner: asString(owner.login) ?? ref.owner,
    repo: asString(data.name) ?? ref.repo,
    description: asString(data.description),
    homepage: asString(data.homepage),
    avatarUrl: asString(owner.avatar_url),
    stars: asNumber(data.stargazers_count),
    forks: asNumber(data.forks_count),
    openIssues: asNumber(data.open_issues_count),
    watchers: asNumber(data.subscribers_count),
    contributors,
    createdAt: asString(data.created_at) ?? now.toISOString(),
    pushedAt: asString(data.pushed_at) ?? now.toISOString(),
    archived: data.archived === true,
    defaultBranch: asString(data.default_branch) ?? 'main',
    primaryLanguage: asString(data.language),
    languages,
    topics: Array.isArray(data.topics) ? data.topics.filter((t): t is string => typeof t === 'string') : [],
    licenseName: licenseData ? asString(licenseData.name) : null,
    licenseUrl: licenseData ? asString(licenseData.url) : null,
    latestRelease,
    fetchedAt: now.toISOString()
  };

  return {
    githubUrl: asString(data.html_url) ?? ref.url,
    license,
    licenseCheckedAt: now,
    github
  };
}

// Verifies a repo URL. A missing repo is an error; a GitHub outage leaves the repo unverified.
export async function verifyGithubUrl(githubUrl: string, fetchImpl: typeof fetch = fetch): Promise<VerifiedGithub> {
  const ref = parseGithubUrl(githubUrl);
  if (!ref) {
    throw new GithubLookupError('not_found', 'GitHub URL must look like https://github.com/owner/repo.');
  }

  try {
    return await lookupGithubRepo(ref, fetchImpl);
  } catch (error) {
    if (error instanceof GithubLookupError && error.kind === 'unavailable') {
      return { githubUrl: ref.url, license: null, licenseCheckedAt: null, github: null };
    }
    throw error;
  }
}
