import { describe, expect, it } from 'vitest';
import {
  GithubLookupError,
  isFreeUseLicense,
  parseGithubUrl,
  verifyGithubUrl
} from '../../backend/submissions/github';
import { parseSubmissionPayload, licenseInfoFor } from '../../backend/submissions/submission';
import { getLicenseInfo } from '../../backend/submissions/licenses';

const json = (status: number, body: unknown) =>
  (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

describe('parseGithubUrl', () => {
  it('normalizes repo urls', () => {
    expect(parseGithubUrl('https://github.com/acme/tool.git')?.url).toBe('https://github.com/acme/tool');
    expect(parseGithubUrl('https://www.github.com/acme/tool/tree/main')?.url).toBe('https://github.com/acme/tool');
  });

  it('rejects non-repo urls', () => {
    expect(parseGithubUrl('https://github.com/acme')).toBeNull();
    expect(parseGithubUrl('https://evil.com/github.com/acme/tool')).toBeNull();
  });
});

describe('isFreeUseLicense', () => {
  it('accepts OSI licenses and rejects others', () => {
    expect(isFreeUseLicense('MIT')).toBe(true);
    expect(isFreeUseLicense('BUSL-1.1')).toBe(false);
    expect(isFreeUseLicense(null)).toBe(false);
  });
});

describe('verifyGithubUrl', () => {
  const repoBody = {
    html_url: 'https://github.com/acme/tool',
    full_name: 'acme/tool',
    name: 'tool',
    owner: { login: 'acme', avatar_url: 'https://avatars.githubusercontent.com/u/1' },
    stargazers_count: 120,
    forks_count: 12,
    open_issues_count: 3,
    pushed_at: '2026-10-01T00:00:00Z',
    created_at: '2020-01-01T00:00:00Z',
    topics: ['finance'],
    license: { spdx_id: 'MIT', name: 'MIT License' }
  };

  const routed = ((url: string) => {
    if (url.endsWith('/languages')) return Promise.resolve(new Response(JSON.stringify({ TypeScript: 300, CSS: 100 })));
    if (url.includes('/contributors')) {
      return Promise.resolve(
        new Response('[{}]', { headers: { link: '<https://api.github.com/x?per_page=1&page=42>; rel="last"' } })
      );
    }
    if (url.endsWith('/releases/latest')) {
      return Promise.resolve(new Response(JSON.stringify({ tag_name: 'v1.2.3', published_at: '2026-09-01T00:00:00Z' })));
    }
    return Promise.resolve(new Response(JSON.stringify(repoBody)));
  }) as unknown as typeof fetch;

  it('reads the license and repository details', async () => {
    const result = await verifyGithubUrl('https://github.com/acme/tool', routed);
    expect(result.license).toBe('MIT');
    expect(result.licenseCheckedAt).toBeInstanceOf(Date);
    expect(result.github).toMatchObject({
      stars: 120,
      forks: 12,
      contributors: 42,
      primaryLanguage: null,
      languages: [
        { name: 'TypeScript', bytes: 300 },
        { name: 'CSS', bytes: 100 }
      ],
      latestRelease: { tag: 'v1.2.3' }
    });
  });

  it('reports NOASSERTION for unrecognized licenses and null for none', async () => {
    const other = (async () =>
      new Response(JSON.stringify({ ...repoBody, license: { spdx_id: 'NOASSERTION', name: 'Other' } }))) as unknown as typeof fetch;
    const none = (async () => new Response(JSON.stringify({ ...repoBody, license: null }))) as unknown as typeof fetch;
    expect((await verifyGithubUrl('https://github.com/acme/tool', other)).license).toBe('NOASSERTION');
    expect((await verifyGithubUrl('https://github.com/acme/tool', none)).license).toBeNull();
  });

  it('fails on missing repos', async () => {
    await expect(verifyGithubUrl('https://github.com/acme/nope', json(404, {}))).rejects.toBeInstanceOf(
      GithubLookupError
    );
  });

  it('stays unverified when GitHub is unavailable', async () => {
    const result = await verifyGithubUrl('https://github.com/acme/tool', json(403, {}));
    expect(result).toEqual({
      githubUrl: 'https://github.com/acme/tool',
      license: null,
      licenseCheckedAt: null,
      github: null
    });
  });
});

describe('getLicenseInfo', () => {
  it('explains permissive, copyleft and network copyleft licenses', () => {
    expect(getLicenseInfo('MIT')).toMatchObject({ category: 'permissive', freeToUse: true, mustShareSource: false });
    expect(getLicenseInfo('GPL-3.0-only')).toMatchObject({ category: 'copyleft', freeToUse: true, mustShareSource: true });
    expect(getLicenseInfo('AGPL-3.0')).toMatchObject({ category: 'network-copyleft', canSell: true });
  });

  it('never marks restricted, missing or unknown licenses as free to use', () => {
    expect(getLicenseInfo('BUSL-1.1')).toMatchObject({ category: 'source-available', freeToUse: false, canSell: false });
    expect(getLicenseInfo('CC-BY-NC-4.0')).toMatchObject({ category: 'non-commercial', canSell: false });
    expect(getLicenseInfo(null)).toMatchObject({ category: 'none', freeToUse: false });
    expect(getLicenseInfo('NOASSERTION')).toMatchObject({ category: 'unknown', freeToUse: false });
  });
});

describe('licenseInfoFor', () => {
  const base = {
    name: 'Tool',
    description: 'x',
    websiteUrl: 'https://tool.dev',
    alternativesTo: [],
    keywords: [],
    submittedByUid: 'u',
    submittedByEmail: 'u@x.dev',
    status: 'approved' as const,
    reviewedByUid: null,
    reviewedAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  it('treats an unverified repo as unknown, not unlicensed', () => {
    const info = licenseInfoFor({ ...base, githubUrl: 'https://github.com/a/b', license: null, licenseCheckedAt: null });
    expect(info.category).toBe('unknown');
    expect(info.freeToUse).toBe(false);
  });
});

describe('submission payload githubUrl', () => {
  const base = {
    name: 'Tool',
    description: 'A description that is long enough.',
    websiteUrl: 'https://tool.dev',
    alternativesTo: ['x'],
    keywords: ['y']
  };

  it('is optional', () => {
    expect(parseSubmissionPayload(base).githubUrl).toBeUndefined();
    expect(parseSubmissionPayload({ ...base, githubUrl: '' }).githubUrl).toBeNull();
  });

  it('rejects invalid urls', () => {
    expect(() => parseSubmissionPayload({ ...base, githubUrl: 'https://example.com/a/b' })).toThrow();
  });
});
