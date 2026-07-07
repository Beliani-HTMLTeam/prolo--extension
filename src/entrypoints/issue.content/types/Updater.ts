import { ChecklistTableData, ChecklistTableRow, LineTitleTranslations } from '@/entrypoints/issue.content/lib/types';

export interface VerificationResult {
   subjectNeedsUpdate: boolean;
    pageTitleNeedsUpdate: boolean;
}
export interface UpdaterProps {
  rows: ChecklistTableRow[];
  issueId: number;
  newsletterIds?: Record<string, { aId?: string; bId?: string }>;
  landingPageIds?: Record<string, string>;
  onClose: () => void;
}

export interface UpdaterButtonProps {
  isPrimary: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon?: string;
  label: string;
}

export interface UpdaterButtonsProps {
  updateStarted: boolean;
  selectedSLCount: number;
  selectedPTCount: number;
  onUpdateAllSL: () => void;
  onUpdateSelectedSL: () => void;
  onUpdateAllPT: () => void;
  onUpdateSelectedPT: () => void;
  onUpdateAll: () => void;
  onUpdateSelected: () => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onCancel: () => void;
  onVerify: () => void;
  verifying?: boolean;
  hasVerified?: boolean;
  verifyProgress?: { completed: number; total: number };
}

export interface UpdaterSelectedItem {
  slug: string;
  type: 'subjectLine' | 'pageTitle';
  content: string;
}

export interface UpdaterDateConfig {
  activateDate: Date;
  deactivateDate: Date;
}

export interface UpdaterSlugDateConfig {
  [slug: string]: UpdaterDateConfig;
}

export interface UpdaterSlugLPConfig {
  [slug: string]: string;
}

export interface UpdateResult {
  slug: string;
  type: 'newsletter' | 'landing-page';
  success: boolean;
  status?: number;
  error?: string;
}

export interface DateSectionProps {
  loading: boolean;
  useGlobalDate: boolean;
  globalDateConfig: { activateDate: Date; deactivateDate: Date };
  onToggleGlobalDate: (checked: boolean) => void;
  onActivateDateChange: (date: Date | null) => void;
  onDeactivateDateChange: (date: Date | null) => void;
}

export interface LPSectionProps {
  loading: boolean;
  useGlobalLP: boolean;
  globalLP: string;
  onToggleGlobalLP: (checked: boolean) => void;
  onGlobalLPChange: (lp: string) => void;
}

export interface MenuContentProps {
  loading: boolean;
  useGlobalDate: boolean;
  useGlobalLP: boolean;
  globalDateConfig: { activateDate: Date; deactivateDate: Date };
  globalLP: string;
  selectedSLCount: number;
  selectedPTCount: number;
  isUpdating: boolean;
  onToggleGlobalDate: (checked: boolean) => void;
  onActivateDateChange: (date: Date | null) => void;
  onDeactivateDateChange: (date: Date | null) => void;
  onToggleGlobalLP: (checked: boolean) => void;
  onGlobalLPChange: (lp: string) => void;
  onUpdateAllSL: () => void;
  onUpdateSelectedSL: () => void;
  onUpdateAllPT: () => void;
  onUpdateSelectedPT: () => void;
  onUpdateAll: () => void;
  onUpdateSelected: () => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onCancel: () => void;
  onVerify: () => void;
  verifying?: boolean;
  hasVerified?: boolean;
  verifyProgress?: { completed: number; total: number };
}

export interface SundayButtonsProps {
  hasSelection: boolean;
  onUpdate: () => void;
  onClear: () => void;
  loading: boolean;
  isUpdating?: boolean;
}

export interface SundayTableProps {
  subjectLines: Record<number, Record<string, string>> | null;
  selectedIndex: number | null;
  onSelectOption: (index: number) => void;
  loading: boolean;
  availableSlugs?: string[];
  updatingSlugs?: Set<string>;
  updateResults?: Array<{ slug: string; success: boolean; error?: string }>;
  newsletterIds?: Record<string, { aId?: string; bId?: string }>;
  onRetry?: () => void;
}

export interface SundayTableSkeletonProps {
  rowsCount?: number;
}

export interface SundayTableUpdateSkeletonProps {
  rowsCount: number;
  availableSlugs?: string[];
}

export interface TableHeaderProps {
  useGlobalLP: boolean;
  useGlobalDates: boolean;
  allSLSlugsLength: number;
  allPTSlugsLength: number;
  allSLSelected: boolean;
  allPTSelected: boolean;
  disableSelections?: boolean;
  onSelectAllSL: (checked: boolean) => void;
  onSelectAllPT: (checked: boolean) => void;
}

export interface TableRowProps {
  slug: string;
  subjectLine: string;
  pageTitle: string;
  hasSL: boolean;
  hasPT: boolean;
  deactivateDate: Date;
  lp: string;
  fdMode: boolean;
  mdMode: boolean;
  isSLSelected: boolean;
  isPTSelected: boolean;
  loading: boolean;
  useGlobalLP: boolean;
  useGlobalDates: boolean;
  newsletterId?: { aId?: string; bId?: string };
  landingPageId?: string;
  onToggleCountry: (checked: boolean) => void;
  onToggleSL: (checked: boolean) => void;
  onTogglePT: (checked: boolean) => void;
  onFDModeChange: (checked: boolean) => void;
  onMDModeChange: (checked: boolean) => void;
  onLPChange: (value: string) => void;
  onDeactivateDateChange: (date: Date | null) => void;
  isUpdating?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  errorMessage?: string;
  getInitialActivateDate?: (slug: string) => Date;
  getInitialDeactivateDate?: (slug: string) => Date;
  getInitialLP?: (slug: string) => string;
  onSlugActivateDateChange?: (slug: string, date: Date | null, skipAutoSelect?: boolean) => void;
  onSlugDeactivateDateChange?: (slug: string, date: Date | null, skipAutoSelect?: boolean) => void;
  onSlugLPChange?: (slug: string, lp: string, skipAutoSelect?: boolean) => void;
  onSlugFMDModeChange?: (slug: string, mode: 'fd' | 'md', checked: boolean) => void;
  disableSelections?: boolean;
  verificationResult?: VerificationResult;
  verifying?: boolean;
}

export interface TableRowSkeletonProps {
  useGlobalLP: boolean;
  useGlobalDates: boolean;
  slug?: string;
}

export interface TableSkeletonProps {
  useGlobalLP: boolean;
  useGlobalDates: boolean;
  availableSlugs: string[];
  skeletonRowsCount?: number;
  showSlugs?: boolean;
}

export interface UpdateResultsProps {
  results: UpdateResult[];
  onClose: () => void;
  onRetry?: () => void;
}

export interface UpdaterTableProps {
  translations: LineTitleTranslations | null;
  loading?: boolean;
  onToggleSL?: (slug: string, checked: boolean, content: string) => void;
  onTogglePT?: (slug: string, checked: boolean, content: string) => void;
  selectedItems?: UpdaterSelectedItem[];
  useGlobalDates?: boolean;
  onSlugActivateDateChange?: (slug: string, date: Date | null, skipAutoSelect?: boolean) => void;
  onSlugDeactivateDateChange?: (slug: string, date: Date | null, skipAutoSelect?: boolean) => void;
  getDateForSlug?: (slug: string, type: 'activate' | 'deactivate') => Date;
  getLPForSlug?: (slug: string) => string;
  onSlugLPChange?: (slug: string, lp: string, skipAutoSelect?: boolean) => void;
  useGlobalLP?: boolean;
  globalLP?: string;
  initialGlobalLP?: string;
  slugFMDModes?: Record<string, { fd: boolean; md: boolean }>;
  onSlugFMDModeChange?: (slug: string, mode: 'fd' | 'md', checked: boolean) => void;
  availableSlugs?: string[];
  newsletterIds?: Record<string, { aId?: string; bId?: string }>;
  landingPageIds?: Record<string, string>;
  updatingSlugs?: Set<string>;
  updateResults?: UpdateResult[];
  getInitialActivateDate?: (slug: string) => Date;
  getInitialDeactivateDate?: (slug: string) => Date;
  getInitialLP?: (slug: string) => string;
   verificationResults?: Record<string, VerificationResult>;
  verifying?: boolean;
  hasVerified?: boolean;
}
