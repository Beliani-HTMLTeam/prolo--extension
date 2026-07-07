export const fetchNewsletterTitle = async (
  issueId: number,
  setNewsletterTitle: (title: string | null) => void,
  setNewsletterTitleLoading: (loading: boolean) => void,
  setError: (error: string) => void,
): Promise<void> => {
  try {
    const response = await fetch(`https://www.prologistics.info/api/issueLog/list/?page_id=${issueId}`);
    const data = await response.json();
    const title = data?.issue_list?.[0]?.issue;
    setNewsletterTitle(title || null);
    setNewsletterTitleLoading(false);
  } catch (err) {
    console.error('Failed to fetch newsletter title:', err);
    setError(`Failed to fetch newsletter title.`);
    setNewsletterTitle(null);
    setNewsletterTitleLoading(false);
  }
};
