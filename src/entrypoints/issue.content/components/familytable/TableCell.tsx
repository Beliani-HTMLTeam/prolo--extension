import { isColumnHiddenForRow } from './cellHelpers';
import { ShopCell } from './cells/ShopCell';
import { LinkCell } from './cells/LinkCell';
import { RequestCell } from './cells/RequestCell';
import { StatusCell } from './cells/StatusCell';
import type { ChecklistColumn, ChecklistStatus, ChecklistTableRow } from '../../lib/types';

type TableCellProps = {
  column: ChecklistColumn;
  row: ChecklistTableRow;
  isCgbView: boolean;
  canEdit: boolean;
  onToggleMention: (columnId: string, shop: string, currentValue: ChecklistStatus) => void;
  onToggleCheckpoint: (columnId: string, shop: string) => void;
};

export const TableCell = ({ column, row, isCgbView, canEdit, onToggleMention, onToggleCheckpoint }: TableCellProps) => {
  if (column.kind === 'shop') {
    return <ShopCell shop={row.shop} />;
  }

  if (column.kind === 'link') {
    return <LinkCell row={row} columnId={column.id} />;
  }

  if (isColumnHiddenForRow(column.id, row, isCgbView)) {
    return null;
  }

  if (column.kind === 'request') {
    return <RequestCell row={row} columnId={column.id} canEdit={canEdit} onToggle={onToggleMention} />;
  }

  return <StatusCell row={row} columnId={column.id} canEdit={canEdit} onToggle={onToggleCheckpoint} />;
};
