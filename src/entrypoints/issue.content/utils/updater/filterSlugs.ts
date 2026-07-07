import { ChecklistTableRow } from "@/entrypoints/issue.content/lib/types";

export const filterSlugsWithNewsletterIds = (rows: ChecklistTableRow[]): string[] => {
  return rows.filter(row => {
    if (row.nsltId) return true

    if (row.nsltAId || row.nsltBId) return true

    return false
  }).map(row => row.shop)
}