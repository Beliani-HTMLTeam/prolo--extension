import { fetchIssueData, fetchSubjectPageTranslations } from '@/entrypoints/issue.content/api/issueData';
import { fetchLPPaths } from '@/entrypoints/issue.content/api/updater';
import { LineTitleTranslations } from '@/entrypoints/issue.content/lib/types';

interface UseTranslationsLoaderProps {
  issueId: number;
  rows: Array<{ shop: string }>;
}

export const useTranslationsLoader = ({ issueId, rows }: UseTranslationsLoaderProps) => {
  const [translations, setTranslations] = useState<LineTitleTranslations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [globalLP, setGlobalLP] = useState('');

  useEffect(() => {
    const loadIssueData = async () => {
      setLoading(true);
      try {
        const issueData = await fetchIssueData(issueId);
        const issueItem = issueData.issue_list?.[0];
        if (!issueItem) {
          setError('Issue data not found');
          return;
        }

        const [rawTranslations, lpPath] = await Promise.all([
          fetchSubjectPageTranslations(issueItem),
          fetchLPPaths(issueItem),
        ]);

         console.log('Fetched LP Path:', lpPath); 

          const finalLP = lpPath || 'lp00-00-00';
        setGlobalLP(finalLP);

        const availableSlugs = new Set(rows.map(row => row.shop));

        const filteredTranslations: LineTitleTranslations = {
          subjectLine: rawTranslations.subjectLine
            ? Object.entries(rawTranslations.subjectLine)
                .filter(([slug]) => availableSlugs.has(slug))
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
                .filter(([slug]) => availableSlugs.has(slug))
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
        setError('Failed to load translations');
      } finally {
        setLoading(false);
      }
    };

    void loadIssueData();
  }, [issueId, rows]);

  return { translations, loading, error, globalLP, setGlobalLP };
};
