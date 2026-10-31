export interface GithubRepoRef {
  owner: string;
  repo: string;
  url: string;
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
