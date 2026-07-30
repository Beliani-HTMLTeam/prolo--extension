import { fetchCachedTabs } from '@/entrypoints/issue.content/api/issueData';
import { useEffect, useState } from 'react';

/**
 * Loads available campaign tabs (spreadsheet sheet names) for the current year.
 * Does NOT auto-select a tab — campaign name stays empty until the user picks one.
 */
export function useAvailableTabs() {
  const [availableTabs, setAvailableTabs] = useState<string[]>([]);
  const [isLoadingTabs, setIsLoadingTabs] = useState(false);

  useEffect(() => {
    const loadTabs = async () => {
      setIsLoadingTabs(true);
      try {
        const currentYear = new Date().getFullYear().toString();
        const result = await fetchCachedTabs(currentYear);
        if (result.tabs && result.tabs.length > 0) {
          setAvailableTabs(result.tabs);
        }
      } catch (error) {
        console.error('Failed to load tabs:', error);
      } finally {
        setIsLoadingTabs(false);
      }
    };
    loadTabs();
  }, []);

  return {
    availableTabs,
    isLoadingTabs,
  };
}
