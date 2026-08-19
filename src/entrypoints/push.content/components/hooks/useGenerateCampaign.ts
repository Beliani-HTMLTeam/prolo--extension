import { useCallback } from 'react';
import Swal from 'sweetalert2';

import { generateCampaignData, getAllSlugs, isValidTemplateId } from '../../helpers/slugMapper';
import { showErrorAlert } from '../Alerts';
import { StoredCampaign, UseGenerateCampaignProps } from '../../types/push';

export function useGenerateCampaign({
  campaignName,
  chdeTemplateId,
  selectedSlugs,
  fetchTranslations,
  checkCampaignNameDate,
  applyOverridesToData,
  generating,
  setCampaign,
  setActiveSlug,
  bumpVersion,
  useOldNewsletterFamily = false,
  oldNewsletterFamilyIds = {},
  onShowSuccess,
}: UseGenerateCampaignProps) {
  const handleGenerateAllSlugs = useCallback(async () => {
    if (generating.isGenerating) {
      return;
    }

    if (!campaignName || !campaignName.trim()) {
      await showErrorAlert('Please select a campaign name first.');
      return;
    }

    setCampaign(null);
    setActiveSlug(null);
    bumpVersion();

    await browser.storage.local.remove('push_campaign');

    generating.setIsGenerating(true);

    try {
      const result = checkCampaignNameDate(campaignName);
      if (result && !result.hasDate) {
        const confirmResult = await Swal.fire({
          icon: 'warning',
          title: 'No Date Found',
          text: `No date found in campaign name. Using today's date: ${result.day}.${result.month}.${result.year}. Continue?`,
          showCancelButton: true,
          confirmButtonText: 'Continue',
          cancelButtonText: 'Cancel',
        });

        if (!confirmResult.isConfirmed) {
          generating.setIsGenerating(false);
          return;
        }
      }

      const translations = await fetchTranslations(campaignName);
      if (!translations) {
        await showErrorAlert('Failed to load translations. Please check the campaign name and try again.');
        generating.setIsGenerating(false);
        return;
      }

      if (!isValidTemplateId(chdeTemplateId)) {
        await showErrorAlert('Please enter a valid CHDE template ID (numbers only).');
        generating.setIsGenerating(false);
        return;
      }

      const slugsToUse = selectedSlugs.length > 0 ? selectedSlugs : getAllSlugs();
      let oldIds = undefined;
      if (useOldNewsletterFamily) {
        const filteredIds: Record<string, string> = {};
        if (oldNewsletterFamilyIds.HR?.trim()) {
          filteredIds.HR = oldNewsletterFamilyIds.HR.trim();
        }
        if (oldNewsletterFamilyIds.SI?.trim()) {
          filteredIds.SI = oldNewsletterFamilyIds.SI.trim();
        }
        if (Object.keys(filteredIds).length > 0) {
          oldIds = filteredIds;
        } else {
          console.warn('Old family selected but no IDs provided for HR/SI');
        }
      }

      let campaignData = generateCampaignData(
        slugsToUse,
        chdeTemplateId,
        translations,
        campaignName,
        undefined,
        undefined,
        oldIds,
      );

      campaignData = applyOverridesToData(campaignData);

      if (Object.keys(campaignData).length === 0) {
        await showErrorAlert('No campaign data generated. Please check your configuration.');
        generating.setIsGenerating(false);
        return;
      }

      const stored: StoredCampaign = {
        id: Date.now(),
        title: campaignName || 'Push Campaign',
        data: campaignData,
      };

      await browser.storage.local.set({ push_campaign: stored });
      setCampaign(stored);
      setActiveSlug(null);

      bumpVersion();

      generating.setIsGenerating(false);

      if (onShowSuccess) {
        await onShowSuccess(
          'Campaign Generated!',
          `Generated ${Object.keys(campaignData).length} rows with template ID ${chdeTemplateId}`,
        );
      }
    } catch (error) {
      console.error('Error generating campaign:', error);
      await showErrorAlert('An error occurred while generating the campaign.');
      generating.setIsGenerating(false);
    }
  }, [
    campaignName,
    chdeTemplateId,
    selectedSlugs,
    fetchTranslations,
    checkCampaignNameDate,
    applyOverridesToData,
    generating,
    setCampaign,
    setActiveSlug,
    bumpVersion,
    useOldNewsletterFamily,
    oldNewsletterFamilyIds,
  ]);

  return { handleGenerateAllSlugs };
}
