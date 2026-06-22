import { PlanningTableProps } from '@/entrypoints/newtab/types/Planning';
import { getCustomerCount, getSubjectLine } from '@/entrypoints/newtab/utils/planning/resultHelpers';
import { normalizeSlugForSlug } from '@/entrypoints/newtab/utils/planning/slugNormalization';
import { Icon } from '@iconify/react';
import Skeleton from 'react-loading-skeleton';
import planningStyles from '../../styles/planning.module.scss';
import { StatusDisplay } from './StatusDisplay';

export const PlanningTable = ({
  newsletterIdMap,
  availableSlugs,
  selectedSlugs,
  results,
  loading,
  planningStarted,
  aggregating,
  isReady,
  onToggleSlug,
  onResend,
}: PlanningTableProps) => (
  <div className={planningStyles.planningTable}>
    {availableSlugs.map(slug => {
      const normalizedSlug = normalizeSlugForSlug(slug);
      const result = results.find(r => r.slug === slug) || results.find(r => r.slug === normalizedSlug);
      const ready = isReady(slug);
      const isSelected = selectedSlugs.has(slug);
      const customerCount = getCustomerCount(result, planningStarted, slug, aggregating, selectedSlugs);
      const subjectLine = getSubjectLine(result, planningStarted, slug, aggregating, selectedSlugs);
      const ids = newsletterIdMap.get(slug) ?? newsletterIdMap.get(normalizedSlug);
      const hasAB = (ids?.length ?? 0) > 1;

      return (
        <div key={slug} className={planningStyles.shopRow}>
          <div className={planningStyles.shopSelector}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSlug(slug)}
              disabled={loading || !ready}
            />
          </div>

          <div className={planningStyles.shopLabel}>
            {hasAB ? (<b>A/B</b>) : ''}
            {slug}
            {!ready && <Icon icon="mdi:alert-circle" width="14" height="14" />}
          </div>
          
          <div className={planningStyles.subjectLine}>
            {subjectLine === null ? <Skeleton width={200} /> : subjectLine}
          </div>
          
          <div className={planningStyles.customers}>
            {customerCount === null ? <Skeleton width={60} /> : customerCount}
          </div>
          
          <div className={planningStyles.status}>
            <StatusDisplay
              result={result}
              planningStarted={planningStarted}
              slug={slug}
              loading={loading}
              ready={ready}
              aggregating={aggregating}
              selectedSlugs={selectedSlugs}
              onResend={onResend}
            />
          </div>
        </div>
      );
    })}
  </div>
);
