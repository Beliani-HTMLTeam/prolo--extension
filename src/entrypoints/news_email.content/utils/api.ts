import { BannerType } from '../types';
import { buildNewsletterPreviewHtml } from './banner';
import { NewsletterDomData } from './dom';
import pLimit from 'p-limit';
import pRetry from 'p-retry';

export type UpdateResult = {
  slug: string;
  id?: string;
  status: 'success' | 'error' | 'skipping';
  error?: string;
};

export type UpdateNewslettersBatchOptions = {
  currentSlug?: string | null;
};

import { SHOP_SLUGS } from '../constants/shops';

type Translations = { header: Record<string, any>; footer: Record<string, any>; templates: Record<string, any> } | null;

export const updateNewsletter = async (
  slug: string,
  domData: NewsletterDomData,
  template: string,
  banners: BannerType[],
  translations: Translations,
  titVersion: number = 1,
) => {
  const slugIndex = SHOP_SLUGS.indexOf(slug);
  const newsletterId = domData.id;

  console.log('rendering slug: ', slug);

  const finalHtml = buildNewsletterPreviewHtml(
    template,
    banners,
    slugIndex === -1 ? 0 : slugIndex,
    newsletterId,
    translations,
    titVersion,
  );

  const formData = new FormData();
  formData.append('update_body', 'Update body');
  formData.append('body', finalHtml);
  formData.append('id', newsletterId);
  formData.append('deleted_doc', '0');
  formData.append('shop_content_id', domData.shopContentId);

  const response = await fetch(`${window.origin}/news_email.php`, {
    method: 'POST',
    body: formData,
    referrer: `${window.origin}/news_email.php?id=${newsletterId}`,
    referrerPolicy: 'strict-origin-when-cross-origin',
  });

  if (!response.ok) {
    throw new Error(`Failed to update newsletter ${slug} (ID: ${domData.id})`);
  }

  if (newsletterId === new URLSearchParams(window.location.search).get('id')) {
    setTimeout(() => location.reload(), 100);
  }

  return response;
};

export const updateNewslettersBatch = async (
  slugs: string[],
  idMap: Record<string, NewsletterDomData>,
  template: string,
  banners: BannerType[],
  translations: Translations,
  onProgress: (completed: number, results: UpdateResult[]) => void,
  concurrency: number = 3,
  options: UpdateNewslettersBatchOptions = {},
  titVersion: number = 1,
) => {
  const limit = pLimit(concurrency);
  let completed = 0;
  const results: UpdateResult[] = [];
  const currentSlug = options.currentSlug ?? null;
  const currentDomData = currentSlug ? idMap[currentSlug] : undefined;
  const shouldDeferCurrent = Boolean(currentSlug && currentDomData && slugs.includes(currentSlug));
  const executionSlugs = shouldDeferCurrent ? slugs.filter(slug => slug !== currentSlug) : slugs;

  const deferredCurrentResult: UpdateResult | null =
    shouldDeferCurrent && currentSlug ? { slug: currentSlug, id: currentDomData!.id, status: 'skipping' } : null;

  if (deferredCurrentResult) {
    results.push(deferredCurrentResult);
    onProgress(completed, results);
  }

  const promises = executionSlugs.map(slug =>
    limit(async () => {
      const domData = idMap[slug];
      if (!domData) {
        completed++;
        results.push({ slug, status: 'error', error: 'Not found in DOM' });
        onProgress(completed, results);
        return;
      }

      try {
        await pRetry(() => updateNewsletter(slug, domData, template, banners, translations, titVersion), {
          retries: 2,
          onFailedAttempt: error => {
            console.warn(
              `Attempt ${error.attemptNumber} failed for ${slug}. There are ${error.retriesLeft} retries left.`,
            );
          },
        });
        const res: UpdateResult = { slug, id: domData.id, status: 'success' };
        results.push(res);
        completed++;
        onProgress(completed, results);
        return res;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const res: UpdateResult = { slug, id: domData.id, status: 'error', error: errorMsg };
        results.push(res);
        completed++;
        onProgress(completed, results);
        return res;
      }
    }),
  );

  await Promise.all(promises);

  if (deferredCurrentResult && currentDomData) {
    try {
      await pRetry(() => updateNewsletter(currentSlug!, currentDomData, template, banners, translations, titVersion), {
        retries: 2,
        onFailedAttempt: error => {
          console.warn(
            `Attempt ${error.attemptNumber} failed for ${currentSlug}. There are ${error.retriesLeft} retries left.`,
          );
        },
      });
      deferredCurrentResult.status = 'success';
      completed++;
      onProgress(completed, results);
    } catch (err) {
      deferredCurrentResult.status = 'error';
      deferredCurrentResult.error = err instanceof Error ? err.message : String(err);
      completed++;
      onProgress(completed, results);
    }
  }

  return results;
};
