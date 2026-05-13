export interface UpdaterProps {
  issueId: number;
  onClose: () => void;
}

export type UpdaterButtonProps = {
  isPrimary: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon?: string;
  label: string;
};

export type UpdaterButtonsProps = {
  loading: boolean;
  updateStarted: boolean;
  readyCount: number;
  selectedCount: number;
  hasManualSelection: boolean;
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

export type UpdaterSelectedItem = {
  slug: string;
  type: 'subjectLine' | 'pageTitle';
  content: string;
}