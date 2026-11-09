import { createClient } from "npm:@supabase/supabase-js@2";
// Stars & Shade · Skye's voice for the School read-aloud. Each line is made once, cached by its text, then shared by everyone.
// Cost guard: a global cap on NEW clips per day (CAP_TTS_GLOBAL, default 200). Cached clips are free to replay.
const env = (k: string, d = "") => Deno.env.get(k) ?? d;
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const out = (j: unknown, status = 200) => new Response(JSON.stringify(j), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const GLOBAL = "00000000-0000-0000-0000-000000000000";
const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
const hex = async (s: string) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, "0")).join("");

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const body = await req.json().catch(() => ({}));
    const text = String(body.text || "").replace(/\s+/g, " ").trim();
    if (!text || text.length > 600) return out({ error: "bad text" }, 400);
    const voice = env("SKYE_VOICE_ID", "cgSgspJ2msm6clMCkdW9"), model = env("TTS_MODEL", "eleven_flash_v2_5");
    const path = `tts/${(await hex(`${voice}|${model}|${text}`)).slice(0, 40)}.mp3`;
    const sign = async () => (await db.storage.from("readings").createSignedUrl(path, 6 * 3600)).data?.signedUrl;
    const have = await sign();
    if (have) return out({ audio: have, cached: true });
    if (!env("ELEVENLABS_API_KEY")) return out({ error: "voice not on yet" }, 503);
    const day = new Date().toISOString().slice(0, 10);
    const { data: u } = await db.from("usage_daily").select("n").eq("day", day).eq("user_id", GLOBAL).eq("what", "tts").maybeSingle();
    const n = u?.n ?? 0;
    if (n >= +env("CAP_TTS_GLOBAL", "200")) return out({ error: "daily limit" }, 429);
    await db.from("usage_daily").upsert({ day, user_id: GLOBAL, what: "tts", n: n + 1 });
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_64`, { method: "POST",
      headers: { "xi-api-key": env("ELEVENLABS_API_KEY"), "Content-Type": "application/json" }, body: JSON.stringify({ text, model_id: model }) });
    if (!r.ok) { console.log("tts", r.status, (await r.text()).slice(0, 200)); return out({ error: "busy" }, 503); }
    const up = await db.storage.from("readings").upload(path, new Uint8Array(await r.arrayBuffer()), { contentType: "audio/mpeg", upsert: true });
    if (up.error) { console.log("upload", up.error.message); return out({ error: "save failed" }, 500); }
    return out({ audio: await sign() });
  } catch (e) { console.log("err", String(e)); return out({ error: "busy" }, 503); }
});
