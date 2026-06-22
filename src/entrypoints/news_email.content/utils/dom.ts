export type NewsletterDomData = { id: string; seller: string; lang: string; shopContentId: string };

export const getNewsletterIdsMap = (): Record<string, NewsletterDomData> => {
  const map: Record<string, NewsletterDomData> = {};

  if (typeof document === 'undefined') return map;

  const rows = document.querySelectorAll('table.tablesorter tbody tr');
  rows.forEach(row => {
    const idLink = row.querySelector('a[href^="/news_email.php?id="]');
    if (!idLink) return;

    const id = idLink.textContent?.trim();
    const sellerName = row.children[1]?.textContent?.trim();
    const language = row.children[2]?.textContent?.trim();
    const shopContentId = row.querySelector('a[href^="/shop_content.php?id="]')?.textContent?.trim();

    if (!id || !sellerName || !language || !shopContentId) return;

    const key = `${sellerName}-${language}`;
    let slug = '';

    switch (key) {
      case 'Beliani UK-english':
        slug = 'uk';
        break;
      case 'Beliani PL-polish':
        slug = 'pl';
        break;
      case 'Beliani DE-germanDE':
        slug = 'de';
        break;
      case 'Beliani AT-germanDE':
        slug = 'at';
        break;
      case 'Beliani-german':
        slug = 'chde';
        break;
      case 'Beliani NL-dutch':
        slug = 'nl';
        break;
      case 'Beliani FR-french':
        slug = 'fr';
        break;
      case 'Beliani-french':
        slug = 'chfr';
        break;
      case 'Beliani SP-spanish':
        slug = 'es';
        break;
      case 'Beliani PT-portugal':
        slug = 'pt';
        break;
      case 'Beliani IT-italian':
        slug = 'it';
        break;
      case 'Beliani DK-danish':
        slug = 'dk';
        break;
      case 'Beliani NO-norsk':
        slug = 'no';
        break;
      case 'Beliani FI-finnish':
        slug = 'fi';
        break;
      case 'Beliani SE-swedish':
        slug = 'se';
        break;
      case 'Beliani CZ-czech':
        slug = 'cz';
        break;
      case 'Beliani SK-slovak':
        slug = 'sk';
        break;
      case 'Beliani HU-Hungarian':
        slug = 'hu';
        break;
      case 'Beliani RO-romanian':
        slug = 'ro';
        break;
      case 'Beliani BE-dutch':
        slug = 'benl';
        break;
      case 'Beliani BE-french':
        slug = 'befr';
        break;
    }

    if (slug) {
      map[slug] = { id, seller: sellerName, lang: language, shopContentId };
    }
  });

  return map;
};
