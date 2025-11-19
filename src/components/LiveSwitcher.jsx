import React, { useEffect, useState } from 'react';
import { STORAGE, DS_KEY, SOURCE } from '../utils/constants';

export default function LiveSwitcher({ isAdmin }) {
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

  const ensureLocalInit = () => {
    if (!localStorage.getItem(STORAGE.DAILY))
      localStorage.setItem(STORAGE.DAILY, '{}');
    if (!localStorage.getItem(STORAGE.HOURLY))
      localStorage.setItem(STORAGE.HOURLY, '{}');
    if (!localStorage.getItem(STORAGE.PATTERNS))
      localStorage.setItem(STORAGE.PATTERNS, '{}');
    if (!localStorage.getItem(STORAGE.REFLECTIONS))
      localStorage.setItem(STORAGE.REFLECTIONS, '{}');
  };

  const switchToLocal = () => {
    ensureLocalInit();
    localStorage.setItem(DS_KEY, SOURCE.LOCAL);
    window.dispatchEvent(new Event('datasource:changed'));
    setSource(SOURCE.LOCAL);
  };

  const switchToLive = () => {
    localStorage.setItem(DS_KEY, SOURCE.LIVE);
    window.dispatchEvent(new Event('datasource:changed'));
    setSource(SOURCE.LIVE);
  };

  const isLocal = source === SOURCE.LOCAL;

  // 👑 ADMIN VIEW
  // - Only Your Tracker is meaningful
  // - Saiteja LIVE is just a label explaining what viewers see
  if (isAdmin) {
    return (
      <div
        className='total-info'
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginTop: 8,
        }}
      >
        <span style={{ fontSize: 13, color: '#6b7280' }}>Data source:</span>

        <button
          className='button active'
          disabled
          title='This is your Firestore-backed tracker; edits here sync across devices and power Saiteja · LIVE for others.'
        >
          Your Tracker (admin · cloud)
        </button>
      </div>
    );
  }

  // 👥 NON-ADMIN VIEW (unchanged logic)
  return (
    <div
      className='total-info'
      style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        alignItems: 'center',
        marginTop: 8,
      }}
    >
      <span style={{ fontSize: 13, color: '#6b7280' }}>Data source:</span>

      <button
        className={`button ${isLocal ? 'active' : ''}`}
        onClick={switchToLocal}
        aria-pressed={isLocal}
        title='Use your own, private tracker on this device (saved in localStorage).'
      >
        Your Tracker (private)
      </button>

      <button
        className={`button ${!isLocal ? 'active' : ''}`}
        onClick={switchToLive}
        aria-pressed={!isLocal}
        title='View Saiteja’s live tracker (read-only).'
      >
        Saiteja · LIVE (read-only) ✅
      </button>
    </div>
  );
}
