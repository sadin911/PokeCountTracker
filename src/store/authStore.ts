import { create } from 'zustand';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, signInWithGoogle, logOut } from '../utils/firebase';
import { useCollectionStore } from './collectionStore';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<User | null>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Setup persistent auth state listener
  onAuthStateChanged(auth, (user) => {
    set({ user, loading: false, error: null });
    if (!user) {
      useCollectionStore.getState().resetToGuest();
    }
  });

  return {
    user: null,
    loading: true,
    error: null,

    signIn: async () => {
      set({ loading: true, error: null });
      try {
        const user = await signInWithGoogle();
        set({ user, loading: false });
        return user;
      } catch (err: any) {
        set({ loading: false, error: err?.message || 'Login failed' });
        return null;
      }
    },

    signOut: async () => {
      set({ loading: true });
      try {
        await logOut();
        set({ user: null, loading: false, error: null });
      } catch (err: any) {
        set({ loading: false, error: err?.message || 'Logout failed' });
      }
    },

    clearError: () => set({ error: null }),
  };
});
