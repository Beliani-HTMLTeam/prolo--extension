import clsx from 'clsx';
import styles from '../../styles/FamilyTable.module.scss';
import { StatusIcon } from './StatusIcon';
import { shopToMentionTagMap, mentionToShopsMap } from '../../lib/shopMaps';
import { getShopId } from '../../lib/shopIdMap';
import type { ChecklistStatus, ChecklistTableRow } from '../../lib/types';

type TableRowsProps = {
  headers: string[];
  rows: ChecklistTableRow[];
  setRows: React.Dispatch<React.SetStateAction<ChecklistTableRow[]>>;
  hoveredShop: string | null;
  setHoveredShop: React.Dispatch<React.SetStateAction<string | null>>;
};

const handleButtonClick = (header: string, value: number, shop: string, setRows: TableRowsProps['setRows']) => {
  if (header === 'Translations' || header === 'Test Request') {
    const mentionTag = shopToMentionTagMap[shop];
    if (!mentionTag) return;

    const shopsInGroup = mentionToShopsMap[mentionTag];
    const key = header === 'Translations' ? 'translations' : 'testRequest';

    if (value === 0) {
      setRows(prevRows => prevRows.map(row => (shopsInGroup.includes(row.shop) ? { ...row, [key]: 2 } : row)));
    } else if (value === 2) {
      setRows(prevRows => prevRows.map(row => (shopsInGroup.includes(row.shop) ? { ...row, [key]: 0 } : row)));
    }
  }
};

const saveCheckpointStatus = async (checkpointId: string, checklistId: string, done: boolean) => {
  const issueId = window.location.pathname.split('/').pop();
  const host = window.location.hostname;
  const doneParam = done ? 1 : 0;
  const url = `https://${host}/api/issueLog/saveCheckpoint/?issue_id=${issueId}&checkpoint_id=${checkpointId}&checklist_id=${checklistId}&done=${doneParam}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
    });
    const text = await res.text().catch(() => '<no-body>');
    return { ok: res.ok, status: res.status, body: text };
  } catch (error) {
    return { ok: false, status: 0, body: String(error) };
  }
};

const toggleCgbDynamicStatus = (
  header: string,
  shop: string,
  rows: TableRowsProps['rows'],
  setRows: TableRowsProps['setRows'],
) => {
  const targetRow = rows.find(r => r.shop === shop);
  if (!targetRow?.cgbCheckpointRefs?.[header]) {
    return;
  }

  const ref = targetRow.cgbCheckpointRefs[header];
  const currentValue = Number(targetRow.cgbStatuses?.[header] ?? 0) as ChecklistStatus;
  const nextValue: ChecklistStatus = currentValue === 1 ? 0 : 1;

  setRows(prevRows =>
    prevRows.map(row => {
      if (row.shop !== shop) {
        return row;
      }
      return {
        ...row,
        cgbStatuses: {
          ...(row.cgbStatuses ?? {}),
          [header]: 2,
        },
      };
    }),
  );

  void saveCheckpointStatus(ref.checkpointId, ref.checklistId, nextValue === 1).then(result => {
    const finalValue: ChecklistStatus = result.ok ? nextValue : currentValue;
    setRows(prevRows =>
      prevRows.map(row => {
        if (row.shop !== shop) {
          return row;
        }
        return {
          ...row,
          cgbStatuses: {
            ...(row.cgbStatuses ?? {}),
            [header]: finalValue,
          },
        };
      }),
    );
  });
};

const toggleSimpleStatus = (
  header: string,
  shop: string,
  rows: TableRowsProps['rows'],
  setRows: TableRowsProps['setRows'],
) => {
  const statusKeyMap: Record<
    string,
    'testSent' | 'nsltAccepted' | 'nsltAAccepted' | 'nsltBAccepted' | 'lpAccepted' | 'bannersApproved'
  > = {
    'Test Sent': 'testSent',
    'NSLT Accepted': 'nsltAccepted',
    'NSLT A Accepted': 'nsltAAccepted',
    'NSLT B Accepted': 'nsltBAccepted',
    'LP Accepted': 'lpAccepted',
    'Banners Approved': 'bannersApproved',
  };

  const statusKey = statusKeyMap[header];
  if (!statusKey) return;

  const targetRow = rows.find(r => r.shop === shop);
  if (!targetRow) {
    console.warn('[checklist] Row not found for', header, shop);
    return;
  }

  const ref = targetRow.checkpointRefs[statusKey];
  if (!ref) {
    console.warn('[checklist] Missing checkpoint reference for', header, shop);
    return;
  }

  const { checkpointId, checklistId } = ref;
  const currentValue = Number(targetRow[statusKey]) as ChecklistStatus;
  const nextValue: ChecklistStatus = currentValue === 1 ? 0 : 1;
  const desiredDone = nextValue === 1;

  // set pending state
  setRows(prevRows => prevRows.map(row => (row.shop === shop ? { ...row, [statusKey]: 2 } : row)));

  void saveCheckpointStatus(checkpointId, checklistId, desiredDone).then(result => {
    const finalValue: ChecklistStatus = result.ok ? nextValue : currentValue;
    setRows(prevRows => prevRows.map(row => (row.shop === shop ? { ...row, [statusKey]: finalValue } : row)));

    if (!result.ok) {
      console.warn('[checklist] Failed to update', header, shop, result.status, result.body);
    }
  });
};

const getCellValue = (header: string, row: ChecklistTableRow): string | number | ChecklistStatus => {
  if (row.cgbStatuses && header in row.cgbStatuses) {
    return row.cgbStatuses[header] ?? 0;
  }

  switch (header) {
    case 'SHOP':
      return row.shop;
    case 'NSLT ID':
      return row.nsltId ?? '';
    case 'NSLT A ID':
      return row.nsltAId ?? '';
    case 'NSLT B ID':
      return row.nsltBId ?? '';
    case 'LP ID':
      return row.lpId ?? '';
    case 'Translations':
      return row.translations;
    case 'Test Request':
      return row.testRequest;
    case 'Timer Done':
      return row.timerDone;
    case 'Push Done':
      return row.pushDone;
    case 'Test Sent':
      return row.testSent;
    case 'NSLT Accepted':
      return row.nsltAccepted;
    case 'NSLT A Accepted':
      return row.nsltAAccepted;
    case 'NSLT B Accepted':
      return row.nsltBAccepted;
    case 'LP Accepted':
      return row.lpAccepted;
    case 'Banners Approved':
      return row.bannersApproved;
    case 'Banners Checked Mobile':
      return row.bannersCheckedMobile;
    case 'Banners Checked Desktop':
      return row.bannersCheckedDesktop;
    default:
      return '';
  }
};

const renderCellContent = (
  header: string,
  row: ChecklistTableRow,
  headers: string[],
  rows: TableRowsProps['rows'],
  setRows: TableRowsProps['setRows'],
) => {
  const value = getCellValue(header, row);
  const shop = row.shop;
  const isCgbView = !headers.includes('Translations') && headers.includes('Test Request');
  const isDynamicCgbHeader = isCgbView && header !== 'SHOP' && header !== 'Test Request';

  const translationsTitle: Record<number, string> = {
    0: 'Mention Translators',
    1: '',
    2: 'Remove Mention',
  };

  switch (header) {
    default:
      if (isDynamicCgbHeader) {
        return (
          <button
            onClick={() => toggleCgbDynamicStatus(header, shop, rows, setRows)}
            className={clsx(styles.iconButton, {
              [styles.done]: value === 1,
              [styles.missing]: !value,
              [styles.pending]: value === 2,
            })}
          >
            <StatusIcon status={value as number} />
          </button>
        );
      }
      return value;
    case 'SHOP':
      return <strong>{shop}</strong>;
    case 'Translations':
      return (
        <button
          onClick={() => handleButtonClick(header, value as number, shop, setRows)}
          title={translationsTitle[value as number]}
          className={clsx(styles.iconButton, {
            [styles.missing]: !value,
            [styles.pending]: value === 2,
          })}
        >
          <StatusIcon status={value as number} />
          {translationsTitle[value as number]}
        </button>
      );
    case 'Test Request': {
      // hide for newsletter rows without IDs, but keep visible in CGB view
      const hasNewsletterID = row.nsltId || row.nsltAId || row.nsltBId;
      const hasLPID = row.lpId;
      if (!isCgbView && !hasNewsletterID && !hasLPID) return '';

      return (
        <button
          onClick={() => handleButtonClick(header, value as number, shop, setRows)}
          className={value === 2 ? styles.cancelButton : styles.requestButton}
          title={value === 2 ? 'Cancel' : 'Request'}
        >
          <StatusIcon status={value as number} iconOverride={value === 0 ? 'charm:crosshair' : 'charm:circle-minus'} />
          {value === 2 ? 'Cancel' : 'Request'}
        </button>
      );
    }
    case 'Test Sent': {
      // hide if no newsletter & lp id
      const hasNewsletterID = row.nsltId || row.nsltAId || row.nsltBId;
      const hasLPID = row.lpId;
      if (!hasNewsletterID && !hasLPID) return '';

      return (
        <button
          onClick={() => toggleSimpleStatus(header, shop, rows, setRows)}
          className={clsx(styles.iconButton, {
            [styles.done]: value === 1,
            [styles.missing]: !value,
            [styles.pending]: value === 2,
          })}
        >
          <StatusIcon status={value as number} />
        </button>
      );
    }
    case 'NSLT Accepted':
    case 'NSLT A Accepted':
    case 'NSLT B Accepted':
    case 'LP Accepted': {
      // dont show accepted button if the id doesnt exist
      if (header === 'NSLT A Accepted' && !row.nsltAId) return '';
      if (header === 'NSLT B Accepted' && !row.nsltBId) return '';
      if (header === 'LP Accepted' && !row.lpId) return '';
      if (header === 'NSLT Accepted' && !row.nsltId) return '';

      return (
        <button
          onClick={() => toggleSimpleStatus(header, shop, rows, setRows)}
          className={clsx(styles.iconButton, {
            [styles.done]: value === 1,
            [styles.missing]: !value,
            [styles.pending]: value === 2,
          })}
        >
          <StatusIcon status={value as number} />
        </button>
      );
    }

    case 'Timer Done':
    case 'Push Done':
    case 'Banners Checked Mobile':
    case 'Banners Checked Desktop':
      return <StatusIcon status={value as number} />;
    case 'NSLT ID':
    case 'NSLT A ID':
    case 'NSLT B ID':
      if (!value || value === '') return '';
      const domain = window.location.origin;
      const nsltUrl = `${domain}/news_email.php?id=${value}`;
      return (
        <a href={nsltUrl} target="_blank" rel="noopener noreferrer" className={styles.idLink}>
          {value}
        </a>
      );
    case 'LP ID':
      if (!value || value === '') return '';
      const shopId = getShopId(shop);
      if (!shopId) return value;
      const lpDomain = window.location.origin;
      const lpUrl = `${lpDomain}/shop_content.php?id=${value}&shop_id=${shopId}`;
      return (
        <a href={lpUrl} target="_blank" rel="noopener noreferrer" className={styles.idLink}>
          {value}
        </a>
      );
  }
};

export const TableRows = ({ headers, rows, setRows, hoveredShop, setHoveredShop }: TableRowsProps) => {
  return rows.map(row =>
    headers.map(header => (
      <div
        key={`${header}-${row.shop}`}
        className={clsx(styles.dataCell, hoveredShop === row.shop && styles.hovered)}
        data-shop={row.shop}
        onMouseEnter={() => setHoveredShop(row.shop)}
        onMouseLeave={() => setHoveredShop(null)}
      >
        {renderCellContent(header, row, headers, rows, setRows)}
      </div>
    )),
  );
};
