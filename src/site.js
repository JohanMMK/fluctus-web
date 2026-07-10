// ── Gedeeld site-script (publieke pagina's) ──────────────────────────────────
// 1) Injecteert een "Mijn Fluctus"-link in de navigatie (portaal achter login).
// 2) Koppelt het contactformulier aan /api/contact (Supabase + Brevo + evt. lead).

(function injectPortalLink() {
  const ul = document.querySelector('header nav ul');
  if (!ul || ul.querySelector('.portal-link')) return;
  const li = document.createElement('li');
  li.innerHTML = '<a class="portal-link" href="/portal.html">Mijn Fluctus</a>';
  // Vóór de Contact-knop plaatsen indien aanwezig, anders achteraan.
  const contactLi = Array.from(ul.querySelectorAll('li')).find(li => li.querySelector('a.btn'));
  if (contactLi) ul.insertBefore(li, contactLi); else ul.appendChild(li);
})();

(function wireContact() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const $ = (id) => document.getElementById(id);
  $('c-verstuur').addEventListener('click', async () => {
    const msg = $('c-msg');
    const naam = $('c-naam').value.trim();
    const email = $('c-email').value.trim();
    if (!naam || !email) { msg.textContent = 'Naam en e-mail zijn verplicht.'; return; }
    const focusEl = document.querySelector('input[name="focus"]:checked');
    const body = {
      naam, email,
      bedrijf: $('c-bedrijf').value.trim(),
      telefoon: $('c-tel').value.trim(),
      focus: focusEl ? focusEl.value : null,
      bericht: $('c-bericht').value.trim(),
    };
    msg.textContent = 'Versturen…';
    try {
      const r = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      msg.textContent = r.ok
        ? 'Bedankt! We nemen zo snel mogelijk contact op.'
        : 'Er ging iets mis — probeer opnieuw of mail admin@fluctus.net.';
      if (r.ok) form.reset();
    } catch (e) { msg.textContent = 'Netwerkfout — probeer later opnieuw.'; }
  });
})();
