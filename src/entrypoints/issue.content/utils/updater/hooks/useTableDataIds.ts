import { ChecklistTableRow } from "@/entrypoints/issue.content/lib/types";

interface NewsletterIds {
  aId?: string;
  bId?: string;
}

export const useTableDataIds = (rows: ChecklistTableRow[]) => {
  const newsletterIds = useMemo(() => {
    const ids: Record<string, NewsletterIds> = {};

    rows.forEach(row => {
      const slug = row.shop;
      const idsForSlug: NewsletterIds = {};

      // check for A/B test
      if (row.nsltAId) {
        idsForSlug.aId = row.nsltAId;
      }
      if (row.nsltBId) {
        idsForSlug.bId = row.nsltBId;
      }

      if (!row.nsltAId && !row.nsltBId && row.nsltId) {
        idsForSlug.aId = row.nsltId;
      }

      if (Object.keys(idsForSlug).length > 0) {
        ids[slug] = idsForSlug;
      }
    });

    return ids;
    }, [rows]);
  
  const landingPageIds = useMemo(() => {
    const ids: Record<string, NewsletterIds> = {};

    rows.forEach(row => {
       const slug = row.shop;
      const idsForSlug: NewsletterIds = {};
      if (row.lpId) {
        idsForSlug.aId = row.lpId;
      }
      if (row.lpAId) {
        idsForSlug.aId = row.lpAId;
      }
      if (row.lpBId) {
        idsForSlug.bId = row.lpBId;
      }
      if (Object.keys(idsForSlug).length > 0) {
        ids[slug] = idsForSlug;
      }
    });

    return ids;
  }, [rows]);

  return { newsletterIds, landingPageIds };
}