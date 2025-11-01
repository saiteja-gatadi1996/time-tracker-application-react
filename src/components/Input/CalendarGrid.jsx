import React, { useMemo } from 'react';
import { useTimeStore } from '../../store/useTimeStore';
import { getDateKey, isTodayKey } from '../../utils/date';
export default function CalendarGrid() {
  const { currentMonth, dailyData, selectedDate, setSelectedDate } =
    useTimeStore();
  const cells = useMemo(() => {
    const y = currentMonth.getFullYear(),
      m = currentMonth.getMonth();
    const first = new Date(y, m, 1).getDay(),
      dim = new Date(y, m + 1, 0).getDate();
    const arr = [];
    for (let i = 0; i < first; i++) arr.push({ empty: true, key: `e-${i}` });
    for (let d = 1; d <= dim; d++) {
      const k = getDateKey(new Date(y, m, d));
      arr.push({
        day: d,
        k,
        has: !!dailyData[k],
        sel: k === getDateKey(selectedDate),
        today: isTodayKey(k),
        key: `${y}-${m + 1}-${d}`,
      });
    }
    return arr;
  }, [currentMonth, dailyData, selectedDate]);
  return (
    <div className='calendar-grid' id='calendar-days'>
      {cells.map((c) =>
        c.empty ? (
          <div key={c.key} />
        ) : (
          <div
            key={c.key}
            className={`day-cell${c.sel ? ' selected' : ''}${
              !c.sel && c.today ? ' today' : ''
            }${!c.sel && !c.today && c.has ? ' has-data' : ''}`}
            onClick={() => setSelectedDate(new Date(c.k))}
          >
            <div style={{ fontWeight: 500 }}>{c.day}</div>
            {c.has && <div style={{ fontSize: 12, color: '#16a34a' }}>✓</div>}
          </div>
        )
      )}
    </div>
  );
}
