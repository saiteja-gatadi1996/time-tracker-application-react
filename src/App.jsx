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
import { auth } from './utils/firebase';
import { signInGoogle } from './utils/firebase';
import { ADMIN, DS_KEY, SOURCE } from './utils/constants';

export default function App() {
  const [view, setView] = useState('hourly');

  // auth
  const [user, setUser] = useState(null);
  useEffect(() => {
    const off = onAuthStateChanged(auth, setUser);
    return () => off();
  }, []);
  const isAdmin = user?.uid === ADMIN.UID;

  // data source
  const readSource = () => localStorage.getItem(DS_KEY) || SOURCE.LIVE;
  const [source, setSource] = useState(readSource);

  useEffect(() => {
    if (!localStorage.getItem(DS_KEY)) {
      localStorage.setItem(DS_KEY, SOURCE.LIVE);
    }
    const sync = () => setSource(readSource());
    window.addEventListener('storage', sync);
    window.addEventListener('datasource:changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('datasource:changed', sync);
    };
  }, []);

  const isLive = source !== SOURCE.LOCAL;
  const bannerText = isLive
    ? isAdmin
      ? 'Saiteja · LIVE (you publish by editing your private copy)'
      : 'Saiteja · LIVE (read-only)'
    : 'Your Tracker (private on this device)';

  const signIn = async () => {
    await signInGoogle();
  };
  const signOut = async () => {
    await fbSignOut(auth);
  };

  return (
    <TimeStoreProvider>
      <PomodoroProvider>
        <div className='container'>
          <header className='header'>
            {/* TOP BAR: title left, auth right */}
            <div className='header-bar'>
              <h1 className='title'>⏰ Time Tracker Application</h1>

              <div className='auth-box'>
                {user ? (
                  <>
                    <div className='auth-id'>
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt='avatar'
                          className='auth-avatar'
                          referrerPolicy='no-referrer'
                        />
                      ) : null}
                      <span className='auth-text'>
                        Signed in as <strong>{user.email}</strong>
                      </span>
                    </div>
                    <button className='button' onClick={signOut}>
                      Sign out
                    </button>
                  </>
                ) : (
                  <button className='button' onClick={signIn}>
                    Sign in with Google
                  </button>
                )}
              </div>
            </div>

            {/* Navigation */}
            <NavBar view={view} setView={setView} />

            {/* Data Source switcher (Local vs LIVE) */}
            <LiveSwitcher />

            {/* Mode banner */}
            <div
              className='mode-banner'
              style={{
                marginTop: 8,
                padding: '10px 12px',
                borderRadius: 8,
                background: isLive ? '#f0fdf4' : '#f3f4f6',
                border: '1px solid #e5e7eb',
                fontSize: 14,
              }}
            >
              Viewing: <strong>{bannerText}</strong>
              {isLive && (
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
