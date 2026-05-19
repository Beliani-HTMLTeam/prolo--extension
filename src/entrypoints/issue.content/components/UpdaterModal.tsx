import {
  UpdaterDateConfig,
  UpdaterProps,
  UpdaterSelectedItem,
  UpdaterSlugDateConfig,
  UpdaterSlugLPConfig,
} from '@/entrypoints/newtab/types/Updater';
import { fetchIssueData, fetchSpreadsheetTranslationsTab, fetchSubjectPageTranslations } from '../api/issueData';
import { useEffect, useState } from 'react';
import { IssueListItem, LineTitleTranslations } from '../lib/types';
import clsx from 'clsx';
import formStyles from '../styles/forms.module.scss';
import layoutStyles from '../styles/layout.module.scss';
import updaterStyles from '../styles/updater.module.scss';
import { ModalHeader } from './planningmodal/ModalHeader';
import UpdaterTable from './slptupdater/UpdaterTable';
import UpdaterButtons from './slptupdater/UpdaterButtons';
import {
  formatDateForAPI,
  formatDateForInput,
  getDefaultDeactivateDate,
  getTodayAtMidnight,
  setDateToSunday23_59,
} from '@/entrypoints/newtab/utils/updater/dates';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const fetchLPPaths = async (issueItem: IssueListItem): Promise<string> => {
  const tabName = await fetchSpreadsheetTranslationsTab(issueItem); // "22.05.26 - Beds" format

  if (!tabName) return '';

  let year: string, month: string, day: string;

  let dateMatch = tabName.match(/(\d{2})\.(\d{2})\.(\d{2})/); // DD.MM.YY format
  if (dateMatch) {
    // format: DD.MM.YY
    [, day, month, year] = dateMatch;
  } else {
    // DD.MM.YYYY format
    dateMatch = tabName.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    if (dateMatch) {
      [, day, month, year] = dateMatch;
      year = year.slice(-2);
    } else {
      return '';
    }
  }

  return `lp${year}-${month}-${day}`;
};

const UpdaterModal = ({ rows, issueId, onClose }: UpdaterProps) => {
  const [translations, setTranslations] = useState<LineTitleTranslations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<UpdaterSelectedItem[]>([]);

  // global date configuation (for all slugs)
  const [globalDateConfig, setGlobalDateConfig] = useState<UpdaterDateConfig>({
    activateDate: getTodayAtMidnight(),
    deactivateDate: getDefaultDeactivateDate(),
  });

  // per-slug date configuration that overrides the global configuration
  // e.g. for FD or MD
  const [slugDateConfig, setSlugDateConfig] = useState<UpdaterSlugDateConfig>({});

  const [slugLPConfig, setSlugLPConfig] = useState<UpdaterSlugLPConfig>({});

  // toggle between global and per-slug configuration
  const [useGlobalDate, setUseGlobalDate] = useState(true);
  const [useGlobalLP, setUseGlobalLP] = useState(true);
  const [globalLP, setGlobalLP] = useState('');

  const [slugFMDModes, setSlugFMDModes] = useState<Record<string, { fd: boolean; md: boolean }>>({});

  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const loadIssueData = async () => {
      setLoading(true);
      try {
        const issueData = await fetchIssueData(issueId);
        const issueItem = issueData.issue_list?.[0];
        if (!issueItem) {
          console.warn('No issue data found for issue ID:', issueId);
          setError('Issue data not found');
          return;
        }
        const rawTranslations = await fetchSubjectPageTranslations(issueItem);

        console.log('Raw translations: ', rawTranslations);
        const availableSlugs = new Set(rows.map(row => row.shop));

        const filteredTranslations: LineTitleTranslations = {
          subjectLine: rawTranslations.subjectLine
            ? Object.entries(rawTranslations.subjectLine)
                .filter(([slug]) => availableSlugs.has(slug))
                .reduce(
                  (acc, [slug, content]) => ({
                    ...acc,
                    [slug]: content,
                  }),
                  {},
                )
            : null,
          pageTitle: rawTranslations.pageTitle
            ? Object.entries(rawTranslations.pageTitle)
                .filter(([slug]) => availableSlugs.has(slug))
                .reduce(
                  (acc, [slug, content]) => ({
                    ...acc,
                    [slug]: content,
                  }),
                  {},
                )
            : null,
        };

        if (filteredTranslations.subjectLine && Object.keys(filteredTranslations.subjectLine).length === 0) {
          filteredTranslations.subjectLine = null;
        }

        if (filteredTranslations.pageTitle && Object.keys(filteredTranslations.pageTitle).length === 0) {
          filteredTranslations.pageTitle = null;
        }

        setTranslations(filteredTranslations);

        const initialSlugDates: UpdaterSlugDateConfig = {};
        const initialSlugLPs: UpdaterSlugLPConfig = {};
        const initialFMDModes: Record<string, { fd: boolean; md: boolean }> = {};

        const allSlugs = new Set([
          ...(filteredTranslations.subjectLine ? Object.keys(filteredTranslations.subjectLine) : []),
          ...(filteredTranslations.pageTitle ? Object.keys(filteredTranslations.pageTitle) : []),
        ]);

        const globalLP = await fetchLPPaths(issueItem);
        setGlobalLP(globalLP);

        allSlugs.forEach(slug => {
          initialSlugDates[slug] = {
            activateDate: getTodayAtMidnight(),
            deactivateDate: getDefaultDeactivateDate(),
          };

          initialSlugLPs[slug] = globalLP;
          initialFMDModes[slug] = { fd: false, md: false };
        });

        setSlugDateConfig(initialSlugDates);
        setSlugLPConfig(initialSlugLPs);
        setSlugFMDModes(initialFMDModes);
      } catch (e) {
        console.error('Failed to load SL/PT translations: ', e);
        setError('Failed to load translations');
      } finally {
        setLoading(false);
      }
    };

    void loadIssueData();
  }, [issueId, rows]);

  const handleSlugFMDModeChange = (slug: string, type: 'fd' | 'md', checked: boolean) => {
    setSlugFMDModes(prev => ({
      ...prev,
      [slug]: {
        ...prev[slug],
        [type]: checked,
      },
    }));

    if (checked) {
      setUseGlobalLP(false);
    }
  };

  const handleToggleSL = (slug: string, checked: boolean, content: string) => {
    if (checked) {
      setSelectedItems(prev => [...prev, { slug, type: 'subjectLine', content }]);
    } else {
      setSelectedItems(prev => prev.filter(item => !(item.slug === slug && item.type === 'subjectLine')));
    }
  };

  const handleTogglePT = (slug: string, checked: boolean, content: string) => {
    if (checked) {
      setSelectedItems(prev => [...prev, { slug, type: 'pageTitle', content }]);
    } else {
      setSelectedItems(prev => prev.filter(item => !(item.slug === slug && item.type === 'pageTitle')));
    }
  };

  const handleSelectedAllSL = () => {
    if (!translations?.subjectLine) return;
    const allSlugs = Object.keys(translations.subjectLine) as Array<keyof typeof translations.subjectLine>;
    const allSLItems = allSlugs.map(slug => ({
      slug,
      type: 'subjectLine' as const,
      content: translations.subjectLine![slug],
    }));

    const currentSLSlugs = new Set(selectedItems.filter(item => item.type === 'subjectLine').map(item => item.slug));

    if (currentSLSlugs.size === allSlugs.length) {
      setSelectedItems(prev => prev.filter(item => item.type !== 'subjectLine'));
    } else {
      setSelectedItems(prev => [...prev.filter(item => item.type !== 'subjectLine'), ...allSLItems]);
    }
  };

  const handleSelectedAllPT = () => {
    if (!translations?.pageTitle) return;
    const allSlugs = Object.keys(translations.pageTitle) as Array<keyof typeof translations.pageTitle>;
    const allPTItems = allSlugs.map(slug => ({
      slug,
      type: 'pageTitle' as const,
      content: translations.pageTitle![slug],
    }));

    const currentPTSlugs = new Set(selectedItems.filter(item => item.type === 'pageTitle').map(item => item.slug));

    if (currentPTSlugs.size === allSlugs.length) {
      setSelectedItems(prev => prev.filter(item => item.type !== 'pageTitle'));
    } else {
      setSelectedItems(prev => [...prev.filter(item => item.type !== 'pageTitle'), ...allPTItems]);
    }
  };

  const handleClearAll = () => {
    setSelectedItems([]);
  };

  const handleGlobalActivateDateChange = (date: Date | null) => {
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0);
      setGlobalDateConfig(prev => ({ ...prev, activateDate: newDate }));
    }
  };

  const handleGlobalDeactivateDateChange = (date: Date | null) => {
    if (date) {
      const sundayDate = setDateToSunday23_59(date);
      setGlobalDateConfig(prev => ({ ...prev, deactivateDate: sundayDate }));
    }
  };

  const handleGlobalLPChange = (lp: string) => {
    setGlobalLP(lp);

    if (useGlobalLP) {
      const updatedSlugLPs: UpdaterSlugLPConfig = {};
      Object.keys(slugLPConfig).forEach(slug => {
        updatedSlugLPs[slug] = lp;
      });
      setSlugLPConfig(updatedSlugLPs);
    }
  };

  const handleUseGlobalLPToggle = (checked: boolean) => {
    setUseGlobalLP(checked);

    if (checked) {
      const updatedSlugLPs: UpdaterSlugLPConfig = {};
      Object.keys(slugLPConfig).forEach(slug => {
        updatedSlugLPs[slug] = globalLP;
      });
      setSlugLPConfig(updatedSlugLPs);

      const resetFMDModes: Record<string, { fd: boolean; md: boolean }> = {};
      Object.keys(slugFMDModes).forEach(slug => {
        resetFMDModes[slug] = { fd: false, md: false };
      });
      setSlugFMDModes(resetFMDModes);
    }
  };

  const handleSlugActivateDateChange = (slug: string, date: Date | null) => {
    if (date) {
      date.setHours(0, 0, 0, 0);
      setSlugDateConfig(prev => ({
        ...prev,
        [slug]: { ...prev[slug], activateDate: date },
      }));
    }
  };

  const handleSlugDeactivateDateChange = (slug: string, date: Date | null) => {
    if (date) {
      const sundayDate = setDateToSunday23_59(date);
      setSlugDateConfig(prev => ({
        ...prev,
        [slug]: { ...prev[slug], deactivateDate: sundayDate },
      }));
    }
  };

  const handleSlugLPChange = (slug: string, lp: string) => {
    setSlugLPConfig(prev => ({
      ...prev,
      [slug]: lp,
    }));
  };

  const getDateForSlug = (slug: string, type: 'activate' | 'deactivate'): Date => {
    if (!useGlobalDate && slugDateConfig[slug]) {
      return slugDateConfig[slug][type === 'activate' ? 'activateDate' : 'deactivateDate'];
    }
    return globalDateConfig[type === 'activate' ? 'activateDate' : 'deactivateDate'];
  };

  const getLPForSlug = (slug: string): string => {
    if (useGlobalLP) {
      return globalLP;
    }

    let baseLP = slugLPConfig[slug] || globalLP;
    baseLP = baseLP.replace(/fd|md$/, '');

    // FD/MD is enabled
    const modes = slugFMDModes[slug];
    if (modes?.fd) {
      return `${baseLP}fd`;
    }
    if (modes?.md) {
      return `${baseLP}md`;
    }

    return baseLP;
  };

  const handleUpdateSelected = async () => {
    if (selectedItems.length === 0) {
      console.warn('No items selected to update');
      return;
    }

    setIsUpdating(true);

    try {
      const updatesBySlug: Record<string, any> = {};

      selectedItems.forEach(item => {
        if (!updatesBySlug[item.slug]) {
          updatesBySlug[item.slug] = {
            slug: item.slug,
            subjectLine: null,
            pageTitle: null,
            landingPage: getLPForSlug(item.slug),
            activateDate: getDateForSlug(item.slug, 'activate'),
            deactivateDate: getDateForSlug(item.slug, 'deactivate'),
          };
        }

        if (item.type === 'subjectLine') {
          updatesBySlug[item.slug].subjectLine = item.content;
        } else if (item.type === 'pageTitle') {
          updatesBySlug[item.slug].pageTitle = item.content;
        }
      });

      const formattedUpdates = Object.values(updatesBySlug).map(update => ({
        slug: update.slug,
        subjectLine: update.subjectLine,
        pageTitle: update.pageTitle,
        activateDate: formatDateForAPI(update.activateDate),
        deactivateDate: formatDateForAPI(update.deactivateDate),
        landingPage: update.landingPage,
      }));

      console.log('Updating with dates: ', formattedUpdates);

      // call to the API

      console.log('Successfully updated translations: ', error);
      onClose();
    } catch (e) {
      console.error('Failed to update translations: ', e);
      setError('Failed to update translations');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateAll = async () => {
    if (!translations) return;

    const allItems: UpdaterSelectedItem[] = [];

    if (translations.subjectLine) {
      Object.entries(translations.subjectLine).forEach(([slug, content]) => {
        allItems.push({
          slug,
          type: 'subjectLine',
          content,
        });
      });
    }

    if (translations.pageTitle) {
      Object.entries(translations.pageTitle).forEach(([slug, content]) => {
        allItems.push({
          slug,
          type: 'pageTitle',
          content,
        });
      });
    }

    if (allItems.length === 0) {
      console.warn('No items to update');
      return;
    }

    setSelectedItems(allItems);

    await handleUpdateSelected();
  };

  const handleSelectAllReady = () => {
    const readyItems: UpdaterSelectedItem[] = [];

    if (translations?.subjectLine) {
      Object.entries(translations.subjectLine).forEach(([slug, content]) => {
        if (content !== 'TRANSLATION NOT FOUND') {
          readyItems.push({
            slug,
            type: 'subjectLine',
            content,
          });
        }
      });
    }

    if (translations?.pageTitle) {
      Object.entries(translations.pageTitle).forEach(([slug, content]) => {
        if (content !== 'TRANSLATION NOT FOUND') {
          readyItems.push({
            slug,
            type: 'pageTitle',
            content,
          });
        }
      });
    }

    setSelectedItems(readyItems);
    console.log('Selecting all ready items:', readyItems);
  };


  return (
    <div className={clsx(formStyles.modalOverlay, layoutStyles.visible)} onClick={onClose}>
      <div className={clsx(updaterStyles.modal)} onClick={e => e.stopPropagation()}>
        <ModalHeader title="Subject Line & Page Title Updater" onClose={onClose} />
        <div className={updaterStyles.modalContent}>
          <div className={updaterStyles.menu}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className={updaterStyles.dateSection}>
                <div className={updaterStyles.dateHeader}>
                  <label>
                    <input type="checkbox" checked={useGlobalDate} onChange={e => setUseGlobalDate(e.target.checked)} />
                    Regular dates
                  </label>
                </div>
                <div className={updaterStyles.dateFields}>
                  <div className={updaterStyles.dateField}>
                    <label>Activate Date (00:00):</label>
                    <DatePicker
                      selected={globalDateConfig.activateDate}
                      onChange={handleGlobalActivateDateChange}
                      dateFormat="yyyy-MM-dd"
                      minDate={new Date()}
                      disabled={true}
                      className={!useGlobalDate ? updaterStyles.datePickerDisabled : updaterStyles.datePicker}
                      placeholderText="Select activate date"
                      wrapperClassName={updaterStyles.datePickerWrapper}
                    />
                  </div>
                  <div className={updaterStyles.dateField}>
                    <label>Deactivate Date (23:59, Sunday):</label>
                    <DatePicker
                      selected={globalDateConfig.deactivateDate}
                      onChange={handleGlobalDeactivateDateChange}
                      shouldCloseOnSelect={true}
                      dateFormat="yyyy-MM-dd"
                      minDate={new Date()}
                      disabled={!useGlobalDate}
                      className={!useGlobalDate ? updaterStyles.datePickerDisabled : updaterStyles.datePicker}
                      placeholderText="Select deactivate date"
                      wrapperClassName={updaterStyles.datePickerWrapper}
                    />
                  </div>
                </div>
              </div>
              <div className={updaterStyles.lpSection}>
                <div className={updaterStyles.lpHeader}>
                  <label>
                    <input
                      type="checkbox"
                      checked={useGlobalLP}
                      onChange={e => handleUseGlobalLPToggle(e.target.checked)}
                    />
                    Regular LP
                  </label>
                  {!useGlobalLP && (
                    <span className={updaterStyles.warningText}>(FD/MD mode enabled - per-shop LP IDs)</span>
                  )}
                </div>
                <div className={updaterStyles.lpField}>
                  <label>Landing Page:</label>
                  <input
                    type="text"
                    value={globalLP}
                    onChange={e => handleGlobalLPChange(e.target.value)}
                    disabled={!useGlobalLP}
                    className={!useGlobalLP ? updaterStyles.lpInputDisabled : ''}
                    placeholder="lp26-04-05"
                  />
                </div>
              </div>
            </div>
            <UpdaterButtons
              loading={loading || isUpdating}
              updateStarted={isUpdating}
              selectedSLCount={selectedItems.filter(item => item.type === 'subjectLine').length}
              selectedPTCount={selectedItems.filter(item => item.type === 'pageTitle').length}
              hasManualSelection={selectedItems.length > 0}
              onUpdateAllSL={handleSelectedAllSL}
              onUpdateSelectedSL={handleUpdateSelected}
              onUpdateAllPT={handleSelectedAllPT}
              onUpdateSelectedPT={handleUpdateSelected}
              onUpdateAll={handleUpdateAll}
              onUpdateSelected={handleUpdateSelected}
              onSelectAll={handleSelectAllReady}
              onClearAll={handleClearAll}
              onCancel={onClose}
            />
          </div>

          <div style={{ flex: 1 }}>
            <UpdaterTable
              translations={translations}
              loading={loading || isUpdating}
              onToggleSL={handleToggleSL}
              onTogglePT={handleTogglePT}
              selectedItems={selectedItems}
              getDateForSlug={getDateForSlug}
              getLPForSlug={getLPForSlug}
              onSlugActivateDateChange={handleSlugActivateDateChange}
              onSlugDeactivateDateChange={handleSlugDeactivateDateChange}
              onSlugLPChange={handleSlugLPChange}
              useGlobalDates={useGlobalDate}
              useGlobalLP={useGlobalLP}
              slugFMDModes={slugFMDModes}
              onSlugFMDModeChange={handleSlugFMDModeChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdaterModal;
