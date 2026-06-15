import pLimit from 'p-limit';
import { IssueListItem } from '../lib/types';
import { fetchSpreadsheetTranslationsTab } from './issueData';
import { NEWSLETTER_ENDPOINT, SHOP_ENDPOINT } from '@/entrypoints/newtab/utils/updater/constants';
import axios from 'axios';

interface LPPathResult {
  lp: string;
  date: Date | null;
}

export const fetchLPPaths = async (issueItem: IssueListItem): Promise<LPPathResult> => {
  const tabName = await fetchSpreadsheetTranslationsTab(issueItem); // "22.05.26 - Beds" format

  if (!tabName) {
    console.warn('No tab name found, using default LP');
    return { lp: 'lp00-00-00', date: null };
  }

  let year: string, month: string, day: string;
  let parsedDate: Date | null = null;

  let dateMatch = tabName.match(/(\d{2})\.(\d{2})\.(\d{2})/); // DD.MM.YY format
  if (dateMatch) {
    // format: DD.MM.YY
    [, day, month, year] = dateMatch;
    parsedDate = new Date(2000 + parseInt(year), parseInt(month) - 1, parseInt(day));
  } else {
    // DD.MM.YYYY format
    dateMatch = tabName.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    if (dateMatch) {
      [, day, month, year] = dateMatch;
      const fullYear = year;
      year = year.slice(-2);
      parsedDate = new Date(parseInt(fullYear), parseInt(month) - 1, parseInt(day));
    } else {
      console.warn('Could not parse date from tab name:', tabName);
      return { lp: 'lp00-00-00', date: null };
    }
  }

  if (parsedDate && isNaN(parsedDate.getTime())) {
    console.warn('Invalid date parsed from tab name:', tabName);
    parsedDate = null;
  }

  const result = `lp${year}-${month}-${day}`;
  console.log('Generated LP path:', result);
  return { lp: result, date: parsedDate };
};

const limit = pLimit(3);

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
  formData.append('id', data.id);

  data.smtp_id.forEach(server => {
    formData.append('smtp_id[]', server.toString());
  });

  try {
    const response = await axios.post(NEWSLETTER_ENDPOINT, formData,  {
      withCredentials: true,
    }
    );

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
  formData.append('id', data.id);
  formData.append('shop_id', data.shop_id);

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
      withCredentials: true,
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
