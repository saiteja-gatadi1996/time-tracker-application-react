import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useTimeStore } from '../../store/useTimeStore';
import { formatHours, isPast, getDateKey, timeRange } from '../../utils/date';
import HourlyChips from './HourlyChips';
import HourlyTable from './HourlyTable';
import ReflectionCard from './ReflectionCard';
import ExportImport from './ExportImport';
import { halfToHours } from '../../utils/report';

export default function HourlyView() {
  const {
    selectedDate,
    setSelectedDate,
    derived,
    dateKey,
    isReadOnly,
    hourlyData,
  } = useTimeStore();

  const accountedWarn = derived?.accounted > 24.001;

  // 🔎 Detect 7-day wasted streak on the same time slots
  const wastedStreak = useMemo(() => {
    const STREAK_DAYS = 7;

    if (!selectedDate || !hourlyData) return null;

    // Collect dateKeys for last 7 consecutive days (including selectedDate)
    const keys = [];
    for (let i = 0; i < STREAK_DAYS; i++) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - i);
      keys.push(getDateKey(d));
    }

    // If any of those days has no hourly data at all, we can't count a full streak
    const allHaveSomeData = keys.every((k) => !!hourlyData[k]);
    if (!allHaveSomeData) return null;

    const slots = [];

    // Scan every half-hour slot (24 hours * 2 halves)
    for (let h = 0; h < 24; h++) {
      ['first', 'second'].forEach((half) => {
        const isWastedAll7 = keys.every((k) => {
          const day = hourlyData[k];
          if (!day || !day[h]) return false;
          return day[h][half] === 'Wasted';
        });

        if (isWastedAll7) {
          slots.push({ hour: h, half });
        }
      });
    }

    if (!slots.length) return null;

    // Build human-readable labels for the slots
    const labels = slots.map(({ hour, half }) => {
      const tr = timeRange(hour);
      return half === 'first' ? tr.first : tr.second;
    });

    return { slots, labels };
  }, [selectedDate, hourlyData]);

  const wastedReasonsSummary = useMemo(() => {
    const day = hourlyData[dateKey];
    if (!day) return {};

    const acc = {};

    day.forEach((row) => {
      if (!row || !row.wastedReason) return;

      const wasted =
        halfToHours(row.first, 'Wasted') + halfToHours(row.second, 'Wasted');

      if (!wasted) return;

      acc[row.wastedReason] = (acc[row.wastedReason] || 0) + wasted;
    });

    return acc;
  }, [hourlyData, dateKey]);

  const wastedReasonEntries = Object.entries(wastedReasonsSummary).filter(
    ([, hrs]) => hrs > 0
  );

  // dynamic maxHeight for left scroll, based on right card
  const rightCardRef = useRef(null);
  const leftCardRef = useRef(null);
  const leftScrollRef = useRef(null);

  const [scrollMaxHeight, setScrollMaxHeight] = useState(null);

  useEffect(() => {
    const rightEl = rightCardRef.current;
    const leftCardEl = leftCardRef.current;
    const scrollEl = leftScrollRef.current;

    if (!rightEl || !leftCardEl || !scrollEl) return;

    const compute = () => {
      const rightHeight = rightEl.offsetHeight;
      if (!rightHeight) return;

      const cardRect = leftCardEl.getBoundingClientRect();
      const scrollRect = scrollEl.getBoundingClientRect();

      // Space taken above the scroll area inside the left card
      const offsetTop = scrollRect.top - cardRect.top;

      // Base max-height = 60vh (like your old version)
      const baseMaxPx = window.innerHeight * 0.6;

      // Available height if we want left card not to be shorter than right
      const availableFromRight = rightHeight - offsetTop;

      const finalMax =
        availableFromRight > baseMaxPx ? availableFromRight : baseMaxPx;

      setScrollMaxHeight(finalMax > 0 ? finalMax : baseMaxPx);
    };

    compute();

    // Recompute if window resizes (viewport 60vh changes)
    const onResize = () => compute();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
    // re-run when wasted breakdown changes or date changes
  }, [wastedReasonEntries.length, selectedDate]);

  return (
    <div className={`hourly-view ${isReadOnly ? 'ro' : ''}`}>
      <div className='grid-container'>
        {/* LEFT CARD */}
        <div className='card hourly-card' ref={leftCardRef}>
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

          {wastedStreak && (
            <p
              style={{
                color: '#92400e',
                fontSize: 18,
                fontWeight: 600,
                margin: '0 0 12px 0',
                padding: '8px 14px',
                borderRadius: 10,
                background: '#fef2f2',
                lineHeight: 1.5,
                width: 'fit-content',
              }}
            >
              ⚠️{' '}
              <span style={{ fontWeight: 700 }}>Warning: Time blocks 👉👉</span>{' '}
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '20px',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                }}
              >
                {wastedStreak.labels.join(', ')}
              </span>{' '}
              has been wasted for{' '}
              <span style={{ fontWeight: 700 }}>7 straight days</span> ⏳
              <br />
              <br />
              🚨 This is a red flag — either you take control of this slot now,
              or it will keep owning you.
            </p>
          )}

          <HourlyChips
            study={formatHours(derived?.study || 0)}
            sleep={formatHours(derived?.sleep || 0)}
            wasted={formatHours(derived?.wasted || 0)}
            accounted={formatHours(derived?.accounted || 0)}
          />

          {/* This area will scroll; maxHeight is dynamic */}
          <div className='hourly-body'>
            <div
              className='hourly-scroll'
              ref={leftScrollRef}
              style={
                scrollMaxHeight
                  ? { maxHeight: scrollMaxHeight }
                  : { maxHeight: '60vh' } // fallback
              }
            >
              <HourlyTable />
            </div>
            {accountedWarn && (
              <p className='warning-text' style={{ marginTop: 8 }}>
                ⚠️ Accounted time exceeds 24 hours!
              </p>
            )}
          </div>
        </div>

        {/* RIGHT CARD */}
        <div className='card' ref={rightCardRef}>
          <ReflectionCard />
          <ExportImport isReadOnly={isReadOnly} />

          {wastedReasonEntries.length > 0 && (
            <div
              style={{
                marginTop: 22,
                padding: '10px 12px',
                borderRadius: 8,
                background: '#fef2f2',
                color: '#7f1d1d',
                fontSize: 20,
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                Today&apos;s wasted time breakdown:
              </div>
              {wastedReasonEntries.map(([reason, hrs]) => (
                <div key={reason}>
                  {reason.replace(/_/g, ' ')} → {hrs.toFixed(1)} hour
                  {hrs.toFixed(1) === '1.0' ? '' : 's'}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
