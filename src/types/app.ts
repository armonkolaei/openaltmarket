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
  role: 'user' | 'admin';
  createdAt: string;
  lastLoginAt: string;
}