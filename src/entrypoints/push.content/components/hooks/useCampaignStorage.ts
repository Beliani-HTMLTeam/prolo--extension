import { useCallback, useEffect, useState } from 'react';
import type { StoredCampaign } from './useCustomOverrides';

/**
 * Owns campaign state, version counter (for forced re-renders),
 * and clears stale storage on mount.
 */
export function useCampaignStorage() {
  const [campaign, setCampaign] = useState<StoredCampaign | null>(null);
  const [campaignVersion, setCampaignVersion] = useState(0);
  const [chdeTemplateId, setChdeTemplateId] = useState('');
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    browser.storage.local.remove('push_campaign');
    setCampaign(null);
    setCampaignVersion(0);
  }, []);

  const bumpVersion = useCallback(() => {
    setCampaignVersion(prev => prev + 1);
  }, []);

  return {
    campaign,
    setCampaign,
    campaignVersion,
    bumpVersion,
    chdeTemplateId,
    setChdeTemplateId,
    previewImage,
    setPreviewImage,
  };
}
