import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to preserve scroll position and component state when switching between tabs/routes
 * Usage: useTabState('myBookings') - automatically saves/restores scroll and state
 */
export const useTabState = (tabKey) => {
  const location = useLocation();
  const stateRef = useRef(new Map());
  const scrollRef = useRef(new Map());

  // Save scroll position before leaving
  useEffect(() => {
    return () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      scrollRef.current.set(tabKey, scrollTop);
    };
  }, [tabKey]);

  // Restore scroll position when entering
  useEffect(() => {
    const savedScroll = scrollRef.current.get(tabKey);
    if (savedScroll !== undefined) {
      setTimeout(() => {
        window.scrollTo(0, savedScroll);
      }, 0);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location, tabKey]);

  // Return state management functions
  return {
    saveState: (key, value) => {
      const tabState = stateRef.current.get(tabKey) || {};
      tabState[key] = value;
      stateRef.current.set(tabKey, tabState);
    },
    getState: (key) => {
      return stateRef.current.get(tabKey)?.[key];
    },
    clearState: () => {
      stateRef.current.delete(tabKey);
      scrollRef.current.delete(tabKey);
    }
  };
};