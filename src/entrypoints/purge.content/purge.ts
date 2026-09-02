type Logger = {
  error: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
};

const logger: Logger = {
  error: (...args) => console.error('[Purge]', ...args),
  info: (...args) => console.info('[Purge]', ...args),
  debug: (...args) => console.debug('[Purge]', ...args),
};

const STORAGE_KEY = 'purgeSavedUrls';
const REQUEST_URL = 'https://www.prologistics.info/purge.php';

function getSavedUrls(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as string[];
  } catch {
    return [];
  }
}

function setSavedUrls(urls: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
}

function createButton(text: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button'; // prevent form submit
  btn.textContent = text;
  btn.style.cssText = `
    width: 100%;
    margin-top: 0.5rem;
    height: 100%;
    font-family: Arial;
    display: block;
    font-size: 11px;
  `;
  btn.addEventListener('click', onClick);
  return btn;
}

function addLogRow(
  tbody: HTMLTableSectionElement,
  index: number,
  domain: string,
  urls: string,
  status: string,
  details: string,
): void {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${index}</td>
    <td>${domain}</td>
    <td><pre style="white-space:pre-wrap;max-width:300px;">${urls}</pre></td>
    <td>${status}</td>
    <td><pre style="white-space:pre-wrap;max-width:300px;">${details}</pre></td>
  `;
  tbody.appendChild(row);
}

export function setupPurge(): void {
  const urlsTextarea = document.querySelector<HTMLTextAreaElement>('textarea[name="urls"]');
  const domainSelect = document.querySelector<HTMLSelectElement>('select[name="domain"]');
  const purgeButton = document.querySelector<HTMLInputElement>(
    'input[name="purge"][type="submit"]',
  );

  if (!urlsTextarea) {
    logger.error('Textarea for URLs not found.');
    return;
  }
  if (!domainSelect) {
    logger.error('Domain select not found.');
    return;
  }
  if (!purgeButton) {
    logger.error('Purge button not found.');
    return;
  }

  urlsTextarea.style.height = '200px';
  urlsTextarea.style.width = '300px';
  urlsTextarea.style.resize = 'none';

  // --- Purge All Shops ---
  const purgeAllShopsButton = document.createElement('input');
  purgeAllShopsButton.style.marginLeft = '0.5rem';
  purgeAllShopsButton.type = 'submit';
  purgeAllShopsButton.name = 'PurgeAllShops';
  purgeAllShopsButton.value = 'Purge All Shops';
  purgeAllShopsButton.id = 'purgeAllShopsButton';
  purgeButton.insertAdjacentElement('afterend', purgeAllShopsButton);

  // --- Save URLs ---
  const saveUrlsButton = document.createElement('button');
  saveUrlsButton.type = 'button';
  saveUrlsButton.textContent = 'Save URL(s)';
  saveUrlsButton.style.cssText = `
    margin-left: 0.5rem;
    font-family: Arial;
    font-size: 11px;
  `;
  purgeAllShopsButton.insertAdjacentElement('afterend', saveUrlsButton);

  let savedUrlsSelect: HTMLSelectElement | null = null;
  let insertBtn: HTMLButtonElement | null = null;

  function insertSelectedUrls(): void {
    if (!savedUrlsSelect || !urlsTextarea) return;

    const selected = Array.from(savedUrlsSelect.selectedOptions).map(opt => opt.value);
    if (!selected.length) return;

    const current = urlsTextarea.value.trim();
    if (current) {
      const currentSet = new Set(
        current
          .split(/\r?\n/)
          .map(u => u.trim())
          .filter(Boolean),
      );
      let next = current;
      selected.forEach(url => {
        if (!currentSet.has(url)) {
          next += '\n' + url;
        }
      });
      urlsTextarea.value = next;
    } else {
      urlsTextarea.value = selected.join('\n');
    }
  }

  function renderSavedUrlsSelect(): void {
    savedUrlsSelect?.remove();
    insertBtn?.remove();

    const savedUrls = getSavedUrls();

    savedUrlsSelect = document.createElement('select');
    savedUrlsSelect.multiple = true;
    savedUrlsSelect.size = 9;
    savedUrlsSelect.style.cssText = 'height: 100%; width: 100%;';

    savedUrls.forEach(url => {
      const opt = document.createElement('option');
      opt.value = url;
      opt.textContent = url.length > 80 ? `${url.slice(0, 80)}...` : url;
      savedUrlsSelect!.appendChild(opt);
    });

    savedUrlsSelect.addEventListener('dblclick', insertSelectedUrls);

    insertBtn = createButton('Insert Selected URL(s)', insertSelectedUrls);

    const removeSelectedBtn = createButton('Delete selected from saved', () => {
      if (!savedUrlsSelect) return;
      const selected = Array.from(savedUrlsSelect.selectedOptions).map(opt => opt.value);
      if (!selected.length) {
        alert('Select URLs to delete.');
        return;
      }
      const next = getSavedUrls().filter(url => !selected.includes(url));
      setSavedUrls(next);
      alert('Deleted selected URLs.');
      renderSavedUrlsSelect();
    });

    const clearBtn = createButton('Clear Saved URLs', () => {
      if (confirm('Are you sure you want to remove all saved URLs?')) {
        localStorage.removeItem(STORAGE_KEY);
        renderSavedUrlsSelect();
      }
    });

    if (savedUrls.length === 0) {
      clearBtn.disabled = true;
      removeSelectedBtn.disabled = true;
      insertBtn.disabled = true;
    }

    const controls: HTMLElement[] = [
      savedUrlsSelect,
      insertBtn,
      removeSelectedBtn,
      clearBtn,
    ];

    const textareaTd = urlsTextarea!.closest('td');
    if (textareaTd?.parentElement) {
      const nextTd = textareaTd.nextElementSibling as HTMLElement | null;
      

      if (nextTd?.classList.contains('multiselect-td')) {
        nextTd.innerHTML = '';
        controls.forEach(ctrl => nextTd.appendChild(ctrl));
      } else {
        const multiTd = document.createElement('td');
        multiTd.className = 'multiselect-td';
        multiTd.style.cssText = 'vertical-align: top; height: 100%;';
        controls.forEach(ctrl => multiTd.appendChild(ctrl));
        textareaTd.parentElement.insertBefore(multiTd, textareaTd.nextSibling);
      }
    } else {
      saveUrlsButton.insertAdjacentElement('afterend', savedUrlsSelect);
      controls.slice(1).reduce((prev, curr) => {
        prev.insertAdjacentElement('afterend', curr);
        return curr;
      }, savedUrlsSelect as HTMLElement);
    }
  }

  saveUrlsButton.addEventListener('click', () => {
    const urlsValue = urlsTextarea.value.trim();
    if (!urlsValue) {
      alert('No URLs to save.');
      return;
    }

    const savedUrls = getSavedUrls();
    const urlsArr = urlsValue
      .split(/\r?\n/)
      .map(u => u.trim())
      .filter(Boolean);

    let added = 0;
    urlsArr.forEach(url => {
      if (!savedUrls.includes(url)) {
        savedUrls.push(url);
        added++;
      }
    });

    if (added > 0) {
      setSavedUrls(savedUrls);
      alert(`Saved ${added} new URL(s)!`);
      renderSavedUrlsSelect();
    } else {
      alert('These URL(s) are already saved.');
    }
  });

  renderSavedUrlsSelect();

  // --- Log table ---
  let logTable = document.getElementById('purge-log-table') as HTMLTableElement | null;
  if (!logTable) {
    logTable = document.createElement('table');
    logTable.id = 'purge-log-table';
    logTable.style.marginTop = '40px';
    logTable.style.width = '100%';
    logTable.innerHTML = `
      <thead>
        <tr>
          <th>#</th>
          <th>Domain</th>
          <th>URLs</th>
          <th>Status</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    purgeButton.parentElement?.appendChild(logTable);
  }

  const logTbody = logTable.querySelector('tbody');
  if (!logTbody) {
    logger.error('Log table body not found.');
    return;
  }

  // --- Purge All Shops click ---
  purgeAllShopsButton.addEventListener('click', async event => {
    event.preventDefault();

    const urlsValue = urlsTextarea.value.trim();
    if (!urlsValue) {
      logger.error('No URLs provided.');
      return;
    }

    logTbody.innerHTML = '';

    const domains = Array.from(domainSelect.options).map(opt => opt.value);

    let index = 1;
    for (const domain of domains) {
      const formData = new FormData();
      formData.append('domain', domain);
      formData.append('prio', '1');
      formData.append('urls', urlsValue);
      formData.append('purge', 'Purge');

      let status = '';
      let details = '';

      try {
        const response = await fetch(REQUEST_URL, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        logger.debug('Wyslano request:', { domain, urls: urlsValue });

        if (response.ok) {
          status = `OK (${response.status})`;
          details = 'Success';
          logger.info(`Request for ${domain} successful! Status: ${response.status}`);
        } else {
          status = `Error (${response.status})`;
          details = await response.text();
          logger.error(`Request for ${domain} failed! Status: ${response.status}`);
          logger.error(`Error details for ${domain}:`, details);
        }
      } catch (error) {
        status = 'Fetch error';
        details = String(error);
        logger.error(`An error occurred for ${domain}:`, error);
      }

      addLogRow(logTbody, index++, domain, urlsValue, status, details);
    }
  });
}