// ============================================
// HireScore AI - Type Definitions
// ============================================

export type Screen = 'landing' | 'job' | 'upload' | 'screening' | 'results' | 'settings';

export type AIProvider = 'openai' | 'anthropic' | 'openrouter' | 'custom';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
  encrypted?: boolean;
}

export interface JobDescription {
  id: string;
  title: string;
  company: string;
  location: string;
  experience: string;
  rawText: string;
  requirements: string[];
  niceToHave: string[];
  createdAt: Date;
}

// Enterprise Score Breakdown (2026 Standard)
export interface ScoreBreakdown {
  technicalSkills: number;  // 0-35
  experience: number;       // 0-25
  education: number;        // 0-15
  careerProgression: number; // 0-15
  communication: number;    // 0-10
}

export interface Candidate {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  fileName: string;
  rawText: string;
  score: number;
  confidence?: number;  // 0-1 confidence level
  recommendation: 'interview' | 'maybe' | 'pass';
  summary: string;
  scoreBreakdown?: ScoreBreakdown;  // Enterprise score breakdown
  matchedSkills: string[];
  missingSkills: string[];
  partialMatches?: string[];  // Skills with related but not exact match
  concerns: string[];
  strengths?: string[];  // Top candidate strengths
  interviewQuestions: string[];
  experience: number;
  skillMatchPercent?: number;
  educationMatch?: boolean | 'partial';
  processedAt: Date;
}

export interface ScreeningSession {
  id: string;
  jobId: string;
  candidates: Candidate[];
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  currentCandidate?: string;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface AppState {
  // Navigation
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;

  // Job Description
  currentJob: JobDescription | null;
  savedJobs: JobDescription[];
  setCurrentJob: (job: JobDescription | null) => void;
  addJob: (job: JobDescription) => void;
  removeJob: (id: string) => void;

  // Candidates & CVs
  uploadedCVs: File[];
  addCVs: (files: File[]) => void;
  removeCVs: (index: number) => void;
  clearCVs: () => void;

  // Screening
  currentSession: ScreeningSession | null;
  sessions: ScreeningSession[];
  startScreening: () => void;
  updateSession: (session: Partial<ScreeningSession>) => void;

  // Settings
  aiConfig: AIConfig;
  setAIConfig: (config: Partial<AIConfig>) => void;

  // UI
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export interface ScoreDistribution {
  range: string;
  count: number;
  color: string;
}

export interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  change?: number;
  color: 'cyan' | 'coral' | 'emerald' | 'amber' | 'violet';
}
