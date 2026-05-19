import { UpdaterDateConfig, UpdaterSlugDateConfig } from '@/entrypoints/newtab/types/Updater';
import { getDefaultDeactivateDate, getTodayAtMidnight, setDateToSunday23_59 } from '../dates';

export const useDateConfig = (initialDeactivateDate: Date | null) => {
  const [useGlobalDate, setUseGlobalDate] = useState(true);
  const [globalDateConfig, setGlobalDateConfig] = useState<UpdaterDateConfig>({
    activateDate: getTodayAtMidnight(),
    deactivateDate: initialDeactivateDate || getDefaultDeactivateDate(),
  });
  const [slugDateConfig, setSlugDateConfig] = useState<UpdaterSlugDateConfig>({});

  const initializedRef = useRef(false);
  const initialDateSetRef = useRef(false);
    const correctDeactivateDate = useRef<Date | null>(initialDeactivateDate);

   useEffect(() => {
    if (initialDeactivateDate && !initialDateSetRef.current) {
            correctDeactivateDate.current = initialDeactivateDate;
      setGlobalDateConfig(prev => ({
        ...prev,
        deactivateDate: initialDeactivateDate,
      }));
      initialDateSetRef.current = true;
    }
  }, [initialDeactivateDate]);

  const handleGlobalActivateDateChange = useCallback((date: Date | null) => {
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0);
      setGlobalDateConfig(prev => ({ ...prev, activateDate: newDate }));
    }
  }, []);

  const handleGlobalDeactivateDateChange = useCallback((date: Date | null) => {
    if (date) {
      setGlobalDateConfig(prev => ({ ...prev, deactivateDate: setDateToSunday23_59(date) }));
    }
  }, []);

  const handleSlugActivateDateChange = useCallback((slug: string, date: Date | null) => {
    if (date) {
      date.setHours(0, 0, 0, 0);
      setSlugDateConfig(prev => ({
        ...prev,
        [slug]: { ...prev[slug], activateDate: date },
      }));
    }
  }, []);

  const handleSlugDeactivateDateChange = useCallback((slug: string, date: Date | null) => {
    if (date) {
      setSlugDateConfig(prev => ({
        ...prev,
        [slug]: { ...prev[slug], deactivateDate: setDateToSunday23_59(date) },
      }));
    }
  }, []);

  const getDateForSlug = useCallback(
    (slug: string, type: 'activate' | 'deactivate'): Date => {
      if (!useGlobalDate && slugDateConfig[slug]) {
        return slugDateConfig[slug][type === 'activate' ? 'activateDate' : 'deactivateDate'];
      }
      return globalDateConfig[type === 'activate' ? 'activateDate' : 'deactivateDate'];
    },
    [useGlobalDate, slugDateConfig, globalDateConfig],
  );

  const initializeSlugDates = useCallback((slugs: string[]) => {
    // Only initialize if not already initialized
    if (initializedRef.current) return;
    
    const deactivateDateToUse = correctDeactivateDate.current || globalDateConfig.deactivateDate;
    
    const initialDates: UpdaterSlugDateConfig = {};
    slugs.forEach(slug => {
      initialDates[slug] = {
        activateDate: getTodayAtMidnight(),
        deactivateDate: deactivateDateToUse,
      };
    });
    setSlugDateConfig(initialDates);
    initializedRef.current = true;
  }, [globalDateConfig.deactivateDate]);

  const resetInitialization = useCallback(() => {
    initializedRef.current = false;
      initialDateSetRef.current = false;
  }, []);

  return {
    useGlobalDate,
    setUseGlobalDate,
    globalDateConfig,
    slugDateConfig,
    handleGlobalActivateDateChange,
    handleGlobalDeactivateDateChange,
    handleSlugActivateDateChange,
    handleSlugDeactivateDateChange,
    getDateForSlug,
    initializeSlugDates,
    resetInitialization,
  };
};
