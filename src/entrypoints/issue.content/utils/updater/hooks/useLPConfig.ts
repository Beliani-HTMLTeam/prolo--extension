import { UpdaterSlugLPConfig } from '@/entrypoints/issue.content/types/Updater';
import { getPairedSlug } from '../shopPairs';

interface UseLPConfigProps {
  initialGlobalLP: string;
  onAutoSelect?: (slug: string) => void;
}

export const useLPConfig = ({initialGlobalLP, onAutoSelect}: UseLPConfigProps) => {
  const [useGlobalLP, setUseGlobalLP] = useState(true);
  const [globalLP, setGlobalLP] = useState(initialGlobalLP);
  const [globalLPB, setGlobalLPB] = useState(initialGlobalLP);
  const [slugLPConfig, setSlugLPConfig] = useState<UpdaterSlugLPConfig>({});
  const [slugLPBConfig, setSlugLPBConfig] = useState<UpdaterSlugLPConfig>({});
  const [slugFMDModes, setSlugFMDModes] = useState<Record<string, { fd: boolean; md: boolean }>>({});

  const initializedRef = useRef(false);
  const autoSelectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setGlobalLPValue = useCallback((lp: string) => {
    setGlobalLP(lp);
  }, []);

  const setGlobalLPBValue = useCallback((lp: string) => {
    setGlobalLPB(lp);
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

  const handleGlobalLPBChange = useCallback(
    (lp: string) => {
      setGlobalLPB(lp);
      if (useGlobalLP) {
        setSlugLPBConfig(prev => {
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

        setSlugLPBConfig(prev => {
          const updated: UpdaterSlugLPConfig = {};
          Object.keys(prev).forEach(slug => {
            updated[slug] = globalLPB;
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
    [globalLP, globalLPB],
  );

  const handleSlugFMDModeChange = useCallback((slug: string, type: 'fd' | 'md', checked: boolean) => {
    setSlugFMDModes(prev => {
      const updated = {
      ...prev,
      [slug]: {
        ...prev[slug],
        [type]: checked,
      },
    }

    const pairedSlug = getPairedSlug(slug);
    if (pairedSlug) {
      updated[pairedSlug] = {
        ...prev[pairedSlug],
        [type]: checked,
      }
    }

    return updated;
    });

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
  }, 50)

    if (checked) {
      setUseGlobalLP(false);
    }
  }, [onAutoSelect]);

  const handleSlugLPChange = useCallback((slug: string, lp: string, skipAutoSelect?: boolean) => {
    setSlugLPConfig(prev => {
      const updates: UpdaterSlugLPConfig = {
        ...prev,
        [slug]: lp,
      }

      const pairedSlug = getPairedSlug(slug);
      if (pairedSlug) {
        updates[pairedSlug] = lp;
      }

      return updates;
    });

    if (!skipAutoSelect && onAutoSelect) {
      if (autoSelectTimeoutRef.current) {
        clearTimeout(autoSelectTimeoutRef.current);
      }

      autoSelectTimeoutRef.current = setTimeout(() => {
        onAutoSelect(slug);
        const pairedSlug = getPairedSlug(slug);
        if (pairedSlug) {
          onAutoSelect(pairedSlug);
        }
      }, 50);
    }
  }, [onAutoSelect]);

  const handleSlugLPBChange = useCallback((slug: string, lp: string, skipAutoSelect?: boolean) => {
    setSlugLPBConfig(prev => {
      const updates: UpdaterSlugLPConfig = {
        ...prev,
        [slug]: lp,
      }

      const pairedSlug = getPairedSlug(slug);
      if (pairedSlug) {
        updates[pairedSlug] = lp;
      }

      return updates;
    });

    if (!skipAutoSelect && onAutoSelect) {
      if (autoSelectTimeoutRef.current) {
        clearTimeout(autoSelectTimeoutRef.current);
      }

      autoSelectTimeoutRef.current = setTimeout(() => {
        onAutoSelect(slug);
        const pairedSlug = getPairedSlug(slug);
        if (pairedSlug) {
          onAutoSelect(pairedSlug);
        }
      }, 50);
    }
  }, [onAutoSelect]);

  const getLPForSlug = useCallback(
    (slug: string, variant: 'a' | 'b' = 'a'): string => {
      const isVariantB = variant === 'b';
      const global = isVariantB ? globalLPB : globalLP;
      const slugConfig = isVariantB ? slugLPBConfig : slugLPConfig;

      if (useGlobalLP) return global || initialGlobalLP;

      let perSlugLP = slugConfig[slug];

      if (!perSlugLP) {
        const pairedSlug = getPairedSlug(slug);
        if (pairedSlug) {
          perSlugLP = slugConfig[pairedSlug];
        }
      }

      if (!perSlugLP) {
        return global || initialGlobalLP;
      }

      let baseLP = perSlugLP.replace(/fd|md$/, '');

      const modes = slugFMDModes[slug];
      if (modes?.fd) return `${baseLP}fd`;
      if (modes?.md) return `${baseLP}md`;

      return baseLP;
    },
    [useGlobalLP, globalLP, globalLPB, slugLPConfig, slugLPBConfig, slugFMDModes, initialGlobalLP],
  );

  const initializeSlugLPs = useCallback((slugs: string[], lp: string, lpB?: string) => {
    if (initializedRef.current && Object.keys(slugLPConfig).length > 0) return;

    const initialLPs: UpdaterSlugLPConfig = {};
    const initialLPBs: UpdaterSlugLPConfig = {};
    const initialModes: Record<string, { fd: boolean; md: boolean }> = {};
    const resolvedLPB = lpB ?? lp;

    slugs.forEach(slug => {
      initialLPs[slug] = lp;
      initialLPBs[slug] = resolvedLPB;
      initialModes[slug] = { fd: false, md: false };

      const pairedSlug = getPairedSlug(slug);
      if (pairedSlug && slugs.includes(pairedSlug)) {
        initialLPs[pairedSlug] = lp;
        initialLPBs[pairedSlug] = resolvedLPB;
        initialModes[pairedSlug] = { fd: false, md: false };
      }
    });

    setSlugLPConfig(initialLPs);
    setSlugLPBConfig(initialLPBs);
    setSlugFMDModes(initialModes);
    initializedRef.current = true;
  }, []);

  const resetInitialization = useCallback(() => {
    initializedRef.current = false;
  }, []);

  return {
    useGlobalLP,
    globalLP,
    globalLPB,
    slugFMDModes,
    handleGlobalLPChange,
    handleGlobalLPBChange,
    handleUseGlobalLPToggle,
    handleSlugFMDModeChange,
    handleSlugLPChange,
    handleSlugLPBChange,
    getLPForSlug,
    initializeSlugLPs,
    setGlobalLP: setGlobalLPValue,
    setGlobalLPB: setGlobalLPBValue,
    resetInitialization,
  };
};
 