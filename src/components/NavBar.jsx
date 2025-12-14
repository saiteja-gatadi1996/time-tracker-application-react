import React from 'react';

const Btn = ({ active, onClick, children }) => (
  <button className={`button ${active ? 'active' : ''}`} onClick={onClick}>
    {children}
  </button>
);

export default function NavBar({ view, setView }) {
  return (
    <div className='button-group' id='nav-buttons'>
      <Btn active={view === 'hourly'} onClick={() => setView('hourly')}>
        ⏱️ Hourly Tracker
      </Btn>
      <Btn active={view === 'input'} onClick={() => setView('input')}>
        🗓️ Input Data
      </Btn>
      <Btn active={view === 'daily'} onClick={() => setView('daily')}>
        📆 Daily Report
      </Btn>
      <Btn active={view === 'weekly'} onClick={() => setView('weekly')}>
        🧾 Weekly Report
      </Btn>
      <Btn active={view === 'monthly'} onClick={() => setView('monthly')}>
        📋 Monthly Report
      </Btn>
      <Btn active={view === 'yearly'} onClick={() => setView('yearly')}>
        📊 Yearly Report
      </Btn>
      <Btn active={view === 'pomodoro'} onClick={() => setView('pomodoro')}>
        ⏳ Focus Timer
      </Btn>
      <Btn
        active={view === 'accountability'}
        onClick={() => setView('accountability')}
      >
        🎯 Get Better Everyday
      </Btn>
    </div>
  );
}
