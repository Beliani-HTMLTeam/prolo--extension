import type { ChecklistApiResponse, ChecklistMode, ChecklistTableData, SpreadsheetTranslations } from '../lib/types';
import { createCgbColumns, createNewsletterColumns } from './checklistShared';
import { mapCgbChecklistsToTableData } from './checklistCgbMapper';
import { mapNewsletterChecklistsToTableData } from './checklistNewsletterMapper';

export type IssueModePlugin = {
  mode: Exclude<ChecklistMode, null>;
  showDashboardActions: boolean;
  mapTableData: (
    apiResponse: ChecklistApiResponse,
    spreadsheet?: SpreadsheetTranslations | null,
    newsletterApiResponse?: ChecklistApiResponse | null,
  ) => ChecklistTableData;
  createEmptyTableData: () => ChecklistTableData;
};

const newsletterPlugin: IssueModePlugin = {
  mode: 'newsletter',
  showDashboardActions: true,
  mapTableData: (apiResponse, spreadsheet) => mapNewsletterChecklistsToTableData(apiResponse, spreadsheet),
  createEmptyTableData: () => {
    const columns = createNewsletterColumns(false, false, false, false);
    return { headers: columns.map(column => column.label), columns, rows: [], hasGroupedNslt: false, hasGroupedLp: false };
  },
};

const sundayPlugin: IssueModePlugin = {
  mode: 'sunday',
  showDashboardActions: true,
  mapTableData: (apiResponse, spreadsheet) =>
    mapNewsletterChecklistsToTableData(apiResponse, spreadsheet, {
      includeTranslations: false,
      includeLp: false,
      hasGroupedLp: false,
    }),
  createEmptyTableData: () => {
    const columns = createNewsletterColumns(false, false, false, false, {
      includeTranslations: false,
      includeLp: false,
    });
    return { headers: columns.map(column => column.label), columns, rows: [], hasGroupedNslt: false, hasGroupedLp: false };
  },
};

const cgbPlugin: IssueModePlugin = {
  mode: 'cgb',
  showDashboardActions: false,
  mapTableData: (apiResponse, _, newsletterApiResponse) => mapCgbChecklistsToTableData(apiResponse, newsletterApiResponse, { isGraphicsMode: true }),
  createEmptyTableData: () => {
    const columns = createCgbColumns([], { includeTranslations: true, includeTestSent: true });
    return { headers: columns.map(column => column.label), columns, rows: [], hasGroupedNslt: false, hasGroupedLp: false };
  },
};

const graphicsPlugin: IssueModePlugin = {
  mode: 'graphics',
  showDashboardActions: false,
  mapTableData: (apiResponse, _, newsletterApiResponse) => mapCgbChecklistsToTableData(apiResponse, newsletterApiResponse, { isGraphicsMode: true }),
  createEmptyTableData: () => {
    const columns = createCgbColumns([], { includeTranslations: true, includeTestSent: true });
    return { headers: columns.map(column => column.label), columns, rows: [], hasGroupedNslt: false, hasGroupedLp: false };
  },
};

const PLUGINS: Record<Exclude<ChecklistMode, null>, IssueModePlugin> = {
  newsletter: newsletterPlugin,
  sunday: sundayPlugin,
  cgb: cgbPlugin,
  graphics: graphicsPlugin,
};

export const getIssueModePlugin = (mode: ChecklistMode): IssueModePlugin => {
  if (!mode) {
    return newsletterPlugin;
  }
  return PLUGINS[mode] ?? newsletterPlugin;
};
