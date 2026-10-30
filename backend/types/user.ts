export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  role: 'user' | 'admin';
  createdAt: Date;
  lastLoginAt: Date;
}

export interface UserProfileResponse {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  role: 'user' | 'admin';
  createdAt: string;
  lastLoginAt: string;
}