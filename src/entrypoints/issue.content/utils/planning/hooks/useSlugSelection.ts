import { ChecklistMode, ChecklistTableData } from '@/entrypoints/issue.content/lib/types';
import { isSlugReadyForPlanning } from '../isSlugReadyForPlanning';

export const useSlugSelection = () => {
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());

  const toggleSlug = useCallback((slug: string) => {
    setSelectedSlugs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slug)) newSet.delete(slug);
      else newSet.add(slug);
      return newSet;
    });
  }, []);

  const selectAll = useCallback(
    (availableSlugs: string[], tableData: ChecklistTableData | null, isABTesting: boolean, isTwoLP: boolean, mode: ChecklistMode) => {
      const selectableSlugs = availableSlugs.filter(slug =>
        isSlugReadyForPlanning(tableData || null, slug, isABTesting || false, isTwoLP || false, mode),
      );
      setSelectedSlugs(new Set(selectableSlugs));
    },
    [],
  );

  const clearAll = useCallback(() => {
    setSelectedSlugs(new Set());
  }, []);

  const isSlugSelected = useCallback((slug: string) => selectedSlugs.has(slug), [selectedSlugs]);

  return { selectedSlugs, setSelectedSlugs, toggleSlug, selectAll, clearAll, isSlugSelected };
};
