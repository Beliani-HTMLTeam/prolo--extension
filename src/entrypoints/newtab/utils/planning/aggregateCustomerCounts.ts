import { fetchCustomerCountsForNewsletters } from '@/entrypoints/issue.content/api/planning';
import { PlanningEntry, PlanningResult } from '../../types/Planning';

export const aggregateCustomerCounts = async (
  allNewsletterIds: number[],
  results: PlanningResult[],
  groupedBySlug: Map<string, PlanningEntry[]>,
): Promise<PlanningResult[]> => {
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('Fetching spam plan for newsletter IDs:', allNewsletterIds);

  const customerCountMap = await fetchCustomerCountsForNewsletters(allNewsletterIds);

  console.log('Customer count map entries:', Array.from(customerCountMap.entries()));

  let updatedResults = results.map(result => {
    const customerCount = customerCountMap.get(result.newsletterId);
    if (customerCount !== undefined) {
      console.log(`Found data for newsletter ${result.newsletterId} (${result.slug}): ${customerCount} customers`);

      return { ...result, customers: customerCount };
    } else {
      console.warn(`No spam plan data found for newsletter ${result.newsletterId} (${result.slug})`);
      return result;
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

          updatedResults = updatedResults.map(r => {
            if (r.newsletterId === aEntry.newsletterId || r.newsletterId === bEntry.newsletterId) {
              return { ...r, customers: totalCustomers };
            }
            return r;
          });
          console.log(
            `📊 ${slug} AB Test total: ${totalCustomers} customers (A: ${aResult.customers}, B: ${bResult.customers})`,
          );
        }
      }
    }
  }

  return updatedResults;
};
