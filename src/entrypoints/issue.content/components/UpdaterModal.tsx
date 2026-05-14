import { UpdaterDateConfig, UpdaterProps, UpdaterSelectedItem, UpdaterSlugDateConfig } from '@/entrypoints/newtab/types/Updater';
import { fetchIssueData, fetchSubjectPageTranslations } from '../api/issueData';
import { useEffect, useState } from 'react';
import { LineTitleTranslations } from '../lib/types';
import clsx from 'clsx';
import formStyles from '../styles/forms.module.scss';
import layoutStyles from '../styles/layout.module.scss';
import planningStyles from '../styles/updater.module.scss';
import { ModalHeader } from './planningmodal/ModalHeader';
import UpdaterTable from './slptupdater/UpdaterTable';
import UpdaterButtons from './slptupdater/UpdaterButtons';
import { formatDateForAPI, getDefaultDeactivateDate, getTodayAtMidnight, setDateToSunday23_59 } from '@/entrypoints/newtab/utils/updater/dates';

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

  // toggle between global and per-slug configuration
  const [useGlobalDate, setUseGlobalDate] = useState(true);

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

        console.log("Raw translations: ", rawTranslations);
        const availableSlugs = new Set(rows.map(row => row.shop));

        const filteredTranslations: LineTitleTranslations = {
          subjectLine: rawTranslations.subjectLine
          ? Object.entries(rawTranslations.subjectLine).filter(([slug]) => availableSlugs.has(slug))
          .reduce((acc, [slug, content]) => ({
            ...acc,
            [slug]: content
          }), {})
          : null,
          pageTitle: rawTranslations.pageTitle
          ? Object.entries(rawTranslations.pageTitle).filter(([slug]) => availableSlugs.has(slug))
          .reduce((acc, [slug, content]) => ({
            ...acc,
            [slug]: content
          }), {})
          : null,
        }

        if(filteredTranslations.subjectLine && Object.keys(filteredTranslations.subjectLine).length === 0) {
          filteredTranslations.subjectLine = null;
        }

        if(filteredTranslations.pageTitle && Object.keys(filteredTranslations.pageTitle).length === 0) {
          filteredTranslations.pageTitle = null;
        }

        setTranslations(filteredTranslations);

        const initialSlugDates: UpdaterSlugDateConfig = {};
        const allSlugs = new Set([
          ...(filteredTranslations.subjectLine ? Object.keys(filteredTranslations.subjectLine) : []),
          ...(filteredTranslations.pageTitle ? Object.keys(filteredTranslations.pageTitle) : []),
        ]);
        allSlugs.forEach(slug => {
          initialSlugDates[slug] = {
            activateDate: getTodayAtMidnight(),
            deactivateDate: getDefaultDeactivateDate(),
          }
        });
        setSlugDateConfig(initialSlugDates);
      } catch (e) {
        console.error('Failed to load SL/PT translations: ', e);
        setError('Failed to load translations');
      } finally {
        setLoading(false);
      }
    };

    void loadIssueData();
  }, [issueId, rows]);

  const handleToggleSL = (slug: string, checked: boolean, content: string) => {
    if(checked) {
      setSelectedItems(prev => [...prev, { slug, type: 'subjectLine', content }]);
    } 
    else {
      setSelectedItems(prev => prev.filter(item => !(item.slug === slug && item.type === 'subjectLine')));
    }
  }

  const handleTogglePT = (slug: string, checked: boolean, content: string) => {
    if(checked) {
      setSelectedItems(prev => [...prev, { slug, type: 'pageTitle', content }]);
    } 
    else {
      setSelectedItems(prev => prev.filter(item => !(item.slug === slug && item.type === 'pageTitle')));
    }
  }

  const handleSelectedAllSL = () => {
    if (!translations?.subjectLine) return;
    const allSlugs = Object.keys(translations.subjectLine) as Array<keyof typeof translations.subjectLine>;
    const allSLItems = allSlugs.map(slug => ({
      slug,
      type: 'subjectLine' as const,
      content: translations.subjectLine![slug]
    }))

    const currentSLSlugs = new Set(selectedItems.filter(item => item.type === 'subjectLine').map(item => item.slug));

    if (currentSLSlugs.size === allSlugs.length) {
      setSelectedItems(prev => prev.filter(item => item.type !== 'subjectLine'));
    } else {
      setSelectedItems(prev => [
        ...prev.filter(item => item.type !== 'subjectLine'),
        ...allSLItems
      ])
    }
  }

  const handleSelectedAllPT = () => {
    if (!translations?.pageTitle) return;
    const allSlugs = Object.keys(translations.pageTitle) as Array<keyof typeof translations.pageTitle>;
    const allPTItems = allSlugs.map(slug => ({
      slug,
      type: 'pageTitle' as const,
      content: translations.pageTitle![slug]
    }))

    const currentPTSlugs = new Set(selectedItems.filter(item => item.type === 'pageTitle').map(item => item.slug));

    if (currentPTSlugs.size === allSlugs.length) {
      setSelectedItems(prev => prev.filter(item => item.type !== 'pageTitle'));
    } else {
      setSelectedItems(prev => [
        ...prev.filter(item => item.type !== 'pageTitle'),
        ...allPTItems
      ])
    }
  }

  const handleClearAll = () => {
    setSelectedItems([]);
  }

  const handleGlobalActivateDateChange = (date: Date | null) => {
    if(date) {
      date.setHours(0,0,0,0);
      setGlobalDateConfig(prev => ({...prev, activateDate: date})) 
       }   }

  const handleGlobalDeactivateDateChange = (date: Date | null) => {
    if(date) {
      const sundayDate = setDateToSunday23_59(date);
      setGlobalDateConfig(prev => ({...prev, deactivateDate: sundayDate}))
    }
  }

  const handleSlugActivateDateChange = (slug: string, date: Date | null) => {
    if(date) {
      date.setHours(0,0,0,0);
      setSlugDateConfig(prev => ({
        ...prev,
        [slug]: { ...prev[slug], activateDate: date }
      }))
    }
  }

  const handleSlugDeactivateDateChange = (slug: string, date: Date | null) => {
    if(date) {
      const sundayDate = setDateToSunday23_59(date);
      setSlugDateConfig(prev => ({
        ...prev,
        [slug]: { ...prev[slug], deactivateDate: sundayDate }
      }))
    }
  }

  const getDateForSlug = (slug: string, type: 'activate' | 'deactivate'): Date => {
    if (!useGlobalDate && slugDateConfig[slug]) {
      return slugDateConfig[slug][type === 'activate' ? 'activateDate' : 'deactivateDate'];
    }
    return globalDateConfig[type === 'activate' ? 'activateDate' : 'deactivateDate'];
  }
  

  const handleUpdateSelected = async () => {
    if (selectedItems.length === 0) {
      console.warn("No items selected to update");
      return;
    }

    setIsUpdating(true);

    try {
      const updatesBySlug: Record<string, any> = {}

      selectedItems.forEach(item => {
        if(!updatesBySlug[item.slug]) {
          updatesBySlug[item.slug] = {
            slug: item.slug,
            subjectLine: null,
            pageTitle: null,
            activateDate: getDateForSlug(item.slug, 'activate'),
            deactivateDate: getDateForSlug(item.slug, 'deactivate'),
          }
        }

        if (item.type === 'subjectLine') {
          updatesBySlug[item.slug].subjectLine = item.content;
        } else if (item.type === 'pageTitle') {
          updatesBySlug[item.slug].pageTitle = item.content;
        }
      })

      const formattedUpdates = Object.values(updatesBySlug).map(update => ({
        slug: update.slug,
        subjectLine: update.subjectLine,
        pageTitle: update.pageTitle,
        activateDate: formatDateForAPI(update.activateDate),
        deactivateDate: formatDateForAPI(update.deactivateDate),
      }));

      console.log("Updating with dates: ", formattedUpdates);
      
      // call to the API

      console.log("Successfully updated translations: ", error);
      onClose();
    } catch (e) {
      console.error("Failed to update translations: ", e);
      setError('Failed to update translations');
    }
    finally {      setIsUpdating(false);
    }
  }

  const handleUpdateAll = async () => {
    if (!translations) return;

    const allItems: UpdaterSelectedItem[] = [];

    if (translations.subjectLine) {
      Object.entries(translations.subjectLine).forEach(([slug, content]) => {
        allItems.push({
          slug,
          type: 'subjectLine',
          content
        });
      });
    }

    if (translations.pageTitle) {
      Object.entries(translations.pageTitle).forEach(([slug, content]) => {
        allItems.push({
          slug,
          type: 'pageTitle',
          content
        });
      });
    }

    if (allItems.length === 0) {
      console.warn("No items to update");
      return;
    }

    await handleUpdateSelected();
  }

  const handleSelectAllReady = () => {
    const readyItems: UpdaterSelectedItem[] = [];

    if (translations?.subjectLine) {
      Object.entries(translations.subjectLine).forEach(([slug, content]) => {
        if(content !== 'TRANSLATION NOT FOUND') {
          readyItems.push({
            slug,
            type: 'subjectLine',
            content
          });
        }
      });
    }

    if (translations?.pageTitle) {
      Object.entries(translations.pageTitle).forEach(([slug, content]) => {
        if(content !== 'TRANSLATION NOT FOUND') {
          readyItems.push({
            slug,
            type: 'pageTitle',
            content
          });
        }
      });
    }

    setSelectedItems(readyItems);
    console.log('Selecting all ready items:', readyItems);
  }

  const getTotalAvailable = () => {
    let slValid = 0;
    let slMissing = 0;
    let stTotal = 0;

    let ptValid = 0;
    let ptMissing = 0;
    let ptTotal = 0;

    if(translations?.subjectLine) {
    Object.values(translations.subjectLine).forEach(
      content => {
        stTotal++;
        if(content === 'TRANSLATION NOT FOUND') {
          slMissing++;
        } else {
          slValid++;
        }
      }
    );
    }
    if(translations?.pageTitle) {
      Object.values(translations.pageTitle).forEach(
        content => {
          ptTotal++;
          if(content === 'TRANSLATION NOT FOUND') {
            ptMissing++;
          } else {
            ptValid++;
          }
        }
      );
    }
    return {
      sl: {valid: slValid, missing: slMissing, total: stTotal},
      pt: {valid: ptValid, missing: ptMissing, total: ptTotal},
    };
  }

  const totalAvailable = getTotalAvailable();

 return (
    <div className={clsx(formStyles.modalOverlay, layoutStyles.visible)} onClick={onClose}>
      <div className={clsx(planningStyles.modal)} onClick={e => e.stopPropagation()}>
        <ModalHeader title="Subject Line & Page Title Updater" onClose={onClose} />
 <div className={planningStyles.modalContent}>
          <div className={planningStyles.menu}>
            <UpdaterButtons
              loading={loading}
              updateStarted={false}
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
        <UpdaterTable translations={translations} loading={loading}
      onToggleSL={handleToggleSL}
        onTogglePT={handleTogglePT} 
        selectedItems={selectedItems}/>
          </div>
      </div>
    </div>
  );
};

export default UpdaterModal;
