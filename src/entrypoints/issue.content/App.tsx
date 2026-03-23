import { CookiesProvider, useCookies } from 'react-cookie';
import { useMemo, useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Overlay from './components/ui/Overlay';
import TopBar from './components/ui/TopBar';

import styles from './styles/layout.module.scss';
import formStyles from './styles/forms.module.scss';
import FamilyTable from './components/FamilyTable';
import ActionsPanel from './components/ActionsPanel';
import {
  fetchIssueData,
  fetchSpreadsheetTranslations,
  getChecklistMode,
  parseIssueInfo,
  extractIssueLinks,
} from './api/issueData';
import type { ChecklistTableData, IssueInfoViewModel, IssueLink } from './lib/types';
import { fetchChecklists, mapChecklistsToTableData } from './api/checklists';

const cookieOptions = { maxAge: 7 * 24 * 60 * 60 };

const IssueAppContent = () => {
  const issueId = useMemo(() => {
    let currentUrl = window.location.href;
    if (currentUrl.endsWith('/')) {
      currentUrl = currentUrl.slice(0, -1);
    }
    return Number(currentUrl.split('/').pop());
  }, []);

  const cookieKey = useMemo(() => `${issueId}.overlayVisible`, [issueId]);
  const [cookies, setCookie] = useCookies([cookieKey]);
  const [visible, setVisible] = useState(() => {
    const cookieValue = cookies[cookieKey];
    return cookieValue !== 'false' && cookieValue !== false;
  });
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
      checkpointsDone: parsed.checkpointsDone,
      checkpointsTotal: parsed.checkpointsTotal,
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

  const handleHide = () => {
    setVisible(false);
    setCookie(cookieKey, 'false', cookieOptions);
  };

  const handleShow = () => {
    setVisible(true);
    setCookie(cookieKey, 'true', cookieOptions);
  };

  if (!issueInfo) {
    return null;
  }

  return (
    <>
      {!visible && (
        <button onClick={handleShow} className={formStyles.showOverlayButton}>
          Dashboard
        </button>
      )}

      <Overlay visible={visible}>
        <TopBar onHide={handleHide} />

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
            issueLinks={issueLinks}
            issueDate={issueInfo.issueDate}
            onGeneratedChecklist={loadIssueData}
          />
        </div>
      </Overlay>
    </>
  );
};

const IssueApp = () => (
  <CookiesProvider>
    <IssueAppContent />
  </CookiesProvider>
);

export default IssueApp;
