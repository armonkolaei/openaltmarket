import { defineStore } from 'pinia';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { loadCatalog } from '@/lib/catalog';
import { ProfileSyncUnavailableError, syncUserProfile } from '@/lib/api';
import type { AppUserProfile } from '@/types/app';

interface AuthState {
  firebaseUser: User | null;
  profile: AppUserProfile | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

let authInitPromise: Promise<void> | null = null;

function buildFallbackProfile(user: User): AppUserProfile {
  const now = new Date().toISOString();
  const email = user.email ?? '';

  return {
    uid: user.uid,
    displayName: user.displayName ?? email.split('@')[0] ?? 'OpenAlt User',
    email,
    photoURL: user.photoURL,
    role: 'user',
    createdAt: now,
    lastLoginAt: now
  };
}

function requireAuth() {
  if (!auth) {
    throw new Error('Firebase auth is not configured. Set VITE_FIREBASE_* values in .env.');
  }

  return auth;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    firebaseUser: null,
    profile: null,
    isInitialized: false,
    isLoading: false,
    error: null
  }),
  getters: {
    isAuthenticated: (state) => state.firebaseUser !== null
  },
  actions: {
    async init() {
      if (authInitPromise) {
        return authInitPromise;
      }

      if (!auth) {
        this.firebaseUser = null;
        this.profile = null;
        this.isInitialized = true;
        this.error = 'Firebase auth is not configured. Set VITE_FIREBASE_* values in .env.';
        authInitPromise = Promise.resolve();
        return authInitPromise;
      }

      const authClient = auth;

      authInitPromise = new Promise((resolve) => {
        onAuthStateChanged(authClient, async (user) => {
          this.firebaseUser = user;
          // Reload so the catalog reflects this user's own votes (or clears them on logout).
          if (this.isInitialized) {
            void loadCatalog(true);
          }
          this.error = null;

          if (user) {
            try {
              this.profile = await syncUserProfile({
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL
              });
              this.error = null;
              if (this.profile.disabled) {
                await signOut(authClient);
                this.profile = null;
                this.error = 'This account has been disabled. Contact an administrator.';
              }
            } catch (error) {
              this.profile = buildFallbackProfile(user);
              // Keep auth UX functional even if backend sync is temporarily unavailable.
              this.error = null;
              if (!(error instanceof ProfileSyncUnavailableError)) {
                console.warn('Profile sync failed; using local fallback profile.', error);
              }
            }
          } else {
            this.profile = null;
          }

          if (!this.isInitialized) {
            this.isInitialized = true;
            resolve();
          }
        });
      });

      return authInitPromise;
    },
    async register(email: string, password: string, displayName: string) {
      this.isLoading = true;
      this.error = null;
      try {
        const authClient = requireAuth();
        const credential = await createUserWithEmailAndPassword(authClient, email, password);
        if (displayName.trim()) {
          await updateProfile(credential.user, { displayName: displayName.trim() });
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Registration failed.';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async login(email: string, password: string) {
      this.isLoading = true;
      this.error = null;
      try {
        const authClient = requireAuth();
        await signInWithEmailAndPassword(authClient, email, password);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Login failed.';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async loginWithGoogle() {
      this.isLoading = true;
      this.error = null;
      try {
        const authClient = requireAuth();
        if (!googleProvider) {
          throw new Error('Google provider is unavailable. Check Firebase env configuration.');
        }
        await signInWithPopup(authClient, googleProvider);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Google sign-in failed.';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async logout() {
      this.isLoading = true;
      this.error = null;
      try {
        const authClient = requireAuth();
        await signOut(authClient);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Logout failed.';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async resetPassword(email: string) {
      this.isLoading = true;
      this.error = null;
      try {
        const authClient = requireAuth();
        await sendPasswordResetEmail(authClient, email);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Password reset failed.';
        throw error;
      } finally {
        this.isLoading = false;
      }
    }
  }
});