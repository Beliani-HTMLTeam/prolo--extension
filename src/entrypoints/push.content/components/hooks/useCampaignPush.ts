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

// Confirmation state interface
export interface ConfirmationState {
  isOpen: boolean;
  slug: string | null;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
}

export interface SuccessState {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

/**
 * Populates the host form from campaign row data and triggers Test / Send actions.
 */
export function useCampaignPush(campaign: StoredCampaign | null) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [isRandomTesting, setIsRandomTesting] = useState(false);
  const [isSendingAll, setIsSendingAll] = useState(false);
  const [testProgress, setTestProgress] = useState<{ current: number; total: number } | null>(null);
  const [sendAllProgress, setSendAllProgress] = useState<{ current: number; total: number } | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationState>({
    isOpen: false,
    slug: null,
    onConfirm: null,
    onCancel: null,
  });
   const [success, setSuccess] = useState<SuccessState>({
    isOpen: false,
    title: '',
    message: '',
    onClose: () => {},
  });

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
      
      // Find the form and prevent its default submission
      const form = document.querySelector<HTMLFormElement>("[action='/push_notifications.php']");
      let preventSubmit = false;
      
      const handleSubmit = (e: Event) => {
        if (preventSubmit) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      
      if (form) {
        form.addEventListener('submit', handleSubmit);
      }
      
      try {
        const buttonSelector = isTest ? "input#test[value='Test']" : "input[type='submit'][name='submit'][value='Send']";
        const button = document.querySelector<HTMLElement>(buttonSelector);
        if (!button) {
          await showErrorAlert('Nie znaleziono przycisku akcji.');
          return false;
        }

        preventSubmit = true;
        button.click();
        await delay(500);
        document.dispatchEvent(escKeyEvent);
        await delay(500);
        
        return true;
      } finally {
        preventSubmit = false;
        if (form) {
          form.removeEventListener('submit', handleSubmit);
        }
      }
    },
    [populateRow],
  );

  const handleTest3Random = useCallback(async () => {
    if (!campaign || isRandomTesting) return;

    setIsRandomTesting(true);

    const slugs = Object.keys(campaign.data);
    const shuffled = slugs.sort(() => Math.random() - 0.5);
    const randomThree = shuffled.slice(0, 3);

    setTestProgress({ current: 0, total: randomThree.length });

    for (let i = 0; i < randomThree.length; i++) {
      const slug = randomThree[i];
      setActiveSlug(slug);
      setTestProgress({ current: i + 1, total: randomThree.length });
      await runPushForSlug(slug, true);
      await delay(1200);
    }

    setIsRandomTesting(false);
    setActiveSlug(null);
    setTestProgress(null);
  }, [campaign, isRandomTesting, runPushForSlug]);

  // Show confirmation dialog
  const showConfirmation = useCallback((slug: string, onConfirm: () => void) => {
    console.log('🔔 Showing confirmation for:', slug);
    
    const onCancel = () => {
      console.log('❌ Confirmation cancelled');
      setConfirmation({
        isOpen: false,
        slug: null,
        onConfirm: null,
        onCancel: null,
      });
    };

    setConfirmation({
      isOpen: true,
      slug,
      onConfirm: () => {
        console.log('✅ Confirmation confirmed for:', slug);
        onConfirm();
        setConfirmation({
          isOpen: false,
          slug: null,
          onConfirm: null,
          onCancel: null,
        });
      },
      onCancel,
    });
  }, []);

  const handleSendAll = useCallback(async () => {
    if (!campaign || isSendingAll) return;
    console.log('📤 Send All clicked');

    showConfirmation('ALL ROWS', async () => {
      console.log('🚀 Sending all rows...');
      setIsSendingAll(true);
      
      const slugs = Object.keys(campaign.data);
      setSendAllProgress({ current: 0, total: slugs.length });
      
      try {
        for (let i = 0; i < slugs.length; i++) {
          const slug = slugs[i];
          setActiveSlug(slug);
          setSendAllProgress({ current: i + 1, total: slugs.length });
          await runPushForSlug(slug, false);
          await delay(1500);
        }
        
        console.log('✅ All rows sent successfully!');
        
        // Show completion message
        await Swal.fire({
          icon: 'success',
          title: 'All Sent!',
          text: `✅ All ${slugs.length} notifications sent successfully!`,
          timer: 2000,
          showConfirmButton: true,
        });
        
        // Reset states
        setIsSendingAll(false);
        setActiveSlug(null);
        setSendAllProgress(null);
        
        // Reload the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 500);
        
      } catch (error) {
        console.error('Error sending all rows:', error);
        await showErrorAlert('Error sending notifications. Please try again.');
        setIsSendingAll(false);
        setActiveSlug(null);
        setSendAllProgress(null);
      }
    });
  }, [campaign, runPushForSlug, isSendingAll, showConfirmation]);

  const handleTestRow = useCallback(
    async (slug: string) => {
      if (isRandomTesting || isSendingAll || busySlug) return;
      console.log('🧪 Test row clicked for:', slug);
      setBusySlug(slug);
      await runPushForSlug(slug, true);
      setBusySlug(null);
    },
    [runPushForSlug, isRandomTesting, isSendingAll, busySlug],
  );

  const handleSendRow = useCallback(
    async (slug: string) => {
      if (isRandomTesting || isSendingAll || busySlug) return;
      console.log('📤 Send row clicked for:', slug);

      showConfirmation(slug, async () => {
        console.log('🚀 Sending row:', slug);
        setBusySlug(slug);
        await runPushForSlug(slug, false);
        setBusySlug(null);
      });
    },
    [runPushForSlug, isRandomTesting, isSendingAll, busySlug, showConfirmation],
  );

  // Close confirmation
  const closeConfirmation = useCallback(() => {
    console.log('🔚 Closing confirmation');
    if (confirmation.onCancel) {
      confirmation.onCancel();
    } else {
      setConfirmation({
        isOpen: false,
        slug: null,
        onConfirm: null,
        onCancel: null,
      });
    }
  }, [confirmation]);

   const showSuccess = useCallback((title: string, message: string): Promise<void> => {
    return new Promise<void>((resolve) => {
      setSuccess({
        isOpen: true,
        title,
        message,
        onClose: () => {
          setSuccess({
            isOpen: false,
            title: '',
            message: '',
            onClose: () => {},
          });
          resolve();
        },
      });
    });
  }, []);

    const closeSuccess = useCallback(() => {
    setSuccess({
      isOpen: false,
      title: '',
      message: '',
      onClose: () => {},
    });
  }, []);

  return {
    activeSlug,
    setActiveSlug,
    busySlug,
    isRandomTesting,
    isSendingAll,
    testProgress,
    sendAllProgress,
    confirmation,
    closeConfirmation,
    populateRow,
    runPushForSlug,
    handleTest3Random,
    handleSendAll,
    handleTestRow,
    handleSendRow,
      success,
    closeSuccess,
    showSuccess,
  };
}