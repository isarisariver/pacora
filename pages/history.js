import { state } from '../js/state.js';
import { db } from '../js/supabase.js';
import { router } from '../js/router.js';
import { el, normalizeTime, formatDate, calcPace, formatDist, convertFromKm, convertToKm, getUnitLabel } from '../js/utils.js';
import { t } from '../js/i18n.js';

const FEEL_EMOJI = ['', '😩', '😐', '🙂', '💪', '🔥'];

function refresh() {
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

// ─── Mini Sparkline SVG ───────────────────────────────────
function sparkline(values, color = '#4a9e35') {
  if (values.length < 2) return '';
  const w = 280, h = 48, pad = 0;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `
    <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%;height:48px;display:block; overflow:visible;">
      <polyline
        points="${pts.join(' ')}"
        fill="none"
        stroke="${color}"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
      ${values.map((v, i) => {
        const [x, y] = pts[i].split(',');
        return `
          <circle cx="${x}" cy="${y}" r="4" fill="${color}" style="cursor:pointer;">
            <title>${formatDist(v)}</title>
          </circle>`;
      }).join('')}
    </svg>
  `;
}

// ─── Stats row ────────────────────────────────────────────
function statsSection(log) {
  const totalKm   = log.reduce((s, r) => s + parseFloat(r.km || 0), 0);
  const paces     = log.map(r => {
    const p = calcPace(r.km, r.time);
    if (!p) return null;
    const [m, s] = p.split(':').map(Number);
    return m * 60 + s;
  }).filter(Boolean);
  const avgPaceSec = paces.length ? paces.reduce((a, b) => a + b, 0) / paces.length : null;
  const avgPaceStr = avgPaceSec
    ? `${Math.floor(avgPaceSec / 60)}:${Math.round(avgPaceSec % 60).toString().padStart(2,'0')}`
    : '–';

  const wrap = el('div', {
    style: 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:1.25rem;'
  });

  const items = [
    [t('history.all'), log.length, ''],
    [t('history.volume'), convertFromKm(totalKm).toFixed(1), getUnitLabel()],
    ['Ø Pace', avgPaceStr, '/km'],
  ];

  items.forEach(([label, value, unit]) => {
    const card = el('div', {
      style: 'background:var(--bg-card);border:0.5px solid var(--border);border-radius:var(--radius-md);padding:.75rem;'
    });
    card.innerHTML = `
      <p style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${label}</p>
      <p style="font-size:1.2rem;font-weight:300;letter-spacing:-.02em;">${value}<span style="font-size:11px;color:var(--text-muted);margin-left:2px;">${unit}</span></p>
    `;
    wrap.appendChild(card);
  });

  return wrap;
}

// ─── Chart ────────────────────────────────────────────────
function chartSection(log) {
  const wrap = el('div', { style: 'margin-bottom:1.25rem;' });
  wrap.innerHTML = `<p class="mono muted" style="font-size:11px;letter-spacing:.06em;margin-bottom:.6rem;">${t('history.chart_title')} (${getUnitLabel()})</p>`;

  const card = el('div', { class: 'card' });

  if (log.length < 2) {
    card.innerHTML = `<p class="muted" style="font-size:13px;">Mindestens 2 Läufe nötig für das Chart.</p>`;
  } else {
    const values = log.map(r => parseFloat(r.km) || 0);
    card.innerHTML = sparkline(values);

    const axis = el('div', { style: 'display:flex;justify-content:space-between;margin-top:8px;padding:0 2px;' });
    axis.innerHTML = `
      <span style="font-size:10px;color:var(--text-muted);font-family:var(--font-mono);">${formatDate(log[0].date)}</span>
      <span style="font-size:10px;color:var(--text-muted);font-family:var(--font-mono);">${formatDate(log[log.length - 1].date)}</span>
    `;
    card.appendChild(axis);
  }

  wrap.appendChild(card);
  return wrap;
}

// ─── Personal Records ─────────────────────────────────────
function recordsSection(log) {
  if (log.length === 0) return el('div');

  const records = {
    longest: { val: 0, date: null, time: null },
    fastest5k: { val: Infinity, date: null, str: null, time: null },
    fastest10k: { val: Infinity, date: null, str: null, time: null },
    fastestHM: { val: Infinity, date: null, str: null, time: null },
    fastestM: { val: Infinity, date: null, str: null, time: null },
  };

  log.forEach(run => {
    const km = parseFloat(run.km);
    if (km > records.longest.val) {
      records.longest = { val: km, date: run.date, time: run.time };
    }
    const paceStr = calcPace(run.km, run.time);
    if (paceStr) {
      const [m, s] = paceStr.split(':').map(Number);
      const paceSec = m * 60 + s;
      if (km >= 5 && paceSec < records.fastest5k.val) {
        records.fastest5k = { val: paceSec, str: paceStr, date: run.date, time: run.time };
      }
      if (km >= 10 && paceSec < records.fastest10k.val) {
        records.fastest10k = { val: paceSec, str: paceStr, date: run.date, time: run.time };
      }
      if (km >= 21.09 && paceSec < records.fastestHM.val) {
        records.fastestHM = { val: paceSec, str: paceStr, date: run.date, time: run.time };
      }
      if (km >= 42.19 && paceSec < records.fastestM.val) {
        records.fastestM = { val: paceSec, str: paceStr, date: run.date, time: run.time };
      }
    }
  });

  const wrap = el('div', { style: 'margin-bottom:2rem;' });
  wrap.innerHTML = `<p class="mono muted" style="font-size:11px;letter-spacing:.06em;margin-bottom:.75rem;">${t('history.records')}</p>`;

  const grid = el('div', { style: 'display:grid; grid-template-columns:1fr 1fr; gap:8px;' });

  const unitLabel = getUnitLabel();

  const addRecord = (label, value, sub, icon) => {
    const card = el('div', { class: 'card', style: 'padding:.75rem; border-color:var(--green-mid); background:var(--bg-card-hl);' });
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
        <span style="font-size:11px; color:var(--green); font-family:var(--font-mono);">${label}</span>
        <span>${icon}</span>
      </div>
      <p style="font-size:1.1rem; font-weight:500;">${value}</p>
      <p style="font-size:10px; color:var(--text-muted); margin-top:2px;">${sub}</p>
    `;
    grid.appendChild(card);
  };

  if (records.longest.val > 0) {
    addRecord(t('history.longest'), formatDist(records.longest.val), `${records.longest.time} · ${formatDate(records.longest.date)}`, '🏔️');
  }
  if (records.fastest5k.val !== Infinity) {
    addRecord(t('history.fastest5'), records.fastest5k.time, `${records.fastest5k.str} /${unitLabel} · ${formatDate(records.fastest5k.date)}`, '⚡');
  }
  if (records.fastest10k.val !== Infinity) {
    addRecord(t('history.fastest10'), records.fastest10k.time, `${records.fastest10k.str} /${unitLabel} · ${formatDate(records.fastest10k.date)}`, '🚀');
  }
  if (records.fastestHM.val !== Infinity) {
    addRecord(t('history.fastestHM'), records.fastestHM.time, `${records.fastestHM.str} /${unitLabel} · ${formatDate(records.fastestHM.date)}`, '🥈');
  }
  if (records.fastestM.val !== Infinity) {
    addRecord(t('history.fastestM'), records.fastestM.time, `${records.fastestM.str} /${unitLabel} · ${formatDate(records.fastestM.date)}`, '🏆');
  }

  if (grid.children.length === 0) return el('div');
  wrap.appendChild(grid);
  return wrap;
}


// ─── Weekly Stats ─────────────────────────────────────────
function weeklyStatsSection(log) {
  if (log.length === 0) return el('div');
  const now = new Date();
  now.setHours(0,0,0,0);
  const weeks = [];
  
  for (let i = 0; i < 6; i++) {
    const d = new Date(now);
    const day = d.getDay();
    const diff = d.getDate() - (day === 0 ? 6 : day - 1) - (i * 7);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0,0,0,0);
    weeks.push({ monday, km: 0, label: i === 0 ? t('dashboard.today').toLowerCase() : (i === 1 ? 'Last W.' : formatDate(monday)) });
  }

  log.forEach(run => {
    const runDate = new Date(run.date);
    runDate.setHours(0,0,0,0);
    const week = weeks.find(w => {
      const nextMonday = new Date(w.monday);
      nextMonday.setDate(nextMonday.getDate() + 7);
      return runDate >= w.monday && runDate < nextMonday;
    });
    if (week) week.km += parseFloat(run.km || 0);
  });

  const wrap = el('div', { style: 'margin-bottom:2rem;' });
  wrap.innerHTML = `<p class="mono muted" style="font-size:11px;letter-spacing:.06em;margin-bottom:.75rem;">${t('history.volume')}</p>`;
  
  const chartCard = el('div', { class: 'card', style: 'padding: 1.5rem 1rem 1rem;' });
  const maxKm = Math.max(...weeks.map(w => w.km), 10);
  const bars = el('div', { style: 'display:flex; align-items:flex-end; gap:12px; height:80px;' });
  
  [...weeks].reverse().forEach(w => {
    const height = Math.min((w.km / maxKm) * 65, 65);
    const barWrap = el('div', { style: 'flex:1; display:flex; flex-direction:column; align-items:center; gap:4px;' });
    const bar = el('div', { 
      style: `width:100%; height:${height}px; background:var(--green-mid); border-radius:3px 3px 0 0; cursor:pointer; position:relative;`,
      title: formatDist(w.km)
    });
    bar.innerHTML = `<span style="position:absolute; bottom:${height+5}px; left:0; width:100%; text-align:center; font-size:9px; opacity:0; transition: opacity 0.2s; pointer-events:none;">${convertFromKm(w.km).toFixed(1)}</span>`;
    bar.onmouseover = (e) => { const s = e.currentTarget.querySelector('span'); if (s) s.style.opacity = '1'; };
    bar.onmouseout = (e) => { const s = e.currentTarget.querySelector('span'); if (s) s.style.opacity = '0'; };
    const label = el('span', { style: 'font-size:9px; color:var(--text-muted); font-family:var(--font-mono);' }, w.label);
    barWrap.appendChild(bar);
    barWrap.appendChild(label);
    bars.appendChild(barWrap);
  });
  
  chartCard.appendChild(bars);
  wrap.appendChild(chartCard);
  return wrap;
}

let editingId = null;

// ─── Run list ─────────────────────────────────────────────
function listSection(logData) {
  const log = Array.isArray(logData) ? logData : [];
  const wrap = el('div', {});
  wrap.innerHTML = `<p class="mono muted" style="font-size:11px;letter-spacing:.06em;margin-bottom:.6rem;">${t('history.all')}</p>`;

  if (log.length === 0) {
    const empty = el('div', { class: 'card' });
    empty.innerHTML = `<p class="muted" style="font-size:13px;">${t('history.no_runs')}</p>`;
    wrap.appendChild(empty);
    return wrap;
  }

  [...log].reverse().forEach(run => {
    const isEditing = editingId === run.id;
    const pace = calcPace(run.km, run.time);

    if (isEditing) {
      const editCard = el('div', { class: 'card', style: 'margin-bottom: 12px; border: 1px solid var(--green-mid);' });
      const grid = el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;' });
      const kmInput = el('input', { type: 'number', value: convertFromKm(run.km).toFixed(1), step: '0.1', style: 'width:100%' });
      const timeInput = el('input', { type: 'text', value: run.time, style: 'width:100%' });
      const dateInput = el('input', { type: 'text', value: run.date.split('T')[0], style: 'width:100%' });
      grid.appendChild(el('div', { class: 'input-group', style: 'margin:0' }, el('label', {}, t('dashboard.log_km')), kmInput));
      grid.appendChild(el('div', { class: 'input-group', style: 'margin:0' }, el('label', {}, t('dashboard.log_time')), timeInput));
      editCard.appendChild(grid);
      const dateGroup = el('div', { class: 'input-group', style: 'margin:12px 0;' });
      dateGroup.innerHTML = `<label>${t('dashboard.log_date')}</label>`;
      dateGroup.appendChild(dateInput);
      editCard.appendChild(dateGroup);
      const feelRow = el('div', { style: 'display:flex;gap:8px;margin-bottom:14px;' });
      let selectedFeel = run.feel;
      FEEL_EMOJI.slice(1).forEach((emoji, i) => {
        const btn = el('button', {
          style: `flex:1;padding:8px 0;background:${selectedFeel === i+1 ? 'var(--green-dim)' : 'var(--bg-input)'};border:0.5px solid ${selectedFeel === i+1 ? 'var(--green-mid)' : 'var(--border)'};border-radius:var(--radius-sm);font-size:18px;cursor:pointer;`,
          onClick: () => {
            selectedFeel = i + 1;
            feelRow.querySelectorAll('button').forEach((b, idx) => {
              b.style.background = (idx === i) ? 'var(--green-dim)' : 'var(--bg-input)';
              b.style.borderColor = (idx === i) ? 'var(--green-mid)' : 'var(--border)';
            });
          }
        }, emoji);
        feelRow.appendChild(btn);
      });
      editCard.appendChild(feelRow);
      const shoes = state.get('shoes') || [];
      let selectedShoeId = run.shoeId;
      if (shoes.length > 0) {
        const shoeGroup = el('div', { class: 'input-group' });
        shoeGroup.innerHTML = `<label>${t('profile.gear')}</label>`;
        const shoeSelect = el('select', { 
          style: 'width:100%; background:var(--bg-input); border:0.5px solid var(--border); border-radius:var(--radius-sm); color:var(--text); padding:10px 14px; outline:none;',
          onChange: (e) => { selectedShoeId = e.target.value || null; }
        });
        shoeSelect.appendChild(el('option', { value: '' }, '---'));
        shoes.forEach(s => {
          const opt = el('option', { value: s.id }, s.name);
          if (s.id === selectedShoeId) opt.setAttribute('selected', 'true');
          shoeSelect.appendChild(opt);
        });
        shoeGroup.appendChild(shoeSelect);
        editCard.appendChild(shoeGroup);
      }
      editCard.appendChild(el('p', { class: 'muted', style: 'font-size:12px;font-family:var(--font-mono);margin:12px 0 8px;' }, t('dashboard.log_feel')));
      editCard.appendChild(feelRow);
      const actions = el('div', { style: 'display:flex;gap:8px;' });
      const saveBtn = el('button', {
        class: 'btn btn-primary',
        style: 'flex:1',
        onClick: async () => {
          const normTime = normalizeTime(timeInput.value);
          if (!normTime) return alert(t('history.invalid_time'));
          if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput.value)) return alert(t('history.invalid_date'));
          
          const kmValue = convertToKm(parseFloat(kmInput.value));
          const updatedRun = { ...run, km: kmValue, time: normTime, feel: selectedFeel, shoeId: selectedShoeId, date: new Date(dateInput.value).toISOString() };
          const user = state.get('user');
          if (user) await db.updateRun(run.id, updatedRun);
          const newLog = state.get('runLog').map(r => r.id === run.id ? updatedRun : r).sort((a,b) => new Date(a.date) - new Date(b.date));
          state.set('runLog', newLog);
          editingId = null;
          refresh();
        }
      }, t('history.save'));
      const cancelBtn = el('button', {
        class: 'btn',
        style: 'flex:1; background:var(--bg-input); border:0.5px solid var(--border); color:var(--text);',
        onClick: () => { editingId = null; refresh(); }
      }, t('history.cancel'));
      actions.appendChild(saveBtn);
      actions.appendChild(cancelBtn);
      editCard.appendChild(actions);
      wrap.appendChild(editCard);
      return;
    }

    const row = el('div', { style: `display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:0.5px solid var(--border);` });
    const info = el('div', { style: 'flex:1;' });
    info.innerHTML = `
      <p style="font-size:14px;margin-bottom:1px;">${formatDist(run.km)}</p>
      <p style="font-size:12px;color:var(--text-muted);">${run.time}${pace ? ` · ${pace}/${getUnitLabel()}` : ''}</p>
    `;
    const editBtn = el('button', {
      style: 'background:var(--bg-input);border:0.5px solid var(--border);color:var(--text-muted);cursor:pointer;font-size:14px;padding:6px 10px;border-radius:var(--radius-sm);',
      onClick: () => { editingId = run.id; refresh(); }
    }, '✎');
    const deleteBtn = el('button', {
      style: 'background:var(--bg-input);border:0.5px solid var(--border);color:var(--red);cursor:pointer;font-size:14px;padding:6px 10px;border-radius:var(--radius-sm);',
      onClick: async () => {
        if (!confirm(t('history.delete_confirm'))) return;
        const user = state.get('user');
        if (user) await db.deleteRun(run.id);
        const newLog = state.get('runLog').filter(r => r.id !== run.id);
        state.set('runLog', newLog);
        refresh();
      }
    }, '✕');
    row.appendChild(el('span', { class: 'mono', style: 'font-size:11px;color:var(--text-muted);width:36px;flex-shrink:0;' }, formatDate(run.date)));
    row.appendChild(info);
    row.appendChild(el('span', { style: 'font-size:18px;margin-right:8px;' }, FEEL_EMOJI[run.feel] || ''));
    row.appendChild(editBtn);
    row.appendChild(deleteBtn);
    wrap.appendChild(row);
  });
  return wrap;
}

// ─── Main export ──────────────────────────────────────────
export function HistoryPage() {
  const rawLog = state.get('runLog');
  const log = Array.isArray(rawLog) ? rawLog : [];
  const page = el('div', { class: 'page fade-up' });

  const heading = el('div', { style: 'display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:1.5rem;' });
  heading.innerHTML = `<div><h2 style="margin-bottom:.25rem;">${t('history.title')}</h2><p class="muted" style="font-size:13px;">${t('history.entries', { n: log.length })}</p></div>`;
  const addBtn = el('button', {
    class: 'btn btn-primary',
    style: 'padding: 8px 14px; font-size: 12px;',
    onClick: () => {
      const existingForm = page.querySelector('.add-run-form');
      if (existingForm) existingForm.remove();
      else heading.after(createAddForm());
    }
  }, t('history.add'));
  heading.appendChild(addBtn);
  page.appendChild(heading);

  function createAddForm() {
    const card = el('div', { class: 'card add-run-form', style: 'margin-bottom:1.5rem; border: 1px solid var(--green-mid);' });
    card.innerHTML = `<p class="mono muted" style="font-size:11px;letter-spacing:.06em;margin-bottom:.75rem;">${t('dashboard.log').toUpperCase()}</p>`;
    const grid = el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;' });
    const kmInput = el('input', { type: 'number', placeholder: '10.0', step: '0.1' });
    const timeInput = el('input', { type: 'text', placeholder: '55:00' });
    grid.appendChild(el('div', { class: 'input-group', style: 'margin:0' }, el('label', {}, t('dashboard.log_km')), kmInput));
    grid.appendChild(el('div', { class: 'input-group', style: 'margin:0' }, el('label', {}, t('dashboard.log_time')), timeInput));
    card.appendChild(grid);
    const dateGroup = el('div', { class: 'input-group', style: 'margin-bottom:12px;' });
    const dateInput = el('input', { type: 'text', placeholder: 'YYYY-MM-DD', value: new Date().toISOString().split('T')[0] });
    dateGroup.innerHTML = `<label>${t('dashboard.log_date')}</label>`;
    dateGroup.appendChild(dateInput);
    card.appendChild(dateGroup);
    const feelRow = el('div', { style: 'display:flex;gap:8px;margin-bottom:14px;' });
    let selectedFeel = 3;
    FEEL_EMOJI.slice(1).forEach((emoji, i) => {
      const btn = el('button', {
        style: `flex:1;padding:8px 0;background:${i === 2 ? 'var(--green-dim)' : 'var(--bg-input)'};border:0.5px solid ${i === 2 ? 'var(--green-mid)' : 'var(--border)'};border-radius:var(--radius-sm);font-size:18px;cursor:pointer;`,
        onClick: () => {
          selectedFeel = i + 1;
          feelRow.querySelectorAll('button').forEach((b, idx) => {
            b.style.background = (idx === i) ? 'var(--green-dim)' : 'var(--bg-input)';
            b.style.borderColor = (idx === i) ? 'var(--green-mid)' : 'var(--border)';
          });
        }
      }, emoji);
      feelRow.appendChild(btn);
    });
    card.appendChild(feelRow);
    const shoes = state.get('shoes') || [];
    let selectedShoeId = null;
    if (shoes.length > 0) {
      const shoeGroup = el('div', { class: 'input-group' });
      shoeGroup.innerHTML = `<label>${t('profile.gear')}</label>`;
      const shoeSelect = el('select', { 
        style: 'width:100%; background:var(--bg-input); border:0.5px solid var(--border); border-radius:var(--radius-sm); color:var(--text); padding:10px 14px; outline:none;',
        onChange: (e) => { selectedShoeId = e.target.value || null; }
      });
      shoeSelect.appendChild(el('option', { value: '' }, '---'));
      shoes.forEach(s => shoeSelect.appendChild(el('option', { value: s.id }, s.name)));
      shoeGroup.appendChild(shoeSelect);
      card.appendChild(shoeGroup);
    }
    const actions = el('div', { style: 'display:flex;gap:8px;' });
    const saveBtn = el('button', {
      class: 'btn btn-primary',
      style: 'flex:1',
      onClick: async () => {
        const normTime = normalizeTime(timeInput.value);
        if (!normTime || !kmInput.value) return alert(t('history.invalid_time'));
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput.value)) return alert(t('history.invalid_date'));
        const runEntry = { km: kmInput.value, time: normTime, feel: selectedFeel, date: new Date(dateInput.value).toISOString(), shoeId: selectedShoeId };
        const user = state.get('user');
        if (user) {
          const { data, error } = await db.saveRun(user.id, runEntry);
          if (!error && data) runEntry.id = data.id;
        }
        state.set('runLog', [...(state.get('runLog') || []), runEntry].sort((a,b) => new Date(a.date) - new Date(b.date)));
        refresh();
      }
    }, t('history.save'));
    const cancelBtn = el('button', {
      class: 'btn',
      style: 'flex:1; background:var(--bg-input); border:0.5px solid var(--border); color:var(--text);',
      onClick: () => card.remove()
    }, t('history.cancel'));
    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);
    card.appendChild(actions);
    return card;
  }

  page.appendChild(statsSection(log));
  page.appendChild(recordsSection(log));
  page.appendChild(weeklyStatsSection(log));
  page.appendChild(chartSection(log));
  page.appendChild(listSection(log));

  return page;
}
