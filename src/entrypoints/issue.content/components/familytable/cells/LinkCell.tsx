import styles from '../../../styles/FamilyTable.module.scss';
import { getLinkUrl, getLinkValue } from '../cellHelpers';
import type { ChecklistTableRow } from '../../../lib/types';

type LinkCellProps = {
  row: ChecklistTableRow;
  columnId: string;
};

export const LinkCell = ({ row, columnId }: LinkCellProps) => {
  const value = getLinkValue(row, columnId);
  if (!value) {
    return null;
  }

  const url = getLinkUrl(row, columnId, value);
  if (!url) {
    return <>{value}</>;
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={styles.idLink}>
      {value}
    </a>
  );
};
