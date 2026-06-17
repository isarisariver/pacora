// ─── Supabase Client ──────────────────────────────────────
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { state } from './state.js';

// Supabase via CDN – keine npm dependency nötig
const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,
    persistSession: true,
  }
});

// ─── Auth ─────────────────────────────────────────────────

export const auth = {
  // Magic Link senden
  async sendMagicLink(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + window.location.pathname },
    });
    return { error };
  },

  // Aktuellen User holen
  async getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Ausloggen
  async signOut() {
    await supabase.auth.signOut();
    state.set('user', null);
  },

  // Auth-State Listener – wird in app.js einmalig registriert
  onAuthChange(callback) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
  },
};

// ─── Profil ───────────────────────────────────────────────

export const db = {
  // Profil aus DB laden und in State schreiben
  async loadProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return false;

    state.setMany({
      goal:         data.goal,
      level:        data.level,
      days:         data.days || [],
      recentKm:     data.recent_km,   // Neu hinzugefügt
      injury:       data.injury,
      fitnessTime:  data.pace5k,
      targetTime:   data.target_time,
      raceDate:     data.race_date,
      weeklyGoal:   data.weekly_goal || 30,
      weekPlan:     data.week_plan || null,
    });
    return true;
  },

  // Profil aus State in DB speichern (upsert)
  async saveProfile(userId) {
    const s = state.get();
    const { error } = await supabase.from('profiles').upsert({
      id:           userId,
      goal:         s.goal,
      level:        s.level,
      days:         s.days,
      recent_km:    s.recentKm,    // Neu hinzugefügt
      injury:       s.injury,
      pace5k:       s.fitnessTime,
      target_time:  s.targetTime,
      race_date:    s.raceDate,
      weekly_goal:  s.weeklyGoal,
      week_plan:    s.weekPlan,
    });
    return { error };
  },

  // Alle Runs laden und in State schreiben
  async loadRuns(userId) {
    const { data, error } = await supabase
      .from('runs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) return false;

    state.set('runLog', (data || []).map(r => ({
      id:     r.id,
      km:     r.km,
      time:   r.time,
      feel:   r.feel,
      date:   r.date,
      shoeId: r.shoe_id,
    })));
    return true;
  },

  // Einzelnen Run speichern
  async saveRun(userId, run) {
    const { data, error } = await supabase.from('runs').insert({
      user_id: userId,
      km:      run.km,
      time:    run.time,
      feel:    run.feel,
      date:    run.date,
      shoe_id: run.shoeId,
    }).select().single();

    return { data, error };
  },

  // Einzelnen Lauf löschen
  async deleteRun(runId) {
    const { error } = await supabase.from('runs').delete().eq('id', runId);
    return { error };
  },

  // Run aktualisieren
  async updateRun(runId, run) {
    const { data, error } = await supabase.from('runs').update({
      km:      run.km,
      time:    run.time,
      feel:    run.feel,
      date:    run.date,
      shoe_id: run.shoeId,
    }).eq('id', runId).select().single();

    return { data, error };
  },

  // ─── Shoes ────────────────────────────────────────────────

  async loadShoes(userId) {
    const { data, error } = await supabase
      .from('shoes')
      .select('*')
      .eq('user_id', userId);

    if (error) return false;
    state.set('shoes', data || []);
    return true;
  },

  async saveShoe(userId, name) {
    const { data, error } = await supabase.from('shoes').insert({
      user_id: userId,
      name,
      km: 0,
      active: true
    }).select().single();
    return { data, error };
  },

  async deleteShoe(shoeId) {
    const { error } = await supabase.from('shoes').delete().eq('id', shoeId);
    return { error };
  }
};
