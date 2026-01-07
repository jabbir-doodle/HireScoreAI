import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Health Check & Version Endpoint
 * Use this to verify Vercel deployments are complete
 */

// Bump this version with each deployment
const API_VERSION = '2.3.0';

// Build timestamp (set at deployment time)
const BUILD_TIME = new Date().toISOString();

// Changelog for quick reference
const CHANGELOG = {
  '2.3.0': 'Fix PDF.js worker - use unpkg CDN for reliable parsing',
  '2.2.0': 'Fix all model IDs to use REAL OpenRouter IDs (no date suffixes)',
  '2.1.1': 'Fix MCF status field type handling',
  '2.1.0': 'MyCareersFuture API integration, enterprise security',
  '2.0.0': 'Enterprise URL fetcher with SSRF protection',
  '1.0.0': 'Initial release',
};

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  res.json({
    status: 'ok',
    version: API_VERSION,
    buildTime: BUILD_TIME,
    serverTime: new Date().toISOString(),
    features: {
      urlFetcher: 'v2.1 - MCF API, LinkedIn, Indeed, Glassdoor',
      screening: 'v1.0 - Military-grade HR analysis',
      pdfParsing: 'v1.0 - PDF.js + OCR fallback',
    },
    changelog: CHANGELOG[API_VERSION as keyof typeof CHANGELOG],
  });
}
