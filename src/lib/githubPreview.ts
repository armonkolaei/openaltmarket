import { parseGithubUrl } from '../../shared/githubUrl';
import { getLicenseInfo, type LicenseInfo } from '../../shared/licenses';

// Untrusted by design: this runs in the visitor's browser and is only used to prefill the form
// and preview the license. The server re-reads the repository itself when an admin approves it.
export interface GithubPreview {
  url: string;
  fullName: string;
  name: string;
  description: string | null;
  homepage: string | null;
  topics: string[];
  stars: number;
  forks: number;
  archived: boolean;
  pushedAt: string | null;
  license: string | null;
  licenseInfo: LicenseInfo;
}

export type GithubPreviewResult =
  | { status: 'ok'; preview: GithubPreview }
  | { status: 'invalid'; message: string }
  | { status: 'not_found'; message: string }
  | { status: 'unavailable'; message: string };

const asString = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null);
const asNumber = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

export interface LiveGithubStats {
  stars: number;
  forks: number;
  openIssues: number;
  pushedAt: string | null;
  archived: boolean;
}

// Display-only numbers for the details page. Never used for the license or the gold badge.
export async function fetchLiveGithubStats(fullName: string, signal?: AbortSignal): Promise<LiveGithubStats | null> {
  const ref = parseGithubUrl(`https://github.com/${fullName}`);
  if (!ref) return null;

  try {
    const response = await fetch(`https://api.github.com/repos/${ref.owner}/${ref.repo}`, {
      headers: { Accept: 'application/vnd.github+json' },
      signal
    });
    if (!response.ok) return null;
    const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    if (!data || data.private === true) return null;
    return {
      stars: asNumber(data.stargazers_count),
      forks: asNumber(data.forks_count),
      openIssues: asNumber(data.open_issues_count),
      pushedAt: asString(data.pushed_at),
      archived: data.archived === true
    };
  } catch {
    return null;
  }
}

export async function fetchGithubPreview(input: string, signal?: AbortSignal): Promise<GithubPreviewResult> {
  const ref = parseGithubUrl(input);
  if (!ref) {
    return { status: 'invalid', message: 'Use a link like https://github.com/owner/repo' };
  }

  let response: Response;
  try {
    response = await fetch(`https://api.github.com/repos/${ref.owner}/${ref.repo}`, {
      headers: { Accept: 'application/vnd.github+json' },
      signal
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    return { status: 'unavailable', message: 'Could not reach GitHub to check this repository right now.' };
  }

  if (response.status === 404) {
    return { status: 'not_found', message: 'We could not find that repository. It may be private, renamed or misspelled.' };
  }
  if (!response.ok) {
    return { status: 'unavailable', message: 'GitHub is limiting checks right now. We will verify the repository on review.' };
  }

  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!data || data.private === true) {
    return { status: 'not_found', message: 'We could not find that repository. It may be private, renamed or misspelled.' };
  }

  const licenseData = data.license as { spdx_id?: unknown; name?: unknown } | null | undefined;
  const license = licenseData ? (asString(licenseData.spdx_id) ?? 'NOASSERTION') : null;

  return {
    status: 'ok',
    preview: {
      url: asString(data.html_url) ?? ref.url,
      fullName: asString(data.full_name) ?? `${ref.owner}/${ref.repo}`,
      name: asString(data.name) ?? ref.repo,
      description: asString(data.description),
      homepage: asString(data.homepage),
      topics: Array.isArray(data.topics) ? data.topics.filter((t): t is string => typeof t === 'string') : [],
      stars: asNumber(data.stargazers_count),
      forks: asNumber(data.forks_count),
      archived: data.archived === true,
      pushedAt: asString(data.pushed_at),
      license,
      licenseInfo: getLicenseInfo(license, licenseData ? asString(licenseData.name) : null)
    }
  };
}
