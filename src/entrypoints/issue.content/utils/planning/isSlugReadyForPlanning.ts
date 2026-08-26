import { ChecklistMode, ChecklistTableData } from '@/entrypoints/issue.content/lib/types';

export const isSlugReadyForPlanning = (
  tableData: ChecklistTableData | null,
  slug: string,
  isABTesting: boolean,
  isTwoLP: boolean,
  mode: ChecklistMode | undefined = 'newsletter',
): boolean => {
  if (!tableData?.rows || mode === 'cgb') {
    return false;
  }

  const row = tableData.rows.find(
    currentRow => currentRow.shop === slug
  );

  if (!row) {
    return false;
  }

  if (mode === 'sunday') {
    return row.columnStatuses.nsltAccepted === 1;
  }

  if (isABTesting) {
    let lpOk: boolean;

    if (isTwoLP) {
      const hasLpA = Boolean(row.lpAId);
      const hasLpB = Boolean(row.lpBId);

      if (hasLpA || hasLpB) {
        const lpAOk = hasLpA
          ? row.columnStatuses.lpAAccepted === 1
          : true;

        const lpBOk = hasLpB
          ? row.columnStatuses.lpBAccepted === 1
          : true;

        lpOk = lpAOk && lpBOk;
      } else {
        // Neither LP A nor LP B exists:
        // fall back to the standard landing page.
        lpOk = Boolean(
          row.lpId &&
          row.columnStatuses.lpAccepted === 1
        );
      }
    } else {
      lpOk = row.columnStatuses.lpAccepted === 1;
    }

    const nsltAOk = row.nsltAId
      ? row.columnStatuses.nsltAAccepted === 1
      : true;

    const nsltBOk = row.nsltBId
      ? row.columnStatuses.nsltBAccepted === 1
      : true;

    return lpOk && nsltAOk && nsltBOk;
  }

  return (
    row.columnStatuses.lpAccepted === 1 &&
    row.columnStatuses.nsltAccepted === 1
  );
};