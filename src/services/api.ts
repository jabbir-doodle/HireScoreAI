/**
 * HireScore AI - API Service
 *
 * Communicates with the backend server for secure AI screening.
 * All AI requests go through our server, keeping API keys secure.
 */

import * as pdfjsLib from 'pdfjs-dist';

// PDF.js worker setup - MUST use a real worker for PDF.js 5.x to function
// Use unpkg CDN for exact npm version match (verified working)
// pdfjs-dist version: 5.4.530
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs';

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
  // 2026 Enterprise fields
  confidence?: number;
  confidenceReason?: string;
  scoreBreakdown?: {
    technicalSkills: number;
    experience: number;
    education: number;
    careerProgression: number;
    communication: number;
  };
  partialMatches?: string[];
  strengths?: string[];
  seniorityAssessment?: {
    detected: string;
    required: string;
    match: boolean | 'stretch';
    evidence?: string;
  };
  relevantExperienceYears?: number;
  skillMatchPercent?: number;
  educationMatch?: boolean | 'partial';
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

export interface CreditsInfo {
  used: number;
  limit: number | null;
  remaining: number | null;
  isUnlimited: boolean;
  isFreeTier: boolean;
  label: string;
}

export interface CreditsResponse {
  success: boolean;
  credits?: CreditsInfo;
  error?: string;
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
 * Get OpenRouter credits/usage information
 */
export async function getCredits(): Promise<CreditsResponse | null> {
  try {
    const response = await fetch(`${API_BASE}/api/credits`);
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to fetch credits' };
    }
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
 * Screen multiple candidates in batch (2026 Enterprise Edition)
 * - Uses Gemini 2.5 Flash-Lite for fastest processing
 * - Intelligent chunking (5 CVs per batch for reliability)
 * - Exponential backoff retry
 * - Real-time progress callback
 */
export async function screenBatch(
  jobDescription: string,
  candidates: BatchCandidate[],
  model?: string,
  onProgress?: (processed: number, total: number, status?: string) => void,
  options?: { fastMode?: boolean; concurrentBatches?: number }
): Promise<BatchResponse & { performance?: { totalMs: number; avgPerCvMs: number } }> {
  const BATCH_SIZE = 5; // Optimal for Vercel timeout limits
  const CONCURRENT_BATCHES = options?.concurrentBatches || 2; // Process 2 batches at a time
  const results: BatchResult[] = [];
  const startTime = Date.now();

  // Split into chunks
  const chunks: BatchCandidate[][] = [];
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    chunks.push(candidates.slice(i, i + BATCH_SIZE));
  }

  console.log(`[Batch] Processing ${candidates.length} CVs in ${chunks.length} batches (${BATCH_SIZE} per batch)`);

  // Process chunks with controlled concurrency
  for (let i = 0; i < chunks.length; i += CONCURRENT_BATCHES) {
    const concurrentChunks = chunks.slice(i, i + CONCURRENT_BATCHES);

    if (onProgress) {
      onProgress(results.length, candidates.length, `Processing batch ${i + 1}-${Math.min(i + CONCURRENT_BATCHES, chunks.length)} of ${chunks.length}...`);
    }

    const batchPromises = concurrentChunks.map(async (chunk) => {
      try {
        // Try batch endpoint with fastMode
        const response = await fetch(`${API_BASE}/api/screen-batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobDescription,
            candidates: chunk,
            model,
            fastMode: options?.fastMode ?? true, // Default to fast mode
          }),
        });

        if (response.ok) {
          const batchResult = await response.json();
          return batchResult.results as BatchResult[];
        }
      } catch (e) {
        console.log('[Batch] Batch endpoint failed, falling back to sequential');
      }

      // Fallback: Process sequentially with retry
      return await processSequentialWithRetry(jobDescription, chunk, model);
    });

    const batchResults = await Promise.all(batchPromises);
    for (const batchResult of batchResults) {
      results.push(...batchResult);
    }

    if (onProgress) {
      onProgress(results.length, candidates.length);
    }

    // Small delay between batch groups to avoid rate limiting
    if (i + CONCURRENT_BATCHES < chunks.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  const totalMs = Date.now() - startTime;
  const avgPerCvMs = Math.round(totalMs / candidates.length);

  console.log(`[Batch] Complete: ${results.filter(r => r.success).length}/${candidates.length} in ${totalMs}ms (avg ${avgPerCvMs}ms/CV)`);

  return {
    success: true,
    total: candidates.length,
    processed: results.filter(r => r.success).length,
    results,
    performance: { totalMs, avgPerCvMs }
  };
}

/**
 * Process candidates sequentially with retry (fallback)
 */
async function processSequentialWithRetry(
  jobDescription: string,
  candidates: BatchCandidate[],
  model?: string
): Promise<BatchResult[]> {
  const results: BatchResult[] = [];

  for (const candidate of candidates) {
    let lastError: string = '';
    let success = false;

    // Retry up to 2 times
    for (let attempt = 0; attempt < 3 && !success; attempt++) {
      try {
        const response = await fetch(`${API_BASE}/api/screen`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobDescription, cvContent: candidate.cvContent, model }),
        });

        if (response.ok) {
          const data = await response.json();
          results.push({ name: candidate.name, success: true, ...data.result });
          success = true;
        } else {
          const error = await response.json();
          lastError = error.error || 'Screening failed';
          if (attempt < 2) await new Promise(r => setTimeout(r, 300 * Math.pow(2, attempt)));
        }
      } catch (error) {
        lastError = (error as Error).message;
        if (attempt < 2) await new Promise(r => setTimeout(r, 300 * Math.pow(2, attempt)));
      }
    }

    if (!success) {
      results.push({
        name: candidate.name,
        success: false,
        error: lastError,
        score: 0,
        recommendation: 'pass' as const,
        summary: 'Error processing CV',
        matchedSkills: [],
        missingSkills: [],
        concerns: ['Processing error: ' + lastError],
        interviewQuestions: [],
        experienceYears: 0,
      });
    }
  }

  return results;
}

/**
 * Parse multiple PDFs in parallel using Promise.all
 * Faster than sequential parsing for bulk uploads
 */
export async function parseMultiplePdfs(
  files: File[],
  onProgress?: (completed: number, total: number) => void
): Promise<{ name: string; content: string; error?: string }[]> {
  const CONCURRENT = 4; // Parse 4 PDFs at a time
  const results: { name: string; content: string; error?: string }[] = [];

  for (let i = 0; i < files.length; i += CONCURRENT) {
    const chunk = files.slice(i, i + CONCURRENT);

    const chunkResults = await Promise.all(
      chunk.map(async (file) => {
        try {
          const content = await readFileAsText(file);
          return { name: file.name, content };
        } catch (error) {
          return { name: file.name, content: '', error: (error as Error).message };
        }
      })
    );

    results.push(...chunkResults);

    if (onProgress) {
      onProgress(results.length, files.length);
    }
  }

  return results;
}

/**
 * Parse PDF file using PDF.js (client-side - more reliable)
 * Uses unpkg CDN for the worker to ensure consistent behavior across environments
 */
export async function parsePdf(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const typedArray = new Uint8Array(arrayBuffer);

        console.log(`[PDF Parser] Starting PDF.js parsing, file size: ${typedArray.length} bytes`);
        console.log(`[PDF Parser] Worker source: ${pdfjsLib.GlobalWorkerOptions.workerSrc}`);

        // Verify we have valid PDF data (PDF magic bytes: %PDF)
        const header = String.fromCharCode(...typedArray.slice(0, 5));
        if (!header.startsWith('%PDF')) {
          console.warn('[PDF Parser] File does not have PDF magic bytes, may not be a valid PDF');
        }

        // Load PDF using PDF.js with enhanced options
        const loadingTask = pdfjsLib.getDocument({
          data: typedArray,
          useWorkerFetch: false,
          isEvalSupported: false,
          useSystemFonts: true,
        });

        // Add progress logging
        loadingTask.onProgress = (progress: { loaded: number; total: number }) => {
          if (progress.total > 0) {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            console.log(`[PDF Parser] Loading: ${percent}%`);
          }
        };

        const pdf = await loadingTask.promise;
        console.log(`[PDF Parser] PDF loaded successfully, pages: ${pdf.numPages}`);

        let fullText = '';
        let totalItems = 0;

        // Extract text from all pages
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageItems = textContent.items;
          totalItems += pageItems.length;

          // Improved text extraction with better spacing
          let lastY = 0;
          const pageText = pageItems
            .map((item) => {
              if ('str' in item && 'transform' in item) {
                const textItem = item as { str: string; transform: number[] };
                const currentY = textItem.transform[5];
                // Add newline if Y position changed significantly (new line)
                const prefix = lastY !== 0 && Math.abs(currentY - lastY) > 10 ? '\n' : ' ';
                lastY = currentY;
                return prefix + textItem.str;
              }
              if ('str' in item) {
                return ' ' + (item as { str: string }).str;
              }
              return '';
            })
            .join('');

          fullText += pageText + '\n\n';
          console.log(`[PDF Parser] Page ${i}: ${pageItems.length} items, ${pageText.length} chars`);
        }

        // Clean up the extracted text
        const cleanedText = fullText
          .replace(/\s+/g, ' ')  // Collapse multiple spaces
          .replace(/\n\s*\n/g, '\n\n')  // Normalize paragraph breaks
          .trim();

        console.log(`[PDF Parser] Total extracted: ${cleanedText.length} chars from ${totalItems} items`);

        // If we got meaningful text, return it
        if (cleanedText.length >= 50) {
          console.log(`[PDF Parser] SUCCESS - extracted ${cleanedText.length} characters`);
          resolve(cleanedText);
          return;
        }

        // PDF might be scanned/image-based - try server OCR as fallback
        console.log('[PDF Parser] Low text count, attempting server-side OCR...');
        try {
          const base64 = btoa(
            new Uint8Array(arrayBuffer).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              ''
            )
          );

          const response = await fetch(`${API_BASE}/api/parse-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64, useOcr: true }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`[PDF Parser] Server OCR returned: ${data.text?.length || 0} chars, method: ${data.method}`);
            if (data.text && data.text.length > cleanedText.length) {
              resolve(data.text);
              return;
            }
          } else {
            console.error('[PDF Parser] Server OCR failed:', response.status);
          }
        } catch (ocrError) {
          console.error('[PDF Parser] Server OCR error:', ocrError);
        }

        // Return whatever we have, even if empty
        console.log(`[PDF Parser] Returning ${cleanedText.length} chars (best available)`);
        resolve(cleanedText);
      } catch (error) {
        console.error('[PDF Parser] CRITICAL ERROR:', error);
        // Provide more context in error
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('[PDF Parser] Error details:', errorMessage);
        reject(new Error(`PDF parsing failed: ${errorMessage}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Validate if extracted content looks like actual CV/resume content
 * Returns { valid: boolean, reason?: string }
 */
export function validateExtractedContent(content: string, fileName: string): { valid: boolean; reason?: string; warning?: string } {
  const trimmed = content.trim();

  // Check for error messages that indicate parsing failed
  const errorPatterns = [
    /PDF parsing encountered/i,
    /Please paste content manually/i,
    /document parsing limited/i,
    /appears to be scanned/i,
    /parsing failed/i,
    /could not be extracted/i,
  ];

  for (const pattern of errorPatterns) {
    if (pattern.test(trimmed)) {
      return { valid: false, reason: `Document parsing failed for ${fileName}. Please paste the content manually.` };
    }
  }

  // Check minimum content length (a real CV should have at least 200 chars)
  if (trimmed.length < 200) {
    return { valid: false, reason: `Insufficient content extracted from ${fileName} (${trimmed.length} chars). Please paste the CV content manually.` };
  }

  // Check for CV-like content indicators
  const cvIndicators = [
    /experience|work|employment|job|position/i,
    /skill|technolog|proficient|expert/i,
    /education|degree|university|college|school/i,
    /email|phone|contact|address/i,
  ];

  const matchedIndicators = cvIndicators.filter(pattern => pattern.test(trimmed)).length;

  if (matchedIndicators < 2) {
    return {
      valid: true,
      warning: `Content from ${fileName} may not be a complete CV. Only ${matchedIndicators}/4 CV indicators found. Results may be inaccurate.`
    };
  }

  return { valid: true };
}

/**
 * Read file content as text (handles PDF, DOC, TXT)
 */
export async function readFileAsText(file: File): Promise<string> {
  const ext = file.name.toLowerCase().split('.').pop();

  // Handle PDF files
  if (file.type === 'application/pdf' || ext === 'pdf') {
    try {
      const text = await parsePdf(file);
      // Return whatever text we got, even if short
      if (text && text.trim().length > 0) {
        console.log(`PDF parsed: ${text.length} characters extracted from ${file.name}`);
        return text;
      }
      // If truly empty, return error indicator
      console.warn('PDF has no extractable text - likely scanned document');
      return `[PARSE_ERROR] Resume from ${file.name} - This PDF appears to be scanned or image-based. Please paste the CV content manually for accurate screening.`;
    } catch (error) {
      console.error('PDF parsing error:', error);
      return `[PARSE_ERROR] Resume from ${file.name} - PDF parsing failed. The document may be protected or corrupted. Please paste the content manually.`;
    }
  }

  // Handle Word documents using server-side mammoth for better extraction
  if (ext === 'doc' || ext === 'docx') {
    try {
      // Read file as ArrayBuffer for server-side processing
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
      });

      // Convert to base64 for server
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );

      // Try server-side parsing with mammoth
      const response = await fetch(`${API_BASE}/api/parse-docx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64 }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.text && data.text.length > 50) {
          console.log(`[DOCX] Server parsed: ${data.text.length} chars from ${file.name}`);
          return data.text;
        }
      }

      // Fallback: basic XML extraction for docx
      const textContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });

      const text = textContent
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (text.length > 100) {
        return text;
      }

      return `[PARSE_ERROR] Resume from ${file.name} - Word document parsing limited. Please paste content manually for accurate screening.`;
    } catch (error) {
      console.error('DOCX parsing error:', error);
      return `[PARSE_ERROR] Resume from ${file.name} - Document parsing failed. Please paste content manually.`;
    }
  }

  // Handle text files
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// ============================================
// Export API Object
// ============================================

export const api = {
  checkHealth,
  getConfig,
  getModels,
  getCredits,
  fetchUrl,
  screenCandidate,
  screenBatch,
  readFileAsText,
  parsePdf,
  parseMultiplePdfs,
  validateExtractedContent,
  baseUrl: API_BASE,
};

export default api;
