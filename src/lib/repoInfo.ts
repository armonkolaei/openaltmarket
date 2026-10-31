import type { GithubSnapshot, LicenseCategory } from '@/types/app';

export type ActivityLevel = 'active' | 'slowing' | 'inactive' | 'archived';

const DAY_MS = 24 * 60 * 60 * 1000;

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function relativeTime(iso: string, now = Date.now()): string {
  const days = Math.max(0, Math.floor((now - Date.parse(iso)) / DAY_MS));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? '' : 's'} ago`;
  }
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

export function projectAge(iso: string, now = Date.now()): string {
  const years = Math.floor((now - Date.parse(iso)) / (365 * DAY_MS));
  if (years < 1) return 'less than a year old';
  return `${years} year${years === 1 ? '' : 's'} old`;
}

export function activityOf(repo: GithubSnapshot, now = Date.now()): { level: ActivityLevel; label: string } {
  if (repo.archived) {
    return { level: 'archived', label: 'Archived · read-only' };
  }

  const days = (now - Date.parse(repo.pushedAt)) / DAY_MS;
  if (days <= 90) return { level: 'active', label: `Active · pushed ${relativeTime(repo.pushedAt, now)}` };
  if (days <= 365) return { level: 'slowing', label: `Slowing · last push ${relativeTime(repo.pushedAt, now)}` };
  return { level: 'inactive', label: `Inactive · last push ${relativeTime(repo.pushedAt, now)}` };
}

export const activityClasses: Record<ActivityLevel, string> = {
  active: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  slowing: 'bg-yellow-50 text-yellow-800 ring-yellow-200',
  inactive: 'bg-orange-50 text-orange-800 ring-orange-200',
  archived: 'bg-slate-100 text-slate-700 ring-slate-200'
};

export const licenseClasses: Record<LicenseCategory, string> = {
  permissive: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  'public-domain': 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  'weak-copyleft': 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  copyleft: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  'network-copyleft': 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  'source-available': 'bg-orange-50 text-orange-800 ring-orange-200',
  'non-commercial': 'bg-orange-50 text-orange-800 ring-orange-200',
  none: 'bg-rose-50 text-rose-800 ring-rose-200',
  unknown: 'bg-slate-100 text-slate-700 ring-slate-200'
};

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572a5',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  Go: '#00add8',
  Rust: '#dea584',
  Java: '#b07219',
  Kotlin: '#a97bff',
  Swift: '#f05138',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  PHP: '#4f5d95',
  Ruby: '#701516',
  Shell: '#89e051',
  Dockerfile: '#384d54',
  SCSS: '#c6538c'
};

const FALLBACK_COLORS = ['#94a3b8', '#64748b', '#a78bfa', '#fb923c', '#2dd4bf'];

export function languageBreakdown(repo: GithubSnapshot, max = 5) {
  const total = repo.languages.reduce((sum, item) => sum + item.bytes, 0);
  if (total === 0) return [];

  const top = repo.languages.slice(0, max).map((item, index) => ({
    name: item.name,
    percent: (item.bytes / total) * 100,
    color: LANGUAGE_COLORS[item.name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]!
  }));

  const rest = repo.languages.slice(max).reduce((sum, item) => sum + item.bytes, 0);
  if (rest > 0) {
    top.push({ name: 'Other', percent: (rest / total) * 100, color: '#cbd5e1' });
  }
  return top;
}

export function forkUrl(repo: GithubSnapshot): string {
  return `https://github.com/${repo.fullName}/fork`;
}

export function cloneCommand(repo: GithubSnapshot): string {
  return `git clone https://github.com/${repo.fullName}.git`;
}
