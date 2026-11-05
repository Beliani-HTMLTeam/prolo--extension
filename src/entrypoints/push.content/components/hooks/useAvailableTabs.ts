import { fetchCachedTabs } from '@/entrypoints/issue.content/api/issueData';
import { useCallback, useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';

const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

export function useAvailableTabs() {
  const [availableTabs, setAvailableTabs] = useState<string[]>([]);
  const [isLoadingTabs, setIsLoadingTabs] = useState(false);
  const [tabsError, setTabsError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const loadTabs = useCallback(async (manual = false) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsLoadingTabs(true);
    setTabsError(null);
    try {
      const currentYear = new Date().getFullYear().toString();
      const result = await fetchCachedTabs(currentYear);
      if (result.tabs && result.tabs.length > 0) {
        setAvailableTabs(result.tabs);
        if (manual) {
          void toast.fire({ icon: 'success', title: `Loaded ${result.tabs.length} campaigns` });
        }
      } else {
        setTabsError('No campaigns loaded. The spreadsheet service may be unavailable.');
        if (manual) {
          void toast.fire({ icon: 'error', title: 'Still no campaigns', text: 'Try again in a moment.' });
        }
      }
    } catch (error) {
      console.error('Failed to load tabs:', error);
      setTabsError('Failed to load campaigns.');
      if (manual) {
        void toast.fire({ icon: 'error', title: 'Failed to load campaigns' });
      }
    } finally {
      inFlight.current = false;
      setIsLoadingTabs(false);
    }
  }, []);

  useEffect(() => {
    void loadTabs();
  }, [loadTabs]);

  const reloadTabs = useCallback(() => loadTabs(true), [loadTabs]);

  return {
    availableTabs,
    isLoadingTabs,
    tabsError,
    reloadTabs,
  };
}
