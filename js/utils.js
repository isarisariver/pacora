// ─── Utilities ───────────────────────────────────────────

/**
 * Helper zum Erstellen von DOM-Elementen
 */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on')) {
      const eventName = k.slice(2).toLowerCase();
      node.addEventListener(eventName, v);
    }
    else if (v !== null && v !== undefined) {
      node.setAttribute(k, v);
    }
  }
  for (const child of children) {
    if (!child) continue;
    if (typeof child === 'string') {
      node.insertAdjacentHTML('beforeend', child);
    } else {
      node.appendChild(child);
    }
  }
  return node;
}

/**
 * Normalisiert Zeiteingaben in verschiedene Formate (mm:ss, hh:mm:ss)
 */
export function normalizeTime(raw) {
  if (!raw) return null;
  const str = raw.trim();
  const parts = str.split(':');

  if (parts.length === 1) {
    const mins = parseInt(parts[0]);
    if (isNaN(mins)) return null;
    return `${mins}:00`;
  }

  if (parts.length === 2) {
    const a = parseInt(parts[0]);
    const b = parseInt(parts[1]);
    if (isNaN(a) || isNaN(b)) return null;
    return `${a}:${b.toString().padStart(2, '0')}`;
  }

  if (parts.length === 3) {
    const h = parseInt(parts[0]);
    const m = parseInt(parts[1]);
    const s = parseInt(parts[2]);
    if (isNaN(h) || isNaN(m) || isNaN(s)) return null;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  return null;
}

/**
 * Formatiert ein ISO-Datum für die deutsche Anzeige
 */
export function formatDate(iso) {
  if (!iso) return '–';
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
}

/**
 * Konvertiert Distanzen basierend auf der Nutzerwunsch-Einheit
 */
export function convertFromKm(km) {
  if (km === null || km === undefined) return 0;
  const unit = localStorage.getItem('unit') || 'km';
  return unit === 'mi' ? km * 0.621371 : km;
}

export function convertToKm(val) {
  if (val === null || val === undefined) return 0;
  const unit = localStorage.getItem('unit') || 'km';
  return unit === 'mi' ? val / 0.621371 : val;
}

export function formatDist(km, withUnit = true) {
  const val = convertFromKm(km);
  const unit = localStorage.getItem('unit') || 'km';
  const formatted = parseFloat(val).toFixed(1);
  return withUnit ? `${formatted} ${unit}` : formatted;
}

export function getUnitLabel() {
  return localStorage.getItem('unit') || 'km';
}

/**
 * Berechnet die Pace basierend auf der Nutzerwunsch-Einheit
 */
export function calcPace(km, timeStr) {
  if (!km || !timeStr) return null;
  
  const timeToSeconds = (ts, distKm) => {
    const p = ts.split(':').map(Number);
    if (p.length === 1) return p[0] * 60;
    
    if (p.length === 2) {
      // Wenn Distanz > 15km (HM/Marathon Bereich), interpretiere x:xx als hh:mm
      if (distKm >= 15) return p[0] * 3600 + p[1] * 60;
      // Sonst als mm:ss
      return p[0] * 60 + p[1];
    }
    
    if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
    return 0;
  };

  const totalSec = timeToSeconds(timeStr, parseFloat(km));
  if (!totalSec || km <= 0) return null;
  
  const unit = localStorage.getItem('unit') || 'km';
  const dist = unit === 'mi' ? parseFloat(km) * 0.621371 : parseFloat(km);
  
  if (dist <= 0) return null;

  const perUnit = totalSec / dist;
  const m = Math.floor(perUnit / 60);
  const s = Math.round(perUnit % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
