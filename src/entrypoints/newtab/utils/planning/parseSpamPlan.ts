import { SpamPlanEntry } from "../../types/Planning";

export const parseSpamPlanHtml = (html: string, targetIds: Set<number>): Map<number, SpamPlanEntry> => {
 const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const resultMap = new Map<number, SpamPlanEntry>();

  const rows = doc.querySelectorAll('tr[id^="row"]');

  rows.forEach(row => {
    const newsletterLink = row.querySelector('a[href*="news_email.php?id="]');
    const newsletterIdMatch = newsletterLink?.getAttribute('href')?.match(/id=(\d+)/);
    const newsletterId = newsletterIdMatch ? parseInt(newsletterIdMatch[1], 10) : null;

    if (!newsletterId || !targetIds.has(newsletterId)) {
      return;
    }

    const customerLink = row.querySelector('a[href*="news_email_log.php"]');
    const customerCount = parseInt(customerLink?.textContent?.trim() || '0', 10);

     const newsLinks = row.querySelectorAll('a[href*="news_email.php?id="]');
    const subjectLink = newsLinks.length > 1 ? newsLinks[1] : newsLinks[0];
    const subjectLine = subjectLink?.textContent?.trim() || '';

    const currentTotal = resultMap.get(newsletterId)?.customerCount || 0;
    resultMap.set(newsletterId, { customerCount: currentTotal + customerCount, subjectLine: subjectLine || resultMap.get(newsletterId)?.subjectLine || '', newsletterId });
  });

  return resultMap;
}