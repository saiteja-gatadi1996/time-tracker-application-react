import React, { useState, useEffect, useMemo } from 'react';
import '../../styles/accountability.css';

const STORAGE_KEY = 'ACCOUNTABILITY_DATA';
const PROBLEMS_KEY = 'ACCOUNTABILITY_PROBLEMS';

export default function AccountabilityView() {
  const [currentStep, setCurrentStep] = useState(1);
  const [problems, setProblems] = useState([]);
  const [setupComplete, setSetupComplete] = useState(false);

  const [data, setData] = useState({
    startDate: null,
    dailyRecords: {},
  });

  const motivationalQuotes = [
    'Discipline is choosing between what you want now and what you want most.',
    'The pain of discipline is far less than the pain of regret.',
    "You don't have to be great to start, but you have to start to be great.",
    'Every accomplishment starts with the decision to try.',
    'Success is the sum of small efforts repeated day in and day out.',
    'Perfection is not attainable, but if we chase perfection we can catch excellence.',
    "Don't watch the clock; do what it does. Keep going.",
    'The future depends on what you do today.',
    'Winners never quit, and quitters never win.',
    "Your limitation—it's only your imagination.",
  ];

  const [currentQuote, setCurrentQuote] = useState(motivationalQuotes[0]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const savedProblems = localStorage.getItem(PROBLEMS_KEY);

    if (savedData && savedProblems) {
      setData(JSON.parse(savedData));
      setProblems(JSON.parse(savedProblems));
      setSetupComplete(true);
    }

    // Set random quote
    setCurrentQuote(
      motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
    );
  }, []);

  // Render approach inputs when we move to step 3 and problems are set
  useEffect(() => {
    if (currentStep === 3 && problems.length > 0) {
      const container = document.getElementById('approachInputs');
      if (!container) return;

      container.innerHTML = '';
      problems.forEach((problem, index) => {
        const card = document.createElement('div');
        card.className = 'problem-card';
        card.innerHTML = `
          <h3>Problem: ${problem.title}</h3>
          <label style="display: block; margin-bottom: 10px; color: #666; font-weight: bold;">
            What's your approach to fix this?
          </label>
          <textarea class="input-field approach-input" data-index="${index}" 
                    placeholder="Describe your strategy, action plan, or new habit to overcome this obstacle..."></textarea>
        `;
        container.appendChild(card);
      });
    }
  }, [currentStep, problems]);

  // Save data to localStorage
  useEffect(() => {
    if (setupComplete) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(PROBLEMS_KEY, JSON.stringify(problems));
    }
  }, [data, problems, setupComplete]);

  const getTodayKey = () => {
    return new Date().toISOString().split('T')[0];
  };

  const addProblemInput = () => {
    const container = document.getElementById('problemInputs');
    if (!container) return;

    const problemCount = container.children.length + 1;
    const problemCard = document.createElement('div');
    problemCard.className = 'problem-card';
    problemCard.innerHTML = `
      <h3>Problem #${problemCount}</h3>
      <input type="text" class="input-field problem-input" 
             placeholder="Example: I snooze my alarm and start my day late..." />
    `;
    container.appendChild(problemCard);
  };

  const nextStep = () => {
    if (currentStep === 2) {
      // Validate and save problems
      const inputs = document.querySelectorAll('.problem-input');
      const newProblems = [];

      inputs.forEach((input, index) => {
        if (input.value.trim()) {
          newProblems.push({
            id: Date.now() + index,
            title: input.value.trim(),
            approach: '',
            streak: 0,
            bestStreak: 0,
          });
        }
      });

      if (newProblems.length === 0) {
        alert('Please add at least one problem to continue!');
        return;
      }

      setProblems(newProblems);
    }

    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const completeSetup = () => {
    const approachInputs = document.querySelectorAll('.approach-input');
    const updatedProblems = [...problems];

    approachInputs.forEach((input, index) => {
      if (updatedProblems[index]) {
        updatedProblems[index].approach = input.value.trim();
      }
    });

    const missingApproaches = updatedProblems.filter((p) => !p.approach);
    if (missingApproaches.length > 0) {
      alert('Please define an approach for all problems before continuing!');
      return;
    }

    setProblems(updatedProblems);
    setData({
      ...data,
      startDate: new Date().toISOString().split('T')[0],
    });
    setSetupComplete(true);
  };

  const markProblem = (problemId, success) => {
    const today = getTodayKey();
    const reflectionInput = document.getElementById(`reflection_${problemId}`);
    const reflection = reflectionInput ? reflectionInput.value.trim() : '';

    if (!reflection) {
      alert(
        "⚠️ Please write your reflection first before marking this problem!\n\nReflect on: How did you apply your approach today? What worked? What didn't?"
      );
      reflectionInput?.focus();
      return;
    }

    const newDailyRecords = { ...data.dailyRecords };
    if (!newDailyRecords[today]) {
      newDailyRecords[today] = {};
    }

    newDailyRecords[today][problemId] = success;
    newDailyRecords[today][`${problemId}_reflection`] = reflection;

    // Update streaks
    const updatedProblems = problems.map((p) => {
      if (p.id === problemId) {
        if (success) {
          const newStreak = p.streak + 1;
          return {
            ...p,
            streak: newStreak,
            bestStreak: Math.max(newStreak, p.bestStreak),
          };
        } else {
          return { ...p, streak: 0 };
        }
      }
      return p;
    });

    setProblems(updatedProblems);
    setData({ ...data, dailyRecords: newDailyRecords });
  };

  const stats = useMemo(() => {
    if (!data.startDate)
      return { totalDays: 0, perfectDays: 0, currentStreak: 0, successRate: 0 };

    const startDate = new Date(data.startDate);
    const today = new Date();
    const daysDiff =
      Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;

    let perfectDays = 0;
    let currentStreak = 0;

    const sortedDates = Object.keys(data.dailyRecords).sort().reverse();

    for (const date of sortedDates) {
      const record = data.dailyRecords[date];
      const problemIds = problems.map((p) => p.id);
      const isPerfect = problemIds.every((id) => record[id] === true);

      if (isPerfect) {
        perfectDays++;
        if (date === sortedDates[0] || currentStreak > 0) {
          currentStreak++;
        }
      } else {
        if (date === getTodayKey() || date === sortedDates[0]) {
          break;
        }
      }
    }

    const successRate =
      daysDiff > 0 ? Math.round((perfectDays / daysDiff) * 100) : 0;

    return { totalDays: daysDiff, perfectDays, currentStreak, successRate };
  }, [data, problems]);

  const resetData = () => {
    if (
      confirm(
        '⚠️ WARNING: This will delete ALL your progress and data. Are you absolutely sure?'
      )
    ) {
      if (confirm('This action cannot be undone. Confirm again to proceed.')) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(PROBLEMS_KEY);
        window.location.reload();
      }
    }
  };

  const editProblems = () => {
    if (
      confirm(
        'This will restart the setup wizard. Your progress data will be kept. Continue?'
      )
    ) {
      setSetupComplete(false);
      setCurrentStep(2);

      setTimeout(() => {
        const container = document.getElementById('problemInputs');
        if (container) {
          container.innerHTML = '';
          problems.forEach(() => addProblemInput());

          setTimeout(() => {
            const inputs = document.querySelectorAll('.problem-input');
            problems.forEach((problem, index) => {
              if (inputs[index]) {
                inputs[index].value = problem.title;
              }
            });
          }, 100);
        }
      }, 100);
    }
  };

  const renderCalendar = () => {
    const today = new Date();
    const calendar = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const dayRecord = data.dailyRecords[dateKey];

      let className = 'calendar-day future';
      if (dayRecord) {
        const problemIds = problems.map((p) => p.id);
        const successCount = problemIds.filter(
          (id) => dayRecord[id] === true
        ).length;

        if (successCount === problemIds.length) {
          className = 'calendar-day perfect';
        } else if (successCount > 0) {
          className = 'calendar-day partial';
        } else {
          className = 'calendar-day failed';
        }
      } else if (
        dateKey < getTodayKey() &&
        data.startDate &&
        dateKey >= data.startDate
      ) {
        className = 'calendar-day failed';
      }

      calendar.push(
        <div key={dateKey} className={className} title={dateKey}>
          {date.getDate()}
        </div>
      );
    }

    return calendar;
  };

  if (!setupComplete) {
    return (
      <div className='accountability-container'>
        <div className='setup-wizard'>
          <div className='wizard-header'>
            <h1>🎯 Get Better Everyday</h1>
            <p style={{ fontSize: '1.2em', color: '#666', marginTop: '10px' }}>
              Let's set up your journey to excellence
            </p>
          </div>

          {currentStep === 1 && (
            <div className='wizard-step active'>
              <h2 style={{ color: '#667eea', marginBottom: '20px' }}>
                Step 1: Understanding Your Challenge
              </h2>
              <p
                style={{
                  fontSize: '1.1em',
                  lineHeight: 1.8,
                  marginBottom: '20px',
                }}
              >
                This system helps you overcome procrastination and build
                unstoppable momentum. You'll track daily progress, define your
                approach to fixing problems, and see your transformation over
                the next 20 years.
              </p>
              <p
                style={{
                  fontSize: '1.1em',
                  lineHeight: 1.8,
                  marginBottom: '20px',
                  color: '#666',
                }}
              >
                <strong>Here's how it works:</strong>
                <br />
                1️⃣ Define your biggest obstacles
                <br />
                2️⃣ Create an action plan for each problem
                <br />
                3️⃣ Track daily progress and reflections
                <br />
                4️⃣ Build streaks and see your growth over time
              </p>
              <div className='wizard-actions'>
                <div></div>
                <button className='btn btn-primary' onClick={nextStep}>
                  Let's Begin 🚀
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className='wizard-step active'>
              <h2 style={{ color: '#667eea', marginBottom: '20px' }}>
                Step 2: What Are Your Biggest Obstacles?
              </h2>
              <p
                style={{ fontSize: '1em', color: '#666', marginBottom: '25px' }}
              >
                List the problems that hold you back. Be specific and honest.
              </p>

              <div id='problemInputs'>
                <div className='problem-card'>
                  <h3>Problem #1</h3>
                  <input
                    type='text'
                    className='input-field problem-input'
                    defaultValue='Snoozing the alarm - my mindset has adjusted to treating everything as low priority'
                    placeholder='Example: I snooze my alarm and start my day late...'
                  />
                </div>
              </div>

              <button className='btn btn-add' onClick={addProblemInput}>
                ➕ Add Another Problem
              </button>

              <div className='wizard-actions'>
                <button className='btn btn-secondary' onClick={prevStep}>
                  ⬅ Back
                </button>
                <button className='btn btn-primary' onClick={nextStep}>
                  Next: Define Approaches ➡
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className='wizard-step active'>
              <h2 style={{ color: '#667eea', marginBottom: '20px' }}>
                Step 3: How Will You Fix Each Problem?
              </h2>
              <p
                style={{ fontSize: '1em', color: '#666', marginBottom: '25px' }}
              >
                For each obstacle, define your concrete approach and strategy to
                overcome it.
              </p>

              <div id='approachInputs'></div>

              <div className='wizard-actions'>
                <button className='btn btn-secondary' onClick={prevStep}>
                  ⬅ Back
                </button>
                <button className='btn btn-success' onClick={completeSetup}>
                  🎉 Start My Journey!
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const today = getTodayKey();
  const todayRecord = data.dailyRecords[today] || {};
  const progressPercent = Math.min((stats.totalDays / 7300) * 100, 100).toFixed(
    2
  );
  const yearsTracking = (stats.totalDays / 365).toFixed(2);

  return (
    <div className='accountability-container'>
      <div className='accountability-header'>
        <h1>🎯 Get Better Everyday</h1>
        <p style={{ fontSize: '1.2em', color: '#666', marginTop: '10px' }}>
          Chase Excellence Every Single Day
        </p>
        <div className='journey-stats'>
          <div className='accountability-stat-card'>
            <h3>{stats.totalDays}</h3>
            <p>Days on Journey</p>
          </div>
          <div className='accountability-stat-card'>
            <h3>{stats.perfectDays}</h3>
            <p>Perfect Days</p>
          </div>
          <div className='accountability-stat-card'>
            <h3>{stats.currentStreak}</h3>
            <p>Current Streak</p>
          </div>
          <div className='accountability-stat-card'>
            <h3>{stats.successRate}%</h3>
            <p>Success Rate</p>
          </div>
        </div>
      </div>

      <div className='motivation-quote'>{currentQuote}</div>

      <div className='main-content'>
        <div className='accountability-card'>
          <h2>📋 Today's Battle Plan</h2>
          <div id='todayProblems'>
            {problems.map((problem) => {
              const status = todayRecord[problem.id];
              const reflection = todayRecord[`${problem.id}_reflection`] || '';
              const isSolved = status === true;
              const isFailed = status === false;

              return (
                <div
                  key={problem.id}
                  className={`daily-problem ${isSolved ? 'solved' : ''}`}
                >
                  <div className='problem-header'>
                    <div className='problem-title'>
                      {isSolved ? '✅' : isFailed ? '❌' : '⏳'} {problem.title}
                    </div>
                    {problem.streak > 0 && (
                      <div className='streak-badge'>
                        🔥 {problem.streak} day streak
                      </div>
                    )}
                  </div>

                  <div className='approach-section'>
                    <h4>💡 Your Approach:</h4>
                    <div className='approach-text'>{problem.approach}</div>
                  </div>

                  {problem.bestStreak > 0 && (
                    <p
                      style={{
                        color: '#28a745',
                        fontWeight: 'bold',
                        margin: '10px 0',
                      }}
                    >
                      🏆 Best Streak: {problem.bestStreak} days
                    </p>
                  )}

                  <div className='daily-reflection-section'>
                    {status === undefined ? (
                      <>
                        <h4 style={{ color: '#667eea', marginBottom: '10px' }}>
                          📝 Step 1: Write Your Reflection First
                        </h4>
                        <textarea
                          className='reflection-input'
                          id={`reflection_${problem.id}`}
                          placeholder="How did you apply your approach today? What worked? What didn't?"
                        />
                        <p
                          style={{
                            color: '#999',
                            fontSize: '0.9em',
                            marginBottom: '15px',
                          }}
                        >
                          ⬆️ Write your reflection above before marking as
                          conquered/failed
                        </p>
                      </>
                    ) : (
                      <>
                        <h4 style={{ color: '#667eea', marginBottom: '10px' }}>
                          📝 Your Reflection:
                        </h4>
                        <div
                          className='approach-text'
                          style={{
                            background: 'white',
                            border: '2px solid #667eea',
                          }}
                        >
                          {reflection || 'No reflection written'}
                        </div>
                      </>
                    )}

                    <div className='action-buttons'>
                      <button
                        className='btn btn-success'
                        onClick={() => markProblem(problem.id, true)}
                        disabled={status !== undefined}
                      >
                        ✅ Conquered Today
                      </button>
                      <button
                        className='btn btn-danger'
                        onClick={() => markProblem(problem.id, false)}
                        disabled={status !== undefined}
                      >
                        ❌ Failed Today
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className='accountability-card'>
          <h2>📅 Last 30 Days Progress</h2>
          <div className='calendar-view'>{renderCalendar()}</div>
          <div style={{ marginTop: '20px', fontSize: '0.9em' }}>
            <span style={{ color: '#28a745' }}>●</span> Perfect Day &nbsp;
            <span style={{ color: '#ffc107' }}>●</span> Partial &nbsp;
            <span style={{ color: '#dc3545' }}>●</span> Failed
          </div>
        </div>

        <div className='accountability-card'>
          <h2>📈 20-Year Journey Progress</h2>
          <div className='progress-bar-container'>
            <div
              className='progress-bar'
              style={{ width: `${progressPercent}%` }}
            >
              {progressPercent}%
            </div>
          </div>
          <p style={{ marginTop: '15px', color: '#666', textAlign: 'center' }}>
            <strong>{yearsTracking}</strong> years tracking |
            <strong> {Math.max(7300 - stats.totalDays, 0)}</strong> days
            remaining to 20 years
          </p>
        </div>

        <div className='accountability-card'>
          <h2>⚙️ Settings</h2>
          <button className='btn btn-primary' onClick={editProblems}>
            ✏️ Edit Problems & Approaches
          </button>
        </div>
      </div>
    </div>
  );
}
