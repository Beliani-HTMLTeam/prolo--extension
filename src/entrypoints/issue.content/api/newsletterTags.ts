import axios from 'axios';
import { fetchIssueData } from './issueData';
 
const SA_CONTENT_ID = '548'; // sa_contents list that holds the newsletter tags
const SHOP_SPAM_GROUP_ID = '741'; // checked[741][548][]
const TAGS_FIELD_ID = '919'; // issue additional field "Newsletter TAGS"
const TAGS_FIELD_NAME = 'newsletter tags';
const PRIMARY_SLUG = 'CHDE';
 
type Variant = 'a' | 'b';
 
interface IssueFieldValue {
  id: string;
  answer_value: string;
}
 
interface IssueField {
  field_id: string;
  name: string;
  value: unknown;
  text_value: string | null;
  values?: IssueFieldValue[];
}
 
interface SaContentValue {
  ordering: string | number;
  description?: Record<string, { value?: string } | undefined>;
}
 
export interface TagVariantResult {
  variant: Variant;
  nsltId: string;
  tags: string[];
  success: boolean;
  error?: string;
}
 
export interface TagSyncResult {
  success: boolean;
  skipped?: string;
  issueTags: string[];
  unmatchedTags: string[];
  variants: TagVariantResult[];
  error?: string;
}
 
const origin = () => window.location.origin;
 
// "4for3" === "4 for 3", case / spaces / punctuation / accents ignored
const normalizeTag = (tag: string): string =>
  tag
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '');
 
const TEST_TAG: Record<Variant, string> = { a: normalizeTag('Test A'), b: normalizeTag('Test B') };
 
// ---------- issue tags ----------
 
const findTagsField = (additionalFields: unknown): IssueField | null => {
  if (!additionalFields || typeof additionalFields !== 'object') return null;
 
  for (const group of Object.values(additionalFields as Record<string, unknown>)) {
    if (!Array.isArray(group)) continue;
    const field = (group as IssueField[]).find(
      f => f?.field_id === TAGS_FIELD_ID || f?.name?.trim().toLowerCase() === TAGS_FIELD_NAME,
    );
    if (field) return field;
  }
  return null;
};
 
export const getIssueTags = (issueItem: { additional_fields?: unknown }): string[] => {
  const field = findTagsField(issueItem.additional_fields);
  if (!field) return [];
 
  const selectedIds = (Array.isArray(field.value) ? field.value : field.value ? [field.value] : []).map(String);
  const fromIds = selectedIds
    .map(id => field.values?.find(v => String(v.id) === id)?.answer_value?.trim())
    .filter((tag): tag is string => !!tag);
 
  if (fromIds.length > 0) return fromIds;
 
  // fallback: "Bedroom; Beds; Lighting"
  return (field.text_value ?? '')
    .split(';')
    .map(tag => tag.trim())
    .filter(Boolean);
};
 
// ---------- prologistics calls ----------
 
/** normalized english tag name -> ordering (the value sent in checked[741][548][]) */
const fetchTagCatalog = async (): Promise<Map<string, string>> => {
  const res = await axios.get(`${origin()}/api/sa_contents/get/?id=${SA_CONTENT_ID}`, { withCredentials: true });
  const values = res.data?.sa_content?.content_values as Record<string, SaContentValue> | undefined;
  if (!values) throw new Error(`Tag list (sa_content ${SA_CONTENT_ID}) is empty or not accessible`);
 
  const catalog = new Map<string, string>();
  Object.values(values).forEach(value => {
    const name = value?.description?.english?.value;
    if (name && value.ordering !== undefined && value.ordering !== null) {
      catalog.set(normalizeTag(name), String(value.ordering));
    }
  });
  return catalog;
};
 
const assertOk = (data: unknown, action: string) => {
  if (data && typeof data === 'object') {
    const d = data as { success?: boolean; error?: unknown };
    if (d.success === false || d.error) throw new Error(`${action}: ${String(d.error ?? 'failed')}`);
  }
};
 
const saveNewsletterTags = async (nsltId: string, orderings: string[]) => {
  const formData = new FormData();
  formData.append('id', nsltId);
  orderings.forEach(ordering => formData.append(`checked[${SHOP_SPAM_GROUP_ID}][${SA_CONTENT_ID}][]`, ordering));
 
  const res = await axios.post(`${origin()}/api/saFields/saveFieldsShopSpam`, formData, { withCredentials: true });
  assertOk(res.data, 'Save tags');
};
 
const copyTagsToFamily = async (nsltId: string) => {
  const formData = new FormData();
  formData.append('fn', 'copy_content_of_shop_spam_to_newsletter_family');
  formData.append('id', nsltId);
 
  const res = await axios.post(`${origin()}/js_backend.php`, formData, { withCredentials: true });
  assertOk(res.data, 'Copy tags to family');
};
 
// ---------- main ----------
 
export const applyNewsletterTags = async ({
  issueId,
  newsletterIds,
}: {
  issueId: number;
  newsletterIds?: Record<string, { aId?: string; bId?: string }>;
}): Promise<TagSyncResult> => {
  const result: TagSyncResult = { success: false, issueTags: [], unmatchedTags: [], variants: [] };
 
  const chde = newsletterIds?.[PRIMARY_SLUG];
  if (!chde?.aId && !chde?.bId) {
    result.error = `No ${PRIMARY_SLUG} newsletter ID - tags not set`;
    return result;
  }
 
  const issueData = await fetchIssueData(issueId);
  const issueItem = issueData.issue_list?.[0];
  if (!issueItem) {
    result.error = 'Issue data not found';
    return result;
  }
 
  result.issueTags = getIssueTags(issueItem);
  if (result.issueTags.length === 0) {
    result.success = true;
    result.skipped = 'No Newsletter TAGS set on the issue';
    return result;
  }
 
  const catalog = await fetchTagCatalog();
  const matched: Array<{ tag: string; key: string; ordering: string }> = [];
  result.issueTags.forEach(tag => {
    const key = normalizeTag(tag);
    const ordering = catalog.get(key);
    if (ordering) matched.push({ tag, key, ordering });
    else result.unmatchedTags.push(tag);
  });
 
  if (matched.length === 0) {
    // never send an empty list - it would clear the newsletter's tags
    result.error = `None of the issue tags exist in the tag list: ${result.issueTags.join(', ')}`;
    return result;
  }
 
  const isAB = !!chde.aId && !!chde.bId;
  const targets: Array<{ variant: Variant; nsltId: string }> = [];
  if (chde.aId) targets.push({ variant: 'a', nsltId: chde.aId });
  if (chde.bId) targets.push({ variant: 'b', nsltId: chde.bId });
 
  // sequential: family A fully done before family B (same rule as the SL/PT update)
  for (const { variant, nsltId } of targets) {
    const otherTestTag = TEST_TAG[variant === 'a' ? 'b' : 'a'];
    const tagsForVariant = isAB ? matched.filter(m => m.key !== otherTestTag) : matched;
    const orderings = Array.from(new Set(tagsForVariant.map(m => m.ordering)));
 
    const variantResult: TagVariantResult = {
      variant,
      nsltId,
      tags: tagsForVariant.map(m => m.tag),
      success: false,
    };
 
    try {
      await saveNewsletterTags(nsltId, orderings);
      await copyTagsToFamily(nsltId);
      variantResult.success = true;
    } catch (e) {
      variantResult.error = e instanceof Error ? e.message : String(e);
      console.error(`Newsletter tags failed for ${PRIMARY_SLUG} ${variant.toUpperCase()} (${nsltId}):`, e);
    }
    result.variants.push(variantResult);
  }
 
  result.success = result.variants.every(v => v.success);
  return result;
};
 
export const formatTagSyncResult = (res: TagSyncResult): string => {
  if (res.skipped) return `Tags: ${res.skipped}`;
  if (res.error && res.variants.length === 0) return `Tags not set: ${res.error}`;
 
  const parts = res.variants.map(v => {
    const label = res.variants.length > 1 ? `Family ${v.variant.toUpperCase()}` : 'Family';
    return v.success ? `${label} ✓ (${v.tags.join(', ')})` : `${label} ✗ ${v.error}`;
  });
  if (res.unmatchedTags.length > 0) parts.push(`not in tag list: ${res.unmatchedTags.join(', ')}`);
 
  return `Tags: ${parts.join(' · ')}`;
};