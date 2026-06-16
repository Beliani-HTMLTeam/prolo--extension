import { NUMBER_OF_NEWSLETTERS } from '@/entrypoints/issue.content/api/planning';
import { NEWSLETTER_SLUGS } from '@/entrypoints/issue.content/lib/planningConfig';
import { ChecklistTableData } from '@/entrypoints/issue.content/lib/types';
import { normalizeSlugForSlug } from './slugNormalization';

const SLUG_ALIAS_MAP: Record<string, string> = {
  'SP': 'ES'
}

export const getShopIdsMap = (tableData: ChecklistTableData, startId: number) => {
  const idMap = new Map<string, Array<{ type: 'A' | 'B'; newsletterId: number }>>();
  let currentId = startId;

  const existingSlugs = new Set(tableData.rows.map(r => r.shop));

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

    ids.push({ type: 'A', newsletterId: currentId });
    currentId++;

    if (row?.nsltBId) {
      ids.push({ type: 'B', newsletterId: parseInt(row.nsltBId, 10) });
    }
    idMap.set(slug, ids);
  }
  return idMap;
};
