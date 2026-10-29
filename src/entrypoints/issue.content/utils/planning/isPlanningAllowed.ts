import type { ChecklistMode, ChecklistTableRow } from '@/entrypoints/issue.content/lib/types';

const SUNDAY_SHOPS_WITHOUT_NEWSLETTER = ['HR', 'SI'];

export const isPlanningAllowed = (mode: ChecklistMode | undefined, rows: ChecklistTableRow[]): boolean => {
  if (mode === 'cgb') {
    return false;
  }
  if (mode === 'sunday') {
    const newsletterRows = rows.filter(row => !SUNDAY_SHOPS_WITHOUT_NEWSLETTER.includes(row.shop.toUpperCase()));
    return newsletterRows.length > 0 && newsletterRows.every(row => row.columnStatuses.nsltAccepted === 1);
  }
  return true;
};
