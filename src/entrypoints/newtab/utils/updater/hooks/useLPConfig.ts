import { UpdaterSlugLPConfig } from '@/entrypoints/newtab/types/Updater';

export const useLPConfig = (initialGlobalLP: string) => {
  const [useGlobalLP, setUseGlobalLP] = useState(true);
  const [globalLP, setGlobalLP] = useState(initialGlobalLP);
  const [slugLPConfig, setSlugLPConfig] = useState<UpdaterSlugLPConfig>({});
  const [slugFMDModes, setSlugFMDModes] = useState<Record<string, { fd: boolean; md: boolean }>>({});

  const initializedRef = useRef(false);

  const setGlobalLPValue = useCallback((lp: string) => {
    setGlobalLP(lp);
  }, []);

  const handleGlobalLPChange = useCallback(
    (lp: string) => {
      setGlobalLP(lp);
      if (useGlobalLP) {
        setSlugLPConfig(prev => {
          const updated: UpdaterSlugLPConfig = {};
          Object.keys(prev).forEach(slug => {
            updated[slug] = lp;
          });
          return updated;
        });
      }
    },
    [useGlobalLP],
  );

  const handleUseGlobalLPToggle = useCallback(
    (checked: boolean) => {
      setUseGlobalLP(checked);
      if (checked) {
        setSlugLPConfig(prev => {
          const updated: UpdaterSlugLPConfig = {};
          Object.keys(prev).forEach(slug => {
            updated[slug] = globalLP;
          });
          return updated;
        });

        setSlugFMDModes(prev => {
          const reset: Record<string, { fd: boolean; md: boolean }> = {};
          Object.keys(prev).forEach(slug => {
            reset[slug] = { fd: false, md: false };
          });
          return reset;
        });
      }
    },
    [globalLP],
  );

  const handleSlugFMDModeChange = useCallback((slug: string, type: 'fd' | 'md', checked: boolean) => {
    setSlugFMDModes(prev => ({
      ...prev,
      [slug]: {
        ...prev[slug],
        [type]: checked,
      },
    }));

    if (checked) {
      setUseGlobalLP(false);
    }
  }, []);

  const handleSlugLPChange = useCallback((slug: string, lp: string) => {
    setSlugLPConfig(prev => ({ ...prev, [slug]: lp }));
  }, []);

  const getLPForSlug = useCallback(
    (slug: string): string => {
      if (useGlobalLP) return globalLP || initialGlobalLP;

      const perSlugLP = slugLPConfig[slug];

      if (!perSlugLP) {
        return globalLP || initialGlobalLP;
      }

      let baseLP = perSlugLP.replace(/fd|md$/, '');

      const modes = slugFMDModes[slug];
      if (modes?.fd) return `${baseLP}fd`;
      if (modes?.md) return `${baseLP}md`;

      console.log('getLPForSlug', {
        slug,
        useGlobalLP,
        globalLP,
        slugLPConfig: slugLPConfig[slug],
        slugFMDModes: slugFMDModes[slug],
      });

      return baseLP;
    },
    [useGlobalLP, globalLP, slugLPConfig, slugFMDModes],
  );

  const initializeSlugLPs = useCallback((slugs: string[], lp: string) => {
    if (initializedRef.current && Object.keys(slugLPConfig).length > 0) return;

        console.log('Initializing slug LPs with:', lp); // Debug log

    const initialLPs: UpdaterSlugLPConfig = {};
    const initialModes: Record<string, { fd: boolean; md: boolean }> = {};
    slugs.forEach(slug => {
      initialLPs[slug] = lp;
      initialModes[slug] = { fd: false, md: false };
    });
    setSlugLPConfig(initialLPs);
    setSlugFMDModes(initialModes);
    initializedRef.current = true;
  }, []);

  const resetInitialization = useCallback(() => {
    initializedRef.current = false;
  }, []);

  return {
    useGlobalLP,
    globalLP,
    slugFMDModes,
    handleGlobalLPChange,
    handleUseGlobalLPToggle,
    handleSlugFMDModeChange,
    handleSlugLPChange,
    getLPForSlug,
    initializeSlugLPs,
    setGlobalLP: setGlobalLPValue,
    resetInitialization,
  };
};
