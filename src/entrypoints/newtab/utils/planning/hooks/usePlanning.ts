import { PlanningResult } from '@/entrypoints/newtab/types/Planning';
import { preparePlanningEntries } from '../preparePlanningEntries';
import { groupEntriesBySlug } from '../groupEntriesBySlug';
import { sendNewslettersToSpam } from '../sendNewslettersToSpam';
import { aggregateCustomerCounts } from '../aggregateCustomerCounts';

export const usePlanning = (newsletterIdMap: Map<string, any>, concurrency: number = 5) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<PlanningResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelPlanning = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
      setLoading(false);
    setError('Planning cancelled by user');
  }

  const executePlanning = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

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
      abortControllerRef.current.signal,
      concurrency
    );

      if (abortControllerRef.current?.signal.aborted) {
      return;
    }

    try {
      const updatedResults = await aggregateCustomerCounts(allNewsletterIds, sendResults, groupedBySlug, abortControllerRef.current.signal);

       if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setResults(updatedResults);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Planning cancelled');
        return;
      }

      setError('Failed to fetch customer counts: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }

    setLoading(false);
    setShowResults(true);
      abortControllerRef.current = null;
  };

  return {
    loading,
    error,
    progress,
    results,
    showResults,
    cancelPlanning,
    executePlanning,
    setShowResults,
    setError,
  };
};
