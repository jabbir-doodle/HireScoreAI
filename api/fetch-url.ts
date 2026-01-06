import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Smart URL fetcher with site-specific parsing
 * Supports: LinkedIn, Indeed, Glassdoor, MyCareersFuture (SG), generic job boards
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Fetch the URL content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch URL: ${response.statusText}`
      });
    }

    const html = await response.text();
    const hostname = parsedUrl.hostname.toLowerCase();

    // Route to appropriate parser
    let content: string;
    let source: string;

    if (hostname.includes('linkedin.com')) {
      content = parseLinkedIn(html);
      source = 'linkedin';
    } else if (hostname.includes('indeed.com')) {
      content = parseIndeed(html);
      source = 'indeed';
    } else if (hostname.includes('glassdoor.com')) {
      content = parseGlassdoor(html);
      source = 'glassdoor';
    } else if (hostname.includes('mycareersfuture.gov.sg')) {
      content = parseMyCareersFuture(html);
      source = 'mycareersfuture';
    } else {
      content = parseGeneric(html);
      source = 'generic';
    }

    res.json({ success: true, content, source, url });
  } catch (error) {
    console.error('URL fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch URL' });
  }
}

/**
 * LinkedIn Job Parser
 * Extracts: Title, Company, Location, Description, Requirements
 */
function parseLinkedIn(html: string): string {
  const sections: string[] = [];

  // Extract job title (multiple patterns)
  const titleMatch = html.match(/<h1[^>]*class="[^"]*top-card-layout__title[^"]*"[^>]*>([^<]+)<\/h1>/i)
    || html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
    || html.match(/"title"\s*:\s*"([^"]+)"/);
  if (titleMatch) {
    sections.push(`JOB TITLE: ${cleanText(titleMatch[1])}`);
  }

  // Extract company name
  const companyMatch = html.match(/<a[^>]*class="[^"]*topcard__org-name-link[^"]*"[^>]*>([^<]+)<\/a>/i)
    || html.match(/<span[^>]*class="[^"]*company-name[^"]*"[^>]*>([^<]+)<\/span>/i)
    || html.match(/"companyName"\s*:\s*"([^"]+)"/)
    || html.match(/"hiringOrganization"[^}]*"name"\s*:\s*"([^"]+)"/);
  if (companyMatch) {
    sections.push(`COMPANY: ${cleanText(companyMatch[1])}`);
  }

  // Extract location
  const locationMatch = html.match(/<span[^>]*class="[^"]*topcard__flavor--bullet[^"]*"[^>]*>([^<]+)<\/span>/i)
    || html.match(/<span[^>]*class="[^"]*job-location[^"]*"[^>]*>([^<]+)<\/span>/i)
    || html.match(/"jobLocation"[^}]*"address"[^}]*"addressLocality"\s*:\s*"([^"]+)"/);
  if (locationMatch) {
    sections.push(`LOCATION: ${cleanText(locationMatch[1])}`);
  }

  // Extract job description (main content)
  const descMatch = html.match(/<div[^>]*class="[^"]*description__text[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    || html.match(/<div[^>]*class="[^"]*show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    || html.match(/<section[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/section>/i);

  if (descMatch) {
    const descHtml = descMatch[1];
    // Convert lists to readable format
    const description = descHtml
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<\/li>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<p[^>]*>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<h[1-6][^>]*>/gi, '\n\n')
      .replace(/<\/h[1-6]>/gi, '\n')
      .replace(/<strong[^>]*>/gi, '')
      .replace(/<\/strong>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    sections.push(`\nJOB DESCRIPTION:\n${description}`);
  }

  // Extract employment type, seniority, etc.
  const metaPatterns = [
    { pattern: /"employmentType"\s*:\s*"([^"]+)"/, label: 'Employment Type' },
    { pattern: /Seniority level[^<]*<[^>]*>([^<]+)/i, label: 'Seniority' },
    { pattern: /Employment type[^<]*<[^>]*>([^<]+)/i, label: 'Type' },
  ];

  const metadata: string[] = [];
  for (const { pattern, label } of metaPatterns) {
    const match = html.match(pattern);
    if (match) {
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

  const titleMatch = html.match(/<h1[^>]*class="[^"]*jobsearch-JobInfoHeader-title[^"]*"[^>]*>([^<]+)/i)
    || html.match(/"title"\s*:\s*"([^"]+)"/);
  if (titleMatch) sections.push(`JOB TITLE: ${cleanText(titleMatch[1])}`);

  const companyMatch = html.match(/<span[^>]*class="[^"]*companyName[^"]*"[^>]*>([^<]+)/i)
    || html.match(/"hiringOrganization"[^}]*"name"\s*:\s*"([^"]+)"/);
  if (companyMatch) sections.push(`COMPANY: ${cleanText(companyMatch[1])}`);

  const locationMatch = html.match(/<div[^>]*class="[^"]*companyLocation[^"]*"[^>]*>([^<]+)/i);
  if (locationMatch) sections.push(`LOCATION: ${cleanText(locationMatch[1])}`);

  const descMatch = html.match(/<div[^>]*id="jobDescriptionText"[^>]*>([\s\S]*?)<\/div>/i)
    || html.match(/<div[^>]*class="[^"]*jobsearch-jobDescriptionText[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (descMatch) {
    sections.push(`\nJOB DESCRIPTION:\n${htmlToText(descMatch[1])}`);
  }

  return sections.length > 1 ? sections.join('\n') : parseGeneric(html);
}

/**
 * Glassdoor Job Parser
 */
function parseGlassdoor(html: string): string {
  const sections: string[] = [];

  const titleMatch = html.match(/<h1[^>]*class="[^"]*job-title[^"]*"[^>]*>([^<]+)/i)
    || html.match(/"title"\s*:\s*"([^"]+)"/);
  if (titleMatch) sections.push(`JOB TITLE: ${cleanText(titleMatch[1])}`);

  const companyMatch = html.match(/<span[^>]*class="[^"]*employer-name[^"]*"[^>]*>([^<]+)/i);
  if (companyMatch) sections.push(`COMPANY: ${cleanText(companyMatch[1])}`);

  const descMatch = html.match(/<div[^>]*class="[^"]*jobDescriptionContent[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (descMatch) {
    sections.push(`\nJOB DESCRIPTION:\n${htmlToText(descMatch[1])}`);
  }

  return sections.length > 1 ? sections.join('\n') : parseGeneric(html);
}

/**
 * MyCareersFuture.gov.sg Job Parser (Singapore Government Job Portal)
 * Very popular in Singapore for job postings
 */
function parseMyCareersFuture(html: string): string {
  const sections: string[] = [];

  // Try JSON-LD first (MCF uses structured data)
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      const job = Array.isArray(data) ? data.find(d => d['@type'] === 'JobPosting') : data;
      if (job && job['@type'] === 'JobPosting') {
        if (job.title) sections.push(`JOB TITLE: ${cleanText(job.title)}`);
        if (job.hiringOrganization?.name) sections.push(`COMPANY: ${cleanText(job.hiringOrganization.name)}`);
        if (job.jobLocation?.address?.addressLocality) {
          sections.push(`LOCATION: ${cleanText(job.jobLocation.address.addressLocality)}`);
        } else {
          sections.push('LOCATION: Singapore');
        }
        if (job.employmentType) {
          sections.push(`EMPLOYMENT TYPE: ${cleanText(job.employmentType)}`);
        }
        if (job.description) {
          sections.push(`\nJOB DESCRIPTION:\n${htmlToText(job.description)}`);
        }
        if (sections.length > 1) return sections.join('\n');
      }
    } catch {
      // Continue to HTML parsing
    }
  }

  // Fallback: HTML parsing for MCF specific elements
  const titleMatch = html.match(/<h1[^>]*class="[^"]*job-title[^"]*"[^>]*>([^<]+)/i)
    || html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
    || html.match(/"title"\s*:\s*"([^"]+)"/);
  if (titleMatch) sections.push(`JOB TITLE: ${cleanText(titleMatch[1])}`);

  const companyMatch = html.match(/<span[^>]*class="[^"]*company-name[^"]*"[^>]*>([^<]+)/i)
    || html.match(/<a[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)/i)
    || html.match(/"hiringOrganization"[^}]*"name"\s*:\s*"([^"]+)"/);
  if (companyMatch) sections.push(`COMPANY: ${cleanText(companyMatch[1])}`);

  sections.push('LOCATION: Singapore');

  // MCF job description container
  const descMatch = html.match(/<div[^>]*class="[^"]*job-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    || html.match(/<section[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/section>/i)
    || html.match(/<div[^>]*id="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (descMatch) {
    sections.push(`\nJOB DESCRIPTION:\n${htmlToText(descMatch[1])}`);
  }

  // Extract requirements if separate
  const reqMatch = html.match(/<div[^>]*class="[^"]*requirements[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (reqMatch) {
    sections.push(`\nREQUIREMENTS:\n${htmlToText(reqMatch[1])}`);
  }

  return sections.length > 1 ? sections.join('\n') : parseGeneric(html);
}

/**
 * Generic HTML to Job Description Parser
 * Works for most job boards
 */
function parseGeneric(html: string): string {
  // Try to find JSON-LD structured data first (most reliable)
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      const job = Array.isArray(data) ? data.find(d => d['@type'] === 'JobPosting') : data;
      if (job && job['@type'] === 'JobPosting') {
        const parts: string[] = [];
        if (job.title) parts.push(`JOB TITLE: ${job.title}`);
        if (job.hiringOrganization?.name) parts.push(`COMPANY: ${job.hiringOrganization.name}`);
        if (job.jobLocation?.address?.addressLocality) {
          parts.push(`LOCATION: ${job.jobLocation.address.addressLocality}`);
        }
        if (job.description) {
          parts.push(`\nJOB DESCRIPTION:\n${htmlToText(job.description)}`);
        }
        if (parts.length > 1) return parts.join('\n');
      }
    } catch {
      // JSON parse failed, continue to HTML parsing
    }
  }

  // Fallback: Clean HTML extraction
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .substring(0, 10000); // Limit length
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
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Clean text helper
 */
function cleanText(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
