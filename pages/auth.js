import { auth } from '../js/supabase.js';
import { router } from '../js/router.js';

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  for (const child of children) {
    if (!child) continue;
    if (typeof child === 'string') node.insertAdjacentHTML('beforeend', child);
    else node.appendChild(child);
  }
  return node;
}

export function AuthPage() {
  const page = el('div', { class: 'page fade-up' });

  page.innerHTML = `
    <div class="logo"><div class="logo-dot"></div>PACORA</div>
    <div style="margin-top: 3rem; margin-bottom: 2.5rem;">
      <h1 style="margin-bottom:.5rem;">Willkommen zurück.</h1>
      <p class="muted">Gib deine Email ein – wir schicken dir einen Login-Link.</p>
    </div>
  `;

  // Email input
  const inputGroup = el('div', { class: 'input-group' });
  inputGroup.innerHTML = `<label>EMAIL</label>`;
  const emailInput = el('input', { type: 'text', placeholder: 'deine@email.com', id: 'auth-email' });
  inputGroup.appendChild(emailInput);
  page.appendChild(inputGroup);

  // Feedback
  const feedback = el('p', { style: 'font-size:13px;min-height:20px;margin-bottom:1rem;' });
  page.appendChild(feedback);

  // Submit button
  const btn = el('button', {
    class: 'btn btn-primary btn-full',
    onClick: async () => {
      const email = emailInput.value.trim();
      if (!email || !email.includes('@')) {
        feedback.style.color = 'var(--red)';
        feedback.textContent = 'Bitte eine gültige Email eingeben.';
        return;
      }

      btn.textContent = 'Wird gesendet...';
      btn.setAttribute('disabled', 'true');
      feedback.textContent = '';

      const { error } = await auth.sendMagicLink(email);

      if (error) {
        feedback.style.color = 'var(--red)';
        feedback.textContent = 'Fehler: ' + error.message;
        btn.textContent = 'Link senden';
        btn.removeAttribute('disabled');
        return;
      }

      // Erfolg
      page.innerHTML = `
        <div class="logo"><div class="logo-dot"></div>PACORA</div>
        <div style="margin-top:3rem;">
          <h1 style="margin-bottom:.75rem;">Check deine Mails.</h1>
          <p class="muted" style="margin-bottom:1.5rem;">
            Wir haben einen Login-Link an <strong style="color:var(--text);">${email}</strong> geschickt.<br><br>
            Klick den Link in der Email – du wirst automatisch eingeloggt.
          </p>
          <p class="muted" style="font-size:12px;">Kein Email? Schau auch im Spam-Ordner nach.</p>
        </div>
      `;
    }
  }, 'Login-Link senden');
  page.appendChild(btn);

  // Kein Account nötig – Hinweis
  const hint = el('p', { style: 'font-size:12px;color:var(--text-muted);text-align:center;margin-top:2rem;' });
  hint.textContent = 'Kein Passwort nötig. Kein Account erforderlich – einfach Email eingeben.';
  page.appendChild(hint);

  return page;
}
