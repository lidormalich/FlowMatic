const HEBCAL_BASE = 'https://www.hebcal.com/hebcal';
const HEBCAL_PARAMS = {
  v: 1,
  cfg: 'json',
  maj: 'on',
  min: 'on',
  mod: 'on',
  nx: 'on',
  s: 'on',
  i: 'on',
  lg: 'h',
  geo: 'geoname',
  geonameid: 281184
};

export const fetchHebcalData = async (year, month) => {
  const params = new URLSearchParams({
    ...HEBCAL_PARAMS,
    year,
    month: month + 1 // Hebcal uses 1-indexed months
  });

  const response = await fetch(`${HEBCAL_BASE}?${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch Hebcal data');
  }

  const result = await response.json();

  // CRITICAL: Extract event.hebrew for Hebrew text, NOT event.title
  return result.items.map(item => ({
    date: item.date,
    hebrew: item.hebrew,        // USE THIS FOR DISPLAY (Hebrew text)
    title: item.title,          // English (backup only)
    category: item.category,
    time: item.title.match(/\d{2}:\d{2}/)?.[0] // Extract time if present
  }));
};

// Simple in-memory cache with 24-hour expiry
const cache = new Map();
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

export const getCachedMonth = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

export const setCachedMonth = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};
