import { ObjectId } from 'mongodb';
import { z } from 'zod';
import type {
  AppSubmission,
  AppSubmissionResponse,
  PublicSubmissionResponse,
  VoteTotals,
  VoteValue
} from '../types/submission.js';
import { EMPTY_TOTALS } from './voteMath.js';

const submissionPayloadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(20).max(2000),
  websiteUrl: z
    .string()
    .trim()
    .url()
    .refine((value) => /^https?:\/\//i.test(value), 'Website URL must start with http:// or https://'),
  alternativesTo: z.array(z.string().trim().min(1).max(80)).min(1).max(20),
  keywords: z.array(z.string().trim().min(1).max(40)).min(1).max(30)
});

export interface SubmissionPayload {
  name: string;
  description: string;
  websiteUrl: string;
  alternativesTo: string[];
  keywords: string[];
}

export function parseSubmissionPayload(input: unknown): SubmissionPayload {
  return submissionPayloadSchema.parse(input);
}

export function buildSubmission(
  payload: SubmissionPayload,
  submittedByUid: string,
  submittedByEmail: string
): AppSubmission {
  const now = new Date();
  return {
    name: payload.name,
    description: payload.description,
    websiteUrl: payload.websiteUrl,
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
