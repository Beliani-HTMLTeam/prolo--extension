import { UpdaterTableProps } from '@/entrypoints/newtab/types/Updater';
import updaterStyles from '../../styles/updater.module.scss';
import { TableSkeleton } from './TableSkeleton';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';

const UpdaterTable = ({
  translations,
  loading,
  onToggleSL,
  onTogglePT,
  selectedItems = [],
  useGlobalDates = true,
  onSlugActivateDateChange,
  onSlugDeactivateDateChange,
  getDateForSlug,
  getLPForSlug,
  onSlugLPChange,
  useGlobalLP = true,
  globalLP = '',
  initialGlobalLP = '',
  slugFMDModes = {},
  onSlugFMDModeChange,
  newsletterIds = {},
  landingPageIds = {},
  availableSlugs = [],
  updatingSlugs = new Set(),
  updateResults = [],
  getInitialActivateDate,
  getInitialDeactivateDate,
  getInitialLP,
  verificationResults = {},
  verifying = false,
  hasVerified = false,
}: UpdaterTableProps) => {
  const isSLSelected = useCallback(
    (slug: string) => selectedItems.some(item => item.slug === slug && item.type === 'subjectLine'),
    [selectedItems],
  );

  const isPTSelected = useCallback(
    (slug: string) => selectedItems.some(item => item.slug === slug && item.type === 'pageTitle'),
    [selectedItems],
  );

  const isGlobalLPModified = globalLP !== initialGlobalLP;
  const allSlugs = useMemo(() => {
    const slugs = new Set<string>();
    if (translations?.subjectLine) {
      Object.keys(translations.subjectLine).forEach(slug => slugs.add(slug));
    }
    if (translations?.pageTitle) {
      Object.keys(translations.pageTitle).forEach(slug => slugs.add(slug));
    }

    return Array.from(slugs).sort();
  }, [translations]);

  console.log("allSlugs", allSlugs);
  

  const allSLSlugs = useMemo(
    () => (translations?.subjectLine ? Object.keys(translations.subjectLine) : []),
    [translations],
  );

  const allPTSlugs = useMemo(
    () => (translations?.pageTitle ? Object.keys(translations.pageTitle) : []),
    [translations],
  );

  const allSLSelected = allSLSlugs.length > 0 && allSLSlugs.every(isSLSelected);
  const allPTSelected = allPTSlugs.length > 0 && allPTSlugs.every(isPTSelected);

  const handleSelectAllSL = useCallback(
    (checked: boolean) => {
      allSLSlugs.forEach(slug => {
        const content = translations?.subjectLine?.[slug];
        if (content) {
          onToggleSL?.(slug, checked, content);
        }
      });
    },
    [allSLSlugs, onToggleSL, translations?.subjectLine],
  );

  const handleSelectAllPT = useCallback(
    (checked: boolean) => {
      allPTSlugs.forEach(slug => {
        const content = translations?.pageTitle?.[slug];
        if (content) {
          onTogglePT?.(slug, checked, content);
        }
      });
    },
    [allPTSlugs, onTogglePT, translations?.pageTitle],
  );

  const handleFMDModeChange = useCallback(
    (slug: string, type: 'fd' | 'md', checked: boolean) => {
      onSlugFMDModeChange?.(slug, type, checked);
    },
    [onSlugFMDModeChange],
  );

  const needsUpdateCount = useMemo(() => {
    return Object.values(verificationResults).filter(r => r.subjectNeedsUpdate || r.pageTitleNeedsUpdate).length;
  }, [verificationResults]);

  if (loading) {
    return <TableSkeleton useGlobalLP={useGlobalLP} useGlobalDates={useGlobalDates} availableSlugs={availableSlugs} />;
  }

  return (
    <div className={updaterStyles.updaterTable}>
      <TableHeader
        useGlobalLP={useGlobalLP}
        useGlobalDates={useGlobalDates}
        allSLSlugsLength={allSLSlugs.length}
        allPTSlugsLength={allPTSlugs.length}
        allSLSelected={allSLSelected}
        allPTSelected={allPTSelected}
        onSelectAllSL={handleSelectAllSL}
        onSelectAllPT={handleSelectAllPT}
        disableSelections={isGlobalLPModified}
      />

      {allSlugs.map(slug => {
        const subjectLine = translations?.subjectLine?.[slug];
        const pageTitle = translations?.pageTitle?.[slug];
        const hasSL = !!subjectLine;
        const hasPT = !!pageTitle;
        const deactivateDate = getDateForSlug?.(slug, 'deactivate');
        const lp = getLPForSlug?.(slug) || '';
        const fdMode = slugFMDModes[slug]?.fd || false;
        const mdMode = slugFMDModes[slug]?.md || false;

        const newsletterId = newsletterIds[slug];
        const landingPageId = landingPageIds[slug];

        const isUpdating = updatingSlugs.has(slug);
        const result = updateResults.find(r => r.slug === slug);
        const isSuccess = result?.success;
        const isError = result && !result.success;
        const errorMessage = isError ? result.error : undefined;

        const verificationResult = verificationResults[slug];

        const handleToggleCountry = (checked: boolean) => {
          if (checked) {
            if (hasSL && subjectLine) onToggleSL?.(slug, true, subjectLine);
            if (hasPT && pageTitle) onTogglePT?.(slug, true, pageTitle);
          } else {
            if (typeof window !== 'undefined') {
              (window as any).__isResetting = true;
            }

            if (hasSL && subjectLine) onToggleSL?.(slug, false, subjectLine);
            if (hasPT && pageTitle) onTogglePT?.(slug, false, pageTitle);

            // Also reset FD/MD immediately here, don't wait for useEffect
            if (fdMode) {
              onSlugFMDModeChange?.(slug, 'fd', false);
            }
            if (mdMode) {
              onSlugFMDModeChange?.(slug, 'md', false);
            }

            // Reset dates and LP
            const initialActivateDate = getInitialActivateDate?.(slug);
            const initialDeactivateDate = getInitialDeactivateDate?.(slug);
            const initialLP = getInitialLP?.(slug);

            if (initialActivateDate) {
              onSlugActivateDateChange?.(slug, initialActivateDate, true);
            }
            if (initialDeactivateDate) {
              onSlugDeactivateDateChange?.(slug, initialDeactivateDate, true);
            }
            if (initialLP) {
              onSlugLPChange?.(slug, initialLP, true);
            }

            setTimeout(() => {
              if (typeof window !== 'undefined') {
                (window as any).__isResetting = false;
              }
            }, 200);
          }
        };

        return (
          <TableRow
            key={slug}
            slug={slug}
            subjectLine={subjectLine || ''}
            pageTitle={pageTitle || ''}
            hasSL={hasSL}
            hasPT={hasPT}
            deactivateDate={deactivateDate!}
            lp={lp}
            fdMode={fdMode}
            mdMode={mdMode}
            isSLSelected={isSLSelected(slug)}
            isPTSelected={isPTSelected(slug)}
            loading={loading || false}
            useGlobalLP={useGlobalLP}
            useGlobalDates={useGlobalDates}
            newsletterId={newsletterId}
            landingPageId={landingPageId}
            onToggleCountry={handleToggleCountry}
            onToggleSL={checked => onToggleSL?.(slug, checked, subjectLine || '')}
            onTogglePT={checked => onTogglePT?.(slug, checked, pageTitle || '')}
            onFDModeChange={checked => handleFMDModeChange(slug, 'fd', checked)}
            onMDModeChange={checked => handleFMDModeChange(slug, 'md', checked)}
            onLPChange={value => onSlugLPChange?.(slug, value)}
            onDeactivateDateChange={date => onSlugDeactivateDateChange?.(slug, date)}
            isUpdating={isUpdating}
            isSuccess={isSuccess}
            isError={isError}
            errorMessage={errorMessage}
            getInitialActivateDate={getInitialActivateDate}
            getInitialDeactivateDate={getInitialDeactivateDate}
            getInitialLP={getInitialLP}
            onSlugActivateDateChange={onSlugActivateDateChange}
            onSlugDeactivateDateChange={onSlugDeactivateDateChange}
            onSlugLPChange={onSlugLPChange}
            onSlugFMDModeChange={onSlugFMDModeChange}
            disableSelections={isGlobalLPModified}
            verificationResult={verificationResult}
            verifying={verifying}
          />
        );
      })}
    </div>
  );
};
export default UpdaterTable;
