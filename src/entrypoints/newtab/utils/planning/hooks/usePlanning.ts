import { NewsletterIdMap, PlanningResult } from '@/entrypoints/newtab/types/Planning';
import { preparePlanningEntries } from '../preparePlanningEntries';
import { groupEntriesBySlug } from '../groupEntriesBySlug';
import { sendNewslettersToSpam } from '../sendNewslettersToSpam';
import { aggregateCustomerCounts } from '../aggregateCustomerCounts';
import { sendToSpam } from '@/entrypoints/issue.content/api/planning';

export const usePlanning = (newsletterIdMap: NewsletterIdMap, concurrency: number = 5) => {
  const [loading, setLoading] = useState(false);
  const [aggregating, setAggregating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, shopsCompleted: 0, totalShops: 0 });
  const [results, setResults] = useState<PlanningResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const allEntriesRef = useRef<
    Array<{ slug: string; type: 'A' | 'B'; newsletterId: number; shopId: number; username: string }>
  >([]);
  const groupedBySlugRef = useRef<Map<string, any>>(new Map());

  const cancelPlanning = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setAggregating(false);
    setError('Planning cancelled by user');
  };

  const resendNewsletter = useCallback(
    async (slug: string, type: 'A' | 'B') => {
      // Find the entry to resend
      const entry = allEntriesRef.current.find(e => e.slug === slug && e.type === type);
      if (!entry) {
        setError(`Could not find newsletter ${slug} ${type} to resend`);
        return;
      }

      // Create a new abort controller for this resend
      const resendController = new AbortController();

      try {
        setLoading(true);

        // Update status to pending
        setResults(prev =>
          prev.map(r =>
            r.slug === slug && r.type === type ? { ...r, status: 'pending', failed: false, error: undefined } : r,
          ),
        );

        // Resend only the specific newsletter (single ID)
        await sendToSpam(
          {
            usernameReg: entry.username,
            shopId: entry.shopId,
            newsletterIds: [entry.newsletterId],
            newsletterSlug: slug,
            isABTest: false,
          },
          { signal: resendController.signal },
        );

        // Update status to success
        setResults(prev =>
          prev.map(r =>
            r.slug === slug && r.type === type ? { ...r, status: 'success', failed: false, error: undefined } : r,
          ),
        );

        console.log(`✅ Resent ${slug} ${type} successfully`);

        // After successful resend, fetch updated customer counts for this newsletter
        if (groupedBySlugRef.current.size > 0) {
          setAggregating(true);
          try {
            const allNewsletterIds = results.map(r => r.newsletterId);
            const updatedResults = await aggregateCustomerCounts(
              allNewsletterIds,
              results,
              groupedBySlugRef.current,
              resendController.signal,
            );
            setResults(updatedResults);
          } catch (err) {
            console.error('Failed to refresh customer counts after resend:', err);
          } finally {
            setAggregating(false);
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('Resend cancelled');
          return;
        }
        console.error(`❌ Failed to resend ${slug} ${type}:`, err);
        setResults(prev =>
          prev.map(r =>
            r.slug === slug && r.type === type
              ? {
                  ...r,
                  status: 'error',
                  failed: true,
                  error: err instanceof Error ? err.message : 'Unknown error',
                }
              : r,
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [results],
  );

  const executePlanning = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setLoading(true);
    setAggregating(false);
    setError(null);
    setShowResults(false);

    const { allEntries, results: initialResults } = preparePlanningEntries(newsletterIdMap);

    allEntriesRef.current = allEntries;

    if (allEntries.length === 0) {
      setError('No valid entries found. Check shop mappings.');
      setLoading(false);
      return;
    }

    const uniqueSlugs = new Set(allEntries.map(e => e.slug));
    const totalShops = uniqueSlugs.size;

    setProgress({
      current: 0,
      total: allEntries.length,
      shopsCompleted: 0,
      totalShops,
    });

    setResults(initialResults.map(r => ({ ...r, customers: 0, status: 'pending' })));

    const groupedBySlug = groupEntriesBySlug(allEntries);
    groupedBySlugRef.current = groupedBySlug;

    const { allNewsletterIds, results: sendResults } = await sendNewslettersToSpam(
      groupedBySlug,
      (current, updatedResults, completedShops) => {
        setProgress(prev => ({ ...prev, current, shopsCompleted: completedShops }));
        setResults(updatedResults);
      },
      abortControllerRef.current.signal,
      concurrency,
    );

    if (abortControllerRef.current?.signal.aborted) {
      return;
    }

    setAggregating(true);
    try {
      const updatedResults = await aggregateCustomerCounts(
        allNewsletterIds,
        sendResults,
        groupedBySlug,
        abortControllerRef.current.signal,
      );

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
    } finally {
      setAggregating(false);
    }

    setLoading(false);
    setShowResults(true);
    abortControllerRef.current = null;
  };

  return {
    loading,
    aggregating,
    error,
    progress,
    results,
    showResults,
    cancelPlanning,
    executePlanning,
    resendNewsletter,
    setShowResults,
    setError,
  };
};
