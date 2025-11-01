import React from 'react';
import { useTimeStore } from '../../store/useTimeStore';
import CalendarGrid from './CalendarGrid';
import Patterns from './Patterns';
export default function InputView() {
  const {
    isReadOnly,
    currentMonth,
    setCurrentMonth,
    dateKey,
    dailyData,
    handleInputChange,
    selectedDate,
  } = useTimeStore();
  const d = dailyData[dateKey] || { study: 0, sleep: 0, wasted: 0 };
  const total = (d.study + d.sleep + d.wasted).toFixed(1);
  const warn = d.study + d.sleep + d.wasted > 24;
  return (
    <div className={`input-view ${isReadOnly ? 'ro' : ''}`}>
      <div className='grid-container'>
        <div className='card'>
          <div className='card-header'>
            <h2 className='card-title'>
              {currentMonth.toLocaleString('default', {
                month: 'long',
                year: 'numeric',
              })}
            </h2>
            <div className='nav-buttons'>
              <button
                className='icon-button'
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() - 1,
                      1
                    )
                  )
                }
              >
                ‹
              </button>
              <button
                className='icon-button'
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() + 1,
                      1
                    )
                  )
                }
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
          <CalendarGrid />
        </div>
        <div className='card'>
          <h2 className='card-title'>
            Data Entry for <span>{selectedDate.toDateString()}</span>
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
            Below data is automatically calculated from the Hourly Tracker. If
            you missed updating it, you can manually enter values here.
          </p>
          <div style={{ marginTop: 24 }}>
            <div className='form-group'>
              <label className='label'> 🧠 Study Hours </label>
              <input
                type='number'
                className='input'
                step='0.5'
                min='0'
                max='24'
                value={d.study}
                onChange={(e) =>
                  handleInputChange(dateKey, 'study', e.target.value)
                }
              />
            </div>
            <div className='form-group'>
              <label className='label'> 🌙 Sleep Hours </label>
              <input
                type='number'
                className='input'
                step='0.5'
                min='0'
                max='24'
                value={d.sleep}
                onChange={(e) =>
                  handleInputChange(dateKey, 'sleep', e.target.value)
                }
              />
            </div>
            <div className='form-group'>
              <label className='label'> ⚠️ Wasted Hours </label>
              <input
                type='number'
                className='input'
                step='0.5'
                min='0'
                max='24'
                value={d.wasted}
                onChange={(e) =>
                  handleInputChange(dateKey, 'wasted', e.target.value)
                }
              />
            </div>
            <Patterns />
            <div className='total-info'>
              <p id='total-hours'>Total accounted: {total} / 24 hours</p>
              <p
                id='warning-message'
                className={`warning-text ${warn ? '' : 'hidden'}`}
              >
                ⚠️ Total exceeds 24 hours!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
