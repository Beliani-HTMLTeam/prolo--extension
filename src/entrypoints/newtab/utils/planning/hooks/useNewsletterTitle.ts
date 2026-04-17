const ISSUE_URL = 'https://www.prologistics.info/api/issueLog/list/?page_id=';


export const useNewsletterTitle = (issueId: number) => {
  const [newsletterTitle, setNewsletterTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTitle = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${ISSUE_URL}${issueId}`);
        const data = await response.json();
        const title = data?.issue_list?.[0]?.issue;
        setNewsletterTitle(title || null);
        setError(null);
      } catch (err) {
         console.error('Failed to fetch newsletter title:', err);
        setError('Failed to fetch newsletter title.');
        setNewsletterTitle(null);
      } finally {
        setLoading(false);
      }
    }

    if (issueId) {
      fetchTitle();
    }
  }, [issueId]
  )

  return { newsletterTitle, loading, error }; 
}