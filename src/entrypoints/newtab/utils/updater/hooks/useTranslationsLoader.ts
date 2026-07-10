import { fetchIssueData, fetchSubjectPageTranslations } from '@/entrypoints/issue.content/api/issueData';
import { fetchLPPaths } from '@/entrypoints/issue.content/api/updater';
import { LineTitleTranslations } from '@/entrypoints/issue.content/lib/types';
import { getDefaultDeactivateDate } from '../dates';
import { refreshSpreadsheetData } from '@/entrypoints/issue.content/api/spreadsheetService';

interface UseTranslationsLoaderProps {
  issueId: number;
  rows: Array<{ shop: string }>;
  isSundayNewsletter?: boolean;
}

export const useTranslationsLoader = ({
  issueId,
  rows,
  isSundayNewsletter = false,
}: UseTranslationsLoaderProps) => {
  console.log("rows", rows)
  const [translations, setTranslations] = useState<LineTitleTranslations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [globalLP, setGlobalLP] = useState('');
  const [deactivateDate, setDeactivateDate] = useState<Date | null>(null);
  const [isRefreshed, setIsRefreshed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshInProgressRef = useRef(false);

    const loadIssueData = useCallback(async (skipRefresh: boolean = false) => {
      setLoading(true);
        setError(null);
      try {
        const issueData = await fetchIssueData(issueId);
        const issueItem = issueData.issue_list?.[0];
        if (!issueItem) {
          setError('Issue data not found');
          return;
        }

         // Refresh spreadsheet data only for regular newsletters (not Sunday)
      // and only on first load
      if (!isSundayNewsletter && !skipRefresh && !refreshInProgressRef.current) {
        refreshInProgressRef.current = true;
        setIsRefreshing(true);
        setIsRefreshed(false);
        try {
          const refreshed = await refreshSpreadsheetData(issueItem, issueId);
          if (refreshed) {
            console.log('✅ Spreadsheet data refreshed successfully');
          } else {
            console.warn('⚠️ Spreadsheet refresh failed, using cached data');
          }
        } catch (refreshError) {
          console.warn('⚠️ Spreadsheet refresh error:', refreshError);
        } finally {
          refreshInProgressRef.current = false;
          setIsRefreshed(true);
          setIsRefreshing(false);
        }
      }

        const [rawTranslations, lpResult] = await Promise.all([
          fetchSubjectPageTranslations(issueItem),
          fetchLPPaths(issueItem),
        ]);

        setGlobalLP(lpResult.lp);

        let calculatedDate: Date;
        if (lpResult.date) {
          calculatedDate = getDefaultDeactivateDate(lpResult.date);
        } else {
          calculatedDate = getDefaultDeactivateDate();
        }

        setDeactivateDate(calculatedDate);

          const availableSlugsSet = new Set(rows.map(row => row.shop));


        const filteredTranslations: LineTitleTranslations = {
          subjectLine: rawTranslations.subjectLine
            ? Object.entries(rawTranslations.subjectLine)
                .filter(([slug]) => availableSlugsSet.has(slug))
                .reduce(
                  (acc, [slug, content]) => ({
                    ...acc,
                    [slug]: content,
                  }),
                  {},
                )
            : null,
          pageTitle: rawTranslations.pageTitle
            ? Object.entries(rawTranslations.pageTitle)
                .filter(([slug]) => availableSlugsSet.has(slug))
                .reduce(
                  (acc, [slug, content]) => ({
                    ...acc,
                    [slug]: content,
                  }),
                  {},
                )
            : null,
        };

        setTranslations(filteredTranslations);
        console.log("filtered translations", filteredTranslations);
      } catch (e) {
        console.error('Failed to load SL/PT translations: ', e);
        setError(e instanceof Error ? e.message : 'Failed to load translations');
      } finally {
        setLoading(false);
      }


  }, [issueId, rows]);

  useEffect(() => {
        loadIssueData();

  }, [loadIssueData]);

  const retry = useCallback(() => {
    loadIssueData(true);
  }, [loadIssueData]);

  return { translations, loading, error, globalLP, setGlobalLP, deactivateDate, retry , isRefreshed, isRefreshing, refreshSpreadsheet: () => loadIssueData(true)};
};
