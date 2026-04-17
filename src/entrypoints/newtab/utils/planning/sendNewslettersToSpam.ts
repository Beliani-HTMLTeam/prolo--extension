import { sendToSpam } from '@/entrypoints/issue.content/api/planning';
import { PlanningEntry, PlanningResult } from '../../types/Planning';

export const sendNewslettersToSpam = async (
  groupedBySlug: Map<string, PlanningEntry[]>,
  onProgress: (processedCount: number, results: PlanningResult[]) => void,
): Promise<{ allNewsletterIds: number[]; results: PlanningResult[] }> => {
  let processedCount = 0;
  const allNewsletterIds: number[] = [];
  const results: PlanningResult[] = [];

  for (const [slug, entries] of groupedBySlug.entries()) {
    const isABTest = entries.length === 2;
    const newsletterIds = entries.map(e => e.newsletterId);
    allNewsletterIds.push(...newsletterIds);

    const shopId = entries[0].shopId;
    const username = entries[0].username;

    try {
      await sendToSpam({
        usernameReg: username,
        shopId: shopId,
        newsletterIds: newsletterIds,
        newsletterSlug: slug,
        isABTest,
      });

      for (const entry of entries) {
        const existingResult = results.find(r => r.newsletterId === entry.newsletterId);

        if (existingResult) {
          existingResult.status = 'success';
        } else {
          results.push({
            ...entry,
            customers: 0,
            status: 'success',
          });
        }
      }
      console.log(`✅ ${slug}: sent successfully`);
    } catch (err) {
      console.error(`❌ Failed for ${slug}:`, err);
      for (const entry of entries) {
        const existingResult = results.find(r => r.newsletterId === entry.newsletterId);
        if (existingResult) {
          existingResult.status = 'error';
          existingResult.error = err instanceof Error ? err.message : 'Unknown error';
        } else {
          results.push({
            ...entry,
            customers: 0,
            status: 'error',
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }
    }

    processedCount += entries.length;
    onProgress(processedCount, [...results]);
  }

  return { allNewsletterIds, results };
};
