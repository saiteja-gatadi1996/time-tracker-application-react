import React, { useMemo, useState } from 'react';
import { useTimeStore } from '../../store/useTimeStore';
import { MAIN_ACTIVITIES, MISC_ACTIVITIES } from '../../utils/constants';
import { getDateKey, hourLabel, isPast, timeRange } from '../../utils/date';
import { halfToHours } from '../../utils/report';
export default function HourlyTable() {
  const { selectedDate, hourlyData, setHalfActivity, dateKey } = useTimeStore();
  const [miscMenu, setMiscMenu] = useState({});
  const rows = useMemo(
    () =>
      hourlyData[dateKey] ||
      Array.from({ length: 24 }, () => ({ first: null, second: null })),
    [hourlyData, dateKey]
  );
  const past = isPast(dateKey);
  const toggleKey = (h, half) => `${dateKey}|${h}|${half}`;
  const opts = (cur, key) => {
    const show = miscMenu[key] || (cur && cur.startsWith('MISC-'));
    return show
      ? [
          { value: 'Back', label: 'Back to main' },
          ...MISC_ACTIVITIES.map((a) => ({ value: a, label: a })),
        ]
      : MAIN_ACTIVITIES.map((a) => ({ value: a, label: a }));
  };
  return (
    <div
      className='overflow-x-auto'
      style={{
        maxHeight: '60vh',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
      }}
    >
      <table className='hourly-table' style={{ width: '100%' }}>
        <thead>
          <tr>
            <th className='text-center' style={{ fontSize: 14 }}>
              Time
            </th>
            <th className='text-center' style={{ fontSize: 14, width: 200 }}>
              First Half
            </th>
            <th className='text-center' style={{ fontSize: 14, width: 200 }}>
              Second Half
            </th>
            <th className='text-center' style={{ fontSize: 14 }}>
              Studied (hrs)
            </th>
            <th className='text-center' style={{ fontSize: 14 }}>
              Slept (hrs)
            </th>
            <th className='text-center' style={{ fontSize: 14 }}>
              Wasted (hrs)
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, h) => {
            const keyF = toggleKey(h, 'first'),
              keyS = toggleKey(h, 'second');
            const studied =
              halfToHours(r.first, 'Studying') +
              halfToHours(r.second, 'Studying');
            const slept =
              halfToHours(r.first, 'Sleeping') +
              halfToHours(r.second, 'Sleeping');
            const wasted =
              halfToHours(r.first, 'Wasted') + halfToHours(r.second, 'Wasted');
            return (
              <tr key={`hr-${h}`}>
                <td
                  className='text-center'
                  style={{ whiteSpace: 'nowrap', fontWeight: 500 }}
                >
                  {hourLabel(h)}
                </td>
                <td
                  className='text-center'
                  style={{ backgroundColor: getBg(r.first) }}
                >
                  <select
                    className='activity-select text-center'
                    disabled={past}
                    value={r.first || ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === 'MISC')
                        setMiscMenu((m) => ({ ...m, [keyF]: true }));
                      else
                        setHalfActivity(
                          getDateKey(selectedDate),
                          h,
                          'first',
                          v
                        );
                      if (v === 'Back')
                        setMiscMenu((m) => ({ ...m, [keyF]: false }));
                    }}
                  >
                    {renderOptions(opts(r.first, keyF), r.first)}
                  </select>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                    {timeRange(h).first}
                  </div>
                </td>
                <td
                  className='text-center'
                  style={{ backgroundColor: getBg(r.second) }}
                >
                  <select
                    className='activity-select text-center'
                    disabled={past}
                    value={r.second || ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === 'MISC')
                        setMiscMenu((m) => ({ ...m, [keyS]: true }));
                      else
                        setHalfActivity(
                          getDateKey(selectedDate),
                          h,
                          'second',
                          v
                        );
                      if (v === 'Back')
                        setMiscMenu((m) => ({ ...m, [keyS]: false }));
                    }}
                  >
                    {renderOptions(opts(r.second, keyS), r.second)}
                  </select>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                    {timeRange(h).second}
                  </div>
                </td>
                <td
                  className='text-center'
                  style={{
                    backgroundColor: studied > 0 ? '#b8eab8' : undefined,
                  }}
                >
                  {studied}
                </td>
                <td
                  className='text-center'
                  style={{ backgroundColor: slept > 0 ? '#add8e6' : undefined }}
                >
                  {slept}
                </td>
                <td
                  className='text-center'
                  style={{
                    backgroundColor: wasted > 0 ? '#ffcccb' : undefined,
                  }}
                >
                  {wasted}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
const renderOptions = (arr, cur) => {
  const isMisc = arr[0]?.value === 'Back';
  const ph = isMisc ? '-- Select MISC --' : '-- Select --';
  const list = !cur
    ? [
        <option key='ph' value='' disabled hidden>
          {ph}
        </option>,
      ]
    : [];
  return [
    ...list,
    ...arr.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    )),
  ];
};
const getBg = (act) =>
  ({ Studying: '#b8eab8', Sleeping: '#add8e6', Wasted: '#ffcccb' }[act] ||
  (act?.startsWith('MISC-') ? '#fff5c0' : ''));
