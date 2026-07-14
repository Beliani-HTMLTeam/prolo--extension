import { ActivationResult, UpdateResult, UpdaterSelectedItem } from '@/entrypoints/newtab/types/Updater';
import { formatDateForAPI } from '../dates';
import { LineTitleTranslations } from '@/entrypoints/issue.content/lib/types';
import { DEFAULT_SERVERS, LANG_TO_SLUG, NL_SERVERS, SELLER_TO_SLUG } from '../constants';
import { SLUG_ID_MAP } from '@/entrypoints/issue.content/lib/planningConfig';
import { sendBatchUpdates } from '@/entrypoints/issue.content/api/updater';
import { encodeEmojiToHtmlEntities, trimAllLineBreaks } from '../stringUtils';
import { normalizeSlugForSlug } from '../../planning/slugNormalization';
import { checkAndActivateMultipleShopContents } from '@/entrypoints/issue.content/api/shopContentService';

interface FormattedUpdateRecord {
  slug: string;
  nsltId: string;
  lpId?: string;
  landingPage?: string;
  activateDate: { date: string; time: string };
  deactivateDate: { date: string; time: string };
  subjectLine?: string;
  pageTitle?: string;
  seller?: string;
  lang?: string;
  servers?: number[];
  shopId?: string;
}

interface UseUpdateHandlerProps {
  getLPForSlug: (slug: string) => string;
  getDateForSlug: (slug: string, type: 'activate' | 'deactivate') => Date;
  newsletterIds?: Record<string, { aId?: string; bId?: string }>;
  landingPageIds?: Record<string, string>;
  onClearSelections?: () => void;
}

export const useUpdateHandler = ({
  getLPForSlug,
  getDateForSlug,
  newsletterIds,
  landingPageIds,
  onClearSelections,
}: UseUpdateHandlerProps) => {
  const [updateProgress, setUpdateProgress] = useState({ completed: 0, total: 0 });
  const [updateResults, setUpdateResults] = useState<UpdateResult[]>([]);
  const [updatingSlugs, setUpdatingSlugs] = useState<Set<string>>(new Set());
  const [originalSelectedItems, setOriginalSelectedItems] = useState<UpdaterSelectedItem[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [activationResults, setActivationResults] = useState<ActivationResult[]>([]);
  const [isActivating, setIsActivating] = useState(false);
  const [activationProgress, setActivationProgress] = useState({ completed: 0, total: 0 });

  const getServersForSlug = (slug: string): number[] => {
    return slug === 'NL' ? NL_SERVERS : DEFAULT_SERVERS;
  };

  const handleUpdateSelected = async (selectedItems: UpdaterSelectedItem[]) => {
    console.log('🔍 handleUpdateSelected called with:', selectedItems);

    if (selectedItems.length === 0) {
      console.warn('No items selected to update');
      return;
    }

    setUpdateResults([]);
    setUpdateProgress({ completed: 0, total: 0 });
    setOriginalSelectedItems(selectedItems);
    setIsComplete(false);
    setIsUpdating(true);

    const slugsToUpdate = new Set(selectedItems.map(item => item.slug));
    setUpdatingSlugs(slugsToUpdate);

    try {
      const formattedUpdates: FormattedUpdateRecord[] = [];

      const updatesBySlug: Record<
        string,
        {
          slug: string;
          subjectLine?: string;
          pageTitle?: string;
          landingPage?: string;
          activateDate: Date;
          deactivateDate: Date;
          lpId?: string;
        }
      > = {};

      selectedItems.forEach(item => {
        if (!updatesBySlug[item.slug]) {
          updatesBySlug[item.slug] = {
            slug: item.slug,
            landingPage: getLPForSlug(item.slug),
            activateDate: getDateForSlug(item.slug, 'activate'),
            deactivateDate: getDateForSlug(item.slug, 'deactivate'),
            lpId: landingPageIds?.[item.slug],
          };
        }

        if (item.type === 'subjectLine') {
          updatesBySlug[item.slug].subjectLine = item.content;
        } else if (item.type === 'pageTitle') {
          updatesBySlug[item.slug].pageTitle = item.content;
        }
      });

      Object.values(updatesBySlug).forEach(update => {
        const nsltData = newsletterIds?.[update.slug];

        const slug = update.slug;
        const seller = SELLER_TO_SLUG[slug as keyof typeof SELLER_TO_SLUG];
        const lang = LANG_TO_SLUG[slug as keyof typeof LANG_TO_SLUG];
        const servers = getServersForSlug(slug);
        let shopId = SLUG_ID_MAP[slug as keyof typeof SLUG_ID_MAP];

        if (!shopId) {
          const normalizedSlug = normalizeSlugForSlug(slug);
          shopId = SLUG_ID_MAP[normalizedSlug as keyof typeof SLUG_ID_MAP];
        }

        if (nsltData?.aId && nsltData?.bId) {
          // Both A and B exist - create two records
          const recordA: FormattedUpdateRecord = {
            slug: update.slug,
            nsltId: nsltData.aId,
            lpId: update.lpId,
            landingPage: update.landingPage!,
            activateDate: formatDateForAPI(update.activateDate),
            deactivateDate: formatDateForAPI(update.deactivateDate),
            seller,
            lang,
            servers,
            shopId,
          };
          if (update.subjectLine !== undefined) recordA.subjectLine = trimAllLineBreaks(update.subjectLine);
          if (update.pageTitle !== undefined) recordA.pageTitle = trimAllLineBreaks(update.pageTitle);
          formattedUpdates.push(recordA);

          const recordB: FormattedUpdateRecord = {
            slug: update.slug,
            nsltId: nsltData.bId,
            landingPage: update.landingPage!,
            activateDate: formatDateForAPI(update.activateDate),
            deactivateDate: formatDateForAPI(update.deactivateDate),
            seller,
            lang,
            servers,
            shopId,
          };
          if (update.subjectLine !== undefined) recordB.subjectLine = trimAllLineBreaks(update.subjectLine);
          if (update.pageTitle !== undefined) recordB.pageTitle = trimAllLineBreaks(update.pageTitle);
          formattedUpdates.push(recordB);
        } else if (nsltData?.aId) {
          const record: FormattedUpdateRecord = {
            slug: update.slug,
            nsltId: nsltData.aId,
            lpId: update.lpId,
            ...(update.landingPage && update.landingPage !== 'lp00-00-00' && { landingPage: update.landingPage }),
            activateDate: formatDateForAPI(update.activateDate),
            deactivateDate: formatDateForAPI(update.deactivateDate),
            seller,
            lang,
            servers,
            shopId,
          };
          if (update.subjectLine !== undefined) record.subjectLine = trimAllLineBreaks(update.subjectLine);
          if (update.pageTitle !== undefined) record.pageTitle = trimAllLineBreaks(update.pageTitle);
          formattedUpdates.push(record);
        }
      });

      if (formattedUpdates.length === 0) {
        console.warn('No formatted updates to send');
        return;
      }

      const updatesToSend: Array<{ type: 'newsletter' | 'landing-page'; data: any; slug: string }> = [];

            const slugsWithSubjectLineUpdates = new Set<string>();


      for (const update of formattedUpdates) {
        const hasSubjectLine = !!update.subjectLine;
        const hasPageTitle = !!update.pageTitle;

         if (hasSubjectLine && update.nsltId) {
          slugsWithSubjectLineUpdates.add(update.slug);
        }

        if (hasSubjectLine && update.nsltId) {
          updatesToSend.push({
            type: 'newsletter',
            slug: update.slug,
            data: {
              activate_from_date: update.activateDate.date,
              activate_from_time: update.activateDate.time,
              deactivate_from_date: update.deactivateDate.date,
              deactivate_from_time: update.deactivateDate.time,
              update: 'Update',
              seller: update.seller || '',
              shop_content_id: update.lpId || null, // Use lpId, not null
              lang: update.lang || '',
              subject: update.subjectLine,
              id: update.nsltId,
              smtp_id: update.servers || [],
            },
          });
        }
        if (hasPageTitle && update.lpId && update.shopId) {
          let newsletterTemplateId = update.nsltId;

          const pageTitleForProLogistics = encodeEmojiToHtmlEntities(update.pageTitle || '');

          // if it is CHFR, use CHDE's nslt
          if (update.slug === 'CHFR' || update.slug === 'CHDE') {
            // Use CHDE's newsletter ID (which is the primary one)
            const chdeNsltData = newsletterIds?.['CHDE'];
            newsletterTemplateId = chdeNsltData?.aId || update.nsltId;
          }

          // If this is BEFR, use BENL's nsltId
          if (update.slug === 'BEFR' || update.slug === 'BENL') {
            // Use BENL's newsletter ID (which is the primary one)
            const benlNsltData = newsletterIds?.['BENL'];
            newsletterTemplateId = benlNsltData?.aId || update.nsltId;
          }

          if (update.slug === 'CHIT') {
            const chdeNsltData = newsletterIds?.['CHDE'];
            newsletterTemplateId = chdeNsltData?.aId || chdeNsltData?.bId || update.nsltId;
          }

          updatesToSend.push({
            type: 'landing-page',
            slug: update.slug,
            data: {
              activate_from_date: update.activateDate.date,
              activate_from_time: update.activateDate.time,
              deactivate_from_date: update.deactivateDate.date,
              deactivate_from_time: update.deactivateDate.time,
              update: 'Update',
              name: update.landingPage,
              newsletter_template_id: newsletterTemplateId,
              id: update.lpId,
              shop_id: update.shopId,
              title_menu: { [update.lang || '']: update.landingPage },
              alias: { [update.lang || '']: update.landingPage },
              description: { [update.lang || '']: update.landingPage },
              title: { [update.lang || '']: pageTitleForProLogistics },
            },
          });
        }
      }

      if (updatesToSend.length === 0) {
        console.warn('No updates to send');
        return;
      }

      const totalUpdates = updatesToSend.length;
      setUpdateProgress({ completed: 0, total: totalUpdates });

      const slugsToUpdate = new Set(selectedItems.map(item => item.slug));
      setUpdatingSlugs(slugsToUpdate);

      const results = await sendBatchUpdates(updatesToSend, (completed, total, result) => {
        setUpdateProgress({ completed, total });
        setUpdateResults(prev => [...prev, result]);
      });

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      setUpdatingSlugs(new Set());

      console.log(`Update complete! Success: ${successCount}, Failed: ${failureCount}`);
      const successfullyUpdatedNewsletters = results.filter(
        r => r.success && r.type === 'newsletter' && slugsWithSubjectLineUpdates.has(r.slug)
      );
      if (successfullyUpdatedNewsletters.length > 0) {
        // Get shop IDs for each updated item
        const itemsToActivate = successfullyUpdatedNewsletters
          .map(result => {
            const update = updatesBySlug[result.slug];
            if (!update || !update.lpId) return null;

            const normalizedSlug = normalizeSlugForSlug(result.slug);
            let shopId = SLUG_ID_MAP[result.slug as keyof typeof SLUG_ID_MAP];

            // If not found with original slug, try normalized slug
            if (!shopId) {
              shopId = SLUG_ID_MAP[normalizedSlug as keyof typeof SLUG_ID_MAP];
            }

            // Get the newsletter template ID (nsltId) from the update
            const nsltData = newsletterIds?.[result.slug];
            const newsletterTemplateId = nsltData?.aId || nsltData?.bId || '';

            return {
              lpId: update.lpId,
              shopId: String(shopId),
              slug: result.slug,
              landingPage: update.landingPage || '',
              activateDate: {
                date: update.activateDate ? formatDateForAPI(update.activateDate).date : '',
                time: update.activateDate ? formatDateForAPI(update.activateDate).time : '',
              },
              deactivateDate: {
                date: update.deactivateDate ? formatDateForAPI(update.deactivateDate).date : '',
                time: update.deactivateDate ? formatDateForAPI(update.deactivateDate).time : '',
              },
              newsletterTemplateId: newsletterTemplateId,
            };
          })
          .filter(
            (
              item,
            ): item is {
              lpId: string;
              shopId: string;
              slug: string;
              landingPage: string;
              activateDate: { date: string; time: string };
              deactivateDate: { date: string; time: string };
              newsletterTemplateId: string;
            } => item !== null,
          );

        if (itemsToActivate.length > 0) {
          setActivationProgress({ completed: 0, total: itemsToActivate.length });

          setIsActivating(true);

          try {
            const activationResults = await checkAndActivateMultipleShopContents(
              itemsToActivate,
              newsletterIds,
              (completed, total, result) => {
                setActivationProgress({ completed, total });
              },
            );
            setActivationResults(activationResults);
          } catch (error) {
            console.error('Activation error:', error);
          } finally {
            setIsActivating(false);
          }
        }
      }

      if (onClearSelections) {
        onClearSelections();
      }

      setUpdateProgress({ completed: 0, total: 0 });
      setIsComplete(true);
    } catch (error) {
      console.error('Failed to update translations: ', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRetryFailed = async () => {
    if (updateResults.length === 0) return;

    const failedSlugs = updateResults.filter(r => !r.success).map(r => r.slug);

    const failedItems = originalSelectedItems.filter(item => failedSlugs.includes(item.slug));

    if (failedItems.length === 0) return;

    setUpdateResults([]);
    setUpdateProgress({ completed: 0, total: 0 });
    await handleUpdateSelected(failedItems);
  };

  const handleUpdateAll = async (
    translations: LineTitleTranslations | null,
    updateSelected: (items: UpdaterSelectedItem[]) => Promise<void>,
  ) => {
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

    await updateSelected(allItems);
  };

  return {
    isUpdating,
    updateProgress,
    updateResults,
    updatingSlugs,
    isComplete,
    isActivating,
    activationResults,
    activationProgress,
    handleUpdateSelected,
    handleRetryFailed,
    handleUpdateAll,
    reset: () => {
      setIsUpdating(false);
      setUpdatingSlugs(new Set());
      setIsComplete(false);
      setUpdateProgress({ completed: 0, total: 0 });
      setUpdateResults([]);
      setIsActivating(false);
      setActivationResults([]);
      setActivationProgress({ completed: 0, total: 0 });
    },
  };
};
