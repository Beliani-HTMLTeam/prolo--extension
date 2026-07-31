import { useCallback, useState } from 'react';
import Swal from 'sweetalert2';

import type { StoredCampaign } from './useCustomOverrides';
import type { useGeneratingGuard } from './useGeneratingGuard';
import { generateCampaignData, getAllSlugs, isValidTemplateId, parseCampaignName } from '../../helpers/slugMapper';
import { showErrorAlert } from '../Alerts';
import { PushTranslations } from '@/entrypoints/issue.content/lib/types';

type UseGenerateCampaignProps = {
  campaignName: string;
  chdeTemplateId: string;
  selectedSlugs: string[];
  fetchTranslations: (name: string) => Promise<any>;
  checkCampaignNameDate: (name: string) => any;
  applyOverridesToData: (data: Record<string, Record<string, string>>) => Record<string, Record<string, string>>;
  generating: {
    isGenerating: boolean;
    setIsGenerating: (value: boolean) => void;
  };
  setCampaign: (campaign: StoredCampaign | null) => void;
  setActiveSlug: (slug: string | null) => void;
  bumpVersion: () => void;
};

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
}: UseGenerateCampaignProps) {
  const handleGenerateAllSlugs = useCallback(async () => {
    console.log('🚀 Generate All clicked');

    // Use isGenerating to check if already generating (prevents race conditions)
    if (generating.isGenerating) {
      console.log('⚠️ Already generating, ignoring click');
      return;
    }

    if (!campaignName || !campaignName.trim()) {
      console.log('⚠️ No campaign name');
      await showErrorAlert('Please select a campaign name first.');
      return;
    }

    console.log(`📝 Campaign name: ${campaignName}`);
    console.log(`📝 CHDE Template ID: ${chdeTemplateId}`);
    console.log(`📝 Selected slugs: ${selectedSlugs.length}`);

    // Clear previous campaign data immediately to show generating state
    setCampaign(null);
    setActiveSlug(null);
    bumpVersion();

    // Clear local storage before generating new campaign
    console.log('🗑️ Clearing local storage...');
    await browser.storage.local.remove('push_campaign');

    // Set generating state
    generating.setIsGenerating(true);

    try {
      // Check for date warning before generating
      const result = checkCampaignNameDate(campaignName);
      if (result && !result.hasDate) {
        console.log('⚠️ No date found in campaign name');
        const confirmResult = await Swal.fire({
          icon: 'warning',
          title: 'No Date Found',
          text: `No date found in campaign name. Using today's date: ${result.day}.${result.month}.${result.year}. Continue?`,
          showCancelButton: true,
          confirmButtonText: 'Continue',
          cancelButtonText: 'Cancel',
        });

        if (!confirmResult.isConfirmed) {
          console.log('❌ User cancelled generation');
          generating.setIsGenerating(false);
          return;
        }
      }

      // Fetch translations for the current campaign name
      console.log('📡 Fetching translations for:', campaignName);
      const translations = await fetchTranslations(campaignName);
      if (!translations) {
        console.log('❌ Failed to fetch translations');
        await showErrorAlert('Failed to load translations. Please check the campaign name and try again.');
        generating.setIsGenerating(false);
        return;
      }
      console.log('✅ Translations fetched successfully');

      if (!isValidTemplateId(chdeTemplateId)) {
        console.log('❌ Invalid CHDE template ID');
        await showErrorAlert('Please enter a valid CHDE template ID (numbers only).');
        generating.setIsGenerating(false);
        return;
      }

      const slugsToUse = selectedSlugs.length > 0 ? selectedSlugs : getAllSlugs();
      console.log(`📊 Generating for ${slugsToUse.length} slugs with campaign: ${campaignName}`);

      console.log('🔄 Generating campaign data...');
      let campaignData = generateCampaignData(slugsToUse, chdeTemplateId, translations, campaignName);

      // Apply custom overrides
      console.log('🔄 Applying custom overrides...');
      campaignData = applyOverridesToData(campaignData);

      if (Object.keys(campaignData).length === 0) {
        console.log('❌ No campaign data generated');
        await showErrorAlert('No campaign data generated. Please check your configuration.');
        generating.setIsGenerating(false);
        return;
      }

      console.log(`✅ Campaign data generated with ${Object.keys(campaignData).length} rows`);

      const stored: StoredCampaign = {
        id: Date.now(),
        title: campaignName || 'Push Campaign',
        data: campaignData,
      };

      console.log('💾 Saving to storage...');
      await browser.storage.local.set({ push_campaign: stored });
      setCampaign(stored);
      setActiveSlug(null);

      // Increment version to force rerender of table
      bumpVersion();
      console.log('✅ Campaign saved successfully');

      // Reset generating state BEFORE showing success message
      generating.setIsGenerating(false);

      await Swal.fire({
        icon: 'success',
        title: 'Campaign Generated!',
        text: `Generated ${Object.keys(campaignData).length} rows with template ID ${chdeTemplateId}`,
      });
    } catch (error) {
      console.error('❌ Error generating campaign:', error);
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
  ]);

  return { handleGenerateAllSlugs };
}