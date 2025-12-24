import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Google Analytics event tracking
export const trackEvent = (category, action, label = '', value = 0) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
};

// Track page views automatically
export function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_title: document.title
      });
    }
  }, [location]);

  return null;
}

// Preset event trackers
export const analytics = {
  // User actions
  userLogin: (userId) => trackEvent('User', 'login', userId),
  userSignup: (userId) => trackEvent('User', 'signup', userId),
  
  // Bookings
  bookingStarted: (walkerId) => trackEvent('Booking', 'started', walkerId),
  bookingCompleted: (bookingId, amount) => trackEvent('Booking', 'completed', bookingId, amount),
  bookingCancelled: (bookingId) => trackEvent('Booking', 'cancelled', bookingId),
  
  // Search & Discovery
  searchPerformed: (query) => trackEvent('Search', 'query', query),
  filterApplied: (filterType) => trackEvent('Search', 'filter', filterType),
  walkerViewed: (walkerId) => trackEvent('Discovery', 'walker_view', walkerId),
  
  // Favorites
  walkerFavorited: (walkerId) => trackEvent('Engagement', 'favorite_add', walkerId),
  walkerUnfavorited: (walkerId) => trackEvent('Engagement', 'favorite_remove', walkerId),
  
  // Reviews
  reviewSubmitted: (walkerId, rating) => trackEvent('Review', 'submitted', walkerId, rating),
  
  // Subscriptions
  subscriptionStarted: (planType) => trackEvent('Subscription', 'started', planType),
  subscriptionCancelled: (planType) => trackEvent('Subscription', 'cancelled', planType),
  
  // Shop
  productViewed: (productId) => trackEvent('Shop', 'product_view', productId),
  productPurchased: (productId, amount) => trackEvent('Shop', 'purchase', productId, amount),
  
  // Emergency
  emergencyPosted: (walkId) => trackEvent('Emergency', 'posted', walkId),
  emergencyAccepted: (walkId) => trackEvent('Emergency', 'accepted', walkId),
};

export default AnalyticsTracker;