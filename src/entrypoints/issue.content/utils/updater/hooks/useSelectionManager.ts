import { LineTitleTranslations } from "@/entrypoints/issue.content/lib/types";
import { UpdaterSelectedItem } from "@/entrypoints/issue.content/types/Updater";

export const useSelectionManager = () => {
    const [selectedItems, setSelectedItems] = useState<UpdaterSelectedItem[]>([]);
  
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

   const handleSelectedAllSL = (translations: LineTitleTranslations | null) => {
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

  const handleSelectedAllPT = (translations: LineTitleTranslations | null) => {
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

    const handleSelectAllReady = (translations: LineTitleTranslations | null) => {
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
  };
  
    const handleClearAll = () => {
    setSelectedItems([]);
  };

  return {
    selectedItems,
    handleToggleSL,
    handleTogglePT,
    handleSelectedAllSL,
    handleSelectedAllPT,
    handleSelectAllReady,
    handleClearAll,
  }
}