import { createClient } from "npm:@supabase/supabase-js@2";
// Stars & Shade · pair + group readings by Skye. One reading per pair/group per day, written only when someone opens it,
// shared by everyone in it. Voice is made only when someone taps play, then shared too. Cost guards: per-person and
// global daily caps (env), friendly messages when hit.
const CARDS: [string, string, string, string][] = [["001", "Aries", "I AM", "I said it, I did it."], ["002", "Taurus", "I HAVE", "Mine. Also mine."], ["003", "Gemini", "I THINK", "Wait, which one of me?"], ["004", "Cancer", "I FEEL", "I’m fine. I’m not fine."], ["005", "Leo", "I WILL", "Not dramatic, just iconic."], ["006", "Virgo", "I ANALYZE", "Not judging. Okay, judging."], ["007", "Libra", "I BALANCE", "Conflict? Not in this outfit."], ["008", "Scorpio", "I DESIRE", "I know. I always know."], ["009", "Sagittarius", "I SEE", "Tact? Is that a country?"], ["010", "Capricorn", "I BUILD", "Fun? Is that billable?"], ["011", "Aquarius", "I REBEL", "Weird? Thank you."], ["012", "Pisces", "I BELIEVE", "I got lost in the sauce."], ["013", "Sun", "I EXPRESS", "It’s my world. You’re welcome."], ["014", "Moon", "I REACT", "My feelings have feelings, actually."], ["015", "Mercury", "I COMMUNICATE", "Short answer? Doesn’t exist."], ["016", "Venus", "I ATTRACT", "Romance me… or reimburse me."], ["017", "Mars", "I ACT", "Oh, you wanna go?"], ["018", "Jupiter", "I EXPAND", "What could possibly go wrong?"], ["019", "Saturn", "I LIMIT", "Because I said so. Forever."], ["020", "Uranus", "I INNOVATE", "Who made THAT rule?"], ["021", "Neptune", "I DREAM", "Delusion looks good on me."], ["022", "Pluto", "I TRANSFORM", "Fresh start? Bring a shovel."], ["023", "First House", "I EMERGE", "I come like this."], ["024", "Second House", "I VALUE", "Don’t touch my stuff."], ["025", "Third House", "I CONNECT", "I know a guy."], ["026", "Fourth House", "I DWELL", "Pants are now optional."], ["027", "Fifth House", "I CREATE", "I do it for the giggles."], ["028", "Sixth House", "I SERVE", "My routine needs a routine."], ["029", "Seventh House", "I PARTNER", "Two worlds. One bathroom."], ["030", "Eighth House", "I SHARE", "My lips are on vacation."], ["031", "Ninth House", "I EXPLORE", "Found wisdom. Forgot where."], ["032", "Tenth House", "I ACHIEVE", "I have people for that."], ["033", "Eleventh House", "I BELONG", "We need better people."], ["034", "Twelfth House", "I RELEASE", "My demons have office hours."], ["035", "Ascendant", "I APPROACH", "Judge me after coffee."], ["036", "Retrograde", "I REVIEW", "We meet again. Fantastic."], ["037", "North Node", "I EVOLVE", "My destiny needs a refund."], ["038", "South Node", "I RELY", "I’m loyal to my nonsense."], ["039", "Midheaven", "I ELEVATE", "I’m kind of a big deal."], ["040", "Lot Of Fortune", "I PROSPER", "Luck loves an idiot."], ["041", "Water", "CANCER · PISCES · SCORPIO", "I know what you did."], ["042", "Air", "GEMINI · LIBRA · AQUARIUS", "I talk. Therefore, I am."], ["043", "Fire", "ARIES · LEO · SAGITTARIUS", "I make chaos look cute."], ["044", "Earth", "TAURUS · VIRGO · CAPRICORN", "Yes. Fun costs extra."]];
const SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
const ORD = ["1st","2nd","3rd","4th","5th","6th","7th","8th","9th","10th","11th","12th"];
const env = (k: string, d = "") => Deno.env.get(k) ?? d;
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const out = (j: unknown, status = 200) => new Response(JSON.stringify(j), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const norm = (x: number) => ((x % 360) + 360) % 360;
const sg = (l: number) => SIGNS[Math.floor(norm(l) / 30)];
const GLOBAL = "00000000-0000-0000-0000-000000000000";
const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

type Pl = { planets: { name: string; lon: number; retro?: boolean }[]; asc: number | null; mc?: number | null };
function circMean(l: number[]) { let x = 0, y = 0; for (const a of l) { x += Math.cos(a * Math.PI / 180); y += Math.sin(a * Math.PI / 180); } return norm(Math.atan2(y, x) * 180 / Math.PI); }
function composite(list: Pl[]): Pl {
  return { planets: list[0].planets.map(p => ({ name: p.name, lon: circMean(list.map(q => (q.planets.find(r => r.name === p.name) || p).lon)) })),
    asc: list.every(q => q.asc != null) ? circMean(list.map(q => q.asc as number)) : null };
}
const line = (who: string, pl: Pl) => `${who}: ` + pl.planets.map(p => `${p.name} ${sg(p.lon)}${p.retro ? " Rx" : ""}`).join(", ") + (pl.asc != null ? `, Rising ${sg(pl.asc)}` : "");
function houseIn(lon: number, asc: number | null) { return asc == null ? null : ((Math.floor(norm(lon) / 30) - Math.floor(norm(asc) / 30) + 12) % 12) + 1; }

async function bump(user: string, what: string, day: string, cap: number) {
  const { data } = await db.from("usage_daily").select("n").eq("day", day).eq("user_id", user).eq("what", what).maybeSingle();
  const n = (data?.n ?? 0);
  if (n >= cap) return false;
  await db.from("usage_daily").upsert({ day, user_id: user, what, n: n + 1 });
  return true;
}

const SYSTEM = `You are Skye, The Shade Oracle: the sassy, warm, anti-cringe astrologer of Stars & Shade, a teaching deck by Tutu. You roast energies, never people.
You're writing today's reading for a PAIR or GROUP of people (friends, couples, polycules, families, crews: every relationship type is valid; never assume romance unless the group kind says so, never assume monogamy).
Rules:
- Motto first: the deck's "I motto" for each card is the real learning tool. Use the exact motto wording (e.g. "I FEEL", "I ACHIEVE") when you name a planet, sign or house. A zinger only when it truly lands, at most one, exact wording.
- Use only the placements and sky given. Whole Sign houses. Tropical zodiac.
- 120 to 170 words. Plain text, no markdown, no lists, no emojis except at most one ✦. Speak to them as "you two" (pair) or "you all"/the group name (group).
- Structure: one line naming the vibe of their bond today; what today's sky is lighting up in their shared (composite) chart; one practical, kind nudge for today.
- No doom, no predictions of breakups, cheating, illness or money. No medical, legal or money advice. Age-appropriate, nothing sexual. Never use anyone's birth date, time or place.
The 44 cards (number, name, I motto, zinger):
` + CARDS.map(c => `${c[0]} ${c[1]}: ${c[2]} | "${c[3]}"`).join("\n");

async function write(people: { name: string; pl: Pl }[], label: string, kind: string, sky: { name: string; lon: number; retro?: boolean }[], paid: boolean) {
  const comp = composite(people.map(p => p.pl));
  const skyTxt = sky.length ? sky.map(p => `${p.name} ${sg(p.lon)}${p.retro ? " retrograde" : ""}${comp.asc != null ? ` (their shared ${ORD[(houseIn(p.lon, comp.asc) as number) - 1]} house)` : ""}`).join("; ") : "not given";
  const user = [`${kind === "pair" ? "Pair" : "Group"}: ${label}`, ...people.map(p => line(p.name, p.pl)), line("Composite (shared chart)", comp), `Today's sky: ${skyTxt}`, "Write today's reading."].join("\n");
  const model = paid ? env("PAID_MODEL", "claude-sonnet-5-5") : env("FREE_MODEL", "claude-haiku-5-5");
  const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": env("ANTHROPIC_API_KEY"), "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model, max_tokens: 500, system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }], messages: [{ role: "user", content: user }] }) });
  if (!r.ok) { console.log("anthropic", r.status, (await r.text()).slice(0, 300)); throw new Error("busy"); }
  const j = await r.json();
  return (j.content || []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("").trim();
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: ud } = await db.auth.getUser(jwt);
    const me = ud?.user?.id; if (!me) return out({ error: "Sign in to get readings." }, 401);
    const body = await req.json().catch(() => ({}));
    const kind = body.kind === "group" ? "group" : "pair", id = String(body.id || ""), mode = body.mode === "voice" ? "voice" : "full";
    // the reader's local day, kept within a day of the server clock
    const now = Date.now(); let day = String(body.day || "").slice(0, 10);
    const ok = /^\d{4}-\d{2}-\d{2}$/.test(day) && Math.abs(Date.parse(day + "T12:00:00Z") - now) < 40 * 3600e3; if (!ok) day = new Date(now).toISOString().slice(0, 10);
    const sky = (Array.isArray(body.sky) ? body.sky : []).slice(0, 12).filter((p: { name: unknown; lon: unknown }) => typeof p?.name === "string" && SIGNS && Number.isFinite(+p.lon)).map((p: { name: string; lon: number; retro?: boolean }) => ({ name: p.name.slice(0, 12), lon: +p.lon, retro: !!p.retro }));

    // who's in it (checked here, with the service key)
    let ids: string[] = [], label = "", gkind = "pair", key = "";
    if (kind === "pair") {
      const [a, b] = [me, id].sort();
      const { data: f } = await db.from("friendships").select("status").eq("a", a).eq("b", b).maybeSingle();
      if (f?.status !== "accepted") return out({ error: "You two aren’t friends on Stars & Shade." }, 403);
      ids = [a, b]; key = `p:${a}:${b}`;
    } else {
      const { data: g } = await db.from("groups").select("id,name,kind").eq("id", id).maybeSingle();
      const { data: ms } = await db.from("group_members").select("user_id,status").eq("group_id", id);
      if (!g || !(ms || []).some(m => m.user_id === me && m.status === "joined")) return out({ error: "That group isn’t yours." }, 403);
      ids = (ms || []).filter(m => m.status === "joined").map(m => m.user_id); label = `${g.name} (${g.kind})`; gkind = g.kind; key = `g:${id}`;
    }
    const { data: ppl } = await db.from("people").select("id,name,handle,placements").in("id", ids);
    const people = (ppl || []).filter(p => p.placements?.planets?.length).map(p => ({ name: p.name || "@" + p.handle, pl: p.placements as Pl }));
    if (people.length < 2) return out({ error: "Skye needs at least two charts for this one." }, 400);
    if (kind === "pair") label = people.map(p => p.name).join(" + ");

    const paid = env("PAID_ALL", "1") === "1";     // until checkout launches: testers get the full experience
    // text: cached per pair/group per day
    let { data: cached } = await db.from("readings").select("text,audio_path").eq("key", key).eq("day", day).eq("kind", "full").maybeSingle();
    if (!cached) {
      if (!env("ANTHROPIC_API_KEY")) return out({ error: "Skye’s full readings switch on very soon. Today’s line above is live now." }, 503);
      if (!await bump(me, "text", day, +env("CAP_TEXT_USER", "30"))) return out({ error: "That’s all of Skye’s new readings for you today. They’re back tomorrow." }, 429);
      if (!await bump(GLOBAL, "text", day, +env("CAP_TEXT_GLOBAL", "3000"))) return out({ error: "Skye’s booked solid today. Today’s line above still works, and full readings are back tomorrow." }, 429);
      const text = await write(people, label, gkind, sky, paid);
      await db.from("readings").upsert({ key, day, kind: "full", text });
      cached = { text, audio_path: null };
    }
    if (mode === "full") return out({ text: cached.text, cached: true });

    // voice: made once on the first tap, then shared
    let path = cached.audio_path as string | null;
    if (!path) {
      if (!env("ELEVENLABS_API_KEY")) return out({ error: "Skye’s voice for readings switches on very soon.", text: cached.text }, 503);
      if (!paid) return out({ error: "Hearing Skye is part of the paid plan.", text: cached.text }, 402);
      if (!await bump(me, "voice", day, +env("CAP_VOICE_USER", "5"))) return out({ error: "You’ve heard all of Skye’s voice readings for today. Back tomorrow!", text: cached.text }, 429);
      if (!await bump(GLOBAL, "voice", day, +env("CAP_VOICE_GLOBAL", "300"))) return out({ error: "Skye’s voice is booked solid today. Read it here, and voice is back tomorrow.", text: cached.text }, 429);
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${env("SKYE_VOICE_ID", "cgSgspJ2msm6clMCkdW9")}?output_format=mp3_44100_64`, { method: "POST",
        headers: { "xi-api-key": env("ELEVENLABS_API_KEY"), "Content-Type": "application/json" }, body: JSON.stringify({ text: cached.text, model_id: env("TTS_MODEL", "eleven_flash_v2_5") }) });
      if (!r.ok) { console.log("tts", r.status, (await r.text()).slice(0, 300)); return out({ error: "Skye’s voice is busy right now. Try again in a minute.", text: cached.text }, 503); }
      const mp3 = new Uint8Array(await r.arrayBuffer());
      path = `${day}/${key.replace(/:/g, "_")}.mp3`;
      const up = await db.storage.from("readings").upload(path, mp3, { contentType: "audio/mpeg", upsert: true });
      if (up.error) { console.log("upload", up.error.message); return out({ error: "Couldn’t save Skye’s voice. Try again.", text: cached.text }, 500); }
      await db.from("readings").update({ audio_path: path }).eq("key", key).eq("day", day).eq("kind", "full");
    }
    const { data: su } = await db.storage.from("readings").createSignedUrl(path, 6 * 3600);
    return out({ text: cached.text, audio: su?.signedUrl });
  } catch (e) {
    console.log("err", String(e));
    return out({ error: "Skye’s busy for a sec. Try again in a moment." }, 503);
  }
});
