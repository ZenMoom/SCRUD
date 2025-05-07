import { create } from 'zustand';

interface GitHubTokenState {
  githubToken: string | null;
  setGithubToken: (token: string) => void;
  clearGithubToken: () => void;
}

export const useGitHubTokenStore = create<GitHubTokenState>()((set) => ({
  githubToken: typeof window !== 'undefined' ? localStorage.getItem('github-token-direct') : null,
  setGithubToken: (token) => {
    localStorage.setItem('github-token-direct', token);
    set({ githubToken: token });
  },
  clearGithubToken: () => {
    localStorage.removeItem('github-token-direct');
    set({ githubToken: null });
  },
})); 