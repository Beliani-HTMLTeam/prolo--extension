import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { showErrorAlert } from './components/Alerts';
import { fetchPushTranslations } from '../issue.content/api/issueData';
import { PushTranslations } from '../issue.content/lib/types';
import {
  BASE_SLUG_CONFIG,
  generateCampaignData,
  getAllSlugs,
  isValidTemplateId,
  parseCampaignName,
  SLUG_ORDER,
} from './helpers/slugMapper';
import Overlay from '@/components/overlay/Overlay';
import { OverlayToggleButton } from './components/OverlayToggleButton';
import { DashboardContent } from './components/DashboardContent';
import styles from './push.module.scss';
interface CampaignRowData {
  [selector: string]: string;
}

interface StoredCampaign {
  id: number;
  title: string;
  data: Record<string, CampaignRowData>;
}

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

// Helper function to extract campaign name from full name
const extractCampaignName = (fullName: string): string => {
  const datePattern = /(\d{2}[\.\-]\d{2}[\.\-]\d{2})/;
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

// Helper function to get UTM campaign value (lowercase, replace spaces with +)
const getUtmCampaign = (fullName: string): string => {
  const campaign = extractCampaignName(fullName);
  return campaign.toLowerCase().replace(/\s+/g, '+');
};

// ---------------------------------------------------------------------------
// Main App Component
// ---------------------------------------------------------------------------
export default function App() {
  const newsletterSpreadsheet =
    'https://docs.google.com/spreadsheets/d/1RcsQspit0B3b3xX1NwZ9RWnUzZrkoVDULu2cnPMZ04U/edit?gid=337547236#gid=337547236';

  const [visible, setVisible] = useState(true);
  const [campaign, setCampaign] = useState<StoredCampaign | null>(null);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [isRandomTesting, setIsRandomTesting] = useState(false);
  const [isSendingAll, setIsSendingAll] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [pushTranslations, setPushTranslations] = useState<PushTranslations | null>(null);
  const [chdeTemplateId, setChdeTemplateId] = useState('45888');
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(SLUG_ORDER);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(false);
  const [dateWarning, setDateWarning] = useState<string | null>(null);
  const [campaignVersion, setCampaignVersion] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Use ref to track generating state without causing re-renders
  const isGeneratingRef = useRef(false);

  const [customImages, setCustomImages] = useState<Record<string, { enabled: boolean; url: string; isEditing: boolean }>>({});
  const [customTemplates, setCustomTemplates] = useState<Record<string, { value: string; isEditing: boolean }>>({});
  const [customLpPaths, setCustomLpPaths] = useState<Record<string, { value: string; isEditing: boolean }>>({});

  // Safety timeout to reset isGenerating if stuck - increased to 60 seconds
  useEffect(() => {
    if (!isGenerating) return;

    const timeoutId = setTimeout(() => {
      if (isGeneratingRef.current) {
        console.warn('⚠️ Generation timeout after 60s');
        isGeneratingRef.current = false;
        setIsGenerating(false);
        showErrorAlert('Generation timed out after 60 seconds. Please try again.');
      }
    }, 60_000);

    return () => clearTimeout(timeoutId);
  }, [isGenerating]);

  // Hide alert on load
  useEffect(() => {
    const hideAlert = () => {
      const alertElement = document.querySelector('.alertify-logs .custom-log.danger');
      if (alertElement) {
        (alertElement as HTMLElement).style.display = 'none';
      }
    };

    hideAlert();

    const style = document.createElement('style');
    style.textContent = `.alertify-logs .custom-log.danger { display: none !important; }`;
    document.head.appendChild(style);

    const observer = new MutationObserver(() => hideAlert());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      document.head.removeChild(style);
    };
  }, []);

  const showOverlay = useCallback(() => setVisible(true), []);
  const hideOverlay = useCallback(() => setVisible(false), []);

  // Function to check for date in campaign name and show warning
  const checkCampaignNameDate = useCallback((name: string) => {
    if (!name || !name.trim()) {
      setDateWarning(null);
      return null;
    }
    
    const result = parseCampaignName(name);
    if (!result.hasDate) {
      setDateWarning(`⚠️ No date found in campaign name. Using today's date: ${result.day}.${result.month}.${result.year}`);
    } else {
      setDateWarning(null);
    }
    
    return result;
  }, []);

  // Function to fetch translations - only called on demand
  const fetchTranslations = useCallback(async (name: string) => {
    if (!name || !name.trim()) return null;
    
    console.log(`🔍 Fetching translations for: ${name}`);
    
    const result = checkCampaignNameDate(name);
    
    setIsLoadingTranslations(true);
    try {
      const parts = name.split(' - ');
      const datePart = parts[0] || '';
      const campaignPart = parts.length > 1 ? parts.slice(1).join(' - ') : name;
      
      let year = '2026';
      if (result && result.hasDate) {
        year = result.year;
      } else {
        const now = new Date();
        year = now.getFullYear().toString();
      }
      
      console.log(`📊 Fetching translations for: ${name} (year: ${year}, campaign: ${campaignPart})`);
      
      const translations = await fetchPushTranslations(newsletterSpreadsheet, year, name);
      
      // IMPORTANT: Update the state with new translations
      setPushTranslations(translations);
      
      console.log(`✅ Translations fetched successfully`);
      
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
      console.error('❌ Error fetching push translations:', error);
      await showErrorAlert('Failed to fetch push translations. Please try again.');
      return null;
    } finally {
      setIsLoadingTranslations(false);
    }
  }, [newsletterSpreadsheet, checkCampaignNameDate]);

  // Clear data on mount
  useEffect(() => {
    browser.storage.local.remove('push_campaign');
    setCampaign(null);
    setPushTranslations(null);
    setDateWarning(null);
    setCampaignVersion(0);
  }, []);

  // Handle campaign name change - only update the name, don't fetch
  const handleCampaignNameChange = useCallback((name: string) => {
    setCampaignName(name);
    checkCampaignNameDate(name);
    
    // Clear old translations when name changes
    setPushTranslations(null);
  }, [checkCampaignNameDate]);

  // Handle Generate All button click
  const handleGenerateAllSlugs = useCallback(async () => {
    console.log('🚀 Generate All clicked');
    
    // Use ref to check if already generating (prevents race conditions)
    if (isGeneratingRef.current) {
      console.log('⚠️ Already generating, ignoring click');
      return;
    }

    if (!campaignName || !campaignName.trim()) {
      console.log('⚠️ No campaign name');
      await showErrorAlert('Please enter a campaign name first.');
      return;
    }

    console.log(`📝 Campaign name: ${campaignName}`);
    console.log(`📝 CHDE Template ID: ${chdeTemplateId}`);
    console.log(`📝 Selected slugs: ${selectedSlugs.length}`);

    // Clear previous campaign data immediately to show generating state
    setCampaign(null);
    setActiveSlug(null);
    setCampaignVersion(prev => prev + 1);

    // Clear local storage before generating new campaign
    console.log('🗑️ Clearing local storage...');
    await browser.storage.local.remove('push_campaign');

    // Set generating state - both ref and state
    isGeneratingRef.current = true;
    setIsGenerating(true);

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
          isGeneratingRef.current = false;
          setIsGenerating(false);
          return;
        }
      }

      // ALWAYS fetch fresh translations for the current campaign name
      console.log('📡 Fetching fresh translations for:', campaignName);
      const translations = await fetchTranslations(campaignName);
      if (!translations) {
        console.log('❌ Failed to fetch translations');
        await showErrorAlert('Failed to load translations. Please check the campaign name and try again.');
        isGeneratingRef.current = false;
        setIsGenerating(false);
        return;
      }
      console.log('✅ Translations fetched successfully');

      if (!isValidTemplateId(chdeTemplateId)) {
        console.log('❌ Invalid CHDE template ID');
        await showErrorAlert('Please enter a valid CHDE template ID (numbers only).');
        isGeneratingRef.current = false;
        setIsGenerating(false);
        return;
      }

      const slugsToUse = selectedSlugs.length > 0 ? selectedSlugs : getAllSlugs();
      console.log(`📊 Generating for ${slugsToUse.length} slugs with campaign: ${campaignName}`);

      console.log('🔄 Generating campaign data...');
      // Use the fresh translations directly
      let campaignData = generateCampaignData(slugsToUse, chdeTemplateId, translations, campaignName);

      // Apply custom overrides
      console.log('🔄 Applying custom overrides...');
      for (const slug of slugsToUse) {
        if (customImages[slug]?.enabled && customImages[slug].url && campaignData[slug]) {
          campaignData[slug]["[name='image']"] = customImages[slug].url;
        }
        if (customTemplates[slug]?.value && campaignData[slug]) {
          campaignData[slug]["[name='template']"] = customTemplates[slug].value;
        }
        if (customLpPaths[slug]?.value && campaignData[slug]) {
          const domain = BASE_SLUG_CONFIG[slug]?.domain || '';
          const lpVal = customLpPaths[slug].value;
          campaignData[slug]["[name='lp_path']"] = lpVal;
          if (domain) {
            // Use the current campaign name for UTM campaign parameter
            const utmCampaign = getUtmCampaign(campaignName);
            campaignData[slug]["[name='click_action']"] = `https://www.beliani.${domain}/content/${lpVal}/?utm_source=PUSH&utm_medium=${lpVal}&utm_campaign=${utmCampaign}`;
          }
        }
      }

      if (Object.keys(campaignData).length === 0) {
        console.log('❌ No campaign data generated');
        await showErrorAlert('No campaign data generated. Please check your configuration.');
        isGeneratingRef.current = false;
        setIsGenerating(false);
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
      setCampaignVersion(prev => prev + 1);
      console.log('✅ Campaign saved successfully');

      // Reset generating state BEFORE showing success message
      isGeneratingRef.current = false;
      setIsGenerating(false);

      await Swal.fire({
        icon: 'success',
        title: 'Campaign Generated!',
        text: `Generated ${Object.keys(campaignData).length} rows with template ID ${chdeTemplateId}`,
      });
    } catch (error) {
      console.error('❌ Error generating campaign:', error);
      await showErrorAlert('An error occurred while generating the campaign.');
      isGeneratingRef.current = false;
      setIsGenerating(false);
    } finally {
      // ALWAYS reset generating state - both ref and state
      console.log('🔄 Resetting isGenerating state');
      isGeneratingRef.current = false;
      setIsGenerating(false);
    }
  }, [campaignName, chdeTemplateId, selectedSlugs, customImages, customTemplates, customLpPaths, fetchTranslations, checkCampaignNameDate]);

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
    setCustomImages(prev => ({
      ...prev,
      [slug]: {
        enabled: prev[slug]?.enabled || false,
        url,
        isEditing: prev[slug]?.isEditing || true,
      },
    }));
  }, []);

  const saveCustomImage = useCallback(
    async (slug: string) => {
      if (!campaign) return;
      const customImage = customImages[slug];
      if (!customImage?.enabled || !customImage.url?.startsWith('http')) {
        await showErrorAlert('Please enter a valid image URL starting with http:// or https://');
        return;
      }

      const updatedData = { ...campaign.data };
      if (updatedData[slug]) {
        updatedData[slug]["[name='image']"] = customImage.url;
      }

      const updatedCampaign = { ...campaign, data: updatedData };
      await browser.storage.local.set({ push_campaign: updatedCampaign });
      setCampaign(updatedCampaign);
      setCustomImages(prev => ({ ...prev, [slug]: { ...customImage, isEditing: false } }));

      await Swal.fire({
        icon: 'success',
        title: 'Image Updated!',
        timer: 1500,
        showConfirmButton: false,
      });
    },
    [campaign, customImages],
  );

  const toggleCustomTemplate = useCallback((slug: string) => {
    setCustomTemplates(prev => {
      const current = prev[slug];
      const val = campaign?.data[slug]?.["[name='template']"] || '';
      return { ...prev, [slug]: { value: current?.value || val, isEditing: !current?.isEditing } };
    });
  }, [campaign]);

  const updateCustomTemplateValue = useCallback((slug: string, value: string) => {
    setCustomTemplates(prev => ({ ...prev, [slug]: { value, isEditing: prev[slug]?.isEditing || true } }));
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
      setCustomTemplates(prev => ({ ...prev, [slug]: { value: customTemplate.value, isEditing: false } }));
    },
    [campaign, customTemplates],
  );

  const toggleCustomLpPath = useCallback((slug: string) => {
    setCustomLpPaths(prev => {
      const current = prev[slug];
      const val = campaign?.data[slug]?.["[name='lp_path']"] || '';
      return { ...prev, [slug]: { value: current?.value || val, isEditing: !current?.isEditing } };
    });
  }, [campaign]);

  const updateCustomLpPath = useCallback((slug: string, value: string) => {
    setCustomLpPaths(prev => ({ ...prev, [slug]: { value, isEditing: prev[slug]?.isEditing || true } }));
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

    setCampaignVersion(prev => prev + 1);

    await Swal.fire({
      icon: 'success',
      title: 'LP Path Updated!',
      text: `LP path and click_action updated for ${slug.toUpperCase()}`,
      timer: 1500,
      showConfirmButton: false,
    });
  },
  [campaign, customLpPaths, campaignName],
);

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
      const buttonSelector = isTest ? "input#test[value='Test']" : "input[type='submit'][name='submit'][value='Send']";
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
    const shuffled = slugs.sort(() => Math.random() - 0.5);
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

  const toggleSlugSelection = useCallback((slug: string) => {
    setSelectedSlugs(prev => (prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]));
  }, []);

  const selectAllSlugs = useCallback(() => setSelectedSlugs(SLUG_ORDER), []);
  const deselectAllSlugs = useCallback(() => setSelectedSlugs([]), []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <>
      {!visible && <OverlayToggleButton onClick={showOverlay} />}
      <Overlay visible={visible}>
        {visible && (
          <DashboardContent
            visible={visible}
            campaign={campaign}
            campaignVersion={campaignVersion}
            activeSlug={activeSlug}
            busySlug={busySlug}
            isRandomTesting={isRandomTesting}
            isSendingAll={isSendingAll}
            campaignName={campaignName}
            chdeTemplateId={chdeTemplateId}
            pushTranslations={pushTranslations}
            selectedSlugs={selectedSlugs}
            previewImage={previewImage}
            customImages={customImages}
            customTemplates={customTemplates}
            customLpPaths={customLpPaths}
            dateWarning={dateWarning}
            isLoadingTranslations={isLoadingTranslations}
            isGenerating={isGenerating}
            onHideOverlay={hideOverlay}
            onSetCampaignName={handleCampaignNameChange}
            onSetChdeTemplateId={setChdeTemplateId}
            onGenerateAll={handleGenerateAllSlugs}
            onSelectAll={selectAllSlugs}
            onDeselectAll={deselectAllSlugs}
            onToggleSlug={toggleSlugSelection}
            onSetPreviewImage={setPreviewImage}
            onToggleCustomImage={toggleCustomImage}
            onUpdateCustomImageUrl={updateCustomImageUrl}
            onSaveCustomImage={saveCustomImage}
            onToggleCustomTemplate={toggleCustomTemplate}
            onUpdateCustomTemplateValue={updateCustomTemplateValue}
            onSaveCustomTemplate={saveCustomTemplate}
            onToggleCustomLpPath={toggleCustomLpPath}
            onUpdateCustomLpPath={updateCustomLpPath}
            onSaveCustomLpPath={saveCustomLpPath}
            onTest3Random={handleTest3Random}
            onSendAll={handleSendAll}
            onTestRow={handleTestRow}
            onSendRow={handleSendRow}
          />
        )}
      </Overlay>
    </>
  );
}