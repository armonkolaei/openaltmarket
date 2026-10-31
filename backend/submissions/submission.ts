import { ObjectId } from 'mongodb';
import { z } from 'zod';
import type {
  AppSubmission,
  AppSubmissionResponse,
  PublicSubmissionResponse,
  VoteTotals,
  VoteValue
} from '../types/submission.js';
import { parseGithubUrl, type GithubSnapshot } from './github.js';
import { getLicenseInfo, type LicenseInfo } from './licenses.js';
import { EMPTY_TOTALS } from './voteMath.js';

// A repo whose license check failed (GitHub outage) must not look unlicensed or free to use.
export function licenseInfoFor(doc: AppSubmission): LicenseInfo {
  if (doc.githubUrl && !doc.licenseCheckedAt) {
    return { ...getLicenseInfo('NOASSERTION'), name: 'License not yet verified' };
  }
  return getLicenseInfo(doc.license, doc.github?.licenseName);
}

function hasFreeUse(doc: AppSubmission): boolean {
  return !!doc.githubUrl && !!doc.licenseCheckedAt && licenseInfoFor(doc).freeToUse;
}

const submissionPayloadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(20).max(2000),
  websiteUrl: z
    .string()
    .trim()
    .url()
    .refine((value) => /^https?:\/\//i.test(value), 'Website URL must start with http:// or https://'),
  // Optional: empty clears it, anything else must be a github.com/owner/repo URL.
  githubUrl: z
    .string()
    .trim()
    .max(200)
    .nullish()
    .transform((value, ctx) => {
      if (value === undefined) return undefined;
      if (!value) return null;
      const ref = parseGithubUrl(value);
      if (!ref) {
        ctx.issues.push({
          code: 'custom',
          message: 'GitHub URL must look like https://github.com/owner/repo',
          input: value
        });
        return z.NEVER;
      }
      return ref.url;
    }),
  alternativesTo: z.array(z.string().trim().min(1).max(80)).min(1).max(20),
  keywords: z.array(z.string().trim().min(1).max(40)).min(1).max(30)
});

export const submissionEditSchema = submissionPayloadSchema.partial();

export type SubmissionEdit = z.infer<typeof submissionEditSchema>;

export interface SubmissionPayload {
  name: string;
  description: string;
  websiteUrl: string;
  githubUrl?: string | null;
  alternativesTo: string[];
  keywords: string[];
}

export interface GithubFields {
  githubUrl: string | null;
  license: string | null;
  licenseCheckedAt: Date | null;
  github: GithubSnapshot | null;
}

export const NO_GITHUB: GithubFields = { githubUrl: null, license: null, licenseCheckedAt: null, github: null };

export function parseSubmissionPayload(input: unknown): SubmissionPayload {
  return submissionPayloadSchema.parse(input);
}

export function buildSubmission(
  payload: SubmissionPayload,
  submittedByUid: string,
  submittedByEmail: string,
  github: GithubFields = NO_GITHUB
): AppSubmission {
  const now = new Date();
  return {
    name: payload.name,
    description: payload.description,
    websiteUrl: payload.websiteUrl,
    ...github,
    alternativesTo: payload.alternativesTo,
    keywords: payload.keywords,
    submittedByUid,
    submittedByEmail,
    status: 'pending',
    reviewedByUid: null,
    reviewedAt: null,
    createdAt: now,
    updatedAt: now
  };
}

export function toSubmissionResponse(doc: AppSubmission & { _id?: ObjectId }): AppSubmissionResponse {
  return {
    id: doc._id?.toString() ?? doc.id ?? '',
    name: doc.name,
    description: doc.description,
    websiteUrl: doc.websiteUrl,
    githubUrl: doc.githubUrl ?? null,
    license: doc.license ?? null,
    licenseCheckedAt: doc.licenseCheckedAt ? doc.licenseCheckedAt.toISOString() : null,
    licenseInfo: licenseInfoFor(doc),
    isFreeToUse: hasFreeUse(doc),
    alternativesTo: doc.alternativesTo,
    keywords: doc.keywords,
    submittedByUid: doc.submittedByUid,
    submittedByEmail: doc.submittedByEmail,
    status: doc.status,
    reviewedByUid: doc.reviewedByUid,
    reviewedAt: doc.reviewedAt ? doc.reviewedAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString()
  };
}
export function toPublicSubmissionResponse(
  doc: AppSubmission & { _id?: ObjectId },
  totals: VoteTotals = EMPTY_TOTALS,
  myVote: VoteValue = 0
): PublicSubmissionResponse {
  return {
    id: doc._id?.toString() ?? doc.id ?? '',
    name: doc.name,
    description: doc.description,
    websiteUrl: doc.websiteUrl,
    githubUrl: doc.githubUrl ?? null,
    license: doc.license ?? null,
    licenseInfo: licenseInfoFor(doc),
    isFreeToUse: hasFreeUse(doc),
    github: doc.github ?? null,
    alternativesTo: doc.alternativesTo,
    keywords: doc.keywords,
    createdAt: doc.createdAt.toISOString(),
    approvedAt: (doc.reviewedAt ?? doc.updatedAt).toISOString(),
    upvotes: totals.upvotes,
    downvotes: totals.downvotes,
    score: totals.score,
    myVote
  };
}
