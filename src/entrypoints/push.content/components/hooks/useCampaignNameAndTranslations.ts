import { PushTranslations } from '@/entrypoints/issue.content/lib/types';
import { useCallback, useState } from 'react';
import Swal from 'sweetalert2';
import { parseCampaignName } from '../../helpers/slugMapper';
import { fetchPushTranslations } from '@/entrypoints/issue.content/api/issueData';
import { showErrorAlert } from '../Alerts';
import { DEFAULT_SPREADSHEET } from '../../const/defaults';

export function useCampaignNameAndTranslations(spreadsheetUrl: string = DEFAULT_SPREADSHEET, initialName = '') {
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

      const result = checkCampaignNameDate(name);

      setIsLoadingTranslations(true);
      try {
        let year = '2026';
        if (result && result.hasDate) {
          year = result.year;
        } else {
          year = new Date().getFullYear().toString();
        }

        const translations = await fetchPushTranslations(spreadsheetUrl, year, name);
        setPushTranslations(translations);

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

  const handleCampaignNameChange = useCallback(
    (name: string) => {
      setCampaignName(name);
      checkCampaignNameDate(name);
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
