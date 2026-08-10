import { PushTranslations } from '@/entrypoints/issue.content/lib/types';
import { useCallback, useState } from 'react';
import Swal from 'sweetalert2';
import { parseCampaignName } from '../../helpers/slugMapper';
import { fetchPushTranslations } from '@/entrypoints/issue.content/api/issueData';
import { showErrorAlert } from '../Alerts';


const DEFAULT_SPREADSHEET =
  'https://docs.google.com/spreadsheets/d/1RcsQspit0B3b3xX1NwZ9RWnUzZrkoVDULu2cnPMZ04U/edit?gid=337547236#gid=337547236';

/**
 * Manages campaign name, date warnings, and on-demand push translation fetching.
 */
export function useCampaignNameAndTranslations(
  spreadsheetUrl: string = DEFAULT_SPREADSHEET,
  initialName = '',
) {
  const [campaignName, setCampaignName] = useState(initialName);
  const [pushTranslations, setPushTranslations] = useState<PushTranslations | null>(null);
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(false);
  const [dateWarning, setDateWarning] = useState<string | null>(null);

  const checkCampaignNameDate = useCallback((name: string) => {
    if (!name || !name.trim()) {
      setDateWarning(null);
      return null;
    }

    const result = parseCampaignName(name);
    if (!result.hasDate) {
      setDateWarning(
        `No date found in campaign name. Using today's date: ${result.day}.${result.month}.${result.year}`,
      );
    } else {
      setDateWarning(null);
    }

    return result;
  }, []);

  const fetchTranslations = useCallback(
    async (name: string) => {
      if (!name || !name.trim()) return null;

      console.log(`Fetching translations for: ${name}`);

      const result = checkCampaignNameDate(name);

      setIsLoadingTranslations(true);
      try {
        const parts = name.split(' - ');
        const campaignPart = parts.length > 1 ? parts.slice(1).join(' - ') : name;

        let year = '2026';
        if (result && result.hasDate) {
          year = result.year;
        } else {
          year = new Date().getFullYear().toString();
        }

        console.log(`Fetching translations for: ${name} (year: ${year}, campaign: ${campaignPart})`);

        const translations = await fetchPushTranslations(spreadsheetUrl, year, name);
        setPushTranslations(translations);

        console.log('Translations fetched successfully');

        console.log("translations", translations)
        if (result && !result.hasDate) {
          await Swal.fire({
            icon: 'warning',
            title: 'No Date Found',
            text: `No date found in campaign name. Using today's date: ${result.day}.${result.month}.${result.year}`,
            timer: 3000,
            showConfirmButton: true,
          });
        }

        return translations;
      } catch (error) {
        console.error('Error fetching push translations:', error);
        await showErrorAlert('Failed to fetch push translations. Please try again.');
        return null;
      } finally {
        setIsLoadingTranslations(false);
      }
    },
    [spreadsheetUrl, checkCampaignNameDate],
  );

  // Only update the name and check date, do NOT fetch translations
  const handleCampaignNameChange = useCallback(
    (name: string) => {
      setCampaignName(name);
      checkCampaignNameDate(name);
      // Clear previous translations when name changes
      setPushTranslations(null);
    },
    [checkCampaignNameDate],
  );

  const clearTranslations = useCallback(() => {
    setPushTranslations(null);
    setDateWarning(null);
  }, []);

  return {
    campaignName,
    setCampaignName,
    pushTranslations,
    setPushTranslations,
    isLoadingTranslations,
    dateWarning,
    checkCampaignNameDate,
    fetchTranslations,
    handleCampaignNameChange,
    clearTranslations,
  };
}