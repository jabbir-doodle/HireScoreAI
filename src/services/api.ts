/**
 * HireScore AI - API Service
 *
 * Communicates with the backend server for secure AI screening.
 * All AI requests go through our server, keeping API keys secure.
 */

// Use relative URLs in production (Vercel), absolute in development
const API_BASE = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001');

// ============================================
// Types
// ============================================

export interface AIModel {
  id: string;
  name: string;
  description?: string;
  contextLength?: number;
  pricing?: { prompt: string; completion: string };
  recommended?: boolean;
  category?: string;
}

export interface ModelsResponse {
  success: boolean;
  models: AIModel[];
  cached?: boolean;
}

export interface ConfigResponse {
  provider: string;
  models: AIModel[];
  features: {
    screening: boolean;
    batchProcessing: boolean;
    maxCVsPerBatch: number;
  };
}

export interface ScreeningResult {
  score: number;
  recommendation: 'interview' | 'maybe' | 'pass';
  summary: string;
  matchedSkills: string[];
  missingSkills: string[];
  concerns: string[];
  interviewQuestions: string[];
  experienceYears: number;
  rawResponse?: string;
}

export interface ScreenResponse {
  success: boolean;
  result: ScreeningResult;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface BatchCandidate {
  name: string;
  cvContent: string;
}

export interface BatchResult extends ScreeningResult {
  name: string;
  success: boolean;
  error?: string;
}

export interface BatchResponse {
  success: boolean;
  total: number;
  processed: number;
  results: BatchResult[];
}

// ============================================
// API Functions
// ============================================

/**
 * Check if the backend server is running and healthy
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get AI configuration (available models, features)
 */
export async function getConfig(): Promise<ConfigResponse | null> {
  try {
    const response = await fetch(`${API_BASE}/api/config`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Get all available AI models from OpenRouter
 */
export async function getModels(): Promise<ModelsResponse | null> {
  try {
    const response = await fetch(`${API_BASE}/api/models`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Fetch content from an external URL (server-side proxy to avoid CORS)
 */
export async function fetchUrl(url: string): Promise<{ success: boolean; content: string; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/api/fetch-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, content: '', error: error.error || 'Failed to fetch URL' };
    }

    const data = await response.json();
    return { success: true, content: data.content };
  } catch (error) {
    return { success: false, content: '', error: (error as Error).message };
  }
}

/**
 * Screen a single candidate
 */
export async function screenCandidate(
  jobDescription: string,
  cvContent: string,
  model?: string
): Promise<ScreenResponse> {
  const response = await fetch(`${API_BASE}/api/screen`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jobDescription,
      cvContent,
      model,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Screening failed');
  }

  return await response.json();
}

/**
 * Screen multiple candidates in batch
 */
export async function screenBatch(
  jobDescription: string,
  candidates: BatchCandidate[],
  model?: string,
  onProgress?: (processed: number, total: number) => void
): Promise<BatchResponse> {
  const response = await fetch(`${API_BASE}/api/screen/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jobDescription,
      candidates,
      model,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Batch screening failed');
  }

  const result = await response.json();

  // Report progress
  if (onProgress) {
    onProgress(result.processed, result.total);
  }

  return result;
}

/**
 * Read file content as text
 */
export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));

    if (file.type === 'application/pdf') {
      // For PDF files, we'd need a PDF parser
      // For now, return a placeholder
      resolve(`[PDF File: ${file.name}]\n\nPlease use a text-based CV format (TXT, DOC, DOCX) for best results.`);
    } else {
      reader.readAsText(file);
    }
  });
}

// ============================================
// Export API Object
// ============================================

export const api = {
  checkHealth,
  getConfig,
  getModels,
  fetchUrl,
  screenCandidate,
  screenBatch,
  readFileAsText,
  baseUrl: API_BASE,
};

export default api;
