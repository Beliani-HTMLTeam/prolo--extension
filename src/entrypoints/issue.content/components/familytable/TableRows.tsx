import clsx from 'clsx';
import styles from '../../styles/FamilyTable.module.scss';
import { StatusIcon } from './StatusIcon';
import { getShopId } from '../../lib/shopIdMap';
import type { ChecklistColumn, ChecklistOwner, ChecklistStatus, ChecklistTableRow } from '../../lib/types';
import { COLUMN_IDS } from '../../api/checklistShared';
import { useChecklistState } from './useChecklistState';
import useTeam from '@/hooks/useTeam';

type TableRowsProps = {
  columns: ChecklistColumn[];
  rows: ChecklistTableRow[];
  setRows: React.Dispatch<React.SetStateAction<ChecklistTableRow[]>>;
  hoveredShop: string | null;
  setHoveredShop: React.Dispatch<React.SetStateAction<string | null>>;
  checklistOwner: ChecklistOwner | null;
};

const STATUS_FIELD_BY_COLUMN_ID: Record<string, keyof ChecklistTableRow> = {
  [COLUMN_IDS.TRANSLATIONS]: 'translations',
  [COLUMN_IDS.TEST_REQUEST]: 'testRequest',
  [COLUMN_IDS.TIMER_DONE]: 'timerDone',
  [COLUMN_IDS.PUSH_DONE]: 'pushDone',
  [COLUMN_IDS.TEST_SENT]: 'testSent',
  [COLUMN_IDS.NSLT_ACCEPTED]: 'nsltAccepted',
  [COLUMN_IDS.NSLT_A_ACCEPTED]: 'nsltAAccepted',
  [COLUMN_IDS.NSLT_B_ACCEPTED]: 'nsltBAccepted',
  [COLUMN_IDS.LP_ACCEPTED]: 'lpAccepted',
};

const getStatusValue = (row: ChecklistTableRow, columnId: string): ChecklistStatus => {
  const columnStatus = row.columnStatuses?.[columnId];
  if (typeof columnStatus === 'number') {
    return columnStatus as ChecklistStatus;
  }

  const legacyField = STATUS_FIELD_BY_COLUMN_ID[columnId];
  if (legacyField) {
    const value = row[legacyField];
    if (typeof value === 'number') {
      return value as ChecklistStatus;
    }
  }

  if (columnId.startsWith('cgb:')) {
    return (row.cgbStatuses?.[columnId] ?? 0) as ChecklistStatus;
  }

  return 0;
};

const getLinkValue = (row: ChecklistTableRow, columnId: string): string | null => {
  const fromColumnMap = row.columnValues?.[columnId];
  if (fromColumnMap) {
    return fromColumnMap;
  }

  if (columnId === COLUMN_IDS.NSLT_ID) return row.nsltId;
  if (columnId === COLUMN_IDS.NSLT_A_ID) return row.nsltAId;
  if (columnId === COLUMN_IDS.NSLT_B_ID) return row.nsltBId;
  if (columnId === COLUMN_IDS.LP_ID) return row.lpId;
  return null;
};

const shouldHideColumn = (columnId: string, row: ChecklistTableRow, isCgbView: boolean): boolean => {
  const hasNewsletterID = !!(row.nsltId || row.nsltAId || row.nsltBId);
  const hasLPID = !!row.lpId;

  if (columnId === COLUMN_IDS.TEST_REQUEST && !isCgbView && !hasNewsletterID && !hasLPID) {
    return true;
  }

  if (columnId === COLUMN_IDS.TEST_SENT && !hasNewsletterID && !hasLPID) {
    return true;
  }

  if (columnId === COLUMN_IDS.NSLT_ACCEPTED && !row.nsltId) return true;
  if (columnId === COLUMN_IDS.NSLT_A_ACCEPTED && !row.nsltAId) return true;
  if (columnId === COLUMN_IDS.NSLT_B_ACCEPTED && !row.nsltBId) return true;
  if (columnId === COLUMN_IDS.LP_ACCEPTED && !row.lpId) return true;

  return false;
};

const renderLink = (row: ChecklistTableRow, columnId: string) => {
  const value = getLinkValue(row, columnId);
  if (!value) {
    return '';
  }

  if (columnId === COLUMN_IDS.LP_ID) {
    const shopId = getShopId(row.shop);
    if (!shopId) {
      return value;
    }
    const base = window.location.origin;
    const url = `${base}/shop_content.php?id=${value}&shop_id=${shopId}`;
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={styles.idLink}>
        {value}
      </a>
    );
  }

  const base = window.location.origin;
  const url = `${base}/news_email.php?id=${value}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={styles.idLink}>
      {value}
    </a>
  );
};

export const TableRows = ({ columns, rows, setRows, hoveredShop, setHoveredShop, checklistOwner }: TableRowsProps) => {
  const { toggleMentionColumn, toggleCheckpointColumn } = useChecklistState(rows, setRows);
  const isCgbView = columns.some(column => column.id.startsWith('cgb:'));
  const { team, changeTeam } = useTeam();

  return rows.map(row =>
    columns.map(column => {
      const value = getStatusValue(row, column.id);

      return (
        <div
          key={`${column.id}-${row.shop}`}
          className={clsx(styles.dataCell, hoveredShop === row.shop && styles.hovered)}
          data-shop={row.shop}
          onMouseEnter={() => setHoveredShop(row.shop)}
          onMouseLeave={() => setHoveredShop(null)}
        >
          {(() => {
            if (column.kind === 'shop') {
              return <strong>{row.shop}</strong>;
            }

            if (column.kind === 'link') {
              return renderLink(row, column.id);
            }

            if (shouldHideColumn(column.id, row, isCgbView)) {
              return '';
            }

            if (column.kind === 'request') {
              if (column.id === COLUMN_IDS.TRANSLATIONS) {
                const translationLabel = value === 2 ? 'Cancel' : value === 1 ? '' : 'Request';
                return (
                  <button
                    onClick={() => {
                      if (checklistOwner !== team && checklistOwner !== null) {
                        return;
                      }
                      toggleMentionColumn(column.id, row.shop, value);
                    }}
                    className={clsx(styles.iconButton, {
                      [styles.missing]: value === 0,
                      [styles.pending]: value === 2,
                    })}
                    title={value === 2 ? 'Remove Mention' : value === 1 ? '' : 'Mention Translators'}
                  >
                    <StatusIcon status={value as number} />
                    {translationLabel}
                  </button>
                );
              }

              const title = value === 2 ? 'Cancel' : 'Request';
              return (
                <button
                  onClick={() => {
                    if (checklistOwner !== team && checklistOwner !== null) {
                      return;
                    }
                    toggleMentionColumn(column.id, row.shop, value);
                  }}
                  className={value === 2 ? styles.cancelButton : styles.requestButton}
                  title={title}
                >
                  <StatusIcon
                    status={value as number}
                    iconOverride={value === 0 ? 'charm:crosshair' : value === 2 ? 'charm:circle-minus' : undefined}
                  />
                  {title}
                </button>
              );
            }

            const isInteractive = !!row.columnCheckpointRefs?.[column.id];
            if (!isInteractive) {
              return <StatusIcon status={value as number} />;
            }

            return (
              <button
                onClick={() => {
                  if (checklistOwner !== team && checklistOwner !== null) {
                    return;
                  }
                  toggleCheckpointColumn(column.id, row.shop);
                }}
                className={clsx(styles.iconButton, {
                  [styles.done]: value === 1,
                  [styles.missing]: !value,
                  [styles.pending]: value === 2,
                })}
              >
                <StatusIcon status={value as number} />
              </button>
            );
          })()}
        </div>
      );
    }),
  );
};
