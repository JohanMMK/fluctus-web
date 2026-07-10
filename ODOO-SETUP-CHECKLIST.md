# Odoo-setup-checklist (P1 offerte-automatisering)

Eenmalige configuratie in Odoo vóór de offerte-flow live gaat. De code gaat hier
al van uit; vul daarna de ID's/keys in bij de Railway-omgevingsvariabelen.

## 1. Integratie-gebruiker + API-sleutel (geen admin)
- [ ] Maak een technische gebruiker (bv. `integratie@fluctus.net`) met beperkte rechten: **Verkoop** (order/factuur) + **Contacten**. Géén Administrator.
- [ ] Instellingen → Gebruikers → API-sleutels → nieuwe sleutel aanmaken.
- [ ] Zet in Railway: `ODOO_URL`, `ODOO_DB`, `ODOO_USER`, `ODOO_API_KEY`.

## 2. Twee producten met vaste prijs + btw
- [ ] Product **SolarActive** (type: dienst/service), verkoopprijs = vaste prijs, correcte btw.
- [ ] Product **Ontwerp** (type: dienst/service), verkoopprijs = vaste prijs, correcte btw.
- [ ] Noteer de product-ID's → `ODOO_PRODUCT_ID_SOLARACTIVE`, `ODOO_PRODUCT_ID_ONTWERP`.
  (ID vind je in de URL van het product of via Ontwikkelaarsmodus → "Bekijk metadata".)

## 3. Custom velden op `sale.order` (Studio)
- [ ] `x_ean` — type **Char** — label "EAN". (1 order = 1 EAN.)
- [ ] `x_offer_status` — type **Selection** — waarden exact: `aangeboden`, `in_behandeling`, `betaald`, `vervallen`.

## 4. Payment provider (Mollie met Bancontact)
- [ ] Activeer de **Mollie**-betaalprovider en koppel Bancontact.
- [ ] Zet de provider **gepubliceerd** zodat de factuur-portal-link ("access_url") een betaalknop toont.
- [ ] Test: open een geposte factuur via `/my/invoices/<id>` en controleer dat er een betaalknop is.

## 5. Betaal-terugkoppeling → status "betaald"
Kies één van beide (de code ondersteunt beide):
- [ ] **Aanrader — Odoo automated action:** bij `account.move` waar `payment_state` → `paid`, roep de webhook aan:
  `POST {FLUCTUS_WEB_URL}/api/offerte/webhook` met body `{ "aanbod_id": <client_order_ref>, "secret": <OFFERTE_WEBHOOK_SECRET> }`.
- [ ] **Backup — polling:** de frontend/portal pollt `GET /api/offerte/status?aanbod_id=...` die de betaalstatus uit Odoo leest en bijwerkt.
- [ ] Zet `OFFERTE_WEBHOOK_SECRET` in Railway (en in de Odoo-actie).

## 6. Algemene voorwaarden + opschortende voorwaarde
- [ ] Algemene voorwaarden koppelen aan de order/factuur.
- [ ] **SolarActive:** de opschortende voorwaarde (terugverdientijd < 3 jaar) wordt in de simulator afgedwongen vóór een bindende offerte; de backend weigert een SolarActive-aanvaarding zonder `tvt_jaar < 3`.

## 7. (optioneel) crm.lead voor contactformulier
- [ ] Zet `CONTACT_MAAK_CRM_LEAD=true` als je website-contacten als `crm.lead` in Odoo wil.

> Statusmodel: `aangeboden` → `in_behandeling` (factuur aangemaakt/verstuurd) → `betaald` (payment_state=paid) → uitvoering start. `vervallen` bij verlopen betaallink. Idempotent op `client_order_ref` (= aanbod-ID).
