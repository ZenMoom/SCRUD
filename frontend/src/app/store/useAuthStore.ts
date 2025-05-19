// app/store/useAuthStore.ts

import { PostStatusEnumDto } from '@generated/model';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  username: string;
  profileImgUrl?: string;
  role: PostStatusEnumDto;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage', // name of the item in storage
    }
  )
);

export default useAuthStore;
