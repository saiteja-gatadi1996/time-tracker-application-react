import React, { useState } from 'react';
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
import './styles/time-tracker.css';

export default function App() {
  const [view, setView] = useState('hourly');
  return (
    <TimeStoreProvider>
      <PomodoroProvider>
        <div className='container'>
          <header className='header'>
            <h1 className='title'>⏰ Time Tracker Application</h1>
            <NavBar view={view} setView={setView} />
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
