import { Crown } from "lucide-react";
import { Link } from "react-router-dom";

const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="mb-12">
    <h2 className="text-xl font-extrabold text-foreground mb-4 pb-2 border-b border-border">
      {title}
    </h2>
    <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
      {children}
    </div>
  </section>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p>{children}</p>
);

const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-sm font-semibold text-foreground mt-5 mb-2">{children}</h3>
);

const Legal = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center gap-3">
        <Link to="/auth" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl gold-gradient">
            <Crown className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-extrabold text-lg">
            <span className="gold-text">Aurea</span>{" "}
            <span className="text-foreground">Student</span>
          </span>
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Nav rapide */}
        <nav className="mb-10 flex flex-wrap gap-3 text-xs">
          {[
            { href: "#mentions", label: "Mentions légales" },
            { href: "#cgu", label: "CGU" },
            { href: "#rgpd", label: "Confidentialité & RGPD" },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="rounded-full border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>

        <h1 className="text-3xl font-extrabold mb-2">
          <span className="gold-text">Informations</span> légales
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Dernière mise à jour : mars 2026
        </p>

        {/* ── MENTIONS LÉGALES ── */}
        <Section id="mentions" title="Mentions légales">
          <H3>Éditeur</H3>
          <P>
            Aurea Student est une application développée à titre personnel par un particulier,
            dans le cadre d'un projet étudiant indépendant. L'application n'est pas éditée par une personne morale enregistrée au Registre du Commerce et des Sociétés au moment de cette publication.
          </P>
          <P>
            Contact : <a href="mailto:contactaureastudent@gmail.com" className="text-primary hover:underline">contactaureastudent@gmail.com</a>
          </P>

          <H3>Hébergement</H3>
          <P>
            L'application est hébergée par <strong className="text-foreground">Lovable Technology AB</strong> (Stockholm, Suède)
            et s'appuie sur <strong className="text-foreground">Lovable Cloud</strong> pour la base de données, l'authentification et les fonctions serveur.
            Les données sont stockées sur des serveurs situés dans l'Union européenne.
          </P>

          <H3>Directeur de la publication</H3>
          <P>Le porteur du projet Aurea Student est joignable à l'adresse email mentionnée ci-dessus.</P>

          <H3>Propriété intellectuelle</H3>
          <P>
            L'ensemble des contenus présents sur Aurea Student (textes, graphismes, logotypes, images) sont protégés par le droit de la propriété intellectuelle. Toute reproduction, distribution ou modification sans autorisation préalable est interdite.
          </P>
        </Section>

        {/* ── CGU ── */}
        <Section id="cgu" title="Conditions Générales d'Utilisation">
          <H3>1. Objet</H3>
          <P>
            Aurea Student est une application communautaire destinée aux étudiants souhaitant s'installer ou s'intégrer en France. Elle propose : un tableau de bord personnel (Mon Dashboard), un suivi administratif (Mon Dossier), un Hub Social (annonces, commentaires, système d'entraide), une messagerie privée, un espace de rencontres étudiantes (Dating), un assistant IA (Amal), un accès à des ressources locales par ville, et un espace partenaires.
          </P>

          <H3>2. Accès et inscription</H3>
          <P>
            L'accès à l'application est réservé aux personnes âgées d'au moins 16 ans. L'inscription nécessite une adresse email valide et une confirmation par lien email. Certaines fonctionnalités (Hub Social, Rencontres, messagerie privée, ressources) sont réservées aux utilisateurs de statut « Témoin », c'est-à-dire ayant vérifié leur statut étudiant via un email universitaire académique reconnu (domaine .edu, .univ-*.fr, .uga.fr, etc.).
          </P>

          <H3>3. Niveaux d'accès</H3>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong className="text-foreground">Explorateur</strong> : accès en lecture au tableau de bord, Mon Dossier et ressources partenaires</li>
            <li><strong className="text-foreground">Témoin</strong> : accès complet à toutes les fonctionnalités après vérification de l'email universitaire</li>
            <li><strong className="text-foreground">Admin</strong> : accès total incluant la modération et la gestion de la plateforme</li>
          </ul>

          <H3>4. Compte utilisateur</H3>
          <P>
            L'utilisateur est responsable de la confidentialité de ses identifiants. Tout accès frauduleux doit être signalé immédiatement à <a href="mailto:contactaureastudent@gmail.com" className="text-primary hover:underline">contactaureastudent@gmail.com</a>. Aurea Student se réserve le droit de suspendre ou supprimer tout compte en cas de comportement contraire aux présentes CGU.
          </P>
          <P>
            Le pseudo (nom d'affichage) choisi à l'inscription est définitif et ne peut pas être modifié ultérieurement.
          </P>

          <H3>5. Comportement sur la plateforme</H3>
          <P>Il est formellement interdit de :</P>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Publier des contenus haineux, discriminatoires, obscènes ou illicites</li>
            <li>Harceler, menacer ou usurper l'identité d'un autre utilisateur</li>
            <li>Diffuser des informations personnelles d'un tiers sans son consentement</li>
            <li>Utiliser l'application à des fins commerciales non autorisées</li>
            <li>Tenter de contourner les mesures de sécurité de la plateforme</li>
            <li>Créer des comptes fictifs ou utiliser de faux emails universitaires</li>
            <li>Automatiser les interactions (scripts, bots) sans autorisation</li>
          </ul>
          <P>
            Les contenus sont modérés via un système de signalement communautaire. Tout contenu signalé est examiné et peut être supprimé sans préavis.
          </P>

          <H3>6. Système de points et gamification</H3>
          <P>
            Aurea Student attribue des points d'intégration et des points sociaux pour encourager la participation. Ces points n'ont aucune valeur monétaire et ne sont pas échangeables. Aurea se réserve le droit de modifier ou de supprimer le système de points à tout moment.
          </P>

          <H3>7. Assistant IA (Amal)</H3>
          <P>
            L'assistant Amal fournit des informations à titre indicatif uniquement. Ses réponses ne constituent pas un conseil juridique, médical, financier ou administratif. L'utilisateur est seul responsable des décisions prises sur la base de ces informations. L'accès à Amal est limité à un quota de messages par jour pour les utilisateurs non-premium. Ce quota est réinitialisé quotidiennement.
          </P>

          <H3>8. Rencontres étudiantes</H3>
          <P>
            La fonctionnalité de rencontres est exclusivement réservée aux étudiants vérifiés (statut Témoin). Elle est destinée à favoriser les connexions amicales et romantiques entre étudiants. Aurea Student ne garantit pas la véracité des informations fournies par les utilisateurs dans leurs profils de rencontre. Tout comportement abusif peut entraîner une suspension immédiate.
          </P>

          <H3>9. Messagerie privée</H3>
          <P>
            Les messages privés sont soumis à une durée de conservation de 30 jours. Au-delà, ils sont automatiquement supprimés. La messagerie privée est réservée aux utilisateurs vérifiés.
          </P>

          <H3>10. Disponibilité</H3>
          <P>
            Aurea Student est fourni « en l'état ». L'équipe s'efforce d'assurer la continuité du service mais ne peut garantir l'absence d'interruption. L'application peut être modifiée, suspendue ou arrêtée à tout moment sans préavis.
          </P>

          <H3>11. Modification des CGU</H3>
          <P>
            Ces CGU peuvent être mises à jour à tout moment. Les utilisateurs seront informés des modifications importantes. La poursuite de l'utilisation de l'application vaut acceptation des nouvelles conditions.
          </P>

          <H3>12. Droit applicable</H3>
          <P>
            Les présentes CGU sont régies par le droit français. En cas de litige, et à défaut de résolution amiable, les tribunaux français seront compétents.
          </P>
        </Section>

        {/* ── RGPD ── */}
        <Section id="rgpd" title="Politique de Confidentialité & RGPD">
          <P>
            Aurea Student s'engage à protéger les données personnelles de ses utilisateurs conformément au Règlement Général sur la Protection des Données (RGPD – UE 2016/679) et à la loi Informatique et Libertés modifiée.
          </P>

          <H3>1. Responsable du traitement</H3>
          <P>
            Le responsable du traitement des données est le porteur du projet Aurea Student, joignable à <a href="mailto:contactaureastudent@gmail.com" className="text-primary hover:underline">contactaureastudent@gmail.com</a>.
          </P>

          <H3>2. Données collectées</H3>
          <P>Nous collectons les données suivantes :</P>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong className="text-foreground">Données d'identification</strong> : adresse email, prénom ou pseudo, initiales d'avatar</li>
            <li><strong className="text-foreground">Données de profil</strong> : nationalité, date de naissance (optionnelle), ville, université, faculté, type de formation, diplôme visé, situation de logement, statut mutuelle, type de visa, budget et revenus mensuels, objectifs personnels</li>
            <li><strong className="text-foreground">Données de vérification étudiante</strong> : email universitaire (haché en SHA-256, non stocké en clair après usage), statut de vérification</li>
            <li><strong className="text-foreground">Contenus générés</strong> : annonces, commentaires, messages privés (30j), messages dating, conversations d'entraide</li>
            <li><strong className="text-foreground">Données de progression</strong> : checklist administratif, tâches, points sociaux, quota IA</li>
            <li><strong className="text-foreground">Données de navigation</strong> : notifications lues/non lues, interactions partenaires (anonymisées), logs techniques</li>
            <li><strong className="text-foreground">Profil de rencontres (optionnel)</strong> : bio, intentions de rencontre, préférences d'âge, genre affiché — uniquement si l'utilisateur active cette fonctionnalité</li>
          </ul>
          <P>
            <strong className="text-foreground">Données explicitement non collectées :</strong> Numéro de Sécurité Sociale, numéro CAF, numéro de carte bancaire, pièce d'identité, mots de passe (stockés en hash).
          </P>

          <H3>3. Finalités et bases légales</H3>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Fourniture du service d'accompagnement étudiant (base légale : exécution du contrat)</li>
            <li>Vérification du statut étudiant pour sécuriser la communauté (base légale : consentement explicite)</li>
            <li>Personnalisation de l'assistant IA Amal avec un contexte de profil anonymisé (base légale : consentement)</li>
            <li>Envoi de notifications et d'emails transactionnels (base légale : intérêt légitime / consentement)</li>
            <li>Amélioration de la plateforme et détection des abus (base légale : intérêt légitime)</li>
            <li>Respect des obligations légales (base légale : obligation légale)</li>
          </ul>

          <H3>4. Durée de conservation</H3>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Données de compte : durée de vie du compte + 30 jours après suppression</li>
            <li>Messages privés : 30 jours (suppression automatique)</li>
            <li>Tokens de vérification : usage unique, invalidés immédiatement après confirmation</li>
            <li>Logs techniques : 90 jours maximum</li>
            <li>Emails transactionnels (logs) : 6 mois</li>
          </ul>

          <H3>5. Destinataires des données</H3>
          <P>Les données ne sont jamais vendues à des tiers. Elles peuvent être partagées avec :</P>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong className="text-foreground">Lovable Cloud (Supabase)</strong> : hébergement de la base de données sur serveurs Union Européenne</li>
            <li><strong className="text-foreground">Resend</strong> : envoi d'emails transactionnels (confirmation, vérification, réinitialisation)</li>
            <li><strong className="text-foreground">Perplexity AI</strong> : traitement de requêtes pour les ressources locales par ville (données anonymisées, non liées à un utilisateur identifié)</li>
            <li><strong className="text-foreground">Lovable AI Gateway</strong> : traitement des requêtes conversationnelles pour l'assistant Amal. Seul un contexte de profil anonymisé est transmis (ville, budget, objectifs, nationalité, progression) — aucun identifiant direct (email, user_id) n'est envoyé. Les données ne sont pas stockées par le service.</li>
          </ul>

          <H3>6. Notifications navigateur</H3>
          <P>
            Aurea Student peut proposer des notifications push via le navigateur (technologie Web Push / PWA) pour signaler de nouveaux messages, matchs ou commentaires. Ces notifications sont soumises à votre consentement explicite via la demande de permission du navigateur. Vous pouvez révoquer cette autorisation à tout moment dans les paramètres de votre navigateur.
          </P>

          <H3>7. Vos droits</H3>
          <P>Conformément au RGPD, vous disposez des droits suivants :</P>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong className="text-foreground">Accès</strong> : obtenir une copie de vos données personnelles</li>
            <li><strong className="text-foreground">Rectification</strong> : corriger des données inexactes depuis votre profil</li>
            <li><strong className="text-foreground">Effacement</strong> : supprimer votre compte et toutes vos données via le bouton "Supprimer mon compte" dans les paramètres</li>
            <li><strong className="text-foreground">Portabilité</strong> : recevoir vos données dans un format structuré sur demande</li>
            <li><strong className="text-foreground">Opposition</strong> : vous opposer à certains traitements (ex. : personnalisation IA)</li>
            <li><strong className="text-foreground">Limitation</strong> : limiter le traitement de vos données</li>
          </ul>
          <P>
            Pour exercer ces droits, contactez-nous à <a href="mailto:contact@aurea-student.fr" className="text-primary hover:underline">contact@aurea-student.fr</a>. Nous répondrons dans un délai maximum d'un mois. Vous pouvez également introduire une réclamation auprès de la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">CNIL</a>.
          </P>

          <H3>8. Cookies et traceurs</H3>
          <P>
            Aurea Student utilise uniquement des cookies techniques strictement nécessaires au fonctionnement de l'authentification (session JWT) et de la persistance de la session utilisateur (localStorage). Aucun cookie publicitaire, aucun tracker tiers (Analytics, Google, Facebook pixel) n'est utilisé sur la plateforme.
          </P>

          <H3>9. Sécurité des données</H3>
          <P>
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées :
          </P>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Chiffrement en transit (HTTPS / TLS)</li>
            <li>Hachage des tokens de vérification (SHA-256) — usage unique</li>
            <li>Contrôle d'accès granulaire par politiques Row Level Security (RLS) sur toutes les tables</li>
            <li>Isolation stricte des données par utilisateur</li>
            <li>Fonctions serveur sécurisées (SECURITY DEFINER avec search_path fixé)</li>
            <li>Escalade de privilèges impossible côté client (statut, is_verified, is_premium protégés)</li>
          </ul>

          <H3>10. Mineurs</H3>
          <P>
            L'application est destinée aux étudiants âgés d'au moins 16 ans. Conformément au RGPD, les personnes âgées de 16 à 18 ans peuvent s'inscrire sous leur propre responsabilité. Aurea Student ne collecte pas sciemment de données relatives à des enfants de moins de 16 ans.
          </P>
        </Section>

        <p className="text-xs text-muted-foreground text-center pt-6 border-t border-border">
          Pour toute question : <a href="mailto:contact@aurea-student.fr" className="text-primary hover:underline">contact@aurea-student.fr</a>
        </p>
      </main>
    </div>
  );
};

export default Legal;
