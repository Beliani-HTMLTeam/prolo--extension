// services/verifyService.ts
import axios from 'axios';
import { SHOP_ID_MAP } from '../lib/shopConfig';
import pLimit from 'p-limit';

const limit = pLimit(5);

interface VerificationResult {
  slug: string;
  nsltId: string;
  lpId: string;
  spreadsheetSubject: string | null;
  spreadsheetPageTitle: string | null;
  actualSubject: string | null;
  actualPageTitle: string | null;
  subjectNeedsUpdate: boolean;
  pageTitleNeedsUpdate: boolean;
  error?: string;
}

const getLanguageForSlug = (slug: string): string => {
   const langMap: Record<string, string> = {
    'CHFR': 'french',
    'CHDE': 'german',
    'BEFR': 'french',
    'BENL': 'dutch',
    'FR': 'french',
    'DE': 'german',
    'AT': 'germanDE',
    'NL': 'dutch',
    'ES': 'spanish',
    'PT': 'portugal',
    'IT': 'italian',
    'DK': 'danish',
    'NO': 'norsk',
    'FI': 'finnish',
    'SE': 'swedish',
    'CZ': 'czech',
    'SK': 'slovak',
    'HU': 'Hungarian',
    'PL': 'polish',
    'RO': 'romanian',
    'UK': 'english',
  };

  return langMap[slug] || 'german'
}

const fetchAndVerifyContent = async (
  nsltId: string,
  lpId: string,
  spreadsheetSubject: string | null,
  spreadsheetPageTitle: string | null,
  slug: string
): Promise<VerificationResult> => {
  const result: VerificationResult = {
    slug,
    nsltId,
    lpId,
    spreadsheetSubject,
    spreadsheetPageTitle,
    actualSubject: null,
    actualPageTitle: null,
    subjectNeedsUpdate: false,
    pageTitleNeedsUpdate: false,
  };

  try {
    // Fetch newsletter page
    if (nsltId) {
      const newsResponse = await axios.get(`https://www.prologistics.info/news_email.php?id=${nsltId}`, {
        withCredentials: true,
      });
      const html = newsResponse.data;
      
      // Parse subject from input field
      const subjectMatch = html.match(/<input[^>]*name="subject"[^>]*value="([^"]*)"[^>]*>/i);
      if (subjectMatch && subjectMatch[1]) {
        result.actualSubject = decodeHtmlEntities(subjectMatch[1]);
      }
    }

    // Fetch landing page
    if (lpId && slug) {
      const shopId = SHOP_ID_MAP[slug as keyof typeof SHOP_ID_MAP];
      if (shopId) {
        const shopResponse = await axios.get(
          `https://www.prologistics.info/shop_content.php?id=${lpId}&shop_id=${shopId}`,
          { withCredentials: true }
        );
        const html = shopResponse.data;

        const targetLang = getLanguageForSlug(slug);

                console.log(`🔍 Looking for title[${targetLang}] for ${slug}`);

        
        // Parse page title from input field
const langPattern = new RegExp(`name="title\\[${targetLang}\\]"[^>]*value="([^"]*)"`, 'i');
const langMatch = html.match(langPattern);
        if (langMatch && langMatch[1]) {
          result.actualPageTitle = decodeHtmlEntities(langMatch[1]);
                    console.log(`✅ Found ${targetLang} title for ${slug}:`, result.actualPageTitle);

        }
else {
          // Fallback: try to find any non-empty title
          const titleMatches = html.match(/<input[^>]*name="title\[([^\]]*)\]"[^>]*value="([^"]*)"[^>]*>/gi);
          if (titleMatches) {
            for (const match of titleMatches) {
              const langMatch2 = match.match(/name="title\[([^\]]*)\]"/);
              const valueMatch = match.match(/value="([^"]*)"/);
              if (langMatch2 && valueMatch && valueMatch[1] && valueMatch[1].trim()) {
                const lang = langMatch2[1];
                const value = valueMatch[1];
                console.log(`⚠️ Found fallback title[${lang}] for ${slug}:`, value);
                if (value.trim()) {
                  result.actualPageTitle = decodeHtmlEntities(value);
                  break;
                }
              }
            }
          
        }}
      }
    }

    // Compare values - mark as needs update if different
    if (result.actualSubject !== null && spreadsheetSubject !== null) {
      // Normalize both for comparison
      const actualNormalized = normalizeText(result.actualSubject);
      const spreadsheetNormalized = normalizeText(spreadsheetSubject);
      
      // Log for debugging
      console.log(`Subject comparison for ${slug}:`, {
        actual: result.actualSubject,
        spreadsheet: spreadsheetSubject,
        actualNormalized,
        spreadsheetNormalized,
        match: actualNormalized === spreadsheetNormalized
      });
      
      result.subjectNeedsUpdate = actualNormalized !== spreadsheetNormalized;
    } else if (spreadsheetSubject !== null) {
      result.subjectNeedsUpdate = true; // No actual value found
    }
    
    if (result.actualPageTitle !== null && spreadsheetPageTitle !== null) {
     const actualNormalized = normalizeText(result.actualPageTitle);
      const spreadsheetNormalized = normalizeText(spreadsheetPageTitle);
      
      console.log(`Page Title comparison for ${slug}:`, {
        actual: result.actualPageTitle,
        spreadsheet: spreadsheetPageTitle,
        actualNormalized,
        spreadsheetNormalized,
        match: actualNormalized === spreadsheetNormalized
      });
      
      result.pageTitleNeedsUpdate = actualNormalized !== spreadsheetNormalized;
    } else if (spreadsheetPageTitle !== null) {
      result.pageTitleNeedsUpdate = true; // No actual value found
    }

    return result;
  } catch (error: any) {
    console.error(`Failed to verify content for ${slug}:`, error);
    result.error = error.message;
    return result;
  }
};

const decodeHtmlEntities = (text: string): string => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

const normalizeText = (text: string): string => {
   if (!text) return '';
  
  let decoded = decodeHtmlEntities(text);
  decoded = decoded.replace(/\s+/g, ' ');
  decoded = decoded.trim();
  decoded = decoded.toLowerCase();
  decoded = decoded.replace(/<[^>]*>/g, '');
  decoded = decoded.replace(/[^a-z0-9\s]/g, '');
  
  return decoded;
};

// Export the batch verification function with p-limit
export const verifyBatch = async (
  items: Array<{
    nsltId: string;
    lpId: string;
    spreadsheetSubject: string | null;
    spreadsheetPageTitle: string | null;
    slug: string;
  }>,
  onProgress?: (completed: number, total: number, result: VerificationResult) => void
): Promise<VerificationResult[]> => {
  const total = items.length;
  let completed = 0;
  const results: VerificationResult[] = [];

  const promises = items.map(item =>
    limit(async () => {
      const result = await fetchAndVerifyContent(
        item.nsltId,
        item.lpId,
        item.spreadsheetSubject,
        item.spreadsheetPageTitle,
        item.slug
      );
      
      results.push(result);
      completed++;
      
      if (onProgress) {
        onProgress(completed, total, result);
      }
      
      return result;
    })
  );

  await Promise.all(promises);
  return results;
};