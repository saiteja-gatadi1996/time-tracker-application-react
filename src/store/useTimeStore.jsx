import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { STORAGE, MAIN_ACTIVITIES } from '../utils/constants';
import { formatHours, getDateKey, isPast } from '../utils/date';
import { persistAll, recomputeFromHourly } from '../utils/persistence';
import {
  autoCalcPatterns,
  countMiscHours,
  halfToHours,
  recalcTotalsOnly,
} from '../utils/report';
const Ctx = createContext(null);
export const TimeStoreProvider = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [reportRange, setReportRange] = useState(() => new Date());

  const [dailyData, setDailyData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE.DAILY)) || {};
    } catch {
      return {};
    }
  });
  const [hourlyData, setHourlyData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE.HOURLY)) || {};
    } catch {
      return {};
    }
  });
  const [wastedPatterns, setWastedPatterns] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE.PATTERNS)) || {};
    } catch {
      return {};
    }
  });
  const [reflections, setReflections] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE.REFLECTIONS)) || {};
    } catch {
      return {};
    }
  });
  const [pomodoro, setPomodoro] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem(STORAGE.POMODORO)) || {
          isRunning: false,
          isPaused: false,
          endAt: null,
          totalMs: 0,
          remainingMs: 0,
          task: 'Not set',
        }
      );
    } catch {
      return {
        isRunning: false,
        isPaused: false,
        endAt: null,
        totalMs: 0,
        remainingMs: 0,
        task: 'Not set',
      };
    }
  });

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
  const dateKey = useMemo(() => getDateKey(selectedDate), [selectedDate]);

  const derived = useMemo(() => {
    if (hourlyData[dateKey]) return recalcTotalsOnly(dateKey, hourlyData);
    const base = dailyData[dateKey] || { study: 0, sleep: 0, wasted: 0 };
    return {
      ...base,
      accounted: (base.study || 0) + (base.sleep || 0) + (base.wasted || 0),
    };
  }, [hourlyData, dailyData, dateKey]);

  const setHalfActivity = (k, h, half, value) => {
    if (isPast(k)) return alert('Cannot edit past days.');

    setHourlyData((prev) => {
      const day = prev[k]
        ? [...prev[k]]
        : Array.from({ length: 24 }, () => ({ first: null, second: null }));

      const row = { ...day[h] };
      if (value === 'Back') row[half] = null;
      else if (value === 'MISC')
        return prev; // ignore toggle here; UI handles it
      else row[half] = value;
      day[h] = row;

      const next = { ...prev, [k]: day };

      // recompute totals from *this* updated day
      let s = 0,
        sl = 0,
        w = 0;
      day.forEach((r) => {
        s +=
          halfToHours(r.first, 'Studying') + halfToHours(r.second, 'Studying');
        sl +=
          halfToHours(r.first, 'Sleeping') + halfToHours(r.second, 'Sleeping');
        w += halfToHours(r.first, 'Wasted') + halfToHours(r.second, 'Wasted');
      });

      // push dependent state from the same updated snapshot
      setDailyData((p) => ({ ...p, [k]: { study: s, sleep: sl, wasted: w } }));
      setWastedPatterns((p) => ({ ...p, [k]: autoCalcPatterns(k, next) }));

      return next;
    });
  };

  // tick while running (resume automatically after reload)
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (pomodoro.isRunning && !pomodoro.isPaused) {
      const id = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(id);
    }
  }, [pomodoro.isRunning, pomodoro.isPaused]);

  const timeLeftMs = useMemo(() => {
    if (pomodoro.isRunning && !pomodoro.isPaused && pomodoro.endAt) {
      return Math.max(0, pomodoro.endAt - now);
    }
    return pomodoro.remainingMs || 0;
  }, [pomodoro, now]);

  // complete when countdown hits zero
  useEffect(() => {
    if (
      pomodoro.isRunning &&
      !pomodoro.isPaused &&
      pomodoro.endAt &&
      pomodoro.endAt <= now
    ) {
      setPomodoro({
        isRunning: false,
        isPaused: false,
        endAt: null,
        totalMs: 0,
        remainingMs: 0,
        task: 'Not set',
      });
    }
  }, [now, pomodoro.isRunning, pomodoro.isPaused, pomodoro.endAt]);

  // persist pomodoro on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE.POMODORO, JSON.stringify(pomodoro));
    } catch {}
  }, [pomodoro]);

  // actions
  const setPomodoroTime = ({ hours = 0, minutes = 0, task = '' }) => {
    const h = Math.max(0, Math.min(10, parseInt(hours, 10) || 0));
    const m = Math.max(0, Math.min(59, parseInt(minutes, 10) || 0));
    const totalMs = (h * 3600 + m * 60) * 1000;
    if (totalMs <= 0) {
      setPomodoro({
        isRunning: false,
        isPaused: false,
        endAt: null,
        totalMs: 0,
        remainingMs: 0,
        task: 'Not set',
      });
      return;
    }
    setPomodoro({
      isRunning: true,
      isPaused: false,
      endAt: Date.now() + totalMs, // start immediately
      totalMs,
      remainingMs: totalMs,
      task: task.trim() || 'Not set',
    });
  };

  const togglePausePomodoro = () => {
    setPomodoro((p) => {
      if (!p.isRunning) return p;
      if (p.isPaused) {
        // resume
        const endAt = Date.now() + (p.remainingMs || 0);
        return { ...p, isPaused: false, endAt };
      } else {
        // pause
        const remainingMs = p.endAt
          ? Math.max(0, p.endAt - Date.now())
          : p.remainingMs || 0;
        return { ...p, isPaused: true, endAt: null, remainingMs };
      }
    });
  };

  const resetPomodoro = () => {
    setPomodoro({
      isRunning: false,
      isPaused: false,
      endAt: null,
      totalMs: 0,
      remainingMs: 0,
      task: 'Not set',
    });
    try {
      localStorage.removeItem(STORAGE.POMODORO);
    } catch {}
  };

  const pomodoroView = useMemo(() => {
    const totalSec = Math.round((pomodoro.totalMs || 0) / 1000);
    const timeLeftSec = Math.round(timeLeftMs / 1000);
    return {
      totalSec,
      timeLeftSec,
      progress: totalSec > 0 ? (1 - timeLeftSec / totalSec) * 100 : 0,
      task: pomodoro.task,
      isRunning: pomodoro.isRunning,
      isPaused: pomodoro.isPaused,
    };
  }, [pomodoro, timeLeftMs]);

  const handleInputChange = (k, kind, val) => {
    const d = dailyData[k] || { study: 0, sleep: 0, wasted: 0 };
    const v = parseFloat(val) || 0;
    const n = { ...d, [kind]: v };
    setDailyData((prev) => ({ ...prev, [k]: n }));
  };
  const addPattern = (k, txt) => {
    if (!txt) return;
    setWastedPatterns((p) => {
      const a = p[k] ? [...p[k]] : [];
      a.push(txt);
      return { ...p, [k]: a };
    });
  };
  const removePattern = (k, i) =>
    setWastedPatterns((p) => {
      const a = p[k] ? [...p[k]] : [];
      a.splice(i, 1);
      return { ...p, [k]: a };
    });
  const exportAll = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          { dailyData, hourlyData, wastedPatterns, reflections },
          null,
          2
        ),
      ],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-tracker-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  // const importAll = (obj) => {
  //   setDailyData(obj.dailyData || {});
  //   setHourlyData(obj.hourlyData || {});
  //   setWastedPatterns(obj.wastedPatterns || {});
  //   setReflections(obj.reflections || {});
  // };

  function importAll(obj) {
    try {
      let daily = obj?.dailyData || {};
      const hourly = obj?.hourlyData || {};
      let patterns = obj?.wastedPatterns || {};
      const refl = obj?.reflections || {};

      if (Object.keys(hourly).length > 0) {
        const rec = recomputeFromHourly(hourly);
        daily = { ...daily, ...rec.daily };
        patterns = { ...patterns, ...rec.patterns };
      }

      setDailyData(daily);
      setHourlyData(hourly);
      setWastedPatterns(patterns);
      setReflections(refl);

      persistAll({ daily, hourly, patterns, reflections: refl });
    } catch (err) {
      console.error('Import failed', err);
      alert('Import failed: invalid JSON');
    }
  }

  const ctx = {
    selectedDate,
    setSelectedDate,
    currentMonth,
    setCurrentMonth,
    reportRange,
    setReportRange,
    dailyData,
    setDailyData,
    hourlyData,
    setHourlyData,
    wastedPatterns,
    setWastedPatterns,
    reflections,
    setReflections,
    dateKey,
    derived,
    setHalfActivity,
    handleInputChange,
    addPattern,
    removePattern,
    exportAll,
    importAll,
    formatHours,
    countMiscHours,
    MAIN_ACTIVITIES,
    pomodoro: pomodoroView,
    setPomodoroTime,
    togglePausePomodoro,
    resetPomodoro,
  };
  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
};
export const useTimeStore = () => useContext(Ctx);
