import React, { useState, useEffect, useMemo } from 'react';
import { auth, db, doc, onSnapshot, setDoc } from '../../utils/firebase';
import { ADMIN } from '../../utils/constants';
import '../../styles/accountability.css';

const STORAGE_KEY = 'ACCOUNTABILITY_DATA';
const PROBLEMS_KEY = 'ACCOUNTABILITY_PROBLEMS';
const FIRESTORE_COLLECTION = 'accountability';
const PUBLIC_DOC_ID = 'saiteja'; // Your public accountability data (like timetracker/saiteja)

export default function AccountabilityView() {
  const [currentStep, setCurrentStep] = useState(1);
  const [problems, setProblems] = useState([]);
  const [setupComplete, setSetupComplete] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [viewMode, setViewMode] = useState('public'); // 'public' or 'personal'

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

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setIsAdmin(
        currentUser?.uid === ADMIN.UID || currentUser?.email === ADMIN.EMAIL
      );
    });
    return () => unsubscribe();
  }, []);

  // Generate unique user ID for personal mode
  const getUserId = () => {
    if (user?.uid) return user.uid;

    let anonymousId = localStorage.getItem('ACCOUNTABILITY_ANON_ID');
    if (!anonymousId) {
      anonymousId = `anon_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      localStorage.setItem('ACCOUNTABILITY_ANON_ID', anonymousId);
    }
    return anonymousId;
  };

  const userId = getUserId();

  // Determine which document to use
  const getDocumentId = () => {
    if (viewMode === 'public') {
      return PUBLIC_DOC_ID; // Everyone sees/uses saiteja's data
    } else {
      return userId; // Personal mode - user's own data
    }
  };

  const documentId = getDocumentId();
  const isReadOnly = viewMode === 'public' && !isAdmin;

  // Load data from localStorage on mount (fallback)
  useEffect(() => {
    const storageKey =
      viewMode === 'public'
        ? `${STORAGE_KEY}_${PUBLIC_DOC_ID}`
        : `${STORAGE_KEY}_${userId}`;
    const problemsKey =
      viewMode === 'public'
        ? `${PROBLEMS_KEY}_${PUBLIC_DOC_ID}`
        : `${PROBLEMS_KEY}_${userId}`;

    const savedData = localStorage.getItem(storageKey);
    const savedProblems = localStorage.getItem(problemsKey);

    if (savedData && savedProblems) {
      setData(JSON.parse(savedData));
      setProblems(JSON.parse(savedProblems));
      setSetupComplete(true);
    } else {
      // Clear state when switching modes
      setData({ startDate: null, dailyRecords: {} });
      setProblems([]);
      setSetupComplete(false);
    }

    setCurrentQuote(
      motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
    );
  }, [viewMode, userId]);

  // Subscribe to Firebase
  useEffect(() => {
    const accountabilityRef = doc(db, FIRESTORE_COLLECTION, documentId);

    const unsubscribe = onSnapshot(accountabilityRef, (snapshot) => {
      if (snapshot.exists()) {
        const firebaseData = snapshot.data();

        // Update state from Firebase
        if (firebaseData.data) setData(firebaseData.data);
        if (firebaseData.problems) setProblems(firebaseData.problems);
        if (firebaseData.setupComplete !== undefined) {
          setSetupComplete(firebaseData.setupComplete);
        }

        // Cache to localStorage
        const storageKey = `${STORAGE_KEY}_${documentId}`;
        const problemsKey = `${PROBLEMS_KEY}_${documentId}`;
        localStorage.setItem(
          storageKey,
          JSON.stringify(firebaseData.data || {})
        );
        localStorage.setItem(
          problemsKey,
          JSON.stringify(firebaseData.problems || [])
        );
      }
    });

    return () => unsubscribe();
  }, [documentId]);

  // Save to Firebase (with debounce)
  useEffect(() => {
    // Only save if:
    // 1. In public mode AND you're admin, OR
    // 2. In personal mode (anyone can save their own)
    const canSave =
      (viewMode === 'public' && isAdmin) || viewMode === 'personal';

    if (!canSave || !setupComplete) return;

    const saveTimer = setTimeout(() => {
      setIsSyncing(true);
      const accountabilityRef = doc(db, FIRESTORE_COLLECTION, documentId);

      setDoc(
        accountabilityRef,
        {
          data,
          problems,
          setupComplete,
          updatedAt: Date.now(),
          owner: viewMode === 'public' ? 'saiteja' : user?.email || 'anonymous',
          mode: viewMode,
        },
        { merge: true }
      )
        .then(() => {
          console.log(
            `✅ Accountability data synced to Firebase (${documentId})`
          );
          setIsSyncing(false);
        })
        .catch((error) => {
          console.error('❌ Firebase sync error:', error);
          setIsSyncing(false);
        });
    }, 600);

    return () => clearTimeout(saveTimer);
  }, [data, problems, setupComplete, isAdmin, viewMode, documentId, user]);

  // Render approach inputs when we move to step 3
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

  // Save to localStorage
  useEffect(() => {
    if (setupComplete) {
      const storageKey = `${STORAGE_KEY}_${documentId}`;
      const problemsKey = `${PROBLEMS_KEY}_${documentId}`;
      localStorage.setItem(storageKey, JSON.stringify(data));
      localStorage.setItem(problemsKey, JSON.stringify(problems));
    }
  }, [data, problems, setupComplete, documentId]);

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
    if (isReadOnly) {
      alert(
        '🔒 You are viewing Saiteja\'s accountability tracker in read-only mode.\n\nSwitch to "Your Tracker" to track your own progress.'
      );
      return;
    }

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
    if (isReadOnly) {
      alert('🔒 Cannot reset in read-only mode.');
      return;
    }

    if (
      confirm(
        '⚠️ WARNING: This will delete ALL your progress and data. Are you absolutely sure?'
      )
    ) {
      if (confirm('This action cannot be undone. Confirm again to proceed.')) {
        const storageKey = `${STORAGE_KEY}_${documentId}`;
        const problemsKey = `${PROBLEMS_KEY}_${documentId}`;
        localStorage.removeItem(storageKey);
        localStorage.removeItem(problemsKey);

        const accountabilityRef = doc(db, FIRESTORE_COLLECTION, documentId);
        setDoc(
          accountabilityRef,
          {
            data: { startDate: null, dailyRecords: {} },
            problems: [],
            setupComplete: false,
            updatedAt: Date.now(),
          },
          { merge: true }
        );

        window.location.reload();
      }
    }
  };

  const editProblems = () => {
    if (isReadOnly) {
      alert(
        '🔒 Cannot edit in read-only mode. Switch to "Your Tracker" to create your own.'
      );
      return;
    }

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

            {/* Mode Switcher */}
            <div
              style={{
                marginTop: '20px',
                display: 'flex',
                gap: '10px',
                justifyContent: 'center',
              }}
            >
              <button
                className={`btn ${
                  viewMode === 'public' ? 'btn-primary' : 'btn-secondary'
                }`}
                onClick={() => setViewMode('public')}
              >
                👁️ View Saiteja's Tracker
              </button>
              <button
                className={`btn ${
                  viewMode === 'personal' ? 'btn-primary' : 'btn-secondary'
                }`}
                onClick={() => setViewMode('personal')}
              >
                🎯 Your Tracker
              </button>
            </div>

            {viewMode === 'public' && !isAdmin && (
              <div
                style={{
                  marginTop: '15px',
                  padding: '10px',
                  background: '#fef2f2',
                  borderRadius: '8px',
                  fontSize: '0.9em',
                  color: '#991b1b',
                }}
              >
                👁️ Viewing Saiteja's accountability tracker (read-only). Switch
                to "Your Tracker" to create your own!
              </div>
            )}

            {viewMode === 'public' && isAdmin && (
              <div
                style={{
                  marginTop: '15px',
                  padding: '10px',
                  background: '#f0fdf4',
                  borderRadius: '8px',
                  fontSize: '0.9em',
                  color: '#166534',
                }}
              >
                ✏️ You can edit Saiteja's public tracker. Everyone can view your
                progress!
              </div>
            )}

            {viewMode === 'personal' && (
              <div
                style={{
                  marginTop: '15px',
                  padding: '10px',
                  background: user ? '#f0fdf4' : '#fef9c3',
                  borderRadius: '8px',
                  fontSize: '0.9em',
                  color: user ? '#166534' : '#854d0e',
                }}
              >
                {user
                  ? `☁️ Signed in as ${user.email} - Your data syncs across devices`
                  : '💾 Anonymous mode - Data saved locally. Sign in to sync across devices.'}
              </div>
            )}
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
                unstoppable momentum.
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
                <button
                  className='btn btn-primary'
                  onClick={nextStep}
                  disabled={isReadOnly}
                >
                  {isReadOnly ? '🔒 Read-Only Mode' : "Let's Begin 🚀"}
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
                For each obstacle, define your concrete approach and strategy.
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
      {/* Mode Switcher at top */}
      <div
        style={{
          background: 'white',
          padding: '15px',
          borderRadius: '15px',
          marginBottom: '20px',
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
        }}
      >
        <button
          className={`btn ${
            viewMode === 'public' ? 'btn-primary' : 'btn-secondary'
          }`}
          onClick={() => setViewMode('public')}
        >
          👁️ View Saiteja's Tracker
        </button>
        <button
          className={`btn ${
            viewMode === 'personal' ? 'btn-primary' : 'btn-secondary'
          }`}
          onClick={() => setViewMode('personal')}
        >
          🎯 Your Tracker
        </button>
      </div>

      <div className='accountability-header'>
        <h1>🎯 Get Better Everyday</h1>
        <p style={{ fontSize: '1.2em', color: '#666', marginTop: '10px' }}>
          {viewMode === 'public'
            ? "Saiteja's Journey"
            : 'Chase Excellence Every Single Day'}
        </p>

        {isSyncing && (
          <div
            style={{
              marginTop: '10px',
              fontSize: '0.9em',
              color: '#667eea',
              fontWeight: 'bold',
            }}
          >
            ☁️ Syncing to cloud...
          </div>
        )}

        {isReadOnly && (
          <div
            style={{
              marginTop: '10px',
              fontSize: '0.9em',
              color: '#991b1b',
              fontWeight: 'bold',
            }}
          >
            👁️ Read-only mode - Viewing Saiteja's progress
          </div>
        )}

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
                          disabled={isReadOnly}
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
                        disabled={status !== undefined || isReadOnly}
                      >
                        {isReadOnly ? '🔒 Read-Only' : '✅ Conquered Today'}
                      </button>
                      <button
                        className='btn btn-danger'
                        onClick={() => markProblem(problem.id, false)}
                        disabled={status !== undefined || isReadOnly}
                      >
                        {isReadOnly ? '🔒 Read-Only' : '❌ Failed Today'}
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
          <button
            className='btn btn-primary'
            onClick={editProblems}
            disabled={isReadOnly}
          >
            {isReadOnly ? '🔒 Read-Only' : '✏️ Edit Problems & Approaches'}
          </button>
          <button
            className='btn btn-danger'
            onClick={resetData}
            style={{ marginLeft: '10px' }}
            disabled={isReadOnly}
          >
            {isReadOnly ? '🔒 Read-Only' : '🔄 Reset All Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
