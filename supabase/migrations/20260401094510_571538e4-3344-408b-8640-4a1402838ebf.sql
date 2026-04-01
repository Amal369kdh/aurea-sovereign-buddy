
-- Insert Marseille city resources cache
INSERT INTO public.city_resources_cache (city, data, last_updated_at)
VALUES ('marseille', '{
  "city": "Marseille",
  "crous": {
    "name": "CROUS Aix-Marseille Avignon",
    "address": "31 avenue Jules Ferry, 13621 Aix-en-Provence",
    "phone": "04 42 16 13 13",
    "url": "https://www.crous-aix-marseille.fr",
    "resto_u": [
      {"name": "RU Canebière", "address": "96 La Canebière, 13001 Marseille", "url": "https://www.crous-aix-marseille.fr/restauration/"},
      {"name": "RU Saint-Charles", "address": "Campus Saint-Charles, 13003 Marseille", "url": "https://www.crous-aix-marseille.fr/restauration/"},
      {"name": "RU Luminy", "address": "Campus de Luminy, 13009 Marseille", "url": "https://www.crous-aix-marseille.fr/restauration/"}
    ]
  },
  "transport": {
    "network_name": "RTM",
    "student_subscription": "Abo Jeune -26 ans ~33€/mois • Métro, tramway, bus",
    "url": "https://www.rtm.fr"
  },
  "health": {
    "university_health_center": {"name": "Service de Santé Étudiant AMU", "address": "Campus Saint-Charles, 13003 Marseille", "phone": "04 91 10 60 60"},
    "emergency": "SAMU 15 / Hôpital de la Timone — 264 rue Saint-Pierre, 13385 Marseille",
    "sos_medecins": {"phone": "04 91 52 91 52", "url": "https://www.sosmedecins-marseille.com"},
    "nightline": "Nightline Aix-Marseille — écoute étudiante le soir"
  },
  "prefecture": {
    "name": "Préfecture des Bouches-du-Rhône",
    "address": "Place Félix Baret, 13282 Marseille",
    "rdv_url": "https://www.bouches-du-rhone.gouv.fr",
    "phone": "04 84 35 40 00"
  },
  "caf": {
    "address": "21 allée Léon Gambetta, 13001 Marseille",
    "phone": "32 30",
    "url": "https://www.caf.fr"
  },
  "banques": {
    "liste": [
      {"name": "Hello Bank", "link": "https://www.hellobank.fr", "student_offer": "Compte gratuit étudiant"},
      {"name": "BNP Paribas", "link": "https://mabanque.bnpparibas.com", "student_offer": "Esprit Libre Étudiant"},
      {"name": "Boursorama", "link": "https://www.boursobank.com", "student_offer": "Bienvenue Étudiant"},
      {"name": "Revolut", "link": "https://www.revolut.com/fr", "student_offer": "Compte multi-devises gratuit"},
      {"name": "N26", "link": "https://n26.com/fr-fr", "student_offer": "Compte mobile sans frais"}
    ],
    "conseil": "Marseille a de nombreuses agences bancaires dans le centre-ville et près des campus. Privilégie les banques en ligne si tu veux éviter les frais et ouvrir rapidement."
  },
  "logement": {
    "residences_crous": [
      {"name": "Cité U Galinat", "address": "2 rue du Maréchal Joffre, 13003 Marseille", "url": "https://www.crous-aix-marseille.fr/logement/"},
      {"name": "Résidence Saint-Charles", "address": "Campus Saint-Charles, 13003 Marseille", "url": "https://www.crous-aix-marseille.fr/logement/"},
      {"name": "Résidence Luminy", "address": "Campus de Luminy, 13009 Marseille", "url": "https://www.crous-aix-marseille.fr/logement/"}
    ],
    "autres": ["Lokaviz", "OTLE Aix-Marseille-Provence (cartographie logement)", "Cohabilis (intergénérationnel)"]
  },
  "useful_tips": [
    "Marseille offre des repas gratuits aux étudiants dans plusieurs restaurants universitaires en partenariat avec le CROUS — notamment au RU Canebière les mardis soirs d octobre à décembre.",
    "Un dispositif d hébergement d urgence existe pour les étudiants sans logement, sans loyer et avec suivi social personnalisé.",
    "La Maison de l Étudiant au 96 La Canebière est un lieu central pour l information, le travail, les événements et l accompagnement.",
    "L application Le Dégaine recense toutes les aides sociales et financières accessibles aux étudiants à Marseille.",
    "Le Conseil marseillais de la vie étudiante permet de participer aux politiques publiques liées à la vie étudiante — un bon moyen de s impliquer."
  ]
}'::jsonb, now())
ON CONFLICT (city) DO UPDATE SET data = EXCLUDED.data, last_updated_at = now();

-- Activate Marseille feature flag
INSERT INTO public.feature_flags (key, label, description, enabled)
VALUES ('city_active_marseille', 'Ville active : Marseille', 'Active les ressources locales pour Marseille', true)
ON CONFLICT (key) DO UPDATE SET enabled = true, updated_at = now();
