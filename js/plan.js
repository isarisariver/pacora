// ─── Plan Generator ───────────────────────────────────────
// Regelbasierte Logik für den Mehrwochenplan.
// Wird später durch Claude API-Call ersetzt.
import { t } from './i18n.js';

const GOAL_WEEKS = { hm: 12, marathon: 16, '10k': 10, '5k': 8, fit: 8 };

const SESSION_TEMPLATES = {
  beginner: [
    { type: 'Easy Run',    kmBase: 4,  phase: 'build' },
    { type: 'Easy Run',    kmBase: 5,  phase: 'build' },
    { type: 'Langer Lauf', kmBase: 8,  phase: 'build' },
  ],
  intermediate: [
    { type: 'Easy Run',    kmBase: 6,  phase: 'build' },
    { type: 'Tempo Run',   kmBase: 5,  phase: 'build' },
    { type: 'Easy Run',    kmBase: 6,  phase: 'build' },
    { type: 'Langer Lauf', kmBase: 12, phase: 'build' },
  ],
  advanced: [
    { type: 'Easy Run',    kmBase: 8,  phase: 'build' },
    { type: 'Intervall',   kmBase: 6,  phase: 'build' },
    { type: 'Tempo Run',   kmBase: 6,  phase: 'build' },
    { type: 'Easy Run',    kmBase: 8,  phase: 'build' },
    { type: 'Langer Lauf', kmBase: 16, phase: 'build' },
  ],
  '10k_intermediate': [
    { type: 'Easy Run',    kmBase: 5,  phase: 'build' },
    { type: 'Tempo Run',   kmBase: 5,  phase: 'build' },
    { type: 'Easy Run',    kmBase: 5,  phase: 'build' },
    { type: 'Langer Lauf', kmBase: 10, phase: 'build' },
  ],
};

// Phasendefinitionen je nach Woche (relativ zur Gesamtlänge)
function getPhase(week, totalWeeks) {
  const pct = week / totalWeeks;
  if (pct <= 0.25) return { name: t('plan.phases.Grundlage'),  multiplier: 0.80 };
  if (pct <= 0.60) return { name: t('plan.phases.Aufbau'),     multiplier: 1.00 };
  if (pct <= 0.80) return { name: t('plan.phases.Peak'),        multiplier: 1.15 };
  if (pct <= 0.90) return { name: t('plan.phases.Taper'),       multiplier: 0.70 };
  return               { name: t('plan.phases.Rennwoche'),    multiplier: 0.40 };
}

// Alle 4 Wochen eine Erholungswoche (Volumen -30%)
function isRecoveryWeek(week) { return week % 4 === 0; }

export function generatePlan(goal, level, days) {
  const totalWeeks = GOAL_WEEKS[goal] || 8;
  
  let templates;
  if (goal === '10k') {
    templates = SESSION_TEMPLATES['10k_intermediate'];
  } else {
    templates = SESSION_TEMPLATES[level] || SESSION_TEMPLATES['intermediate'];
  }
  
  const week = ['Mo','Di','Mi','Do','Fr','Sa','So'];

  const plan = [];

  for (let w = 1; w <= totalWeeks; w++) {
    const phase    = getPhase(w, totalWeeks);
    const recovery = isRecoveryWeek(w);
    const factor   = phase.multiplier * (recovery ? 0.7 : 1);

    let tplIdx = 0;
    const sessions = week.map(day => {
      if (!days.includes(day)) return { day, type: 'Ruhetag', km: null };
      const tpl = templates[tplIdx % templates.length];
      tplIdx++;
      const km = Math.round(tpl.kmBase * factor);
      return { day, type: tpl.type, km: km < 2 ? 2 : km };
    });

    plan.push({
      week:     w,
      phase:    phase.name,
      recovery,
      sessions,
    });
  }

  return plan;
}
