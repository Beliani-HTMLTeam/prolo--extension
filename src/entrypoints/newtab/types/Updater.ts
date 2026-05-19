import { ChecklistTableData, ChecklistTableRow } from "@/entrypoints/issue.content/lib/types";

export interface UpdaterProps {
  rows: ChecklistTableRow[];
  issueId: number;
  onClose: () => void;
}

export interface UpdaterButtonProps {
  isPrimary: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon?: string;
  label: string;
};

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
};

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