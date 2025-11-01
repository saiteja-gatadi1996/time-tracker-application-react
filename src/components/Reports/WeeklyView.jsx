import React from 'react';
import { useTimeStore } from '../../store/useTimeStore';
import { weeklyReport } from '../../utils/report';
export default function WeeklyView() {
  const { reportRange, setReportRange, dailyData } = useTimeStore();
  const weeks = weeklyReport(reportRange, dailyData);
  return (
    <div className='card'>
      <div className='card-header'>
        <h2 className='card-title'>
          Weekly Report -{' '}
          <span>
            {reportRange.toLocaleString('default', {
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </h2>
        <div className='nav-buttons'>
          <button
            className='icon-button'
            onClick={() =>
              setReportRange(
                new Date(
                  reportRange.getFullYear(),
                  reportRange.getMonth() - 1,
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
              setReportRange(
                new Date(
                  reportRange.getFullYear(),
                  reportRange.getMonth() + 1,
                  1
                )
              )
            }
          >
            ›
          </button>
        </div>
      </div>
      <div>
        {weeks.map((w) => (
          <div key={`wk-${w.weekNum}`} className='week-card'>
            <h3 style={{ fontWeight: 600, marginBottom: 12 }}>
              Week {w.weekNum} ({w.days} days)
            </h3>
            <div className='stats-grid'>
              <div>
                <span style={{ color: '#6b7280', fontSize: 14 }}>Study</span>
                <div
                  style={{ fontSize: 18, fontWeight: 600, color: '#3b82f6' }}
                >
                  Avg: {w.avgStudy} hrs/day
                </div>
                <div style={{ fontSize: 14, color: '#9ca3af' }}>
                  Total: {w.totalStudy} hrs
                </div>
              </div>
              <div>
                <span style={{ color: '#6b7280', fontSize: 14 }}>Sleep</span>
                <div
                  style={{ fontSize: 18, fontWeight: 600, color: '#a855f7' }}
                >
                  Avg: {w.avgSleep} hrs/day
                </div>
                <div style={{ fontSize: 14, color: '#9ca3af' }}>
                  Total: {w.totalSleep} hrs
                </div>
              </div>
              <div>
                <span style={{ color: '#6b7280', fontSize: 14 }}>Wasted</span>
                <div
                  style={{ fontSize: 18, fontWeight: 600, color: '#ef4444' }}
                >
                  Avg: {w.avgWasted} hrs/day
                </div>
                <div style={{ fontSize: 14, color: '#9ca3af' }}>
                  Total: {w.totalWasted} hrs
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
