import axios from 'axios';
import type { BannersCounts, ChecklistApiResponse, ChecklistMode, ChecklistTableData, IssueListItem, SpreadsheetTranslations } from '../lib/types';
import { getIssueModePlugin } from './issueModePlugins';

export const createEmptyTableData = (mode: ChecklistMode): ChecklistTableData =>
  getIssueModePlugin(mode).createEmptyTableData();

export const mapChecklistsToTableData = (
  apiResponse: ChecklistApiResponse,
  mode: ChecklistMode,
  spreadsheet?: SpreadsheetTranslations | null,
): ChecklistTableData => {
  return getIssueModePlugin(mode).mapTableData(apiResponse, spreadsheet);
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

export const fetchBannersChecklistCounts = async (issueItem: IssueListItem): Promise<BannersCounts> => {
  try {
    const nsltFields = issueItem.additional_fields?.['Newsletter production'];
    const bannersField = nsltFields?.find(f => f.name.trim() === 'Newsletter Campaign banners');
    if (!bannersField?.value) return {total: 0, approved: 0};

    const bannersIssueId = bannersField.value.split('/').pop();
    if (!bannersIssueId) return {total: 0, approved: 0};


    const bannersChecklists = await fetchChecklists(Number(bannersIssueId));
    const bannersApprovedChecklist = bannersChecklists.checklists?.filter(t => t.title.includes('Banners approved'));

    const checkpoints = bannersApprovedChecklist?.[0]?.checkpoints ?? [];
    const approved = checkpoints.filter(c => c.done === '1').length;
    const total = checkpoints.length;

    return { total, approved };
  } catch (e) {
    console.warn('[banners] Failed to fetch checklist counts:', e);
    return {total: 0, approved: 0};
  }
}