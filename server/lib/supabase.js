// ── Supabase REST-helper (server-side, service-role) ─────────────────────────
// Voor de audit-trail van offertes (aanvaarding + Odoo-referenties). Reuse
// dezelfde Supabase als de Academy/9a. Tabel: offertes (zie SQL in README).

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function supabaseConfigured() {
  return !!(SUPABASE_URL && SERVICE_KEY);
}

async function _rest(path, { method = 'GET', body, prefer } = {}) {
  const headers = {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers['Prefer'] = prefer;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`Supabase HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const txt = await r.text();
  return txt ? JSON.parse(txt) : null;
}

// Valideer een Supabase-JWT (Bearer van de ingelogde gebruiker) → user-object.
async function getUserFromToken(bearer) {
  if (!bearer) return null;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${bearer}` },
  });
  if (!r.ok) return null;
  return r.json();
}

// Offerte-record aanmaken/bijwerken (idempotent op aanbod_id).
async function upsertOfferte(rij) {
  return _rest('offertes?on_conflict=aanbod_id', {
    method: 'POST',
    body: [rij],
    prefer: 'resolution=merge-duplicates,return=representation',
  });
}

async function updateOfferteByAanbod(aanbodId, patch) {
  return _rest(`offertes?aanbod_id=eq.${encodeURIComponent(aanbodId)}`, {
    method: 'PATCH', body: patch, prefer: 'return=representation',
  });
}

async function getOfferteByAanbod(aanbodId) {
  const rows = await _rest(`offertes?aanbod_id=eq.${encodeURIComponent(aanbodId)}&select=*`);
  return rows && rows.length ? rows[0] : null;
}

async function insertContact(rij) {
  return _rest('contact_leads', { method: 'POST', body: [rij], prefer: 'return=minimal' });
}

export {
  supabaseConfigured, getUserFromToken,
  upsertOfferte, updateOfferteByAanbod, getOfferteByAanbod, insertContact,
};
