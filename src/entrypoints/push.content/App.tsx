import { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { showErrorAlert } from './components/Alerts';
import { CSVToArray, parseCSV } from './helpers/CSVfns';
import { fetchPushTranslations } from '../issue.content/api/issueData';
import { PushTranslations } from '../issue.content/lib/types';
import {
  BASE_SLUG_CONFIG,
  buildRowDataFromSlug,
  generateCampaignData,
  generateImageUrl,
  generateLpPath,
  getAllSlugs,
  isValidTemplateId,
  parseCampaignName,
  SLUG_ORDER,
} from './helpers/slugMapper';
import Overlay from '@/components/overlay/Overlay';
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

// ---------------------------------------------------------------------------
// Image Preview Component
// ---------------------------------------------------------------------------
const ImagePreview = ({
  src,
  alt,
  size = 'small',
  onClick,
}: {
  src: string;
  alt: string;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setError(false);
    setLoading(true);
  }, [src]);

  const sizeClass = size === 'large' ? styles.sizeLarge : size === 'medium' ? styles.sizeMedium : styles.sizeSmall;

  if (error || !src) {
    return (
      <div className={`${styles.imagePreviewWrapper}`} onClick={onClick}>
        <div className={`${styles.noImage} ${sizeClass}`}>No Image</div>
      </div>
    );
  }

  return (
    <div className={styles.imagePreviewWrapper} onClick={onClick}>
      {loading && (
        <div className={`${styles.loadingPlaceholder} ${sizeClass}`}>
          <div className={styles.spinner} />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${styles.thumbnail} ${sizeClass}`}
        style={{ display: loading ? 'none' : 'block' }}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Big Image Preview Component
// ---------------------------------------------------------------------------
const BigImagePreview = ({ src, alt, onClose }: { src: string | null; alt: string; onClose: () => void }) => {
  if (!src) return null;

  return (
    <div className={styles.bigImageContainer}>
      <div className={styles.header}>
        <span className={styles.title}>🖼️ Image Preview: {alt}</span>
        <button onClick={onClose} className={styles.btnClose}>
          ✕ Close
        </button>
      </div>
      <div className={styles.imageWrapper}>
        <img
          src={src}
          alt={alt}
          onError={e => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
      <div className={styles.urlText}>📍 {src}</div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Overlay Toggle Button Component
// ---------------------------------------------------------------------------
const OverlayToggleButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button onClick={onClick} className={styles.overlayToggleButton}>
      📊 Dashboard
    </button>
  );
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
  const [campaignName, setCampaignName] = useState('24.07.26 - Garden Storage');
  const [pushTranslations, setPushTranslations] = useState<PushTranslations | null>(null);
  const [chdeTemplateId, setChdeTemplateId] = useState('45888');
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(SLUG_ORDER);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);

  const [customImages, setCustomImages] = useState<Record<string, { enabled: boolean; url: string; isEditing: boolean }>>({});
  const [customTemplates, setCustomTemplates] = useState<Record<string, { value: string; isEditing: boolean }>>({});
  const [customLpPaths, setCustomLpPaths] = useState<Record<string, { value: string; isEditing: boolean }>>({});

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

  const getPushTranslations = useCallback(async () => {
    try {
      const translations = await fetchPushTranslations(newsletterSpreadsheet, '2026', '24.07.26 - Garden Storage');
      setPushTranslations(translations);
    } catch (error) {
      console.error('Error fetching push translations:', error);
    }
  }, [newsletterSpreadsheet]);

  useEffect(() => {
    getPushTranslations();
    browser.storage.local.remove('push_campaign');
  }, [getPushTranslations]);

  const handleFile = useCallback(async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;

    await browser.storage.local.remove('push_campaign');

    const reader = new FileReader();
    reader.onload = async () => {
      const parsedCSV = CSVToArray(reader.result as string);
      const rows = parseCSV(parsedCSV);

      const stored: StoredCampaign = {
        id: Date.now(),
        title: 'Push Campaign',
        data: rows,
      };

      await browser.storage.local.set({ push_campaign: stored });
      setCampaign(stored);
      setActiveSlug(null);
      setCustomImages({});
      setCustomTemplates({});
      setCustomLpPaths({});
    };
    reader.readAsText(file);
  }, []);

  const handleGenerateAllSlugs = useCallback(async () => {
    if (!pushTranslations) {
      await showErrorAlert('Push translations not loaded yet. Please wait.');
      return;
    }

    if (!isValidTemplateId(chdeTemplateId)) {
      await showErrorAlert('Please enter a valid CHDE template ID (numbers only).');
      return;
    }

    const slugsToUse = selectedSlugs.length > 0 ? selectedSlugs : getAllSlugs();

    let campaignData = generateCampaignData(slugsToUse, chdeTemplateId, pushTranslations, campaignName);

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
          campaignData[slug]["[name='click_action']"] = `https://www.beliani.${domain}/content/${lpVal}/?utm_source=PUSH&utm_medium=${lpVal}&utm_campaign=garden+storage`;
        }
      }
    }

    if (Object.keys(campaignData).length === 0) {
      await showErrorAlert('No campaign data generated. Please check your configuration.');
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

    await Swal.fire({
      icon: 'success',
      title: 'Campaign Generated!',
      text: `Generated ${Object.keys(campaignData).length} rows with template ID ${chdeTemplateId}`,
    });
  }, [pushTranslations, chdeTemplateId, campaignName, selectedSlugs, customImages, customTemplates, customLpPaths]);

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
    async (slug: string) => {
      if (!campaign) return;
      const customLpPath = customLpPaths[slug];
      if (!customLpPath?.value) return;

      const baseConfig = BASE_SLUG_CONFIG[slug];
      if (!baseConfig) return;

      const updatedData = { ...campaign.data };
      if (updatedData[slug]) {
        updatedData[slug]["[name='lp_path']"] = customLpPath.value;
        updatedData[slug]["[name='click_action']"] = `https://www.beliani.${baseConfig.domain}/content/${customLpPath.value}/?utm_source=PUSH&utm_medium=${customLpPath.value}&utm_campaign=garden+storage`;
      }

      const updatedCampaign = { ...campaign, data: updatedData };
      await browser.storage.local.set({ push_campaign: updatedCampaign });
      setCampaign(updatedCampaign);
      setCustomLpPaths(prev => ({ ...prev, [slug]: { value: customLpPath.value, isEditing: false } }));
    },
    [campaign, customLpPaths],
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

  const renderDashboardContent = () => (
    <div className={styles.dashboardOverlay}>
      <button onClick={hideOverlay} className={styles.closeButton}>
        ✕ Close
      </button>

      <label className={styles.uploadLabel}>
        📎 Upload CSV
        <input type="file" accept="text/csv" onChange={handleFile} />
      </label>

      <div className={styles.fieldGroup}>
        <label>Campaign Name (for URL generation):</label>
        <input
          type="text"
          placeholder="e.g., 24.07.26 - Garden Storage"
          value={campaignName}
          onChange={e => setCampaignName(e.target.value)}
          className={styles.input}
        />
        {campaignName && (
          <div className={styles.metaRowInfo}>
            <span>📅 Date: {parseCampaignName(campaignName).date}</span>
            <span>🔢 Version: {parseCampaignName(campaignName).version}</span>
            <span>🖼️ Image: {generateImageUrl(campaignName)}</span>
            <span>🔗 LP Path: {generateLpPath(campaignName)}</span>
          </div>
        )}
      </div>

      <BigImagePreview
        src={previewImage?.src || null}
        alt={previewImage?.alt || 'Preview'}
        onClose={() => setPreviewImage(null)}
      />

      <div className={styles.chdeRow}>
        <span className={styles.chdeLabel}>CHDE Template ID:</span>
        <input
          type="text"
          value={chdeTemplateId}
          onChange={e => setChdeTemplateId(e.target.value)}
          placeholder="Enter CHDE template ID"
          className={styles.input}
        />
        <button
          onClick={handleGenerateAllSlugs}
          disabled={!pushTranslations || !isValidTemplateId(chdeTemplateId)}
          className={styles.btnGenerate}
        >
          Generate All
        </button>
      </div>

      <div className={styles.slugSection}>
        <div className={styles.slugToolbar}>
          <button onClick={selectAllSlugs} className={styles.btnSelect}>
            Select All
          </button>
          <button onClick={deselectAllSlugs} className={styles.btnSelect}>
            Deselect All
          </button>
          <span className={styles.selectedCount}>{selectedSlugs.length} selected</span>
        </div>
        <div className={styles.slugGrid}>
          {SLUG_ORDER.map(slug => (
            <label
              key={slug}
              className={`${styles.slugChip} ${selectedSlugs.includes(slug) ? styles.selected : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedSlugs.includes(slug)}
                onChange={() => toggleSlugSelection(slug)}
              />
              {slug}
            </label>
          ))}
        </div>
      </div>

      {campaign && Object.keys(campaign.data).length > 0 && (
        <div className={styles.templatePreviewBox}>
          <span className={styles.title}>Template IDs based on CHDE: {chdeTemplateId}</span>
          <div className={styles.badgeList}>
            {Object.entries(campaign.data)
              .slice(0, 5)
              .map(([slug, rowData]) => (
                <span key={slug} className={styles.templateBadge}>
                  {slug.toUpperCase()}: {rowData["[name='template']"]}
                </span>
              ))}
            {Object.keys(campaign.data).length > 5 && (
              <span className={styles.templateBadge}>+{Object.keys(campaign.data).length - 5} more</span>
            )}
          </div>
        </div>
      )}

      {!campaign || Object.keys(campaign.data).length === 0 ? (
        <p className={styles.emptyState}>
          No campaign loaded.
          <br />
          Upload a CSV or enter CHDE ID and click "Generate All".
        </p>
      ) : (
        <>
          <div className={styles.campaignActions}>
            <button
              onClick={handleTest3Random}
              disabled={isRandomTesting || isSendingAll || Object.keys(campaign.data).length === 0}
              className={styles.btnTestRandom}
            >
              {isRandomTesting ? 'Testing 3 Random...' : '🚀 Test 3 Random'}
            </button>
            <button
              onClick={handleSendAll}
              disabled={isSendingAll || isRandomTesting || Object.keys(campaign.data).length === 0}
              className={styles.btnSendAll}
            >
              {isSendingAll ? 'Sending All...' : '⚠️ Send All'}
            </button>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Slug</th>
                  {campaign &&
                    Object.keys(campaign.data).length > 0 &&
                    Object.keys(Object.values(campaign.data)[0]).map(header => {
                      let displayName = header;
                      if (header === "[name='image']") displayName = 'Image';
                      else if (header === "[name='icon']") displayName = 'Icon';
                      else if (header === "[name='click_action']") displayName = 'Target URL';
                      else if (header === "[name='title']") displayName = 'Title';
                      else if (header === "[name='body']") displayName = 'Body';
                      else if (header === "[name='shop']") displayName = 'Shop';
                      else if (header === "[name='template']") displayName = 'Template';
                      else if (header === "[name='language[]']") displayName = 'Language';
                      else if (header === "[name='cta_lang']") displayName = 'CTA Lang';
                      else if (header === "[name='lp_path']") displayName = 'LP Path';
                      else displayName = header.replace(/[\[\]']/g, '');

                      return (
                        <th key={header} className={styles.colFixed}>
                          {displayName}
                        </th>
                      );
                    })}
                  <th>Custom Image</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(campaign.data).map(([slug, rowData]) => {
                  const customImage = customImages[slug];
                  const isCustomEnabled = customImage?.enabled || false;
                  const customImageUrl = customImage?.url || '';
                  const isImageEditing = customImage?.isEditing || false;

                  const customTemplate = customTemplates[slug];
                  const isTemplateEditing = customTemplate?.isEditing || false;

                  const customLpPath = customLpPaths[slug];
                  const isLpEditing = customLpPath?.isEditing || false;

                  return (
                    <tr key={slug} className={activeSlug === slug ? styles.activeRow : ''}>
                      <td className={styles.slugCell}>{slug.toUpperCase()}</td>

                      {Object.entries(rowData).map(([key, value]) => {
                        const isImage = key === "[name='image']";
                        const isIcon = key === "[name='icon']";
                        const isClickAction = key === "[name='click_action']";
                        const isTemplate = key === "[name='template']";
                        const isLpPath = key === "[name='lp_path']";

                        let displayValue = value;
                        if (isImage && customImage?.enabled && !customImage.isEditing && customImage.url) {
                          displayValue = customImage.url;
                        }

                        if (isTemplate) {
                          const templateId = customTemplate?.value || value;
                          const prologisticsUrl = `https://www.prologistics.info/news_email.php?id=${templateId}`;

                          return (
                            <td key={key}>
                              {isTemplateEditing ? (
                                <div className={styles.inlineControl}>
                                  <input
                                    type="text"
                                    value={customTemplate?.value || value}
                                    onChange={e => updateCustomTemplateValue(slug, e.target.value)}
                                    placeholder="Enter template ID"
                                    className={styles.inputSmall}
                                    autoFocus
                                  />
                                  <div className={styles.inlineBtnRow}>
                                    <button
                                      onClick={() => saveCustomTemplate(slug)}
                                      className={styles.btnSave}
                                      disabled={!customTemplate?.value}
                                    >
                                      Save
                                    </button>
                                    <button onClick={() => toggleCustomTemplate(slug)} className={styles.btnCancel}>
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className={styles.inlineControl}>
                                  <a
                                    href={prologisticsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.linkAction}
                                  >
                                    {templateId}
                                  </a>
                                  <button onClick={() => toggleCustomTemplate(slug)} className={styles.btnEdit}>
                                    ✎ Edit
                                  </button>
                                </div>
                              )}
                            </td>
                          );
                        }

                        if (isLpPath) {
                          return (
                            <td key={key}>
                              {isLpEditing ? (
                                <div className={styles.inlineControl}>
                                  <input
                                    type="text"
                                    value={customLpPath?.value || value}
                                    onChange={e => updateCustomLpPath(slug, e.target.value)}
                                    placeholder="Enter LP path"
                                    className={styles.inputSmall}
                                    autoFocus
                                  />
                                  <div className={styles.inlineBtnRow}>
                                    <button
                                      onClick={() => saveCustomLpPath(slug)}
                                      className={styles.btnSave}
                                      disabled={!customLpPath?.value}
                                    >
                                      Save
                                    </button>
                                    <button onClick={() => toggleCustomLpPath(slug)} className={styles.btnCancel}>
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className={styles.inlineControl}>
                                  <span>{customLpPath?.value || value}</span>
                                  <button onClick={() => toggleCustomLpPath(slug)} className={styles.btnEdit}>
                                    ✎ Edit
                                  </button>
                                </div>
                              )}
                            </td>
                          );
                        }

                        if (isClickAction) {
                          const domain = BASE_SLUG_CONFIG[slug]?.domain || '';
                          const currentLpPath = customLpPaths[slug]?.value || rowData["[name='lp_path']"] || campaignName;
                          const fullUrl = `https://www.beliani.${domain}/content/${currentLpPath}/?utm_source=PUSH&utm_medium=${currentLpPath}&utm_campaign=garden+storage`;

                          return (
                            <td key={key}>
                              <a
                                href={fullUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${styles.linkAction} ${styles.textTruncate}`}
                                title={fullUrl}
                              >
                                {fullUrl}
                              </a>
                            </td>
                          );
                        }

                        return (
                          <td key={key}>
                            {isImage && displayValue && (
                              <ImagePreview
                                src={displayValue}
                                alt={`Push image for ${slug}`}
                                size="small"
                                onClick={() =>
                                  setPreviewImage({ src: displayValue, alt: `Push Image - ${slug.toUpperCase()}` })
                                }
                              />
                            )}
                            {isIcon && value && (
                              <ImagePreview
                                src={value}
                                alt={`Icon for ${slug}`}
                                size="small"
                                onClick={() => setPreviewImage({ src: value, alt: `Icon - ${slug.toUpperCase()}` })}
                              />
                            )}
                            {!isImage && !isIcon && !isTemplate && !isLpPath && !isClickAction && value && (
                              <span className={styles.textTruncate}>{value}</span>
                            )}
                          </td>
                        );
                      })}

                      <td>
                        <div className={styles.inlineControl}>
                          <label className={styles.slugChip}>
                            <input
                              type="checkbox"
                              checked={isCustomEnabled}
                              onChange={() => toggleCustomImage(slug)}
                              disabled={isRandomTesting || isSendingAll || !!busySlug}
                            />
                            Custom
                          </label>
                          {isCustomEnabled && isImageEditing && (
                            <>
                              <input
                                type="text"
                                value={customImageUrl}
                                onChange={e => updateCustomImageUrl(slug, e.target.value)}
                                placeholder="Enter image URL"
                                className={styles.inputSmall}
                              />
                              <button
                                onClick={() => saveCustomImage(slug)}
                                disabled={!customImageUrl}
                                className={styles.btnSave}
                              >
                                Save
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className={styles.tableActionBtns}>
                          <button
                            onClick={() => handleTestRow(slug)}
                            disabled={!!busySlug || isRandomTesting || isSendingAll}
                            className={styles.btnRowTest}
                          >
                            Test
                          </button>
                          <button
                            onClick={() => handleSendRow(slug)}
                            disabled={!!busySlug || isRandomTesting || isSendingAll}
                            className={styles.btnRowSend}
                          >
                            Send
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.footerInfo}>
            <span>Total rows: {Object.keys(campaign.data).length}</span>
            <span>Campaign: {campaign.title}</span>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {!visible && <OverlayToggleButton onClick={showOverlay} />}
      <Overlay visible={visible}>{visible && renderDashboardContent()}</Overlay>
    </>
  );
}