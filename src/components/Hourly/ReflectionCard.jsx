import React, { useState } from 'react';
import { useTimeStore } from '../../store/useTimeStore';
import { isPast } from '../../utils/date';

export default function ReflectionCard() {
  const {
    isReadOnly,
    reflections,
    setReflections,
    dateKey,
    happinessItems,
    setHappinessItems,
    happinessStatus,
    setHappinessStatus,
  } = useTimeStore();

  const disabled = isPast(dateKey);
  const value = reflections?.[dateKey] ?? '';

  const [isEditingChecklist, setIsEditingChecklist] = useState(false);
  const maxItems = 6;

  const todayStatus = happinessStatus?.[dateKey] || [];

  // ----- SCORE -----
  const totalItems = happinessItems.filter(
    (item) => item && item.trim() !== ''
  ).length;

  const completedCount = happinessItems.reduce((acc, item, idx) => {
    if (!item || !item.trim()) return acc;
    return acc + (todayStatus[idx] ? 1 : 0);
  }, 0);

  const toggleItemForToday = (idx) => {
    if (isReadOnly || disabled) return;

    setHappinessStatus((prev) => {
      const existing = prev[dateKey] || [];
      const normalized = Array(happinessItems.length)
        .fill(false)
        .map((_, i) => existing[i] || false);

      normalized[idx] = !normalized[idx];

      return { ...prev, [dateKey]: normalized };
    });
  };

  const addChecklistItem = () => {
    if (isReadOnly || happinessItems.length >= maxItems) return;
    setHappinessItems((prev) => [...prev, '']);
  };

  const removeChecklistItem = (idx) => {
    if (isReadOnly) return;
    setHappinessItems((prev) => {
      const copy = [...prev];
      copy.splice(idx, 1);
      return copy;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ===================== CARD 1: Happiness Checklist ===================== */}
      <div className='card' style={{ position: 'relative', paddingTop: 16 }}>
        <h3 style={{ fontWeight: 700, fontSize: 18 }}>
          HAPPINESS CHECKLIST 😊
        </h3>

        {/* FLOATING SCORE CARD */}
        {!isEditingChecklist && totalItems > 0 && (
          <div
            style={{
              position: 'absolute',
              top: -12,
              right: -12,
              background: '#ffe4e6',
              padding: '6px 10px',
              borderRadius: 6,
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              textAlign: 'center',
              width: 70,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700 }}>SCORE</div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>
              {completedCount}/{totalItems}
            </div>
          </div>
        )}

        {/* VIEW MODE */}
        {!isEditingChecklist && (
          <div style={{ marginTop: 10 }}>
            {happinessItems.length === 0 && (
              <p style={{ fontSize: 13, color: '#6b7280' }}>
                Set up 1–6 habits that define your happiest day.
              </p>
            )}

            {happinessItems.map((item, idx) => (
              <label
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <input
                  type='checkbox'
                  disabled={isReadOnly || disabled}
                  checked={todayStatus[idx] || false}
                  onChange={() => toggleItemForToday(idx)}
                />
                <span
                  style={{
                    textDecoration: todayStatus[idx] ? 'line-through' : '',
                    opacity: todayStatus[idx] ? 0.7 : 1,
                  }}
                >
                  {item}
                </span>
              </label>
            ))}
          </div>
        )}

        {/* EDIT MODE */}
        {isEditingChecklist && (
          <div style={{ marginTop: 10 }}>
            {happinessItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <input
                  type='text'
                  value={item}
                  placeholder='“Things that make you happy (e.g., working out at the gym)”'
                  onChange={(e) =>
                    setHappinessItems((prev) => {
                      const next = [...prev];
                      next[idx] = e.target.value;
                      return next;
                    })
                  }
                  style={{
                    flex: 1,
                    padding: 6,
                    border: '1px solid #ccc',
                    borderRadius: 6,
                  }}
                />

                <button
                  className='button'
                  style={{ padding: '2px 8px', background: '#fee2e2' }}
                  onClick={() => removeChecklistItem(idx)}
                >
                  ✕
                </button>
              </div>
            ))}

            {happinessItems.length < maxItems && (
              <button className='button' onClick={addChecklistItem}>
                + Add Item
              </button>
            )}
          </div>
        )}

        {!isReadOnly && (
          <button
            className='button'
            style={{ marginTop: 8 }}
            onClick={() => setIsEditingChecklist((v) => !v)}
          >
            {isEditingChecklist ? 'Done' : 'Edit'}
          </button>
        )}
      </div>

      {/* ===================== CARD 2: Reflection ===================== */}
      <div className='card'>
        <label className='label'>
          If there’s one thing you could change about your past, what would it
          be?
        </label>
        <textarea
          placeholder='Type your answer....'
          value={value}
          readOnly={isReadOnly} // <- blocks editing in LIVE
          aria-readonly={isReadOnly}
          disabled={disabled}
          onChange={(e) => {
            if (isReadOnly) return; // <- extra guard
            const text = e.target.value;
            setReflections((prev) => ({ ...prev, [dateKey]: text }));
          }}
          className={`input ${isReadOnly} ? 'is-ro' : ''`}
          style={{
            width: '100%',
            minHeight: 200,
            maxHeight: 300,
          }}
        />
      </div>
      <div className='form-group'>
        <button
          className='button'
          onClick={() => {
            if (window.confirm('Clear your saved answer?'))
              setReflections((p) => ({ ...p, [dateKey]: '' }));
          }}
        >
          Clear Answer
        </button>
      </div>
      <div className='total-info'>
        <p style={{ fontSize: 13 }}>
          Tip: Use Export/Import below to back up your data.
        </p>
      </div>
    </div>
  );
}
