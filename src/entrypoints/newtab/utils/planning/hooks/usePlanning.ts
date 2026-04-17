import { PlanningResult } from '@/entrypoints/newtab/types/Planning';
import { preparePlanningEntries } from '../preparePlanningEntries';
import { groupEntriesBySlug } from '../groupEntriesBySlug';
import { sendNewslettersToSpam } from '../sendNewslettersToSpam';
import { aggregateCustomerCounts } from '../aggregateCustomerCounts';

export const usePlanning = (newsletterIdMap: Map<string, any>) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<PlanningResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const executePlanning = async () => {
    setLoading(true);
    setError(null);
    setShowResults(false);

    const { allEntries, results: initialResults } = preparePlanningEntries(newsletterIdMap);

    if (allEntries.length === 0) {
      setError('No valid entries found. Check shop mappings.');
      setLoading(false);
      return;
    }

    setProgress({ current: 0, total: allEntries.length });
    setResults(initialResults.map(r => ({ ...r, customers: 0, status: 'pending' })));

    const groupedBySlug = groupEntriesBySlug(allEntries);

    const { allNewsletterIds, results: sendResults } = await sendNewslettersToSpam(
      groupedBySlug,
      (current, updatedResults) => {
        setProgress(prev => ({ ...prev, current }));
        setResults(updatedResults);
      },
    );

    try {
      const updatedResults = await aggregateCustomerCounts(allNewsletterIds, sendResults, groupedBySlug);
      setResults(updatedResults);
    } catch (err) {
      setError('Failed to fetch customer counts: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }

    setLoading(false);
    setShowResults(true);
  };

  return {
    loading,
    error,
    progress,
    results,
    showResults,
    executePlanning,
    setShowResults,
    setError,
  };
};
