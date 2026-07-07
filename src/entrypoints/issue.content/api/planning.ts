import { SendToSpamParams, SpamPlanEntry } from '@/entrypoints/issue.content/types/Planning';
import { NEWSLETTER_SLUGS } from '../lib/planningConfig';
import { SpamFormBuilder } from '@/entrypoints/newtab/utils/planning/classes/SpamFormBuilder';
import { parseSpamPlanHtml } from '@/entrypoints/newtab/utils/planning/parseSpamPlan';

export const NUMBER_OF_NEWSLETTERS = Object.keys(NEWSLETTER_SLUGS).length;

export async function sendToSpam(params: SendToSpamParams, options?: { signal?: AbortSignal }): Promise<Response> {
  console.log('planning: ', params);
  const { signal } = options || {};

  const formData = new SpamFormBuilder(params).build();

  // Make the POST request
  const response = await fetch('https://www.prologistics.info/api/customerSpam/sendToSpam/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
    signal,
  });

  return response;
}

export async function fetchCustomerCountsForNewsletters(
  targetNewsletterIds: number[],
  options?: { signal?: AbortSignal },
): Promise<Map<number, SpamPlanEntry>> {
  const { signal } = options || {};

  const response = await fetch('https://www.prologistics.info/spam_plan.php', { signal });
  const html = await response.text();

  const targetIdsSet = new Set(targetNewsletterIds);
  return parseSpamPlanHtml(html, targetIdsSet);
}
