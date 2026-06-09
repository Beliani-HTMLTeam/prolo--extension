import { UpdaterDateConfig, UpdaterSlugDateConfig } from '@/entrypoints/newtab/types/Updater';
import { getDefaultDeactivateDate, getTodayAtMidnight, setDateToSunday23_59 } from '../dates';
import { getPairedSlug } from '../shopPairs';

interface UseDateConfigProps {
  initialDeactivateDate: Date | null;
  onAutoSelect?: (slug: string) => void;
}

export const useDateConfig = ({ initialDeactivateDate, onAutoSelect }: UseDateConfigProps) => {
  const [useGlobalDate, setUseGlobalDate] = useState(true);
  const [globalDateConfig, setGlobalDateConfig] = useState<UpdaterDateConfig>({
    activateDate: getTodayAtMidnight(),
    deactivateDate: initialDeactivateDate || getDefaultDeactivateDate(),
  });
  const [slugDateConfig, setSlugDateConfig] = useState<UpdaterSlugDateConfig>({});

  const initializedRef = useRef(false);
  const initialDateSetRef = useRef(false);
  const correctDeactivateDate = useRef<Date | null>(initialDeactivateDate);
  const autoSelectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleSlugActivateDateChange = useCallback(
    (slug: string, date: Date | null, skipAutoSelect?: boolean) => {
      if (date) {
        date.setHours(0, 0, 0, 0);
        setSlugDateConfig(prev => {
          const updates: UpdaterSlugDateConfig = {
            ...prev,
            [slug]: { ...prev[slug], activateDate: date },
          };

          const pairedSlug = getPairedSlug(slug);
          if (pairedSlug) {
            updates[pairedSlug] = {
              ...prev[pairedSlug],
              activateDate: date,
            };
          }
          return updates;
        });

         if (!skipAutoSelect) {
        if (autoSelectTimeoutRef.current) {
          clearTimeout(autoSelectTimeoutRef.current);
        }

        autoSelectTimeoutRef.current = setTimeout(() => {
          if (onAutoSelect) {
            onAutoSelect(slug);
            const pairedSlug = getPairedSlug(slug);
            if (pairedSlug) {
              onAutoSelect(pairedSlug);
            }
          }
        }, 50);
      }}
    },
    [onAutoSelect],
  );

  const handleSlugDeactivateDateChange = useCallback(
    (slug: string, date: Date | null, skipAutoSelect?: boolean) => {
      if (date) {
        setSlugDateConfig(prev => {
          const updates: UpdaterSlugDateConfig = {
            ...prev,
            [slug]: { ...prev[slug], deactivateDate: setDateToSunday23_59(date) },
          };

          const pairedSlug = getPairedSlug(slug);
          if (pairedSlug) {
            updates[pairedSlug] = {
              ...prev[pairedSlug],
              deactivateDate: setDateToSunday23_59(date),
            };
          }

          return updates;
        });

          if (!skipAutoSelect) {
        if (autoSelectTimeoutRef.current) {
          clearTimeout(autoSelectTimeoutRef.current);
        }

        autoSelectTimeoutRef.current = setTimeout(() => {
          if (onAutoSelect) {
            onAutoSelect(slug);
            const pairedSlug = getPairedSlug(slug);
            if (pairedSlug) {
              onAutoSelect(pairedSlug);
            }
          }
        }, 50);
      } }
    },
    [onAutoSelect],
  );

  const getDateForSlug = useCallback(
    (slug: string, type: 'activate' | 'deactivate'): Date => {
      if (!useGlobalDate && slugDateConfig[slug]) {
        return slugDateConfig[slug][type === 'activate' ? 'activateDate' : 'deactivateDate'];
      }
      return globalDateConfig[type === 'activate' ? 'activateDate' : 'deactivateDate'];
    },
    [useGlobalDate, slugDateConfig, globalDateConfig],
  );

  const initializeSlugDates = useCallback(
    (slugs: string[]) => {
      // Only initialize if not already initialized
      if (initializedRef.current) return;

      const deactivateDateToUse = correctDeactivateDate.current || globalDateConfig.deactivateDate;

      const initialDates: UpdaterSlugDateConfig = {};
      slugs.forEach(slug => {
        initialDates[slug] = {
          activateDate: getTodayAtMidnight(),
          deactivateDate: deactivateDateToUse,
        };

        const pairedSlug = getPairedSlug(slug);
        if (pairedSlug && slugs.includes(pairedSlug)) {
          initialDates[pairedSlug] = {
            activateDate: getTodayAtMidnight(),
            deactivateDate: deactivateDateToUse,
          };
        }
      });
      setSlugDateConfig(initialDates);
      initializedRef.current = true;
    },
    [globalDateConfig.deactivateDate],
  );

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
