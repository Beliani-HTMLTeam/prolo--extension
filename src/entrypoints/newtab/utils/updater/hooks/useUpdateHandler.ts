import { UpdaterSelectedItem } from '@/entrypoints/newtab/types/Updater';
import { formatDateForAPI } from '../dates';
import { LineTitleTranslations } from '@/entrypoints/issue.content/lib/types';

interface UseUpdateHandlerProps {
  getLPForSlug: (slug: string) => string;
  getDateForSlug: (slug: string, type: 'activate' | 'deactivate') => Date;
  onClose: () => void;
}

export const useUpdateHandler = ({ getLPForSlug, getDateForSlug, onClose }: UseUpdateHandlerProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateSelected = async (selectedItems: UpdaterSelectedItem[]) => {
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

      console.log('Successfully updated translations: ');
      onClose();
    } catch (error) {
      console.error('Failed to update translations: ', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
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
    handleUpdateSelected,
    handleUpdateAll,
  };
};
