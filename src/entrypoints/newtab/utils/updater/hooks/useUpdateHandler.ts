import { UpdateResult, UpdaterSelectedItem } from '@/entrypoints/newtab/types/Updater';
import { formatDateForAPI } from '../dates';
import { LineTitleTranslations } from '@/entrypoints/issue.content/lib/types';
import { DEFAULT_SERVERS, LANG_TO_SLUG, NL_SERVERS, SELLER_TO_SLUG } from '../constants';
import { SLUG_ID_MAP } from '@/entrypoints/issue.content/lib/planningConfig';
import { sendBatchUpdates } from '@/entrypoints/issue.content/api/updater';

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
}

export const useUpdateHandler = ({
  getLPForSlug,
  getDateForSlug,
  newsletterIds,
  landingPageIds,
}: UseUpdateHandlerProps) => {
  const [updateProgress, setUpdateProgress] = useState({ completed: 0, total: 0 });
  const [updateResults, setUpdateResults] = useState<UpdateResult[]>([]);
  const [updatingSlugs, setUpdatingSlugs] = useState<Set<string>>(new Set());
  const [originalSelectedItems, setOriginalSelectedItems] = useState<UpdaterSelectedItem[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const getServersForSlug = (slug: string): number[] => {
    return slug === 'NL' ? NL_SERVERS : DEFAULT_SERVERS;
  };

  const handleUpdateSelected = async (selectedItems: UpdaterSelectedItem[]) => {
    console.log('🔍 handleUpdateSelected called with:', selectedItems);

    if (selectedItems.length === 0) {
      console.warn('No items selected to update');
      return;
    }

    setOriginalSelectedItems(selectedItems);
    setIsUpdating(true);

    const slugsToUpdate = new Set(selectedItems.map(item => item.slug));
    setUpdatingSlugs(slugsToUpdate);

    try {
      console.log('🔍 newsletterIds:', newsletterIds);
      console.log('🔍 landingPageIds:', landingPageIds);

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
        console.log('🔍 Processing item:', item);

        if (!updatesBySlug[item.slug]) {
          updatesBySlug[item.slug] = {
            slug: item.slug,
            landingPage: getLPForSlug(item.slug),
            activateDate: getDateForSlug(item.slug, 'activate'),
            deactivateDate: getDateForSlug(item.slug, 'deactivate'),
            lpId: landingPageIds?.[item.slug],
          };
          console.log(`🔍 Created update for slug ${item.slug}:`, updatesBySlug[item.slug]);
        }

        if (item.type === 'subjectLine') {
          updatesBySlug[item.slug].subjectLine = item.content;
        } else if (item.type === 'pageTitle') {
          updatesBySlug[item.slug].pageTitle = item.content;
        }
      });

      console.log('🔍 updatesBySlug:', updatesBySlug);

      Object.values(updatesBySlug).forEach(update => {
        const nsltData = newsletterIds?.[update.slug];
        console.log(`🔍 nsltData for ${update.slug}:`, nsltData);

        const slug = update.slug;
        const seller = SELLER_TO_SLUG[slug as keyof typeof SELLER_TO_SLUG];
        const lang = LANG_TO_SLUG[slug as keyof typeof LANG_TO_SLUG];
        const servers = getServersForSlug(slug);
        const shopId = SLUG_ID_MAP[slug as keyof typeof SLUG_ID_MAP];

        if (nsltData?.aId && nsltData?.bId) {
          console.log(`🔍 Both A and B exist for ${update.slug}`);
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
          if (update.subjectLine !== undefined) recordA.subjectLine = update.subjectLine;
          if (update.pageTitle !== undefined) recordA.pageTitle = update.pageTitle;
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
          if (update.subjectLine !== undefined) recordB.subjectLine = update.subjectLine;
          if (update.pageTitle !== undefined) recordB.pageTitle = update.pageTitle;
          formattedUpdates.push(recordB);
        } else if (nsltData?.aId) {
          console.log(`🔍 Only A exists for ${update.slug}`);
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
          if (update.subjectLine !== undefined) record.subjectLine = update.subjectLine;
          if (update.pageTitle !== undefined) record.pageTitle = update.pageTitle;
          formattedUpdates.push(record);
        }
      });

      console.log('🔍 Final formattedUpdates:', formattedUpdates);

      if (formattedUpdates.length === 0) {
        console.warn('No formatted updates to send');
        return;
      }

      console.log('Updating with dates: ', formattedUpdates);

      const updatesToSend: Array<{ type: 'newsletter' | 'landing-page'; data: any; slug: string }> = [];

      for (const update of formattedUpdates) {
        const hasSubjectLine = !!update.subjectLine;
        const hasPageTitle = !!update.pageTitle;

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
              newsletter_template_id: update.nsltId,
              id: update.lpId,
              shop_id: update.shopId,
              title_menu: { [update.lang || '']: update.landingPage },
              alias: { [update.lang || '']: update.landingPage },
              description: { [update.lang || '']: update.landingPage },
              title: { [update.lang || '']: update.pageTitle },
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
        console.log(
          `Progress: ${completed}/${total} - ${result.slug} (${result.type}): ${result.success ? '✅' : '❌'}`,
        );
        setUpdateProgress({ completed, total });
        setUpdateResults(prev => [...prev, result]);
      });

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      setUpdatingSlugs(new Set());

      console.log(`Update complete! Success: ${successCount}, Failed: ${failureCount}`);

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

    if (failedItems.length === 0)  return;

    setUpdateResults([]);
    setUpdateProgress({ completed: 0, total: 0 });
    await handleUpdateSelected(failedItems);
  }

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
    handleUpdateSelected,
    handleRetryFailed,
    handleUpdateAll,
    reset: () => {
      setIsUpdating(false);
      setUpdatingSlugs(new Set());
      setIsComplete(false);
      setUpdateProgress({ completed: 0, total: 0 });
      setUpdateResults([]);
    },
  };
};
