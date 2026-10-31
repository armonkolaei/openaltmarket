export type UserRole = 'user' | 'admin' | 'super_admin';

export interface FeaturedAlternative {
  id: string;
  name: string;
  category: string;
  description: string;
  stars: number;
  license: string;
}

export interface CategorySummary {
  id: string;
  title: string;
  count: number;
  description: string;
}

export interface AppUserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  role: UserRole;
  disabled?: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export type VoteValue = -1 | 0 | 1;

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
  freeToUse: boolean;
  canUseCommercially: boolean;
  canModify: boolean;
  canSell: boolean;
  mustShareSource: boolean;
  summary: string;
  obligations: string[];
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
  languages: { name: string; bytes: number }[];
  topics: string[];
  licenseName: string | null;
  licenseUrl: string | null;
  latestRelease: { tag: string; publishedAt: string | null } | null;
  fetchedAt: string;
}

export interface VoteResult {
  id: string;
  upvotes: number;
  downvotes: number;
  score: number;
  myVote: VoteValue;
}

export interface PublicSubmission {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  githubUrl: string | null;
  license: string | null;
  licenseInfo: LicenseInfo;
  isFreeToUse: boolean;
  github: GithubSnapshot | null;
  alternativesTo: string[];
  keywords: string[];
  createdAt: string;
  approvedAt: string;
  upvotes: number;
  downvotes: number;
  score: number;
  myVote: VoteValue;
}

export interface AppSubmission {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  githubUrl: string | null;
  license: string | null;
  licenseCheckedAt: string | null;
  licenseInfo: LicenseInfo;
  isFreeToUse: boolean;
  alternativesTo: string[];
  keywords: string[];
  submittedByUid: string;
  submittedByEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedByUid: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}