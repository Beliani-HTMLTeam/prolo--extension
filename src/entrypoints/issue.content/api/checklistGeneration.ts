import axios from 'axios';
import { fetchChecklists } from './checklists';
import { LP_CHECKPOINT_TEMPLATES, NEWSLETTER_SHOP_ORDER } from '../lib/shopConfig';
import { CHECKLIST_TITLES } from '../lib/checklistTitles';

export type GenerateChecklistPayload = {
  startId: string;
  mode: 'newsletter' | 'lp';
};

export type ChecklistGenerationResult = {
  checklistId: string;
  checklistTitle: string;
};

const REQUEST_DELAY_MS = 200;
const PROLO_BASE_URL = 'https://www.prologistics.info';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const normalizeTitle = (title: string) => title.trim().toLowerCase();

type GeneratedCheckpointItem = {
  slug: string;
  url: string;
};

const buildGeneratedCheckpointItems = (startId: string, mode: 'newsletter' | 'lp'): GeneratedCheckpointItem[] => {
  const startNumericId = Number(startId);
  if (!Number.isFinite(startNumericId)) {
    throw new Error('Start ID must be a number.');
  }

  const items: GeneratedCheckpointItem[] = [];
  let currentId = startNumericId;

  if (mode === 'newsletter') {
    for (const slug of NEWSLETTER_SHOP_ORDER) {
      items.push({
        slug,
        url: `${PROLO_BASE_URL}/news_email.php?id=${currentId}`,
      });
      currentId += 1;
    }
  }

  if (mode === 'lp') {
    for (const item of LP_CHECKPOINT_TEMPLATES) {
      items.push({
        slug: item.slug,
        url: `${PROLO_BASE_URL}/shop_content.php?id=${currentId}&shop_id=${item.shopId}`,
      });
      currentId += 1;
    }
  }

  return items;
};

const createChecklist = async (issueId: number): Promise<void> => {
  const baseUrl = window.location.origin;
  const apiUrl = `${baseUrl}/api/issueLog/saveChecklist/?issue_id=${issueId}&checklist_id=0&ordering=0`;

  try {
    await axios.post(apiUrl);
  } catch (error) {
    console.error('Failed to create checklist:', error);
    throw error;
  }
};

const resolveCreatedChecklistId = async (issueId: number, existingIds: Set<string>): Promise<string> => {
  const latest = await fetchChecklists(issueId);
  const newChecklist = latest.checklists.find(cl => !existingIds.has(cl.id));

  if (newChecklist?.id && newChecklist.id !== '0') {
    return newChecklist.id;
  }

  throw new Error('Could not resolve created checklist ID from /checklist response.');
};

const removeChecklist = async (issueId: number, checklistId: string): Promise<void> => {
  const baseUrl = window.location.origin;
  const apiUrl = `${baseUrl}/api/issueLog/removeChecklist/?issue_id=${issueId}&checklist_id=${checklistId}`;

  try {
    await axios.post(apiUrl);
  } catch (error) {
    console.error('Failed to remove checklist:', error);
    throw error;
  }
};

const updateChecklistTitle = async (issueId: number, checklistId: string, title: string): Promise<void> => {
  const baseUrl = window.location.origin;
  const encodedTitle = encodeURIComponent(title);
  const apiUrl = `${baseUrl}/api/issueLog/saveChecklistTitle/?issue_id=${issueId}&checklist_id=${checklistId}&checklist_title=${encodedTitle}`;

  try {
    await axios.post(apiUrl);
  } catch (error) {
    console.error('Failed to update checklist title:', error);
    throw error;
  }
};

// @deprecated - prolo disabled batch checkpoint creation,  keeping this function in case it's re-enabled in the future
const saveCheckpoints = async (
  issueId: number,
  checklistId: string,
  items: Array<{ slug: string; url: string }>,
): Promise<void> => {
  const baseUrl = window.location.origin;
  const params = new URLSearchParams();
  params.append('issue_id', String(issueId));
  params.append('checklist_id', checklistId);
  params.append('checkpoint_id', '0');

  items.forEach((item, index) => {
    const description = `${item.slug}\t${item.url}`;
    params.append(`checkpoints[${index}][description]`, description);
  });

  const apiUrl = `${baseUrl}/api/issueLog/saveCheckpoint/?${params.toString()}`;

  try {
    await axios.post(apiUrl);
  } catch (error) {
    console.error('Failed to save checkpoints:', error);
    throw error;
  }
};

const saveCheckpointsSeparately = async (
  issueId: number,
  checklistId: string,
  items: Array<{ slug: string; url: string }>,
): Promise<void> => {
  const baseUrl = window.location.origin;
  const apiUrl = `${baseUrl}/api/issueLog/saveCheckpoint/`;

  for (const item of items) {
    const formData = new FormData();
    formData.append('issue_id', String(issueId));
    formData.append('checklist_id', checklistId);
    formData.append('checkpoint_id', '0');
    formData.append('description', `${item.slug}\t${item.url}`);

    try {
      await axios.post(apiUrl, formData);
      await delay(REQUEST_DELAY_MS);
    } catch (error) {
      console.error(`Failed to save checkpoint for ${item.slug}:`, error);
      throw error;
    }
  }
};

export const generateChecklist = async (
  issueId: number,
  payload: GenerateChecklistPayload,
): Promise<ChecklistGenerationResult> => {
  const { startId, mode } = payload;

  const checklistTitle =
    mode === 'newsletter' ? CHECKLIST_TITLES.NEWSLETTER_TESTING_APPROVED : CHECKLIST_TITLES.LPS_APPROVED;
  const checkpointItems = buildGeneratedCheckpointItems(startId, mode);

  const current = await fetchChecklists(issueId);
  const targetNormalized = normalizeTitle(checklistTitle);
  const toDelete = current.checklists.filter(
    cl => normalizeTitle(cl.title) === targetNormalized && (cl.checkpoints?.length ?? 0) === 1,
  );

  for (const checklist of toDelete) {
    await removeChecklist(issueId, checklist.id);
    await delay(REQUEST_DELAY_MS);
  }

  const beforeCreate = await fetchChecklists(issueId);
  const existingIds = new Set(beforeCreate.checklists.map(cl => cl.id));

  await createChecklist(issueId);
  await delay(REQUEST_DELAY_MS);

  const checklistId = await resolveCreatedChecklistId(issueId, existingIds);
  await delay(REQUEST_DELAY_MS);

  await updateChecklistTitle(issueId, checklistId, checklistTitle);

  await delay(REQUEST_DELAY_MS);
  await saveCheckpoints(issueId, checklistId, checkpointItems);

  return {
    checklistId,
    checklistTitle,
  };
};
