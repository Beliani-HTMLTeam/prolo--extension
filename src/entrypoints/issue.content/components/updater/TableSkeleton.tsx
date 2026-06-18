import { TableHeader } from './TableHeader';
import { TableRowSkeleton } from './TableRowSkeleton';
import updaterStyles from '../../styles/updater.module.scss';
import { TableSkeletonProps } from '@/entrypoints/newtab/types/Updater';

const DEFAULT_SKELETON_ROWS = 10;

export const TableSkeleton = ({
  useGlobalLP,
  useGlobalDates,
  availableSlugs,
  skeletonRowsCount = DEFAULT_SKELETON_ROWS,
  showSlugs = false,
}: TableSkeletonProps) => {
  const skeletonSlugs = availableSlugs.length > 0 ? availableSlugs : Array(skeletonRowsCount).fill('loading');

  return (
    <div className={updaterStyles.updaterTable}>
      <TableHeader
        useGlobalLP={useGlobalLP}
        useGlobalDates={useGlobalDates}
        allSLSlugsLength={0}
        allPTSlugsLength={0}
        allSLSelected={false}
        allPTSelected={false}
        onSelectAllSL={() => {}}
        onSelectAllPT={() => {}}
      />
      {skeletonSlugs.map((slug, index) => (
        <TableRowSkeleton
          key={`skeleton-${index}`}
          useGlobalLP={useGlobalLP}
          useGlobalDates={useGlobalDates}
          slug={showSlugs ? slug : undefined}
        />
      ))}
    </div>
  );
};
