// Google Ads conversion tracking — send_to values come from the app's Google Ads account.
// The gtag bootstrap lives at module scope in src/Layout.jsx.

export const GADS_SEND_TO = {
  purchase: 'AW-18551959554/iB7mCMOM0rAdEILgoY5F',
  signup: 'AW-18551959554/jl-0COGw0bAdEILgoY5F',
  contact: 'AW-18551959554/KPdKCO6KyrAdEILgoY5F',
  subscribe: 'AW-18551959554/mLkbCJKy0bAdEILgoY5F',
};

export function trackConversion(sendTo, params = {}) {
  if (typeof window === 'undefined' || !window.gtag) return false;
  window.gtag('event', 'conversion', { send_to: sendTo, ...params });
  return true;
}

// Fires at most once per browser session for a given key (e.g. a specific order),
// so re-renders and retries never double-count a conversion.
export function trackConversionOnce(key, sendTo, params = {}) {
  if (typeof window === 'undefined') return;
  try {
    if (sessionStorage.getItem(key)) return;
  } catch (_e) {
    // storage unavailable — fall through and fire
  }
  const fired = trackConversion(sendTo, params);
  if (fired) {
    try {
      sessionStorage.setItem(key, '1');
    } catch (_e) {
      // ignore
    }
  }
}