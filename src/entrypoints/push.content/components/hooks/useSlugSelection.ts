import { useCallback, useState } from 'react';
import { SLUG_ORDER } from '../../helpers/slugMapper';

export function useSlugSelection(initialSlugs: string[] = SLUG_ORDER) {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(initialSlugs);

  const toggleSlugSelection = useCallback((slug: string) => {
    setSelectedSlugs(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug],
    );
  }, []);

  const selectAllSlugs = useCallback(() => setSelectedSlugs(SLUG_ORDER), []);
  const deselectAllSlugs = useCallback(() => setSelectedSlugs([]), []);

  return {
    selectedSlugs,
    setSelectedSlugs,
    toggleSlugSelection,
    selectAllSlugs,
    deselectAllSlugs,
  };
}
