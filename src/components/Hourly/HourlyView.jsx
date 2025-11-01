import React from 'react';
import { useTimeStore } from '../../store/useTimeStore';
import { formatHours, getDateKey, isPast } from '../../utils/date';
import HourlyChips from './HourlyChips';
import HourlyTable from './HourlyTable';
import ReflectionCard from './ReflectionCard';
import ExportImport from './ExportImport';
export default function HourlyView() {
  const { selectedDate, setSelectedDate, derived, dateKey } = useTimeStore();
  const accountedWarn = derived?.accounted > 24.001;
  return (
    <div className='grid-container'>
      <div className='card'>
        <div className='card-header'>
          <h2 className='card-title'>
            Hourly Tracker — <span>{selectedDate.toDateString()}</span>
          </h2>
          <div className='nav-buttons'>
            <button
              className='icon-button'
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 1);
                setSelectedDate(d);
              }}
            >
              ‹
            </button>
            <button
              className='icon-button'
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + 1);
                setSelectedDate(d);
              }}
            >
              ›
            </button>
          </div>
        </div>
        {isPast(dateKey) && (
          <p
            style={{
              color: '#991b1b',
              fontSize: 24,
              fontStyle: 'italic',
              fontWeight: 600,
              margin: '0 0 12px 0',
              padding: '4px 14px',
              borderRadius: 10,
              background: '#fef2f2',
            }}
          >
            You cannot change the past; you can only learn from it.
          </p>
        )}
        <HourlyChips
          study={formatHours(derived?.study || 0)}
          sleep={formatHours(derived?.sleep || 0)}
          wasted={formatHours(derived?.wasted || 0)}
          accounted={formatHours(derived?.accounted || 0)}
        />
        <HourlyTable />
        {accountedWarn && (
          <p className='warning-text' style={{ marginTop: 8 }}>
            ⚠️ Accounted time exceeds 24 hours!
          </p>
        )}
      </div>
      <div className='card'>
        <ReflectionCard />
        <ExportImport />
      </div>
    </div>
  );
}
