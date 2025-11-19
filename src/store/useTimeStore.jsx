import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  STORAGE,
  MAIN_ACTIVITIES,
  ADMIN,
  LIVE,
  DS_KEY,
  SOURCE,
} from '../utils/constants';

import {
  auth,
  db,
  doc,
  onSnapshot,
  setDoc,
  signInGoogle,
  onAuthStateChanged,
} from '../utils/firebase';

import { formatHours, getDateKey, isPast } from '../utils/date';
import { recomputeFromHourly } from '../utils/persistence';
import {
  autoCalcPatterns,
  countMiscHours,
  halfToHours,
  recalcTotalsOnly,
} from '../utils/report';

const Ctx = createContext(null);

const isEmptyObj = (o) =>
  !o || (typeof o === 'object' && Object.keys(o).length === 0);
const hashPayload = (p) => JSON.stringify(p);

export const TimeStoreProvider = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [reportRange, setReportRange] = useState(() => new Date());

  // role: 'viewer' | 'admin' (resolved from auth state)
  const [role, setRole] = useState('viewer');

  // Data source: 'local' (private) or 'live:saiteja' (public live)
  const [dataSource, setDataSource] = useState(() => {
    const src = localStorage.getItem(DS_KEY);
    if (!src) {
      localStorage.setItem(DS_KEY, SOURCE.LIVE); // default new visitors to LIVE
      return SOURCE.LIVE;
    }
    return src;
  });

  // 🔐 Admin: always treated as "local" (editable tracker, synced to Firestore)
  // Viewers: same behavior as before
  const isLocal = role === 'admin' ? true : dataSource === SOURCE.LOCAL;

  // Admin is never read-only; viewers are read-only in LIVE mode
  const isReadOnly = role === 'admin' ? false : !isLocal;

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

  // Keep dataSource in sync across tabs or when LiveSwitcher updates it
  useEffect(() => {
    const sync = () =>
      setDataSource(localStorage.getItem(DS_KEY) || SOURCE.LIVE);
    window.addEventListener('storage', sync);
    window.addEventListener('datasource:changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('datasource:changed', sync);
    };
  }, []);

  // When entering LOCAL mode, hydrate state from localStorage
  useEffect(() => {
    if (!isLocal || role === 'admin') return; // admin will be fed by Firestore
    try {
      setDailyData(JSON.parse(localStorage.getItem(STORAGE.DAILY)) || {});
      setHourlyData(JSON.parse(localStorage.getItem(STORAGE.HOURLY)) || {});
      setWastedPatterns(
        JSON.parse(localStorage.getItem(STORAGE.PATTERNS)) || {}
      );
      setReflections(
        JSON.parse(localStorage.getItem(STORAGE.REFLECTIONS)) || {}
      );
    } catch {}
  }, [isLocal, role]);

  // Persist LOCAL changes to localStorage
  useEffect(() => {
    if (!isLocal) return;
    try {
      localStorage.setItem(STORAGE.DAILY, JSON.stringify(dailyData));
    } catch {}
  }, [dailyData, isLocal]);

  useEffect(() => {
    if (!isLocal) return;
    try {
      localStorage.setItem(STORAGE.HOURLY, JSON.stringify(hourlyData));
    } catch {}
  }, [hourlyData, isLocal]);

  useEffect(() => {
    if (!isLocal) return;
    try {
      localStorage.setItem(STORAGE.PATTERNS, JSON.stringify(wastedPatterns));
    } catch {}
  }, [wastedPatterns, isLocal]);

  useEffect(() => {
    if (!isLocal) return;
    try {
      localStorage.setItem(STORAGE.REFLECTIONS, JSON.stringify(reflections));
    } catch {}
  }, [reflections, isLocal]);

  // Derived day key + computed totals
  const dateKey = useMemo(() => getDateKey(selectedDate), [selectedDate]);

  const derived = useMemo(() => {
    if (hourlyData[dateKey]) return recalcTotalsOnly(dateKey, hourlyData);
    const base = dailyData[dateKey] || { study: 0, sleep: 0, wasted: 0 };
    return {
      ...base,
      accounted: (base.study || 0) + (base.sleep || 0) + (base.wasted || 0),
    };
  }, [hourlyData, dailyData, dateKey]);

  // -----------------------
  // Editing helpers (blocked in LIVE/read-only)
  // -----------------------

  const setWastedReason = (k, h, reason) => {
    if (isReadOnly)
      return alert(
        'Read-only in LIVE mode. Switch to “Your Tracker (private)” to edit.'
      );
    if (isPast(k)) return alert('Cannot edit past days.');

    setHourlyData((prev) => {
      // Normalize day shape so every row has wastedReason
      const day = prev[k]
        ? prev[k].map((row) => ({
            first: row.first ?? null,
            second: row.second ?? null,
            wastedReason: row.wastedReason ?? null,
          }))
        : Array.from({ length: 24 }, () => ({
            first: null,
            second: null,
            wastedReason: null,
          }));

      // 🔹 Empty string means "clear" → store as null
      const normalized = reason === '' || reason === undefined ? null : reason;

      const row = { ...day[h], wastedReason: normalized };
      day[h] = row;

      const next = { ...prev, [k]: day };

      // wasted patterns depend on hourlyData
      setWastedPatterns((p) => ({ ...p, [k]: autoCalcPatterns(k, next) }));

      return next;
    });
  };

  const setHalfActivity = (k, h, half, value) => {
    if (isReadOnly)
      return alert(
        'Read-only in LIVE mode. Switch to “Your Tracker (private)” to edit.'
      );
    if (isPast(k)) return alert('Cannot edit past days.');

    setHourlyData((prev) => {
      const day = prev[k]
        ? [...prev[k]]
        : Array.from({ length: 24 }, () => ({
            first: null,
            second: null,
            wastedReason: null,
          }));

      const row = { ...day[h] };
      if (value === 'Back') row[half] = null;
      else if (value === 'MISC')
        return prev; // UI handles MISC toggles separately
      else row[half] = value;
      day[h] = row;

      const next = { ...prev, [k]: day };

      // recompute totals from this updated day only
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

      setDailyData((p) => ({ ...p, [k]: { study: s, sleep: sl, wasted: w } }));
      setWastedPatterns((p) => ({ ...p, [k]: autoCalcPatterns(k, next) }));

      return next;
    });
  };

  const handleInputChange = (k, kind, val) => {
    if (isReadOnly)
      return alert(
        'Read-only in LIVE mode. Switch to “Your Tracker (private)” to edit.'
      );
    const d = dailyData[k] || { study: 0, sleep: 0, wasted: 0 };
    const v = parseFloat(val) || 0;
    const n = { ...d, [kind]: v };
    setDailyData((prev) => ({ ...prev, [k]: n }));
  };

  const addPattern = (k, txt) => {
    if (isReadOnly)
      return alert(
        'Read-only in LIVE mode. Switch to “Your Tracker (private)” to edit.'
      );
    if (!txt) return;
    setWastedPatterns((p) => {
      const a = p[k] ? [...p[k]] : [];
      a.push(txt);
      return { ...p, [k]: a };
    });
  };

  const removePattern = (k, i) => {
    if (isReadOnly) return;
    setWastedPatterns((p) => {
      const a = p[k] ? [...p[k]] : [];
      a.splice(i, 1);
      return { ...p, [k]: a };
    });
  };

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

  function importAll(obj) {
    if (!isLocal) {
      alert('Switch to “Your Tracker (private)” to import your own data.');
      return;
    }
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
    } catch (err) {
      console.error('Import failed', err);
      alert('Import failed: invalid JSON');
    }
  }

  // -----------------------
  // Pomodoro (local, reload-proof)
  // -----------------------
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

  // persist pomodoro on every change (local-only concept)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE.POMODORO, JSON.stringify(pomodoro));
    } catch {}
  }, [pomodoro]);

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

  // -----------------------
  // LIVE read (subscribe in LIVE mode only)
  // -----------------------
  // -----------------------
  // LIVE read: subscribe to Firestore
  // - Admin: ALWAYS (Your Tracker is Firestore-backed)
  // - Viewer: only when in LIVE mode
  // -----------------------
  useEffect(() => {
    const shouldListen = role === 'admin' || !isLocal;
    if (!shouldListen) return;

    const liveRef = doc(db, 'timetracker', LIVE.DOC_ID);
    const unsub = onSnapshot(liveRef, (snap) => {
      if (!snap.exists()) return;
      const d = snap.data() || {};

      // This is the single source of truth from Firestore
      setDailyData(d.dailyData || {});
      setHourlyData(d.hourlyData || {});
      setWastedPatterns(d.wastedPatterns || {});
      setReflections(d.reflections || {});

      // Cache for publish guard
      liveSnapshotRef.current = d;
      liveHashRef.current = hashPayload({
        dailyData: d.dailyData || {},
        hourlyData: d.hourlyData || {},
        wastedPatterns: d.wastedPatterns || {},
        reflections: d.reflections || {},
      });
    });

    return () => unsub();
  }, [role, isLocal, db]);

  // If admin switches/lands in LOCAL and local is empty, seed from latest LIVE snapshot
  useEffect(() => {
    if (role !== 'admin' || !isLocal) return;

    const localEmpty = [
      dailyData,
      hourlyData,
      wastedPatterns,
      reflections,
    ].every(isEmptyObj);
    if (localEmpty && liveSnapshotRef.current) {
      // prevent the seed from publishing back immediately
      skipNextPublishRef.current = true;

      const d = liveSnapshotRef.current;
      setDailyData(d.dailyData || {});
      setHourlyData(d.hourlyData || {});
      setWastedPatterns(d.wastedPatterns || {});
      setReflections(d.reflections || {});
    }
  }, [role, isLocal]); // don't depend on data objects — we only care about the mode/role

  // -----------------------
  // LIVE snapshot cache + publish guards
  // -----------------------
  const liveSnapshotRef = useRef(null);
  const liveHashRef = useRef('');
  const skipNextPublishRef = useRef(false);
  const saveTimerRef = useRef(null);

  // -----------------------
  // Auth role resolve
  // -----------------------
  useEffect(() => {
    const off = onAuthStateChanged(auth, (user) => {
      if (user?.uid === ADMIN.UID) {
        setRole('admin');
        // 🛡️ On new login, don't immediately publish whatever is in local state
        skipNextPublishRef.current = true;
      } else {
        setRole('viewer');
      }
    });
    return () => off();
  }, []);

  // -----------------------
  // Admin publish: push LOCAL edits to LIVE (debounced)
  // Only if: role === 'admin' AND isLocal === true AND UID matches
  // -----------------------

  // 📝 Publish admin's PRIVATE edits to LIVE (debounced & guarded)
  useEffect(() => {
    if (role !== 'admin') return; // only admin can publish
    if (!isLocal) return; // only from admin's editable tracker

    // 🚫 Skip the first publish tick right after login / seeding
    if (skipNextPublishRef.current) {
      skipNextPublishRef.current = false;
      return;
    }

    // never publish an empty payload (prevents accidental wipes)
    const isEmpty = [dailyData, hourlyData, wastedPatterns, reflections].every(
      isEmptyObj
    );
    if (isEmpty) return;

    const currHash = hashPayload({
      dailyData,
      hourlyData,
      wastedPatterns,
      reflections,
    });
    if (currHash === liveHashRef.current) return; // already in sync with server

    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const liveDoc = doc(db, 'timetracker', LIVE.DOC_ID);
      setDoc(
        liveDoc,
        {
          dailyData,
          hourlyData,
          wastedPatterns,
          reflections,
          updatedAt: Date.now(),
        },
        { merge: true }
      ).catch(console.error);
    }, 600);

    return () => clearTimeout(saveTimerRef.current);
  }, [role, isLocal, dailyData, hourlyData, wastedPatterns, reflections, db]);

  // -----------------------
  // Auth helpers
  // -----------------------
  const loginAsSaiteja = async () => {
    const u = await signInGoogle();
    if (u?.uid === ADMIN.UID) setRole('admin');
    else {
      alert('You are not the admin; staying in read-only.');
      setRole('viewer');
    }
  };

  const viewSaitejaLive = () => setRole('viewer');

  // -----------------------
  // Context value
  // -----------------------
  const ctx = {
    // view/date
    selectedDate,
    setSelectedDate,
    currentMonth,
    setCurrentMonth,
    reportRange,
    setReportRange,

    // data
    dailyData,
    setDailyData,
    hourlyData,
    setHourlyData,
    wastedPatterns,
    setWastedPatterns,
    reflections,
    setReflections,

    // derived
    dateKey,
    derived,

    // actions
    setHalfActivity,
    setWastedReason,
    handleInputChange,
    addPattern,
    removePattern,
    exportAll,
    importAll,

    // utils
    formatHours,
    countMiscHours,
    MAIN_ACTIVITIES,

    // pomodoro surface + actions
    pomodoro: pomodoroView,
    setPomodoroTime,
    togglePausePomodoro,
    resetPomodoro,

    // roles & data source
    role,
    isReadOnly,
    loginAsSaiteja,
    viewSaitejaLive,
    dataSource,
  };

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
};

export const useTimeStore = () => useContext(Ctx);
