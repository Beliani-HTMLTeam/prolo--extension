import { sendToSpam } from '@/entrypoints/issue.content/api/planning';
import { PlanningEntry, PlanningResult } from '../../types/Planning';
import pLimit from 'p-limit';
import { NEWSLETTER_SHOP_ORDER } from '@/entrypoints/issue.content/lib/shopConfig';

export const sendNewslettersToSpam = async (
  groupedBySlug: Map<string, PlanningEntry[]>,
  onProgress: (processedCount: number, results: PlanningResult[], shopsCompleted: number) => void,
  signal?: AbortSignal,
  concurrency: number = 5,
): Promise<{ allNewsletterIds: number[]; results: PlanningResult[] }> => {
  const allNewsletterIds: number[] = [];
  const resultsBySlug = new Map<string, PlanningResult[]>();

  let newslettersCompleted = 0;
  let shopsCompleted = 0;

  const shopStatus = new Map<string, { total: number; completed: number }>();

  for (const [slug, entries] of groupedBySlug.entries()) {
    shopStatus.set(slug, { total: entries.length, completed: 0 });
  }

  const limit = pLimit(concurrency);

  const tasks = Array.from(groupedBySlug.entries()).map(([slug, entries]) => {
    return limit(async () => {
      if (signal?.aborted) {
        throw new DOMException('Cancelled', 'AbortError');
      }

      const isABTest = entries.length === 2;
      const newsletterIds = entries.map(e => e.newsletterId);

      allNewsletterIds.push(...newsletterIds);

      const shopId = entries[0].shopId;
      const username = entries[0].username;

      const slugResults: PlanningResult[] = [];

      try {
        await sendToSpam(
          {
            usernameReg: username,
            shopId: shopId,
            newsletterIds: newsletterIds,
            newsletterSlug: slug,
            isABTest,
          },
          { signal },
        );

        for (const entry of entries) {
          slugResults.push({
            ...entry,
            customers: 0,
            status: 'success',
            failed: false,
          });
        }
        console.log(`✅ ${slug}: sent successfully`);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw err;
        }
        console.error(`❌ Failed for ${slug}:`, err);
        for (const entry of entries) {
          slugResults.push({
            ...entry,
            customers: 0,
            status: 'error',
            failed: true,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      resultsBySlug.set(slug, slugResults);

      newslettersCompleted += entries.length;

      const status = shopStatus.get(slug);
      if (status) {
        status.completed++;

        if (status.completed === status.total) {
          shopsCompleted++;
        }
      }

      const allCurrentResults = Array.from(resultsBySlug.values()).flat();
      onProgress(newslettersCompleted, allCurrentResults, shopsCompleted);
    });
  });

  await Promise.all(tasks);

  const orderedResults: PlanningResult[] = [];

  for (const slug of NEWSLETTER_SHOP_ORDER) {
    const slugResults = resultsBySlug.get(slug);
    if (slugResults) {
      orderedResults.push(...slugResults);
    }
  }

  for (const [slug, slugResults] of resultsBySlug.entries()) {
    if (!NEWSLETTER_SHOP_ORDER.includes(slug as any)) {
      orderedResults.push(...slugResults);
    }
  }

  return { allNewsletterIds, results: orderedResults };
};
