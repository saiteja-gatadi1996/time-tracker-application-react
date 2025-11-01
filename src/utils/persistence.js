import { STORAGE } from './constants';
import { autoCalcPatterns, halfToHours } from './report';

function persistAll({ daily, hourly, patterns, reflections }) {
  try {
    localStorage.setItem(STORAGE.DAILY, JSON.stringify(daily));
    localStorage.setItem(STORAGE.HOURLY, JSON.stringify(hourly));
    localStorage.setItem(STORAGE.PATTERNS, JSON.stringify(patterns));
    localStorage.setItem(STORAGE.REFLECTIONS, JSON.stringify(reflections));
  } catch {}
}

function recomputeFromHourly(hourly) {
  const outDaily = {};
  const outPatterns = {};
  Object.keys(hourly || {}).forEach((k) => {
    const rows = hourly[k] || [];
    let study = 0,
      sleep = 0,
      wasted = 0;
    rows.forEach((r) => {
      study +=
        halfToHours(r.first, 'Studying') + halfToHours(r.second, 'Studying');
      sleep +=
        halfToHours(r.first, 'Sleeping') + halfToHours(r.second, 'Sleeping');
      wasted +=
        halfToHours(r.first, 'Wasted') + halfToHours(r.second, 'Wasted');
    });
    outDaily[k] = { study, sleep, wasted };
    outPatterns[k] = autoCalcPatterns(k, hourly);
  });
  return { daily: outDaily, patterns: outPatterns };
}

export { persistAll, recomputeFromHourly };
