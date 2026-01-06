import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Enterprise-Grade URL Fetcher for Job Descriptions
 *
 * Security Features:
 * - SSRF protection (blocks internal IPs, localhost, metadata endpoints)
 * - Protocol whitelist (HTTP/HTTPS only)
 * - Request timeout (8 seconds)
 * - Response size limit (5MB max)
 * - Content-Type validation
 * - Input sanitization
 *
 * Supported Sites:
 * - LinkedIn, Indeed, Glassdoor, MyCareersFuture (SG), Generic job boards
 */

// ============================================
// Security Configuration
// ============================================

const SECURITY_CONFIG = {
  // Maximum response size (5MB)
  MAX_RESPONSE_SIZE: 5 * 1024 * 1024,

  // Request timeout (8 seconds - Vercel has 10s limit)
  FETCH_TIMEOUT_MS: 8000,

  // Allowed protocols
  ALLOWED_PROTOCOLS: ['http:', 'https:'],

  // Blocked hostnames (SSRF protection)
  BLOCKED_HOSTNAMES: [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '[::1]',
    'metadata.google.internal',
    'metadata.goog',
  ],

  // Blocked IP ranges (SSRF protection)
  BLOCKED_IP_PATTERNS: [
    /^10\./,                    // 10.0.0.0/8 (Private)
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.0.0/12 (Private)
    /^192\.168\./,              // 192.168.0.0/16 (Private)
    /^169\.254\./,              // 169.254.0.0/16 (Link-local, AWS metadata)
    /^100\.(6[4-9]|[7-9][0-9]|1[0-2][0-9])\./,  // 100.64.0.0/10 (Carrier NAT)
    /^198\.18\./,               // 198.18.0.0/15 (Benchmark)
    /^fc00:/i,                  // IPv6 ULA
    /^fe80:/i,                  // IPv6 Link-local
  ],

  // Minimum content length to be considered valid
  MIN_CONTENT_LENGTH: 100,

  // Maximum output length
  MAX_OUTPUT_LENGTH: 15000,
};

// ============================================
// Main Handler
// ============================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  const origin = req.headers.origin || '*';

  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowed: ['POST']
    });
  }

  try {
    const { url } = req.body;

    // ========================================
    // Input Validation
    // ========================================

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'URL is required and must be a string'
      });
    }

    // Trim and validate length
    const trimmedUrl = url.trim();
    if (trimmedUrl.length > 2048) {
      return res.status(400).json({
        success: false,
        error: 'URL exceeds maximum length (2048 characters)'
      });
    }

    // ========================================
    // URL Parsing & Security Checks
    // ========================================

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }

    // Protocol whitelist check
    if (!SECURITY_CONFIG.ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
      return res.status(400).json({
        success: false,
        error: `Protocol not allowed. Use HTTP or HTTPS.`,
        provided: parsedUrl.protocol
      });
    }

    // SSRF Protection: Check hostname
    const hostname = parsedUrl.hostname.toLowerCase();

    if (SECURITY_CONFIG.BLOCKED_HOSTNAMES.includes(hostname)) {
      console.warn(`[SECURITY] Blocked hostname attempt: ${hostname}`);
      return res.status(400).json({
        success: false,
        error: 'This URL cannot be accessed for security reasons'
      });
    }

    // SSRF Protection: Check IP patterns
    for (const pattern of SECURITY_CONFIG.BLOCKED_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        console.warn(`[SECURITY] Blocked IP pattern attempt: ${hostname}`);
        return res.status(400).json({
          success: false,
          error: 'Internal network URLs are not allowed'
        });
      }
    }

    // Additional check for numeric IPs that might bypass patterns
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      const octets = hostname.split('.').map(Number);
      if (octets[0] === 0 || octets[0] === 127) {
        console.warn(`[SECURITY] Blocked loopback IP: ${hostname}`);
        return res.status(400).json({
          success: false,
          error: 'Loopback addresses are not allowed'
        });
      }
    }

    // ========================================
    // Special Handlers for SPA Sites (API-based)
    // ========================================

    // MyCareersFuture.gov.sg - React SPA, use their public API
    if (hostname.includes('mycareersfuture.gov.sg')) {
      const mcfResult = await fetchMyCareersFutureAPI(trimmedUrl);
      if (mcfResult.success) {
        return res.json({
          success: true,
          content: mcfResult.content,
          source: 'mycareersfuture',
          parseMethod: 'mcf-api',
          url: trimmedUrl,
          contentLength: mcfResult.content.length
        });
      } else {
        return res.status(422).json({
          success: false,
          error: mcfResult.error || 'Could not fetch job from MyCareersFuture',
          hint: 'The job posting may have been removed or expired.',
          source: 'mycareersfuture'
        });
      }
    }

    // ========================================
    // Fetch with Timeout
    // ========================================

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SECURITY_CONFIG.FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(trimmedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        redirect: 'follow',
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if ((fetchError as Error).name === 'AbortError') {
        return res.status(408).json({
          success: false,
          error: 'Request timeout - the website took too long to respond',
          timeout: `${SECURITY_CONFIG.FETCH_TIMEOUT_MS}ms`
        });
      }

      console.error('[FETCH] Network error:', (fetchError as Error).message);
      return res.status(502).json({
        success: false,
        error: 'Failed to connect to the URL',
        details: (fetchError as Error).message
      });
    }

    clearTimeout(timeoutId);

    // ========================================
    // Response Validation
    // ========================================

    if (!response.ok) {
      // Check for common auth walls
      if (response.status === 401 || response.status === 403) {
        return res.status(403).json({
          success: false,
          error: 'This job posting requires authentication to view',
          hint: 'Please copy and paste the job description manually'
        });
      }

      if (response.status === 404) {
        return res.status(404).json({
          success: false,
          error: 'Job posting not found - it may have been removed or expired'
        });
      }

      return res.status(response.status).json({
        success: false,
        error: `Failed to fetch URL: ${response.statusText}`,
        status: response.status
      });
    }

    // Content-Type validation
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      // Allow JSON for API responses (some sites serve JSON)
      if (!contentType.includes('application/json')) {
        return res.status(400).json({
          success: false,
          error: 'URL did not return an HTML page',
          contentType: contentType.split(';')[0]
        });
      }
    }

    // Content-Length check (if available)
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > SECURITY_CONFIG.MAX_RESPONSE_SIZE) {
      return res.status(413).json({
        success: false,
        error: 'Response too large',
        maxSize: `${SECURITY_CONFIG.MAX_RESPONSE_SIZE / 1024 / 1024}MB`
      });
    }

    // ========================================
    // Read Response Body (with size limit)
    // ========================================

    let html: string;
    try {
      // Read with size limit
      const reader = response.body?.getReader();
      if (!reader) {
        return res.status(500).json({ success: false, error: 'Failed to read response' });
      }

      const chunks: Uint8Array[] = [];
      let totalSize = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        totalSize += value.length;
        if (totalSize > SECURITY_CONFIG.MAX_RESPONSE_SIZE) {
          reader.cancel();
          return res.status(413).json({
            success: false,
            error: 'Response too large - exceeded size limit while reading'
          });
        }

        chunks.push(value);
      }

      // Combine chunks and decode
      const combined = new Uint8Array(totalSize);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      html = new TextDecoder('utf-8').decode(combined);
    } catch (readError) {
      console.error('[READ] Error reading response:', readError);
      return res.status(500).json({
        success: false,
        error: 'Failed to read page content'
      });
    }

    // ========================================
    // Check for Auth Walls / Login Pages
    // ========================================

    const authWallIndicators = [
      'sign in to view',
      'log in to continue',
      'login required',
      'please sign in',
      'authentication required',
      'authwall',
      'login-form',
      'signin-form',
    ];

    const lowerHtml = html.toLowerCase();
    const hasAuthWall = authWallIndicators.some(indicator => lowerHtml.includes(indicator));

    // Check if it's likely a login page (has login but no job content)
    if (hasAuthWall && !lowerHtml.includes('job description') && !lowerHtml.includes('requirements')) {
      return res.status(403).json({
        success: false,
        error: 'This job posting is behind a login wall',
        hint: 'Please sign in on the website and copy the job description manually'
      });
    }

    // ========================================
    // Parse Content
    // ========================================

    let content: string;
    let source: string;
    let parseMethod: string;

    if (hostname.includes('linkedin.com')) {
      content = parseLinkedIn(html);
      source = 'linkedin';
      parseMethod = 'linkedin-parser';
    } else if (hostname.includes('indeed.com') || hostname.includes('indeed.')) {
      content = parseIndeed(html);
      source = 'indeed';
      parseMethod = 'indeed-parser';
    } else if (hostname.includes('glassdoor.com') || hostname.includes('glassdoor.')) {
      content = parseGlassdoor(html);
      source = 'glassdoor';
      parseMethod = 'glassdoor-parser';
    } else if (hostname.includes('mycareersfuture.gov.sg')) {
      content = parseMyCareersFuture(html);
      source = 'mycareersfuture';
      parseMethod = 'mcf-parser';
    } else {
      content = parseGeneric(html);
      source = 'generic';
      parseMethod = 'generic-parser';
    }

    // ========================================
    // Validate Output
    // ========================================

    if (!content || content.length < SECURITY_CONFIG.MIN_CONTENT_LENGTH) {
      // Try generic parser as fallback
      if (parseMethod !== 'generic-parser') {
        content = parseGeneric(html);
        parseMethod = 'generic-parser-fallback';
      }

      // Still no content?
      if (!content || content.length < SECURITY_CONFIG.MIN_CONTENT_LENGTH) {
        return res.status(422).json({
          success: false,
          error: 'Could not extract job description from this URL',
          hint: 'The page may be dynamically loaded. Please copy and paste the job description manually.',
          source,
          contentLength: content?.length || 0
        });
      }
    }

    // Trim to max length
    if (content.length > SECURITY_CONFIG.MAX_OUTPUT_LENGTH) {
      content = content.substring(0, SECURITY_CONFIG.MAX_OUTPUT_LENGTH) + '\n\n[Content truncated...]';
    }

    // ========================================
    // Success Response
    // ========================================

    res.json({
      success: true,
      content,
      source,
      parseMethod,
      url: trimmedUrl,
      contentLength: content.length
    });

  } catch (error) {
    console.error('[HANDLER] Unexpected error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while processing URL',
      requestId: Date.now().toString(36)
    });
  }
}

// ============================================
// Site-Specific Parsers
// ============================================

/**
 * LinkedIn Job Parser
 * Extracts: Title, Company, Location, Description, Requirements
 */
function parseLinkedIn(html: string): string {
  const sections: string[] = [];

  // Try JSON-LD first (most reliable for LinkedIn)
  const jsonContent = extractJsonLd(html);
  if (jsonContent) {
    return jsonContent;
  }

  // Extract job title (multiple patterns)
  const titleMatch = html.match(/<h1[^>]*class="[^"]*top-card-layout__title[^"]*"[^>]*>([^<]+)<\/h1>/i)
    || html.match(/<h1[^>]*class="[^"]*jobs-unified-top-card__job-title[^"]*"[^>]*>([^<]+)/i)
    || html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
    || html.match(/"title"\s*:\s*"([^"]+)"/);
  if (titleMatch?.[1]) {
    sections.push(`JOB TITLE: ${cleanText(titleMatch[1])}`);
  }

  // Extract company name
  const companyMatch = html.match(/<a[^>]*class="[^"]*topcard__org-name-link[^"]*"[^>]*>([^<]+)<\/a>/i)
    || html.match(/<span[^>]*class="[^"]*company-name[^"]*"[^>]*>([^<]+)<\/span>/i)
    || html.match(/<a[^>]*class="[^"]*jobs-unified-top-card__company-name[^"]*"[^>]*>([^<]+)/i)
    || html.match(/"companyName"\s*:\s*"([^"]+)"/)
    || html.match(/"hiringOrganization"[^}]*"name"\s*:\s*"([^"]+)"/);
  if (companyMatch?.[1]) {
    sections.push(`COMPANY: ${cleanText(companyMatch[1])}`);
  }

  // Extract location
  const locationMatch = html.match(/<span[^>]*class="[^"]*topcard__flavor--bullet[^"]*"[^>]*>([^<]+)<\/span>/i)
    || html.match(/<span[^>]*class="[^"]*job-location[^"]*"[^>]*>([^<]+)<\/span>/i)
    || html.match(/<span[^>]*class="[^"]*jobs-unified-top-card__bullet[^"]*"[^>]*>([^<]+)/i)
    || html.match(/"jobLocation"[^}]*"address"[^}]*"addressLocality"\s*:\s*"([^"]+)"/);
  if (locationMatch?.[1]) {
    sections.push(`LOCATION: ${cleanText(locationMatch[1])}`);
  }

  // Extract job description (main content)
  const descMatch = html.match(/<div[^>]*class="[^"]*description__text[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    || html.match(/<div[^>]*class="[^"]*show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    || html.match(/<section[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/section>/i)
    || html.match(/<div[^>]*class="[^"]*jobs-description__content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

  if (descMatch?.[1]) {
    const description = htmlToText(descMatch[1]);
    if (description.length > 50) {
      sections.push(`\nJOB DESCRIPTION:\n${description}`);
    }
  }

  // Extract employment type, seniority, etc.
  const metaPatterns = [
    { pattern: /"employmentType"\s*:\s*"([^"]+)"/, label: 'Employment Type' },
    { pattern: /Seniority level[^<]*<[^>]*>([^<]+)/i, label: 'Seniority' },
    { pattern: /Employment type[^<]*<[^>]*>([^<]+)/i, label: 'Type' },
    { pattern: /Job function[^<]*<[^>]*>([^<]+)/i, label: 'Function' },
  ];

  const metadata: string[] = [];
  for (const { pattern, label } of metaPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      metadata.push(`${label}: ${cleanText(match[1])}`);
    }
  }
  if (metadata.length > 0) {
    sections.push(`\nDETAILS: ${metadata.join(' | ')}`);
  }

  // If we got meaningful content, return it
  if (sections.length > 1) {
    return sections.join('\n');
  }

  // Fallback to generic parsing
  return parseGeneric(html);
}

/**
 * Indeed Job Parser
 */
function parseIndeed(html: string): string {
  const sections: string[] = [];

  // Try JSON-LD first
  const jsonContent = extractJsonLd(html);
  if (jsonContent) {
    return jsonContent;
  }

  const titleMatch = html.match(/<h1[^>]*class="[^"]*jobsearch-JobInfoHeader-title[^"]*"[^>]*>([^<]+)/i)
    || html.match(/<h1[^>]*data-testid="[^"]*jobTitle[^"]*"[^>]*>([^<]+)/i)
    || html.match(/"title"\s*:\s*"([^"]+)"/);
  if (titleMatch?.[1]) sections.push(`JOB TITLE: ${cleanText(titleMatch[1])}`);

  const companyMatch = html.match(/<span[^>]*class="[^"]*companyName[^"]*"[^>]*>([^<]+)/i)
    || html.match(/<div[^>]*data-testid="[^"]*companyName[^"]*"[^>]*>([^<]+)/i)
    || html.match(/"hiringOrganization"[^}]*"name"\s*:\s*"([^"]+)"/);
  if (companyMatch?.[1]) sections.push(`COMPANY: ${cleanText(companyMatch[1])}`);

  const locationMatch = html.match(/<div[^>]*class="[^"]*companyLocation[^"]*"[^>]*>([^<]+)/i)
    || html.match(/<div[^>]*data-testid="[^"]*location[^"]*"[^>]*>([^<]+)/i);
  if (locationMatch?.[1]) sections.push(`LOCATION: ${cleanText(locationMatch[1])}`);

  const descMatch = html.match(/<div[^>]*id="jobDescriptionText"[^>]*>([\s\S]*?)<\/div>/i)
    || html.match(/<div[^>]*class="[^"]*jobsearch-jobDescriptionText[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    || html.match(/<div[^>]*class="[^"]*jobsearch-JobComponent-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (descMatch?.[1]) {
    sections.push(`\nJOB DESCRIPTION:\n${htmlToText(descMatch[1])}`);
  }

  return sections.length > 1 ? sections.join('\n') : parseGeneric(html);
}

/**
 * Glassdoor Job Parser
 */
function parseGlassdoor(html: string): string {
  const sections: string[] = [];

  // Try JSON-LD first
  const jsonContent = extractJsonLd(html);
  if (jsonContent) {
    return jsonContent;
  }

  const titleMatch = html.match(/<h1[^>]*class="[^"]*job-title[^"]*"[^>]*>([^<]+)/i)
    || html.match(/<div[^>]*data-test="[^"]*jobTitle[^"]*"[^>]*>([^<]+)/i)
    || html.match(/"title"\s*:\s*"([^"]+)"/);
  if (titleMatch?.[1]) sections.push(`JOB TITLE: ${cleanText(titleMatch[1])}`);

  const companyMatch = html.match(/<span[^>]*class="[^"]*employer-name[^"]*"[^>]*>([^<]+)/i)
    || html.match(/<div[^>]*data-test="[^"]*employerName[^"]*"[^>]*>([^<]+)/i);
  if (companyMatch?.[1]) sections.push(`COMPANY: ${cleanText(companyMatch[1])}`);

  const locationMatch = html.match(/<span[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)/i);
  if (locationMatch?.[1]) sections.push(`LOCATION: ${cleanText(locationMatch[1])}`);

  const descMatch = html.match(/<div[^>]*class="[^"]*jobDescriptionContent[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    || html.match(/<div[^>]*class="[^"]*desc[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (descMatch?.[1]) {
    sections.push(`\nJOB DESCRIPTION:\n${htmlToText(descMatch[1])}`);
  }

  return sections.length > 1 ? sections.join('\n') : parseGeneric(html);
}

/**
 * MyCareersFuture.gov.sg Job Parser (Singapore Government Job Portal)
 */
function parseMyCareersFuture(html: string): string {
  const sections: string[] = [];

  // Try JSON-LD first (MCF uses structured data)
  const jsonContent = extractJsonLd(html);
  if (jsonContent) {
    // MCF always adds Singapore location
    if (!jsonContent.includes('LOCATION:')) {
      return jsonContent.replace('\nJOB DESCRIPTION:', '\nLOCATION: Singapore\n\nJOB DESCRIPTION:');
    }
    return jsonContent;
  }

  // Fallback: HTML parsing for MCF specific elements
  const titleMatch = html.match(/<h1[^>]*class="[^"]*job-title[^"]*"[^>]*>([^<]+)/i)
    || html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
    || html.match(/"title"\s*:\s*"([^"]+)"/);
  if (titleMatch?.[1]) sections.push(`JOB TITLE: ${cleanText(titleMatch[1])}`);

  const companyMatch = html.match(/<span[^>]*class="[^"]*company-name[^"]*"[^>]*>([^<]+)/i)
    || html.match(/<a[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)/i)
    || html.match(/"hiringOrganization"[^}]*"name"\s*:\s*"([^"]+)"/);
  if (companyMatch?.[1]) sections.push(`COMPANY: ${cleanText(companyMatch[1])}`);

  sections.push('LOCATION: Singapore');

  // MCF job description container
  const descMatch = html.match(/<div[^>]*class="[^"]*job-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    || html.match(/<section[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/section>/i)
    || html.match(/<div[^>]*id="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (descMatch?.[1]) {
    sections.push(`\nJOB DESCRIPTION:\n${htmlToText(descMatch[1])}`);
  }

  // Extract requirements if separate
  const reqMatch = html.match(/<div[^>]*class="[^"]*requirements[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (reqMatch?.[1]) {
    sections.push(`\nREQUIREMENTS:\n${htmlToText(reqMatch[1])}`);
  }

  return sections.length > 1 ? sections.join('\n') : parseGeneric(html);
}

/**
 * Generic HTML to Job Description Parser
 * Works for most job boards using JSON-LD or clean HTML extraction
 */
function parseGeneric(html: string): string {
  // Try JSON-LD first (most reliable)
  const jsonContent = extractJsonLd(html);
  if (jsonContent) {
    return jsonContent;
  }

  // Fallback: Clean HTML extraction
  // Remove unwanted sections first
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Convert to readable text
  cleaned = cleaned
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<h[1-6][^>]*>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, ' ')  // Remove other HTML entities
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleaned.substring(0, SECURITY_CONFIG.MAX_OUTPUT_LENGTH);
}

// ============================================
// SPA Site API Handlers
// ============================================

/**
 * MyCareersFuture.gov.sg API Handler
 * MCF is a React SPA - we use their public API directly
 * API: https://api.mycareersfuture.gov.sg/v2/jobs/{jobId}
 */
async function fetchMyCareersFutureAPI(url: string): Promise<{ success: boolean; content: string; error?: string }> {
  try {
    // Extract job ID from URL
    // URL format: /job/{category}/{slug}-{jobId}
    // Example: /job/design/senior-software-qa-engineer-doodle-labs-155f2182e6b7484759d653f9cb3e9773
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1];

    // Job ID is the last segment (UUID format: 32 hex chars)
    const jobIdMatch = lastPart.match(/([a-f0-9]{32})$/i);
    if (!jobIdMatch) {
      return { success: false, content: '', error: 'Could not extract job ID from URL' };
    }

    const jobId = jobIdMatch[1];
    const apiUrl = `https://api.mycareersfuture.gov.sg/v2/jobs/${jobId}`;

    console.log(`[MCF] Fetching job from API: ${apiUrl}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SECURITY_CONFIG.FETCH_TIMEOUT_MS);

    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, content: '', error: 'Job posting not found - it may have been removed or expired' };
      }
      return { success: false, content: '', error: `MCF API returned ${response.status}` };
    }

    const data = await response.json();

    // Format the MCF job data
    const content = formatMCFJob(data);

    if (!content || content.length < 100) {
      return { success: false, content: '', error: 'Job data was empty or incomplete' };
    }

    return { success: true, content };
  } catch (error) {
    console.error('[MCF] API error:', error);
    if ((error as Error).name === 'AbortError') {
      return { success: false, content: '', error: 'Request timeout - MCF API took too long' };
    }
    return { success: false, content: '', error: (error as Error).message };
  }
}

/**
 * Format MyCareersFuture job data into readable text
 */
function formatMCFJob(data: Record<string, unknown>): string {
  const sections: string[] = [];

  // Job Title
  if (data.title) {
    sections.push(`JOB TITLE: ${String(data.title)}`);
  }

  // Company
  const company = data.postedCompany as Record<string, unknown> | undefined;
  if (company?.name) {
    sections.push(`COMPANY: ${String(company.name)}`);
  }

  // Location
  const address = data.address as Record<string, unknown> | undefined;
  if (address) {
    const locationParts: string[] = [];
    if (address.streetAddress) locationParts.push(String(address.streetAddress));
    if (address.postalCode) locationParts.push(`Singapore ${address.postalCode}`);
    if (address.district) locationParts.push(`(${String(address.district)})`);
    if (locationParts.length > 0) {
      sections.push(`LOCATION: ${locationParts.join(', ')}`);
    } else {
      sections.push('LOCATION: Singapore');
    }
  } else {
    sections.push('LOCATION: Singapore');
  }

  // Employment Type
  const employmentTypes = data.employmentTypes as string[] | undefined;
  const positionLevels = data.positionLevels as string[] | undefined;
  const metadata: string[] = [];

  if (employmentTypes?.length) {
    metadata.push(`Type: ${employmentTypes.join(', ')}`);
  }
  if (positionLevels?.length) {
    metadata.push(`Level: ${positionLevels.join(', ')}`);
  }
  if (metadata.length > 0) {
    sections.push(`EMPLOYMENT: ${metadata.join(' | ')}`);
  }

  // Salary
  const salary = data.salary as Record<string, unknown> | undefined;
  if (salary) {
    const min = salary.minimum as Record<string, unknown> | undefined;
    const max = salary.maximum as Record<string, unknown> | undefined;
    const type = salary.type as Record<string, unknown> | undefined;

    if (min?.amount || max?.amount) {
      const minAmt = min?.amount ? `$${Number(min.amount).toLocaleString()}` : '';
      const maxAmt = max?.amount ? `$${Number(max.amount).toLocaleString()}` : '';
      const period = type?.salaryType ? ` ${String(type.salaryType).toLowerCase()}` : '';
      const salaryStr = minAmt && maxAmt ? `${minAmt} - ${maxAmt}${period}` : `${minAmt || maxAmt}${period}`;
      sections.push(`SALARY: ${salaryStr}`);
    }
  }

  // Description
  if (data.description) {
    const desc = htmlToText(String(data.description));
    if (desc.length > 50) {
      sections.push(`\nJOB DESCRIPTION:\n${desc}`);
    }
  }

  // Requirements
  const requirements = data.minimumYearsExperience as number | undefined;
  const skills = data.skills as Array<{ skill: string }> | undefined;

  if (requirements || skills?.length) {
    const reqParts: string[] = [];

    if (requirements && requirements > 0) {
      reqParts.push(`• Minimum ${requirements} years of experience required`);
    }

    if (skills?.length) {
      const skillNames = skills.map(s => s.skill || s).filter(Boolean);
      if (skillNames.length > 0) {
        reqParts.push(`• Skills: ${skillNames.join(', ')}`);
      }
    }

    if (reqParts.length > 0) {
      sections.push(`\nREQUIREMENTS:\n${reqParts.join('\n')}`);
    }
  }

  // Job Status
  const status = data.status as string | undefined;
  if (status && status.toLowerCase() !== 'open') {
    sections.push(`\nSTATUS: ${status} (This job may no longer be accepting applications)`);
  }

  return sections.join('\n');
}

// ============================================
// Helper Functions
// ============================================

/**
 * Extract job posting from JSON-LD structured data
 * This is the most reliable method as it's a standard format
 */
function extractJsonLd(html: string): string | null {
  const jsonLdMatches = html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);

  for (const match of jsonLdMatches) {
    try {
      const jsonStr = match[1].trim();
      const data = JSON.parse(jsonStr);

      // Handle array of items or single item
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        // Look for JobPosting type
        if (item['@type'] === 'JobPosting') {
          return formatJobPosting(item);
        }

        // Check @graph for nested items
        if (item['@graph'] && Array.isArray(item['@graph'])) {
          for (const graphItem of item['@graph']) {
            if (graphItem['@type'] === 'JobPosting') {
              return formatJobPosting(graphItem);
            }
          }
        }
      }
    } catch {
      // JSON parse failed, try next match
      continue;
    }
  }

  return null;
}

/**
 * Format a JSON-LD JobPosting into readable text
 */
function formatJobPosting(job: Record<string, unknown>): string {
  const parts: string[] = [];

  if (job.title) {
    parts.push(`JOB TITLE: ${cleanText(String(job.title))}`);
  }

  // Handle various company name formats
  const hiringOrg = job.hiringOrganization as Record<string, unknown> | undefined;
  if (hiringOrg?.name) {
    parts.push(`COMPANY: ${cleanText(String(hiringOrg.name))}`);
  }

  // Handle various location formats
  const jobLocation = job.jobLocation as Record<string, unknown> | Record<string, unknown>[] | undefined;
  if (jobLocation) {
    const location = Array.isArray(jobLocation) ? jobLocation[0] : jobLocation;
    const address = location?.address as Record<string, unknown> | undefined;
    if (address) {
      const locationParts: string[] = [];
      if (address.addressLocality) locationParts.push(String(address.addressLocality));
      if (address.addressRegion) locationParts.push(String(address.addressRegion));
      if (address.addressCountry) {
        const country = address.addressCountry;
        if (typeof country === 'object' && country !== null && 'name' in country) {
          locationParts.push(String((country as Record<string, unknown>).name));
        } else if (typeof country === 'string') {
          locationParts.push(country);
        }
      }
      if (locationParts.length > 0) {
        parts.push(`LOCATION: ${locationParts.join(', ')}`);
      }
    }
  }

  // Employment type
  if (job.employmentType) {
    const empType = Array.isArray(job.employmentType)
      ? job.employmentType.join(', ')
      : String(job.employmentType);
    parts.push(`EMPLOYMENT TYPE: ${cleanText(empType)}`);
  }

  // Salary (if available)
  const baseSalary = job.baseSalary as Record<string, unknown> | undefined;
  if (baseSalary?.value) {
    const value = baseSalary.value as Record<string, unknown> | undefined;
    if (value?.minValue || value?.maxValue) {
      const currency = String(baseSalary.currency || '');
      const min = value.minValue ? `${currency}${value.minValue}` : '';
      const max = value.maxValue ? `${currency}${value.maxValue}` : '';
      const salary = min && max ? `${min} - ${max}` : min || max;
      if (salary) parts.push(`SALARY: ${salary}`);
    }
  }

  // Description
  if (job.description) {
    const description = htmlToText(String(job.description));
    if (description.length > 50) {
      parts.push(`\nJOB DESCRIPTION:\n${description}`);
    }
  }

  // Qualifications / Requirements
  if (job.qualifications || job.skills || job.experienceRequirements) {
    const quals: string[] = [];
    if (job.qualifications) quals.push(String(job.qualifications));
    if (job.skills) quals.push(String(job.skills));
    if (job.experienceRequirements) quals.push(String(job.experienceRequirements));
    if (quals.length > 0) {
      parts.push(`\nREQUIREMENTS:\n${htmlToText(quals.join('\n'))}`);
    }
  }

  return parts.length > 1 ? parts.join('\n') : '';
}

/**
 * Convert HTML to readable text
 */
function htmlToText(html: string): string {
  return html
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<h[1-6][^>]*>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<strong[^>]*>/gi, '')
    .replace(/<\/strong>/gi, '')
    .replace(/<em[^>]*>/gi, '')
    .replace(/<\/em>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Clean and normalize text
 */
function cleanText(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
