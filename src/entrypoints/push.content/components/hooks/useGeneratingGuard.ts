import { useCallback, useEffect, useRef, useState } from 'react';
import { showErrorAlert } from '../Alerts';

/**
 * Guards against concurrent generation and provides a safety timeout.
 * Uses a ref for race-condition-safe checks without forcing re-renders.
 */
export function useGeneratingGuard(timeoutMs = 60_000) {
  const [isGenerating, setIsGenerating] = useState(false);
  const isGeneratingRef = useRef(false);

  useEffect(() => {
    if (!isGenerating) return;

    const timeoutId = setTimeout(() => {
      if (isGeneratingRef.current) {
        console.warn(`Warning: Generation timeout after ${timeoutMs / 1000}s`);
        isGeneratingRef.current = false;
        setIsGenerating(false);
        showErrorAlert(`Generation timed out after ${timeoutMs / 1000} seconds. Please try again.`);
      }
    }, timeoutMs);

    return () => clearTimeout(timeoutId);
  }, [isGenerating, timeoutMs]);

  const startGenerating = useCallback(() => {
    if (isGeneratingRef.current) return false;
    isGeneratingRef.current = true;
    setIsGenerating(true);
    return true;
  }, []);

  const stopGenerating = useCallback(() => {
    isGeneratingRef.current = false;
    setIsGenerating(false);
  }, []);

  const isBusy = useCallback(() => isGeneratingRef.current, []);

  return {
    isGenerating,
    isGeneratingRef,
    startGenerating,
    stopGenerating,
    isBusy,
  };
}
