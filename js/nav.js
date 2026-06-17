// ─── Bottom Navigation ────────────────────────────────────
import { router } from './router.js';
import { t } from './i18n.js';

const TABS = [
  { path: '/dashboard', label: t('dashboard.title'), icon: '⚡' },
  { path: '/plan',      label: t('plan.title'),      icon: '📅' },
  { path: '/history',   label: t('history.title'),   icon: '📈' },
  { path: '/profile',   label: t('profile.title'),   icon: '👤' },
];

// ─── Theme Toggle ────────────────────────────────────────
function getTheme() { return localStorage.getItem('theme') || 'dark'; }
function setTheme(t) {
  localStorage.setItem('theme', t);
  document.documentElement.classList.toggle('light', t === 'light');
}

// Theme beim Laden anwenden
setTheme(getTheme());

export function renderNav() {
  const existing = document.getElementById('bottom-nav');
  if (existing) existing.remove();

  const navWrap = document.createElement('div');
  navWrap.id = 'bottom-nav';

  const nav = document.createElement('nav');
  
  // Logo zur Navbar hinzufügen
  const logo = document.createElement('div');
  logo.className = 'logo';
  logo.style.margin = '0';
  logo.style.fontSize = '14px';
  logo.innerHTML = '<div class="logo-dot"></div>PACORA';
  logo.style.cursor = 'pointer';
  logo.onclick = () => router.go('/dashboard');
  nav.appendChild(logo);

  const current = window.location.hash.slice(1);

  const tabsWrap = document.createElement('div');
  tabsWrap.className = 'nav-tabs';

  TABS.forEach(tab => {
    const active = current.startsWith(tab.path);
    const btn = document.createElement('button');
    if (active) btn.className = 'active';
    btn.innerHTML = `<span>${tab.icon}</span>${tab.label}`;
    btn.addEventListener('click', () => router.go(tab.path));
    tabsWrap.appendChild(btn);
  });
  
  nav.appendChild(tabsWrap);
  navWrap.appendChild(nav);
  document.body.appendChild(navWrap);
}