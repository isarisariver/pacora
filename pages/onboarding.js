import { state } from '../js/state.js';
import { db } from '../js/supabase.js';
import { router } from '../js/router.js';
import { t } from '../js/i18n.js';

// ─── Helpers ──────────────────────────────────────────────

function parsePaceSec(str, isEnduranceGoal) {
  if (!str) return null;
  const parts = str.split(':').map(Number);
  if (parts.some(isNaN)) return null;
  
  if (isEnduranceGoal) {
     if (parts.length === 2) return parts[0] * 3600 + parts[1] * 60; // 1:20 -> 1h 20m
     if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  
  if (parts.length === 1) return parts[0] * 60;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

function secToStr(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function calcPaces(referenceTimeStr, goal) {
  const isEndurance = ['hm', 'marathon'].includes(goal);
  const totalSec = parsePaceSec(referenceTimeStr, isEndurance);
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

function validateTime(timeStr) {
  if (!timeStr) return true;
  return /^\d{1,2}:\d{2}(:\d{2})?$/.test(timeStr);
}

// ─── Constants ────────────────────────────────────────────

const GOALS = [
  { val: 'hm',       label: t('onboarding.goals.hm.label'),    sub: t('onboarding.goals.hm.sub') },
  { val: 'marathon', label: t('onboarding.goals.marathon.label'), sub: t('onboarding.goals.marathon.sub') },
  { val: '10k',      label: t('onboarding.goals.10k.label'),    sub: t('onboarding.goals.10k.sub') },
  { val: '5k',       label: t('onboarding.goals.5k.label'),     sub: t('onboarding.goals.5k.sub') },
  { val: 'fit',      label: t('onboarding.goals.fit.label'),    sub: t('onboarding.goals.fit.sub') },
];

const LEVELS = [
  { val: 'beginner',     label: t('onboarding.levels.beginner.label'),     sub: t('onboarding.levels.beginner.sub') },
  { val: 'intermediate', label: t('onboarding.levels.intermediate.label'), sub: t('onboarding.levels.intermediate.sub') },
  { val: 'advanced',     label: t('onboarding.levels.advanced.label'),     sub: t('onboarding.levels.advanced.sub') },
];

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const INJURIES = [
  { val: 'none', label: t('onboarding.injuries.none') },
  { val: 'yes',  label: t('onboarding.injuries.yes') },
];

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

// ─── DOM helpers ──────────────────────────────────────────

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, v);
  }
  for (const child of children) {
    if (typeof child === 'string') node.insertAdjacentHTML('beforeend', child);
    else if (child) node.appendChild(child);
  }
  return node;
}

function optionTiles(items, stateKey, onSelect) {
  const grid = el('div', { class: `option-grid${items.length <= 3 ? ' full' : ''}` });
  items.forEach(item => {
    const tile = el('div', {
      class: 'option-tile' + (state.get(stateKey) === item.val ? ' selected' : ''),
      onClick: () => {
        grid.querySelectorAll('.option-tile').forEach(t => t.classList.remove('selected'));
        tile.classList.add('selected');
        state.set(stateKey, item.val);
        onSelect?.();
      }
    });
    tile.innerHTML = `<span class="tile-label">${item.label}</span>${item.sub ? `<span class="tile-sub">${item.sub}</span>` : ''}`;
    grid.appendChild(tile);
  });
  return grid;
}

// ─── Steps ────────────────────────────────────────────────

function buildStep(stepNum, totalSteps, content) {
  const page = el('div', { class: 'page fade-up' });

  // Progress
  const fill = el('div', { class: 'progress-fill' });
  fill.style.width = `${(stepNum / totalSteps) * 100}%`;
  page.appendChild(el('div', { class: 'progress-track' }, fill));

  page.appendChild(content);
  return page;
}

// ─── Step 1: Ziel ─────────────────────────────────────────

function step1() {
  const frag = document.createDocumentFragment();

  const nextBtn = el('button', {
    class: 'btn btn-primary',
    onClick: () => {
      if (!state.get('goal')) return alert(t('onboarding.step1_title'));
      router.go('/onboarding/2');
    }
  }, t('onboarding.next'));

  const header = el('div', {});
  header.innerHTML = `
    <p class="muted mono" style="font-size:12px;margin-bottom:.5rem;">${t('onboarding.step', { n: 1, total: 4 })}</p>
    <h1 style="margin-bottom:.4rem;">${t('onboarding.step1_title')}</h1>
    <p class="muted" style="margin-bottom:0;">${t('onboarding.step1_desc')}</p>
  `;
  frag.appendChild(header);

  frag.appendChild(optionTiles(GOALS, 'goal'));

  const dateGroup = el('div', { class: 'input-group' });
  dateGroup.innerHTML = `<label>${t('onboarding.target_date')}</label>`;
  const dateInput = el('input', { type: 'date' });
  if (state.get('raceDate')) dateInput.value = state.get('raceDate');
  dateInput.addEventListener('input', () => state.set('raceDate', dateInput.value));
  dateGroup.appendChild(dateInput);
  frag.appendChild(dateGroup);

  const timeGroup = el('div', { class: 'input-group' });
  timeGroup.innerHTML = `<label>${t('onboarding.target_time')}</label>`;
  const timeInput = el('input', { type: 'text', placeholder: '03:59:00' });
  if (state.get('targetTime')) timeInput.value = state.get('targetTime');
  timeInput.addEventListener('input', () => {
    state.set('targetTime', timeInput.value);
    timeInput.style.borderColor = validateTime(timeInput.value) ? '' : 'var(--red)';
  });
  timeGroup.appendChild(timeInput);
  frag.appendChild(timeGroup);

  const navRow = el('div', { class: 'nav-row' });
  navRow.appendChild(el('span'));
  navRow.appendChild(nextBtn);
  frag.appendChild(navRow);

  return buildStep(1, 4, frag);
}

// ─── Step 2: Level ────────────────────────────────────────

function step2() {
  const frag = document.createDocumentFragment();
  const goal = state.get('goal');
  
  const getBestTimeLabel = () => {
    switch(goal) {
      case '5k': return `${t('onboarding.goals.5k.label')} (MM:SS)`;
      case '10k': return `${t('onboarding.goals.10k.label')} (MM:SS)`;
      case 'hm': return `${t('onboarding.goals.hm.label')} (HH:MM:SS)`;
      case 'marathon': return `${t('onboarding.goals.marathon.label')} (HH:MM:SS)`;
      default: return 'Best Time';
    }
  };

  const nextBtn = el('button', {
    class: 'btn btn-primary',
    onClick: () => {
      if (!state.get('level')) return alert(t('onboarding.step2_title'));
      router.go('/onboarding/3');
    }
  }, t('onboarding.next'));

  const header = el('div', {});
  header.innerHTML = `
    <p class="muted mono" style="font-size:12px;margin-bottom:.5rem;">${t('onboarding.step', { n: 2, total: 4 })}</p>
    <h1 style="margin-bottom:.4rem;">${t('onboarding.step2_title')}</h1>
    <p class="muted" style="margin-bottom:0;">${t('onboarding.step2_desc')}</p>
  `;
  frag.appendChild(header);

  frag.appendChild(optionTiles(LEVELS, 'level'));

  const paceGroup = el('div', { class: 'input-group' });
  paceGroup.innerHTML = `<label>${getBestTimeLabel()}</label>`;
  const paceInput = el('input', { type: 'text', placeholder: goal === '5k' || goal === '10k' ? '25:00' : '03:45:00' });
  if (state.get('fitnessTime')) paceInput.value = state.get('fitnessTime');
  paceInput.addEventListener('input', () => {
    state.set('fitnessTime', paceInput.value);
    paceInput.style.borderColor = validateTime(paceInput.value) ? '' : 'var(--red)';
  });
  paceGroup.appendChild(paceInput);
  frag.appendChild(paceGroup);

  const navRow = el('div', { class: 'nav-row' });
  navRow.appendChild(el('button', { class: 'btn btn-ghost', onClick: () => router.go('/onboarding/1') }, t('onboarding.back')));
  navRow.appendChild(nextBtn);
  frag.appendChild(navRow);

  return buildStep(2, 4, frag);
}

// ─── Step 3: Tage + Verletzung ────────────────────────────

function step3() {
  const frag = document.createDocumentFragment();

  const nextBtn = el('button', {
    class: 'btn btn-primary',
    onClick: () => {
      const ok = state.get('days').length >= 2 && state.get('injury') && state.get('recentKm');
      if (!ok) return alert('Bitte alle Felder ausfüllen.');
      router.go('/onboarding/4');
    }
  }, t('onboarding.next'));

  const header = el('div', {});
  header.innerHTML = `
    <p class="muted mono" style="font-size:12px;margin-bottom:.5rem;">${t('onboarding.step', { n: 3, total: 4 })}</p>
    <h1 style="margin-bottom:.4rem;">${t('onboarding.step3_title')}</h1>
    <p class="muted" style="margin-bottom:0;">${t('onboarding.step3_desc')}</p>
  `;
  frag.appendChild(header);

  // Day pills
  const dayRow = el('div', { class: 'day-row' });
  DAYS.forEach(day => {
    const pill = el('div', {
      class: 'day-pill' + (state.get('days').includes(day) ? ' selected' : ''),
      onClick: () => {
        const days = state.get('days');
        if (days.includes(day)) {
          state.set('days', days.filter(d => d !== day));
          pill.classList.remove('selected');
        } else {
          state.set('days', [...days, day]);
          pill.classList.add('selected');
        }
      }
    }, day);
    dayRow.appendChild(pill);
  });
  frag.appendChild(dayRow);

  const kmGroup = el('div', { class: 'input-group' });
  kmGroup.innerHTML = `<label>${t('onboarding.weekly_km')}</label>`;
  const kmInput = el('input', { type: 'number', placeholder: 'z.B. 30' });
  if (state.get('recentKm')) kmInput.value = state.get('recentKm');
  kmInput.addEventListener('input', () => {
    state.set('recentKm', kmInput.value);
  });
  kmGroup.appendChild(kmInput);
  frag.appendChild(kmGroup);

  const injuryLabel = el('p', { class: 'muted', style: 'font-size:13px;margin-bottom:8px;' }, t('onboarding.injury_q'));
  frag.appendChild(injuryLabel);
  frag.appendChild(optionTiles(INJURIES, 'injury'));

  const navRow = el('div', { class: 'nav-row' });
  navRow.appendChild(el('button', { class: 'btn btn-ghost', onClick: () => router.go('/onboarding/2') }, t('onboarding.back')));
  navRow.appendChild(nextBtn);
  frag.appendChild(navRow);

  return buildStep(3, 4, frag);
}

// ─── Step 4: Summary + Pace ───────────────────────────────

function step4() {
  const frag = document.createDocumentFragment();

  const header = el('div', {});
  header.innerHTML = `
    <p class="muted mono" style="font-size:12px;margin-bottom:.5rem;">${t('onboarding.step', { n: 4, total: 4 })}</p>
    <h1 style="margin-bottom:.4rem;">${t('onboarding.step4_title')}</h1>
    <p class="muted" style="margin-bottom:0;">${t('onboarding.step4_desc')}</p>
  `;
  frag.appendChild(header);

  // Summary list
  const summary = el('div', { class: 'card', style: 'margin-top:1.5rem;' });
  const raceDateVal = state.get('raceDate');
  let displayRaceDate = 'Offen';
  if (raceDateVal) {
    const d = new Date(raceDateVal.includes('-') ? raceDateVal + 'T00:00:00' : raceDateVal);
    if (!isNaN(d.getTime())) {
      displayRaceDate = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } else {
      displayRaceDate = raceDateVal;
    }
  }

  const items = [
    [t('onboarding.summary.goal'),    GOAL_LABELS[state.get('goal')]  || '–'],
    [t('onboarding.summary.level'),   LEVEL_LABELS[state.get('level')] || '–'],
    [t('onboarding.summary.time'),    state.get('targetTime')          || '–'],
    [t('onboarding.summary.days'),    state.get('days').join(', ')     || '–'],
    [t('onboarding.summary.race'),    displayRaceDate],
  ];
  summary.innerHTML = items.map(([k, v]) =>
    `<div class="summary-item"><span class="key">${k}</span><span class="val">${v}</span></div>`
  ).join('');
  frag.appendChild(summary);

  // Pace zones
  const paces = calcPaces(state.get('fitnessTime'), state.get('goal'));
  const paceSection = el('div', { style: 'margin-top:1.5rem;' });

  if (paces) {
    paceSection.innerHTML = `
      <p class="muted mono" style="font-size:12px;margin-bottom:.75rem;">${t('dashboard.paces_title')}</p>
      <table class="pace-table">
        <tr>
          <td><span class="zone-badge zone-easy">Easy</span></td>
          <td class="muted" style="font-size:12px;padding:0 8px;">${t('dashboard.pace_desc.easy')}</td>
          <td style="text-align:right;font-family:var(--font-mono);">${paces.easy[0]} – ${paces.easy[1]}</td>
        </tr>
        <tr>
          <td><span class="zone-badge zone-tempo">Tempo</span></td>
          <td class="muted" style="font-size:12px;padding:0 8px;">${t('dashboard.pace_desc.tempo')}</td>
          <td style="text-align:right;font-family:var(--font-mono);">${paces.tempo}</td>
        </tr>
        <tr>
          <td><span class="zone-badge zone-threshold">Threshold</span></td>
          <td class="muted" style="font-size:12px;padding:0 8px;">${t('dashboard.pace_desc.threshold')}</td>
          <td style="text-align:right;font-family:var(--font-mono);">${paces.threshold}</td>
        </tr>
        <tr>
          <td><span class="zone-badge zone-interval">Intervall</span></td>
          <td class="muted" style="font-size:12px;padding:0 8px;">${t('dashboard.pace_desc.interval')}</td>
          <td style="text-align:right;font-family:var(--font-mono);">${paces.interval}</td>
        </tr>
      </table>
    `;
  } else {
    paceSection.innerHTML = '';
  }
  frag.appendChild(paceSection);

  // CTA
  const navRow = el('div', { class: 'nav-row' });
  navRow.appendChild(el('button', { class: 'btn btn-ghost', onClick: () => router.go('/onboarding/3') }, t('onboarding.back')));
  navRow.appendChild(el('button', {
    class: 'btn btn-primary',
    onClick: async () => {
      const user = state.get('user');
      const recentKm = state.get('recentKm');
      
      // Setze das Wochenziel initial auf den baseline Wert
      if (recentKm) {
        state.set('weeklyGoal', parseInt(recentKm));
      }
      
      if (user) {
        await db.saveProfile(user.id);
      }
      router.go('/dashboard');
    }
  }, t('onboarding.create_plan')));
  frag.appendChild(navRow);

  return buildStep(4, 4, frag);
}

// ─── Export ───────────────────────────────────────────────

export const OnboardingPage = {
  step1,
  step2,
  step3,
  step4,
};
