const translations = {
  de: {
    dashboard: { 
      title: 'Home', 
      today: 'HEUTE', 
      log_km: 'Distanz (km)', 
      log_time: 'Zeit (hh:mm:ss)', 
      log_date: 'DATUM (JJJJ-MM-TT)', 
      log_feel: 'GEFÜHL', 
      log_save: 'Lauf speichern',
      log_no_shoe: 'Kein Schuh gewählt',
      coach: 'COACH',
      countdown: 'RENNTAG COUNTDOWN',
      days_left: 'Noch <strong>{n} Tage</strong> bis zum Ziel',
      weeks: 'Wochen',
      weekly_progress: 'WOCHENFORTSCHRITT',
      weekly_plan: 'WOCHENPLAN',
      paces_title: 'TRAININGSPACES / KM',
      rest: 'Ruhetag',
      recovery: 'Erholung & Dehnen',
      days: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
      day_map: { 'So': 'So', 'Mo': 'Mo', 'Di': 'Di', 'Mi': 'Mi', 'Do': 'Do', 'Fr': 'Fr', 'Sa': 'Sa' },
      coach_msg: {
        hm: 'Halbmarathon braucht Geduld. Dein Easy-Pace ist dein bester Freund diese Woche.',
        marathon: 'Marathon ist ein Langstreckenprojekt. Vertrau dem Plan – jeder Kilometer zählt.',
        '10k': 'Speed kommt durch Qualität, nicht Quantität. Mach die Intervalle, lass den Rest locker.',
        '5k': 'Speed kommt durch Qualität, nicht Quantität. Mach die Intervalle, lass den Rest locker.',
        fit: 'Regelmäßigkeit schlägt Intensität. Einfach raus, auch wenn\'s kurz ist.',
        default: 'Guter Tag zum Laufen. Mach es.'
      },
      sessions: {
        'Easy Run': 'Lockerer Lauf',
        'Tempo Run': 'Tempolauf',
        'Intervall': 'Intervall',
        'Langer Lauf': 'Langer Lauf',
        'Ruhetag': 'Ruhetag'
      },
      pace_desc: {
        easy: 'Grundlage',
        tempo: 'Komfortabel hart',
        threshold: 'Laktatschwelle',
        interval: 'Max. Intensität'
      }
    },
    plan: { 
      title: 'Plan', 
      ai: '✨ Optimieren', 
      restart: '🔄 Plan neu starten',
      curr: 'Aktuell',
      target: 'Zielzeit',
      race: 'Renntag',
      not_set: 'Nicht gesetzt',
      units: '{n} Einheiten',
      days: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
      recovery_week: 'Woche {w} · Erholung',
      training_week: 'Woche {w} · {phase}',
      recovery_badge: 'ERHOLUNG',
      phases: {
        'Grundlage': 'Grundlage',
        'Aufbau': 'Aufbau',
        'Peak': 'Peak',
        'Taper': 'Taper',
        'Rennwoche': 'Rennwoche'
      }
    },
    history: { 
      title: 'Logs', 
      all: 'ALLE LÄUFE',
      records: 'PERSÖNLICHE BESTLEISTUNGEN',
      longest: 'Längster Lauf',
      fastest5: 'Bestzeit 5k',
      fastest10: 'Bestzeit 10k',
      fastestHM: 'Bestzeit HM',
      fastestM: 'Bestzeit Marathon',
      volume: 'WOCHENVOLUMEN',
      no_runs: 'Noch keine Läufe eingetragen.<br>Geh auf Dashboard → Lauf eintragen.',
      add: '+ Lauf',
      save: 'Speichern',
      cancel: 'Abbrechen',
      entries: '{n} Einträge gesamt',
      delete_confirm: 'Diesen Lauf wirklich löschen?',
      invalid_time: 'Ungültige Zeit',
      invalid_date: 'Datum ungültig (JJJJ-MM-TT)',
      chart_title: 'DISTANZ PRO LAUF'
    },
    profile: { 
      title: 'Profil', 
      subtitle: 'Verwalte deine Einstellungen',
      settings_group: 'EINSTELLUNGEN',
      edit: 'Plan ändern', 
      gear: '👟 Meine Ausrüstung', 
      logout: 'Ausloggen',
      goal: 'Ziel',
      level: 'Level',
      email: 'Email',
      weekly_goal: 'WOCHENZIEL',
      save_goal: 'Ziel speichern',
      export: '📊 Daten exportieren (.csv)',
      back: '← Zurück zum Profil',
      logged_in: 'Eingeloggt als',
      not_logged_in: 'Nicht eingeloggt.',
      theme_light: '☀️ Hellmodus',
      theme_dark: '🌙 Dunkelmodus'
    },
    onboarding: {
      step: 'Schritt {n} von {total}',
      step1_title: 'Was ist dein Ziel?',
      step1_desc: 'Dein Coach passt den Plan darauf ab.',
      step2_title: 'Wie fit bist du?',
      step2_desc: 'Damit dein Plan realistisch und machbar ist.',
      step3_title: 'Wann & Wie läufst du?',
      step3_desc: 'Trainings-Tage & Status.',
      step4_title: 'Dein Profil',
      step4_desc: 'Alles bereit. Hier ist eine Übersicht.',
      target_date: 'Zieldatum',
      target_time: 'Wunsch-Zielzeit',
      weekly_km: 'Wöchentliche KM der letzten 4 Wochen',
      injury_q: 'Verletzungshistorie?',
      create_plan: 'Plan erstellen →',
      back: '← Zurück',
      next: 'Weiter →',
      goals: {
        hm: { label: 'Halbmarathon', sub: '21,1 km' },
        marathon: { label: 'Marathon', sub: '42,2 km' },
        '10k': { label: '10 km', sub: 'Schneller werden' },
        '5k': { label: '5 km verbessern', sub: 'Speed & Pace' },
        fit: { label: 'Fit bleiben', sub: 'Regelmäßig laufen' }
      },
      levels: {
        beginner: { label: 'Einsteiger', sub: 'Ich laufe unregelmäßig oder fange gerade an' },
        intermediate: { label: 'Fortgeschritten', sub: '1–3 Läufe pro Woche, schon erste Rennen' },
        advanced: { label: 'Erfahren', sub: '3–5 Läufe pro Woche, klare Zielzeiten' }
      },
      injuries: {
        none: 'Keine Verletzungen',
        yes: 'Ja, hatte Probleme'
      },
      summary: {
        goal: 'Ziel',
        level: 'Level',
        time: 'Zeit',
        days: 'Tage',
        race: 'Zieldatum'
      }
    },
    gear: {
      title: 'Meine Ausrüstung',
      subtitle: 'Tracke die Kilometer deiner Schuhe',
      add: 'Schuh hinzufügen',
      placeholder: 'z.B. Nike Pegasus 40',
      label: 'NEUES PAAR',
      no_shoes: 'Noch keine Schuhe eingetragen.',
      delete_confirm: 'Schuh "{name}" wirklich löschen?',
      km_limit: '{km} / {limit} {unit}'
    },
    units: {
      km: 'Kilometer',
      mi: 'Meilen'
    }
  },
  en: {
    dashboard: { 
      title: 'Home', 
      today: 'TODAY', 
      log_km: 'Distance (km)', 
      log_time: 'Time (hh:mm:ss)', 
      log_date: 'DATE (YYYY-MM-DD)', 
      log_feel: 'FEELING', 
      log_save: 'Save Run',
      log_no_shoe: 'No shoe selected',
      coach: 'COACH',
      countdown: 'RACE DAY COUNTDOWN',
      days_left: '<strong>{n} days</strong> left until your goal',
      weeks: 'Weeks',
      weekly_progress: 'WEEKLY PROGRESS',
      weekly_plan: 'WEEKLY PLAN',
      paces_title: 'TRAINING PACES / KM',
      rest: 'Rest Day',
      recovery: 'Recovery & Stretching',
      days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      day_map: { 'So': 'Sun', 'Mo': 'Mon', 'Di': 'Tue', 'Mi': 'Wed', 'Do': 'Thu', 'Fr': 'Fri', 'Sa': 'Sat' },
      coach_msg: {
        hm: 'Half marathon requires patience. Your easy pace is your best friend this week.',
        marathon: 'Marathon is a long-term project. Trust the plan – every kilometer counts.',
        '10k': 'Speed comes through quality, not quantity. Do the intervals, keep the rest easy.',
        '5k': 'Speed comes through quality, not quantity. Do the intervals, keep the rest easy.',
        fit: 'Consistency beats intensity. Just get out there, even if it\'s short.',
        default: 'Good day for a run. Go for it.'
      },
      sessions: {
        'Easy Run': 'Easy Run',
        'Tempo Run': 'Tempo Run',
        'Intervall': 'Interval',
        'Langer Lauf': 'Long Run',
        'Ruhetag': 'Rest Day'
      },
      pace_desc: {
        easy: 'Base',
        tempo: 'Comfortably hard',
        threshold: 'Lactate threshold',
        interval: 'Max intensity'
      }
    },
    plan: { 
      title: 'Plan', 
      ai: '✨ Optimize', 
      restart: '🔄 Restart Plan',
      curr: 'Current',
      target: 'Target Time',
      race: 'Race Day',
      not_set: 'Not set',
      units: '{n} units',
      days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      recovery_week: 'Week {w} · Recovery',
      training_week: 'Week {w} · {phase}',
      recovery_badge: 'RECOVERY',
      phases: {
        'Grundlage': 'Foundation',
        'Aufbau': 'Build',
        'Peak': 'Peak',
        'Taper': 'Taper',
        'Rennwoche': 'Race Week'
      }
    },
    history: { 
      title: 'History', 
      all: 'ALL RUNS',
      records: 'PERSONAL BESTS',
      longest: 'Longest Run',
      fastest5: 'Fastest 5k',
      fastest10: 'Fastest 10k',
      fastestHM: 'Fastest HM',
      fastestM: 'Fastest Marathon',
      volume: 'WEEKLY VOLUME',
      no_runs: 'No runs logged yet.<br>Go to Dashboard → Log a run.',
      add: '+ Log Run',
      save: 'Save',
      cancel: 'Cancel',
      entries: '{n} entries total',
      delete_confirm: 'Do you really want to delete this run?',
      invalid_time: 'Invalid time',
      invalid_date: 'Invalid date (YYYY-MM-DD)',
      chart_title: 'DISTANCE PER RUN'
    },
    profile: { 
      title: 'Profile', 
      subtitle: 'Manage your settings',
      settings_group: 'SETTINGS',
      edit: 'Edit Plan', 
      gear: '👟 My Gear', 
      logout: 'Logout',
      goal: 'Goal',
      level: 'Level',
      email: 'Email',
      weekly_goal: 'WEEKLY GOAL',
      save_goal: 'Save Goal',
      export: '📊 Export Data (.csv)',
      back: '← Back to Profile',
      logged_in: 'Logged in as',
      not_logged_in: 'Not logged in.',
      theme_light: '☀️ Light Mode',
      theme_dark: '🌙 Dark Mode'
    },
    onboarding: {
      step: 'Step {n} of {total}',
      step1_title: 'What is your goal?',
      step1_desc: 'Your coach will tailor the plan to it.',
      step2_title: 'How fit are you?',
      step2_desc: 'To make your plan realistic and achievable.',
      step3_title: 'When & How do you run?',
      step3_desc: 'Training days & status.',
      step4_title: 'Your Profile',
      step4_desc: 'All set. Here is an overview.',
      target_date: 'Target Date',
      target_time: 'Desired Target Time',
      weekly_km: 'Weekly KM of the last 4 weeks',
      injury_q: 'Injury history?',
      create_plan: 'Create Plan →',
      back: '← Back',
      next: 'Next →',
      goals: {
        hm: { label: 'Half Marathon', sub: '21.1 km' },
        marathon: { label: 'Marathon', sub: '42.2 km' },
        '10k': { label: '10 km', sub: 'Get faster' },
        '5k': { label: '5 km improve', sub: 'Speed & Pace' },
        fit: { label: 'Stay Fit', sub: 'Run regularly' }
      },
      levels: {
        beginner: { label: 'Beginner', sub: 'I run irregularly or am just starting' },
        intermediate: { label: 'Intermediate', sub: '1–3 runs per week, first races done' },
        advanced: { label: 'Advanced', sub: '3–5 runs per week, clear goal times' }
      },
      injuries: {
        none: 'No injuries',
        yes: 'Yes, had some issues'
      },
      summary: {
        goal: 'Goal',
        level: 'Level',
        time: 'Time',
        days: 'Days',
        race: 'Target Date'
      }
    },
    gear: {
      title: 'My Gear',
      subtitle: 'Track your shoe mileage',
      add: 'Add Shoe',
      placeholder: 'e.g. Nike Pegasus 40',
      label: 'NEW PAIR',
      no_shoes: 'No shoes added yet.',
      delete_confirm: 'Delete shoe "{name}"?',
      km_limit: '{km} / {limit} {unit}'
    },
    units: {
      km: 'Kilometers',
      mi: 'Miles'
    }
  }
};

let currentLang = localStorage.getItem('lang') || 'de';

export function t(key, params = {}) {
  const keys = key.split('.');
  let res = translations[currentLang];
  for (const k of keys) res = res?.[k];
  if (!res) return key;

  if (Array.isArray(res)) return res;
  if (typeof res !== 'string') return key;

  // Simple template replace for things like {n}
  Object.keys(params).forEach(p => {
    res = res.replace(`{${p}}`, params[p]);
  });
  return res;
}

export function setLang(lang) {
  localStorage.setItem('lang', lang);
  window.location.reload();
}
