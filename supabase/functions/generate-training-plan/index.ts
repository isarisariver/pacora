import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS Preflight Requests abfangen
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. JWT Authentifizierung prüfen
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Nicht autorisiert. Kein Auth-Header vorhanden.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Body-Daten parsen
    const { profile } = await req.json()
    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'Fehlende Profildaten im Request-Body.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Gemini API-Key aus Umgebungsvariablen laden
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API Key ist in Supabase nicht konfiguriert.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Parameter für den Prompt extrahieren
    const { goal, level, days, fitnessTime, targetTime, raceDate, lang } = profile
    const daysStr = Array.isArray(days) ? days.join(', ') : 'Mo, Mi, Sa'
    
    // Einfache Logik, um die Anzahl der Wochen aus dem Ziel zu bestimmen
    const GOAL_WEEKS = { hm: 12, marathon: 16, '10k': 10, '5k': 8, fit: 8 };
    const totalWeeks = GOAL_WEEKS[goal] || 8;
    
    const targetLang = lang === 'en' ? 'English' : 'German';

    const systemPrompt = `You are an expert running coach specialized in creating personalized training plans.
Your goal is to generate a multi-week training plan in JSON format based on the user's profile.
The user wants a plan for exactly ${totalWeeks} weeks ending on or around ${raceDate || 'an unspecified date'}. You MUST generate all ${totalWeeks} weeks in the JSON array. Do not truncate the plan.

Constraints:
1. Progressive overload: Increase volume by no more than 10% per week.
2. Recovery: Every 4th week must be a "Recovery Week" with ~30% reduced volume.
3. Variety: Include Easy Runs, Tempo Runs, Intervall, and one Langer Lauf (Long Run) per week.
4. Specificity: If the goal is a 5k/10k, focus on speed; if a Marathon/HM, focus on endurance.
5. Technical Keys: The week days in sessions must match exactly these 7 internal keys in order: Mo, Di, Mi, Do, Fr, Sa, So. YOU MUST USE THESE EXACT KEYS AS TECHNICAL IDENTIFIERS, regardless of the language.
6. Localization: Only the fields "phase" and "note" must be written in ${targetLang}.
7. Session Types: Only use these exact internal keys for "type": "Easy Run", "Tempo Run", "Intervall", "Langer Lauf", "Ruhetag".
8. Ruhetag: Must have km set to null.
9. No AI Labels: Never use words like "AI", "KI", or "Optimized" in any field.

Output Format:
Return ONLY a JSON array of ${totalWeeks} weeks. Each week object MUST contain the "referenceFitness" field.
Exact shape per week:
{
  "week": number,
  "phase": "string (in ${targetLang})",
  "referenceFitness": "HH:MM:SS",
  "recovery": boolean,
  "sessions": [
    { "day": "Mo", "type": "Easy Run", "km": 6, "note": "string in ${targetLang}" },
    { "day": "Di", "type": "Ruhetag", "km": null, "note": "" },
    ...
  ]
}

Important: The "day" field MUST strictly use Mo, Di, Mi, Do, Fr, Sa, So as technical keys. The frontend will translate these for display.
Important: The "referenceFitness" is MANDATORY for every week. It should be a time string (HH:MM:SS).
- Week 1 MUST start at or very near the user's Current Fitness (${fitnessTime}).
- The FINAL week MUST reach the exact Target Race Goal (${targetTime}).
- You MUST bridge this gap progressively throughout the plan. Do not be conservative; the plan's primary objective is to reach the Target Race Goal, regardless of the initial starting point. If the gap is large, ensure the progression is steep enough.concerns about feasibility should NOT limit the plan's goals.`;

    const userPrompt = `User Profile:
- Goal: ${goal}
- Level: ${level}
- Training Days: [${daysStr}]
- Current Fitness (Best Time): ${fitnessTime || 'Keine Angabe'}
- Target Race Goal: ${targetTime || 'Keine Angabe'}
- Target Race Date: ${raceDate || 'Keine Angabe'}

Generate a personalized training plan according to the constraints.`;

    // 5. Google Gemini API Aufruf mit Fallback-Mechanismus
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash'];
    let result;
    let lastError;

    for (const model of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}\n\nReturn ONLY raw JSON, no markdown formatting or explanation.` }]
              }]
            })
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Model ${model} failed: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!textContent) {
          throw new Error(`Model ${model} returned empty content`);
        }

        result = JSON.parse(textContent);
        break; // Erfolgreich, Schleife verlassen
      } catch (err) {
        console.error(`Attempt with ${model} failed:`, err);
        lastError = err;
      }
    }

    if (!result) {
      throw lastError || new Error("All model attempts failed");
    }

    return new Response(
      JSON.stringify({ plan: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge Function Exception:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
