import React, { useEffect, useMemo, useRef, useState } from 'react';

// ⏰ Time Tracker Application — React (JSX) version
// Goal: Preserve 100/100 functionality and UI parity with the provided HTML/JS.
// - All views: Hourly, Input, Daily, Weekly, Monthly, Yearly, Pomodoro
// - LocalStorage persistence for: dailyData, hourlyData, wastedPatterns, reflections, pomodoro state
// - Export / Import JSON
// - Calendar, reports, chips, warnings, patterns, and past-day edit lock

const CSS = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif; background-color:#f9fafb; color:#1f2937; line-height:1.5; }
  .container { margin:0 auto; padding:20px; }
  .header { background:white; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.1); padding:24px; margin-bottom:24px; }
  .title { font-size:30px; font-weight:bold; margin-bottom:16px; }
  .button-group { display:flex; flex-wrap:wrap; gap:8px; }
  .button { padding:8px 16px; border-radius:8px; border:none; cursor:pointer; transition:all .3s; font-size:14px; font-weight:500; background:#f3f4f6; color:#374151; }
  .button:hover { background:#e5e7eb; }
  .button.active { background:#3b82f6; color:white; }
  .grid-container { display:grid; grid-template-columns:4fr 2fr; gap:24px; }
  .card { background:white; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.1); padding:24px; }
  .card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
  .card-title { font-size:20px; font-weight:600; padding:10px; border-radius:8px; }
  .calendar-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; }
  .day-header { text-align:center; font-size:14px; font-weight:500; color:#6b7280; padding:8px; }
  .day-cell { padding:8px; text-align:center; cursor:pointer; border-radius:8px; transition:all .3s; min-height:40px; }
  .day-cell:hover { background:#f3f4f6; }
  .day-cell.selected { background:#3b82f6; color:white; }
  .day-cell.today { background:#dbeafe; color:#1e3a8a; }
  .day-cell.has-data { background:#f0fdf4; }
  .form-group { margin-bottom:16px; }
  .label { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:500; color:#374151; margin-bottom:8px; }
  .input { width:100%; padding:8px 12px; border:1px solid #d1d5db; border-radius:8px; font-size:14px; }
  .input:focus { outline:none; border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.1); }
  .input-group { display:flex; gap:8px; }
  .input-group .input { flex:1; }
  .pattern-chip { display:inline-flex; align-items:center; padding:4px 12px; background:#fef2f2; color:#991b1b; border-radius:20px; font-size:14px; margin:4px; }
  .pattern-chip button { margin-left:8px; background:none; border:none; color:#dc2626; font-size:18px; cursor:pointer; }
  .stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; margin-bottom:24px; }
  .stat-card { padding:16px; border-radius:8px; }
  .stat-card.blue { background:#b8eab8; }
  .stat-card.purple { background:#add8e6; }
  .stat-card.red { background:#fef2f2; }
  .stat-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; color:#6b7280; }
  .stat-value { font-size:24px; font-weight:bold; }
  .stat-value.blue { color:#3b82f6; }
  .stat-value.purple { color:#a855f7; }
  .stat-value.red { color:#ef4444; }
  .icon { width:20px; height:20px; }
  .nav-buttons { display:flex; gap:8px; }
  .icon-button { padding:12px; background:#cdeaf4; border:none; border-radius:8px; cursor:pointer; font-size:20px; }
  .icon-button:hover { background:#f3f4f6; }
  .total-info { padding-top:16px; border-top:1px solid #e5e7eb; font-size:14px; color:#6b7280; }
  .warning-text { color:#dc2626; margin-top:8px; }
  table { width:100%; border-collapse:collapse; }
  th, td { padding:8px; text-align:left; }
  th { border-bottom:2px solid #e5e7eb; font-weight:600; }
  td { border-bottom:1px solid #e5e7eb; }
  .text-center { text-align:center; }
  .week-card { border:1px solid #e5e7eb; border-radius:8px; padding:16px; margin-bottom:16px; }
  .pattern-list { margin-top:16px; }
  .pattern-item { display:flex; justify-content:space-between; align-items:center; padding:12px; background:#fef2f2; border-radius:8px; margin-bottom:8px; }
  .hidden { display:none; }
  .overflow-x-auto { overflow-x:auto; }
  .year-total { background:#f7f70a; font-weight:600; font-size:20px; }
  /* Hourly view */
  .hourly-table thead th { position:sticky; top:0; background:#fff; z-index:1; }
  .activity-select { width:100%; padding:6px 8px; border:1px solid #d1d5db; border-radius:8px; font-size:13px; min-width:70px; background:transparent; border:none; font-weight:500; cursor:pointer; appearance:none; -webkit-appearance:none; -moz-appearance:none; outline:none; }
  .activity-select:focus { outline:none; }
  .pill { display:inline-block; padding:6px 14px; border-radius:9999px; font-size:18px; font-weight:600; }
  .pill.blue { background:#eff6ff; color:#000; background-color:#b8eab8; border:none; }
  .pill.purple { background:#add8e6; color:#000; }
  .pill.red { background:#fef2f2; color:#991b1b; }
  .pill.gray { background:#f3f4f6; color:#374151; }
  #hourly-view h2, #hourly-view th { color:#000; border:1px solid darkgray; background-color:#f7f70a; }
  /* Pomodoro Timer Styles */
  #pomodoro-view { background-color:rgb(186,73,73); min-height:100vh; overflow:hidden; }
  #pomodoro-view .container { background-color:rgb(186,73,73); color:white; padding:20px; border-radius:8px; display:flex; flex-direction:column; align-items:center; }
  #pomodoro-view .timer { font-size:6em; margin:20px 0; }
  #pomodoro-view .controls button { padding:10px 20px; margin:0 10px; font-size:1em; cursor:pointer; background:white; border:none; border-radius:5px; }
  #pomodoro-view .controls button:disabled { background:#cccccc; cursor:not-allowed; }
  #pomodoro-view .input-group { margin:20px 0; }
  #pomodoro-view .input-group input { padding:5px; font-size:1em; border:none; border-radius:5px; margin-right:10px; min-width:180px; }
  #pomodoro-view .input-group button { padding:5px 10px; font-size:1em; cursor:pointer; background:white; border:none; border-radius:5px; }
  #pomodoro-view #progress { width:100%; height:20px; background:#fff; border-radius:10px; margin-top:20px; }
  #pomodoro-view #progress-bar { height:100%; background:#4caf50; border-radius:10px; width:0%; transition:width 1s linear; }
  #pomodoro-view #task { margin-top:10px; font-size:1.2em; }
  @media (max-width:768px){
    .container{ padding:10px; }
    .weekly-breakdown{ min-width:78px; }
    .grid-container{ grid-template-columns:1fr; gap:16px; }
    .card{ padding:16px; }
    .title{ font-size:24px; }
    .button-group{ flex-direction:column; }
    .button{ width:100%; padding:12px; font-size:16px; flex:.5; }
    .card-title{ font-size:18px; }
    .form-group .input, .form-group textarea{ font-size:14px; }
    table{ font-size:12px; }
    .overflow-x-auto{ max-width:100%; overflow-x:auto; }
    .input-group .input{ flex:.5; }
  }
  @media (max-width:1024px) and (min-width:769px){
    .grid-container{ grid-template-columns:repeat(auto-fit,minmax(400px,1fr)); }
  }
`;

const MAIN_ACTIVITIES = ['Studying', 'Sleeping', 'Wasted', 'MISC'];
const MISC_ACTIVITIES = [
  'MISC-BREAK',
  'MISC-GYM',
  'MISC-WOKE_UP',
  'MISC-BREAKFAST',
  'MISC-LUNCH',
  'MISC-DINNER',
];

const STORAGE = {
  DAILY: 'timeTrackerData',
  HOURLY: 'hourlyData',
  PATTERNS: 'wastedPatterns',
  REFLECTIONS: 'reflections',
  POMODORO: 'pomodoroTimer',
};

function pad(n) {
  return n.toString().padStart(2, '0');
}
function formatDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function getDateKey(d) {
  return formatDate(d);
}
function hourLabel(h) {
  const hour12 = ((h + 11) % 12) + 1;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${hour12} ${ampm}`;
}
function timeRange(h) {
  const hh = pad(h);
  return { first: `${hh}:00–${hh}:30`, second: `${hh}:30–${hh}:59` };
}
function isPast(key) {
  const todayKey = getDateKey(new Date());
  return key < todayKey;
}
function isFuture(key) {
  const todayKey = getDateKey(new Date());
  return key > todayKey;
}
function formatHours(num) {
  return Number.isInteger(num) ? num : Number(num).toFixed(1);
}
function halfToHours(val, target) {
  return val === target ? 0.5 : 0;
}
function getColor(act) {
  const colors = {
    Studying: '#b8eab8',
    Sleeping: '#add8e6',
    Wasted: '#ffcccb',
  };
  return colors[act] || (act && act.startsWith('MISC-') ? '#fff5c0' : '');
}

export default function TimeTrackerApp() {
  // ===== State management =====
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [reportRange, setReportRange] = useState(() => new Date());
  const [viewMode, setViewMode] = useState('hourly');

  const [dailyData, setDailyData] = useState({}); // { 'YYYY-MM-DD': { study, sleep, wasted } }
  const [hourlyData, setHourlyData] = useState({}); // { 'YYYY-MM-DD': [ {first, second}, ...24 ] }
  const [wastedPatterns, setWastedPatterns] = useState({}); // { 'YYYY-MM-DD': [] }
  const [reflections, setReflections] = useState({}); // { 'YYYY-MM-DD': '...' }

  // UI-only state to emulate "switch to MISC menu" then choose specific MISC option (like original 'MISC'/'Back').
  // key: `${dateKey}|${hour}|${half}` => boolean (true => show MISC options)
  const [miscMenu, setMiscMenu] = useState({});

  // Pomodoro
  const [time, setTime] = useState(0); // seconds remaining
  const [totalTime, setTotalTime] = useState(0); // total seconds
  const [taskMessage, setTaskMessage] = useState('Not set');
  const [hoursInput, setHoursInput] = useState('');
  const [minutesInput, setMinutesInput] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const timerRef = useRef(null);
  const pausedRef = useRef(false);

  // ===== Load initial data =====
  useEffect(() => {
    try {
      const d = localStorage.getItem(STORAGE.DAILY);
      if (d) setDailyData(JSON.parse(d));
      const h = localStorage.getItem(STORAGE.HOURLY);
      if (h) setHourlyData(JSON.parse(h));
      const p = localStorage.getItem(STORAGE.PATTERNS);
      if (p) setWastedPatterns(JSON.parse(p));
      const r = localStorage.getItem(STORAGE.REFLECTIONS);
      if (r) setReflections(JSON.parse(r));
    } catch {}
  }, []);

  // Auto-calc wasted patterns for any loaded hourly data (on first mount)
  useEffect(() => {
    // Only on first mount and when hourlyData is non-empty; we don't want to loop endlessly
    // We compute patterns for each date if not already computed
    const keys = Object.keys(hourlyData || {});
    if (keys.length === 0) return;
    setWastedPatterns((prev) => {
      const copy = { ...prev };
      keys.forEach((k) => {
        copy[k] = autoCalculateWastedPatternsHelper(k, hourlyData);
      });
      return copy;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Persist on changes =====
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE.DAILY, JSON.stringify(dailyData));
    } catch {}
  }, [dailyData]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE.HOURLY, JSON.stringify(hourlyData));
    } catch {}
  }, [hourlyData]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE.PATTERNS, JSON.stringify(wastedPatterns));
    } catch {}
  }, [wastedPatterns]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE.REFLECTIONS, JSON.stringify(reflections));
    } catch {}
  }, [reflections]);

  // ===== Pomodoro: load & persist =====
  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE.POMODORO);
      if (s) {
        const { time: t, totalTime: tt, taskMessage: tm } = JSON.parse(s);
        setTime(t || 0);
        setTotalTime(tt || 0);
        setTaskMessage(tm || 'Not set');
      }
    } catch {}
  }, []);

  useEffect(() => {
    // Start timer automatically if time > 0 and no active interval
    if (viewMode === 'pomodoro' && time > 0 && !timerRef.current) {
      startTimer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  useEffect(() => {
    // Update title and progress bar via DOM is fine (title only); width handled in JSX style
    const h = Math.floor(time / 3600),
      m = Math.floor((time % 3600) / 60),
      s = time % 60;
    document.title = `${pad(h)}:${pad(m)}:${pad(s)} - Time Tracker`;
    saveTimerState(taskMessage);
    // Cleanup: when unmounting, don't alter title.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time, totalTime, taskMessage]);

  function saveTimerState(tm) {
    try {
      localStorage.setItem(
        STORAGE.POMODORO,
        JSON.stringify({ time, totalTime, taskMessage: tm })
      );
    } catch {}
  }

  // ===== Navigation helpers =====
  const dateKey = useMemo(() => getDateKey(selectedDate), [selectedDate]);

  function shiftSelectedDate(deltaDays) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + deltaDays);
    setSelectedDate(d);
  }
  function changeMonth(direction) {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + direction,
        1
      )
    );
  }
  function changeReportMonth(direction) {
    setReportRange(
      new Date(reportRange.getFullYear(), reportRange.getMonth() + direction, 1)
    );
  }
  function changeReportYear(direction) {
    setReportRange(
      new Date(reportRange.getFullYear() + direction, reportRange.getMonth(), 1)
    );
  }

  // ===== Hourly helpers =====
  const rowsForDay = useMemo(() => {
    return (
      hourlyData[dateKey] ||
      Array.from({ length: 24 }, () => ({ first: null, second: null }))
    );
  }, [hourlyData, dateKey]);

  function countMiscHours(rows) {
    let misc = 0;
    rows.forEach((r) => {
      misc +=
        (r.first && r.first.startsWith('MISC-') ? 0.5 : 0) +
        (r.second && r.second.startsWith('MISC-') ? 0.5 : 0);
    });
    return misc;
  }

  function recalcFromHourly(k) {
    const rows = (hourlyData[k] || []).length
      ? hourlyData[k]
      : Array.from({ length: 24 }, () => ({ first: null, second: null }));
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

    const accounted = study + sleep + wasted + countMiscHours(rows);

    // Update dailyData
    setDailyData((prev) => ({ ...prev, [k]: { study, sleep, wasted } }));

    // Auto-calc wasted patterns
    setWastedPatterns((prev) => ({
      ...prev,
      [k]: autoCalculateWastedPatternsHelper(k, hourlyData),
    }));

    return { study, sleep, wasted, accounted };
  }

  function autoCalculateWastedPatternsHelper(k, hData) {
    const rows =
      hData[k] ||
      Array.from({ length: 24 }, () => ({ first: null, second: null }));
    let patterns = [];
    let prevActivity = null;
    const sleepRange = [22, 4]; // 10 PM to 4 AM as sleep window
    for (let h = 0; h < 24; h++) {
      const currentFirst = rows[h].first;
      const currentSecond = rows[h].second;
      if (currentFirst === 'Wasted') {
        if (prevActivity === 'MISC-GYM') patterns.push('Post Gym');
        else if (prevActivity === 'MISC-LUNCH') patterns.push('Post Lunch');
        else if (prevActivity === 'MISC-BREAKFAST')
          patterns.push('Post Breakfast');
        else if (prevActivity === 'MISC-DINNER') patterns.push('Post Dinner');
        else if (prevActivity === 'MISC-BREAK') patterns.push('Post BREAK');
        else if (prevActivity === 'MISC-WOKE_UP') patterns.push('Post Wakeup');
        else if (h < sleepRange[0] || (h >= 0 && h < sleepRange[1]))
          patterns.push('Pre Sleep');
      }
      if (currentSecond === 'Wasted') {
        if (currentFirst === 'MISC-GYM') patterns.push('Post Gym');
        else if (currentFirst === 'MISC-LUNCH') patterns.push('Post Lunch');
        else if (currentFirst === 'MISC-BREAKFAST')
          patterns.push('Post Breakfast');
        else if (currentFirst === 'MISC-DINNER') patterns.push('Post Dinner');
        else if (currentFirst === 'MISC-BREAK') patterns.push('Post BREAK');
        else if (currentFirst === 'MISC-WOKE_UP') patterns.push('Post Wakeup');
        else if (h < sleepRange[0] || (h >= 0 && h < sleepRange[1]))
          patterns.push('Pre Sleep');
      }
      prevActivity = currentSecond || currentFirst;
    }
    // Deduplicate preserve order
    patterns = patterns.filter((item, idx) => patterns.indexOf(item) === idx);
    return patterns;
  }

  function getOptions(current, key) {
    const isMisc = !!(current && current.startsWith('MISC-'));
    const showMisc = miscMenu[key] || isMisc;
    if (showMisc) {
      const opts = [
        { value: 'Back', label: 'Back to main' },
        ...MISC_ACTIVITIES.map((a) => ({ value: a, label: a })),
      ];
      return { options: opts, showMisc: true };
    }
    const opts = MAIN_ACTIVITIES.map((a) => ({ value: a, label: a }));
    return { options: opts, showMisc: false };
  }

  function setHalfActivity(k, hour, half, value) {
    // Past day lock
    if (isPast(k)) {
      alert('Cannot edit past days.');
      return;
    }

    const uiKey = `${k}|${hour}|${half}`;

    if (value === 'Back') {
      setMiscMenu((prev) => ({ ...prev, [uiKey]: false }));
      setHourlyData((prev) => {
        const day = prev[k]
          ? [...prev[k]]
          : Array.from({ length: 24 }, () => ({ first: null, second: null }));
        const row = { ...day[hour] };
        row[half] = null;
        day[hour] = row;
        return { ...prev, [k]: day };
      });
      recalcFromHourly(k);
      return;
    }

    if (value === 'MISC') {
      setMiscMenu((prev) => ({ ...prev, [uiKey]: true }));
      return; // do not set value yet, user will pick a specific MISC-*
    }

    setHourlyData((prev) => {
      const day = prev[k]
        ? [...prev[k]]
        : Array.from({ length: 24 }, () => ({ first: null, second: null }));
      const row = { ...day[hour] };
      row[half] = value;
      day[hour] = row;
      return { ...prev, [k]: day };
    });

    // If they picked a main item, ensure menu flips back to main; if picked MISC-*, ensure misc menu stays on
    setMiscMenu((prev) => ({ ...prev, [uiKey]: value.startsWith('MISC-') }));

    recalcFromHourly(k);
  }

  // ===== Input view handlers =====
  function handleInputChange(kind, val) {
    const study =
      kind === 'study' ? parseFloat(val) || 0 : dailyData[dateKey]?.study || 0;
    const sleep =
      kind === 'sleep' ? parseFloat(val) || 0 : dailyData[dateKey]?.sleep || 0;
    const wasted =
      kind === 'wasted'
        ? parseFloat(val) || 0
        : dailyData[dateKey]?.wasted || 0;
    setDailyData((prev) => ({ ...prev, [dateKey]: { study, sleep, wasted } }));
  }

  function addPattern(inputEl) {
    const pattern = (inputEl?.value || '').trim();
    if (!pattern) return;
    setWastedPatterns((prev) => {
      const list = prev[dateKey] ? [...prev[dateKey]] : [];
      list.push(pattern);
      return { ...prev, [dateKey]: list };
    });
    if (inputEl) inputEl.value = '';
  }

  function removePattern(idx) {
    setWastedPatterns((prev) => {
      const list = prev[dateKey] ? [...prev[dateKey]] : [];
      list.splice(idx, 1);
      return { ...prev, [dateKey]: list };
    });
  }

  // ===== Calendar =====
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++)
      cells.push({ empty: true, key: `empty-${i}` });
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const k = getDateKey(d);
      const hasData = !!dailyData[k];
      const isSelected = k === dateKey;
      const isToday = k === getDateKey(new Date());
      cells.push({
        day,
        k,
        hasData,
        isSelected,
        isToday,
        key: `${year}-${month + 1}-${day}`,
      });
    }
    return cells;
  }, [currentMonth, dailyData, dateKey]);

  // ===== Reports =====
  function calculateWeeklyReport(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weeks = [];
    let currentWeek = [];
    let weekNum = 1;
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const k = getDateKey(d);
      const dd = dailyData[k] || { study: 0, sleep: 0, wasted: 0 };
      currentWeek.push(dd);
      if (d.getDay() === 0 || day === daysInMonth) {
        if (currentWeek.length) {
          const totals = currentWeek.reduce(
            (acc, it) => ({
              study: acc.study + (it.study || 0),
              sleep: acc.sleep + (it.sleep || 0),
              wasted: acc.wasted + (it.wasted || 0),
            }),
            { study: 0, sleep: 0, wasted: 0 }
          );
          weeks.push({
            weekNum: weekNum++,
            days: currentWeek.length,
            avgStudy: (totals.study / currentWeek.length).toFixed(2),
            avgSleep: (totals.sleep / currentWeek.length).toFixed(2),
            avgWasted: (totals.wasted / currentWeek.length).toFixed(2),
            totalStudy: totals.study.toFixed(1),
            totalSleep: totals.sleep.toFixed(1),
            totalWasted: totals.wasted.toFixed(1),
          });
          currentWeek = [];
        }
      }
    }
    return weeks;
  }

  function calculateMonthlyReport(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let totals = { study: 0, sleep: 0, wasted: 0 };
    let daysTracked = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const k = getDateKey(d);
      const dd = dailyData[k];
      if (dd) {
        totals.study += dd.study || 0;
        totals.sleep += dd.sleep || 0;
        totals.wasted += dd.wasted || 0;
        daysTracked++;
      }
    }
    return {
      totals,
      averages: {
        study: daysTracked > 0 ? (totals.study / daysTracked).toFixed(2) : 0,
        sleep: daysTracked > 0 ? (totals.sleep / daysTracked).toFixed(2) : 0,
        wasted: daysTracked > 0 ? (totals.wasted / daysTracked).toFixed(2) : 0,
      },
      daysTracked,
      daysInMonth,
    };
  }

  function calculatePatternAnalysis() {
    const counts = {};
    Object.values(wastedPatterns).forEach((arr) =>
      (arr || []).forEach((p) => {
        const n = (p || '').toLowerCase();
        counts[n] = (counts[n] || 0) + 1;
      })
    );
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([pattern, count]) => ({ pattern, count }));
  }

  // ===== Reflection =====
  const reflectionValue = reflections[dateKey] || '';
  const reflectionDisabled = isPast(dateKey);

  function clearReflection() {
    if (window.confirm('Clear your saved answer?')) {
      setReflections((prev) => ({ ...prev, [dateKey]: '' }));
    }
  }

  // ===== Export / Import =====
  const fileInputRef = useRef(null);
  function exportAllData() {
    const payload = { dailyData, hourlyData, wastedPatterns, reflections };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-tracker-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function importAllData(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result);
        setDailyData(obj.dailyData || {});
        setHourlyData(obj.hourlyData || {});
        setWastedPatterns(obj.wastedPatterns || {});
        setReflections(obj.reflections || {});
        alert('Import successful.');
      } catch (err) {
        alert('Import failed: invalid JSON');
      }
      if (fileInputRef.current) fileInputRef.current.value = ''; // reset chooser
    };
    reader.readAsText(file);
  }

  // ===== Pomodoro controls =====
  function setPomodoroTime() {
    const h = Math.max(0, Math.min(10, parseInt(hoursInput || '0', 10)));
    const m = Math.max(0, Math.min(59, parseInt(minutesInput || '0', 10)));
    const msg = (taskInput || '').trim() || 'Not set';
    const total = h * 3600 + m * 60;
    setTotalTime(total);
    setTime(total);
    setTaskMessage(`${msg} (${h}h ${m}m)`);
    startTimer();
  }

  function startTimer() {
    if (timerRef.current || time <= 0) return;
    pausedRef.current = false;
    timerRef.current = setInterval(() => {
      setTime((prev) => {
        if (prev > 0) {
          return prev - 1;
        } else {
          clearInterval(timerRef.current);
          timerRef.current = null;
          window.alert('Time is up!');
          setTaskMessage('Not set');
          return 0;
        }
      });
    }, 1000);
  }

  function pauseTimer() {
    if (timerRef.current) {
      pausedRef.current = true;
      clearInterval(timerRef.current);
      timerRef.current = null;
    } else if (pausedRef.current && time > 0) {
      pausedRef.current = false;
      startTimer();
    }
  }

  function resetTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    pausedRef.current = false;
    setTime(0);
    setTotalTime(0);
    setHoursInput('');
    setMinutesInput('');
    setTaskInput('');
    setTaskMessage('Not set');
    try {
      localStorage.removeItem(STORAGE.POMODORO);
    } catch {}
  }

  const pomodoroProgress =
    totalTime > 0 ? ((totalTime - time) / totalTime) * 100 : 0;

  // ===== Derived totals for hourly chips =====
  const derivedHourly = useMemo(() => {
    if (!hourlyData[dateKey]) {
      const dd = dailyData[dateKey] || { study: 0, sleep: 0, wasted: 0 };
      return {
        study: dd.study,
        sleep: dd.sleep,
        wasted: dd.wasted,
        accounted: dd.study + dd.sleep + dd.wasted,
      };
    }
    const { study, sleep, wasted, accounted } = recalcTotalsOnly(
      dateKey,
      hourlyData
    );
    return { study, sleep, wasted, accounted };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hourlyData, dailyData, dateKey]);

  function recalcTotalsOnly(k, hData) {
    const rows = hData[k] || [];
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
    const accounted = study + sleep + wasted + countMiscHours(rows);
    return { study, sleep, wasted, accounted };
  }

  const accountedWarning = derivedHourly.accounted > 24.001;

  // ===== Renderers =====
  function NavButton({ mode, label }) {
    return (
      <button
        className={`button ${viewMode === mode ? 'active' : ''}`}
        onClick={() => setViewMode(mode)}
      >
        {label}
      </button>
    );
  }

  function HourlyTable() {
    const past = isPast(dateKey);
    return (
      <div
        className='overflow-x-auto'
        style={{
          maxHeight: '60vh',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
        }}
      >
        <table className='hourly-table' style={{ width: '100%' }}>
          <thead>
            <tr>
              <th className='text-center' style={{ fontSize: 14 }}>
                Time
              </th>
              <th className='text-center' style={{ fontSize: 14, width: 200 }}>
                First Half
              </th>
              <th className='text-center' style={{ fontSize: 14, width: 200 }}>
                Second Half
              </th>
              <th style={{ fontSize: 14 }} className='text-center'>
                Studied (hrs)
              </th>
              <th style={{ fontSize: 14 }} className='text-center'>
                Slept (hrs)
              </th>
              <th style={{ fontSize: 14 }} className='text-center'>
                Wasted (hrs)
              </th>
            </tr>
          </thead>
          <tbody>
            {rowsForDay.map((row, h) => {
              const ranges = timeRange(h);
              const studied =
                halfToHours(row.first, 'Studying') +
                halfToHours(row.second, 'Studying');
              const slept =
                halfToHours(row.first, 'Sleeping') +
                halfToHours(row.second, 'Sleeping');
              const wasted =
                halfToHours(row.first, 'Wasted') +
                halfToHours(row.second, 'Wasted');
              const keyFirst = `${dateKey}|${h}|first`;
              const keySecond = `${dateKey}|${h}|second`;
              const { options: optsFirst } = getOptions(row.first, keyFirst);
              const { options: optsSecond } = getOptions(row.second, keySecond);
              return (
                <tr key={`row-${h}`}>
                  <td
                    className='text-center'
                    style={{ whiteSpace: 'nowrap', fontWeight: 500 }}
                  >
                    {hourLabel(h)}
                  </td>
                  <td
                    className='text-center'
                    style={{ backgroundColor: getColor(row.first) }}
                  >
                    <select
                      className='activity-select text-center'
                      disabled={past}
                      value={normalizeSelectValue(
                        row.first,
                        miscMenu[keyFirst]
                      )}
                      onChange={(e) =>
                        setHalfActivity(dateKey, h, 'first', e.target.value)
                      }
                    >
                      {renderOptions(optsFirst, row.first)}
                    </select>
                    <div
                      style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}
                    >
                      {ranges.first}
                    </div>
                  </td>
                  <td
                    className='text-center'
                    style={{ backgroundColor: getColor(row.second) }}
                  >
                    <select
                      className='activity-select text-center'
                      disabled={past}
                      value={normalizeSelectValue(
                        row.second,
                        miscMenu[keySecond]
                      )}
                      onChange={(e) =>
                        setHalfActivity(dateKey, h, 'second', e.target.value)
                      }
                    >
                      {renderOptions(optsSecond, row.second)}
                    </select>
                    <div
                      style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}
                    >
                      {ranges.second}
                    </div>
                  </td>
                  <td
                    className='text-center'
                    style={{
                      backgroundColor: studied > 0 ? '#b8eab8' : undefined,
                    }}
                  >
                    {studied}
                  </td>
                  <td
                    className='text-center'
                    style={{
                      backgroundColor: slept > 0 ? '#add8e6' : undefined,
                    }}
                  >
                    {slept}
                  </td>
                  <td
                    className='text-center'
                    style={{
                      backgroundColor: wasted > 0 ? '#ffcccb' : undefined,
                    }}
                  >
                    {wasted}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  function normalizeSelectValue(current, miscOn) {
    if (!current) {
      // when misc menu is toggled on but no value yet, show an empty value so placeholder option renders
      return miscOn ? '' : '';
    }
    // If not "MISC" nor "Back", just return the actual current selection
    return current;
  }

  function renderOptions(opts, current) {
    // If current is null and this is main list, show hidden placeholder like original
    const isMiscList = opts.length && opts[0].value === 'Back';
    if (isMiscList && !current) {
      return [
        <option key='ph' value='' disabled hidden>
          {'-- Select MISC --'}
        </option>,
        ...opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        )),
      ];
    }
    if (!isMiscList && !current) {
      return [
        <option key='ph' value='' disabled hidden>
          {'-- Select --'}
        </option>,
        ...opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        )),
      ];
    }
    return opts.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ));
  }

  // ===== Main JSX =====
  return (
    <div>
      {/* Inject CSS */}
      <style>{CSS}</style>

      <div className='container'>
        <header className='header'>
          <h1 className='title'>⏰ Time Tracker Application</h1>
          <div className='button-group' id='nav-buttons'>
            <NavButton mode='hourly' label='⏱️ Hourly Tracker' />
            <NavButton mode='input' label='🗓️ Input Data' />
            <NavButton mode='daily' label='📆 Daily Report' />
            <NavButton mode='weekly' label='🧾 Weekly Report' />
            <NavButton mode='monthly' label='📋 Monthly Report' />
            <NavButton mode='yearly' label='📊 Yearly Report' />
            <NavButton mode='pomodoro' label='⏳ Focus Timer' />
          </div>
        </header>

        {/* Hourly View */}
        <div
          id='hourly-view'
          className={`view ${viewMode === 'hourly' ? '' : 'hidden'}`}
        >
          <div className='grid-container'>
            <div className='card'>
              <div className='card-header'>
                <h2 className='card-title'>
                  Hourly Tracker — <span>{selectedDate.toDateString()}</span>
                </h2>
                <div className='nav-buttons'>
                  <button
                    className='icon-button'
                    onClick={() => shiftSelectedDate(-1)}
                  >
                    ‹
                  </button>
                  <button
                    className='icon-button'
                    onClick={() => shiftSelectedDate(1)}
                  >
                    ›
                  </button>
                </div>
              </div>

              {isPast(dateKey) && (
                <p
                  id='past-message'
                  style={{
                    color: '#991b1b',
                    fontSize: 24,
                    fontStyle: 'italic',
                    fontWeight: 600,
                    margin: '0 0 12px 0',
                    padding: '4px 14px',
                    borderRadius: 10,
                    background: '#fef2f2',
                  }}
                >
                  You cannot change the past; you can only learn from it.
                </p>
              )}

              <div className='total-info' style={{ marginBottom: 12 }}>
                <span className='pill blue'>
                  Studied:{' '}
                  <span id='hourly-study'>
                    {formatHours(derivedHourly.study)}
                    {derivedHourly.study >= 15 ? ' 🗿' : ''}
                  </span>{' '}
                  hrs
                </span>
                <span className='pill purple' style={{ marginLeft: 8 }}>
                  Slept:{' '}
                  <span id='hourly-sleep'>
                    {formatHours(derivedHourly.sleep)}
                    {derivedHourly.sleep <= 5 ? ' 🗿' : ''}
                  </span>{' '}
                  hrs
                </span>
                <span className='pill red' style={{ marginLeft: 8 }}>
                  Wasted:{' '}
                  <span id='hourly-wasted'>
                    {formatHours(derivedHourly.wasted)}
                    {derivedHourly.wasted === 0 ? ' 🗿' : ''}
                  </span>{' '}
                  hrs
                </span>
                <span className='pill gray' style={{ marginLeft: 8 }}>
                  Accounted:{' '}
                  <span id='hourly-accounted'>
                    {formatHours(derivedHourly.accounted)}
                  </span>{' '}
                  / 24 hrs
                </span>
              </div>

              <HourlyTable />

              {accountedWarning && (
                <p
                  className='warning-text'
                  id='hourly-warning'
                  style={{ marginTop: 8 }}
                >
                  ⚠️ Accounted time exceeds 24 hours!
                </p>
              )}
            </div>

            <div className='card'>
              <div className='form-group' style={{ marginTop: 16 }}>
                <label className='label'>
                  If there’s one thing you could change about your past, what
                  would it be?
                </label>
                <textarea
                  id='reflection-input'
                  className='input'
                  rows={6}
                  placeholder='Type your answer... (auto-saved)'
                  disabled={reflectionDisabled}
                  value={reflectionValue}
                  onChange={(e) =>
                    setReflections((prev) => ({
                      ...prev,
                      [dateKey]: e.target.value,
                    }))
                  }
                />
              </div>
              <div className='form-group'>
                <button className='button' onClick={clearReflection}>
                  Clear Answer
                </button>
              </div>

              <div className='total-info'>
                <p style={{ fontSize: 13 }}>
                  Tip: Use Export/Import below to back up your data.
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className='button' onClick={exportAllData}>
                    Export Data
                  </button>
                  <label
                    className='button'
                    htmlFor='import-file'
                    style={{
                      display: 'flex',
                      gap: 8,
                      cursor: 'pointer',
                      placeContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    Import Data
                  </label>
                  <input
                    ref={fileInputRef}
                    type='file'
                    id='import-file'
                    className='hidden'
                    accept='application/json'
                    onChange={importAllData}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input View */}
        <div
          id='input-view'
          className={`view ${viewMode === 'input' ? '' : 'hidden'}`}
        >
          <div className='grid-container'>
            <div className='card'>
              <div className='card-header'>
                <h2 className='card-title' id='current-month-year'>
                  {currentMonth.toLocaleString('default', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </h2>
                <div className='nav-buttons'>
                  <button
                    className='icon-button'
                    onClick={() => changeMonth(-1)}
                  >
                    ‹
                  </button>
                  <button
                    className='icon-button'
                    onClick={() => changeMonth(1)}
                  >
                    ›
                  </button>
                </div>
              </div>

              <div className='calendar-grid'>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className='day-header'>
                    {d}
                  </div>
                ))}
              </div>
              <div id='calendar-days' className='calendar-grid'>
                {calendarDays.map((cell) =>
                  cell.empty ? (
                    <div key={cell.key}></div>
                  ) : (
                    <div
                      key={cell.key}
                      className={`day-cell${
                        cell.isSelected ? ' selected' : ''
                      }${!cell.isSelected && cell.isToday ? ' today' : ''}${
                        !cell.isSelected && !cell.isToday && cell.hasData
                          ? ' has-data'
                          : ''
                      }`}
                      onClick={() => setSelectedDate(new Date(cell.k))}
                    >
                      <div style={{ fontWeight: 500 }}>{cell.day}</div>
                      {cell.hasData && (
                        <div style={{ fontSize: 12, color: '#16a34a' }}>✓</div>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>

            <div className='card'>
              <h2 className='card-title'>
                Data Entry for{' '}
                <span id='selected-date'>{selectedDate.toDateString()}</span>
              </h2>
              <p
                style={{
                  background: '#f2f2f2',
                  padding: 10,
                  borderRadius: 6,
                  margin: 0,
                  color: 'red',
                }}
              >
                Below data is automatically calculated from the Hourly Tracker.
                If you missed updating it for any day, you can manually enter
                the values here.
              </p>
              <div style={{ marginTop: 24 }}>
                <div className='form-group'>
                  <label className='label'> 🧠 Study Hours </label>
                  <input
                    type='number'
                    id='study-input'
                    className='input'
                    step='0.5'
                    min='0'
                    max='24'
                    value={dailyData[dateKey]?.study ?? 0}
                    onChange={(e) => handleInputChange('study', e.target.value)}
                  />
                </div>
                <div className='form-group'>
                  <label className='label'> 🌙 Sleep Hours </label>
                  <input
                    type='number'
                    id='sleep-input'
                    className='input'
                    step='0.5'
                    min='0'
                    max='24'
                    value={dailyData[dateKey]?.sleep ?? 0}
                    onChange={(e) => handleInputChange('sleep', e.target.value)}
                  />
                </div>
                <div className='form-group'>
                  <label className='label'> ⚠️ Wasted Hours </label>
                  <input
                    type='number'
                    id='wasted-input'
                    className='input'
                    step='0.5'
                    min='0'
                    max='24'
                    value={dailyData[dateKey]?.wasted ?? 0}
                    onChange={(e) =>
                      handleInputChange('wasted', e.target.value)
                    }
                  />
                </div>
                <div className='form-group'>
                  <label className='label'> Wasted Time Patterns </label>
                  <div className='input-group'>
                    <input
                      type='text'
                      id='pattern-input'
                      className='input'
                      placeholder='e.g., Post-lunch, Post-dinner'
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addPattern(e.currentTarget);
                      }}
                    />
                    <button
                      className='button active'
                      onClick={(e) => {
                        const input = e.currentTarget.previousSibling;
                        addPattern(input);
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <div id='patterns-list' style={{ marginTop: 12 }}>
                    {(wastedPatterns[dateKey] || []).map((pattern, idx) => (
                      <span key={`${pattern}-${idx}`} className='pattern-chip'>
                        {pattern}
                        <button onClick={() => removePattern(idx)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className='total-info'>
                  {(() => {
                    const d = dailyData[dateKey] || {
                      study: 0,
                      sleep: 0,
                      wasted: 0,
                    };
                    const total = (d.study + d.sleep + d.wasted).toFixed(1);
                    const warn = d.study + d.sleep + d.wasted > 24;
                    return (
                      <>
                        <p id='total-hours'>
                          Total accounted: {total} / 24 hours
                        </p>
                        <p
                          id='warning-message'
                          className={`warning-text ${warn ? '' : 'hidden'}`}
                        >
                          ⚠️ Total exceeds 24 hours!
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Report View */}
        <div
          id='daily-view'
          className={`view ${viewMode === 'daily' ? '' : 'hidden'}`}
        >
          <div className='card'>
            <h2 className='card-title'>
              Daily Report -{' '}
              <span id='daily-date'>{selectedDate.toDateString()}</span>
            </h2>
            {(() => {
              const d = dailyData[dateKey] || { study: 0, sleep: 0, wasted: 0 };
              const patterns = wastedPatterns[dateKey] || [];
              return (
                <>
                  <div className='stats-grid'>
                    <div className='stat-card blue'>
                      <div className='stat-header'>
                        <span>Study</span>
                        <span>🧠</span>
                      </div>
                      <div className='stat-value blue' id='daily-study'>
                        {d.study} hrs
                      </div>
                    </div>
                    <div className='stat-card purple'>
                      <div className='stat-header'>
                        <span>Sleep</span>
                        <span>🌙</span>
                      </div>
                      <div className='stat-value purple' id='daily-sleep'>
                        {d.sleep} hrs
                      </div>
                    </div>
                    <div className='stat-card red'>
                      <div className='stat-header'>
                        <span>Wasted</span>
                        <span>⚠️</span>
                      </div>
                      <div className='stat-value red' id='daily-wasted'>
                        {d.wasted} hrs
                      </div>
                    </div>
                  </div>
                  <div id='daily-patterns'>
                    {patterns.length > 0 && (
                      <div>
                        <h3 style={{ fontWeight: 600, marginBottom: 8 }}>
                          Wasted Time Patterns:
                        </h3>
                        <div
                          style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
                        >
                          {patterns.map((p, i) => (
                            <span
                              key={`${p}-${i}`}
                              style={{
                                padding: '4px 12px',
                                background: '#f3f4f6',
                                borderRadius: 20,
                                fontSize: 14,
                              }}
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Weekly Report View */}
        <div
          id='weekly-view'
          className={`view ${viewMode === 'weekly' ? '' : 'hidden'}`}
        >
          <div className='card'>
            <div className='card-header'>
              <h2 className='card-title'>
                Weekly Report -{' '}
                <span id='weekly-month'>
                  {reportRange.toLocaleString('default', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </h2>
              <div className='nav-buttons'>
                <button
                  className='icon-button'
                  onClick={() => changeReportMonth(-1)}
                >
                  ‹
                </button>
                <button
                  className='icon-button'
                  onClick={() => changeReportMonth(1)}
                >
                  ›
                </button>
              </div>
            </div>
            <div id='weekly-content'>
              {calculateWeeklyReport(reportRange).map((week) => (
                <div key={`week-${week.weekNum}`} className='week-card'>
                  <h3 style={{ fontWeight: 600, marginBottom: 12 }}>
                    Week {week.weekNum} ({week.days} days)
                  </h3>
                  <div className='stats-grid'>
                    <div>
                      <span style={{ color: '#6b7280', fontSize: 14 }}>
                        Study
                      </span>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 600,
                          color: '#3b82f6',
                        }}
                      >
                        Avg: {week.avgStudy} hrs/day
                      </div>
                      <div style={{ fontSize: 14, color: '#9ca3af' }}>
                        Total: {week.totalStudy} hrs
                      </div>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280', fontSize: 14 }}>
                        Sleep
                      </span>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 600,
                          color: '#a855f7',
                        }}
                      >
                        Avg: {week.avgSleep} hrs/day
                      </div>
                      <div style={{ fontSize: 14, color: '#9ca3af' }}>
                        Total: {week.totalSleep} hrs
                      </div>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280', fontSize: 14 }}>
                        Wasted
                      </span>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 600,
                          color: '#ef4444',
                        }}
                      >
                        Avg: {week.avgWasted} hrs/day
                      </div>
                      <div style={{ fontSize: 14, color: '#9ca3af' }}>
                        Total: {week.totalWasted} hrs
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Report View */}
        <div
          id='monthly-view'
          className={`view ${viewMode === 'monthly' ? '' : 'hidden'}`}
        >
          <div className='card'>
            <div className='card-header'>
              <h2 className='card-title'>
                Monthly Report -{' '}
                <span id='monthly-month'>
                  {reportRange.toLocaleString('default', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </h2>
              <div className='nav-buttons'>
                <button
                  className='icon-button'
                  onClick={() => changeReportMonth(-1)}
                >
                  ‹
                </button>
                <button
                  className='icon-button'
                  onClick={() => changeReportMonth(1)}
                >
                  ›
                </button>
              </div>
            </div>
            {(() => {
              const report = calculateMonthlyReport(reportRange);
              const weeks = calculateWeeklyReport(reportRange);
              return (
                <div id='monthly-content'>
                  <div className='stats-grid'>
                    <div className='stat-card blue'>
                      <span style={{ color: '#6b7280', fontSize: 14 }}>
                        Total Study
                      </span>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 'bold',
                          color: '#3b82f6',
                        }}
                      >
                        {report.totals.study.toFixed(1)} hrs
                      </div>
                      <div style={{ fontSize: 14, color: '#9ca3af' }}>
                        Avg: {report.averages.study} hrs/day
                      </div>
                    </div>
                    <div className='stat-card purple'>
                      <span style={{ color: '#6b7280', fontSize: 14 }}>
                        Total Sleep
                      </span>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 'bold',
                          color: '#a855f7',
                        }}
                      >
                        {report.totals.sleep.toFixed(1)} hrs
                      </div>
                      <div style={{ fontSize: 14, color: '#9ca3af' }}>
                        Avg: {report.averages.sleep} hrs/day
                      </div>
                    </div>
                    <div className='stat-card red'>
                      <span style={{ color: '#6b7280', fontSize: 14 }}>
                        Total Wasted
                      </span>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 'bold',
                          color: '#ef4444',
                        }}
                      >
                        {report.totals.wasted.toFixed(1)} hrs
                      </div>
                      <div style={{ fontSize: 14, color: '#9ca3af' }}>
                        Avg: {report.averages.wasted} hrs/day
                      </div>
                    </div>
                  </div>
                  <div style={{ margin: '24px 0' }}>
                    <p style={{ color: '#6b7280' }}>
                      Days tracked: {report.daysTracked} / {report.daysInMonth}
                    </p>
                  </div>
                  <div
                    style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}
                  >
                    <h3 style={{ fontWeight: 600, marginBottom: 12 }}>
                      Weekly Breakdown
                    </h3>
                    <div>
                      {weeks.map((w) => (
                        <div
                          key={`wb-${w.weekNum}`}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: 12,
                            background: '#f9fafb',
                            borderRadius: 8,
                            marginBottom: 8,
                          }}
                        >
                          <span
                            className='weekly-breakdown'
                            style={{ fontWeight: 500 }}
                          >
                            Week {w.weekNum}
                          </span>
                          <div
                            style={{ display: 'flex', gap: 16, fontSize: 14 }}
                          >
                            <span style={{ color: '#3b82f6' }}>
                              Study: {w.avgStudy} hrs/day
                            </span>
                            <span style={{ color: '#a855f7' }}>
                              Sleep: {w.avgSleep} hrs/day
                            </span>
                            <span style={{ color: '#ef4444' }}>
                              Wasted: {w.avgWasted} hrs/day
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Yearly Report View */}
        <div
          id='yearly-view'
          className={`view ${viewMode === 'yearly' ? '' : 'hidden'}`}
        >
          <div className='card'>
            <div className='card-header'>
              <h2 className='card-title'>
                Yearly Report -{' '}
                <span id='yearly-year'>{reportRange.getFullYear()}</span>
              </h2>
              <div className='nav-buttons'>
                <button
                  className='icon-button'
                  onClick={() => changeReportYear(-1)}
                >
                  ‹
                </button>
                <button
                  className='icon-button'
                  onClick={() => changeReportYear(1)}
                >
                  ›
                </button>
              </div>
            </div>

            {(() => {
              const year = reportRange.getFullYear();
              const months = [];
              const currentMonthIndex = new Date().getMonth();
              const currentYear = new Date().getFullYear();
              for (let m = 0; m < 12; m++) {
                const date = new Date(year, m, 1);
                const report = calculateMonthlyReport(date);
                months.push({
                  name: date.toLocaleString('default', { month: 'long' }),
                  ...report,
                });
              }
              const yearTotals = months.reduce(
                (acc, m) => ({
                  study: acc.study + m.totals.study,
                  sleep: acc.sleep + m.totals.sleep,
                  wasted: acc.wasted + m.totals.wasted,
                  daysTracked: acc.daysTracked + m.daysTracked,
                }),
                { study: 0, sleep: 0, wasted: 0, daysTracked: 0 }
              );
              const patterns = calculatePatternAnalysis();
              return (
                <>
                  <div className='overflow-x-auto'>
                    <table>
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th className='text-center'>Study (hrs)</th>
                          <th className='text-center'>Sleep (hrs)</th>
                          <th className='text-center'>Wasted (hrs)</th>
                          <th className='text-center'>Days Tracked</th>
                        </tr>
                      </thead>
                      <tbody id='yearly-table-body'>
                        {months.map((month, index) => {
                          const isTracked = month.daysTracked > 0;
                          const isCurrent =
                            year === currentYear && index === currentMonthIndex;
                          let rowStyle = {};
                          if (isCurrent) {
                            rowStyle = {
                              background:
                                'linear-gradient(to right, #faf5ff, #add8e6)',
                            };
                          } else if (isTracked) {
                            rowStyle = { backgroundColor: '#f0fdf4' };
                          } else {
                            rowStyle = { backgroundColor: '#e7e8eb' };
                          }
                          return (
                            <tr key={`yr-${index}`} style={rowStyle}>
                              <td style={{ fontWeight: 500 }}>{month.name}</td>
                              <td className='text-center'>
                                <div style={{ color: '#3b82f6' }}>
                                  {formatHours(month.totals.study)}
                                </div>
                                <div style={{ fontSize: 12, color: '#9ca3af' }}>
                                  ({month.averages.study}/day)
                                </div>
                              </td>
                              <td className='text-center'>
                                <div style={{ color: '#a855f7' }}>
                                  {formatHours(month.totals.sleep)}
                                </div>
                                <div style={{ fontSize: 12, color: '#9ca3af' }}>
                                  ({month.averages.sleep}/day)
                                </div>
                              </td>
                              <td className='text-center'>
                                <div style={{ color: '#ef4444' }}>
                                  {formatHours(month.totals.wasted)}
                                </div>
                                <div style={{ fontSize: 12, color: '#9ca3af' }}>
                                  ({month.averages.wasted}/day)
                                </div>
                              </td>
                              <td className='text-center'>
                                {month.daysTracked}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot id='yearly-table-footer'>
                        <tr className='year-total'>
                          <td>Year Total</td>
                          <td
                            className='text-center'
                            style={{ color: '#3b82f6' }}
                          >
                            {yearTotals.study.toFixed(1)}
                          </td>
                          <td
                            className='text-center'
                            style={{ color: '#a855f7' }}
                          >
                            {yearTotals.sleep.toFixed(1)}
                          </td>
                          <td
                            className='text-center'
                            style={{ color: '#ef4444' }}
                          >
                            {yearTotals.wasted.toFixed(1)}
                          </td>
                          <td className='text-center'>
                            {yearTotals.daysTracked}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div id='yearly-patterns' className='pattern-list'>
                    {patterns.length > 0 && (
                      <div>
                        <h3
                          style={{
                            fontWeight: 600,
                            marginBottom: 12,
                            marginTop: 24,
                            paddingTop: 16,
                            borderTop: '1px solid #e5e7eb',
                          }}
                        >
                          Top Wasted Time Patterns (All Time)
                        </h3>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns:
                              'repeat(auto-fit, minmax(300px,1fr))',
                            gap: 16,
                          }}
                        >
                          {patterns.slice(0, 10).map((item, idx) => (
                            <div
                              key={`pat-${idx}`}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: 12,
                                background: '#fef2f2',
                                borderRadius: 8,
                              }}
                            >
                              <span style={{ fontWeight: 500 }}>
                                {item.pattern}
                              </span>
                              <span
                                style={{ color: '#ef4444', fontWeight: 'bold' }}
                              >
                                {item.count} times
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Pomodoro Timer View */}
        <div
          id='pomodoro-view'
          className={`view ${viewMode === 'pomodoro' ? '' : 'hidden'}`}
        >
          <div className='container'>
            <h1>Pomodoro Timer</h1>
            <div className='input-group'>
              <input
                type='number'
                id='hours'
                min={0}
                max={10}
                placeholder='Enter hours (0-10)'
                value={hoursInput}
                onChange={(e) => setHoursInput(e.target.value)}
              />
              <input
                type='number'
                id='minutes'
                min={0}
                max={59}
                placeholder='Enter minutes (0-59)'
                value={minutesInput}
                onChange={(e) => setMinutesInput(e.target.value)}
              />
              <input
                type='text'
                id='taskInput'
                placeholder='Enter task message'
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
              />
              <button onClick={setPomodoroTime}>Set</button>
            </div>
            <div className='timer' id='timer'>{`${pad(
              Math.floor(time / 3600)
            )}:${pad(Math.floor((time % 3600) / 60))}:${pad(time % 60)}`}</div>
            <div className='controls'>
              <button onClick={pauseTimer} id='pauseBtn'>
                {timerRef.current
                  ? 'PAUSE'
                  : time > 0 && !pausedRef.current
                  ? 'PAUSE'
                  : pausedRef.current
                  ? 'RESUME'
                  : 'PAUSE'}
              </button>
              <button onClick={resetTimer}>RESET</button>
            </div>
            <div id='progress'>
              <div
                id='progress-bar'
                style={{ width: `${pomodoroProgress}%` }}
              ></div>
            </div>
            <div id='task'>Task: {taskMessage}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
