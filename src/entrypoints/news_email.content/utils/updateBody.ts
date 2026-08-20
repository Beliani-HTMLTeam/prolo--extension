import { handleButtonBodyUpdate } from "./handleButtonBodyUpdate";

type UpdateBodyPayload = {
  campaign_id: string;
  body: string;
  shop_content: string | null;
};

// You already have (or should add) these UI helpers from the previous step
type NewsletterUI = {
  header: Element;
  tbody: Element;
  createTh: (opts: { title: string; description?: string }) => HTMLTableCellElement;
  createButton: (opts: { title: string; onClick: () => void }) => HTMLButtonElement;
  createColumn: (children: HTMLElement[]) => HTMLTableCellElement;
};

export function initUpdateBody(ui: NewsletterUI): void {
  const body = document.querySelector<HTMLTextAreaElement>('textarea[name=body]');
  if (!body) return;

  const updateBodyTh = ui.createTh({
    title: 'Update body',
    description: 'Copy body content from current campaign.',
  });
  ui.header.append(updateBodyTh);

  const rows = ui.tbody.querySelectorAll('tr');

  rows.forEach(row => {
    const links = row.querySelectorAll<HTMLAnchorElement>('a');
    const idLink = row.querySelector('a');

    if (!idLink) {
      console.warn('Newsletter Id page not found.');
      return;
    }

    const campaignId = idLink.textContent?.trim() ?? '';
    if (!campaignId) return;

    const hrefLp = [...links].filter(item => item.href.includes('/shop_content.php?id'));

    const button = ui.createButton({
      title: 'Copy body',
      onClick: () => {
        let lpId: string | null = null;

        if (hrefLp.length > 0) {
          try {
            lpId = new URL(hrefLp[0].href, location.origin).searchParams.get('id');
          } catch {
            lpId = null;
          }
        }

        if (body.value.trim().length <= 10) {
          console.warn('Body content too small.');
          // or: notify('Body content too small.');
          return;
        }

        const payload: UpdateBodyPayload = {
          campaign_id: campaignId,
          body: body.value,
          shop_content: lpId,
        };

        handleButtonBodyUpdate(payload);
      },
    });

    row.append(ui.createColumn([button]));
  });
}
