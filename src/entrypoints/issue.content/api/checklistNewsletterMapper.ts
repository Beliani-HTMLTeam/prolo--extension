import { TABLE_SHOP_ORDER } from '../lib/shopConfig';
import { CHECKLIST_TITLES_NORM } from '../lib/checklistTitles';
import type { ChecklistApiResponse, ChecklistTableData, ChecklistTableRow, SpreadsheetTranslations } from '../lib/types';
import { TABLE_HEADERS, createRow, normalizeTitle, parseCheckpointDescription } from './checklistShared';

export const mapNewsletterChecklistsToTableData = (
  apiResponse: ChecklistApiResponse,
  spreadsheet?: SpreadsheetTranslations | null,
): ChecklistTableData => {
  const rowsByShop = new Map<string, ChecklistTableRow>();
  const orderIndex = new Map<string, number>();
  let hasGroupedNslt = false;

  TABLE_SHOP_ORDER.forEach((shop, index) => {
    orderIndex.set(shop, index);
  });

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

  for (const checklist of apiResponse.checklists ?? []) {
    for (const checkpoint of checklist.checkpoints ?? []) {
      const parsed = parseCheckpointDescription(checkpoint.description);
      const checklistTitle = normalizeTitle(checklist.title);

      if (!parsed) {
        if (checklistTitle === CHECKLIST_TITLES_NORM.NEWSLETTER_TESTING_APPROVED) {
          const doneValue = checkpoint.done === '1' ? 1 : 0;
          for (const row of rowsByShop.values()) {
            row.nsltAccepted = doneValue;
            row.checkpointRefs.nsltAccepted = { checklistId: checklist.id, checkpointId: checkpoint.id };
          }
        }

        if (checklistTitle === CHECKLIST_TITLES_NORM.NEWSLETTER_TESTING_APPROVED_GROUP_A) {
          hasGroupedNslt = true;
          const doneValue = checkpoint.done === '1' ? 1 : 0;
          for (const row of rowsByShop.values()) {
            row.nsltAAccepted = doneValue;
            row.checkpointRefs.nsltAAccepted = { checklistId: checklist.id, checkpointId: checkpoint.id };
          }
        }

        if (checklistTitle === CHECKLIST_TITLES_NORM.NEWSLETTER_TESTING_APPROVED_GROUP_B) {
          hasGroupedNslt = true;
          const doneValue = checkpoint.done === '1' ? 1 : 0;
          for (const row of rowsByShop.values()) {
            row.nsltBAccepted = doneValue;
            row.checkpointRefs.nsltBAccepted = { checklistId: checklist.id, checkpointId: checkpoint.id };
          }
        }

        if (checklistTitle === CHECKLIST_TITLES_NORM.LPS_APPROVED) {
          const doneValue = checkpoint.done === '1' ? 1 : 0;
          for (const row of rowsByShop.values()) {
            row.lpAccepted = doneValue;
            row.checkpointRefs.lpAccepted = { checklistId: checklist.id, checkpointId: checkpoint.id };
          }
        }

        continue;
      }

      const orderValue = Number(checkpoint.ordering);
      const order = Number.isFinite(orderValue) ? orderValue : Number.MAX_SAFE_INTEGER;
      const doneValue = checkpoint.done === '1' ? 1 : 0;

      for (const shop of parsed.shopCodes) {
        const row = getRow(shop, order);

        if (checklistTitle === CHECKLIST_TITLES_NORM.NEWSLETTER_TRANSLATIONS) {
          row.translations = doneValue;
          row.checkpointRefs.translations = { checklistId: checklist.id, checkpointId: checkpoint.id };
        }

        if (checklistTitle === CHECKLIST_TITLES_NORM.NEWSLETTER_TESTING_APPROVED) {
          row.nsltAccepted = doneValue;
          row.checkpointRefs.nsltAccepted = { checklistId: checklist.id, checkpointId: checkpoint.id };
          if (parsed.itemId) {
            row.nsltId = parsed.itemId;
          }
        }

        if (checklistTitle === CHECKLIST_TITLES_NORM.NEWSLETTER_TESTING_APPROVED_GROUP_A) {
          hasGroupedNslt = true;
          row.nsltAAccepted = doneValue;
          row.checkpointRefs.nsltAAccepted = { checklistId: checklist.id, checkpointId: checkpoint.id };
          if (parsed.itemId) {
            row.nsltAId = parsed.itemId;
          }
        }

        if (checklistTitle === CHECKLIST_TITLES_NORM.NEWSLETTER_TESTING_APPROVED_GROUP_B) {
          hasGroupedNslt = true;
          row.nsltBAccepted = doneValue;
          row.checkpointRefs.nsltBAccepted = { checklistId: checklist.id, checkpointId: checkpoint.id };
          if (parsed.itemId) {
            row.nsltBId = parsed.itemId;
          }
        }

        if (checklistTitle === CHECKLIST_TITLES_NORM.LPS_APPROVED) {
          if (checklist.checkpoints.length === 1) {
            for (const allRow of rowsByShop.values()) {
              allRow.lpAccepted = doneValue;
              allRow.checkpointRefs.lpAccepted = { checklistId: checklist.id, checkpointId: checkpoint.id };
            }
          } else {
            row.lpAccepted = doneValue;
            row.checkpointRefs.lpAccepted = { checklistId: checklist.id, checkpointId: checkpoint.id };
            if (parsed.itemId) {
              row.lpId = parsed.itemId;
            }
          }
        }

        if (checklistTitle === CHECKLIST_TITLES_NORM.SENT_NSLT_LP_FOR_TESTING) {
          row.testSent = doneValue;
          row.checkpointRefs.testSent = { checklistId: checklist.id, checkpointId: checkpoint.id };
        }
      }
    }
  }

  const rows = Array.from(rowsByShop.values()).sort((left, right) => {
    const leftIndex = orderIndex.get(left.shop);
    const rightIndex = orderIndex.get(right.shop);

    if (leftIndex !== undefined && rightIndex !== undefined) {
      return leftIndex - rightIndex;
    }

    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.shop.localeCompare(right.shop);
  });

  if (spreadsheet?.timer != null) {
    for (const row of rows) {
      row.timerDone = spreadsheet.timer[row.shop] ? 1 : 0;
    }
  }
  if (spreadsheet?.push != null) {
    for (const row of rows) {
      row.pushDone = spreadsheet.push[row.shop] ? 1 : 0;
    }
  }

  const baseHeaders: string[] = hasGroupedNslt
    ? [
        'SHOP',
        'Translations',
        'Timer Done',
        'Push Done',
        'Test Sent',
        'Test Request',
        'NSLT A ID',
        'NSLT A Accepted',
        'NSLT B ID',
        'NSLT B Accepted',
        'LP ID',
        'LP Accepted',
      ]
    : [...TABLE_HEADERS];

  const headers = baseHeaders.filter(h => {
    if (h === 'Timer Done' && spreadsheet?.timer == null) return false;
    if (h === 'Push Done' && spreadsheet?.push == null) return false;
    return true;
  });

  return { headers, rows, hasGroupedNslt };
};
