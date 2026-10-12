import { useCallback, useMemo, useState } from 'react';
import { applyCustomDate, type CustomDateProps } from '../../helpers/customDate';

/**
 * Holds the custom date that overrides the date derived from the campaign name.
 * The override belongs to one campaign: switching campaigns clears it.
 */
export function useCustomDate(campaignName: string) {
  const [customDate, setCustomDate] = useState('');
  const [dateOwner, setDateOwner] = useState(campaignName);
  const [generatedWith, setGeneratedWith] = useState<{ campaignName: string; effectiveName: string } | null>(null);

  // Clear when the campaign changes (adjusting state during render — no extra effect pass).
  if (dateOwner !== campaignName) {
    setDateOwner(campaignName);
    setCustomDate('');
  }

  const result = useMemo(() => applyCustomDate(campaignName, customDate), [campaignName, customDate]);

  const clearCustomDate = useCallback(() => setCustomDate(''), []);

  /** Call after a successful Generate All. */
  const markGenerated = useCallback((info: { campaignName: string; effectiveCampaignName: string }) => {
    setGeneratedWith({ campaignName: info.campaignName, effectiveName: info.effectiveCampaignName });
  }, []);

  const isCustomDatePending =
    generatedWith?.campaignName === campaignName && generatedWith.effectiveName !== result.name;

  const dashboardProps = useMemo<CustomDateProps>(
    () => ({
      customDate,
      effectiveCampaignName: result.name,
      isCustomDateActive: result.applied,
      isCustomDatePending,
      customDateError: result.error,
      onSetCustomDate: setCustomDate,
      onClearCustomDate: clearCustomDate,
    }),
    [customDate, result, isCustomDatePending, clearCustomDate],
  );

  return {
    customDate,
    setCustomDate,
    clearCustomDate,
    effectiveCampaignName: result.name,
    isCustomDateActive: result.applied,
    customDateError: result.error,
    isCustomDatePending,
    markGenerated,
    /** Spread onto <DashboardContent />. */
    dashboardProps,
  };
}
