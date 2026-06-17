import { router } from './router.js';
import { renderNav } from './nav.js';
import { auth, db, supabase } from './supabase.js';
import { state } from './state.js';

import { AuthPage } from '../pages/auth.js';
import { OnboardingPage } from '../pages/onboarding.js';
import { DashboardPage } from '../pages/dashboard.js';
import { PlanPage } from '../pages/plan.js';
import { HistoryPage } from '../pages/history.js';
import { ProfilePage } from '../pages/profile.js';
import { GearPage } from '../pages/gear.js';

// ─── Nav helper ───────────────────────────────────────────

const APP_ROUTES = ['/dashboard', '/plan', '/history', '/profile', '/gear'];

function onRoute(handler) {
  return () => {
    const path = window.location.hash.slice(1);
    if (APP_ROUTES.some(r => path.startsWith(r))) renderNav();
    else {
      const nav = document.getElementById('bottom-nav');
      if (nav) nav.remove();
      document.getElementById('app').style.paddingBottom = '0';
    }
    return handler();
  };
}

// ─── Routes ───────────────────────────────────────────────

router.on('/',             () => { router.go('/auth'); });
router.on('/auth',         AuthPage);
router.on('/onboarding/1', OnboardingPage.step1);
router.on('/onboarding/2', OnboardingPage.step2);
router.on('/onboarding/3', OnboardingPage.step3);
router.on('/onboarding/4', OnboardingPage.step4);
router.on('/dashboard',    onRoute(DashboardPage));
router.on('/plan',         onRoute(PlanPage));
router.on('/history',      onRoute(HistoryPage));
router.on('/profile',      onRoute(ProfilePage));
router.on('/gear',         onRoute(GearPage));
router.on('*',             () => { router.go('/auth'); });


// ─── Auth State ───────────────────────────────────────────
// Wird einmalig beim Start registriert.
// Wenn Supabase den User zurückgibt (auch nach Magic Link Redirect),
// laden wir Profil + Runs und leiten weiter.

auth.onAuthChange(async (user) => {
  if (!user) return;

  state.set('user', user);

  // Profil aus DB laden
  const hasProfile = await db.loadProfile(user.id);

  // Runs laden
  await db.loadRuns(user.id);

  // Schuhe laden
  await db.loadShoes(user.id);

  // Weiterleiten: Profil vorhanden → Dashboard, sonst Onboarding
  const currentPath = window.location.hash.slice(1);
  const isOnApp = APP_ROUTES.some(r => currentPath.startsWith(r));

  if (!isOnApp) {
    router.go(hasProfile ? '/dashboard' : '/onboarding/1');
  }
});

// ─── Profil speichern nach Onboarding ────────────────────
// onboarding/4 ruft router.go('/dashboard') – wir haken uns
// in den Hash-Change ein um das Profil vorher zu speichern.

window.addEventListener('hashchange', async () => {
  const path = window.location.hash.slice(1);
  const user = state.get('user');
  if (path === '/dashboard' && user) {
    // Nur speichern wenn Profil noch nicht in DB war
    // (einfaches Heuristic: weekPlan noch null = frisch aus Onboarding)
    if (!state.get('weekPlan')) {
      await db.saveProfile(user.id);
    }
  }
});

// ─── Auth Callback abfangen ───────────────────────────────
// Supabase (PKCE flow) hängt nach Magic Link Click einen ?code= Parameter an.
// Wir lösen ihn aktiv ein, bevor der Router startet.

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('code')) {
  const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
  if (error) console.error('Auth exchange error:', error.message);
  // URL cleanen damit der Hash-Router sauber startet
  window.history.replaceState({}, document.title, window.location.pathname);
}

// ─── Start ────────────────────────────────────────────────
(async () => {
  const user = await auth.getUser();
  if (user) {
    state.set('user', user);
    await db.loadProfile(user.id);
    await db.loadRuns(user.id);
    await db.loadShoes(user.id);
  }
  router.start();
})();
