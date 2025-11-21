import React, { useRef } from 'react';
import { useTimeStore } from '../../store/useTimeStore';
export default function ExportImport({ isReadOnly }) {
  const { exportAll, importAll } = useTimeStore();
  const ref = useRef(null);
  const onChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        importAll(JSON.parse(r.result)); // store handles recompute + persist
        alert('Import successful.');
      } catch {
        alert('Import failed: invalid JSON');
      }
      if (ref.current) ref.current.value = '';
    };
    r.readAsText(f);
  };

  return (
    <div
      className='total-info'
      style={{ display: 'flex', gap: 8, marginTop: 8 }}
    >
      <button className='button' onClick={exportAll}>
        Export Data
      </button>
      <label
        className={`button ${isReadOnly ? 'ro' : ''}`}
        htmlFor='import-file'
        style={{
          display: 'flex',
          gap: 8,
          cursor: 'pointer',
          placeContent: 'center',
          alignItems: 'center',
        }}
      >
        Import Data
      </label>
      <input
        ref={ref}
        id='import-file'
        type='file'
        className={`hidden ${isReadOnly ? 'ro' : ''}`}
        accept='application/json'
        onChange={onChange}
      />
    </div>
  );
}
