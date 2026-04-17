export const parseSpamPlanHtml = (html: string, targetIds: Set<number>): Map<number, number> => {
 const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const customerCountMap = new Map<number, number>();

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

    const currentTotal = customerCountMap.get(newsletterId) || 0;
    customerCountMap.set(newsletterId, currentTotal + customerCount);
  });

  return customerCountMap;

}