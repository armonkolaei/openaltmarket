export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface AppSubmission {
  id?: string;
  name: string;
  description: string;
  websiteUrl: string;
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