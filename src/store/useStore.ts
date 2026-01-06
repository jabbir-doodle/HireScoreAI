import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, Screen, AIConfig, ScreeningSession } from '../types';

// Encryption utilities for API keys
const encrypt = (text: string, key: string): string => {
  // Simple XOR encryption - in production, use Web Crypto API
  return btoa(
    text
      .split('')
      .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
      .join('')
  );
};

const decrypt = (encoded: string, key: string): string => {
  try {
    const decoded = atob(encoded);
    return decoded
      .split('')
      .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
      .join('');
  } catch {
    return '';
  }
};

const ENCRYPTION_KEY = 'HireScoreAI_2026_Secure';

const defaultAIConfig: AIConfig = {
  provider: 'openrouter',
  apiKey: '',
  model: 'z-ai/glm-4.7-20251222',
  encrypted: false,
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Navigation
      currentScreen: 'landing' as Screen,
      setScreen: (screen) => set({ currentScreen: screen }),

      // Job Description
      currentJob: null,
      savedJobs: [],
      setCurrentJob: (job) => set({ currentJob: job }),
      addJob: (job) =>
        set((state) => ({
          savedJobs: [job, ...state.savedJobs],
          currentJob: job,
        })),
      removeJob: (id) =>
        set((state) => ({
          savedJobs: state.savedJobs.filter((j) => j.id !== id),
          currentJob: state.currentJob?.id === id ? null : state.currentJob,
        })),

      // Candidates & CVs
      uploadedCVs: [],
      addCVs: (files) =>
        set((state) => ({
          uploadedCVs: [...state.uploadedCVs, ...files],
        })),
      removeCVs: (index) =>
        set((state) => ({
          uploadedCVs: state.uploadedCVs.filter((_, i) => i !== index),
        })),
      clearCVs: () => set({ uploadedCVs: [] }),

      // Screening
      currentSession: null,
      sessions: [],
      startScreening: () => {
        const state = get();
        if (!state.currentJob || state.uploadedCVs.length === 0) return;

        const session: ScreeningSession = {
          id: crypto.randomUUID(),
          jobId: state.currentJob.id,
          candidates: [],
          status: 'pending',
          progress: 0,
          startedAt: new Date(),
        };

        set({
          currentSession: session,
          sessions: [session, ...state.sessions],
          currentScreen: 'screening',
        });
      },
      updateSession: (updates) =>
        set((state) => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, ...updates }
            : null,
          sessions: state.sessions.map((s) =>
            s.id === state.currentSession?.id ? { ...s, ...updates } : s
          ),
        })),

      // Settings
      aiConfig: defaultAIConfig,
      setAIConfig: (config) =>
        set((state) => {
          const newConfig = { ...state.aiConfig, ...config };
          // Encrypt API key if provided
          if (config.apiKey && config.apiKey !== state.aiConfig.apiKey) {
            newConfig.apiKey = encrypt(config.apiKey, ENCRYPTION_KEY);
            newConfig.encrypted = true;
          }
          return { aiConfig: newConfig };
        }),

      // UI
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'hirescore-storage',
      partialize: (state) => ({
        savedJobs: state.savedJobs,
        sessions: state.sessions,
        aiConfig: state.aiConfig,
      }),
    }
  )
);

// Helper to get decrypted API key
export const getDecryptedApiKey = (): string => {
  const { aiConfig } = useStore.getState();
  if (!aiConfig.apiKey) return '';
  if (!aiConfig.encrypted) return aiConfig.apiKey;
  return decrypt(aiConfig.apiKey, ENCRYPTION_KEY);
};

// Generate unique ID
export const generateId = (): string => crypto.randomUUID();
