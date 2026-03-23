import type { ChecklistApiResponse, ChecklistStatus, ChecklistTableData, ChecklistTableRow } from '../lib/types';
import { CGB_HEADERS, createRow, normalizeTitle, parseCheckpointDescription } from './checklistShared';

export const mapCgbChecklistsToTableData = (apiResponse: ChecklistApiResponse): ChecklistTableData => {
  const rowsByShop = new Map<string, ChecklistTableRow>();
  const includedChecklists = (apiResponse.checklists ?? [])
    .filter(checklist => {
      const checklistTitle = normalizeTitle(checklist.title);
      return !checklistTitle.startsWith('banners checked');
    })
    .sort((left, right) => {
      const leftOrder = Number(left.ordering);
      const rightOrder = Number(right.ordering);
      const safeLeft = Number.isFinite(leftOrder) ? leftOrder : Number.MAX_SAFE_INTEGER;
      const safeRight = Number.isFinite(rightOrder) ? rightOrder : Number.MAX_SAFE_INTEGER;
      if (safeLeft !== safeRight) {
        return safeLeft - safeRight;
      }
      return left.title.localeCompare(right.title);
    });

  const dynamicHeaders = includedChecklists.map(checklist => checklist.title.trim()).filter(Boolean);

  const getRow = (shop: string, order: number) => {
    const existing = rowsByShop.get(shop);
    if (existing) {
      existing.order = Math.min(existing.order, order);
      return existing;
    }

    const row = createRow(shop, order);
    rowsByShop.set(shop, row);
    return row;
  };

  for (const checklist of includedChecklists) {
    const checklistHeader = checklist.title.trim();
    if (!checklistHeader) {
      continue;
    }

    for (const checkpoint of checklist.checkpoints ?? []) {
      const doneValue = checkpoint.done === '1' ? 1 : 0;
      const orderValue = Number(checkpoint.ordering);
      const order = Number.isFinite(orderValue) ? orderValue : Number.MAX_SAFE_INTEGER;

      const parsed = parseCheckpointDescription(checkpoint.description || '');
      if (!parsed) {
        continue;
      }

      for (const shopCode of parsed.shopCodes) {
        const row = getRow(shopCode, order);
        if (!row.cgbStatuses) {
          row.cgbStatuses = {};
        }
        if (!row.cgbCheckpointRefs) {
          row.cgbCheckpointRefs = {};
        }
        row.cgbStatuses[checklistHeader] = doneValue as ChecklistStatus;
        row.cgbCheckpointRefs[checklistHeader] = { checklistId: checklist.id, checkpointId: checkpoint.id };
      }
    }
  }

  const rows = Array.from(rowsByShop.values()).sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.shop.localeCompare(right.shop);
  });

  return { headers: ['SHOP', ...dynamicHeaders, ...CGB_HEADERS.slice(1)], rows, hasGroupedNslt: false };
};
