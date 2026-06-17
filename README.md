# Pacora - Version 1.0

Eine moderne, KI-gestützte Web-App für Läufer, entwickelt mit Fokus auf Ästhetik, Funktionalität und Motivation.

## Features
- **Intelligente Planung:** Generierung von Trainingsplänen basierend auf Ziel (5k, HM, Marathon) und Level.
- **KI-Coaching:** (Simulierte) KI-Optimierung mit spezifischen Trainingstipps und Notizen.
- **Dashboard:** 
  - Fokus auf die heutige Einheit.
  - Renntag-Countdown.
  - Wochenziel-Fortschrittsbalken.
  - Integriertes Logbuch.
- **Historie & Analyse:**
  - Komplette Liste aller Läufe (editierbar).
  - Wochenvolumen-Chart (letzte 6 Wochen).
  - Persönliche Rekorde (Trophy Case).
- **Ausrüstung:** Kilometer-Tracking für Laufschuhe mit Verschleiß-Warnung.
- **Daten-Hoheit:** Export der gesamten Historie als CSV.
- **Dark/Light Mode:** Volle Unterstützung für beide Themes.

## Installation & Start

Da die App moderne JavaScript-Module verwendet, muss sie über einen lokalen Webserver gestartet werden.

### Option 1: Python (einfachste Methode)
Navigiere im Terminal in den Projektordner und starte:
```bash
python3 -m http.server 8000
```
Öffne dann `http://localhost:8000` im Browser.

### Option 2: Node.js (npx)
```bash
npx serve .
```

## Konfiguration (Supabase)
Die App ist für die Nutzung mit Supabase vorbereitet. Die Zugangsdaten befinden sich in `js/config.js`. 
Um deine eigene Datenbank zu nutzen, erstelle ein Projekt auf [supabase.com](https://supabase.com) und lege folgende Tabellen an:
- `profiles` (id, goal, level, days, pace5k, race_date, weekly_goal)
- `runs` (id, user_id, km, time, feel, date, shoe_id)
- `shoes` (id, user_id, name, km, active)

---
*Viel Erfolg beim Training! 🏃‍♂️⚡*
