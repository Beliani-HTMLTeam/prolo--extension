import { useCallback, useState } from 'react';
import Swal from 'sweetalert2';
import type { StoredCampaign } from './useCustomOverrides';
import { showErrorAlert } from '../Alerts';

const OPTION_KEYS = ["[name='shop']", "[name='template']", "[name='language[]']", "[name='cta_lang']"] as const;
const INPUT_KEYS = [
  "[name='title']",
  "[name='body']",
  "[name='click_action']",
  "[name='icon']",
  "[name='image']",
  "[name='lp_path']",
] as const;

function setOptionValue({ selector, value }: { selector: string; value: string }) {
  const node = document.querySelector<HTMLSelectElement>(selector);
  if (!node) {
    showErrorAlert(`Selector ${selector} not found.`);
    return;
  }
  Array.from(node.querySelectorAll('option')).forEach(option => {
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

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const escKeyEvent = new KeyboardEvent('keydown', {
  key: 'Escape',
  keyCode: 27,
  which: 27,
  bubbles: true,
});

/**
 * Populates the host form from campaign row data and triggers Test / Send actions.
 */
export function useCampaignPush(campaign: StoredCampaign | null) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [isRandomTesting, setIsRandomTesting] = useState(false);
  const [isSendingAll, setIsSendingAll] = useState(false);

  const populateRow = useCallback(
    async (slug: string): Promise<boolean> => {
      if (!campaign) return false;
      const rowData = campaign.data[slug];
      if (!rowData) return false;

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

      const titleValue = inputsData.find(i => i.selector === "[name='title']")?.value ?? '';
      const bodyValue = inputsData.find(i => i.selector === "[name='body']")?.value ?? '';

      if (titleValue.includes('XX') || bodyValue.includes('XX')) {
        await showErrorAlert('W Twoim tekście jest XX zamiast wartości, sprawdź przed wysyłką.');
        return false;
      }

      OPTION_KEYS.forEach(selector => {
        const value = optionsData[selector];
        if (value !== undefined) {
          setTimeout(() => setOptionValue({ selector, value }), 400);
        }
      });

      inputsData.forEach(setInputValue);
      setActiveSlug(slug);
      return true;
    },
    [campaign],
  );

  const runPushForSlug = useCallback(
    async (slug: string, isTest: boolean): Promise<boolean> => {
      const populated = await populateRow(slug);
      if (!populated) return false;

      await delay(800);
      const buttonSelector = isTest
        ? "input#test[value='Test']"
        : "input[type='submit'][name='submit'][value='Send']";
      const button = document.querySelector<HTMLElement>(buttonSelector);
      if (!button) {
        await showErrorAlert('Nie znaleziono przycisku akcji.');
        return false;
      }

      button.click();
      await delay(500);
      document.dispatchEvent(escKeyEvent);
      await delay(500);
      return true;
    },
    [populateRow],
  );

  const handleTest3Random = useCallback(async () => {
    if (!campaign || isRandomTesting) return;
    setIsRandomTesting(true);

    const slugs = Object.keys(campaign.data);
    const shuffled = [...slugs].sort(() => Math.random() - 0.5);
    const randomThree = shuffled.slice(0, 3);

    for (const slug of randomThree) {
      setActiveSlug(slug);
      await runPushForSlug(slug, true);
      await delay(1200);
    }

    setIsRandomTesting(false);
    setActiveSlug(null);
  }, [campaign, runPushForSlug, isRandomTesting]);

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
    for (const slug of slugs) {
      setActiveSlug(slug);
      await runPushForSlug(slug, false);
      await delay(1500);
    }

    setIsSendingAll(false);
    setActiveSlug(null);
  }, [campaign, runPushForSlug, isSendingAll]);

  const handleTestRow = useCallback(
    async (slug: string) => {
      if (isRandomTesting || isSendingAll || busySlug) return;
      setBusySlug(slug);
      await runPushForSlug(slug, true);
      setBusySlug(null);
    },
    [runPushForSlug, isRandomTesting, isSendingAll, busySlug],
  );

  const handleSendRow = useCallback(
    async (slug: string) => {
      if (isRandomTesting || isSendingAll || busySlug) return;
      const result = await Swal.fire({
        title: `Send ${slug.toUpperCase()}?`,
        text: 'This will send the notification!',
        icon: 'warning',
        showCancelButton: true,
      });

      if (!result.isConfirmed) return;

      setBusySlug(slug);
      await runPushForSlug(slug, false);
      setBusySlug(null);
    },
    [runPushForSlug, isRandomTesting, isSendingAll, busySlug],
  );

  return {
    activeSlug,
    setActiveSlug,
    busySlug,
    isRandomTesting,
    isSendingAll,
    populateRow,
    runPushForSlug,
    handleTest3Random,
    handleSendAll,
    handleTestRow,
    handleSendRow,
  };
}
