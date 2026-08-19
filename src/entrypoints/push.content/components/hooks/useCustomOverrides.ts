import { useCallback, useState } from 'react';
import Swal from 'sweetalert2';
import { showErrorAlert } from '../Alerts';
import { BASE_SLUG_CONFIG } from '../../helpers/slugMapper';
import { CustomFieldState, CustomImageState, StoredCampaign } from '../../types/push';


export const extractCampaignName = (fullName: string): string => {
  const datePattern = /(\d{2}[\.\-]\d{2}[\.\-]\d{2,4})/;
  const match = fullName.match(datePattern);

  if (match) {
    const dateIndex = match.index || 0;
    const dateEndIndex = dateIndex + match[0].length;
    let afterDate = fullName.substring(dateEndIndex).trim();
    afterDate = afterDate.replace(/^[\s\-]+/, '');
    if (afterDate) {
      return afterDate;
    }
    const beforeDate = fullName.substring(0, dateIndex).trim();
    return beforeDate.replace(/[\s\-]+$/, '');
  }
  return fullName;
};

export const getUtmCampaign = (fullName: string): string => {
  const campaign = extractCampaignName(fullName);
  return campaign.toLowerCase().replace(/\s+/g, '+');
};


export function useCustomOverrides(
  campaign: StoredCampaign | null,
  setCampaign: (c: StoredCampaign | null) => void,
  campaignName: string,
  bumpVersion: () => void,
) {
  const [customImages, setCustomImages] = useState<Record<string, CustomImageState>>({});
  const [customTemplates, setCustomTemplates] = useState<Record<string, CustomFieldState>>({});
  const [customLpPaths, setCustomLpPaths] = useState<Record<string, CustomFieldState>>({});

  const toggleCustomImage = useCallback(
    (slug: string) => {
      setCustomImages(prev => {
        const current = prev[slug];
        if (current) {
          if (current.enabled && !current.isEditing) {
            return { ...prev, [slug]: { ...current, enabled: false, isEditing: false } };
          }
          if (current.enabled && current.isEditing) {
            return { ...prev, [slug]: { ...current, isEditing: false } };
          }
        }
        const currentImageUrl = campaign?.data[slug]?.["[name='image']"] || '';
        return { ...prev, [slug]: { enabled: true, url: currentImageUrl, isEditing: true } };
      });
    },
    [campaign],
  );

const updateCustomImageUrl = useCallback((slug: string, url: string) => {
  setCustomImages(prev => {
    const newState = {
      ...prev,
      [slug]: {
        enabled: prev[slug]?.enabled || false,
        url,
        isEditing: prev[slug]?.isEditing || true,
      },
    };
    return newState;
  });
}, []);

 const saveCustomImage = useCallback(
  async (slug: string, newUrl?: string) => {
    
    if (!campaign) {
      await showErrorAlert('No campaign loaded.');
      return;
    }
    
    const customImage = customImages[slug];
    const urlToSave = newUrl || customImage?.url;
    
    
    if (!customImage?.enabled && !newUrl) {
      await showErrorAlert('Please enable custom image first.');
      return;
    }
    
    if (!urlToSave || !urlToSave.startsWith('http')) {
      await showErrorAlert('Please enter a valid image URL starting with http:// or https://');
      return;
    }

    const updatedData = JSON.parse(JSON.stringify(campaign.data));
    if (updatedData[slug]) {
      updatedData[slug] = {
        ...updatedData[slug],
        "[name='image']": urlToSave,
      };
    }

    const updatedCampaign: StoredCampaign = {
      ...campaign,
      data: updatedData,
    };
    
    await browser.storage.local.set({ push_campaign: updatedCampaign });
    
    setCampaign(updatedCampaign);
    
    setCustomImages(prev => ({ 
      ...prev, 
      [slug]: { 
        enabled: true,
        url: urlToSave,
        isEditing: false 
      } 
    }));

    bumpVersion();

    await Swal.fire({
      icon: 'success',
      title: 'Image Updated!',
      text: `Custom image saved for ${slug.toUpperCase()}`,
      timer: 1500,
      showConfirmButton: false,
    });
  },
  [campaign, customImages, setCampaign, bumpVersion],
);
  const toggleCustomTemplate = useCallback(
    (slug: string) => {
      setCustomTemplates(prev => {
        const current = prev[slug];
        const val = campaign?.data[slug]?.["[name='template']"] || '';
        if (current?.isEditing) {
          return { ...prev, [slug]: { ...current, isEditing: false } };
        }
        return { ...prev, [slug]: { value: current?.value || val, isEditing: true } };
      });
    },
    [campaign],
  );

  const updateCustomTemplateValue = useCallback((slug: string, value: string) => {
    setCustomTemplates(prev => ({
      ...prev,
      [slug]: { value, isEditing: prev[slug]?.isEditing || true },
    }));
  }, []);

  const saveCustomTemplate = useCallback(
    async (slug: string) => {
      if (!campaign) return;
      const customTemplate = customTemplates[slug];
      if (!customTemplate?.value) return;

      const updatedData = { ...campaign.data };
      if (updatedData[slug]) {
        updatedData[slug]["[name='template']"] = customTemplate.value;
      }

      const updatedCampaign = { ...campaign, data: updatedData };
      await browser.storage.local.set({ push_campaign: updatedCampaign });
      setCampaign(updatedCampaign);
      setCustomTemplates(prev => ({
        ...prev,
        [slug]: { value: customTemplate.value, isEditing: false },
      }));
      bumpVersion();

      await Swal.fire({
        icon: 'success',
        title: 'Template Updated!',
        timer: 1500,
        showConfirmButton: false,
      });
    },
    [campaign, customTemplates, setCampaign, bumpVersion],
  );

  const toggleCustomLpPath = useCallback(
    (slug: string) => {
      setCustomLpPaths(prev => {
        const current = prev[slug];
        const val = campaign?.data[slug]?.["[name='lp_path']"] || '';
        if (current?.isEditing) {
          return { ...prev, [slug]: { ...current, isEditing: false } };
        }
        return { ...prev, [slug]: { value: current?.value || val, isEditing: true } };
      });
    },
    [campaign],
  );

  const updateCustomLpPath = useCallback((slug: string, value: string) => {
    setCustomLpPaths(prev => ({
      ...prev,
      [slug]: { value, isEditing: prev[slug]?.isEditing || true },
    }));
  }, []);

  const saveCustomLpPath = useCallback(
    async (slug: string, newValue?: string) => {
      if (!campaign) return;

      const lpValue = (newValue ?? customLpPaths[slug]?.value ?? '').trim();
      if (!lpValue) {
        await showErrorAlert('Please enter an LP path.');
        return;
      }

      const baseConfig = BASE_SLUG_CONFIG[slug];
      if (!baseConfig) {
        await showErrorAlert(`No configuration found for slug: ${slug}`);
        return;
      }

      const updatedData = { ...campaign.data };
      if (updatedData[slug]) {
        const utmCampaign = getUtmCampaign(campaignName);
        updatedData[slug] = {
          ...updatedData[slug],
          "[name='lp_path']": lpValue,
          "[name='click_action']": `https://www.beliani.${baseConfig.domain}/content/${lpValue}/?utm_source=PUSH&utm_medium=${lpValue}&utm_campaign=${utmCampaign}`,
        };
      }

      const updatedCampaign: StoredCampaign = {
        ...campaign,
        data: updatedData,
      };

      await browser.storage.local.set({ push_campaign: updatedCampaign });
      setCampaign(updatedCampaign);

      setCustomLpPaths(prev => ({
        ...prev,
        [slug]: { value: lpValue, isEditing: false },
      }));

      bumpVersion();

      await Swal.fire({
        icon: 'success',
        title: 'LP Path Updated!',
        text: `LP path and click_action updated for ${slug.toUpperCase()}`,
        timer: 1500,
        showConfirmButton: false,
      });
    },
    [campaign, customLpPaths, campaignName, setCampaign, bumpVersion],
  );

  const addCustomTemplate = useCallback((slug: string, value: string) => {
    setCustomTemplates(prev => ({
      ...prev,
      [slug]: {
        value: value.trim(),
        isEditing: false,
      },
    }));
  }, []);

  const removeCustomTemplate = useCallback((slug: string) => {
    setCustomTemplates(prev => {
      const newState = { ...prev };
      delete newState[slug];
      return newState;
    });
  }, []);

  const applyOverridesToData = useCallback(
    (campaignData: Record<string, Record<string, string>>): Record<string, Record<string, string>> => {
      const slugs = Object.keys(campaignData);
      const result = { ...campaignData };
      
      for (const slug of slugs) {
        if (customImages[slug]?.enabled && customImages[slug].url && result[slug]) {
          result[slug]["[name='image']"] = customImages[slug].url;
        }
        if (customTemplates[slug]?.value && result[slug]) {
          result[slug]["[name='template']"] = customTemplates[slug].value;
        }
        if (customLpPaths[slug]?.value && result[slug]) {
          const domain = BASE_SLUG_CONFIG[slug]?.domain || '';
          const lpVal = customLpPaths[slug].value;
          result[slug]["[name='lp_path']"] = lpVal;
          if (domain) {
            const utmCampaign = getUtmCampaign(campaignName);
            result[slug]["[name='click_action']"] = `https://www.beliani.${domain}/content/${lpVal}/?utm_source=PUSH&utm_medium=${lpVal}&utm_campaign=${utmCampaign}`;
          }
        }
      }
      
      return result;
    },
    [customImages, customTemplates, customLpPaths, campaignName],
  );

  return {
    customImages,
    customTemplates,
    customLpPaths,
    toggleCustomImage,
    updateCustomImageUrl,
    saveCustomImage,
    toggleCustomTemplate,
    updateCustomTemplateValue,
    saveCustomTemplate,
    addCustomTemplate,
    removeCustomTemplate,
    toggleCustomLpPath,
    updateCustomLpPath,
    saveCustomLpPath,
    applyOverridesToData,
  };
}