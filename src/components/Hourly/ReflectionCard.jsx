import React from 'react';
import { useTimeStore } from '../../store/useTimeStore';
import { isPast } from '../../utils/date';
export default function ReflectionCard() {
  const { reflections, setReflections, dateKey } = useTimeStore();
  const disabled = isPast(dateKey);
  return (
    <div className='card'>
      <div className='form-group' style={{ marginTop: 16 }}>
        <label className='label'>
          If there’s one thing you could change about your past, what would it
          be?
        </label>
        <textarea
          className='input'
          rows={6}
          placeholder='Type your answer... (auto-saved)'
          disabled={disabled}
          value={reflections[dateKey] || ''}
          onChange={(e) =>
            setReflections((p) => ({ ...p, [dateKey]: e.target.value }))
          }
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
