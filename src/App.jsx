import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { TimeStoreProvider } from './store/useTimeStore';
import { PomodoroProvider } from './store/usePomodoro';
import NavBar from './components/NavBar';
import HourlyView from './components/Hourly/HourlyView';
import InputView from './components/Input/InputView';
import DailyView from './components/Reports/DailyView';
import WeeklyView from './components/Reports/WeeklyView';
import MonthlyView from './components/Reports/MonthlyView';
import YearlyView from './components/Reports/YearlyView';
import PomodoroView from './components/Pomodoro/PomodoroView';
import LiveSwitcher from './components/LiveSwitcher';
import './styles/time-tracker.css';
import { auth, signInGoogle } from './utils/firebase';
import { ADMIN, DS_KEY, SOURCE } from './utils/constants';

export default function App() {
  const [view, setView] = useState('hourly');

  // auth state
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(''); // for “only admin can sign in” message

  useEffect(() => {
    const off = onAuthStateChanged(auth, setUser);
    return () => off();
  }, []);
  const isAdmin =
    !!user && (user.uid === ADMIN.UID || user.email === ADMIN.EMAIL);

  // data source (LIVE vs LOCAL)
  const readSource = () => localStorage.getItem(DS_KEY) || SOURCE.LIVE;
  const [source, setSource] = useState(readSource);

  useEffect(() => {
    if (!localStorage.getItem(DS_KEY)) {
      localStorage.setItem(DS_KEY, SOURCE.LIVE); // default first-time visitors: LIVE
    }
    const sync = () => setSource(readSource());
    window.addEventListener('storage', sync);
    window.addEventListener('datasource:changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('datasource:changed', sync);
    };
  }, []);

  const isLive = isAdmin ? false : source !== SOURCE.LOCAL;

  const bannerText = isLive
    ? 'Saiteja · LIVE (read-only)'
    : isAdmin
    ? 'Your Tracker (admin · cloud-synced across devices)'
    : 'Your Tracker (private on this device)';

  // --- Auth handlers ---
  const signIn = async () => {
    setAuthError('');
    try {
      const u = await signInGoogle(); // returns Firebase user
      // Gate immediately by email + uid
      const ok = u && (u.email === ADMIN.EMAIL || u.uid === ADMIN.UID);

      if (!ok) {
        // Show a clear error and sign them out right away
        setAuthError('Only admin can sign in. You are viewing read-only.');
        try {
          await fbSignOut(auth);
        } catch {}
      }
    } catch (err) {
      setAuthError('Sign in failed. Please try again.');
      // optional: console.error(err);
    }
  };

  const signOut = async () => {
    setAuthError('');
    try {
      await fbSignOut(auth);
    } catch {}
  };

  return (
    <TimeStoreProvider>
      <PomodoroProvider>
        <div
          className={`container ${view === 'hourly' ? 'hourly-layout' : ''}`}
        >
          <header
            className={`header ${view === 'hourly' ? 'hourly-header' : ''}`}
          >
            {/* TOP BAR: title left, auth right */}
            <div className='header-bar'>
              <h1 className='title'>⏰ Time Tracker Application</h1>

              {/* Auth (always visible; gated on action) */}
              <div className='auth-box'>
                {user ? (
                  <>
                    <span className='auth-id'>
                      {user.photoURL ? (
                        <img
                          className='auth-avatar'
                          src={user.photoURL}
                          alt=''
                        />
                      ) : null}
                      Signed in as <strong>{user.email}</strong>
                    </span>
                    <button className='button' onClick={signOut}>
                      Sign out
                    </button>
                  </>
                ) : (
                  <button className='button' onClick={signIn}>
                    Sign in with Google (Admin Only)
                  </button>
                )}
              </div>
            </div>

            {/* Small inline error (dismisses on next attempt / sign out) */}
            {authError && (
              <div
                style={{
                  marginTop: 8,
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: 13,
                }}
              >
                {authError}
              </div>
            )}

            {/* Navigation */}
            <NavBar view={view} setView={setView} />

            {/* Data Source switcher (Local vs LIVE) */}
            <LiveSwitcher isAdmin={isAdmin} />

            {/* Mode banner */}
            <div
              className='mode-banner'
              style={{
                marginTop: 18,
                padding: '10px 12px',
                borderRadius: 8,
                background: isLive ? '#f0fdf4' : '#f3f4f6',
                border: '1px solid #e5e7eb',
                fontSize: 14,
              }}
            >
              Viewing: <strong>{bannerText}</strong>
              {isLive && !isAdmin && (
                <span style={{ marginLeft: 8 }}>
                  🔒 read-only UI; edits blocked
                </span>
              )}
            </div>
          </header>

          {view === 'hourly' && <HourlyView />}
          {view === 'input' && <InputView />}
          {view === 'daily' && <DailyView />}
          {view === 'weekly' && <WeeklyView />}
          {view === 'monthly' && <MonthlyView />}
          {view === 'yearly' && <YearlyView />}
          {view === 'pomodoro' && <PomodoroView />}
        </div>
      </PomodoroProvider>
    </TimeStoreProvider>
  );
}
