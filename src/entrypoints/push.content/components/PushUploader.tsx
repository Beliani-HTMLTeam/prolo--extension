import { createRoot } from 'react-dom/client';
import { useCallback, useEffect, useState } from 'react';
import { showErrorAlert } from './Alerts';
import { CSVToArray, parseCSV } from '../helpers/Csvfns';

// ---------------------------------------------------------------------------
// Types (replaces the old PushCampaign class — a plain shape is enough
// since nothing here needs class behavior)
// ---------------------------------------------------------------------------

interface CampaignRowData {
  [selector: string]: string;
}

interface StoredCampaign {
  id: number;
  title: string;
  data: Record<string, CampaignRowData>;
}

// Ordering matters: cta_lang must be applied after shop, see handleSelect below.
const OPTION_KEYS = ["[name='shop']", "[name='template']", "[name='language[]']", "[name='cta_lang']"] as const;

const INPUT_KEYS = [
  "[name='title']",
  "[name='body']",
  "[name='click_action']",
  "[name='icon']",
  "[name='image']",
] as const;

// ---------------------------------------------------------------------------
// DOM helpers — these still reach into the legacy form directly, since the
// target inputs/selects live outside this component's own tree.
// ---------------------------------------------------------------------------

function setOptionValue({ selector, value }: { selector: string; value: string }) {
  const node = document.querySelector<HTMLSelectElement>(selector);
  if (!node) {
    showErrorAlert(`Selector ${selector} not found.`);
    return;
  }
  Array.from(node.querySelectorAll('option')).forEach((option) => {
    option.selected = option.value === value;
  });
  node.dispatchEvent(new Event('change'));
}

function setInputValue({ selector, value }: { selector: string; value: string }) {
  const node = document.querySelector<HTMLInputElement>(selector);
  if (!node) {
    showErrorAlert(`Selector ${selector} not found.`);
    return;
  }
  node.value = value;
  node.dispatchEvent(new Event('change'));
}

// ---------------------------------------------------------------------------
// Mount helper — replicates the original appendUI(): wraps the form's <h2>
// title in a table row, and mounts this component into the second cell.
// ---------------------------------------------------------------------------

export function mountCsvUploader() {
  const form = document.querySelector<HTMLFormElement>("[action='/push_notifications.php']");
  if (!form) {
    showErrorAlert('Form not found.');
    return;
  }

  const formTitle = form.querySelector('h2');
  const formTitleParent = formTitle?.parentNode;
  if (!formTitle || !formTitleParent) {
    showErrorAlert('Form title not found.');
    return;
  }

  const table = document.createElement('table');
  table.style.width = '100%';

  const tr = document.createElement('tr');
  const td1 = document.createElement('td');
  const td2 = document.createElement('td');
  td2.setAttribute('align', 'right');

  td1.append(formTitle); // moves the existing title node into the new row
  tr.append(td1, td2);
  table.append(tr);
  formTitleParent.append(table);

  createRoot(td2).render(<CsvCampaignUploader />);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CsvCampaignUploader() {
  const [campaign, setCampaign] = useState<StoredCampaign | null>(null);
  const [selectedSlug, setSelectedSlug] = useState('');

  useEffect(() => {
    browser.storage.local.get('push_campaign').then((result) => {
      const stored = result.push_campaign as StoredCampaign | undefined;
      if (stored) setCampaign(stored);
    });
  }, []);

  const handleFile = useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const parsedCSV = CSVToArray(reader.result as string);
      const rows = parseCSV(parsedCSV);

      const stored: StoredCampaign = {
        id: Date.now(),
        title: 'Title',
        data: rows,
      };

      await browser.storage.local.set({ push_campaign: stored });
      setCampaign(stored);
      setSelectedSlug(''); // reset to placeholder for the new campaign
    };
    reader.readAsText(file);
  }, []);

  const handleSelect = useCallback(
    async (ev: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedValue = ev.target.value;

      console.log('Selected value:', selectedValue);

      setSelectedSlug(selectedValue);

      if (!campaign) return;

      const rowData = campaign.data[selectedValue];
      if (!rowData) return;

      const optionsData: Record<string, string> = {};
      const inputsData: { selector: string; value: string }[] = [];

      for (const key in rowData) {
        if ((OPTION_KEYS as readonly string[]).includes(key)) {
          optionsData[key] = rowData[key];
        }
        if ((INPUT_KEYS as readonly string[]).includes(key)) {
          inputsData.push({ selector: key, value: rowData[key] });
        }
      }

      const titleValue = inputsData.find((item) => item.selector === "[name='title']")?.value ?? '';
      console.log('Title value:', titleValue);
      const bodyValue = inputsData.find((item) => item.selector === "[name='body']")?.value ?? '';
      console.log('Body value:', bodyValue);

      if (titleValue.includes('XX') || bodyValue.includes('XX')) {
        await showErrorAlert('W Twoim tekście jest XX zamiast wartości, sprawdź przed wysyłką.');
        return;
      }

      // Keep ordering of name attributes (cta_lang should be selected after shop).
      // Same delay for every key on purpose — setTimeout callbacks with an
      // identical delay still run in the order they were scheduled.
      OPTION_KEYS.forEach((selector) => {
        const value = optionsData[selector];
        if (value === undefined) return;
        setTimeout(() => setOptionValue({ selector, value }), 500);
      });

      inputsData.forEach(setInputValue);
    },
    [campaign]
  );

  return (
    <>
      <label style={{ cursor: 'pointer' }}>
        Upload CSV
        <input type="file" accept="text/csv" onChange={handleFile} style={{ display: 'none' }} />
      </label>

      {campaign && (
        <select
          key={campaign.id}
          style={{ marginLeft: '0.6rem' }}
          value={selectedSlug}
          onChange={handleSelect}
        >
          <option value="" disabled>
            Select campaign row
          </option>
          {Object.keys(campaign.data).map((key) => (
            <option key={key} value={key}>
              {key.toUpperCase()}
            </option>
          ))}
        </select>
      )}
    </>
  );
}