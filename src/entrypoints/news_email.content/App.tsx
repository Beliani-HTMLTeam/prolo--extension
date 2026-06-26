import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import styles from './App.module.scss';
import AvailableBanners from './components/AvailableBanners';
import CampaignPreview from './components/CampaignPreview';
import NewsletterLayout from './components/NewsletterLayout';
import { getNewsletterIdsMap } from './utils/dom';
import { updateNewslettersBatch, UpdateResult } from './utils/api';
import { BannerType, TimerConfig } from './types';
import {
  getDaysBetweenInclusive,
  matchesBannerSearchTerm,
  normalizeBannerOrder,
  buildBannerLink,
} from './utils/banner';
import newsletterTemplate from './template.html?raw';

import AppProviders from '@/components/app/AppProviders';
import Overlay from '@/components/overlay/Overlay';
import OverlayToggleButton from '@/components/overlay/OverlayToggleButton';
import TopBar from '@/components/overlay/TopBar';
import useOverlayVisibility from '@/hooks/useOverlayVisibility';
import ActionButton from '@/components/Button';
import CustomBannerModal from './components/CustomBannerModal';
import SelectNewslettersModal from './components/SelectNewslettersModal';
import GenerateNewslettersModal from './components/GenerateNewslettersModal';
import TimerBannerModal from './components/TimerBannerModal';
import PreviewBannersModal from './components/PreviewBannersModal';

type NewsletterMapping = {
  slug: string;
  id: string;
};

const buildAvailableBanners = () => {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 14);

  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 14);

  return getDaysBetweenInclusive(startDate, endDate).map((date, index) => ({
    id: date,
    order: index + 1,
    date,
  }));
};

const createBannerId = () =>
  globalThis.crypto?.randomUUID?.() ?? `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`;

type PendingBannerEdit = {
  banner: BannerType;
};

const NewsEmailAppContent = () => {
  const [isSundayNewsletter, setIsSundayNewsletter] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCustomBannerOpen, setIsCustomBannerOpen] = useState(false);
  const [isSelectNewslettersOpen, setIsSelectNewslettersOpen] = useState(false);
  const [isGenerateNewslettersOpen, setIsGenerateNewslettersOpen] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);
  const [updateResults, setUpdateResults] = useState<UpdateResult[]>([]);
  const [updateCompleted, setUpdateCompleted] = useState(0);
  const [updateTotal, setUpdateTotal] = useState(0);
  const [updateSelectedSlugs, setUpdateSelectedSlugs] = useState<string[]>([]);
  const [generateNewsletterMappings, setGenerateNewsletterMappings] = useState<NewsletterMapping[]>([]);
  const [generateCurrentSlug, setGenerateCurrentSlug] = useState<string | null>(null);

  const [pendingBannerEdit, setPendingBannerEdit] = useState<PendingBannerEdit | null>(null);
  const [pendingTimerBanner, setPendingTimerBanner] = useState<BannerType | null>(null);
  const [previewBannersBanner, setPreviewBannersBanner] = useState<BannerType | null>(null);

  const [translations, setTranslations] = useState<{
    header: Record<string, any>;
    footer: Record<string, any>;
    templates: Record<string, any>;
  } | null>(null);

  const [selectedBanners, setSelectedBanners] = useState<BannerType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  const availableBanners = useMemo(() => buildAvailableBanners(), []);
  const selectedDates = useMemo(
    () => new Set(selectedBanners.flatMap(banner => (banner.date ? [banner.date] : []))),
    [selectedBanners],
  );
  const filteredAvailableBanners = useMemo(() => {
    return availableBanners.filter(banner => matchesBannerSearchTerm(banner.date, searchQuery));
  }, [availableBanners, searchQuery]);

  const checkForSundayNewsletter = () => {
    console.log('Checking for Sunday newsletter in select2...');
    const selectElement = document.querySelector('.select2-selection__rendered');
    if (!selectElement) return false;

    let found = false;
    selectElement.childNodes.forEach(child => {
      if (child.textContent?.replace('×', '') === 'Sunday newsletter') {
        found = true;
      }
    });

    setIsSundayNewsletter(found);
    return found;
  };

  const addBanner = (banner: BannerType) => {
    setSelectedBanners(prev => {
      if (prev.some(existing => existing.id === banner.id)) return prev;
      return normalizeBannerOrder([...prev, banner]);
    });
  };

  const addCustomBanner = () => {
    setIsCustomBannerOpen(true);
  };

  const handleCustomBannerConfirm = (srcSuffix: string, href: string) => {
    setSelectedBanners(prev =>
      normalizeBannerOrder([
        ...prev,
        {
          id: createBannerId(),
          order: prev.length + 1,
          isCustom: true,
          customSrcSuffix: srcSuffix,
          customHref: href,
        },
      ]),
    );
    setIsCustomBannerOpen(false);
  };

  const removeBanner = (banner: BannerType) => {
    setSelectedBanners(prev => normalizeBannerOrder(prev.filter(existing => existing.id !== banner.id)));
  };

  const handleTimerRequest = (banner: BannerType) => {
    setPendingTimerBanner(banner);
  };

  const handleTimerConfirm = (config: TimerConfig) => {
    if (!pendingTimerBanner) return;
    setSelectedBanners(prev =>
      prev.map(existing => (existing.id === pendingTimerBanner.id ? { ...existing, timerConfig: config } : existing)),
    );
    setPendingTimerBanner(null);
  };

  const handleTimerRemove = () => {
    if (!pendingTimerBanner) return;
    setSelectedBanners(prev =>
      prev.map(existing =>
        existing.id === pendingTimerBanner.id ? { ...existing, timerConfig: undefined } : existing,
      ),
    );
    setPendingTimerBanner(null);
  };

  const handleEditBannerRequest = (banner: BannerType) => {
    setPendingBannerEdit({ banner });
  };

  const handleEditBannerConfirm = (srcSuffix: string, href: string) => {
    if (!pendingBannerEdit) return;
    setSelectedBanners(prev =>
      prev.map(existing =>
        existing.id === pendingBannerEdit.banner.id
          ? {
              ...existing,
              customSrcSuffix: existing.isCustom ? srcSuffix : existing.customSrcSuffix,
              customHref: href,
            }
          : existing,
      ),
    );
    setPendingBannerEdit(null);
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();

    if (dragIndex === null || dragIndex === index) return;

    setSelectedBanners(prev => {
      const next = [...prev];
      const [draggedItem] = next.splice(dragIndex, 1);
      next.splice(index, 0, draggedItem);
      return normalizeBannerOrder(next);
    });

    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  useEffect(() => {
    checkForSundayNewsletter();

    Promise.all([
      fetch('https://tj31c889tzsk.share.zrok.io/api/sheets/static/header').then(r => r.json()),
      fetch('https://tj31c889tzsk.share.zrok.io/api/sheets/static/footer').then(r => r.json()),
      fetch('https://tj31c889tzsk.share.zrok.io/api/sheets/static/templates').then(r => r.json()),
    ])
      .then(([headerRes, footerRes, templatesRes]) => {
        setTranslations({
          header: headerRes.data,
          footer: footerRes.data,
          templates: templatesRes.data,
        });
      })
      .catch(err => console.error('Failed to fetch translations:', err));

    const selectElement = document.querySelector('.select2-selection__rendered');

    if (selectElement && !observerRef.current) {
      observerRef.current = new MutationObserver(mutations => {
        let shouldRecheck = false;

        mutations.forEach(mutation => {
          if (mutation.type === 'childList' || mutation.type === 'characterData') {
            shouldRecheck = true;
          }
        });

        if (shouldRecheck) {
          checkForSundayNewsletter();
        }
      });

      observerRef.current.observe(selectElement, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  const newsId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    return id ? Number(id) : NaN;
  }, []);

  const cookieKey = useMemo(() => `${newsId}.overlayVisible`, [newsId]);
  const { visible, showOverlay, hideOverlay } = useOverlayVisibility(cookieKey, false);

  const handleUpdateNewsletters = async (slugs: string[], isGenerateAll: boolean) => {
    const idMap = getNewsletterIdsMap();
    const currentSlug = Object.entries(idMap).find(([, data]) => data.id === String(newsId))?.[0] ?? null;

    setIsUpdating(true);
    setUpdateResults([]);
    setUpdateCompleted(0);
    setUpdateTotal(slugs.length);
    setUpdateSelectedSlugs(slugs);

    await updateNewslettersBatch(
      slugs,
      idMap,
      newsletterTemplate,
      selectedBanners,
      translations,
      (completed, results) => {
        setUpdateCompleted(completed);
        setUpdateResults([...results]);
      },
      3, // concurrency limit
      { currentSlug },
    );

    setIsUpdating(false);
  };

  const resetUpdateState = () => {
    setIsUpdating(false);
    setUpdateResults([]);
    setUpdateCompleted(0);
    setUpdateTotal(0);
    setUpdateSelectedSlugs([]);
  };

  const handleGenerateConfirm = () => {
    const allSlugs = generateNewsletterMappings.map(({ slug }) => slug);
    handleUpdateNewsletters(allSlugs, true);
  };

  const handleOpenGenerateNewsletters = () => {
    const idMap = getNewsletterIdsMap();
    const mappings = Object.entries(idMap).map(([slug, data]) => ({ slug, id: data.id }));
    setGenerateNewsletterMappings(mappings);
    setGenerateCurrentSlug(mappings.find(mapping => mapping.id === String(newsId))?.slug ?? null);
    setIsGenerateNewslettersOpen(true);
  };

  if (!isSundayNewsletter) return null;

  const editBanner = pendingBannerEdit?.banner;
  const editInitialSrcSuffix = editBanner?.customSrcSuffix ?? '';
  const editInitialHref = editBanner?.customHref ?? (editBanner?.date ? buildBannerLink(editBanner.date) : '');

  return (
    <>
      {!visible && <OverlayToggleButton onClick={showOverlay}>Dashboard</OverlayToggleButton>}

      <Overlay visible={visible}>
        <TopBar onHide={hideOverlay} />

        <div className={styles.content}>
          <section className={styles.panel}>
            <NewsletterLayout
              banners={selectedBanners}
              dragIndex={dragIndex}
              onRemoveBanner={removeBanner}
              onEditBannerRequest={handleEditBannerRequest}
              onTimerRequest={handleTimerRequest}
              onPreviewBannersRequest={setPreviewBannersBanner}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            />

            <div className={styles.actionRow}>
              <ActionButton label="Add custom banner" onClick={addCustomBanner} icon="tabler:plus" variant="ghost" />
              <ActionButton
                label="Preview newsletter"
                onClick={() => setIsPreviewOpen(true)}
                disabled={selectedBanners.length === 0}
                variant="primary"
              />
              <ActionButton label="Generate newsletters" onClick={handleOpenGenerateNewsletters} variant="ghost" />
              <ActionButton
                label="Select newsletters to update"
                onClick={() => setIsSelectNewslettersOpen(true)}
                variant="ghost"
              />
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Available banners</h2>

              <p>
                Range: <strong>{availableBanners[0]?.date}</strong> to{' '}
                <strong>{availableBanners[availableBanners.length - 1]?.date}</strong>
              </p>

              <div className={styles.searchbar}>
                <input
                  type="text"
                  placeholder="Search by date..."
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                />
              </div>
            </div>

            <AvailableBanners
              banners={filteredAvailableBanners}
              selectedDates={selectedDates}
              onAddBanner={addBanner}
              onPreviewBannersRequest={setPreviewBannersBanner}
            />
          </section>
        </div>

        {/* Preview newsletter modal */}
        <CampaignPreview isOpen={isPreviewOpen} banners={selectedBanners} translations={translations} onClose={() => setIsPreviewOpen(false)} />

        {/* Preview banners modal */}
        <PreviewBannersModal
          isOpen={previewBannersBanner !== null}
          banner={previewBannersBanner}
          onClose={() => setPreviewBannersBanner(null)}
        />

        {/* Add custom banner modal */}
        <CustomBannerModal
          isOpen={isCustomBannerOpen}
          isCustomBanner
          onClose={() => setIsCustomBannerOpen(false)}
          onConfirm={handleCustomBannerConfirm}
        />

        {/* Edit banner modal */}
        <CustomBannerModal
          isOpen={pendingBannerEdit !== null}
          initialSrcSuffix={editInitialSrcSuffix}
          initialHref={editInitialHref}
          isCustomBanner={editBanner?.isCustom ?? false}
          onClose={() => setPendingBannerEdit(null)}
          onConfirm={handleEditBannerConfirm}
        />

        {/* Select newsletters to update modal */}
        <SelectNewslettersModal
          isOpen={isSelectNewslettersOpen}
          isUpdating={isUpdating && !isGenerateNewslettersOpen}
          completed={updateCompleted}
          total={updateTotal}
          selectedSlugs={updateSelectedSlugs}
          results={updateResults}
          onClose={() => {
            if (!isUpdating) {
              setIsSelectNewslettersOpen(false);
              resetUpdateState();
            }
          }}
          onReset={resetUpdateState}
          onConfirm={slugs => {
            handleUpdateNewsletters(slugs, false);
          }}
        />

        {/* Timer modal */}
        <TimerBannerModal
          isOpen={pendingTimerBanner !== null}
          initialConfig={pendingTimerBanner?.timerConfig}
          onClose={() => setPendingTimerBanner(null)}
          onConfirm={handleTimerConfirm}
          onRemove={pendingTimerBanner?.timerConfig ? handleTimerRemove : undefined}
        />

        {/* Generate newsletters confirm modal */}
        <GenerateNewslettersModal
          isOpen={isGenerateNewslettersOpen}
          newsId={newsId}
          isUpdating={isUpdating}
          completed={updateCompleted}
          total={updateTotal}
          selectedSlugs={updateSelectedSlugs}
          results={updateResults}
          mappedNewsletters={generateNewsletterMappings}
          currentNewsletterSlug={generateCurrentSlug}
          onClose={() => {
            if (!isUpdating) {
              setIsGenerateNewslettersOpen(false);
              setGenerateNewsletterMappings([]);
              setGenerateCurrentSlug(null);
              resetUpdateState();
            }
          }}
          onReset={resetUpdateState}
          onConfirm={handleGenerateConfirm}
        />
      </Overlay>
    </>
  );
};

const NewsEmailApp = () => (
  <AppProviders>
    <NewsEmailAppContent />
  </AppProviders>
);

export default NewsEmailApp;
