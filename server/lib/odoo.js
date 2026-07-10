// ── Odoo backoffice-client (JSON-RPC via fetch, geen externe dependency) ─────
// Odoo Online / .sh / self-hosted ondersteunen /jsonrpc. We gebruiken een aparte
// integratie-gebruiker met API-sleutel (geen admin). Zie ODOO-SETUP-CHECKLIST.md.
//
// Prijsintegriteit: price_unit komt ALTIJD uit het Odoo-product (vaste prijs),
// nooit uit de simulator. 1 order = 1 EAN (x_ean). Idempotent op client_order_ref.

const ODOO_URL = process.env.ODOO_URL || '';
const ODOO_DB = process.env.ODOO_DB || '';
const ODOO_USER = process.env.ODOO_USER || '';
const ODOO_API_KEY = process.env.ODOO_API_KEY || '';

let _uidCache = null;

function odooConfigured() {
  return !!(ODOO_URL && ODOO_DB && ODOO_USER && ODOO_API_KEY);
}

async function _jsonrpc(service, method, args) {
  const r = await fetch(`${ODOO_URL}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: { service, method, args },
      id: Math.floor(Math.random() * 1e9),
    }),
  });
  if (!r.ok) throw new Error(`Odoo HTTP ${r.status}`);
  const j = await r.json();
  if (j.error) {
    const m = (j.error.data && j.error.data.message) || j.error.message || 'Odoo-fout';
    throw new Error(`Odoo: ${m}`);
  }
  return j.result;
}

async function authenticate() {
  if (_uidCache) return _uidCache;
  const uid = await _jsonrpc('common', 'authenticate', [ODOO_DB, ODOO_USER, ODOO_API_KEY, {}]);
  if (!uid) throw new Error('Odoo-authenticatie mislukt (controleer DB/gebruiker/API-sleutel)');
  _uidCache = uid;
  return uid;
}

async function executeKw(model, method, args = [], kwargs = {}) {
  const uid = await authenticate();
  return _jsonrpc('object', 'execute_kw', [ODOO_DB, uid, ODOO_API_KEY, model, method, args, kwargs]);
}

// ── Prospect: zoek op email/vat vóór aanmaken (dedup) ─────────────────────────
async function upsertPartner(p) {
  const domain = [];
  if (p.vat) domain.push(['vat', '=', p.vat]);
  else if (p.email) domain.push(['email', '=', p.email]);
  let ids = [];
  if (domain.length) ids = await executeKw('res.partner', 'search', [domain], { limit: 1 });
  if (ids.length) return ids[0];
  const vals = {
    name: p.name || p.company_name || p.email || 'Onbekend',
    email: p.email || false,
    phone: p.phone || false,
    is_company: !!p.company_name,
    street: p.street || false,
    city: p.city || false,
    zip: p.zip || false,
    vat: p.vat || false,
  };
  return executeKw('res.partner', 'create', [vals]);
}

// ── Order: idempotent op client_order_ref (1 EAN, vast product) ───────────────
async function findOrderByRef(clientOrderRef) {
  if (!clientOrderRef) return null;
  const ids = await executeKw('sale.order', 'search',
    [[['client_order_ref', '=', clientOrderRef]]], { limit: 1 });
  return ids.length ? ids[0] : null;
}

async function createOrder({ partnerId, clientOrderRef, ean, productId, offerStatus }) {
  const bestaand = await findOrderByRef(clientOrderRef);
  if (bestaand) return { orderId: bestaand, hergebruikt: true };
  const vals = {
    partner_id: partnerId,
    client_order_ref: clientOrderRef,       // dedup + link-back naar Supabase
    x_ean: ean,                             // custom veld — 1 order = 1 EAN
    x_offer_status: offerStatus || 'aangeboden',
    order_line: [[0, 0, { product_id: productId, product_uom_qty: 1 }]], // price_unit uit product
  };
  const orderId = await executeKw('sale.order', 'create', [vals]);
  return { orderId, hergebruikt: false };
}

// ── Factuur uit order + posten (betaallink via Odoo payment provider) ─────────
async function createInvoiceForOrder(orderId) {
  // sale.order._create_invoices geeft de account.move-id('s) terug.
  const moveIds = await executeKw('sale.order', '_create_invoices', [[orderId]]);
  const invoiceId = Array.isArray(moveIds) ? moveIds[0] : moveIds;
  if (invoiceId) {
    try { await executeKw('account.move', 'action_post', [[invoiceId]]); } catch (e) { /* al gepost / draft */ }
  }
  return invoiceId;
}

async function setOfferStatus(orderId, status) {
  return executeKw('sale.order', 'write', [[orderId], { x_offer_status: status }]);
}

async function getPaymentState(invoiceId) {
  const rows = await executeKw('account.move', 'read', [[invoiceId], ['payment_state', 'amount_total']]);
  return rows && rows[0] ? rows[0] : null;
}

async function attachPdf(orderId, filename, base64) {
  return executeKw('ir.attachment', 'create', [{
    name: filename,
    datas: base64,
    res_model: 'sale.order',
    res_id: orderId,
    type: 'binary',
  }]);
}

async function createLead({ name, email, phone, description, company_name }) {
  return executeKw('crm.lead', 'create', [{
    name: name || 'Website-contact',
    contact_name: name || false,
    email_from: email || false,
    phone: phone || false,
    partner_name: company_name || false,
    description: description || false,
  }]);
}

export {
  odooConfigured, authenticate, executeKw,
  upsertPartner, findOrderByRef, createOrder,
  createInvoiceForOrder, setOfferStatus, getPaymentState, attachPdf, createLead,
};
