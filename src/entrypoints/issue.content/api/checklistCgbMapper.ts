import type { ChecklistApiResponse, ChecklistStatus, ChecklistTableData, ChecklistTableRow } from '../lib/types';
import { CHECKLIST_TITLES_NORM } from '../lib/checklistTitles';
import { createCgbColumns, createRow, normalizeTitle, parseCheckpointDescription, COLUMN_IDS } from './checklistShared';

export const mapCgbChecklistsToTableData = (
  apiResponse: ChecklistApiResponse,
  newsletterApiResponse?: ChecklistApiResponse | null,
  options?: { isGraphicsMode?: boolean }
): ChecklistTableData => {
  const rowsByShop = new Map<string, ChecklistTableRow>();
  const includedChecklists = (apiResponse.checklists ?? [])
    .filter(checklist => {
      // skip empty checklists (e.g. freshly added "Checklist 8"), they would render as an empty column
      if (!checklist.checkpoints?.length) return false;
      const checklistTitle = normalizeTitle(checklist.title);
      return !checklistTitle.startsWith('banners checked') && checklistTitle !== CHECKLIST_TITLES_NORM.SENT_NSLT_LP_FOR_TESTING;
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

  const dynamicColumns = includedChecklists
    .map(checklist => ({ id: `cgb:${checklist.id}`, label: checklist.title.trim() }))
    .filter(column => !!column.label);

  const columnIdByChecklistId = new Map<string, string>();
  for (const column of dynamicColumns) {
    const checklistId = column.id.replace('cgb:', '');
    columnIdByChecklistId.set(checklistId, column.id);
  }

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
    const checklistColumnId = columnIdByChecklistId.get(checklist.id);
    if (!checklistColumnId) {
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
        row.cgbStatuses[checklistColumnId] = doneValue as ChecklistStatus;
        row.cgbCheckpointRefs[checklistColumnId] = { checklistId: checklist.id, checkpointId: checkpoint.id };
        row.columnStatuses[checklistColumnId] = doneValue as ChecklistStatus;
        row.columnCheckpointRefs[checklistColumnId] = { checklistId: checklist.id, checkpointId: checkpoint.id };
      }
    }
  }

  // columns only make sense when the source checklist exists (e.g. CGB issues have neither)
  let hasTestSent = false;
  let hasTranslations = false;

  if (options?.isGraphicsMode) {
    const testSentChecklist = (apiResponse.checklists ?? []).find(
      c => normalizeTitle(c.title) === CHECKLIST_TITLES_NORM.SENT_NSLT_LP_FOR_TESTING
    );
    if (testSentChecklist) {
      hasTestSent = true;
      for (const checkpoint of testSentChecklist.checkpoints ?? []) {
        const parsed = parseCheckpointDescription(checkpoint.description || '');
        if (!parsed) continue;
        const doneValue = checkpoint.done === '1' ? 1 : 0;
        for (const shopCode of parsed.shopCodes) {
          const row = getRow(shopCode, Number.MAX_SAFE_INTEGER);
          row.testSent = doneValue;
          row.columnStatuses[COLUMN_IDS.TEST_SENT] = doneValue as ChecklistStatus;
          row.columnCheckpointRefs[COLUMN_IDS.TEST_SENT] = {
            checklistId: testSentChecklist.id,
            checkpointId: checkpoint.id,
          };
          row.checkpointRefs.testSent = {
            checklistId: testSentChecklist.id,
            checkpointId: checkpoint.id,
          };
        }
      }
    }

    if (newsletterApiResponse) {
      const translationsChecklist = (newsletterApiResponse.checklists ?? []).find(
        c => normalizeTitle(c.title) === CHECKLIST_TITLES_NORM.NEWSLETTER_TRANSLATIONS
      );
      if (translationsChecklist) {
        hasTranslations = true;
        for (const checkpoint of translationsChecklist.checkpoints ?? []) {
          const parsed = parseCheckpointDescription(checkpoint.description || '');
          if (!parsed) continue;
          const doneValue = checkpoint.done === '1' ? 1 : 0;
          for (const shopCode of parsed.shopCodes) {
            const row = getRow(shopCode, Number.MAX_SAFE_INTEGER);
            row.translations = doneValue;
            row.columnStatuses[COLUMN_IDS.TRANSLATIONS] = doneValue as ChecklistStatus;
						// read only for graphics
          }
        }
      }
    }
  }

  const rows = Array.from(rowsByShop.values()).sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.shop.localeCompare(right.shop);
  });

  // checklists without any shop checkpoint (e.g. photostudio steps in Content Graphics) would be empty columns
  const usedColumns = dynamicColumns.filter(column => rows.some(row => row.columnStatuses[column.id] !== undefined));

  const columns = createCgbColumns(usedColumns, {
    includeTranslations: hasTranslations,
    includeTestSent: hasTestSent,
  });
  return { headers: columns.map(column => column.label), columns, rows, hasGroupedNslt: false };
};
