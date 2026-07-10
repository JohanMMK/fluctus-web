// ── Offerte-flow (spec §5–6) ─────────────────────────────────────────────────
// Bindende regels: 2 vaste-prijsproducten, 1 offerte = 1 EAN, lichte aanvaarding
// (audit-trail), START PAS NA BETALING, betaling via de Odoo-factuurlink, order
// "in behandeling" tot betaald. Idempotent op aanbod_id (= client_order_ref).

import express from 'express';
import * as odoo from '../lib/odoo.js';
import * as sb from '../lib/supabase.js';
import * as brevo from '../lib/brevo.js';

const router = express.Router();

const PRODUCT_IDS = {
  SolarActive: Number(process.env.ODOO_PRODUCT_ID_SOLARACTIVE || 0),
  Ontwerp: Number(process.env.ODOO_PRODUCT_ID_ONTWERP || 0),
};

function _bearer(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

async function _betaallink(invoiceId) {
  // Portal-URL van de factuur (Odoo payment provider = Mollie/Bancontact).
  try {
    const rows = await odoo.executeKw('account.move', 'read', [[invoiceId], ['access_url', 'access_token']]);
    const rec = rows && rows[0];
    if (rec && rec.access_url) {
      const url = String(rec.access_url);
      return url.startsWith('http') ? url : `${process.env.ODOO_URL}${url}`;
    }
    return `${process.env.ODOO_URL}/my/invoices/${invoiceId}`;
  } catch (e) {
    return `${process.env.ODOO_URL}/my/invoices/${invoiceId}`;
  }
}

// POST /api/offerte/aanvaarden
// body: { aanbod_id, product, ean, klant{...}, pad:'A'|'B', tvt_jaar?, audit{...}, rapport_pdf_base64? }
router.post('/aanvaarden', async (req, res) => {
  const b = req.body || {};
  const { aanbod_id, product, ean, klant = {}, pad = 'A', tvt_jaar, audit = {}, rapport_pdf_base64 } = b;

  // ── Validatie (bindende regels) ──
  if (!aanbod_id) return res.status(400).json({ error: 'aanbod_id verplicht' });
  if (!PRODUCT_IDS[product]) return res.status(400).json({ error: "product moet 'SolarActive' of 'Ontwerp' zijn" });
  if (!ean) return res.status(400).json({ error: 'ean verplicht (1 offerte = 1 EAN)' });
  if (!klant.email) return res.status(400).json({ error: 'klant.email verplicht (geverifieerd e-mailadres)' });
  // Opschortende voorwaarde SolarActive: terugverdientijd < 3 jaar (afgedwongen vóór bindende offerte).
  if (product === 'SolarActive' && !(typeof tvt_jaar === 'number' && tvt_jaar < 3)) {
    return res.status(422).json({ error: 'SolarActive vereist een bewezen terugverdientijd < 3 jaar.' });
  }

  // Ingelogde gebruiker (Academy) — audit-koppeling.
  const user = await sb.getUserFromToken(_bearer(req)).catch(() => null);

  if (!odoo.odooConfigured()) {
    return res.status(503).json({ error: 'Odoo-backoffice nog niet geconfigureerd (zie ODOO-SETUP-CHECKLIST.md).' });
  }

  try {
    // 1. Audit-trail in Supabase (lichte aanvaarding = documenthash, tijdstip, IP, e-mail).
    if (sb.supabaseConfigured()) {
      await sb.upsertOfferte({
        aanbod_id,
        product, ean,
        status: 'aangeboden',
        klant_email: klant.email,
        klant_naam: klant.name || klant.company_name || null,
        klant_vat: klant.vat || null,
        pad,
        aanvaard_documenthash: audit.documenthash || null,
        aanvaard_ip: audit.ip || req.ip || null,
        aanvaard_tijdstip: audit.tijdstip || new Date().toISOString(),
        aanvaard_user_id: (user && user.id) || null,
      }).catch(e => console.warn('[offerte] supabase upsert:', e.message));
    }

    // 2. Odoo: prospect (dedup) → order (idempotent, 1 EAN, vast product) → factuur.
    const partnerId = await odoo.upsertPartner(klant);
    const { orderId, hergebruikt } = await odoo.createOrder({
      partnerId, clientOrderRef: aanbod_id, ean, productId: PRODUCT_IDS[product], offerStatus: 'aangeboden',
    });
    if (rapport_pdf_base64) {
      await odoo.attachPdf(orderId, `Fluctus-rapport-${aanbod_id}.pdf`, rapport_pdf_base64).catch(() => {});
    }
    const invoiceId = await odoo.createInvoiceForOrder(orderId);
    await odoo.setOfferStatus(orderId, 'in_behandeling');
    const betaallink = invoiceId ? await _betaallink(invoiceId) : null;

    // 3. Supabase bijwerken met Odoo-referenties + status.
    if (sb.supabaseConfigured()) {
      await sb.updateOfferteByAanbod(aanbod_id, {
        status: 'in_behandeling',
        odoo_partner_id: partnerId,
        odoo_order_id: orderId,
        odoo_invoice_id: invoiceId || null,
        betaallink,
      }).catch(e => console.warn('[offerte] supabase update:', e.message));
    }

    // 4. Mail (Brevo): aanvaarding-bevestiging (pad A) of betaallink toesturen (pad B).
    brevo.sendTemplate('aanvaarding', klant.email, { aanbod_id, product, betaallink }).catch(() => {});

    // Pad A: front-end redirect naar de betaallink. Pad B: klant betaalt later via dezelfde link.
    return res.json({
      ok: true, aanbod_id, pad, status: 'in_behandeling',
      order_id: orderId, invoice_id: invoiceId || null, betaallink, hergebruikt,
    });
  } catch (e) {
    console.error('[offerte] fout:', e.message);
    return res.status(500).json({ error: 'Offerte-verwerking mislukt: ' + e.message });
  }
});

// GET /api/offerte/status?aanbod_id=...  — leest actuele betaalstatus uit Odoo,
// werkt Supabase + Odoo bij naar 'betaald' zodra payment_state = paid.
router.get('/status', async (req, res) => {
  const aanbod_id = req.query.aanbod_id;
  if (!aanbod_id) return res.status(400).json({ error: 'aanbod_id verplicht' });
  if (!sb.supabaseConfigured()) return res.status(503).json({ error: 'Supabase niet geconfigureerd' });
  try {
    const rij = await sb.getOfferteByAanbod(aanbod_id);
    if (!rij) return res.status(404).json({ error: 'offerte niet gevonden' });
    let status = rij.status;
    if (rij.odoo_invoice_id && status !== 'betaald' && odoo.odooConfigured()) {
      const pay = await odoo.getPaymentState(rij.odoo_invoice_id);
      if (pay && (pay.payment_state === 'paid' || pay.payment_state === 'in_payment')) {
        status = 'betaald';
        await odoo.setOfferStatus(rij.odoo_order_id, 'betaald').catch(() => {});
        await sb.updateOfferteByAanbod(aanbod_id, { status: 'betaald' }).catch(() => {});
        brevo.sendTemplate('betaald', rij.klant_email, { aanbod_id }).catch(() => {});
      }
    }
    return res.json({ ok: true, aanbod_id, status, betaallink: rij.betaallink || null });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
