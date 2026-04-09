import { useState, useCallback } from 'react';

/**
 * Hook to preserve tab/page state (scroll position, pagination, etc.) when navigating away and back
 * Stores state in sessionStorage so it persists during tab navigation but clears on page refresh
 */
export function useTabState(tabKey, initialState = {}) {
  const [state, setState] = useState(() => {
    try {
      const stored = sessionStorage.getItem(`tabState_${tabKey}`);
      return stored ? JSON.parse(stored) : initialState;
    } catch {
      return initialState;
    }
  });

  const saveState = useCallback((newState) => {
    try {
      const merged = { ...state, ...newState };
      sessionStorage.setItem(`tabState_${tabKey}`, JSON.stringify(merged));
      setState(merged);
    } catch (e) {
      console.error('Failed to save tab state:', e);
    }
  }, [tabKey, state]);

  const clearState = useCallback(() => {
    try {
      sessionStorage.removeItem(`tabState_${tabKey}`);
      setState(initialState);
    } catch (e) {
      console.error('Failed to clear tab state:', e);
    }
  }, [tabKey, initialState]);

  return { state, saveState, clearState };
}