import { useMemo, useState, useEffect, useCallback } from 'react';
import AppProviders from '@/components/app/AppProviders';
import Overlay from '@/components/overlay/Overlay';
import OverlayToggleButton from '@/components/overlay/OverlayToggleButton';
import TopBar from '@/components/overlay/TopBar';
import useOverlayVisibility from '@/hooks/useOverlayVisibility';
import Header from './components/Header';

import styles from './styles/layout.module.scss';
import FamilyTable from './components/FamilyTable';
import ActionsPanel from './components/ActionsPanel';
import {
  fetchIssueData,
  fetchSpreadsheetTranslations,
  getChecklistMode,
  parseIssueInfo,
  extractIssueLinks,
} from './api/issueData';
import { type ChecklistOwner, type ChecklistApiResponse, type ChecklistTableData, type IssueInfoViewModel, type IssueLink } from './lib/types';
import { fetchBannersChecklistCounts, fetchChecklists, mapChecklistsToTableData } from './api/checklists';
import { getIssueModePlugin } from './api/issueModePlugins';
import { getChecklistOwner, isCgbIssue } from './api/issueParsing';

const IssueAppContent = () => {
  const issueId = useMemo(() => {
    let currentUrl = window.location.href;
    if (currentUrl.endsWith('/')) {
      currentUrl = currentUrl.slice(0, -1);
    }
    return Number(currentUrl.split('/').pop());
  }, []);

  const cookieKey = useMemo(() => `${issueId}.overlayVisible`, [issueId]);
  const { visible, showOverlay, hideOverlay } = useOverlayVisibility(cookieKey);
  const [tableData, setTableData] = useState<ChecklistTableData | null>(null);
  const [issueLinks, setIssueLinks] = useState<IssueLink[]>([]);
  const [issueInfo, setIssueInfo] = useState<IssueInfoViewModel | null>(null);
  const [checklistOwner, setChecklistOwner] = useState<ChecklistOwner | null>(null);

	console.log("TEST")

  const loadIssueData = useCallback(async () => {
    const issueData = await fetchIssueData(issueId);
    const issueItem = issueData.issue_list?.[0];
    if (!issueItem) {
      setIssueInfo(null);
      setTableData(null);
      console.warn('No issue data found for issue ID:', issueId);
      return;
    }

    const bannersCounts = await fetchBannersChecklistCounts(issueItem);

    const parsed = parseIssueInfo(issueItem);
    const mode = getChecklistMode(parsed.issueTypes);
    setChecklistOwner(getChecklistOwner(parsed.issueTypes));
    console.log("checklist mode", mode);

    if (!mode) {
      setIssueInfo(null);
      setTableData(null);
      return;
    }

    setIssueLinks(extractIssueLinks(issueItem));
    setIssueInfo({
      title: parsed.title,
      description: parsed.description,
      issueDate: parsed.issueDate,
      mode,
      issueTypes: parsed.issueTypes,
      solvingUserName: parsed.solvingUserName,
      status: parsed.status,
      priorityName: parsed.priorityName,
      priorityColor: parsed.priorityColor,
      boardColumnName: parsed.boardColumnName,
      checkpointsDone: bannersCounts.approved || 0,
      checkpointsTotal: bannersCounts.total || 0,
      dueDate: parsed.dueDate,
      dueDateName: parsed.dueDateName,
      dueDateText: parsed.dueDateText,
      issueCreatedAt: parsed.issueCreatedAt,
      tags: parsed.tags,
      extraFields: parsed.extraFields,
    });
    const apiData = await fetchChecklists(issueId);
    
    let newsletterApiData: ChecklistApiResponse | null = null;
    if (parsed.newsletterIssueId) {
      try {
        newsletterApiData = await fetchChecklists(parsed.newsletterIssueId);
      } catch (err) {
        console.warn('Failed to fetch newsletter issue checklists', err);
      }
    }

    setTableData(mapChecklistsToTableData(apiData, mode, undefined, newsletterApiData));

    void fetchSpreadsheetTranslations(issueItem).then(spreadsheet => {
      setTableData(mapChecklistsToTableData(apiData, mode, spreadsheet, newsletterApiData));
    });

  }, [issueId]);

  useEffect(() => {
    void loadIssueData();
  }, [loadIssueData]);

  if (!issueInfo) {
    return null;
  }

  return (
    <>
      {!visible && <OverlayToggleButton onClick={showOverlay}>Dashboard</OverlayToggleButton>}

      <Overlay visible={visible}>
        <TopBar onHide={hideOverlay} />

        <Header
          issueTitle={issueInfo.title}
          issueDescription={issueInfo.description}
          issueTypes={issueInfo.issueTypes}
          solvingUserName={issueInfo.solvingUserName}
          status={issueInfo.status}
          priorityName={issueInfo.priorityName}
          priorityColor={issueInfo.priorityColor}
          boardColumnName={issueInfo.boardColumnName}
          checkpointsDone={issueInfo.checkpointsDone}
          checkpointsTotal={issueInfo.checkpointsTotal}
          issueDate={issueInfo.issueDate}
          dueDate={issueInfo.dueDate}
          dueDateName={issueInfo.dueDateName}
          dueDateText={issueInfo.dueDateText}
          issueCreatedAt={issueInfo.issueCreatedAt}
          tags={issueInfo.tags}
        />

        <div className={styles.dashboard}>
          {/* no shop checklists (campaigns, most SM Paid / Technology tasks) - only links and chat */}
          {tableData && tableData.rows.length > 0 && (
            <div className={styles.leftPanel}>
              <FamilyTable data={tableData} owner={checklistOwner} />
            </div>
          )}
          <ActionsPanel
            tableData={tableData}
            issueId={issueId}
            mode={issueInfo.mode}
            showDashboardActions={getIssueModePlugin(issueInfo.mode).showDashboardActions}
            showRenameChecklists={isCgbIssue(issueInfo.issueTypes)}
            issueLinks={issueLinks}
            extraFields={issueInfo.extraFields}
            issueDate={issueInfo.issueDate}
            onGeneratedChecklist={loadIssueData}
            onStartPlanning={() => {}}
          />
        </div>
      </Overlay>
    </>
  );
};

const IssueApp = () => (
  <AppProviders>
    <IssueAppContent />
  </AppProviders>
);

export default IssueApp;
