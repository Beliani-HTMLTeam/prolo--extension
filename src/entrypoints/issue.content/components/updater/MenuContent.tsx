import { MenuContentProps } from "@/entrypoints/issue.content/types/Updater";
import { DateSection } from "./DateSection";
import { LPSection } from "./LPSection";
import { MenuSkeleton } from "./MenuSkeleton";
import UpdaterButtons from "./UpdaterButtons";

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
   onVerify,
  verifying = false,
  hasVerified = false,
  verifyProgress = { completed: 0, total: 0 },
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
        onVerify={onVerify}
        verifying={verifying}
        hasVerified={hasVerified}
        verifyProgress={verifyProgress}
      />
    </>
  )
}
