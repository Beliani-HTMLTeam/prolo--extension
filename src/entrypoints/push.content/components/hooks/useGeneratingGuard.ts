import { useEffect, useRef, useState } from 'react';

export function useGeneratingGuard(timeoutMs: number = 60000) {
  const [isGenerating, setIsGenerating] = useState(false);
  const isGeneratingRef = useRef(false);

  useEffect(() => {
    if (!isGenerating) return;

    const timeoutId = setTimeout(() => {
      if (isGeneratingRef.current) {
        console.warn('Generation timeout after', timeoutMs / 1000, 's');
        isGeneratingRef.current = false;
        setIsGenerating(false);
      }
    }, timeoutMs);

    return () => clearTimeout(timeoutId);
  }, [isGenerating, timeoutMs]);

  const startGenerating = () => {
    if (isGeneratingRef.current) {
      console.warn('Already generating, ignoring start');
      return false;
    }
    isGeneratingRef.current = true;
    setIsGenerating(true);
    return true;
  };

  const stopGenerating = () => {
    isGeneratingRef.current = false;
    setIsGenerating(false);
  };

  const isBusy = () => isGeneratingRef.current;

  return {
    isGenerating,
    setIsGenerating,
    isGeneratingRef,
    startGenerating,
    stopGenerating,
    isBusy,
  };
}