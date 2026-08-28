import { NUMBER_OF_NEWSLETTERS } from '@/entrypoints/issue.content/api/planning';
import { NEWSLETTER_SLUGS } from '@/entrypoints/issue.content/lib/planningConfig';
import { ChecklistTableData } from '@/entrypoints/issue.content/lib/types';
import { normalizeSlugForSlug } from './slugNormalization';

export const getShopIdsMap = (tableData: ChecklistTableData, startId: number) => {
  const idMap = new Map<string, Array<{ type: 'A' | 'B'; newsletterId: number }>>();
  let currentId = startId;

  const shopMap = new Map<string, typeof tableData.rows[0]>();
  for (const row of tableData.rows) {
    const normalized = normalizeSlugForSlug(row.shop);
    shopMap.set(normalized, row);
  }

  for (let i = 1; i <= NUMBER_OF_NEWSLETTERS; i++) {
    const slug = NEWSLETTER_SLUGS[i];

    const row = shopMap.get(slug);

    if (!row) {
      continue;
    }
    
    const ids: Array<{ type: 'A' | 'B'; newsletterId: number }> = [];

    if (row.nsltId) {
      ids.push({
        type: 'A',
        newsletterId: parseInt(row.nsltId, 10),
      });
    } else if (row.nsltAId) {
      ids.push({
        type: 'A',
        newsletterId: parseInt(row.nsltAId, 10),
      });
    } else if (!row.nsltBId) {
      // Generate A only when there is no saved
      // newsletter ID of any type.
      ids.push({
        type: 'A',
        newsletterId: currentId,
      });
    }

    if (row.nsltBId) {
      ids.push({
        type: 'B',
        newsletterId: parseInt(row.nsltBId, 10),
      });
    }

    currentId++;

    if (ids.length > 0) {
      idMap.set(slug, ids);
    }
  }
  return idMap;
};
