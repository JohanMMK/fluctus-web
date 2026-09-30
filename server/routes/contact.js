// ── Contactformulier → Supabase + Brevo (+ optioneel crm.lead) ───────────────
import express from 'express';
import * as sb from '../lib/supabase.js';
import * as brevo from '../lib/brevo.js';
import * as odoo from '../lib/odoo.js';

const router = express.Router();
const MAAK_LEAD = String(process.env.CONTACT_MAAK_CRM_LEAD || 'false') === 'true';
const FOCUS = ['injectie', 'aansluiting', 'mobiliteit'];
// De contactnotificatie loopt via de proxy (Microsoft Graph, vanuit de dossier-mailbox):
// POST {PROXY}/api/contact-notify → platte mail ZONDER bijlage → geen dossierverwerking.
const PROXY = process.env.FLUCTUS_PROXY_URL || '';

// POST /api/contact  { naam, email, telefoon?, bedrijf?, focus, bericht? }
router.post('/', async (req, res) => {
  const b = req.body || {};
  if (!b.email || !b.naam) return res.status(400).json({ error: 'naam en email verplicht' });
  const focus = FOCUS.includes(b.focus) ? b.focus : null;
  const rij = {
    naam: b.naam, email: b.email, telefoon: b.telefoon || null,
    bedrijf: b.bedrijf || null, focus, bericht: b.bericht || null,
    bron: 'website', aangemaakt_op: new Date().toISOString(),
  };
  try {
    if (sb.supabaseConfigured()) await sb.insertContact(rij).catch(e => console.warn('[contact] sb:', e.message));
    // Notificatie naar de dossier-mailbox via de proxy (Microsoft Graph). Platte mail,
    // GEEN bijlage → de inbound-sweep start er geen dossierverwerking mee. Best-effort.
    if (PROXY) {
      try {
        await fetch(`${PROXY}/api/contact-notify`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ naam: b.naam, email: b.email, telefoon: b.telefoon || '', bedrijf: b.bedrijf || '', focus: focus || '', bericht: b.bericht || '' }),
        });
      } catch (e) { console.warn('[contact] notify:', e.message); }
    }
    if (MAAK_LEAD && odoo.odooConfigured()) {
      await odoo.createLead({
        name: `Website-contact — ${b.naam}${focus ? ' (' + focus + ')' : ''}`,
        email: b.email, phone: b.telefoon, company_name: b.bedrijf,
        description: b.bericht || '',
      }).catch(e => console.warn('[contact] crm.lead:', e.message));
    }
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
