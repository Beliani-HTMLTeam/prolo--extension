import axios from 'axios';
import { CGB_HEADERS, TABLE_HEADERS } from './checklistShared';
import { mapCgbChecklistsToTableData } from './checklistCgbMapper';
import { mapNewsletterChecklistsToTableData } from './checklistNewsletterMapper';
import type {
  ChecklistApiResponse,
  ChecklistMode,
  ChecklistTableData,
  SpreadsheetTranslations,
} from '../lib/types';

export const createEmptyTableData = (mode: ChecklistMode): ChecklistTableData => ({
  headers: mode === 'cgb' ? CGB_HEADERS : TABLE_HEADERS,
  rows: [],
  hasGroupedNslt: false,
});

export const mapChecklistsToTableData = (
  apiResponse: ChecklistApiResponse,
  mode: ChecklistMode,
  spreadsheet?: SpreadsheetTranslations | null,
): ChecklistTableData => {
  if (mode === 'cgb') {
    return mapCgbChecklistsToTableData(apiResponse);
  }

  return mapNewsletterChecklistsToTableData(apiResponse, spreadsheet);
};

export const fetchChecklists = async (issueId: number) => {
  const baseUrl = window.location.origin;
  const apiUrl = `${baseUrl}/api/issueLog/checklist/?issue_id=${issueId}`;

  try {
    const { data } = await axios.get(apiUrl);
    return data as ChecklistApiResponse;
  } catch (error) {
    console.error('Failed to fetch checklists:', error);
    throw error;
  }
};
