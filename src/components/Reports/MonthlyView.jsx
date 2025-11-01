import React from 'react';
import { useTimeStore } from '../../store/useTimeStore';
import { monthlyReport, weeklyReport } from '../../utils/report';
export default function MonthlyView() {
  const { reportRange, setReportRange, dailyData } = useTimeStore();
  const rep = monthlyReport(reportRange, dailyData),
    weeks = weeklyReport(reportRange, dailyData);
  return (
    <div className='card'>
      <div className='card-header'>
        <h2 className='card-title'>
          Monthly Report -{' '}
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
      <div className='stats-grid'>
        <div className='stat-card blue'>
          <span style={{ color: '#6b7280', fontSize: 14 }}>Total Study</span>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#3b82f6' }}>
            {rep.totals.study.toFixed(1)} hrs
          </div>
          <div style={{ fontSize: 14, color: '#9ca3af' }}>
            Avg: {rep.averages.study} hrs/day
          </div>
        </div>
        <div className='stat-card purple'>
          <span style={{ color: '#6b7280', fontSize: 14 }}>Total Sleep</span>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#a855f7' }}>
            {rep.totals.sleep.toFixed(1)} hrs
          </div>
          <div style={{ fontSize: 14, color: '#9ca3af' }}>
            Avg: {rep.averages.sleep} hrs/day
          </div>
        </div>
        <div className='stat-card red'>
          <span style={{ color: '#6b7280', fontSize: 14 }}>Total Wasted</span>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ef4444' }}>
            {rep.totals.wasted.toFixed(1)} hrs
          </div>
          <div style={{ fontSize: 14, color: '#9ca3af' }}>
            Avg: {rep.averages.wasted} hrs/day
          </div>
        </div>
      </div>
      <div style={{ margin: '24px 0' }}>
        <p style={{ color: '#6b7280' }}>
          Days tracked: {rep.daysTracked} / {rep.daysInMonth}
        </p>
      </div>
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
        <h3 style={{ fontWeight: 600, marginBottom: 12 }}>Weekly Breakdown</h3>
        <div>
          {weeks.map((w) => (
            <div
              key={`wb-${w.weekNum}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 12,
                background: '#f9fafb',
                borderRadius: 8,
                marginBottom: 8,
              }}
            >
              <span className='weekly-breakdown' style={{ fontWeight: 500 }}>
                Week {w.weekNum}
              </span>
              <div style={{ display: 'flex', gap: 16, fontSize: 14 }}>
                <span style={{ color: '#3b82f6' }}>
                  Study: {w.avgStudy} hrs/day
                </span>
                <span style={{ color: '#a855f7' }}>
                  Sleep: {w.avgSleep} hrs/day
                </span>
                <span style={{ color: '#ef4444' }}>
                  Wasted: {w.avgWasted} hrs/day
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
