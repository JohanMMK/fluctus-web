// ── Brevo transactionele mail ────────────────────────────────────────────────
// Drie triggers (spec §8): aanvaarding-bevestiging, onbetaald-herinnering, betaald.
// Best-effort: faalt nooit hard (mail-fout mag de offerte-flow niet blokkeren).

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const SENDER = {
  email: process.env.BREVO_SENDER_EMAIL || 'admin@fluctus.net',
  name: process.env.BREVO_SENDER_NAAM || 'Fluctus',
};
const TEMPLATES = {
  aanvaarding: Number(process.env.BREVO_TEMPLATE_AANVAARDING || 0),
  herinnering: Number(process.env.BREVO_TEMPLATE_HERINNERING || 0),
  betaald: Number(process.env.BREVO_TEMPLATE_BETAALD || 0),
};

function brevoConfigured() { return !!BREVO_API_KEY; }

async function sendTemplate(trigger, toEmail, params = {}) {
  try {
    if (!brevoConfigured()) return { ok: false, reden: 'brevo-niet-geconfigureerd' };
    const templateId = TEMPLATES[trigger];
    if (!templateId) return { ok: false, reden: `geen template voor '${trigger}'` };
    if (!toEmail) return { ok: false, reden: 'geen ontvanger' };
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json', 'accept': 'application/json' },
      body: JSON.stringify({ sender: SENDER, to: [{ email: toEmail }], templateId, params }),
    });
    if (!r.ok) return { ok: false, reden: `HTTP ${r.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, reden: e.message };
  }
}

export { brevoConfigured, sendTemplate };
