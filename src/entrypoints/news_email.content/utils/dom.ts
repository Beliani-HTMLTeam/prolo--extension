import { toast } from 'sonner';

export type NewsletterDomData = {
  id: string;
  seller: string;
  lang: string;
  shopContentId: string;
};

const SLUG_MAP: Record<string, string> = {
  'Beliani UK-english': 'uk',
  'Beliani PL-polish': 'pl',
  'Beliani DE-germanDE': 'de',
  'Beliani AT-germanDE': 'at',
  'Beliani-german': 'chde',
  'Beliani NL-dutch': 'nl',
  'Beliani FR-french': 'fr',
  'Beliani-french': 'chfr',
  'Beliani SP-spanish': 'es',
  'Beliani PT-portugal': 'pt',
  'Beliani IT-italian': 'it',
  'Beliani DK-danish': 'dk',
  'Beliani NO-norsk': 'no',
  'Beliani FI-finnish': 'fi',
  'Beliani SE-swedish': 'se',
  'Beliani CZ-czech': 'cz',
  'Beliani SK-slovak': 'sk',
  'Beliani HU-Hungarian': 'hu',
  'Beliani RO-romanian': 'ro',
  'Beliani BE-dutch': 'benl',
  'Beliani BE-french': 'befr',
};

export const getNewsletterIdsMap = (): Record<string, NewsletterDomData> => {
  const map: Record<string, NewsletterDomData> = {};

  if (typeof document === 'undefined') {
    toast.error('Document is not available. This function should be run in a browser environment.');
    return map;
  }

  const h3Elements = Array.from(document.querySelectorAll('h3'));
  const familyH3 = h3Elements.find(h3 => h3.textContent?.trim().startsWith('Newsletter family'));

  if (!familyH3) {
    toast.error('NSLT Family H3 element not found.');
    return map;
  }

  let currentElement = familyH3.nextElementSibling;
  let targetTable: HTMLTableElement | null = null;

  while (currentElement) {
    if (currentElement.tagName === 'TABLE') {
      targetTable = currentElement as HTMLTableElement;
      break;
    }
    currentElement = currentElement.nextElementSibling;
  }

  if (!targetTable) {
    toast.error('NSLT Family Table not found.');
    return map;
  }

  const rows = targetTable.querySelectorAll(':scope > tbody:first-of-type > tr');

  rows.forEach(row => {
    const idLink = row.querySelector('a[href^="/news_email.php?id="]');
    if (!idLink) return;

    const id = idLink.textContent?.trim() || '';
    const sellerName = row.children[1]?.textContent?.trim() || '';
    const language = row.children[2]?.textContent?.trim() || '';

    const shopContentId = row.querySelector('a[href^="/shop_content.php?id="]')?.textContent?.trim() || '';

    if (!id || !sellerName || !language) return;

    const key = `${sellerName}-${language}`;
    const slug = SLUG_MAP[key];

    if (slug) {
      map[slug] = { id, seller: sellerName, lang: language, shopContentId };
    }
  });

  return map;
};
