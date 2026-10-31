import type { GithubSnapshot } from '../submissions/github.js';
import type { LicenseInfo } from '../../shared/licenses.js';

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface AppSubmission {
  id?: string;
  name: string;
  description: string;
  websiteUrl: string;
  githubUrl?: string | null;
  license?: string | null;
  licenseCheckedAt?: Date | null;
  github?: GithubSnapshot | null;
  alternativesTo: string[];
  keywords: string[];
  submittedByUid: string;
  submittedByEmail: string;
  status: SubmissionStatus;
  reviewedByUid: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppSubmissionResponse {
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
  status: SubmissionStatus;
  reviewedByUid: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface PublicSubmissionResponse {
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

export type VoteValue = -1 | 0 | 1;

export interface SubmissionVote {
  // Deterministic `${submissionId}:${uid}` key: the primary key itself enforces one vote per user.
  _id: string;
  submissionId: string;
  uid: string;
  value: 1 | -1;
  createdAt: Date;
  updatedAt: Date;
}

export interface VoteTotals {
  upvotes: number;
  downvotes: number;
  score: number;
}
