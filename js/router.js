// ─── Router ───────────────────────────────────────────────
// Hash-based SPA router. No dependencies.
// Usage: router.go('/dashboard')
//        router.on('/dashboard', DashboardPage)

const routes = new Map();
const app = document.getElementById('app');

function render(path) {
  const handler = routes.get(path) ?? routes.get('*');
  if (!handler) return;
  app.innerHTML = '';
  const el = handler();
  if (el) app.appendChild(el);
}

function currentPath() {
  return window.location.hash.slice(1) || '/';
}

export const router = {
  on(path, handler) {
    routes.set(path, handler);
  },

  go(path) {
    window.location.hash = path;
  },

  start() {
    window.addEventListener('hashchange', () => render(currentPath()));
    render(currentPath());
  },
};
