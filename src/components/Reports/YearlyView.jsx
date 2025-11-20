import React from 'react';
import { useTimeStore } from '../../store/useTimeStore';
import { monthlyReport, patternAnalysis } from '../../utils/report';

export default function YearlyView() {
  const { reportRange, setReportRange, dailyData, wastedPatterns } =
    useTimeStore();

  const year = reportRange.getFullYear();
  const cm = new Date().getMonth();
  const cy = new Date().getFullYear();

  const months = [...Array(12).keys()].map((m) => {
    const date = new Date(year, m, 1);
    return {
      index: m, // keep original month index
      name: date.toLocaleString('default', { month: 'long' }),
      ...monthlyReport(date, dailyData),
    };
  });

  const totals = months.reduce(
    (a, m) => ({
      study: a.study + m.totals.study,
      sleep: a.sleep + m.totals.sleep,
      wasted: a.wasted + m.totals.wasted,
      daysTracked: a.daysTracked + m.daysTracked,
    }),
    { study: 0, sleep: 0, wasted: 0, daysTracked: 0 }
  );

  const pats = patternAnalysis(wastedPatterns);

  // 🔹 Only show months with data in the current year
  const visibleMonths = months.filter((m) => {
    const totalHours = m.totals.study + m.totals.sleep + m.totals.wasted;
    const isCur = year === cy && m.index === cm;

    if (year === cy) {
      // Show current month always, and any month where something is filled
      return isCur || totalHours > 0 || m.daysTracked > 0;
    }

    // For past/future years: keep all months (or change to same rule if you prefer)
    return true;
  });

  return (
    <div className='card'>
      <div className='card-header'>
        <h2 className='card-title'>
          Yearly Report - <span>{year}</span>
        </h2>
        <div className='nav-buttons'>
          <button
            className='icon-button'
            onClick={() =>
              setReportRange(new Date(year - 1, reportRange.getMonth(), 1))
            }
          >
            ‹
          </button>
          <button
            className='icon-button'
            onClick={() =>
              setReportRange(new Date(year + 1, reportRange.getMonth(), 1))
            }
          >
            ›
          </button>
        </div>
      </div>

      <div className='overflow-x-auto'>
        <table className='yearly-view'>
          <thead>
            <tr>
              <th>Month</th>
              <th className='text-center'>Study (hrs)</th>
              <th className='text-center'>Sleep (hrs)</th>
              <th className='text-center'>Wasted (hrs)</th>
              <th className='text-center'>Days Tracked</th>
            </tr>
          </thead>

          <tbody>
            {visibleMonths.map((m) => {
              const isTracked = m.daysTracked > 0;
              const isCur = year === cy && m.index === cm;

              let style;
              if (isCur) {
                style = {
                  background: 'linear-gradient(to right, #faf5ff, #add8e6)',
                };
              } else if (isTracked) {
                style = { backgroundColor: '#f0fdf4' };
              } else {
                style = { backgroundColor: '#e7e8eb' };
              }

              return (
                <tr key={`m-${m.index}`} style={style}>
                  <td style={{ fontWeight: 500 }}>{m.name}</td>
                  <td className='text-center'>
                    <div style={{ color: '#3b82f6' }}>
                      {m.totals.study.toFixed(1)}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                      ({m.averages.study}/day)
                    </div>
                  </td>
                  <td className='text-center'>
                    <div style={{ color: '#a855f7' }}>
                      {m.totals.sleep.toFixed(1)}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                      ({m.averages.sleep}/day)
                    </div>
                  </td>
                  <td className='text-center'>
                    <div style={{ color: '#ef4444' }}>
                      {m.totals.wasted.toFixed(1)}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                      ({m.averages.wasted}/day)
                    </div>
                  </td>
                  <td className='text-center'>{m.daysTracked}</td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr className='year-total'>
              <td>Year Total</td>
              <td className='text-center' style={{ color: '#3b82f6' }}>
                {totals.study.toFixed(1)}
              </td>
              <td className='text-center' style={{ color: '#a855f7' }}>
                {totals.sleep.toFixed(1)}
              </td>
              <td className='text-center' style={{ color: '#ef4444' }}>
                {totals.wasted.toFixed(1)}
              </td>
              <td className='text-center'>{totals.daysTracked}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className='pattern-list'>
        {pats.length > 0 && (
          <div>
            <h3
              style={{
                fontWeight: 600,
                marginBottom: 12,
                marginTop: 24,
                paddingTop: 16,
                borderTop: '1px solid #e5e7eb',
              }}
            >
              Top Wasted Time Patterns (All Time)
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))',
                gap: 16,
              }}
            >
              {pats.slice(0, 10).map((it, idx) => (
                <div
                  key={`p-${idx}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 12,
                    background: '#fef2f2',
                    borderRadius: 8,
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{it.pattern}</span>
                  <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                    {it.count} times
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
