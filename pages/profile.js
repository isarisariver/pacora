import { state } from '../js/state.js';
import { db, auth } from '../js/supabase.js';
import { router } from '../js/router.js';
import { el } from '../js/utils.js';
import { t, setLang } from '../js/i18n.js';

function refresh() {
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

// Helper for Toggle Component
function createToggle(label, isOn, onClick) {
  const wrapper = el('div', { class: `toggle-wrapper ${isOn ? 'on' : ''}` });
  wrapper.innerHTML = `<span>${label}</span><div class="toggle-switch"></div>`;
  wrapper.onclick = () => {
    wrapper.classList.toggle('on');
    onClick();
  };
  return wrapper;
}

// Helper for Segmented Control
function createSegmentedControl(options, selectedValue, onSelect) {
  const container = el('div', { class: 'segmented-control' });
  options.forEach(opt => {
    const div = el('div', { class: `segmented-option ${opt.value === selectedValue ? 'active' : ''}` }, opt.label);
    div.onclick = () => {
      container.querySelectorAll('.segmented-option').forEach(el => el.classList.remove('active'));
      div.classList.add('active');
      onSelect(opt.value);
    };
    container.appendChild(div);
  });
  return container;
}

export function ProfilePage() {
  const user = state.get('user');
  const page = el('div', { class: 'page fade-up' });

  const heading = el('div', { style: 'margin-bottom:1.5rem;' });
  heading.innerHTML = `<h2>${t('profile.title')}</h2><p class="muted" style="font-size:13px;">${t('profile.subtitle')}</p>`;
  page.appendChild(heading);

  if (!user) {
    page.appendChild(el('p', { class: 'muted' }, t('profile.not_logged_in')));
    return page;
  }

  // Info Card
  const goal = state.get('goal');
  const goalLabel = t(`onboarding.goals.${goal}.label`) || '–';
  const level = state.get('level');
  const levelLabel = t(`onboarding.levels.${level}.label`) || '–';

  const info = el('div', { class: 'card', style: 'margin-bottom:1.5rem;' });
  info.innerHTML = `
    <div class="summary-item"><span class="key">${t('profile.email')}</span><span class="val">${user.email}</span></div>
    <div class="summary-item"><span class="key">${t('profile.goal')}</span><span class="val">${goalLabel}</span></div>
    <div class="summary-item"><span class="key">${t('profile.level')}</span><span class="val">${levelLabel}</span></div>
  `;
  page.appendChild(info);

  // Weekly Goal Setter
  const unit = localStorage.getItem('unit') || 'km';
  const rawGoal = state.get('weeklyGoal') || 30;
  const displayGoal = unit === 'mi' ? Math.round(rawGoal * 0.621371) : rawGoal;

  const goalCard = el('div', { class: 'card', style: 'margin-bottom:1.5rem;' });
  goalCard.innerHTML = `<p class="mono muted" style="font-size:11px; margin-bottom:12px;">${t('profile.weekly_goal')} (${unit.toUpperCase()})</p>`;
  
  const goalInput = el('input', { type: 'number', value: displayGoal });
  const saveGoalBtn = el('button', {
    class: 'btn btn-primary btn-full',
    style: 'margin-top: 12px;',
    onClick: async () => {
      let val = parseInt(goalInput.value);
      if (isNaN(val) || val <= 0) return;
      
      // Zurückrechnen auf KM für die interne Speicherung
      const kmValue = unit === 'mi' ? Math.round(val / 0.621371) : val;
      
      state.set('weeklyGoal', kmValue);
      await db.saveProfile(user.id);
      saveGoalBtn.textContent = '✓';
      setTimeout(() => { saveGoalBtn.textContent = t('profile.save_goal'); }, 2000);
    }
  }, t('profile.save_goal'));
  
  goalCard.appendChild(goalInput);
  goalCard.appendChild(saveGoalBtn);
  page.appendChild(goalCard);

  // Actions Card
  const actionsCard = el('div', { class: 'card', style: 'margin-bottom:1.5rem;' });
  actionsCard.appendChild(el('p', { class: 'mono muted', style: 'font-size:11px; margin-bottom:12px;' }, t('profile.settings_group')));
  
  const actions = el('div', { style: 'display:flex;flex-direction:column;gap:12px;' });

  // Theme Toggle
  const isDark = !document.documentElement.classList.contains('light');
  const themeToggle = createToggle(
    isDark ? t('profile.theme_light') : t('profile.theme_dark'),
    !isDark, 
    () => {
      const next = document.documentElement.classList.contains('light') ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      document.documentElement.classList.toggle('light');
      refresh();
    }
  );

  // Lang Control
  const lang = localStorage.getItem('lang') || 'de';
  const langControl = el('div', { class: 'input-group' });
  langControl.innerHTML = `<label>SPRACHE / LANGUAGE</label>`;
  langControl.appendChild(createSegmentedControl(
    [{label: 'Deutsch', value: 'de'}, {label: 'English', value: 'en'}],
    lang,
    (val) => setLang(val)
  ));

  // Unit Control
  const unitControl = el('div', { class: 'input-group' });
  unitControl.innerHTML = `<label>EINHEIT / UNIT</label>`;
  unitControl.appendChild(createSegmentedControl(
    [{label: 'Kilometer', value: 'km'}, {label: 'Meilen', value: 'mi'}],
    unit,
    (val) => {
      state.set('unit', val);
      localStorage.setItem('unit', val);
      refresh();
    }
  ));

  const gearBtn = el('button', {
    class: 'btn btn-ghost btn-full',
    style: 'justify-content: flex-start;',
    onClick: () => { router.go('/gear'); }
  }, t('profile.gear'));

  const editProfileBtn = el('button', {
    class: 'btn btn-ghost btn-full',
    style: 'justify-content: flex-start;',
    onClick: () => { router.go('/onboarding/1'); }
  }, t('profile.edit'));

  const restartBtn = el('button', {
    class: 'btn btn-ghost btn-full',
    style: 'justify-content: flex-start; color:var(--red);',
    onClick: () => {
      if (!confirm('Plan löschen und Onboarding neu starten?')) return;
      state.setMany({
        goal: null,
        level: null,
        days: [],
        injury: null,
        pace5k: null,
        raceDate: null,
        weekPlan: null
      });
      router.go('/onboarding/1');
    }
  }, t('plan.restart'));

  const exportBtn = el('button', {
    class: 'btn btn-ghost btn-full',
    style: 'justify-content: flex-start;',
    onClick: () => {
      const log = state.get('runLog') || [];
      if (log.length === 0) return alert('No data to export.');
      const headers = ['Date', 'Distanz', 'Time', 'Feel', 'Shoe'];
      const rows = log.map(r => [r.date, r.km, r.time, r.feel || '-', r.shoeId || '-']);
      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `runcoach_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, t('profile.export'));

  const logoutBtn = el('button', {
    class: 'btn btn-ghost btn-full',
    style: 'justify-content: flex-start; color:var(--red);',
    onClick: async () => {
      await auth.signOut();
      router.go('/auth');
    }
  }, t('profile.logout'));

  actions.appendChild(themeToggle);
  actions.appendChild(langControl);
  actions.appendChild(unitControl);
  actions.appendChild(editProfileBtn);
  actions.appendChild(restartBtn);
  actions.appendChild(gearBtn);
  actions.appendChild(exportBtn);
  actions.appendChild(logoutBtn);
  actionsCard.appendChild(actions);
  page.appendChild(actionsCard);

  return page;
}
