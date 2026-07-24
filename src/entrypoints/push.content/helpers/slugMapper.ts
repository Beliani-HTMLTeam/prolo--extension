import { PushTranslations } from "@/entrypoints/issue.content/lib/types";

export interface SlugConfig {
  shop: string;
  template: string;
  language: string;
  ctaLang: string;
  clickAction: string;
  icon: string;
  image: string;
  lpPath: string;
}

// Base configuration without template IDs (they'll be calculated)
interface BaseSlugConfig {
  shop: string;
  templateOffset: number;
  language: string;
  ctaLang: string;
  domain: string;
  lpPath?: string;
}

// Base mapping with template offsets instead of hardcoded IDs
const BASE_SLUG_CONFIG: Record<string, BaseSlugConfig> = {
  'CHDE': { shop: '1', templateOffset: 0, language: 'german', ctaLang: 'german', domain: 'ch' },
  'CHFR': { shop: '1', templateOffset: 1, language: 'french', ctaLang: 'french', domain: 'ch' },
  'AT': { shop: '8', templateOffset: 2, language: 'germanDE', ctaLang: 'germanDE', domain: 'at' },
  'BENL': { shop: '19', templateOffset: 3, language: 'dutch', ctaLang: 'dutch', domain: 'be' },
  'BEFR': { shop: '19', templateOffset: 4, language: 'french', ctaLang: 'french', domain: 'be' },
  'CZ': { shop: '26', templateOffset: 5, language: 'czech', ctaLang: 'czech', domain: 'cz' },
  'DE': { shop: '3', templateOffset: 6, language: 'germanDE', ctaLang: 'germanDE', domain: 'de' },
  'DK': { shop: '25', templateOffset: 7, language: 'danish', ctaLang: 'danish', domain: 'dk' },
  'FI': { shop: '27', templateOffset: 8, language: 'finnish', ctaLang: 'finnish', domain: 'fi' },
  'FR': { shop: '7', templateOffset: 9, language: 'french', ctaLang: 'french', domain: 'fr' },
  'HR': { shop: '33', templateOffset: 10, language: 'croatian', ctaLang: 'croatian', domain: 'hr' },
  'HU': { shop: '24', templateOffset: 11, language: 'Hungarian', ctaLang: 'Hungarian', domain: 'hu' },
  'IT': { shop: '21', templateOffset: 12, language: 'italian', ctaLang: 'italian', domain: 'it' },
  'NL': { shop: '17', templateOffset: 13, language: 'dutch', ctaLang: 'dutch', domain: 'nl' },
  'NO': { shop: '28', templateOffset: 14, language: 'norsk', ctaLang: 'norsk', domain: 'no' },
  'PL': { shop: '12', templateOffset: 15, language: 'polish', ctaLang: 'polish', domain: 'pl' },
  'PT': { shop: '22', templateOffset: 16, language: 'portugal', ctaLang: 'portugal', domain: 'pt' },
  'RO': { shop: '30', templateOffset: 17, language: 'romanian', ctaLang: 'romanian', domain: 'ro' },
  'SE': { shop: '23', templateOffset: 18, language: 'swedish', ctaLang: 'swedish', domain: 'se' },
  'SI': { shop: '34', templateOffset: 19, language: 'slovene', ctaLang: 'slovene', domain: 'si' },
  'SK': { shop: '29', templateOffset: 20, language: 'slovak', ctaLang: 'slovak', domain: 'sk' },
  'ES': { shop: '10', templateOffset: 21, language: 'spanish', ctaLang: 'spanish', domain: 'es' },
  'UK': { shop: '2', templateOffset: 22, language: 'english', ctaLang: 'english', domain: 'co.uk' },
};

// Helper to get current date in YYYYMMDD format
export function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// Parse result with warning flag
export interface ParseResult {
  date: string;
  version: string;
  day: string;
  month: string;
  year: string;
  hasDate: boolean;
  warning?: string;
}

// Generate LP path from campaign name with warning
export function generateLpPath(campaignName: string): string {
  const result = parseCampaignName(campaignName);
  const shortYear = result.year.slice(-2);
  return `lp${shortYear}-${result.month}-${result.day}`;
}

// Enhanced parse campaign name to extract date and version
export function parseCampaignName(campaignName: string): ParseResult {
  // Default values
  let date = getCurrentDate();
  let day = '26';
  let month = '07';
  let year = '2026';
  let version = '1';
  let hasDate = false;
  let warning: string | undefined;

  // Try multiple date patterns in order of specificity
  
  // Pattern 1: DD.MM.YY (e.g., 24.07.26) - most common
  let dateMatch = campaignName.match(/(\d{2})[\.](\d{2})[\.](\d{2})(?!\d)/);
  
  // Pattern 2: DD-MM-YY (e.g., 24-07-26)
  if (!dateMatch) {
    dateMatch = campaignName.match(/(\d{2})[-](\d{2})[-](\d{2})(?!\d)/);
  }
  
  // Pattern 3: DD.MM.YYYY (e.g., 24.07.2026)
  if (!dateMatch) {
    dateMatch = campaignName.match(/(\d{2})[\.](\d{2})[\.](\d{4})/);
    if (dateMatch) {
      day = dateMatch[1];
      month = dateMatch[2];
      year = dateMatch[3];
      hasDate = true;
    }
  }
  
  // Pattern 4: YY.MM.DD (e.g., 26.07.24)
  if (!dateMatch) {
    dateMatch = campaignName.match(/(\d{2})[\.](\d{2})[\.](\d{2})/);
  }
  
  // If found with 2-digit year (YY)
  if (dateMatch && dateMatch[3].length === 2) {
    day = dateMatch[1];
    month = dateMatch[2];
    const shortYear = dateMatch[3];
    const yearPrefix = parseInt(shortYear) >= 24 ? '20' : '20';
    year = `${yearPrefix}${shortYear}`;
    hasDate = true;
  } 
  // If found with 4-digit year
  else if (dateMatch && dateMatch[3].length === 4) {
    day = dateMatch[1];
    month = dateMatch[2];
    year = dateMatch[3];
    hasDate = true;
  }
  
  // If no date found, use current date and show warning
  if (!hasDate) {
    const now = new Date();
    year = now.getFullYear().toString();
    month = String(now.getMonth() + 1).padStart(2, '0');
    day = String(now.getDate()).padStart(2, '0');
    warning = 'No date found in campaign name. Using today\'s date.';
  }
  
  // Construct YYYYMMDD date
  date = `${year}${month}${day}`;
  
  // Try to extract version from campaign name (e.g., ver=14 or ver14 or v14)
  const versionMatch = campaignName.match(/ver[=\s]*(\d+)/i) || campaignName.match(/v(\d+)/i);
  if (versionMatch) {
    version = versionMatch[1];
  }
  
  return { date, version, day, month, year, hasDate, warning };
}

// URL generation functions
export function generateClickAction(slug: string, domain: string, campaignName: string, lpPath?: string): string {
  const domainPart = domain.replace('.', '-');
  const path = lpPath || generateLpPath(campaignName);
  return `https://www.beliani.${domain}/content/${path}/?utm_source=PUSH&utm_medium=${path}&utm_campaign=garden+storage`;
}

export function generateIconUrl(): string {
  return 'https://pictureserver.net/static/2025/domainIcon_transparent.png';
}

export function generateImageUrl(campaignName: string): string {
  const { date, version } = parseCampaignName(campaignName);
  const year = date.substring(0, 4);
  const fullDate = date;
  return `https://pictureserver.net/static/${year}/${fullDate}push.png?ver=${version}`;
}

// Generate dynamic image with custom parameters
export function generateCustomImageUrl(
  campaignName: string,
  customParams?: {
    baseUrl?: string;
    imageName?: string;
    extension?: string;
    version?: string;
  }
): string {
  const { date, version } = parseCampaignName(campaignName);
  const year = date.substring(0, 4);
  const fullDate = date;
  
  const baseUrl = customParams?.baseUrl || 'https://pictureserver.net/static';
  const imageName = customParams?.imageName || 'push';
  const extension = customParams?.extension || 'png';
  const ver = customParams?.version || version;
  
  return `${baseUrl}/${year}/${fullDate}${imageName}.${extension}?ver=${ver}`;
}

// Get full config with calculated template IDs and URLs
export function getSlugConfig(
  slug: string, 
  chdeTemplateId: string, 
  campaignName: string = 'lp26-07-24',
  customLpPath?: string
): SlugConfig | null {
  const upperSlug = slug.toUpperCase();
  const baseConfig = BASE_SLUG_CONFIG[upperSlug];
  
  if (!baseConfig) return null;
  
  const templateId = upperSlug === 'CHDE' 
    ? chdeTemplateId 
    : calculateTemplateId(chdeTemplateId, baseConfig.templateOffset);
  
  // Use custom LP path if provided, otherwise generate from campaign name
  const lpPath = customLpPath || generateLpPath(campaignName);
  
  return {
    shop: baseConfig.shop,
    template: templateId,
    language: baseConfig.language,
    ctaLang: baseConfig.ctaLang,
    clickAction: generateClickAction(upperSlug.toLowerCase(), baseConfig.domain, campaignName, customLpPath),
    icon: generateIconUrl(),
    image: generateImageUrl(campaignName),
    lpPath: lpPath,
  };
}

// Order for display
export const SLUG_ORDER = [
  'CHDE', 'CHFR', 'AT', 'BENL', 'BEFR', 'CZ', 'DE', 'DK', 'FI', 'FR', 
  'HR', 'HU', 'IT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SE', 'SI', 
  'SK', 'ES', 'UK'
];

// Calculate template ID based on CHDE ID and offset
export function calculateTemplateId(chdeTemplateId: string, offset: number): string {
  return (parseInt(chdeTemplateId) + offset).toString();
}

// Get push translations for a slug
export function getPushTranslationsForSlug(
  slug: string, 
  translations: PushTranslations | null
): { title: string; message: string } | null {
  if (!translations) return null;
  
  const upperSlug = slug.toUpperCase();
  const title = translations.pushTitles?.[upperSlug];
  const message = translations.pushMessages?.[upperSlug];
  
  if (!title || !message) return null;
  
  return { title, message };
}

// Build complete row data from slug
export function buildRowDataFromSlug(
  slug: string,
  chdeTemplateId: string,
  translations: PushTranslations | null,
  campaignName: string = 'lp26-07-24',
  customLpPath?: string
): Record<string, string> | null {
  const config = getSlugConfig(slug, chdeTemplateId, campaignName, customLpPath);
  if (!config) return null;
  
  const pushData = getPushTranslationsForSlug(slug, translations);
  
  const rowData: Record<string, string> = {
    "[name='shop']": config.shop,
    "[name='template']": config.template,
    "[name='language[]']": config.language,
    "[name='cta_lang']": config.ctaLang,
    "[name='click_action']": config.clickAction,
    "[name='icon']": config.icon,
    "[name='image']": config.image,
    "[name='lp_path']": config.lpPath,
  };
  
  if (pushData) {
    rowData["[name='title']"] = pushData.title;
    rowData["[name='body']"] = pushData.message;
  }
  
  return rowData;
}

// Generate campaign data from all slugs with dynamic template IDs
export function generateCampaignData(
  slugs: string[],
  chdeTemplateId: string,
  translations: PushTranslations | null,
  campaignName: string = 'lp26-07-24',
  customLpPaths?: Record<string, string>,
  customConfigs?: Record<string, Partial<SlugConfig>>
): Record<string, Record<string, string>> {
  const data: Record<string, Record<string, string>> = {};
  
  const sortedSlugs = slugs.sort((a, b) => {
    const indexA = SLUG_ORDER.indexOf(a.toUpperCase());
    const indexB = SLUG_ORDER.indexOf(b.toUpperCase());
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
  
  for (const slug of sortedSlugs) {
    const upperSlug = slug.toUpperCase();
    const customLpPath = customLpPaths?.[upperSlug];
    const config = getSlugConfig(upperSlug, chdeTemplateId, campaignName, customLpPath);
    
    if (!config) continue;
    
    const finalConfig = { ...config, ...(customConfigs?.[upperSlug] || {}) };
    const pushData = getPushTranslationsForSlug(upperSlug, translations);
    
    const rowData: Record<string, string> = {
      "[name='shop']": finalConfig.shop,
      "[name='template']": finalConfig.template,
      "[name='language[]']": finalConfig.language,
      "[name='cta_lang']": finalConfig.ctaLang,
      "[name='click_action']": finalConfig.clickAction,
      "[name='icon']": finalConfig.icon,
      "[name='image']": finalConfig.image,
      "[name='lp_path']": finalConfig.lpPath,
    };
    
    if (pushData) {
      rowData["[name='title']"] = pushData.title;
      rowData["[name='body']"] = pushData.message;
    }
    
    data[slug] = rowData;
  }
  
  return data;
}

// Get list of all available slugs in order
export function getAllSlugs(): string[] {
  return SLUG_ORDER;
}

// Validate CHDE template ID format
export function isValidTemplateId(templateId: string): boolean {
  return /^\d+$/.test(templateId) && parseInt(templateId) > 0;
}

export { BASE_SLUG_CONFIG };