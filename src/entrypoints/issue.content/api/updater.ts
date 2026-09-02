import pLimit from 'p-limit';
import { IssueListItem } from '../lib/types';
import { fetchSpreadsheetTranslationsTab } from './issueData';
import { NEWSLETTER_ENDPOINT, SHOP_ENDPOINT } from '../utils/updater/constants';
import axios from 'axios';

interface LPPathResult {
  lp: string;
  date: Date | null;
}

export const fetchLPPaths = async (issueItem: IssueListItem, tabNameOverride?: string | null): Promise<LPPathResult> => {
  const tabName = tabNameOverride ?? (await fetchSpreadsheetTranslationsTab(issueItem));
  
  if (!tabName) {
    console.warn('No tab name found, using default LP');
    return { lp: 'lp00-00-00', date: null };
  }

  let year: string, month: string, day: string;
  let parsedDate: Date | null = null;

  // Try to extract date from the beginning of the string
  // This handles both DD.MM.YY and DD.MM.YYYY formats
  const dateRegex = /(\d{2})\.(\d{2})\.(\d{2,4})/;
  const match = tabName.match(dateRegex);

  if (!match) {
    console.warn('Could not parse date from tab name:', tabName);
    return { lp: 'lp00-00-00', date: null };
  }

  day = match[1];
  month = match[2];
  const yearFull = match[3];

  // If year has 4 digits, use it for Date object, but take last 2 for LP
  if (yearFull.length === 4) {
    year = yearFull.slice(-2);
    parsedDate = new Date(parseInt(yearFull), parseInt(month) - 1, parseInt(day));
  } else {
    year = yearFull;
    parsedDate = new Date(2000 + parseInt(yearFull), parseInt(month) - 1, parseInt(day));
  }

  if (parsedDate && isNaN(parsedDate.getTime())) {
    console.warn('Invalid date parsed from tab name:', tabName);
    parsedDate = null;
  }

  const result = `lp${year}-${month}-${day}`;
  console.log('Generated LP path:', result);
  return { lp: result, date: parsedDate };
};

const limit = pLimit(5);

interface NewsletterUpdateData {
  activate_from_date: string;
  activate_from_time: string;
  deactivate_from_date: string;
  deactivate_from_time: string;
  update: string;
  seller: string;
  shop_content_id: string | null;
  lang: string;
  subject: string;
  id: string;
  smtp_id: number[];
}

interface LandingPageUpdateData {
  activate_from_date: string;
  activate_from_time: string;
  deactivate_from_date: string;
  deactivate_from_time: string;
  update: string;
  name: string;
  newsletter_template_id: string;
  id: string;
  shop_id: string;
  title_menu: Record<string, string>;
  alias: Record<string, string>;
  description: Record<string, string>;
  title: Record<string, string>;
}

interface UpdateResult {
  slug: string;
  type: 'newsletter' | 'landing-page';
  success: boolean;
  status?: number;
  error?: string;
}

interface ProgressCallback {
  (completed: number, total: number, current: UpdateResult): void;
}

const sendNewsletterUpdate = async (data: NewsletterUpdateData, slug: string): Promise<UpdateResult> => {
  const formData = new FormData();

  formData.append('activate_from_date', data.activate_from_date);
  formData.append('activate_from_time', data.activate_from_time);
  formData.append('deactivate_from_date', data.deactivate_from_date);
  formData.append('deactivate_from_time', data.deactivate_from_time);
  formData.append('update', data.update);
  formData.append('seller', data.seller);
  formData.append('shop_content_id', data.shop_content_id ?? 'null');
  formData.append('lang', data.lang);
  formData.append('subject', data.subject);
  formData.append('deleted_doc', '0');
  formData.append('id', data.id);
  formData.append('delay', '0');

  data.smtp_id.forEach(server => {
    formData.append('smtp_id[]', server.toString());
  });

  try {
    const response = await axios.post(NEWSLETTER_ENDPOINT, formData, {
      withCredentials: true,
    });

    return {
      slug,
      type: 'newsletter',
      success: true,
      status: response.status,
    };
  } catch (error: any) {
    console.error('Failed to send newsletter update:', error);
    return {
      slug,
      success: false,
      type: 'newsletter',
      error: error.message,
    };
  }
};

const sendLandingPageUpdate = async (data: LandingPageUpdateData, slug: string): Promise<UpdateResult> => {
  const formData = new FormData();

  formData.append('activate_from_date', data.activate_from_date);
  formData.append('activate_from_time', data.activate_from_time);
  formData.append('deactivate_from_date', data.deactivate_from_date);
  formData.append('deactivate_from_time', data.deactivate_from_time);
  formData.append('update', data.update);
  formData.append('name', data.name);
  formData.append('newsletter_template_id', data.newsletter_template_id);
  formData.append('deleted_doc', '0');
  formData.append('id', data.id);
  formData.append('shop_id', data.shop_id);
  formData.append('delay', '0');
  formData.append('ordering', '1');

  Object.entries(data.title_menu).forEach(([lang, value]) => {
    formData.append(`title_menu[${lang}]`, value);
  });
  Object.entries(data.alias).forEach(([lang, value]) => {
    formData.append(`alias[${lang}]`, value);
  });
  Object.entries(data.description).forEach(([lang, value]) => {
    formData.append(`description[${lang}]`, value);
  });
  Object.entries(data.title).forEach(([lang, value]) => {
    formData.append(`title[${lang}]`, value);
  });

  try {
    const response = await axios.post(SHOP_ENDPOINT, formData, {
      withCredentials: true
    });

    return {
      slug,
      type: 'landing-page',
      success: true,
      status: response.status,
    };
  } catch (error: any) {
    console.error('Failed to send landing page update:', error);
    return {
      slug,
      type: 'landing-page',
      success: false,
      error: error.message,
    };
  }
};

export const sendBatchUpdates = async (
  updates: Array<{
    type: 'newsletter' | 'landing-page';
    data: NewsletterUpdateData | LandingPageUpdateData;
    slug: string;
  }>,
  onProgress?: ProgressCallback,
): Promise<UpdateResult[]> => {
  const total = updates.length;
  let completed = 0;
  const results: UpdateResult[] = [];

  const promises = updates.map(update =>
    limit(async () => {
      let result: UpdateResult;
      if (update.type === 'newsletter') {
        result = await sendNewsletterUpdate(update.data as NewsletterUpdateData, update.slug);
      } else {
        result = await sendLandingPageUpdate(update.data as LandingPageUpdateData, update.slug);
      }

      results.push(result);
      completed++;

      if (onProgress) {
        onProgress(completed, total, result);
      }

      return result;
    }),
  );

  await Promise.all(promises);
  return results;
};
