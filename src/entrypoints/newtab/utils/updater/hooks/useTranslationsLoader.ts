import { fetchIssueData, fetchSubjectPageTranslations } from '@/entrypoints/issue.content/api/issueData';
import { fetchLPPaths } from '@/entrypoints/issue.content/api/updater';
import { LineTitleTranslations } from '@/entrypoints/issue.content/lib/types';
import { getDefaultDeactivateDate } from '../dates';

interface UseTranslationsLoaderProps {
  issueId: number;
  rows: Array<{ shop: string }>;
}

export const useTranslationsLoader = ({
  issueId,
  rows,
}: UseTranslationsLoaderProps) => {
  const [translations, setTranslations] = useState<LineTitleTranslations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [globalLP, setGlobalLP] = useState('');
  const [deactivateDate, setDeactivateDate] = useState<Date | null>(null);

    const loadIssueData = useCallback(async () => {
      setLoading(true);
        setError(null);
      try {
        const issueData = await fetchIssueData(issueId);
        const issueItem = issueData.issue_list?.[0];
        if (!issueItem) {
          setError('Issue data not found');
          return;
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
    loadIssueData();
  }, [loadIssueData]);

  return { translations, loading, error, globalLP, setGlobalLP, deactivateDate, retry };
};
