/* fr-ec-dict.js — Energie-Compas NL→FR woordenboek (v0.1.0, 2026-10-04)
   Geladen VÓÓR i18n-ec.js. EXACT = volledig segment; DICT = substring; RULES = regex (dynamische zinnen). */
(function () {
  // ── EXACT: korte labels/titels (matchen enkel als het hele segment gelijk is) ───────────────
  window.EC_FR_EXACT = {
    // Sectietitels
    'Aansluiting': 'Raccordement',
    'Voorgestelde verbetering': 'Amélioration proposée',
    'Factuurvergelijking in detail': 'Comparaison détaillée de la facture',
    'Zo is de besparing opgebouwd': 'Composition de l’économie',
    'Van installatie naar volledige waarde': 'De l’installation à la valeur totale',
    'Overzicht van de investeringen': 'Aperçu des investissements',
    'Jaar per jaar': 'Année par année',
    'Vraag dit aan uw leverancier': 'À demander à votre fournisseur',
    'Dekking van uw dagelijkse ritten': 'Couverture de vos trajets quotidiens',
    'Uw energie, onder uw controle': 'Votre énergie, sous votre contrôle',
    // Tabelkoppen
    'Post': 'Poste',
    'Situatie': 'Situation',
    'Onderdeel': 'Élément',
    'Specificatie': 'Spécification',
    'Technische specificatie': 'Spécification technique',
    'Verschil': 'Différence',
    'Besparing': 'Économie',
    'Cumulatief': 'Cumulé',
    'Dekking': 'Couverture',
    'Geladen km/jaar': 'km chargés/an',
    'Gevraagde km/jaar': 'km demandés/an',
    'Jaar': 'Année',
    'Volume op het net (per jaar)': 'Volume sur le réseau (par an)',
    // Aansluiting-labels
    'Verbruiksadres': 'Adresse de consommation',
    'Aansluittype': 'Type de raccordement',
    'EAN afname': 'EAN prélèvement',
    'EAN injectie': 'EAN injection',
    'Metertype': 'Type de compteur',
    'Databron': 'Source des données',
    // Identificatie
    'Klant': 'Client',
    'BTW': 'TVA',
    'Datum': 'Date',
    // Kolomkoppen factuurvergelijking (gestapeld via <br>)
    'Vandaag + laden': 'Aujourd’hui + recharge',
    'Vandaag': 'Aujourd’hui',
    '(zonder installatie)': '(sans installation)',
    'Met uw installatie': 'Avec votre installation',
    'U bespaart': 'Vous économisez',
    // Knoppen
    'Print': 'Imprimer',
    'PDF opslaan': 'Enregistrer le PDF',
    'Mail mij dit rapport': 'Recevoir ce rapport par e-mail',
    'Toon rapport': 'Afficher le rapport',
    // QC-kop
    'Kwaliteitscontrole van deze studie.': 'Contrôle qualité de cette étude.',
    // Toegangsvermogen / piekvermogen (v0.15.9)
    'Toegangsvermogen / piekvermogen': 'Puissance de raccordement / puissance de pointe',
    'Bestaande aansluiting': 'Raccordement existant',
    'Nodig · onbeheerst laden': 'Nécessaire · recharge non pilotée',
    'Met installatie': 'Avec installation',
    'Om de dagelijkse km’s te laden moet uw aansluiting de piek aankunnen. Onbeheerst laden — alle voertuigen samen op vol vermogen — zou de aansluiting fors doen stijgen. De installatie vlakt die piek af.':
      'Pour recharger les km quotidiens, votre raccordement doit encaisser la pointe. Une recharge non pilotée — tous les véhicules à pleine puissance en même temps — ferait fortement grimper le raccordement. L’installation lisse cette pointe.'
  };

  // ── DICT: zinnen/fragmenten (substring binnen een tekstsegment) ─────────────────────────────
  window.EC_FR_DICT = {
    // Cover
    'Uw energiefactuur van morgen, vandaag berekend': 'Votre facture d’énergie de demain, calculée aujourd’hui',
    'Onafhankelijke energie-analyse': 'Analyse énergétique indépendante',
    'per jaar': 'par an',
    'U bespaart': 'Vous économisez',
    'zonder installatie': 'sans installation',
    // Aansluiting
    'Digitale meter (kwartierregistratie)': 'Compteur numérique (enregistrement au quart d’heure)',
    'Standaardprofiel (SLP)': 'Profil standard (SLP)',
    'Gemeten kwartierdata (Fluvius)': 'Données mesurées au quart d’heure (Fluvius)',
    'niet geregistreerd': 'non enregistré',
    'piek': 'pointe',
    // Investering / specs
    'PV-systeem': 'Système PV',
    'Batterij': 'Batterie',
    'cycli/jaar': 'cycles/an',
    // QC-strook
    'Onze aanpak': 'Notre approche',
    'kwaliteitsborging': 'assurance qualité',
    'Aandachtspunten:': 'Points d’attention :',
    'Databron:': 'Source des données :',
    'standaardprofiel (SLP)': 'profil standard (SLP)',
    'gemeten kwartierdata (Fluvius)': 'données mesurées au quart d’heure (Fluvius)',
    'haal de Fluvius-kwartierdata op voor een bedrijfsspecifieke raming':
      'récupérez les données Fluvius au quart d’heure pour une estimation propre à l’entreprise',
    'KPI-betrouwbaarheid': 'Fiabilité des KPI',
    'coherentie': 'cohérence',
    'checks': 'contrôles',
    // Aanpak-statement (volledige zinnen, geen markup)
    'Deze studie geeft u een integraal beeld van de opportuniteiten om, vertrekkend van uw eigen verbruik en vermogen, een beter pad uit te stippelen naar een optimale elektrificatie.':
      'Cette étude vous donne une vue intégrale des opportunités pour, en partant de votre propre consommation et puissance, tracer une meilleure voie vers une électrification optimale.',
    'We combineren hiervoor ervaring, kennis en AI om massale hoeveelheden data te verwerken tot bruikbaar inzicht.':
      'Pour cela, nous combinons expérience, savoir-faire et IA afin de transformer d’immenses volumes de données en informations exploitables.',
    'We stellen daarbij steeds het belang van de verbruiker voorop, maar zijn ons ook bewust van de beperkingen die horen bij het schetsen van de toekomst op basis van het verleden.':
      'Nous plaçons toujours l’intérêt du consommateur au premier plan, tout en restant conscients des limites inhérentes à toute projection de l’avenir sur la base du passé.',
    'Daarom leggen we onszelf de strengste interne kwaliteitsnormen op — en maken we dit werk voortdurend sterker en beter.':
      'C’est pourquoi nous nous imposons les normes de qualité internes les plus strictes — et améliorons ce travail en continu.',
    // Slot-statement
    'Tot slot zijn we dankbaar dat we deel mogen uitmaken van': 'Enfin, nous sommes reconnaissants de pouvoir prendre part à',
    'uw verkenning': 'votre exploration',
    'Elke verbruiker die met het Energie-Compas op pad gaat, brengt ons samen een stap verder op weg naar méér en betere elektrificatie.':
      'Chaque consommateur qui se met en route avec l’Energie-Compas nous fait, ensemble, avancer d’un pas vers une électrification plus large et meilleure.',
    'Bescheiden in wat het verleden ons kan leren, maar vastberaden in de richting die we kiezen':
      'Humbles quant à ce que le passé peut nous apprendre, mais déterminés dans la direction que nous choisissons',
    'zo blijven we dat pad, samen met u, verder openleggen.':
      'nous continuons ainsi à ouvrir cette voie, avec vous.',
    // Disclaimer
    'afgeleid uit het verleden': 'déduite du passé',
    'Het verleden is echter geen voorspelling van de toekomst': 'Le passé n’est toutefois pas une prédiction de l’avenir',
    'Aan dit rapport, noch aan het gebruik ervan, kunnen rechten of aanspraken worden ontleend.':
      'Aucun droit ni aucune prétention ne peut être tiré de ce rapport ni de son utilisation.',
    'Het betreft een indicatieve raming en geen persoonlijk financieel, fiscaal of juridisch advies.':
      'Il s’agit d’une estimation indicative et non d’un conseil financier, fiscal ou juridique personnalisé.',
    'Bedragen zijn indicatief en, tenzij anders vermeld, exclusief btw.':
      'Les montants sont indicatifs et, sauf mention contraire, hors TVA.',
    'Indicatieve analyse': 'Analyse indicative',
    'geen persoonlijk financieel advies': 'aucun conseil financier personnalisé',
    'alle rechten voorbehouden': 'tous droits réservés',
    'gegevens blijven eigendom van de klant': 'les données restent la propriété du client',
    // Veelgebruikte termen
    'Bedragen exclusief btw, op jaarbasis': 'Montants hors TVA, sur une base annuelle',
    'Bedragen indicatief, exclusief btw': 'Montants indicatifs, hors TVA',

    // Kolomkoppen / hero (segment bevat meer dan enkel het label)
    'Vandaag + laden': 'Aujourd’hui + recharge',
    'Vandaag': 'Aujourd’hui',

    // Dynamische component-omschrijvingen (langste eerst door de runtime-sortering)
    'zonnepanelen én een batterij': 'des panneaux solaires et une batterie',
    'zonnepanelen + batterij': 'panneaux solaires + batterie',
    'zonnepanelen': 'panneaux solaires',
    'een batterij': 'une batterie',
    'slim laden': 'recharge intelligente',
    'mét ': 'avec ',

    // P2 — titel + lead (fragmenten tussen de <b>-tags)
    'Uw energiefactuur: met versus zonder ': 'Votre facture d’énergie : avec contre sans ',
    'Deze analyse toont wat ': 'Cette analyse montre ce que ',
    ' u oplevert op een ': ' vous rapporte avec un ',
    'optimaal dynamisch (spot) contract': 'contrat dynamique (spot) optimal',
    'uw jaarfactuur ': 'votre facture annuelle ',
    'zónder installatie': 'sans installation',
    ' — met het laden aan uw gebouw en de aansluiting die daarvoor nodig is': ' — recharge comprise à votre bâtiment et le raccordement nécessaire',
    ', slim aangestuurd op de energiemarkt. Alle cijfers komen uit een simulatie op kwartierbasis over een volledig jaar. ':
      ', pilotés intelligemment sur le marché de l’énergie. Tous les chiffres proviennent d’une simulation au quart d’heure sur une année complète. ',
    'De overstap van uw huidige contract naar een dynamisch contract behandelen we apart in de onderhandelingsnota (bijlage).':
      'Le passage de votre contrat actuel à un contrat dynamique est traité séparément dans la note de négociation (annexe).',

    // Hero-bijschrift (cover + p2)
    'Deze besparing is wat ': 'Cette économie est ce que ',
    ' oplevert op een ': ' rapporte avec un ',
    ', becijferd op kwartierbasis over een volledig jaar.': ', calculé au quart d’heure sur une année complète.',
    'De overstap van uw huidige contract naar zo\'n dynamisch contract wordt apart behandeld in de onderhandelingsnota (bijlage).':
      'Le passage de votre contrat actuel vers un tel contrat dynamique est traité séparément dans la note de négociation (annexe).',
    // CN_PROSE-varianten (volledige zinsdelen → juiste FR-grammatica; langste eerst)
    'zonnepanelen, een batterij en slim laden': 'des panneaux solaires, une batterie et la recharge intelligente',
    ' en slim laden': ' et la recharge intelligente',

    // Cover-subtitel staart
    'becijferd op kwartierbasis over een volledig jaar': 'calculé au quart d’heure sur une année complète',

    // Knoppen (segment bevat een icoon → substring i.p.v. exact)
    'PDF opslaan': 'Enregistrer le PDF',
    'Mail mij dit rapport': 'Recevoir ce rapport par e-mail',
    'Toon rapport': 'Afficher le rapport',
    'Print': 'Imprimer',
    // Toegangsvermogen / piekvermogen — noot-fragmenten (v0.15.9)
    ' — zo laadt u 100% van de jaar-km’s zonder de aansluiting te verzwaren': ' — vous rechargez ainsi 100 % des km annuels sans renforcer le raccordement',
    ', wat een eenmalige verzwaring van ± ': ', ce qui évite un renforcement unique de ± ',
    ' kVA, binnen uw bestaande aansluiting van ': ' kVA, dans les limites de votre raccordement existant de ',
    ' kVA bij onbeheerst laden': ' kVA en recharge non pilotée',
    'De netpiek blijft op ± ': 'La pointe réseau reste à ± ',
    ' kVA, tegenover ': ' kVA, contre ',
    ' vermijdt.': '.',
    'geen verzwaring': 'pas de renforcement',
    'LS→MS': 'BT→MT',
    'Print': 'Imprimer'
  };

  // ── RULES: dynamische zinnen met markup/getallen (regex over de volle HTML) ──────────────────
  window.EC_FR_RULES = [
    // Cover-subtitel "Wat <components> voor u betekent/betekenen — ..." → scaffold NL→FR,
    //   de <components> ($1) worden daarna door de DICT-segmentpass vertaald (zonnepanelen enz.).
    { re: /Wat (.+?) voor u betekenen/g, fr: 'Ce que $1 représentent pour vous' },
    { re: /Wat (.+?) voor u betekent/g, fr: 'Ce que $1 représente pour vous' },
    { re: /becijferd op kwartierbasis over\s*<br>\s*een volledig jaar/gi,
      fr: 'calculé au quart d’heure sur<br>une année complète' },
    { re: /Alles op kwartierbasis over een volledig jaar\./g,
      fr: 'Le tout au quart d’heure sur une année complète.' }
  ];
})();
