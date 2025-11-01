import { getDateKey } from './date';
export const halfToHours = (v, t) => (v === t ? 0.5 : 0);
export const countMiscHours = (rows) =>
  rows.reduce(
    (m, r) =>
      m +
      (r.first?.startsWith('MISC-') ? 0.5 : 0) +
      (r.second?.startsWith('MISC-') ? 0.5 : 0),
    0
  );
export const getColor = (act) =>
  ({ Studying: '#b8eab8', Sleeping: '#add8e6', Wasted: '#ffcccb' }[act] ||
  (act?.startsWith('MISC-') ? '#fff5c0' : ''));
export const recalcTotalsOnly = (k, hData) => {
  const rows = hData[k] || [];
  let s = 0,
    sl = 0,
    w = 0;
  rows.forEach((r) => {
    s += halfToHours(r.first, 'Studying') + halfToHours(r.second, 'Studying');
    sl += halfToHours(r.first, 'Sleeping') + halfToHours(r.second, 'Sleeping');
    w += halfToHours(r.first, 'Wasted') + halfToHours(r.second, 'Wasted');
  });
  const accounted = s + sl + w + countMiscHours(rows);
  return { study: s, sleep: sl, wasted: w, accounted };
};
export const autoCalcPatterns = (k, hData) => {
  const rows =
    hData[k] ||
    Array.from({ length: 24 }, () => ({ first: null, second: null }));
  let p = [],
    prev = null;
  const sleepRange = [22, 4];
  for (let h = 0; h < 24; h++) {
    const a = rows[h].first,
      b = rows[h].second;
    const add = (x) => p.push(x);
    if (a === 'Wasted') {
      if (prev === 'MISC-GYM') add('Post Gym');
      else if (prev === 'MISC-LUNCH') add('Post Lunch');
      else if (prev === 'MISC-BREAKFAST') add('Post Breakfast');
      else if (prev === 'MISC-DINNER') add('Post Dinner');
      else if (prev === 'MISC-BREAK') add('Post BREAK');
      else if (prev === 'MISC-WOKE_UP') add('Post Wakeup');
      else if (h < sleepRange[0] || h < sleepRange[1]) add('Pre Sleep');
    }
    if (b === 'Wasted') {
      if (a === 'MISC-GYM') add('Post Gym');
      else if (a === 'MISC-LUNCH') add('Post Lunch');
      else if (a === 'MISC-BREAKFAST') add('Post Breakfast');
      else if (a === 'MISC-DINNER') add('Post Dinner');
      else if (a === 'MISC-BREAK') add('Post BREAK');
      else if (a === 'MISC-WOKE_UP') add('Post Wakeup');
      else if (h < sleepRange[0] || h < sleepRange[1]) add('Pre Sleep');
    }
    prev = b || a;
  }
  return p.filter((x, i) => p.indexOf(x) === i);
};
export const weeklyReport = (date, dailyData) => {
  const y = date.getFullYear(),
    m = date.getMonth(),
    dim = new Date(y, m + 1, 0).getDate();
  const weeks = [],
    cur = [];
  let num = 1;
  for (let d = 1; d <= dim; d++) {
    const dd = new Date(y, m, d),
      k = getDateKey(dd),
      v = dailyData[k] || { study: 0, sleep: 0, wasted: 0 };
    cur.push(v);
    if (dd.getDay() === 0 || d === dim) {
      if (cur.length) {
        const t = cur.reduce(
          (a, c) => ({
            study: a.study + (c.study || 0),
            sleep: a.sleep + (c.sleep || 0),
            wasted: a.wasted + (c.wasted || 0),
          }),
          { study: 0, sleep: 0, wasted: 0 }
        );
        weeks.push({
          weekNum: num++,
          days: cur.length,
          avgStudy: (t.study / cur.length).toFixed(2),
          avgSleep: (t.sleep / cur.length).toFixed(2),
          avgWasted: (t.wasted / cur.length).toFixed(2),
          totalStudy: t.study.toFixed(1),
          totalSleep: t.sleep.toFixed(1),
          totalWasted: t.wasted.toFixed(1),
        });
        cur.length = 0;
      }
    }
  }
  return weeks;
};
export const monthlyReport = (date, dailyData) => {
  const y = date.getFullYear(),
    m = date.getMonth(),
    dim = new Date(y, m + 1, 0).getDate();
  let t = { study: 0, sleep: 0, wasted: 0 },
    days = 0;
  for (let d = 1; d <= dim; d++) {
    const k = getDateKey(new Date(y, m, d)),
      v = dailyData[k];
    if (v) {
      t.study += v.study || 0;
      t.sleep += v.sleep || 0;
      t.wasted += v.wasted || 0;
      days++;
    }
  }
  const a = {
    study: days ? (t.study / days).toFixed(2) : 0,
    sleep: days ? (t.sleep / days).toFixed(2) : 0,
    wasted: days ? (t.wasted / days).toFixed(2) : 0,
  };
  return { totals: t, averages: a, daysTracked: days, daysInMonth: dim };
};
export const patternAnalysis = (patterns) => {
  const c = {};
  Object.values(patterns).forEach((arr) =>
    (arr || []).forEach((p) => {
      const n = (p || '').toLowerCase();
      c[n] = (c[n] || 0) + 1;
    })
  );
  return Object.entries(c)
    .sort((a, b) => b[1] - a[1])
    .map(([pattern, count]) => ({ pattern, count }));
};


