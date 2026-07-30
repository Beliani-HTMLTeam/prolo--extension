import { useCallback, useState } from 'react';
import Swal from 'sweetalert2';

import type { StoredCampaign } from './useCustomOverrides';
import type { useGeneratingGuard } from './useGeneratingGuard';
import { generateCampaignData, getAllSlugs, isValidTemplateId, parseCampaignName } from '../../helpers/slugMapper';
import { showErrorAlert } from '../Alerts';
import { PushTranslations } from '@/entrypoints/issue.content/lib/types';

type GeneratingGuard = ReturnType<typeof useGeneratingGuard>;
type CampaignNameParseResult = ReturnType<typeof parseCampaignName>;

interface UseGenerateCampaignParams {
  campaignName: string;
  chdeTemplateId: string;
  selectedSlugs: string[];
  fetchTranslations: (name: string) => Promise<PushTranslations | null>;
  checkCampaignNameDate: (name: string) => CampaignNameParseResult | null;
  applyOverridesToData: (
    data: Record<string, Record<string, string>>,
    slugs: string[],
  ) => Record<string, Record<string, string>>;
  generating: GeneratingGuard;
  setCampaign: (c: StoredCampaign | null) => void;
  setActiveSlug: (slug: string | null) => void;
  bumpVersion: () => void;
}

/**
 * Orchestrates full campaign generation: validation, translation fetch,
 * data generation, custom overrides, and persistence to browser.storage.
 */
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
}: UseGenerateCampaignParams) {
  const handleGenerateAllSlugs = useCallback(async () => {
    console.log('Generate All clicked');

    if (generating.isBusy()) {
      console.log('Warning: Already generating, ignoring click');
      return;
    }

    if (!campaignName || !campaignName.trim()) {
      console.log('Warning: No campaign name');
      await showErrorAlert('Please select a campaign name first.');
      return;
    }

    console.log(`Campaign name: ${campaignName}`);
    console.log(`CHDE Template ID: ${chdeTemplateId}`);
    console.log(`Selected slugs: ${selectedSlugs.length}`);

    setCampaign(null);
    setActiveSlug(null);
    bumpVersion();

    console.log('Clearing local storage...');
    await browser.storage.local.remove('push_campaign');

    if (!generating.startGenerating()) return;

    try {
      const result = checkCampaignNameDate(campaignName);
      if (result && !result.hasDate) {
        console.log('Warning: No date found in campaign name');
        const confirmResult = await Swal.fire({
          icon: 'warning',
          title: 'No Date Found',
          text: `No date found in campaign name. Using today's date: ${result.day}.${result.month}.${result.year}. Continue?`,
          showCancelButton: true,
          confirmButtonText: 'Continue',
          cancelButtonText: 'Cancel',
        });

        if (!confirmResult.isConfirmed) {
          console.log('User cancelled generation');
          generating.stopGenerating();
          return;
        }
      }

      console.log('Fetching fresh translations for:', campaignName);
      const translations = await fetchTranslations(campaignName);
      if (!translations) {
        console.log('Failed to fetch translations');
        await showErrorAlert(
          'Failed to load translations. Please check the campaign name and try again.',
        );
        generating.stopGenerating();
        return;
      }
      console.log('✅ Translations fetched successfully');

      if (!isValidTemplateId(chdeTemplateId)) {
        console.log('Invalid CHDE template ID');
        await showErrorAlert('Please enter a valid CHDE template ID (numbers only).');
        generating.stopGenerating();
        return;
      }

      const slugsToUse = selectedSlugs.length > 0 ? selectedSlugs : getAllSlugs();
      console.log(`Generating for ${slugsToUse.length} slugs with campaign: ${campaignName}`);

      console.log('Generating campaign data...');
      let campaignData = generateCampaignData(
        slugsToUse,
        chdeTemplateId,
        translations,
        campaignName,
      );

      console.log('Applying custom overrides...');
      campaignData = applyOverridesToData(campaignData, slugsToUse);

      if (Object.keys(campaignData).length === 0) {
        console.log('No campaign data generated');
        await showErrorAlert('No campaign data generated. Please check your configuration.');
        generating.stopGenerating();
        return;
      }

      console.log(`Campaign data generated with ${Object.keys(campaignData).length} rows`);

      const stored: StoredCampaign = {
        id: Date.now(),
        title: campaignName || 'Push Campaign',
        data: campaignData,
      };

      console.log('Saving to storage...');
      await browser.storage.local.set({ push_campaign: stored });
      setCampaign(stored);
      setActiveSlug(null);
      bumpVersion();
      console.log('✅ Campaign saved successfully');

      generating.stopGenerating();

      await Swal.fire({
        icon: 'success',
        title: 'Campaign Generated!',
        text: `Generated ${Object.keys(campaignData).length} rows with template ID ${chdeTemplateId}`,
      });
    } catch (error) {
      console.error('Error generating campaign:', error);
      await showErrorAlert('An error occurred while generating the campaign.');
      generating.stopGenerating();
    } finally {
      console.log('Resetting isGenerating state');
      generating.stopGenerating();
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
  ]);

  return { handleGenerateAllSlugs };
}
