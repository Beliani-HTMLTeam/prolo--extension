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
  fetchSubjectPageTranslations,
} from './api/issueData';
import type { ChecklistTableData, IssueInfoViewModel, IssueLink } from './lib/types';
import { fetchBannersChecklistCounts, fetchChecklists, mapChecklistsToTableData } from './api/checklists';
import { getIssueModePlugin } from './api/issueModePlugins';

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
    });
    const apiData = await fetchChecklists(issueId);
    setTableData(mapChecklistsToTableData(apiData, mode));

    void fetchSpreadsheetTranslations(issueItem).then(spreadsheet => {
      setTableData(mapChecklistsToTableData(apiData, mode, spreadsheet));
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
        />

        <div className={styles.dashboard}>
          <div className={styles.leftPanel}>{tableData && <FamilyTable data={tableData} />}</div>
          <ActionsPanel
            tableData={tableData}
            issueId={issueId}
            mode={issueInfo.mode}
            showDashboardActions={getIssueModePlugin(issueInfo.mode).showDashboardActions}
            issueLinks={issueLinks}
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
