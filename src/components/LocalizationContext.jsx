import React, { createContext, useContext, useState, useEffect } from 'react';

const LocalizationContext = createContext();

// Country configurations with currency, timezone, and language defaults
const COUNTRY_CONFIG = {
  PT: {
    code: 'PT',
    name: 'Portugal',
    currency: 'EUR',
    currencySymbol: '€',
    defaultLanguage: 'pt',
    timezone: 'Europe/Lisbon',
    phonePrefix: '+351',
    dateFormat: 'dd/MM/yyyy',
    distanceUnit: 'km'
  },
  ES: {
    code: 'ES',
    name: 'España',
    currency: 'EUR',
    currencySymbol: '€',
    defaultLanguage: 'es',
    timezone: 'Europe/Madrid',
    phonePrefix: '+34',
    dateFormat: 'dd/MM/yyyy',
    distanceUnit: 'km'
  },
  FR: {
    code: 'FR',
    name: 'France',
    currency: 'EUR',
    currencySymbol: '€',
    defaultLanguage: 'fr',
    timezone: 'Europe/Paris',
    phonePrefix: '+33',
    dateFormat: 'dd/MM/yyyy',
    distanceUnit: 'km'
  },
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    defaultLanguage: 'en',
    timezone: 'Europe/London',
    phonePrefix: '+44',
    dateFormat: 'dd/MM/yyyy',
    distanceUnit: 'mi'
  },
  DE: {
    code: 'DE',
    name: 'Deutschland',
    currency: 'EUR',
    currencySymbol: '€',
    defaultLanguage: 'de',
    timezone: 'Europe/Berlin',
    phonePrefix: '+49',
    dateFormat: 'dd.MM.yyyy',
    distanceUnit: 'km'
  },
  IT: {
    code: 'IT',
    name: 'Italia',
    currency: 'EUR',
    currencySymbol: '€',
    defaultLanguage: 'it',
    timezone: 'Europe/Rome',
    phonePrefix: '+39',
    dateFormat: 'dd/MM/yyyy',
    distanceUnit: 'km'
  },
  BR: {
    code: 'BR',
    name: 'Brasil',
    currency: 'BRL',
    currencySymbol: 'R$',
    defaultLanguage: 'pt',
    timezone: 'America/Sao_Paulo',
    phonePrefix: '+55',
    dateFormat: 'dd/MM/yyyy',
    distanceUnit: 'km'
  },
  US: {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    defaultLanguage: 'en',
    timezone: 'America/New_York',
    phonePrefix: '+1',
    dateFormat: 'MM/dd/yyyy',
    distanceUnit: 'mi'
  }
};

// Currency exchange rates (base: EUR) - should be updated via API in production
// Fallback rates used when API is unavailable
const FALLBACK_EXCHANGE_RATES = {
  EUR: 1,
  GBP: 0.86,
  USD: 1.10
};

const RATES_CACHE_KEY = 'pawcao_exchange_rates';
const RATES_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getCachedRates() {
  try {
    const cached = localStorage.getItem(RATES_CACHE_KEY);
    if (!cached) return null;
    const { rates, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > RATES_CACHE_TTL) return null;
    // Only keep known currencies (filters out currencies no longer supported)
    const ALLOWED = { EUR: 1, GBP: 1, USD: 1, BRL: 1 };
    const cleaned = {};
    for (const k of Object.keys(rates)) {
      if (ALLOWED[k]) cleaned[k] = rates[k];
    }
    return Object.keys(cleaned).length > 0 ? cleaned : null;
  } catch {
    return null;
  }
}

function setCachedRates(rates) {
  try {
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({ rates, timestamp: Date.now() }));
  } catch { /* localStorage full or unavailable */ }
}

let ratesPromise = null;

async function fetchExchangeRates() {
  // Deduplicate concurrent calls
  if (ratesPromise) return ratesPromise;

  ratesPromise = (async () => {
    const cached = getCachedRates();
    if (cached) return cached;

    try {
      // Taxas diárias com base no EUR (gratuito, sem chave de API)
      const res = await fetch('https://open.er-api.com/v6/latest/EUR', {
        signal: AbortSignal.timeout(5000)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.rates) {
        const rates = { EUR: 1, ...data.rates };
        setCachedRates(rates);
        return rates;
      }
    } catch {
      // API unavailable — fall through to fallback
    }

    return FALLBACK_EXCHANGE_RATES;
  })();

  const result = await ratesPromise;
  ratesPromise = null;
  return result;
}

// Synchronous accessor — returns cached or fallback (never blocks render)
let EXCHANGE_RATES = getCachedRates() || FALLBACK_EXCHANGE_RATES;

// Async refresh in background (updates EXCHANGE_RATES for next render)
fetchExchangeRates().then(rates => { EXCHANGE_RATES = rates; });

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    return {
      country: COUNTRY_CONFIG.PT,
      userLocation: null,
      setCountry: () => {},
      formatCurrency: (amount) => `€${amount?.toFixed(2) || '0.00'}`,
      convertCurrency: (amount) => Number(amount) || 0,
      formatDate: (date) => date,
      formatTime: (time) => time,
      convertToLocalTime: (date) => date,
      getLocalTimezone: () => 'Europe/Lisbon',
      isLoading: false
    };
  }
  return context;
};

export const LocalizationProvider = ({ children }) => {
  const [country, setCountryState] = useState(COUNTRY_CONFIG.PT);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  // Taxas em estado para que os preços se atualizem quando o câmbio chega
  const [exchangeRates, setExchangeRates] = useState(() => getCachedRates() || FALLBACK_EXCHANGE_RATES);

  useEffect(() => {
    let active = true;
    fetchExchangeRates().then((rates) => {
      if (!active) return;
      EXCHANGE_RATES = rates;
      setExchangeRates(rates);
    });
    return () => { active = false; };
  }, []);

  // Detect user's country from browser/IP on mount
  useEffect(() => {
    const detectLocation = async () => {
      setIsLoading(true);
      
      // 1. Check localStorage for saved preference
      const savedCountry = localStorage.getItem('pawcao_country');
      if (savedCountry && COUNTRY_CONFIG[savedCountry]) {
        setCountryState(COUNTRY_CONFIG[savedCountry]);
        setIsLoading(false);
        return;
      }
      // Clear stale preference for countries that are no longer supported
      if (savedCountry && !COUNTRY_CONFIG[savedCountry]) {
        localStorage.removeItem('pawcao_country');
        localStorage.removeItem('pawcao_exchange_rates');
      }

      // 2. Try browser geolocation API
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });
            
            // Reverse geocode to get country
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
              );
              const data = await response.json();
              const countryCode = data.address?.country_code?.toUpperCase();
              
              if (countryCode && COUNTRY_CONFIG[countryCode]) {
                setCountryState(COUNTRY_CONFIG[countryCode]);
                localStorage.setItem('pawcao_country', countryCode);
              }
            } catch (e) {
              console.error('Reverse geocoding failed:', e);
            }
            setIsLoading(false);
          },
          async (error) => {
            console.warn('Geolocation denied:', error.message);
            // 3. Fallback to IP-based geolocation
            try {
              const response = await fetch('https://ipapi.co/json/');
              const data = await response.json();
              const countryCode = data.country_code;
              
              if (countryCode && COUNTRY_CONFIG[countryCode]) {
                setCountryState(COUNTRY_CONFIG[countryCode]);
                localStorage.setItem('pawcao_country', countryCode);
              }
              
              if (data.latitude && data.longitude) {
                setUserLocation({ lat: data.latitude, lng: data.longitude });
              }
            } catch (e) {
              console.error('IP geolocation failed:', e);
            }
            setIsLoading(false);
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 86400000 }
        );
      } else {
        // No geolocation support, try IP
        try {
          const response = await fetch('https://ipapi.co/json/');
          const data = await response.json();
          const countryCode = data.country_code;
          
          if (countryCode && COUNTRY_CONFIG[countryCode]) {
            setCountryState(COUNTRY_CONFIG[countryCode]);
            localStorage.setItem('pawcao_country', countryCode);
          }
        } catch (e) {
          console.error('IP geolocation failed:', e);
        }
        setIsLoading(false);
      }
    };

    detectLocation();
  }, []);

  // Manual country setter
  const setCountry = (countryCode) => {
    if (COUNTRY_CONFIG[countryCode]) {
      setCountryState(COUNTRY_CONFIG[countryCode]);
      localStorage.setItem('pawcao_country', countryCode);
    }
  };

  // Convert an amount between currencies. Returns null when the rate is unknown
  // (never fabricates a converted value).
  const convertCurrency = (amount, fromCurrency = 'EUR', toCurrency = country.currency) => {
    const value = Number(amount) || 0;
    if (!fromCurrency || fromCurrency === toCurrency) return value;
    const rateFrom = exchangeRates[fromCurrency];
    const rateTo = exchangeRates[toCurrency];
    if (!rateFrom || !rateTo) return null;
    return (value / rateFrom) * rateTo;
  };

  const formatInCurrency = (value, currency) => {
    const locale = currency === 'BRL' ? 'pt-BR' : country.defaultLanguage;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(Number(value) || 0);
  };

  // Format currency based on country. Without an exchange rate for the target
  // currency, the amount is shown in its own currency instead of a wrong value.
  const formatCurrency = (amount, fromCurrency = 'EUR') => {
    const convertedAmount = convertCurrency(amount, fromCurrency, country.currency);
    if (convertedAmount === null) return formatInCurrency(amount, fromCurrency);
    return formatInCurrency(convertedAmount, country.currency);
  };

  // Format date based on country
  const formatDate = (date, options = {}) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return new Intl.DateTimeFormat(country.defaultLanguage, {
      timeZone: country.timezone,
      dateStyle: options.dateStyle || 'medium',
      ...options
    }).format(dateObj);
  };

  // Format time based on country timezone
  const formatTime = (time, date = new Date()) => {
    if (!time) return '';
    
    // If time is a string like "09:00", create a full date
    if (typeof time === 'string' && time.includes(':')) {
      const [hours, minutes] = time.split(':');
      const dateObj = new Date(date);
      dateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      return new Intl.DateTimeFormat(country.defaultLanguage, {
        timeZone: country.timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: country.code === 'US' || country.code === 'GB'
      }).format(dateObj);
    }
    
    return time;
  };

  // Convert UTC time to local timezone
  const convertToLocalTime = (utcDate) => {
    if (!utcDate) return null;
    const dateObj = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
    
    return new Date(dateObj.toLocaleString('en-US', { timeZone: country.timezone }));
  };

  // Get user's local timezone
  const getLocalTimezone = () => country.timezone;

  // Calculate distance in appropriate unit
  const formatDistance = (distanceKm) => {
    if (country.distanceUnit === 'mi') {
      const miles = distanceKm * 0.621371;
      return `${miles.toFixed(1)} mi`;
    }
    return `${distanceKm.toFixed(1)} km`;
  };

  // Get payment deadline in local time
  const getPaymentDeadline = (walkDate, walkTime, hoursBeforeDefault = 24) => {
    if (!walkDate || !walkTime) return null;
    
    const walkDateTime = new Date(`${walkDate}T${walkTime.split(' ')[0] || walkTime}:00`);
    const deadline = new Date(walkDateTime.getTime() - (hoursBeforeDefault * 60 * 60 * 1000));
    
    return {
      date: deadline,
      formatted: formatDate(deadline, { dateStyle: 'full' }),
      time: formatTime(deadline.toTimeString().slice(0, 5), deadline),
      isExpired: new Date() >= deadline
    };
  };

  const value = {
    country,
    userLocation,
    setCountry,
    formatCurrency,
    convertCurrency,
    formatDate,
    formatTime,
    convertToLocalTime,
    getLocalTimezone,
    formatDistance,
    getPaymentDeadline,
    isLoading,
    locationError,
    availableCountries: Object.values(COUNTRY_CONFIG)
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};

export { COUNTRY_CONFIG, EXCHANGE_RATES };