import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  auth,
  db,
  signInGoogle,
  doc,
  onSnapshot,
  setDoc,
  onAuthStateChanged,
} from '../../utils/firebase';
import '../../styles/accountability.css';

const STORAGE_KEY = 'ACCOUNTABILITY_DATA';
const PROBLEMS_KEY = 'ACCOUNTABILITY_PROBLEMS';

export default function AccountabilityView() {
  const [currentStep, setCurrentStep] = useState(1);
  const [problems, setProblems] = useState([]);
  const [setupComplete, setSetupComplete] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced', 'syncing', 'offline'
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);

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

  // Handle window resize for responsive detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Firebase sync function
  const syncToFirebase = useCallback(
    async (newData, newProblems) => {
      if (!userId) return;

      setSyncStatus('syncing');
      try {
        const userDocRef = doc(db, 'accountability', userId);
        await setDoc(
          userDocRef,
          {
            data: newData,
            problems: newProblems,
            lastUpdated: new Date().toISOString(),
          },
          { merge: true }
        );
        setSyncStatus('synced');
      } catch (error) {
        console.error('Firebase sync error:', error);
        setSyncStatus('offline');
      }
    },
    [userId]
  );

  // Initialize Firebase Auth and load data
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setUserEmail(user.email);
      } else {
        // No user signed in - will show login screen
        setUserId(null);
        setUserEmail(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Handle Google Sign In
  const handleSignIn = async () => {
    setIsAuthLoading(true);
    try {
      const user = await signInGoogle();
      if (user) {
        setUserId(user.uid);
        setUserEmail(user.email);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      alert('Failed to sign in. Please try again.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await auth.signOut();
      setUserId(null);
      setUserEmail(null);
      setSetupComplete(false);
      setData({ startDate: null, dailyRecords: {} });
      setProblems([]);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Load data from Firebase or localStorage
  useEffect(() => {
    if (!userId) return;

    const userDocRef = doc(db, 'accountability', userId);

    // Set up real-time listener for cross-device sync
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const firebaseData = docSnap.data();
          setData(firebaseData.data || { startDate: null, dailyRecords: {} });
          setProblems(firebaseData.problems || []);
          if (
            firebaseData.data?.startDate &&
            firebaseData.problems?.length > 0
          ) {
            setSetupComplete(true);
          }
          // Also save to localStorage as backup
          localStorage.setItem(STORAGE_KEY, JSON.stringify(firebaseData.data));
          localStorage.setItem(
            PROBLEMS_KEY,
            JSON.stringify(firebaseData.problems)
          );
        } else {
          // No Firebase data, try localStorage
          loadFromLocalStorage();
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Firebase listener error:', error);
        setSyncStatus('offline');
        loadFromLocalStorage();
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const loadFromLocalStorage = () => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const savedProblems = localStorage.getItem(PROBLEMS_KEY);

    if (savedData && savedProblems) {
      const parsedData = JSON.parse(savedData);
      const parsedProblems = JSON.parse(savedProblems);
      setData(parsedData);
      setProblems(parsedProblems);
      if (parsedData.startDate && parsedProblems.length > 0) {
        setSetupComplete(true);
      }
    }
  };

  // Set random quote on mount
  useEffect(() => {
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

  // Save data to localStorage and Firebase
  useEffect(() => {
    if (setupComplete) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(PROBLEMS_KEY, JSON.stringify(problems));
      syncToFirebase(data, problems);
    }
  }, [data, problems, setupComplete, syncToFirebase]);

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
    if (
      confirm(
        '⚠️ WARNING: This will delete ALL your progress and data. Are you absolutely sure?'
      )
    ) {
      if (confirm('This action cannot be undone. Confirm again to proceed.')) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(PROBLEMS_KEY);
        // Also clear Firebase data
        if (userId) {
          const userDocRef = doc(db, 'accountability', userId);
          setDoc(userDocRef, {
            data: { startDate: null, dailyRecords: {} },
            problems: [],
            lastUpdated: new Date().toISOString(),
          });
        }
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

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return '🔄';
      case 'offline':
        return '📴';
      default:
        return '☁️';
    }
  };

  const getSyncStatusText = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Syncing...';
      case 'offline':
        return 'Offline mode';
      default:
        return 'Synced';
    }
  };

  // Loading state
  if (isLoading && userId) {
    return (
      <div className='accountability-container'>
        <div className='loading-screen'>
          <div className='loading-spinner'></div>
          <h2>Loading your journey...</h2>
          <p>Syncing across devices</p>
        </div>
      </div>
    );
  }

  // Login screen when not authenticated
  if (!userId) {
    return (
      <div className='accountability-container'>
        <div className='login-screen'>
          <div className='login-card'>
            <h1>🎯 Get Better Everyday</h1>
            <p className='login-subtitle'>
              Track your progress, build habits, and transform your life
            </p>
            <div className='login-features'>
              <div className='feature-item'>
                ✅ Track daily progress on your goals
              </div>
              <div className='feature-item'>🔥 Build and maintain streaks</div>
              <div className='feature-item'>
                ☁️ Sync across all your devices
              </div>
              <div className='feature-item'>
                📊 See your 20-year journey progress
              </div>
            </div>
            <button
              className='btn btn-google'
              onClick={handleSignIn}
              disabled={isAuthLoading}
            >
              {isAuthLoading ? (
                <>
                  <span className='btn-spinner'></span>
                  Signing in...
                </>
              ) : (
                <>
                  <svg
                    className='google-icon'
                    viewBox='0 0 24 24'
                    width='20'
                    height='20'
                  >
                    <path
                      fill='#4285F4'
                      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                    />
                    <path
                      fill='#34A853'
                      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                    />
                    <path
                      fill='#FBBC05'
                      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                    />
                    <path
                      fill='#EA4335'
                      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                    />
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
            <p className='login-note'>
              Sign in to sync your progress across all devices
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!setupComplete) {
    return (
      <div className='accountability-container'>
        <div className='setup-wizard'>
          <div className='wizard-header'>
            <h1>🎯 Get Better Everyday</h1>
            <p className='wizard-subtitle'>
              Let's set up your journey to excellence
            </p>
          </div>

          <div className='step-indicator'>
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`step-dot ${currentStep >= step ? 'active' : ''}`}
              >
                {step}
              </div>
            ))}
          </div>

          {currentStep === 1 && (
            <div className='wizard-step active'>
              <h2 className='step-title'>
                Step 1: Understanding Your Challenge
              </h2>
              <div className='step-content'>
                <p className='step-description'>
                  This system helps you overcome procrastination and build
                  unstoppable momentum. You'll track daily progress, define your
                  approach to fixing problems, and see your transformation over
                  the next 20 years.
                </p>
                <div className='how-it-works'>
                  <h3>Here's how it works:</h3>
                  <div className='steps-grid'>
                    <div className='step-item'>
                      <span className='step-icon'>1️⃣</span>
                      <span>Define your biggest obstacles</span>
                    </div>
                    <div className='step-item'>
                      <span className='step-icon'>2️⃣</span>
                      <span>Create an action plan for each problem</span>
                    </div>
                    <div className='step-item'>
                      <span className='step-icon'>3️⃣</span>
                      <span>Track daily progress and reflections</span>
                    </div>
                    <div className='step-item'>
                      <span className='step-icon'>4️⃣</span>
                      <span>Build streaks and see your growth over time</span>
                    </div>
                  </div>
                </div>
              </div>
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
              <h2 className='step-title'>
                Step 2: What Are Your Biggest Obstacles?
              </h2>
              <p className='step-description'>
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
              <h2 className='step-title'>
                Step 3: How Will You Fix Each Problem?
              </h2>
              <p className='step-description'>
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
      {/* Sync Status Indicator */}
      <div className='sync-status' title={getSyncStatusText()}>
        <span className='sync-icon'>{getSyncStatusIcon()}</span>
        <span className='sync-text'>{getSyncStatusText()}</span>
      </div>

      <div className='accountability-header'>
        <h1>🎯 Get Better Everyday</h1>
        <p className='header-subtitle'>Chase Excellence Every Single Day</p>
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
                    <p className='best-streak-text'>
                      🏆 Best Streak: {problem.bestStreak} days
                    </p>
                  )}

                  <div className='daily-reflection-section'>
                    {status === undefined ? (
                      <>
                        <h4 className='reflection-title'>
                          📝 Step 1: Write Your Reflection First
                        </h4>
                        <textarea
                          className='reflection-input'
                          id={`reflection_${problem.id}`}
                          placeholder="How did you apply your approach today? What worked? What didn't?"
                        />
                        <p className='reflection-hint'>
                          ⬆️ Write your reflection above before marking as
                          conquered/failed
                        </p>
                      </>
                    ) : (
                      <>
                        <h4 className='reflection-title'>
                          📝 Your Reflection:
                        </h4>
                        <div className='reflection-display'>
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
          <div className='calendar-legend'>
            <span className='legend-item'>
              <span className='legend-dot perfect'></span> Perfect Day
            </span>
            <span className='legend-item'>
              <span className='legend-dot partial'></span> Partial
            </span>
            <span className='legend-item'>
              <span className='legend-dot failed'></span> Failed
            </span>
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
          <p className='progress-text'>
            <strong>{yearsTracking}</strong> years tracking |{' '}
            <strong>{Math.max(7300 - stats.totalDays, 0)}</strong> days
            remaining to 20 years
          </p>
        </div>

        <div className='accountability-card settings-card'>
          <h2>⚙️ Settings</h2>
          <div className='settings-buttons'>
            <button className='btn btn-primary' onClick={editProblems}>
              ✏️ Edit Problems & Approaches
            </button>
            <button className='btn btn-danger' onClick={resetData}>
              🗑️ Reset All Data
            </button>
          </div>
          {userEmail && (
            <div className='user-info-section'>
              <p className='user-email'>Signed in as: {userEmail}</p>
              <button
                className='btn btn-secondary btn-small'
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
