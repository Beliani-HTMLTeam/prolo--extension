import { UpdaterSelectedItem, UpdaterSlugDateConfig, UpdaterSlugLPConfig } from '@/entrypoints/newtab/types/Updater';
import { IssueListItem, LineTitleTranslations } from '../../lib/types';
import updaterStyles from '../../styles/updater.module.scss';
import { formatDateForInput } from '@/entrypoints/newtab/utils/updater/dates';
import DatePicker from 'react-datepicker';
import Skeleton from 'react-loading-skeleton';
import { TableSkeleton } from './TableSkeleton';
import { EmptyState } from './EmptyState';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';

interface UpdaterTableProps {
  translations: LineTitleTranslations | null;
  loading?: boolean;
  onToggleSL?: (slug: string, checked: boolean, content: string) => void;
  onTogglePT?: (slug: string, checked: boolean, content: string) => void;
  selectedItems?: UpdaterSelectedItem[];
  useGlobalDates?: boolean;
  onSlugActivateDateChange?: (slug: string, date: Date | null) => void;
  onSlugDeactivateDateChange?: (slug: string, date: Date | null) => void;
  getDateForSlug?: (slug: string, type: 'activate' | 'deactivate') => Date;
  getLPForSlug?: (slug: string) => string;
  onSlugLPChange?: (slug: string, lp: string) => void;
  useGlobalLP?: boolean;
  slugFMDModes?: Record<string, { fd: boolean; md: boolean }>;
  onSlugFMDModeChange?: (slug: string, mode: 'fd' | 'md', checked: boolean) => void;
  availableSlugs?: string[];
  newsletterIds?: Record<string, {aId?: string; bId?: string}>;
  landingPageIds?: Record<string, string>
}

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
  slugFMDModes = {},
  onSlugFMDModeChange,
   newsletterIds = {},
  landingPageIds = {},
  availableSlugs = [],
}: UpdaterTableProps) => {
  const isSLSelected = useCallback(
    (slug: string) => selectedItems.some(item => item.slug === slug && item.type === 'subjectLine'),
    [selectedItems],
  );

  const isPTSelected = useCallback(
    (slug: string) => selectedItems.some(item => item.slug === slug && item.type === 'pageTitle'),
    [selectedItems],
  );

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

  if (loading) {
    return <TableSkeleton useGlobalLP={useGlobalLP} useGlobalDates={useGlobalDates} availableSlugs={availableSlugs} />;
  }

  if (!translations?.subjectLine || !translations.pageTitle) {
    return <EmptyState />;
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
      />

      {allSlugs.map(slug => {
        const subjectLine = translations.subjectLine?.[slug];
        const pageTitle = translations.pageTitle?.[slug];
        const hasSL = !!subjectLine;
        const hasPT = !!pageTitle;
        const activateDate = getDateForSlug?.(slug, 'activate');
        const deactivateDate = getDateForSlug?.(slug, 'deactivate');
        const lp = getLPForSlug?.(slug) || '';
        const fdMode = slugFMDModes[slug]?.fd || false;
        const mdMode = slugFMDModes[slug]?.md || false;

          const newsletterId = newsletterIds[slug];
        const landingPageId = landingPageIds[slug];

        const handleToggleCountry = (checked: boolean) => {
          if (checked) {
            if (hasSL && subjectLine) onToggleSL?.(slug, true, subjectLine);
            if (hasPT && pageTitle) onTogglePT?.(slug, true, pageTitle);
          } else {
            if (hasSL && subjectLine) onToggleSL?.(slug, false, subjectLine);
            if (hasPT && pageTitle) onTogglePT?.(slug, false, pageTitle);
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
            activateDate={activateDate!}
            deactivateDate={deactivateDate!}
            lp={lp}
            fdMode={fdMode}
            mdMode={mdMode}
            isSLSelected={isSLSelected(slug)}
            isPTSelected={isPTSelected(slug)}
            loading={loading || false}
            useGlobalLP={useGlobalLP}
            useGlobalDates={useGlobalDates}
            //  newsletterId={newsletterId}
            // landingPageId={landingPageId}
            onToggleCountry={handleToggleCountry}
            onToggleSL={checked => onToggleSL?.(slug, checked, subjectLine || '')}
            onTogglePT={checked => onTogglePT?.(slug, checked, pageTitle || '')}
            onFDModeChange={checked => handleFMDModeChange(slug, 'fd', checked)}
            onMDModeChange={checked => handleFMDModeChange(slug, 'md', checked)}
            onLPChange={value => onSlugLPChange?.(slug, value)}
            onActivateDateChange={date => onSlugActivateDateChange?.(slug, date)}
            onDeactivateDateChange={date => onSlugDeactivateDateChange?.(slug, date)}
          />
        );
      })}
    </div>
  );
};
export default UpdaterTable;
