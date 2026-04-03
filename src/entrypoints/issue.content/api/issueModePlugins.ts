import type { ChecklistApiResponse, ChecklistMode, ChecklistTableData, SpreadsheetTranslations } from '../lib/types';
import { createCgbColumns, createNewsletterColumns } from './checklistShared';
import { mapCgbChecklistsToTableData } from './checklistCgbMapper';
import { mapNewsletterChecklistsToTableData } from './checklistNewsletterMapper';

export type IssueModePlugin = {
  mode: Exclude<ChecklistMode, null>;
  showDashboardActions: boolean;
  mapTableData: (apiResponse: ChecklistApiResponse, spreadsheet?: SpreadsheetTranslations | null) => ChecklistTableData;
  createEmptyTableData: () => ChecklistTableData;
};

const newsletterPlugin: IssueModePlugin = {
  mode: 'newsletter',
  showDashboardActions: true,
  mapTableData: (apiResponse, spreadsheet) => mapNewsletterChecklistsToTableData(apiResponse, spreadsheet),
  createEmptyTableData: () => {
    const columns = createNewsletterColumns(false, false, false);
    return { headers: columns.map(column => column.label), columns, rows: [], hasGroupedNslt: false };
  },
};

const sundayPlugin: IssueModePlugin = {
  mode: 'sunday',
  showDashboardActions: true,
  mapTableData: (apiResponse, spreadsheet) =>
    mapNewsletterChecklistsToTableData(apiResponse, spreadsheet, {
      includeTranslations: false,
      includeLp: false,
    }),
  createEmptyTableData: () => {
    const columns = createNewsletterColumns(false, false, false, {
      includeTranslations: false,
      includeLp: false,
    });
    return { headers: columns.map(column => column.label), columns, rows: [], hasGroupedNslt: false };
  },
};

const cgbPlugin: IssueModePlugin = {
  mode: 'cgb',
  showDashboardActions: false,
  mapTableData: apiResponse => mapCgbChecklistsToTableData(apiResponse),
  createEmptyTableData: () => {
    const columns = createCgbColumns([]);
    return { headers: columns.map(column => column.label), columns, rows: [], hasGroupedNslt: false };
  },
};

const PLUGINS: Record<Exclude<ChecklistMode, null>, IssueModePlugin> = {
  newsletter: newsletterPlugin,
  sunday: sundayPlugin,
  cgb: cgbPlugin,
};

export const getIssueModePlugin = (mode: ChecklistMode): IssueModePlugin => {
  if (!mode) {
    return newsletterPlugin;
  }
  return PLUGINS[mode] ?? newsletterPlugin;
};
