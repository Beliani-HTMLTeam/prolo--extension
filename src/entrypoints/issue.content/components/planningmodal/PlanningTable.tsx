import { PlanningTableProps } from '@/entrypoints/newtab/types/Planning';
import { getCustomerCount, getSubjectLine } from '@/entrypoints/newtab/utils/planning/resultHelpers';
import { normalizeSlugForSlug } from '@/entrypoints/newtab/utils/planning/slugNormalization';
import { Icon } from '@iconify/react';
import Skeleton from 'react-loading-skeleton';
import planningStyles from '../../styles/planning.module.scss';
import { StatusDisplay } from './StatusDisplay';

export const PlanningTable = ({
  availableSlugs,
  selectedSlugs,
  results,
  loading,
  planningStarted,
  aggregating,
  isReady,
  onToggleSlug,
  onResend
}: PlanningTableProps) => (
  <div
    className={planningStyles.planningTableWrapper}
  >
    <table className='table'>
      <tbody>
        {availableSlugs.map(slug => {
          const normalizedSlug = normalizeSlugForSlug(slug);
          const result = results.find(r => r.slug === slug) || results.find(r => r.slug === normalizedSlug);
          const ready = isReady(slug);
          const isSelected = selectedSlugs.has(slug);
          const customerCount = getCustomerCount(result, planningStarted, slug, aggregating, selectedSlugs);
          const subjectLine = getSubjectLine(result, planningStarted, slug, aggregating, selectedSlugs);

          return (
            <tr key={slug}>
              <td className={planningStyles.checkboxCell}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSlug(slug)}
                  disabled={loading || !ready}
                />
              </td>
              <td className={planningStyles.slugCell}>
                {slug}
                {!ready && (
                  <Icon
                    icon="mdi:alert-circle"
                    width="14"
                    height="14"
                    className={planningStyles.slugIcon}
                  />
                )}
              </td>
              <td
               className={planningStyles.subjectLineCell}
              >
                {subjectLine === null ? <Skeleton width={200} /> : subjectLine}
              </td>
              <td className={planningStyles.customerNumberCell}>
                {customerCount === null ? <Skeleton width={60} /> : customerCount}
              </td>

              <td className={planningStyles.statusCell}>
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
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
