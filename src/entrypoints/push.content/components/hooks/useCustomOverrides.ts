import { useCallback, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { showErrorAlert } from '../Alerts';
import { BASE_SLUG_CONFIG } from '../../helpers/slugMapper';
import { type CustomFieldState, type CustomImageState, type StoredCampaign } from '../../types/push';

const F = {
  image: "[name='image']",
  template: "[name='template']",
  lpPath: "[name='lp_path']",
  clickAction: "[name='click_action']",
} as const;

type CampaignData = Record<string, Record<string, string>>;

export const extractCampaignName = (fullName: string): string => {
  const match = fullName.match(/(\d{2}[.-]\d{2}[.-]\d{2,4})/);
  if (!match) return fullName;

  const dateIndex = match.index || 0;
  const afterDate = fullName
    .substring(dateIndex + match[0].length)
    .trim()
    .replace(/^[\s-]+/, '');
  if (afterDate) return afterDate;

  return fullName.substring(0, dateIndex).trim().replace(/[\s-]+$/, '');
};

export const getUtmCampaign = (fullName: string): string =>
  extractCampaignName(fullName).toLowerCase().replace(/\s+/g, '+');

const buildClickAction = (domain: string, lpPath: string, campaignName: string) =>
  `https://www.beliani.${domain}/content/${lpPath}/?utm_source=PUSH&utm_medium=${lpPath}&utm_campaign=${getUtmCampaign(campaignName)}`;

/** Non-blocking confirmation (the old modal froze the dashboard for 1.5 s after every save). */
const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  timer: 1500,
  showConfirmButton: false,
});

/** Storage write happens in the background — the UI no longer waits for it. */
const persistCampaign = (campaign: StoredCampaign) => {
  browser.storage.local
    .set({ push_campaign: campaign })
    .catch(error => console.error('Failed to persist push campaign:', error));
};

/** Immutable single-row update: only the edited row gets a new object, so only that row re-renders. */
const patchRow = (campaign: StoredCampaign, slug: string, patch: Record<string, string>): StoredCampaign => {
  const row = campaign.data[slug];
  if (!row) return campaign;
  return { ...campaign, data: { ...campaign.data, [slug]: { ...row, ...patch } } };
};

export function useCustomOverrides(
  campaign: StoredCampaign | null,
  setCampaign: (c: StoredCampaign | null) => void,
  campaignName: string,
  // Kept for call-site compatibility. Row edits no longer remount the table.
  _bumpVersion?: () => void,
) {
  const [customImages, setCustomImages] = useState<Record<string, CustomImageState>>({});
  const [customTemplates, setCustomTemplates] = useState<Record<string, CustomFieldState>>({});
  const [customLpPaths, setCustomLpPaths] = useState<Record<string, CustomFieldState>>({});

  // Latest campaign, also updated right after a save, so two quick saves never overwrite each other.
  const campaignRef = useRef(campaign);
  campaignRef.current = campaign;

  const commitCampaign = useCallback(
    (next: StoredCampaign) => {
      campaignRef.current = next;
      setCampaign(next);
      persistCampaign(next);
    },
    [setCampaign],
  );

  /* ---------------- Custom image ---------------- */

  const toggleCustomImage = useCallback((slug: string) => {
    setCustomImages(prev => {
      const current = prev[slug];
      if (current?.enabled) {
        // enabled + editing → close editor; enabled + saved → disable (unchanged behaviour)
        return {
          ...prev,
          [slug]: current.isEditing ? { ...current, isEditing: false } : { ...current, enabled: false, isEditing: false },
        };
      }
      const currentImageUrl = campaignRef.current?.data[slug]?.[F.image] || '';
      return { ...prev, [slug]: { enabled: true, url: currentImageUrl, isEditing: true } };
    });
  }, []);

  const updateCustomImageUrl = useCallback((slug: string, url: string) => {
    setCustomImages(prev => ({
      ...prev,
      [slug]: { enabled: prev[slug]?.enabled || false, url, isEditing: prev[slug]?.isEditing || true },
    }));
  }, []);

  const saveCustomImage = useCallback(
    async (slug: string, newUrl?: string) => {
      const current = campaignRef.current;
      if (!current) {
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

      commitCampaign(patchRow(current, slug, { [F.image]: urlToSave }));
      setCustomImages(prev => ({ ...prev, [slug]: { enabled: true, url: urlToSave, isEditing: false } }));

      void toast.fire({ icon: 'success', title: 'Image Updated!', text: `Custom image saved for ${slug.toUpperCase()}` });
    },
    [customImages, commitCampaign],
  );

  /* ---------------- Custom template ---------------- */

  const toggleCustomTemplate = useCallback((slug: string) => {
    setCustomTemplates(prev => {
      const current = prev[slug];
      if (current?.isEditing) return { ...prev, [slug]: { ...current, isEditing: false } };
      const val = campaignRef.current?.data[slug]?.[F.template] || '';
      return { ...prev, [slug]: { value: current?.value || val, isEditing: true } };
    });
  }, []);

  const updateCustomTemplateValue = useCallback((slug: string, value: string) => {
    setCustomTemplates(prev => ({ ...prev, [slug]: { value, isEditing: prev[slug]?.isEditing || true } }));
  }, []);

  const saveCustomTemplate = useCallback(
    async (slug: string) => {
      const current = campaignRef.current;
      if (!current) return;
      const value = customTemplates[slug]?.value;
      if (!value) return;

      // Previously this mutated the shared row object in place.
      commitCampaign(patchRow(current, slug, { [F.template]: value }));
      setCustomTemplates(prev => ({ ...prev, [slug]: { value, isEditing: false } }));

      void toast.fire({ icon: 'success', title: 'Template Updated!' });
    },
    [customTemplates, commitCampaign],
  );

  const addCustomTemplate = useCallback((slug: string, value: string) => {
    setCustomTemplates(prev => ({ ...prev, [slug]: { value: value.trim(), isEditing: false } }));
  }, []);

  const removeCustomTemplate = useCallback((slug: string) => {
    setCustomTemplates(prev => {
      const next = { ...prev };
      delete next[slug];
      return next;
    });
  }, []);

  /* ---------------- Custom LP path ---------------- */

  const toggleCustomLpPath = useCallback((slug: string) => {
    setCustomLpPaths(prev => {
      const current = prev[slug];
      if (current?.isEditing) return { ...prev, [slug]: { ...current, isEditing: false } };
      const val = campaignRef.current?.data[slug]?.[F.lpPath] || '';
      return { ...prev, [slug]: { value: current?.value || val, isEditing: true } };
    });
  }, []);

  const updateCustomLpPath = useCallback((slug: string, value: string) => {
    setCustomLpPaths(prev => ({ ...prev, [slug]: { value, isEditing: prev[slug]?.isEditing || true } }));
  }, []);

  const saveCustomLpPath = useCallback(
    async (slug: string, newValue?: string) => {
      const current = campaignRef.current;
      if (!current) return;

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

      commitCampaign(
        patchRow(current, slug, {
          [F.lpPath]: lpValue,
          [F.clickAction]: buildClickAction(baseConfig.domain, lpValue, campaignName),
        }),
      );
      setCustomLpPaths(prev => ({ ...prev, [slug]: { value: lpValue, isEditing: false } }));

      void toast.fire({
        icon: 'success',
        title: 'LP Path Updated!',
        text: `LP path and click_action updated for ${slug.toUpperCase()}`,
      });
    },
    [customLpPaths, campaignName, commitCampaign],
  );

  /* ---------------- Applied on (re)generation ---------------- */

  const applyOverridesToData = useCallback(
    (campaignData: CampaignData): CampaignData => {
      const result: CampaignData = {};

      for (const [slug, row] of Object.entries(campaignData)) {
        const patch: Record<string, string> = {};

        const image = customImages[slug];
        if (image?.enabled && image.url) patch[F.image] = image.url;

        const template = customTemplates[slug]?.value;
        if (template) patch[F.template] = template;

        const lpVal = customLpPaths[slug]?.value;
        if (lpVal) {
          patch[F.lpPath] = lpVal;
          const domain = BASE_SLUG_CONFIG[slug]?.domain || '';
          if (domain) patch[F.clickAction] = buildClickAction(domain, lpVal, campaignName);
        }

        result[slug] = Object.keys(patch).length ? { ...row, ...patch } : row;
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
