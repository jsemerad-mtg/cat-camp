// Cloudflare Pages Function backing Cat Camp's optional account sync.
// Routes (all POST, JSON body): /api/account (create), /api/login, /api/save
//
// Requires a KV namespace bound to this Pages project as CATCAMP_KV.
// See README.md for the one-time dashboard setup.

export async function onRequestPost(context) {
  const { request, env, params } = context;
  const path = (params.path || []).join("/");
  const KV = env.CATCAMP_KV;

  if (!KV) {
    return json({ ok: false, error: "Server not configured yet (missing CATCAMP_KV binding)." }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, error: "Bad request." }, 400);
  }

  if (path === "account") return handleCreate(KV, body);
  if (path === "login") return handleLogin(KV, body);
  if (path === "save") return handleSave(KV, body);
  return json({ ok: false, error: "Unknown endpoint." }, 404);
}

export async function onRequestGet() {
  return json({ ok: false, error: "This endpoint only accepts POST." }, 405);
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json" }
  });
}

function normName(name) {
  return String(name || "").trim().toLowerCase().slice(0, 40);
}

function validPin(pin) {
  return typeof pin === "string" && /^[0-9]{4,8}$/.test(pin);
}

async function hashPin(pin, salt) {
  const enc = new TextEncoder();
  const data = enc.encode(salt + ":" + pin);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomSalt() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function defaultGameState(name) {
  return {
    onboarded: true,
    childName: name,
    catName: null,
    points: 0,
    streakCurrent: 0,
    streakBest: 0,
    lastPlayedDate: null,
    moodCheckedDate: null,
    feelings: { okay: 0, frustrated: 0, sad: 0, mad: 0, embarrassed: 0 },
    unlockedColors: ["orange"],
    unlockedOutfits: ["bandana"],
    selectedColor: "orange",
    selectedOutfit: null,
    levelsCompleted: 0
  };
}

async function handleCreate(KV, body) {
  const name = normName(body.name);
  const pin = String(body.pin || "");
  if (!name) return json({ ok: false, error: "Please enter a name." }, 400);
  if (!validPin(pin)) return json({ ok: false, error: "PIN must be 4-8 digits." }, 400);

  const key = "account:" + name;
  const existing = await KV.get(key);
  if (existing) {
    return json({ ok: false, error: "That name is already taken. Try logging in instead." }, 409);
  }

  const salt = randomSalt();
  const pinHash = await hashPin(pin, salt);
  const state =
    body.state && typeof body.state === "object"
      ? Object.assign(defaultGameState(body.name), body.state)
      : defaultGameState(body.name);

  const record = { salt, pinHash, state, updatedAt: Date.now() };
  await KV.put(key, JSON.stringify(record));
  return json({ ok: true, state });
}

async function handleLogin(KV, body) {
  const name = normName(body.name);
  const pin = String(body.pin || "");
  if (!name || !pin) return json({ ok: false, error: "Enter your name and PIN." }, 400);

  const key = "account:" + name;
  const raw = await KV.get(key);
  if (!raw) return json({ ok: false, error: "No account found with that name." }, 404);

  const record = JSON.parse(raw);
  const check = await hashPin(pin, record.salt);
  if (check !== record.pinHash) return json({ ok: false, error: "Incorrect PIN." }, 401);

  return json({ ok: true, state: record.state });
}

async function handleSave(KV, body) {
  const name = normName(body.name);
  const pin = String(body.pin || "");
  if (!name || !pin) return json({ ok: false, error: "Missing credentials." }, 400);

  const key = "account:" + name;
  const raw = await KV.get(key);
  if (!raw) return json({ ok: false, error: "No account found." }, 404);

  const record = JSON.parse(raw);
  const check = await hashPin(pin, record.salt);
  if (check !== record.pinHash) return json({ ok: false, error: "Incorrect PIN." }, 401);

  record.state = body.state && typeof body.state === "object" ? body.state : record.state;
  record.updatedAt = Date.now();
  await KV.put(key, JSON.stringify(record));
  return json({ ok: true });
}
