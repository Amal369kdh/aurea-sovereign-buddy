---
name: bons-plans-section
description: Section "Bons Plans" extensible (Courses V1, Transports/Sorties/Logement à venir) remplaçant l'ancien ComparateurCourses
type: feature
---
Le widget Dashboard "Comparateur Courses" a été remplacé par une section "Bons Plans 🔥" plus chaleureuse et extensible.

Architecture :
- `src/components/bons-plans/BonsPlansSection.tsx` : wrapper avec tabs catégories (courses ✅, transports/sorties/logement verrouillés "bientôt")
- `src/components/bons-plans/BonsPlansCourses.tsx` : ex-ComparateurCourses, ton Gen Z ("Le panier malin", "le bon plan du moment", "Les meilleurs spots à X · sans te ruiner")

Ton éditorial : 70% clair / 30% Gen Z. Plus jamais "Comparateur" — toujours "Bons Plans".

Pour ajouter une catégorie : créer `BonsPlansX.tsx` dans le dossier, l'importer dans `BonsPlansSection.tsx`, passer `available: true` dans CATEGORIES.
