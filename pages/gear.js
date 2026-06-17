import { state } from '../js/state.js';
import { db } from '../js/supabase.js';
import { router } from '../js/router.js';
import { el, formatDate } from '../js/utils.js';
import { t } from '../js/i18n.js';

function refresh() {
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function calculateShoeKm(shoeId, log) {
  return log
    .filter(run => run.shoeId === shoeId)
    .reduce((sum, run) => sum + parseFloat(run.km || 0), 0);
}

export function GearPage() {
  const shoes = state.get('shoes') || [];
  const log = state.get('runLog') || [];
  const user = state.get('user');

  const page = el('div', { class: 'page fade-up' });

  const heading = el('div', { style: 'margin-bottom:1.5rem;' });
  heading.innerHTML = `<h2>${t('gear.title')}</h2><p class="muted" style="font-size:13px;">${t('gear.subtitle')}</p>`;
  
  const backBtn = el('button', { class: 'btn btn-ghost btn-full', style: 'margin-bottom:15px;', onClick: () => router.go('/profile') }, t('profile.back'));
  page.appendChild(backBtn);
  page.appendChild(heading);

  // Add Shoe Form
  const addForm = el('div', { class: 'card', style: 'margin-bottom:1.5rem;' });
  const nameInput = el('input', { type: 'text', placeholder: t('gear.placeholder'), style: 'margin-bottom:12px;' });
  const addBtn = el('button', {
    class: 'btn btn-primary btn-full',
    onClick: async () => {
      if (!nameInput.value) return;
      const { data, error } = await db.saveShoe(user.id, nameInput.value);
      if (!error && data) {
        state.set('shoes', [...shoes, data]);
        nameInput.value = '';
        refresh();
      }
    }
  }, t('gear.add'));
  
  addForm.appendChild(el('p', { class: 'mono muted', style: 'font-size:11px; margin-bottom:8px;' }, t('gear.label')));
  addForm.appendChild(nameInput);
  addForm.appendChild(addBtn);
  page.appendChild(addForm);

  // Shoe List
  const list = el('div', { style: 'display:flex; flex-direction:column; gap:12px;' });
  
  if (shoes.length === 0) {
    list.appendChild(el('p', { class: 'muted', style: 'text-align:center; padding:20px;' }, t('gear.no_shoes')));
  }

  shoes.forEach(shoe => {
    const km = calculateShoeKm(shoe.id, log);
    const progress = Math.min((km / 800) * 100, 100); // 800km als Standard-Limit
    
    const card = el('div', { class: 'card' });
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
        <div>
          <p style="font-size:15px; font-weight:500;">${shoe.name}</p>
          <p class="mono muted" style="font-size:11px;">${t('gear.km_limit', { km: km.toFixed(1), limit: 800 })}</p>
        </div>
        <button class="btn-delete" style="background:none; border:none; color:var(--red); cursor:pointer;">✕</button>
      </div>
      <div style="height:4px; background:var(--bg-input); border-radius:2px; overflow:hidden;">
        <div style="height:100%; width:${progress}%; background:${progress > 90 ? 'var(--red)' : 'var(--green-mid)'}; transition:width 0.5s;"></div>
      </div>
    `;

    card.querySelector('.btn-delete').onclick = async () => {
      if (!confirm(t('gear.delete_confirm', { name: shoe.name }))) return;
      await db.deleteShoe(shoe.id);
      state.set('shoes', shoes.filter(s => s.id !== shoe.id));
      refresh();
    };

    list.appendChild(card);
  });

  page.appendChild(list);
  return page;
}
