export const MAIN_ACTIVITIES = ['Studying', 'Sleeping', 'Wasted', 'MISC'];
export const MISC_ACTIVITIES = [
  'MISC-BREAK',
  'MISC-GYM',
  'MISC-WOKE_UP',
  'MISC-BREAKFAST',
  'MISC-LUNCH',
  'MISC-DINNER',
];

export const LIVE = { DOC_ID: 'saiteja' }; // public live doc id
export const ADMIN = { UID: 'qR6lho89MLVsx21JkpsfVygFE9W2' }; // your Firebase UID after you sign in once

// utils/constants.js
export const STORAGE = {
  DAILY: 'TT_DAILY',
  HOURLY: 'TT_HOURLY',
  PATTERNS: 'TT_PATTERNS',
  REFLECTIONS: 'TT_REFLECTIONS',
  POMODORO: 'TT_POMODORO',
  HAPPINESS_ITEMS: 'tt_happiness_items',
  HAPPINESS_STATUS: 'tt_happiness_status',
};

// Data source key + canonical values
export const DS_KEY = 'DATA_SOURCE';
export const SOURCE = {
  LOCAL: 'local',
  LIVE: `live:${LIVE.DOC_ID}`,
};
