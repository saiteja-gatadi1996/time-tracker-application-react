// usePomodoro.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { STORAGE } from '../utils/constants';
import { pad } from '../utils/date';

const PCtx = createContext(null);

export const PomodoroProvider = ({ children }) => {
  // visible state
  const [time, setTime] = useState(0); // seconds remaining
  const [totalTime, setTotal] = useState(0); // total seconds
  const [task, setTask] = useState('Not set');

  // form inputs
  const [h, setH] = useState('');
  const [m, setM] = useState('');
  const [msg, setMsg] = useState('');

  // run state
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // internals
  const timerRef = useRef(null);
  const endAtRef = useRef(null); // absolute timestamp in ms when timer ends

  // ---- restore from storage on mount ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE.POMODORO);
      if (!raw) return;

      const {
        isRunning: sRun = false,
        isPaused: sPaused = false,
        endAt = null,
        totalSec = 0,
        timeRemaining = 0,
        taskMessage = 'Not set',
      } = JSON.parse(raw) || {};

      setTotal(totalSec || 0);
      setTask(taskMessage || 'Not set');

      if (sRun && !sPaused && endAt && endAt > Date.now()) {
        // still running; compute live remaining & start ticking
        endAtRef.current = endAt;
        const rem = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
        setTime(rem);
        setIsRunning(true);
        setIsPaused(false);
        startInterval();
      } else if (sRun && sPaused && timeRemaining > 0) {
        // paused; keep remaining, don't tick
        endAtRef.current = null;
        setTime(timeRemaining);
        setIsRunning(true);
        setIsPaused(true);
      } else {
        // finished or invalid
        hardStop();
      }
    } catch {
      // ignore corrupt storage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- persist + update tab title whenever state changes ----
  useEffect(() => {
    const hh = Math.floor(time / 3600);
    const mm = Math.floor((time % 3600) / 60);
    const ss = time % 60;
    document.title = `${pad(hh)}:${pad(mm)}:${pad(ss)} - Time Tracker`;

    try {
      localStorage.setItem(
        STORAGE.POMODORO,
        JSON.stringify({
          isRunning,
          isPaused,
          endAt: endAtRef.current,
          totalSec: totalTime,
          timeRemaining: time,
          taskMessage: task,
        })
      );
    } catch {}
  }, [time, totalTime, task, isRunning, isPaused]);

  // ---- interval tick using absolute endAt ----
  const startInterval = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      if (!endAtRef.current) return;
      const rem = Math.max(
        0,
        Math.ceil((endAtRef.current - Date.now()) / 1000)
      );
      setTime(rem);
      if (rem <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        endAtRef.current = null;
        setIsRunning(false);
        setIsPaused(false);
        setTotal(0);
        setTask('Not set');
        alert('Time is up!');
      }
    }, 1000);
  };

  const clearIntervalSafe = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const hardStop = () => {
    clearIntervalSafe();
    endAtRef.current = null;
    setIsRunning(false);
    setIsPaused(false);
    setTime(0);
    setTotal(0);
    setTask('Not set');
  };

  // ---- actions exposed to UI ----
  const setTimer = () => {
    const hh = Math.max(0, Math.min(10, parseInt(h || '0', 10)));
    const mm = Math.max(0, Math.min(59, parseInt(m || '0', 10)));
    const total = hh * 3600 + mm * 60;

    if (total <= 0) {
      hardStop();
      return;
    }

    setTotal(total);
    setTime(total);
    setTask(`${(msg || 'Not set').trim()} (${hh}h ${mm}m)`);

    // start immediately and persist as running
    endAtRef.current = Date.now() + total * 1000;
    setIsRunning(true);
    setIsPaused(false);
    clearIntervalSafe();
    startInterval();
  };

  // toggle Pause <-> Resume
  const pause = () => {
    if (!isRunning) return;

    if (!isPaused) {
      // Pause -> freeze remaining at this instant
      const rem = endAtRef.current
        ? Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000))
        : time;
      clearIntervalSafe();
      endAtRef.current = null;
      setTime(rem);
      setIsPaused(true);
    } else if (time > 0) {
      // Resume -> set a new endAt from remaining and tick
      endAtRef.current = Date.now() + time * 1000;
      setIsPaused(false);
      clearIntervalSafe();
      startInterval();
    }
  };

  // full reset (only way to stop completely)
  const reset = () => {
    hardStop();
    setH('');
    setM('');
    setMsg('');
    try {
      localStorage.removeItem(STORAGE.POMODORO);
    } catch {}
  };

  const progress = totalTime > 0 ? ((totalTime - time) / totalTime) * 100 : 0;

  const ctx = {
    time,
    totalTime,
    task,

    // inputs
    h,
    m,
    msg,
    setH,
    setM,
    setMsg,

    // actions
    setTimer, // Set -> auto-starts
    pause, // toggles Pause/Resume
    reset, // stop completely

    // derived
    progress,
    isPaused, // for PAUSE/RESUME label
  };

  return <PCtx.Provider value={ctx}>{children}</PCtx.Provider>;
};

export const usePomodoro = () => useContext(PCtx);
