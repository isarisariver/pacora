// ─── State ───────────────────────────────────────────────
// Single source of truth for the whole app.
// Pages read from state.get() and write via state.set().

const _state = {
  // Onboarding
  goal:     null,  // 'hm' | 'marathon' | '5k' | 'fit'
  level:    null,  // 'beginner' | 'intermediate' | 'advanced'
  days:     [],    // ['Mo','Di', ...]
  injury:   null,  // 'none' | 'yes'
  fitnessTime: null, // string e.g. "28:30" (current best time)
  targetTime: null, // string e.g. "03:45:00" (goal time)
  raceDate: null,  // string

  // Run log entries: [{ km, time, feel, date, shoeId }]
  runLog: [],

  // Shoes: [{ id, name, km, active }]
  shoes: [],

  // Generated multi-week plan: [{ week, label, sessions: [{ day, type, km }] }]
  weekPlan: null,

  // Weekly mileage goal
  weeklyGoal: 30,

  // User (filled after auth)
  user: null,

  // Preferred unit: 'km' | 'mi'
  unit: localStorage.getItem('unit') || 'km',
};

export const state = {
  get: (key) => key ? _state[key] : { ..._state },
  set: (key, val) => { _state[key] = val; },
  setMany: (obj) => Object.assign(_state, obj),
};

// State global verfügbar machen für Debugging in der Konsole
window.state = state;
