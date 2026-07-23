import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { showErrorAlert } from './components/Alerts';
import { CSVToArray, parseCSV } from './helpers/Csvfns';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CampaignRowData {
  [selector: string]: string;
}

interface StoredCampaign {
  id: number;
  title: string;
  data: Record<string, CampaignRowData>;
}

const OPTION_KEYS = ["[name='shop']", "[name='template']", "[name='language[]']", "[name='cta_lang']"] as const;

const INPUT_KEYS = [
  "[name='title']",
  "[name='body']",
  "[name='click_action']",
  "[name='icon']",
  "[name='image']",
] as const;

// ---------------------------------------------------------------------------
// Population Helpers
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
// Macro
// ---------------------------------------------------------------------------
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const escKeyEvent = new KeyboardEvent('keydown', {
  key: 'Escape',
  keyCode: 27,
  which: 27,
  bubbles: true,
});

async function runPushForSlug(slug: string, isTest: boolean, onProgress: (msg: string) => void): Promise<boolean> {
  onProgress(`Processing ${slug.toUpperCase()}...`);

  await delay(800);

  const buttonSelector = isTest 
    ? "input#test[value='Test']" 
    : "input[type='submit'][name='submit'][value='Send']";

  const button = document.querySelector<HTMLElement>(buttonSelector);
  if (!button) {
    onProgress('Błąd: brak przycisku');
    await showErrorAlert('Nie znaleziono przycisku akcji.');
    return false;
  }

  button.click();
  await delay(500);
  document.dispatchEvent(escKeyEvent);
  await delay(500);

  onProgress(`${slug.toUpperCase()} - Done`);
  return true;
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------
export default function App() {
  const [campaign, setCampaign] = useState<StoredCampaign | null>(null);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [isRandomTesting, setIsRandomTesting] = useState(false);
  const [isSendingAll, setIsSendingAll] = useState(false);

  // Clear old campaign on every load
  useEffect(() => {
    browser.storage.local.remove('push_campaign');
  }, []);

  const handleFile = useCallback(async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;

    // Clear previous campaign
    await browser.storage.local.remove('push_campaign');

    const reader = new FileReader();
    reader.onload = async () => {
      const parsedCSV = CSVToArray(reader.result as string);
      const rows = parseCSV(parsedCSV);

      const stored: StoredCampaign = {
        id: Date.now(),
        title: 'Push Campaign',
        data: rows,
      };

      await browser.storage.local.set({ push_campaign: stored });
      setCampaign(stored);
      setActiveSlug(null);
    };
    reader.readAsText(file);
  }, []);

  const populateRow = useCallback(async (slug: string): Promise<boolean> => {
    if (!campaign) return false;

    const rowData = campaign.data[slug];
    if (!rowData) return false;

    const optionsData: Record<string, string> = {};
    const inputsData: { selector: string; value: string }[] = [];

    for (const key in rowData) {
      if ((OPTION_KEYS as readonly string[]).includes(key)) optionsData[key] = rowData[key];
      if ((INPUT_KEYS as readonly string[]).includes(key)) inputsData.push({ selector: key, value: rowData[key] });
    }

    const titleValue = inputsData.find(i => i.selector === "[name='title']")?.value ?? '';
    const bodyValue = inputsData.find(i => i.selector === "[name='body']")?.value ?? '';

    if (titleValue.includes('XX') || bodyValue.includes('XX')) {
      await showErrorAlert('W Twoim tekście jest XX zamiast wartości, sprawdź przed wysyłką.');
      return false;
    }

    OPTION_KEYS.forEach((selector) => {
      const value = optionsData[selector];
      if (value !== undefined) setTimeout(() => setOptionValue({ selector, value }), 400);
    });

    inputsData.forEach(setInputValue);

    setActiveSlug(slug);
    return true;
  }, [campaign]);

  const runForSlug = useCallback(async (slug: string, isTest: boolean) => {
    const populated = await populateRow(slug);
    if (!populated) return false;
    await delay(800);
    await runPushForSlug(slug, isTest, (msg) => console.log(msg));
    return true;
  }, [populateRow]);

  const handleTest3Random = useCallback(async () => {
    if (!campaign || isRandomTesting) return;

    setIsRandomTesting(true);
    const slugs = Object.keys(campaign.data);
    const shuffled = slugs.sort(() => Math.random() - 0.5);
    const randomThree = shuffled.slice(0, 3);

    for (let i = 0; i < randomThree.length; i++) {
      const slug = randomThree[i];
      setActiveSlug(slug);
      await runForSlug(slug, true);
      await delay(1200);
    }

    setIsRandomTesting(false);
    setActiveSlug(null);
  }, [campaign, runForSlug, isRandomTesting]);

  const handleSendAll = useCallback(async () => {
    if (!campaign || isSendingAll) return;

    const result = await Swal.fire({
      title: 'Send ALL rows?',
      text: `This will send ${Object.keys(campaign.data).length} notifications. Are you sure?`,
      icon: 'warning',
      showCancelButton: true,
    });

    if (!result.isConfirmed) return;

    setIsSendingAll(true);
    const slugs = Object.keys(campaign.data);

    for (let i = 0; i < slugs.length; i++) {
      const slug = slugs[i];
      setActiveSlug(slug);
      await runForSlug(slug, false);
      await delay(1500);
    }

    setIsSendingAll(false);
    setActiveSlug(null);
  }, [campaign, runForSlug, isSendingAll]);

  const handleTestRow = useCallback(async (slug: string) => {
    if (isRandomTesting || isSendingAll || busySlug) return;
    setBusySlug(slug);
    await runForSlug(slug, true);
    setBusySlug(null);
  }, [runForSlug, isRandomTesting, isSendingAll, busySlug]);

  const handleSendRow = useCallback(async (slug: string) => {
    if (isRandomTesting || isSendingAll || busySlug) return;

    const result = await Swal.fire({
      title: `Send ${slug.toUpperCase()}?`,
      text: 'This will send the notification!',
      icon: 'warning',
      showCancelButton: true,
    });

    if (!result.isConfirmed) return;

    setBusySlug(slug);
    await runForSlug(slug, false);
    setBusySlug(null);
  }, [runForSlug, isRandomTesting, isSendingAll, busySlug]);

  return (
    <div>
      <div style={{
        position: 'fixed',
        right: '20px',
        top: '20px',
        background: '#1f2937',
        padding: '15px',
        borderRadius: '8px',
        color: '#fff',
        zIndex: 9999,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        maxWidth: '480px',
        maxHeight: '75vh',
        overflowY: 'auto'
      }}>
        <label style={{ cursor: 'pointer', display: 'block', marginBottom: '12px', fontWeight: 'bold' }}>
          📎 Upload CSV
          <input type="file" accept="text/csv" onChange={handleFile} style={{ display: 'none' }} />
        </label>

        {!campaign || Object.keys(campaign.data).length === 0 ? (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '30px 10px' }}>
            No rows loaded yet.<br />Please upload a CSV file.
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                onClick={handleTest3Random}
                disabled={isRandomTesting || isSendingAll}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                }}
              >
                {isRandomTesting ? 'Testing 3 Random...' : '🚀 Test 3 Random'}
              </button>

              <button
                onClick={handleSendAll}
                disabled={isSendingAll || isRandomTesting}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                }}
              >
                {isSendingAll ? 'Sending All...' : '⚠️ Send All'}
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#374151' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Row / Language</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Test</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Send</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(campaign.data).map((slug) => (
                  <tr key={slug} style={{ borderBottom: '1px solid #4b5563' }}>
                    <td style={{ 
                      padding: '10px', 
                      fontWeight: activeSlug === slug ? 'bold' : 'normal',
                      color: activeSlug === slug ? '#60a5fa' : '#fff'
                    }}>
                      {slug.toUpperCase()}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleTestRow(slug)}
                        disabled={!!busySlug || isRandomTesting || isSendingAll}
                        style={{ padding: '7px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}
                      >
                        {busySlug === slug ? '...' : 'Test'}
                      </button>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleSendRow(slug)}
                        disabled={!!busySlug || isRandomTesting || isSendingAll}
                        style={{ padding: '7px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px' }}
                      >
                        {busySlug === slug ? '...' : 'Send'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}