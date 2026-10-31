import { describe, expect, it } from 'vitest';
import {
  GithubLookupError,
  isFreeUseLicense,
  parseGithubUrl,
  verifyGithubUrl
} from '../../backend/submissions/github';
import { parseSubmissionPayload } from '../../backend/submissions/submission';

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
  it('reads the license', async () => {
    const result = await verifyGithubUrl(
      'https://github.com/acme/tool',
      json(200, { html_url: 'https://github.com/acme/tool', license: { spdx_id: 'MIT' } })
    );
    expect(result.license).toBe('MIT');
    expect(result.licenseCheckedAt).toBeInstanceOf(Date);
  });

  it('fails on missing repos', async () => {
    await expect(verifyGithubUrl('https://github.com/acme/nope', json(404, {}))).rejects.toBeInstanceOf(
      GithubLookupError
    );
  });

  it('stays unverified when GitHub is unavailable', async () => {
    const result = await verifyGithubUrl('https://github.com/acme/tool', json(403, {}));
    expect(result).toEqual({ githubUrl: 'https://github.com/acme/tool', license: null, licenseCheckedAt: null });
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
