// ── Betaal-webhook (Odoo/Mollie → "betaald") ─────────────────────────────────
// Betaling gebeurt via de Odoo-factuurlink. Bij binnenkomende betaling triggert
// een Odoo automated action (of Mollie) dit endpoint met een gedeelde secret,
// zodat de order "betaald / gestart" wordt en de referenties terug naar Supabase
// gaan. Als backup pollt de frontend /api/offerte/status.

import express from 'express';
import * as odoo from '../lib/odoo.js';
import * as sb from '../lib/supabase.js';
import * as brevo from '../lib/brevo.js';

const router = express.Router();
const SECRET = process.env.OFFERTE_WEBHOOK_SECRET || '';

// POST /api/offerte/webhook  { aanbod_id, secret }
router.post('/webhook', async (req, res) => {
  const b = req.body || {};
  if (!SECRET || b.secret !== SECRET) return res.status(401).json({ error: 'ongeldige secret' });
  const aanbod_id = b.aanbod_id || b.client_order_ref;
  if (!aanbod_id) return res.status(400).json({ error: 'aanbod_id verplicht' });
  try {
    let klantEmail = b.klant_email || null;
    let orderId = null;
    if (sb.supabaseConfigured()) {
      const rij = await sb.getOfferteByAanbod(aanbod_id);
      if (rij) { klantEmail = klantEmail || rij.klant_email; orderId = rij.odoo_order_id; }
      await sb.updateOfferteByAanbod(aanbod_id, { status: 'betaald' }).catch(() => {});
    }
    if (orderId && odoo.odooConfigured()) {
      await odoo.setOfferStatus(orderId, 'betaald').catch(() => {});
    }
    if (klantEmail) brevo.sendTemplate('betaald', klantEmail, { aanbod_id }).catch(() => {});
    return res.json({ ok: true, aanbod_id, status: 'betaald' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
