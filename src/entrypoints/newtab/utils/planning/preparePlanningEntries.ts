import { SLUG_ID_MAP, USERNAME_ID_MAP } from '@/entrypoints/issue.content/lib/planningConfig';
import { PlanningEntry, PlanningResult } from '../../types/Planning';

export const preparePlanningEntries = (
  newsletterIdMap: Map<string, Array<{ type: 'A' | 'B'; newsletterId: number }>>,
): { allEntries: PlanningEntry[]; results: PlanningResult[] } => {
  const allEntries: PlanningEntry[] = [];
  const results: PlanningResult[] = [];

  for (const [slug, ids] of newsletterIdMap.entries()) {
    const shopId = SLUG_ID_MAP[slug];
    const username = Object.keys(USERNAME_ID_MAP).find(key => USERNAME_ID_MAP[key] === shopId);

    if (!shopId || !username) {
      console.warn(`Missing shopId or username for slug ${slug}: shopId=${shopId}, username=${username}`);
      continue;
    }
    for (const { type, newsletterId } of ids) {
      allEntries.push({ slug, type, newsletterId, shopId: +shopId, username: username });

      results.push({ slug, type, newsletterId, customers: 0, status: 'pending' });
    }
  }

  return { allEntries, results };
};
