import { ChecklistMode, ChecklistTableData } from '@/entrypoints/issue.content/lib/types';

export interface PlanningResult {
  slug: string;
  customers: number;
  status: 'pending' | 'success' | 'error';
  type: 'A' | 'B';
  newsletterId: number;
  error?: string;
}

export interface PlanningModalProps {
  issueId: number;
  mode: ChecklistMode | undefined;
  chdeId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
  tableData?: ChecklistTableData | null;
  isABTesting?: boolean;
  allowSelection?: boolean;
}

export interface PlanningEntry {
  slug: string;
  type: 'A' | 'B';
  newsletterId: number;
  shopId: number;
  username: string;
}

export interface SendToSpamParams {
  usernameReg: string; // e.g., "Beliani FR" or "Beliani PT"
  shopId: number; // e.g., 7 for Beliani.fr
  newsletterIds: number[]; // e.g., 43085
  newsletterSlug: string;
  isABTest?: boolean;
}