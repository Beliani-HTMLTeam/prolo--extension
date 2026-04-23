import { fetchCustomerCountsForNewsletters } from '@/entrypoints/issue.content/api/planning';
import { PlanningEntry, PlanningResult } from '../../types/Planning';

export const aggregateCustomerCounts = async (
  allNewsletterIds: number[],
  results: PlanningResult[],
  groupedBySlug: Map<string, PlanningEntry[]>,
  signal?: AbortSignal
): Promise<PlanningResult[]> => {
    if (signal?.aborted) {
    throw new DOMException('Cancelled', 'AbortError');
  }

  await new Promise(resolve => setTimeout(resolve, 3000));

   if (signal?.aborted) {
    throw new DOMException('Cancelled', 'AbortError');
  }


  console.log('Fetching spam plan for newsletter IDs:', allNewsletterIds);

  const spamPlanMap = await fetchCustomerCountsForNewsletters(allNewsletterIds, { signal });

  console.log('Customer count map entries:', Array.from(spamPlanMap.entries()));

  let updatedResults = results.map(result => {
    const entry = spamPlanMap.get(result.newsletterId);
    if (entry) {
      console.log(`Found data for newsletter ${result.newsletterId} (${result.slug}): ${entry.customerCount} customers - "${entry.subjectLine}"`);
      return { 
        ...result, 
        customers: entry.customerCount,
        subjectLine: entry.subjectLine 
      };
    } else {
      console.warn(`No spam plan data found for newsletter ${result.newsletterId} (${result.slug})`);
      return { ...result, subjectLine: '' };
    }
  });

  for (const [slug, entries] of groupedBySlug.entries()) {
    if (entries.length === 2) {
      const aEntry = entries.find(e => e.type === 'A');
      const bEntry = entries.find(e => e.type === 'B');

      if (aEntry && bEntry) {
        const aResult = updatedResults.find(r => r.newsletterId === aEntry.newsletterId);
        const bResult = updatedResults.find(r => r.newsletterId === bEntry.newsletterId);

        if (aResult && bResult) {
          const totalCustomers = (aResult.customers || 0) + (bResult.customers || 0);
          const subjectLine = aResult.subjectLine || bResult.subjectLine || '';

          updatedResults = updatedResults.map(r => {
            if (r.newsletterId === aEntry.newsletterId || r.newsletterId === bEntry.newsletterId) {
              return { ...r, customers: totalCustomers, subjectLine };
            }
            return r;
          });
          console.log(
            `📊 ${slug} AB Test total: ${totalCustomers} customers (A: ${aResult.customers}, B: ${bResult.customers}) - Subject: ${subjectLine}`,
          );
        }
      }
    }
  }

  const seenSlugs = new Set<string>();
  const deduplicatedResults: PlanningResult[] = [];

  for (const result of updatedResults) {
    if (!seenSlugs.has(result.slug)) {
      seenSlugs.add(result.slug);
      deduplicatedResults.push(result);
    }
  }

  return deduplicatedResults;
};
