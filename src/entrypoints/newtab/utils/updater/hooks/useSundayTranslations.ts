import { fetchAllSundayTranslations, fetchIssueData } from '@/entrypoints/issue.content/api/issueData';

interface UseSundayTranslationsProps {
  issueId: number;
  availableSlugs?: string[];
}

export const useSundayTranslations = ({ issueId, availableSlugs: propAvailableSlugs }: UseSundayTranslationsProps) => {
  const [rawSubjectLines, setRawSubjectLines] = useState<Record<number, Record<string, string>> | null>(null);
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
        setRawSubjectLines(result?.subjectLines ?? {});
      } catch (e) {
        console.error('Failed to load Sunday translations:', e);
        setIsSundayNewsletter(false);
      } finally {
        setLoading(false);
      }
    };

    loadSundayData();
  }, [issueId]);

  const subjectLines = useMemo(() => {
    if (!rawSubjectLines) return null;

    if (!propAvailableSlugs || propAvailableSlugs.length === 0) {
      return rawSubjectLines;
    }

    const slugSet = new Set(propAvailableSlugs);
    const filtered: Record<number, Record<string, string>> = {};

    Object.entries(rawSubjectLines).forEach(([optionIndex, slugsMap]) => {
      const optionIdx = Number(optionIndex);
      filtered[optionIdx] = {};

      Object.entries(slugsMap)
        .filter(([slug]) => slugSet.has(slug))
        .forEach(([slug, content]) => {
          filtered[optionIdx][slug] = content;
        });
    });

    return filtered;
  }, [rawSubjectLines, propAvailableSlugs]);

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
