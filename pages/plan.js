import { state } from '../js/state.js';
import { generatePlan } from '../js/plan.js';
import { aiService } from '../js/ai.js';
import { router } from '../js/router.js';
import { t } from '../js/i18n.js';
import { db } from '../js/supabase.js';

const SESSION_COLORS = {
  'Easy Run':    { badge: 'zone-easy',      dot: '#4a9e35' },
  'Tempo Run':   { badge: 'zone-tempo',     dot: '#c8900a' },
  'Intervall':   { badge: 'zone-interval',  dot: '#c04040' },
  'Langer Lauf': { badge: 'zone-threshold', dot: '#b06020' },
  'Ruhetag':     { badge: '',               dot: '#2a2a2a' },
};

const DAY_NAMES = ['So','Mo','Di','Mi','Do','Fr','Sa'];
const TODAY_SHORT = DAY_NAMES[new Date().getDay()];

import { el, formatDist, convertFromKm, getUnitLabel } from '../js/utils.js';

function weekCard(weekData, expanded, onToggle) {
  const { phase, recovery, sessions, week } = weekData;
  const totalKm = sessions.reduce((s, d) => s + (d.km || 0), 0);
  const runDays = sessions.filter(d => d.type !== 'Ruhetag').length;

  // Datumsbereich berechnen
  const startOfPlan = new Date(); // Annahme: Start heute
  const startDate = new Date(startOfPlan);
  startDate.setDate(startDate.getDate() + (week - 1) * 7);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  const dateRange = `${startDate.toLocaleDateString('de-DE', {day:'2-digit', month:'2-digit'})} - ${endDate.toLocaleDateString('de-DE', {day:'2-digit', month:'2-digit'})}`;

  const label = recovery 
    ? t('plan.recovery_week', { w: week }) 
    : t('plan.training_week', { w: week, phase: phase });

  const wrap = el('div', { style: 'margin-bottom:6px;' });

  // Header (immer sichtbar)
  const header = el('div', {
    style: `
      display:flex;align-items:center;justify-content:space-between;
      padding:12px 14px;
      background:var(--bg-card);
      border:0.5px solid ${expanded ? 'var(--green-mid)' : 'var(--border)'};
      border-radius:${expanded ? '10px 10px 0 0' : 'var(--radius-md)'};
      cursor:pointer;
      user-select:none;
      transition:border-color .15s;
    `,
    onClick: onToggle,
  });

  const leftSide = el('div', { style: 'display:flex;flex-direction:column;gap:3px;' });
  leftSide.innerHTML = `
    <div style="display:flex; align-items:center; gap:8px;">
      <span style="font-size:14px;font-weight:500;color:${expanded ? 'var(--green)' : 'var(--text)'};">${label}</span>
      <span style="font-size:10px; font-family:var(--font-mono); color:var(--text-muted);">${dateRange}</span>
    </div>
    <span style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">${t('plan.units', { n: runDays })} · ${formatDist(totalKm)}</span>
  `;


  const rightSide = el('div', { style: 'display:flex;align-items:center;gap:8px;' });
  if (recovery) {
    rightSide.innerHTML += `<span style="font-size:10px;font-family:var(--font-mono);background:var(--green-dim);color:var(--green);padding:2px 8px;border-radius:20px;">${t('plan.recovery_badge')}</span>`;
  }
  rightSide.innerHTML += `<span style="color:var(--text-muted);font-size:16px;transition:transform .2s;transform:rotate(${expanded ? '180' : '0'}deg);">↓</span>`;

  header.appendChild(leftSide);
  header.appendChild(rightSide);
  wrap.appendChild(header);

  // Body (nur wenn expanded)
  if (expanded) {
    const body = el('div', {
      style: `
        background:var(--bg-card);
        border:0.5px solid var(--green-mid);
        border-top:none;
        border-radius:0 0 10px 10px;
        padding:4px 0 8px;
      `
    });

    sessions.forEach(session => {
      const isToday = session.day === TODAY_SHORT && week === 1;
      const isRest  = session.type === 'Ruhetag';
      const colors  = SESSION_COLORS[session.type] || SESSION_COLORS['Ruhetag'];

      const displayDay = t(`dashboard.day_map.${session.day}`);
      const displayType = t(`dashboard.sessions.${session.type}`);

      const row = el('div', {
        style: `
          display:flex;align-items:center;gap:12px;
          padding:9px 14px;
          background:${isToday ? 'var(--green-dim)' : 'transparent'};
        `
      });

      row.innerHTML = `
        <span class="mono" style="font-size:12px;color:${isToday ? 'var(--green)' : 'var(--text-muted)'};width:24px;flex-shrink:0;">${displayDay}</span>
        <div style="width:5px;height:5px;border-radius:50%;background:${colors.dot};flex-shrink:0;"></div>
        <div style="flex:1;">
          <span style="font-size:13px;color:${isRest ? 'var(--text-muted)' : 'var(--text)'};">${displayType}</span>
          ${session.note ? `<p style="font-size:10px;color:var(--text-muted);margin-top:1px;">${session.note}</p>` : ''}
        </div>
        ${session.km ? `<span class="mono" style="font-size:12px;color:var(--text-muted);">${formatDist(session.km)}</span>` : ''}
      `;
      body.appendChild(row);
    });

    wrap.appendChild(body);
  }

  return wrap;
}

export function PlanPage() {
  const goal  = state.get('goal')  || 'hm';
  const level = state.get('level') || 'intermediate';
  const days  = state.get('days').length ? state.get('days') : ['Mo','Mi','Sa'];
  const fitnessTime = state.get('fitnessTime');
  const targetTime = state.get('targetTime');
  const raceDate = state.get('raceDate');
  const log = state.get('runLog') || [];
  const weeklyGoal = state.get('weeklyGoal') || 30;

  // Wochenvolumen berechnen
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0,0,0,0);
  const currentWeekKm = log
    .filter(run => new Date(run.date) >= monday)
    .reduce((sum, run) => sum + parseFloat(run.km || 0), 0);

  let loading = false;

  // Plan aus State oder neu generieren (KI-First)
  let plan = state.get('weekPlan');
  let expandedWeek = 1;

  const page = el('div', { class: 'page fade-up' });
  const lang = localStorage.getItem('lang') || 'de';

  function refresh() {
    const currentPlan = state.get('weekPlan');
    list.innerHTML = '';
    
    if (!currentPlan && loading) {
      list.innerHTML = `
        <div style="text-align:center; padding: 3rem 1rem;">
          <div style="font-size:24px; margin-bottom: 1rem;">✨</div>
          <p class="muted" style="font-size:14px;">Pacora erstellt deinen persönlichen Trainingsplan...</p>
        </div>
      `;
      return;
    }

    if (currentPlan) {
      currentPlan.forEach(weekData => {
        const isExpanded = weekData.week === expandedWeek;
        const card = weekCard(weekData, isExpanded, () => {
          expandedWeek = isExpanded ? null : weekData.week;
          refresh();
        });
        list.appendChild(card);
      });
    }
  }

  if (!plan && !loading) {
    (async () => {
      loading = true;
      refresh(); // Show loading state
      try {
        const { goal, level, days, fitnessTime, targetTime, raceDate } = state.get();
        const newPlan = await aiService.generatePersonalizedPlan({ goal, level, days, fitnessTime, targetTime, raceDate, lang });
        state.set('weekPlan', newPlan);
        const user = state.get('user');
        if (user) await db.saveProfile(user.id);
        refresh();
      } catch (err) {
        console.error("Initial AI plan failed, using fallback:", err);
        const fallbackPlan = generatePlan(goal, level, days);
        state.set('weekPlan', fallbackPlan);
        refresh();
      } finally {
        loading = false;
      }
    })();
  }

  // Header
 // page.innerHTML = `<div class="logo"><div class="logo-dot"></div>PACORA</div>`;

  const heading = el('div', { style: 'display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem;' });
  const goalDisplay = goal === 'hm' ? 'Halbmarathon' : (goal === 'marathon' ? 'Marathon' : (goal === '10k' ? '10 km' : (goal === '5k' ? '5 km' : 'Fit bleiben')));
  const formattedRaceDate = raceDate ? new Date(raceDate).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : t('plan.not_set');

  heading.innerHTML = `
    <div>
      <h2 style="margin-bottom:.25rem;">${t('plan.title')}</h2>
      <div style="font-size:14px; font-weight:500; color:var(--green); margin-bottom: 4px;">${goalDisplay}</div>
      <div style="font-size:12px; color:var(--text-muted);">
        ${t('plan.curr')}: ${convertFromKm(currentWeekKm).toFixed(1)} / ${convertFromKm(weeklyGoal).toFixed(0)} ${getUnitLabel()} ${t('dashboard.weeks').toLowerCase()}<br>
        ${t('plan.target')}: ${targetTime || t('plan.not_set')}<br>
        <span style="display:inline-block; margin-top:4px;">🏁 ${t('plan.race')}: ${formattedRaceDate}</span>
      </div>
    </div>
  `;

  const aiBtn = el('button', {
    class: 'btn',
    style: 'background:var(--green-dim);color:var(--green);border:0.5px solid var(--green-mid);font-size:11px;padding:6px 10px; transition: all 0.3s;',
    onClick: async () => {
      if (loading) return;
      loading = true;
      aiBtn.innerHTML = '✨ Generiere...';
      aiBtn.style.opacity = '0.5';
      aiBtn.style.cursor = 'wait';
      try {
        const { goal, level, days, fitnessTime, targetTime, raceDate } = state.get();
        const newPlan = await aiService.generatePersonalizedPlan({ goal, level, days, fitnessTime, targetTime, raceDate, lang });
        state.set('weekPlan', newPlan);
        const user = state.get('user');
        if (user) await db.saveProfile(user.id);
        expandedWeek = 1;
        refresh();
      } catch (err) {
        console.error(err);
        alert('Fehler: ' + err.message);
      } finally {
        loading = false;
        aiBtn.textContent = t('plan.ai');
        aiBtn.style.opacity = '1';
        aiBtn.style.cursor = 'pointer';
      }
    }
  }, t('plan.ai'));
  
  heading.appendChild(el('div', {style: 'display:flex; flex-direction:column; gap:8px; align-items:flex-end;'}, aiBtn));
  page.appendChild(heading);

  const list = el('div', { id: 'plan-list' });
  page.appendChild(list);
  
  refresh();
  return page;
}
