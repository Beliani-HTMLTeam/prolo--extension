import { PlanningEntry } from '../../types/Planning';

export const groupEntriesBySlug = (allEntries: PlanningEntry[]): Map<string, PlanningEntry[]> => {
  const grouped = new Map<string, PlanningEntry[]>();

  for (const entry of allEntries) {
    if (!grouped.has(entry.slug)) {
      grouped.set(entry.slug, []);
    }
    grouped.get(entry.slug)!.push(entry);
  }

  return grouped;
};
