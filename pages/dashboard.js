import { state } from '../js/state.js';
import { db } from '../js/supabase.js';
import { router } from '../js/router.js';
import { generatePlan } from '../js/plan.js';
import { el, normalizeTime, calcPace, formatDist, convertToKm, convertFromKm, getUnitLabel } from '../js/utils.js';
import { t } from '../js/i18n.js';


// ─── Helpers ──────────────────────────────────────────────

const GOAL_LABELS  = { 
  hm: t('onboarding.goals.hm.label'), 
  marathon: t('onboarding.goals.marathon.label'), 
  '10k': t('onboarding.goals.10k.label'), 
  '5k': t('onboarding.goals.5k.label'), 
  fit: t('onboarding.goals.fit.label') 
};
const LEVEL_LABELS = { 
  beginner: t('onboarding.levels.beginner.label'), 
  intermediate: t('onboarding.levels.intermediate.label'), 
  advanced: t('onboarding.levels.advanced.label') 
};

const DAY_NAMES = t('dashboard.days');
const TODAY_IDX = new Date().getDay(); // 0 = Sonntag
const TODAY = DAY_NAMES[TODAY_IDX];

function secToStr(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function parsePaceSec(str, isEnduranceGoal) {
  if (!str) return null;
  const parts = str.split(':').map(Number);
  if (parts.some(isNaN)) return null;
  
  if (isEnduranceGoal) {
     if (parts.length === 2) return parts[0] * 3600 + parts[1] * 60;
     if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  
  if (parts.length === 1) return parts[0] * 60;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

function calcPaces(referenceTime, goal) {
  const isEndurance = ['hm', 'marathon'].includes(goal);
  const totalSec = parsePaceSec(referenceTime, isEndurance);
  if (!totalSec) return null;
  
  const distKm = goal === 'marathon' ? 42.195 : (goal === 'hm' ? 21.0975 : (goal === '10k' ? 10 : 5));
  const avgPace = totalSec / distKm;
  
  return {
    easy:      [secToStr(avgPace * 1.20), secToStr(avgPace * 1.30)],
    tempo:     secToStr(avgPace * 1.07),
    threshold: secToStr(avgPace * 1.02),
    interval:  secToStr(avgPace * 0.92),
  };
}

const SESSION_COLORS = {
  'Easy Run':    { badge: 'zone-easy',      dot: '#4a9e35' },
  'Tempo Run':   { badge: 'zone-tempo',     dot: '#c8900a' },
  'Intervall':   { badge: 'zone-interval',  dot: '#c04040' },
  'Langer Lauf': { badge: 'zone-threshold', dot: '#b06020' },
  'Ruhetag':     { badge: '',               dot: '#333' },
};

// ─── Sections ─────────────────────────────────────────────

function coachMessage(goal, level) {
  return t(`dashboard.coach_msg.${goal}`) || t('dashboard.coach_msg.default');
}

/* function sectionCoach(goal, level) {
  const msg = coachMessage(goal, level);
  const wrap = el('div', { class: 'card', style: 'margin-bottom:12px;border-left:2px solid var(--green);border-radius:var(--radius-md);padding:1rem 1.25rem;' });
  wrap.innerHTML = `
    <p class="mono muted" style="font-size:11px;letter-spacing:.06em;margin-bottom:.4rem;">${t('dashboard.coach')}</p>
    <p style="font-size:15px;line-height:1.6;">"${msg}"</p>
  `;
  return wrap;
} */

function sectionRace(raceDate) {
  if (!raceDate) return null;
  const target = new Date(raceDate.includes('-') ? raceDate + 'T00:00:00' : raceDate);
  if (isNaN(target.getTime())) return null;
  
  const diff = target - new Date();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  if (days < 0) return null;

  const wrap = el('div', { class: 'card', style: 'margin-bottom:12px; background:var(--bg-card-hl);' });
  wrap.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between;">
      <div>
        <p class="mono muted" style="font-size:11px;letter-spacing:.06em;margin-bottom:4px;">RENNTAG COUNTDOWN</p>
        <p style="font-size:14px;">${t('dashboard.days_left', { n: days })}</p>
      </div>
      <div style="font-size:24px;">🏁</div>
    </div>
  `;
  return wrap;
}

function sectionWeeklyProgress(log, weeklyGoal) {
  const now = new Date();
  const day = now.getDay();
  const d = new Date(now);
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0,0,0,0);

  const thisWeekKm = log
    .filter(run => new Date(run.date) >= monday)
    .reduce((sum, run) => sum + parseFloat(run.km || 0), 0);

  const progress = Math.min((thisWeekKm / weeklyGoal) * 100, 100);
  const unitLabel = getUnitLabel();

  const wrap = el('div', { class: 'card', style: 'margin-bottom:12px;' });
  wrap.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:10px;">
      <div>
        <p class="mono muted" style="font-size:11px; letter-spacing:.06em; margin-bottom:4px;">${t('dashboard.weekly_progress')}</p>
        <p style="font-size:1.1rem; font-weight:500;">${convertFromKm(thisWeekKm).toFixed(1)} <span class="muted" style="font-size:13px; font-weight:400;">/ ${convertFromKm(weeklyGoal).toFixed(0)} ${unitLabel}</span></p>
      </div>
      <p class="mono" style="font-size:12px; color:var(--green);">${progress.toFixed(0)}%</p>
    </div>
    <div style="height:6px; background:var(--bg-input); border-radius:3px; overflow:hidden;">
      <div style="height:100%; width:${progress}%; background:var(--green); transition:width 0.6s cubic-bezier(.4,0,.2,1);"></div>
    </div>
  `;
  return wrap;
}

function sectionToday(plan) {
  const todayRaw = plan.find(d => d.day === TODAY) || { type: 'Ruhetag', km: null };
  const colors = SESSION_COLORS[todayRaw.type] || SESSION_COLORS['Ruhetag'];
  const isRest = todayRaw.type === 'Ruhetag';
  const displayType = t(`dashboard.sessions.${todayRaw.type}`);

  const wrap = el('div', { class: 'card', style: 'margin-bottom:12px;' });
  wrap.innerHTML = `
    <p class="mono muted" style="font-size:11px;letter-spacing:.06em;margin-bottom:.75rem;">${t('dashboard.today')} · ${TODAY}</p>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
      <div>
        <p style="font-size:1.4rem;font-weight:300;letter-spacing:-.02em;margin-bottom:.25rem;">${displayType}</p>
        ${todayRaw.km ? `<p class="muted" style="font-size:13px;">${formatDist(todayRaw.km)}</p>` : `<p class="muted" style="font-size:13px;">${t('dashboard.recovery')}</p>`}
      </div>
      <div style="width:48px;height:48px;border-radius:50%;background:${isRest ? 'var(--bg-input)' : 'var(--green-dim)'};display:flex;align-items:center;justify-content:center;">
        <div style="width:10px;height:10px;border-radius:50%;background:${colors.dot};"></div>
      </div>
    </div>
    ${todayRaw.note ? `<div style="padding-top:12px;border-top:0.5px solid var(--border);"><p style="font-size:13px;color:var(--green);font-style:italic;">✨ Coach: "${todayRaw.note}"</p></div>` : ''}
  `;
  return wrap;
}

function sectionWeekPlan(plan) {
  const wrap = el('div', { style: 'margin-bottom:12px;' });
  wrap.innerHTML = `<p class="mono muted" style="font-size:11px;letter-spacing:.06em;margin-bottom:.75rem;">${t('dashboard.weekly_plan')}</p>`;

  const grid = el('div', { style: 'display:flex;flex-direction:column;gap:4px;' });

  plan.forEach(session => {
    const isToday = session.day === TODAY;
    const isRest  = session.type === 'Ruhetag';
    const colors  = SESSION_COLORS[session.type] || SESSION_COLORS['Ruhetag'];
    const displayDay = t(`dashboard.day_map.${session.day}`);
    const displayType = t(`dashboard.sessions.${session.type}`);

    const row = el('div', {
      style: `
        display:flex;align-items:center;gap:12px;
        padding:10px 14px;
        background:${isToday ? 'var(--green-dim)' : 'var(--bg-card)'};
        border:0.5px solid ${isToday ? 'var(--green-mid)' : 'var(--border)'};
        border-radius:var(--radius-sm);
      `
    });

    row.innerHTML = `
      <span class="mono" style="font-size:12px;color:${isToday ? 'var(--green)' : 'var(--text-muted)'};width:24px;flex-shrink:0;">${displayDay}</span>
      <div style="width:6px;height:6px;border-radius:50%;background:${colors.dot};flex-shrink:0;"></div>
      <span style="flex:1;font-size:14px;color:${isRest ? 'var(--text-muted)' : 'var(--text)'};">${displayType}</span>
      ${session.km ? `<span class="mono" style="font-size:12px;color:var(--text-muted);">${formatDist(session.km)}</span>` : ''}
    `;

    grid.appendChild(row);
  });

  wrap.appendChild(grid);
  return wrap;
}

function sectionPaces(paces) {
  const wrap = el('div', { style: 'margin-bottom:12px;' });
  wrap.innerHTML = `<p class="mono muted" style="font-size:11px;letter-spacing:.06em;margin-bottom:.75rem;">${t('dashboard.paces_title')}</p>`;

  const table = el('div', { class: 'card' });
  table.innerHTML = `
    <table class="pace-table" style="width:100%">
      <tr>
        <td><span class="zone-badge zone-easy">Easy</span></td>
        <td class="muted" style="font-size:12px;padding:4px 8px;">${t('dashboard.pace_desc.easy')}</td>
        <td style="text-align:right;font-family:var(--font-mono);font-size:13px;">${paces.easy[0]} – ${paces.easy[1]}</td>
      </tr>
      <tr>
        <td><span class="zone-badge zone-tempo">Tempo</span></td>
        <td class="muted" style="font-size:12px;padding:4px 8px;">${t('dashboard.pace_desc.tempo')}</td>
        <td style="text-align:right;font-family:var(--font-mono);font-size:13px;">${paces.tempo}</td>
      </tr>
      <tr>
        <td><span class="zone-badge zone-threshold">Threshold</span></td>
        <td class="muted" style="font-size:12px;padding:4px 8px;">${t('dashboard.pace_desc.threshold')}</td>
        <td style="text-align:right;font-family:var(--font-mono);font-size:13px;">${paces.threshold}</td>
      </tr>
      <tr>
        <td><span class="zone-badge zone-interval">Intervall</span></td>
        <td class="muted" style="font-size:12px;padding:4px 8px;">${t('dashboard.pace_desc.interval')}</td>
        <td style="text-align:right;font-family:var(--font-mono);font-size:13px;">${paces.interval}</td>
      </tr>
    </table>
  `;
  wrap.appendChild(table);
  return wrap;
}

function sectionLog() {
  const wrap = el('div', { style: 'margin-bottom:2rem;' });
  wrap.innerHTML = `<p class="mono muted" style="font-size:11px;letter-spacing:.06em;margin-bottom:.75rem;">${t('dashboard.log').toUpperCase()}</p>`;

  const card = el('div', { class: 'card' });

  // Inputs
  const row = el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;' });

  const distGroup = el('div', { class: 'input-group', style: 'margin-bottom:0;' });
  distGroup.innerHTML = `<label>${t('dashboard.log_km')}</label>`;
  const distInput = el('input', { type: 'number', placeholder: '10', min: '0', step: '0.1', id: 'log-km' });
  distGroup.appendChild(distInput);

  const timeGroup = el('div', { class: 'input-group', style: 'margin-bottom:0;' });
  timeGroup.innerHTML = `<label>${t('dashboard.log_time')}</label>`;
  const timeInput = el('input', { type: 'text', placeholder: '1:55:00', id: 'log-time' });
  timeGroup.appendChild(timeInput);

  row.appendChild(distGroup);
  row.appendChild(timeGroup);
  card.appendChild(row);

  const dateGroup = el('div', { class: 'input-group', style: 'margin-bottom:12px;' });
  dateGroup.innerHTML = `<label>${t('dashboard.log_date')}</label>`;
  const dateInput = el('input', { type: 'text', placeholder: '2025-05-18', value: new Date().toISOString().split('T')[0], id: 'log-date' });
  dateGroup.appendChild(dateInput);
  card.appendChild(dateGroup);

  const noteGroup = el('div', { class: 'input-group', style: 'margin-bottom:12px;' });
  noteGroup.innerHTML = `<label>NOTIZEN (Z.B. GEFÜHL, WETTER)</label>`;
  const noteInput = el('input', { type: 'text', placeholder: 'Beine schwer, schönes Wetter...', id: 'log-note' });
  noteGroup.appendChild(noteInput);
  card.appendChild(noteGroup);

  // Feeling
  const feelLabel = el('p', { class: 'muted', style: 'font-size:12px;font-family:var(--font-mono);margin-bottom:8px;' }, t('dashboard.log_feel'));
  card.appendChild(feelLabel);

  const feelRow = el('div', { style: 'display:flex;gap:8px;margin-bottom:14px;' });
  const feelings = ['😩', '😐', '🙂', '💪', '🔥'];
  let selectedFeel = null;

  feelings.forEach((emoji, i) => {
    const btn = el('button', {
      style: `flex:1;padding:8px 0;background:var(--bg-input);border:0.5px solid var(--border);border-radius:var(--radius-sm);font-size:18px;cursor:pointer;transition:border-color .15s,background .15s;`,
      onClick: () => {
        feelRow.querySelectorAll('button').forEach(b => {
          b.style.borderColor = 'var(--border)';
          b.style.background  = 'var(--bg-input)';
        });
        btn.style.borderColor = 'var(--green-mid)';
        btn.style.background  = 'var(--green-dim)';
        selectedFeel = i + 1;
      }
    }, emoji);
    feelRow.appendChild(btn);
  });
  card.appendChild(feelRow);

  // Shoes
  const shoes = state.get('shoes') || [];
  let selectedShoeId = null;
  if (shoes.length > 0) {
    const shoeGroup = el('div', { class: 'input-group' });
    shoeGroup.innerHTML = `<label>${t('profile.gear').toUpperCase()}</label>`;
    const shoeSelect = el('select', { 
      style: 'width:100%; background:var(--bg-input); border:0.5px solid var(--border); border-radius:var(--radius-sm); color:var(--text); padding:10px 14px; outline:none;',
      onChange: (e) => { selectedShoeId = e.target.value || null; }
    });
    shoeSelect.appendChild(el('option', { value: '' }, t('dashboard.log_no_shoe')));
    shoes.forEach(s => {
      shoeSelect.appendChild(el('option', { value: s.id }, s.name));
    });
    shoeGroup.appendChild(shoeSelect);
    card.appendChild(shoeGroup);
  }

  // Submit
  const feedback = el('p', { style: 'font-size:13px;color:var(--green);min-height:20px;margin-top:8px;' });

  const submitBtn = el('button', {
    class: 'btn btn-primary btn-full',
    onClick: async () => {
      const inputVal = distInput.value;
      const time = timeInput.value;
      const date = dateInput.value;
      const note = noteInput.value;
      if (!inputVal || !time || !date) {
        feedback.textContent = 'Bitte Distanz, Zeit und Datum angeben.';
        feedback.style.color = 'var(--red)';
        return;
      }
      const km = convertToKm(parseFloat(inputVal));
      const normalizedTime = normalizeTime(time);
      if (!normalizedTime) {
        feedback.style.color = 'var(--red)';
        feedback.textContent = 'Zeit ungültig.';
        return;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        feedback.style.color = 'var(--red)';
        feedback.textContent = 'Datum ungültig (Format: JJJJ-MM-TT)';
        return;
      }
      const user = state.get('user');
      const runEntry = { km, time: normalizedTime, feel: selectedFeel, note, date: new Date(date).toISOString(), shoeId: selectedShoeId };
      if (user) {
        const { data, error } = await db.saveRun(user.id, runEntry);
        if (!error && data) runEntry.id = data.id;
      }
      const log = state.get('runLog') || [];
      log.push(runEntry);
      state.set('runLog', log.sort((a,b) => new Date(a.date) - new Date(b.date)));

      distInput.value = '';
      timeInput.value = '';
      noteInput.value = '';
      feelRow.querySelectorAll('button').forEach(b => {
        b.style.borderColor = 'var(--border)';
        b.style.background  = 'var(--bg-input)';
      });
      selectedFeel = null;
      feedback.style.color = 'var(--green)';
      feedback.textContent = `✓ ${inputVal} ${getUnitLabel()} ${t('dashboard.log_save').toLowerCase()}.`;
      setTimeout(() => { feedback.textContent = ''; }, 3000);
    }
  }, t('dashboard.log_save'));

  card.appendChild(submitBtn);
  card.appendChild(feedback);
  wrap.appendChild(card);
  return wrap;
}

// ─── Main export ──────────────────────────────────────────

export function DashboardPage() {
  const goal   = state.get('goal')   || 'fit';
  const level  = state.get('level')  || 'intermediate';
  const days   = state.get('days').length ? state.get('days') : ['Mo', 'Mi', 'Fr'];
  const targetTime = state.get('targetTime');
  const raceDate = state.get('raceDate');
  const weeklyGoal = state.get('weeklyGoal') || 30;
  const log = state.get('runLog') || [];

  let fullPlan = state.get('weekPlan');
  if (!fullPlan) {
    fullPlan = generatePlan(goal, level, days);
    state.set('weekPlan', fullPlan);
    const user = state.get('user');
    if (user) {
      db.saveProfile(user.id);
    }
  }
  
  // Aktuelle Woche im Plan finden
  let currentWeekData = fullPlan[0]; 
  const plan = currentWeekData.sessions; 

  const paces = calcPaces(currentWeekData.referenceFitness || state.get('fitnessTime'), goal);

  const page = document.createElement('div');
  page.className = 'page fade-up';

  const raceSect = sectionRace(raceDate);
  if (raceSect) page.appendChild(raceSect);

  page.appendChild(sectionWeeklyProgress(log, weeklyGoal));

  // page.appendChild(sectionCoach(goal, level));
  page.appendChild(sectionToday(plan));
  page.appendChild(sectionWeekPlan(plan));
  page.appendChild(el('div', { style: 'height:1px;background:var(--border);margin:1.25rem 0;' }));
  
  if (paces) {
    page.appendChild(sectionPaces(paces));
    page.appendChild(el('div', { style: 'height:1px;background:var(--border);margin:1.25rem 0;' }));
  }
  page.appendChild(sectionLog());

  return page;
}
