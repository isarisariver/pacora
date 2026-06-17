import { supabase } from './supabase.js';

/**
 * Ruft den echten AI Coach über eine Supabase Edge Function auf.
 */
export const aiService = {
  async generatePersonalizedPlan(profile) {
    console.log("Rufe KI-Coach über Supabase Edge Function auf...", profile);
    
    // JWT-Token des aktuell angemeldeten Nutzers holen, um die Edge Function zu authentifizieren
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/generate-training-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || ''}`
      },
      body: JSON.stringify({ profile })
    });
    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Fehler bei der Plan-Generierung durch die KI.');
    }
    
    const data = await response.json();
    return data.plan;
  }
};
