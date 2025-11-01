// components/PomodoroView.jsx
import React from 'react';
import { usePomodoro } from '../../store/usePomodoro';

export default function PomodoroView() {
  const {
    time,
    totalTime,
    task,
    h,
    m,
    msg,
    setH,
    setM,
    setMsg,
    setTimer,
    pause,
    reset,
    progress,
    isPaused,
  } = usePomodoro();

  const pad = (n) => n.toString().padStart(2, '0');
  const hh = pad(Math.floor(time / 3600));
  const mm = pad(Math.floor((time % 3600) / 60));
  const ss = pad(time % 60);

  return (
    <div id='pomodoro-view' className='view'>
      <div className='container'>
        <h1>Pomodoro Timer</h1>

        <div className='input-group'>
          <input
            type='number'
            min={0}
            max={10}
            placeholder='Enter hours (0-10)'
            value={h}
            onChange={(e) => setH(e.target.value)}
          />
          <input
            type='number'
            min={0}
            max={59}
            placeholder='Enter minutes (0-59)'
            value={m}
            onChange={(e) => setM(e.target.value)}
          />
          <input
            type='text'
            placeholder='Enter task message'
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
          />
          {/* Set -> starts automatically via setPomodoroTime */}
          <button onClick={setTimer}>Set</button>
        </div>

        <div className='timer' id='timer'>
          {hh}:{mm}:{ss}
        </div>

        <div className='controls'>
          {/* Toggle Pause/Resume */}
          <button onClick={pause} id='pauseBtn' disabled={totalTime === 0}>
            {isPaused ? 'RESUME' : 'PAUSE'}
          </button>

          <button onClick={reset}>RESET</button>
        </div>

        <div id='progress'>
          <div id='progress-bar' style={{ width: `${progress}%` }} />
        </div>
        <div id='task'>Task: {task}</div>
      </div>
    </div>
  );
}
