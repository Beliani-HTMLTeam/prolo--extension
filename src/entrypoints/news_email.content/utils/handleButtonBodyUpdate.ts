const NEWSLETTER_ENDPOINT = 'https://www.prologistics.info/news_email.php';

export type UpdateBodyPayload = {
  campaign_id: string;
  body: string;
  shop_content: string | null;
};

function createFormData(
  formDataValues: Record<string, string | number | string[] | null | undefined>,
): FormData | null {
  const formData = new FormData();
  let hasUndefinedValue = false;

  for (const [key, value] of Object.entries(formDataValues)) {
    if (Array.isArray(value)) {
      value.forEach(item => formData.append(key, item));
    } else {
      if (value === undefined || value === null) {
        hasUndefinedValue = true;
      }
      formData.append(key, String(value ?? ''));
    }
  }

  return hasUndefinedValue ? null : formData;
}

async function updateContent(formData: FormData, campaignId: string): Promise<void> {
  await fetch(NEWSLETTER_ENDPOINT, {
    headers: {
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'en-US,en;q=0.9,ru;q=0.8',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
    },
    referrer: `${NEWSLETTER_ENDPOINT}?id=${campaignId}`,
    referrerPolicy: 'strict-origin-when-cross-origin',
    body: formData,
    method: 'POST',
    mode: 'cors',
    credentials: 'include',
  });
}

export async function handleButtonBodyUpdate({
  campaign_id,
  body,
  shop_content,
}: UpdateBodyPayload): Promise<void> {
  if (!shop_content) {
    console.warn(`Shop content not found for ${campaign_id}`);
    // or: notify(`Shop content not found for ${campaign_id}`);
  }

  const formDataValues = {
    update_body: 'Update body',
    body: body || '',
    id: campaign_id,
    deleted_doc: 0,
    shop_content_id: shop_content || '',
  };

  const formData = createFormData(formDataValues);
  if (!formData) return;

  await updateContent(formData, campaign_id);

  console.log(`Body content updated for ${campaign_id}`);
  // or: notify(`Body content updated for ${campaign_id}`);

  // Reload if we're on the same campaign page
  if (window.location.href.endsWith(campaign_id) || window.location.href.includes(`id=${campaign_id}`)) {
    setTimeout(() => {
      location.reload();
    }, 100);
  }
}