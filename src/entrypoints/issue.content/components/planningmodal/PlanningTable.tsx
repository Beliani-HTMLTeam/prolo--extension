import { PlanningTableProps } from '@/entrypoints/newtab/types/Planning';
import { getCustomerCount, getStatusDisplay, getSubjectLine } from '@/entrypoints/newtab/utils/planning/resultHelpers';
import { normalizeSlugForSlug } from '@/entrypoints/newtab/utils/planning/slugNormalization';
import { Icon } from '@iconify/react';
import Skeleton from 'react-loading-skeleton';

export const PlanningTable = ({
  availableSlugs,
  selectedSlugs,
  results,
  loading,
  planningStarted,
  aggregating,
  isReady,
  onToggleSlug,
}: PlanningTableProps) => (
  <div
    style={{
      flex: 1,
      overflowY: 'auto',
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
    }}
  >
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
              <td style={{ textAlign: 'center', padding: '4px', width: '50px' }}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSlug(slug)}
                  disabled={loading || !ready}
                />
              </td>
              <td style={{ padding: '4px', fontWeight: 500, width: '100px' }}>
                {slug}
                {!ready && (
                  <Icon
                    icon="mdi:alert-circle"
                    width="14"
                    height="14"
                    style={{ color: '#ff9800', marginLeft: '8px' }}
                  />
                )}
              </td>
              <td
                style={{
                  padding: '8px',
                  fontSize: '12px',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
              >
                {subjectLine === null ? <Skeleton width={200} /> : subjectLine}
              </td>
              <td style={{ textAlign: 'center', padding: '4px', width: '100px' }}>
                {customerCount === null ? <Skeleton width={60} /> : customerCount}
              </td>

              <td style={{ padding: '4px', fontSize: '12px', color: '#666', width: '150px', textAlign: 'center' }}>
                {getStatusDisplay(result, planningStarted, slug, ready, aggregating, selectedSlugs)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
