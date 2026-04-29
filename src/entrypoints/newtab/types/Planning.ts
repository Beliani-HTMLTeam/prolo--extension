import { ChecklistMode, ChecklistTableData } from '@/entrypoints/issue.content/lib/types';

export interface PlanningResult {
  slug: string;
  customers: number;
  status: 'pending' | 'success' | 'error';
  type: 'A' | 'B';
  newsletterId: number;
  error?: string;
  subjectLine?: string;
  aggregated?: boolean;
  failed?: boolean;
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

export type SpamPlanEntry = {
  customerCount: number;
  subjectLine: string;
  newsletterId: number;
};

export type PlanningTableProps = {
  availableSlugs: string[];
  selectedSlugs: Set<string>;
  results: PlanningResult[];
  loading: boolean;
  planningStarted: boolean;
  aggregating: boolean;
  isReady: (slug: string) => boolean;
  onToggleSlug: (slug: string) => void;
  onResend: (slug: string, type: 'A' | 'B') => void;
};

export type PlanningButtonsProps = {
  loading: boolean;
  planningStarted: boolean;
  availableSlugsCount: number;
  selectedCount: number;
  hasManualSelection: boolean;
  onSendAll: () => void;
  onSendSelected: () => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onCancel: () => void;
};

export type PlanningResultsActionsProps = {
  loading: boolean;
  planningStarted: boolean;
  showResults: boolean;
  totalCustomers: number;
  aggregating: boolean;
  onCopyResults: () => void;
  onClose: () => void;
};

export type PlanningProgressProps = {
  loading: boolean;
  aggregating: boolean;
  progress: { current: number; total: number; shopsCompleted: number; totalShops: number };
};

export type StatusDisplayProps = {
  result: PlanningResult | undefined;
  planningStarted: boolean;
  slug: string;
  ready: boolean;
  loading: boolean;
  aggregating: boolean;
  selectedSlugs: Set<string>;
  onResend: (slug: string, type: 'A' | 'B') => void;
};
