import { ChecklistTableData } from "@/entrypoints/issue.content/lib/types";

export const isSlugReadyForPlanning = (tableData: ChecklistTableData | null, slug: string, isABTesting: boolean): boolean => {
  if(!tableData?.rows) return false;

  const row = tableData.rows.find(r => r.shop === slug)
  if(!row) return false;

  if (isABTesting) {
    const lpOk = row.columnStatuses.lpAccepted === 1;
    const nsltAOk = row.columnStatuses.nsltAAccepted === 1;
    const nsltBOk = row.nsltBId ? row.columnStatuses.nsltBAccepted === 1 : true;
    return lpOk && nsltAOk && nsltBOk;
  }

  return row.columnStatuses.lpAccepted === 1 && row.columnStatuses.nsltAccepted === 1;
}