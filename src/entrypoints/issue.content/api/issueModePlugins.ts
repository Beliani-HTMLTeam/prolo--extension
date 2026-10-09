import type { ChecklistApiResponse, ChecklistMode, ChecklistTableData, SpreadsheetTranslations } from '../lib/types';
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
};

const newsletterPlugin: IssueModePlugin = {
  mode: 'newsletter',
  showDashboardActions: true,
  mapTableData: (apiResponse, spreadsheet) => mapNewsletterChecklistsToTableData(apiResponse, spreadsheet),
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
};

const cgbPlugin: IssueModePlugin = {
  mode: 'cgb',
  showDashboardActions: false,
  mapTableData: (apiResponse, _, newsletterApiResponse) => mapCgbChecklistsToTableData(apiResponse, newsletterApiResponse, { isGraphicsMode: true }),
};

const graphicsPlugin: IssueModePlugin = {
  mode: 'graphics',
  showDashboardActions: false,
  mapTableData: (apiResponse, _, newsletterApiResponse) => mapCgbChecklistsToTableData(apiResponse, newsletterApiResponse, { isGraphicsMode: true }),
};

// campaign issues have process checklists, not per-shop ones - no family table
const campaignPlugin: IssueModePlugin = {
  mode: 'campaign',
  showDashboardActions: false,
  mapTableData: () => ({ headers: [], columns: [], rows: [], hasGroupedNslt: false }),
};

const PLUGINS: Record<Exclude<ChecklistMode, null>, IssueModePlugin> = {
  newsletter: newsletterPlugin,
  sunday: sundayPlugin,
  cgb: cgbPlugin,
  graphics: graphicsPlugin,
  campaign: campaignPlugin,
};

export const getIssueModePlugin = (mode: ChecklistMode): IssueModePlugin => {
  if (!mode) {
    return newsletterPlugin;
  }
  return PLUGINS[mode] ?? newsletterPlugin;
};
