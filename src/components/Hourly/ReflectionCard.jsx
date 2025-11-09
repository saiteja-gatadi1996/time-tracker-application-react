import React from 'react';
import { useTimeStore } from '../../store/useTimeStore';
import { isPast } from '../../utils/date';
export default function ReflectionCard() {
  const { isReadOnly, reflections, setReflections, dateKey } = useTimeStore();
  const disabled = isPast(dateKey);
  const value = reflections?.[dateKey] ?? '';
  return (
    <div className='card'>
      <div className='form-group' style={{ marginTop: 16 }}>
        <label className='label'>
          If there’s one thing you could change about your past, what would it
          be?
        </label>
        <textarea
          placeholder='Type your answer'
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
          style={{ width: '100%', minHeight: 220 }}
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
