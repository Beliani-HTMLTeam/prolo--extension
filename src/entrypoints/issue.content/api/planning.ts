import { SendToSpamParams } from '@/entrypoints/newtab/types/Planning';
import { NEWSLETTER_SLUGS } from '../lib/planningConfig';
import { SpamFormBuilder } from '@/entrypoints/newtab/utils/planning/classes/SpamFormBuilder';
import { parseSpamPlanHtml } from '@/entrypoints/newtab/utils/planning/parseSpamPlan';

export const NUMBER_OF_NEWSLETTERS = Object.keys(NEWSLETTER_SLUGS).length;

export async function sendToSpam(params: SendToSpamParams): Promise<Response> {
  console.log('planning: ', params);

  const formData = new SpamFormBuilder(params).build();

  // Make the POST request
  const response = await fetch('https://www.prologistics.info/api/customerSpam/sendToSpam/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });

  return response;
}

export async function fetchCustomerCountsForNewsletters(targetNewsletterIds: number[]): Promise<Map<number, number>> {
  const response = await fetch('https://www.prologistics.info/spam_plan.php');
  const html = await response.text();

  const targetIdsSet = new Set(targetNewsletterIds);
  return parseSpamPlanHtml(html, targetIdsSet);
}
