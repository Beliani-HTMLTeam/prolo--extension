import { LineTitleTranslations } from "../../lib/types";
import { DateSection } from "./DateSection";
import { LPSection } from "./LPSection";
import { MenuSkeleton } from "./MenuSkeleton";
import UpdaterButtons from "./UpdaterButtons";

interface MenuContentProps {
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
}

export const MenuContent = ({
  loading,
  useGlobalDate,
  useGlobalLP,
  globalDateConfig,
  globalLP,
  selectedSLCount,
  selectedPTCount,
  isUpdating,
  onToggleGlobalDate,
  onActivateDateChange,
  onDeactivateDateChange,
  onToggleGlobalLP,
  onGlobalLPChange,
  onUpdateAllSL,
  onUpdateSelectedSL,
  onUpdateAllPT,
  onUpdateSelectedPT,
  onUpdateAll,
  onUpdateSelected,
  onSelectAll,
  onClearAll,
  onCancel,
}: MenuContentProps) => {
  if (loading) {
    return <MenuSkeleton />;
  }

  return (
    <>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
       <DateSection
          loading={loading}
          useGlobalDate={useGlobalDate}
          globalDateConfig={globalDateConfig}
          onToggleGlobalDate={onToggleGlobalDate}
          onActivateDateChange={onActivateDateChange}
          onDeactivateDateChange={onDeactivateDateChange}
        />
        <LPSection
          loading={loading}
          useGlobalLP={useGlobalLP}
          globalLP={globalLP}
          onToggleGlobalLP={onToggleGlobalLP}
          onGlobalLPChange={onGlobalLPChange}
        />
    </div>
      <UpdaterButtons
        updateStarted={isUpdating}
        selectedSLCount={selectedSLCount}
        selectedPTCount={selectedPTCount}
        onUpdateAllSL={onUpdateAllSL}
        onUpdateSelectedSL={onUpdateSelectedSL}
        onUpdateAllPT={onUpdateAllPT}
        onUpdateSelectedPT={onUpdateSelectedPT}
        onUpdateAll={onUpdateAll}
        onUpdateSelected={onUpdateSelected}
        onSelectAll={onSelectAll}
        onClearAll={onClearAll}
        onCancel={onCancel}
      />
    </>
  )
}
