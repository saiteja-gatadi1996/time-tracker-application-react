import React from 'react';
export default function HourlyChips({ study, sleep, wasted, accounted }) {
  return (
    <div className='total-info' style={{ marginBottom: 12 }}>
      <span className='pill blue'>
        Studied: <b>{study}</b>
        {study >= 15 ? ' 🗿' : ''} hrs
      </span>
      <span className='pill purple' style={{ marginLeft: 8 }}>
        Slept: <b>{sleep}</b>
        {sleep <= 5 ? ' 🗿' : ''} hrs
      </span>
      <span className='pill red' style={{ marginLeft: 8 }}>
        Wasted: <b>{wasted}</b>
        {wasted === 0 ? ' 🗿' : ''} hrs
      </span>
      <span className='pill gray' style={{ marginLeft: 8 }}>
        Accounted: <b>{accounted}</b> / 24 hrs
      </span>
    </div>
  );
}
