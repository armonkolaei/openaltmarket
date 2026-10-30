export type UserRole = 'user' | 'admin' | 'super_admin';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  role: UserRole;
  disabled?: boolean;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface UserProfileResponse {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  role: UserRole;
  disabled: boolean;
  createdAt: string;
  lastLoginAt: string;
}