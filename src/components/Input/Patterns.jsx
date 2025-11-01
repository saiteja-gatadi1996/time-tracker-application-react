import React, { useRef } from 'react';
import { useTimeStore } from '../../store/useTimeStore';
export default function Patterns() {
  const { wastedPatterns, addPattern, removePattern, dateKey } = useTimeStore();
  const inp = useRef(null);
  return (
    <div className='form-group'>
      <label className='label'> Wasted Time Patterns </label>
      <div className='input-group'>
        <input
          ref={inp}
          type='text'
          className='input'
          placeholder='e.g., Post-lunch, Post-dinner'
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addPattern(dateKey, inp.current.value.trim());
              inp.current.value = '';
            }
          }}
        />
        <button
          className='button active'
          onClick={() => {
            addPattern(dateKey, inp.current.value.trim());
            inp.current.value = '';
          }}
        >
          Add
        </button>
      </div>
      <div id='patterns-list' style={{ marginTop: 12 }}>
        {(wastedPatterns[dateKey] || []).map((p, i) => (
          <span key={`${p}-${i}`} className='pattern-chip'>
            {p}
            <button onClick={() => removePattern(dateKey, i)}>×</button>
          </span>
        ))}
      </div>
    </div>
  );
}
