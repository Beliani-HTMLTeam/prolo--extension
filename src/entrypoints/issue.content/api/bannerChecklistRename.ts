import { fetchChecklists } from './checklists';
import { updateChecklistTitle } from './checklistGeneration';
import type { Comment } from './comments';
import { parseBannerEntries, type BannerEntry } from '../utils/bannerChecklistEntries';

const PLACEHOLDER_TITLE = 'banners approved (with ro)';
const REQUEST_DELAY_MS = 200;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const renameBannerChecklists = async (issueId: number, comments: Comment[]): Promise<number> => {
  const entries = parseBannerEntries(comments);
  if (entries.length === 0) throw new Error('No "N - Name shop_banner.php?id=..." lines found in comments.');

  const { checklists } = await fetchChecklists(issueId);
  const targets = checklists
    .filter(cl => cl.title.trim().toLowerCase() === PLACEHOLDER_TITLE)
    .sort((a, b) => Number(a.ordering) - Number(b.ordering));
  if (targets.length === 0) return 0;

  // prefer match by banner id in checkpoints, fall back to order
  const usedEntries = new Set<BannerEntry>();
  const assigned = new Map<string, BannerEntry>();
  for (const cl of targets) {
    const text = (cl.checkpoints ?? []).map(c => c.description).join('\n');
    const entry = entries.find(e => !usedEntries.has(e) && new RegExp(`[?&]id=${e.bannerId}(?!\\d)`).test(text));
    if (entry) {
      usedEntries.add(entry);
      assigned.set(cl.id, entry);
    }
  }
  const remaining = entries.filter(e => !usedEntries.has(e));
  for (const cl of targets) {
    if (!assigned.has(cl.id) && remaining.length > 0) assigned.set(cl.id, remaining.shift()!);
  }

  let renamed = 0;
  for (const cl of targets) {
    const entry = assigned.get(cl.id);
    if (!entry) continue;
    await updateChecklistTitle(issueId, cl.id, entry.name);
    renamed += 1;
    await delay(REQUEST_DELAY_MS);
  }
  return renamed;
};
