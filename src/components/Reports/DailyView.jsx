import React from 'react';
import { useTimeStore } from '../../store/useTimeStore';

export default function DailyView() {
  const { selectedDate, setSelectedDate, dateKey, dailyData, wastedPatterns } =
    useTimeStore();

  const d = dailyData[dateKey] || { study: 0, sleep: 0, wasted: 0 };
  const patterns = wastedPatterns[dateKey] || [];

  const goPrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const goNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  return (
    <div className='card'>
      <div className='card-header'>
        <h2 className='card-title'>
          Daily Report – <span>{selectedDate.toDateString()}</span>
        </h2>

        <div className='nav-buttons'>
          <button className='icon-button' onClick={goPrevDay}>
            ‹
          </button>
          <button className='icon-button' onClick={goNextDay}>
            ›
          </button>
        </div>
      </div>

      <div className='stats-grid'>
        <div className='stat-card blue'>
          <div className='stat-header'>
            <span>Study</span>
            <span>🧠</span>
          </div>
          <div className='stat-value blue'>{d.study} hrs</div>
        </div>

        <div className='stat-card purple'>
          <div className='stat-header'>
            <span>Sleep</span>
            <span>🌙</span>
          </div>
          <div className='stat-value purple'>{d.sleep} hrs</div>
        </div>

        <div className='stat-card red'>
          <div className='stat-header'>
            <span>Wasted</span>
            <span>⚠️</span>
          </div>
          <div className='stat-value red'>{d.wasted} hrs</div>
        </div>
      </div>

      <div>
        {patterns.length > 0 && (
          <div>
            <h3 style={{ fontWeight: 600, marginBottom: 8 }}>
              Wasted Time Patterns:
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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
    </div>
  );
}
