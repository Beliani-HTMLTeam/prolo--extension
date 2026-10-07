import { initUpdateBody } from './updateBody';

function createTh(title: string): HTMLTableCellElement {
  const th = document.createElement('th');
  th.style.textAlign = 'center';
  const b = document.createElement('b');
  b.textContent = title;
  th.append(b);
  return th;
}

function svgCopy(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
}

function createCopyButton(id: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.style.cssText = 'display: flex; align-items: center; gap: 2px; font-size: 11px; cursor: pointer;';
  button.innerHTML = `${svgCopy()} ${id}`;
  button.addEventListener('click', async () => {
    await navigator.clipboard.writeText(id);
    button.textContent = 'Copied!';
    setTimeout(() => {
      button.innerHTML = `${svgCopy()} ${id}`;
    }, 1000);
  });
  return button;
}

function createColumn(children: HTMLElement[]): HTMLTableCellElement {
  const td = document.createElement('td');
  td.append(...children);
  return td;
}

/** Optional: CSV helpers – implement or import if you still need CSV upload */
function CSVToArray(strData: string, delimiter = ','): string[][] {
  const pattern = new RegExp(
    `(\\${delimiter}|\\r?\\n|\\r|^)(?:"([^"]*(?:""[^"]*)*)"|([^"\\${delimiter}\\r\\n]*))`,
    'gi',
  );
  const data: string[][] = [[]];
  let matches: RegExpExecArray | null;

  while ((matches = pattern.exec(strData))) {
    const matchedDelimiter = matches[1];
    if (matchedDelimiter.length && matchedDelimiter !== delimiter) {
      data.push([]);
    }
    const value = matches[2] ? matches[2].replace(/""/g, '"') : matches[3];
    data[data.length - 1].push(value);
  }

  return data;
}

function parseCSV(rows: string[][]): Record<string, { subject?: string }> {
  if (rows.length < 2) return {};

  const headers = rows[0].map(h => h.trim().toLowerCase());
  const slugIdx = headers.findIndex(h => h === 'slug' || h === 'shop' || h === 'country');
  const subjectIdx = headers.findIndex(h => h === 'subject');

  const result: Record<string, { subject?: string }> = {};

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const slug = slugIdx >= 0 ? row[slugIdx]?.trim() : undefined;
    if (!slug) continue;
    result[slug] = {
      subject: subjectIdx >= 0 ? row[subjectIdx]?.trim() : undefined,
    };
  }

  return result;
}

export function initNewsletterFamilyTable(): void {
  const container = [...document.querySelectorAll('center')].find(item => item.innerText.includes('Newsmail history'));

  if (!container) return;

  const newsletterFamily = [...container.querySelectorAll('h3')].find(item =>
    item.textContent?.includes('Newsletter family'),
  );

  if (!newsletterFamily) {
    console.warn('Newsletter family table not found.');
    return;
  }

  const table = newsletterFamily.nextElementSibling as HTMLTableElement | null;
  if (!table) {
    console.warn('Table not found.');
    return;
  }

  // Avoid running twice
  if (table.dataset.enhanced === 'true') return;
  table.dataset.enhanced = 'true';

  const header = table.querySelector('.tablesorter-headerRow');
  if (!header) {
    console.warn('Table header not found.');
    return;
  }

  const tbody = table.querySelector('tbody');
  if (!tbody) {
    console.warn('Table body not found.');
    return;
  }

  const ui = {
    header,
    tbody,
    createTh: (opts: { title: string; description?: string }) => {
      const th = document.createElement('th');
      th.style.textAlign = 'center';
      th.title = opts.description ?? '';
      const b = document.createElement('b');
      b.textContent = opts.title;
      th.append(b);
      return th;
    },
    createButton: ({ title, onClick }: { title: string; onClick: () => void }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = title;
      button.style.cssText = 'font-size: 11px; cursor: pointer;';
      button.addEventListener('click', onClick);
      return button;
    },
    createColumn: (children: HTMLElement[]) => {
      const td = document.createElement('td');
      td.append(...children);
      return td;
    },
  };

  header?.append(createTh('Copy campaign id'));
  const rows = tbody.querySelectorAll('tr');
  rows.forEach(row => {
    const link = row.querySelector('a');
    if (!link) return;

    const id = link.textContent?.trim() ?? '';
    if (!id) return;

    const copyCampaign = createColumn([createCopyButton(id)]);
    row.append(copyCampaign);
  });

  initUpdateBody(ui);
}
