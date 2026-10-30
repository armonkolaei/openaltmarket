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
  createdAt: string;
  lastLoginAt: string;
}

export interface PublicSubmission {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  alternativesTo: string[];
  keywords: string[];
  createdAt: string;
  approvedAt: string;
}

export interface AppSubmission {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
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