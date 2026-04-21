import {  NUMBER_OF_NEWSLETTERS } from '@/entrypoints/issue.content/api/planning';
import { NEWSLETTER_SLUGS } from '@/entrypoints/issue.content/lib/planningConfig';
import { ChecklistTableData } from '@/entrypoints/issue.content/lib/types';


export const getShopIdsMap = (tableData: ChecklistTableData, startId: number) => {
  const idMap = new Map<string, Array<{ type: 'A' | 'B'; newsletterId: number }>>();
  let currentId = startId;

  for (let i = 1; i <= NUMBER_OF_NEWSLETTERS; i++) {
    const slug = NEWSLETTER_SLUGS[i];
    const row = tableData.rows.find(r => r.shop === slug);
    
    const ids: Array<{ type: 'A' | 'B'; newsletterId: number }> = [];

    ids.push({ type: 'A', newsletterId: currentId });
    currentId++;

    if (row?.nsltBId) {
      ids.push({ type: 'B', newsletterId: parseInt(row.nsltBId, 10) });
    }
    idMap.set(slug, ids);
  }
  return idMap;
};
