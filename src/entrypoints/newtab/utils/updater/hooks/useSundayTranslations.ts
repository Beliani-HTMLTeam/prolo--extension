import { fetchAllSundayTranslations, fetchIssueData } from '@/entrypoints/issue.content/api/issueData';

interface UseSundayTranslationsProps {
  issueId: number;
}

export const useSundayTranslations = ({ issueId }: UseSundayTranslationsProps) => {
  const [subjectLines, setSubjectLines] = useState<Record<number, Record<string, string>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSundayNewsletter, setIsSundayNewsletter] = useState<boolean | null>(null);

  useEffect(() => {
    const loadSundayData = async () => {
      setLoading(true);
      try {
        const issueData = await fetchIssueData(issueId);
        const issueItem = issueData.issue_list?.[0];

        if (!issueItem) return;

        const sundayField = issueItem.additional_fields?.['Sunday newsletter'];
        const isSunday = !!sundayField;
        setIsSundayNewsletter(isSunday);

        if (!isSunday) {
          setLoading(false);
          return;
        }

        const result = await fetchAllSundayTranslations(issueItem);
        setSubjectLines(result?.subjectLines ?? {});
      } catch (e) {
        console.error('Failed to load Sunday translations:', e);
        setIsSundayNewsletter(false);
      } finally {
        setLoading(false);
      }
    };

    loadSundayData();
  }, [issueId]);

  const selectOption = (index: number) => {
    setSelectedIndex(index);
  };

  const clearSelection = () => {
    setSelectedIndex(null);
  };

  const getSelectedTranslations = () => {
    if (selectedIndex !== null && subjectLines?.[selectedIndex]) {
      return subjectLines[selectedIndex];
    }
    return null;
  };

  return {
    subjectLines,
    loading,
    isSundayNewsletter,
    selectedIndex,
    selectOption,
    clearSelection,
    getSelectedTranslations,
  };
};
