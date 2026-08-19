import { Dispatch, SetStateAction } from 'react';

export type StoredCampaign = {
  id: number;
  title: string;
  data: Record<string, Record<string, string>>;
};

export type CustomImageState = {
  enabled: boolean;
  url: string;
  isEditing: boolean;
};

export type CustomFieldState = {
  value: string;
  isEditing: boolean;
};

export type CampaignActionsProps = {
  isRandomTesting: boolean;
  isSendingAll: boolean;
  hasCampaignData: boolean;
  testProgress?: { current: number; total: number } | null;
  sendAllProgress?: { current: number; total: number } | null;
  activeSlug?: string | null;
  onTest3Random: () => void;
  onSendAll: () => void;
};

export type UseGenerateCampaignProps = {
  campaignName: string;
  chdeTemplateId: string;
  selectedSlugs: string[];
  fetchTranslations: (name: string) => Promise<any>;
  checkCampaignNameDate: (name: string) => any;
  applyOverridesToData: (data: Record<string, Record<string, string>>) => Record<string, Record<string, string>>;
  generating: {
    isGenerating: boolean;
    setIsGenerating: (value: boolean) => void;
  };
  setCampaign: (campaign: StoredCampaign | null) => void;
  setActiveSlug: (slug: string | null) => void;
  bumpVersion: () => void;
  useOldNewsletterFamily?: boolean;
  oldNewsletterFamilyIds?: Record<string, string>;
  onShowSuccess?: (title: string, message: string) => Promise<void>;
};

export type BigImagePreviewProps = {
  src: string | null;
  alt: string;
  onClose: () => void;
};

export type CampaignSelectorProps = {
  campaignName: string;
  availableTabs: string[];
  isLoadingTabs?: boolean;
  isLoadingTranslations?: boolean;
  dateWarning?: string | null;
  onSetCampaignName: (name: string) => void;
};

export type CampaignRowData = {
  [selector: string]: string;
};

export type CustomImage = { enabled: boolean; url: string; isEditing: boolean };
export type CustomTemplate = { value: string; isEditing: boolean };
export type CustomLpPath = { value: string; isEditing: boolean };

export type CampaignTableProps = {
  campaign: StoredCampaign | null;
  activeSlug: string | null;
  busySlug: string | null;
  isRandomTesting: boolean;
  isSendingAll: boolean;
  campaignName: string;
  customImages: Record<string, CustomImage>;
  customTemplates: Record<string, CustomTemplate>;
  customLpPaths: Record<string, CustomLpPath>;
  onToggleCustomImage: (slug: string) => void;
  onUpdateCustomImageUrl: (slug: string, url: string) => void;
  onSaveCustomImage: (slug: string, url?: string) => void;
  onToggleCustomTemplate: (slug: string) => void;
  onUpdateCustomTemplateValue: (slug: string, value: string) => void;
  onSaveCustomTemplate: (slug: string) => void;
  onToggleCustomLpPath: (slug: string) => void;
  onUpdateCustomLpPath: (slug: string, value: string) => void;
  onSaveCustomLpPath: (slug: string, value?: string) => void;
  onSetPreviewImage: Dispatch<SetStateAction<{ src: string; alt: string } | null>>;
  onTestRow: (slug: string) => void;
  onSendRow: (slug: string) => void;
};

export type ChdeTemplateInputProps = {
  chdeTemplateId: string;
  isGenerating?: boolean;
  isLoadingTranslations?: boolean;
  campaignName?: string;
  onSetChdeTemplateId: (id: string) => void;
  onGenerateAll: () => void;
  customTemplates?: Record<string, { value: string; isEditing: boolean }>;
  onToggleCustomTemplate?: (slug: string) => void;
  onUpdateCustomTemplateValue?: (slug: string, value: string) => void;
  onSaveCustomTemplate?: (slug: string) => void;
  onAddCustomTemplate?: (slug: string, value: string) => void;
  onRemoveCustomTemplate?: (slug: string) => void;
};

export type ConfirmationDialogProps = {
  isOpen: boolean;
  slug: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export type DashboardContentProps = {
  visible: boolean;
  campaign: StoredCampaign | null;
  campaignVersion?: number;
  activeSlug: string | null;
  busySlug: string | null;
  isRandomTesting: boolean;
  isSendingAll: boolean;
  campaignName: string;
  chdeTemplateId: string;
  pushTranslations: unknown;
  selectedSlugs: string[];
  previewImage: { src: string; alt: string } | null;
  customImages: Record<string, CustomImage>;
  customTemplates: Record<string, CustomTemplate>;
  customLpPaths: Record<string, CustomLpPath>;
  dateWarning?: string | null;
  isLoadingTranslations?: boolean;
  isGenerating?: boolean;
  isLoadingTabs?: boolean;
  availableTabs?: string[];
  onHideOverlay: () => void;
  onSetCampaignName: (name: string) => void;
  onSetChdeTemplateId: (id: string) => void;
  onGenerateAll: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleSlug: (slug: string) => void;
  onSetPreviewImage: Dispatch<SetStateAction<{ src: string; alt: string } | null>>;
  onToggleCustomImage: (slug: string) => void;
  onUpdateCustomImageUrl: (slug: string, url: string) => void;
  onSaveCustomImage: (slug: string) => void;
  onToggleCustomTemplate: (slug: string) => void;
  onUpdateCustomTemplateValue: (slug: string, value: string) => void;
  onSaveCustomTemplate: (slug: string) => void;
  onToggleCustomLpPath: (slug: string) => void;
  onUpdateCustomLpPath: (slug: string, value: string) => void;
  onSaveCustomLpPath: (slug: string) => void;
  onTest3Random: () => void;
  onSendAll: () => void;
  onTestRow: (slug: string) => void;
  onSendRow: (slug: string) => void;
  testProgress?: { current: number; total: number } | null;
  sendAllProgress?: { current: number; total: number } | null;
  onAddCustomTemplate: (slug: string, value: string) => void;
  onRemoveCustomTemplate: (slug: string) => void;
  confirmation?: {
    isOpen: boolean;
    slug: string | null;
    onConfirm: (() => void) | null;
    onCancel: (() => void) | null;
  };
  closeConfirmation?: () => void;
  success?: { isOpen: boolean; title: string; message: string; onClose: () => void };
  closeSuccess?: () => void;
  useOldNewsletterFamily?: boolean;
  oldNewsletterFamilyIds?: Record<string, string>;
  onUseOldNewsletterFamily?: (useOld: boolean) => void;
  onOldNewsletterIdsChange?: (ids: Record<string, string>) => void;
};

export type EmptyStateProps = {
  isGenerating?: boolean;
  isLoadingTranslations?: boolean;
};

export type FooterInfoProps = {
  totalRows: number;
  campaignTitle: string;
};

export type ImagePreviewProps = {
  src: string;
  alt: string;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
};

export type MainContentProps = {
  campaign: any;
  campaignVersion: number;
  activeSlug: string | null;
  busySlug: string | null;
  isRandomTesting: boolean;
  isSendingAll: boolean;
  isGenerating?: boolean;
  isLoadingTranslations?: boolean;
  campaignName: string;
  testProgress?: { current: number; total: number } | null;
  sendAllProgress?: { current: number; total: number } | null;
  confirmation?: {
    isOpen: boolean;
    slug: string | null;
    onConfirm: (() => void) | null;
    onCancel: (() => void) | null;
  };
  closeConfirmation?: () => void;
  success?: { isOpen: boolean; title: string; message: string; onClose: () => void }; // Add this
  closeSuccess?: () => void;
  customImages: Record<string, any>;
  customTemplates: Record<string, any>;
  customLpPaths: Record<string, any>;
  onToggleCustomImage: (slug: string) => void;
  onUpdateCustomImageUrl: (slug: string, url: string) => void;
  onSaveCustomImage: (slug: string) => void;
  onToggleCustomTemplate: (slug: string) => void;
  onUpdateCustomTemplateValue: (slug: string, value: string) => void;
  onSaveCustomTemplate: (slug: string) => void;
  onToggleCustomLpPath: (slug: string) => void;
  onUpdateCustomLpPath: (slug: string, value: string) => void;
  onSaveCustomLpPath: (slug: string) => void;
  onSetPreviewImage: (value: any) => void;
  onTestRow: (slug: string) => void;
  onSendRow: (slug: string) => void;
  onTest3Random: () => void;
  onSendAll: () => void;
};

export type OverlayToggleButtonProps = {
  onClick: () => void;
};

export type SidebarProps = {
  campaign: any;
  campaignName: string;
  chdeTemplateId: string;
  selectedSlugs: string[];
  previewImage: { src: string; alt: string } | null;
  dateWarning?: string | null;
  isLoadingTranslations?: boolean;
  isGenerating?: boolean;
  isLoadingTabs?: boolean;
  availableTabs?: string[];
  customTemplates?: Record<string, { value: string; isEditing: boolean }>;
  oldNewsletterFamilyIds?: Record<string, string>;
  useOldNewsletterFamily?: boolean;
  onSetCampaignName: (name: string) => void;
  onSetChdeTemplateId: (id: string) => void;
  onGenerateAll: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleSlug: (slug: string) => void;
  onSetPreviewImage: (value: any) => void;
  onToggleCustomTemplate?: (slug: string) => void;
  onUpdateCustomTemplateValue?: (slug: string, value: string) => void;
  onSaveCustomTemplate?: (slug: string) => void;
  onAddCustomTemplate?: (slug: string, value: string) => void;
  onRemoveCustomTemplate?: (slug: string) => void;
  onOldNewsletterIdsChange?: (ids: Record<string, string>) => void;
  onUseOldNewsletterFamily?: (useOld: boolean) => void;
};

export type SlugSelectorProps = {
  selectedSlugs: string[];
  campaign: { data: Record<string, any> } | null;
  onToggleSlug: (slug: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
};

export type SuccessDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
};

export interface ConfirmationState {
  isOpen: boolean;
  slug: string | null;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
}

export interface SuccessState {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}
