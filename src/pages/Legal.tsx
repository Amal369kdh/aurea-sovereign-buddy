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
          Dernière mise à jour : mars 2025
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
            L'application est hébergée par <strong className="text-foreground">Lovable</strong> (Lovable Technology AB, Stockholm, Suède)
            et par <strong className="text-foreground">Supabase Inc.</strong> (San Francisco, CA, USA) pour la base de données.
            Les données sont stockées sur des serveurs situés dans l'Union européenne (région eu-west-1).
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
            Aurea Student est une application communautaire destinée aux étudiants souhaitant s'installer ou s'intégrer à Grenoble. Elle propose des outils d'aide aux démarches administratives, un espace de discussion entre étudiants et un assistant basé sur l'IA.
          </P>

          <H3>2. Accès et inscription</H3>
          <P>
            L'accès à l'application est réservé aux personnes âgées d'au moins 16 ans. L'inscription nécessite une adresse email valide. Certaines fonctionnalités (Hub Social, Rencontres, messagerie) sont réservées aux utilisateurs ayant vérifié leur statut étudiant via un email universitaire reconnu.
          </P>

          <H3>3. Compte utilisateur</H3>
          <P>
            L'utilisateur est responsable de la confidentialité de ses identifiants. Tout accès frauduleux doit être signalé immédiatement. Aurea Student se réserve le droit de suspendre ou supprimer tout compte en cas de comportement contraire aux présentes CGU.
          </P>

          <H3>4. Comportement sur la plateforme</H3>
          <P>Il est formellement interdit de :</P>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Publier des contenus haineux, discriminatoires, obscènes ou illicites</li>
            <li>Harceler, menacer ou usurper l'identité d'un autre utilisateur</li>
            <li>Diffuser des informations personnelles d'un tiers sans son consentement</li>
            <li>Utiliser l'application à des fins commerciales non autorisées</li>
            <li>Tenter de contourner les mesures de sécurité de la plateforme</li>
          </ul>
          <P>
            Les contenus signalés par les utilisateurs sont modérés. L'équipe Aurea se réserve le droit de supprimer tout contenu inapproprié sans préavis.
          </P>

          <H3>5. Assistant IA (Amal)</H3>
          <P>
            L'assistant Amal fournit des informations à titre indicatif. Ses réponses ne constituent pas un conseil juridique, médical ou financier. L'utilisateur est seul responsable des décisions prises sur la base de ces informations. L'utilisation d'Amal est limitée à un certain nombre de messages par jour pour les utilisateurs non-premium.
          </P>

          <H3>6. Disponibilité</H3>
          <P>
            Aurea Student est fourni « en l'état ». L'équipe s'efforce d'assurer la continuité du service mais ne peut garantir l'absence d'interruption. L'application peut être modifiée, suspendue ou arrêtée à tout moment.
          </P>

          <H3>7. Modification des CGU</H3>
          <P>
            Ces CGU peuvent être mises à jour à tout moment. Les utilisateurs seront informés des modifications importantes. La poursuite de l'utilisation de l'application vaut acceptation des nouvelles conditions.
          </P>

          <H3>8. Droit applicable</H3>
          <P>
            Les présentes CGU sont régies par le droit français. En cas de litige, les tribunaux français seront compétents.
          </P>
        </Section>

        {/* ── RGPD ── */}
        <Section id="rgpd" title="Politique de Confidentialité & RGPD">
          <P>
            Aurea Student s'engage à protéger les données personnelles de ses utilisateurs conformément au Règlement Général sur la Protection des Données (RGPD – UE 2016/679) et à la loi Informatique et Libertés.
          </P>

          <H3>1. Responsable du traitement</H3>
          <P>
            Le responsable du traitement des données est le porteur du projet Aurea Student, joignable à <a href="mailto:contactaureastudent@gmail.com" className="text-primary hover:underline">contactaureastudent@gmail.com</a>.
          </P>

          <H3>2. Données collectées</H3>
          <P>Nous collectons les données suivantes :</P>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong className="text-foreground">Données d'identification</strong> : adresse email, prénom ou pseudo</li>
            <li><strong className="text-foreground">Données de profil</strong> : nationalité, ville d'installation, université, situation de logement, objectifs</li>
            <li><strong className="text-foreground">Données de vérification</strong> : email universitaire (haché et non stocké en clair)</li>
            <li><strong className="text-foreground">Contenus générés</strong> : annonces, commentaires, messages privés</li>
            <li><strong className="text-foreground">Données techniques</strong> : logs de connexion, données d'utilisation anonymisées</li>
          </ul>

          <H3>3. Finalités et bases légales</H3>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Fourniture du service (base légale : exécution du contrat)</li>
            <li>Vérification du statut étudiant (base légale : consentement)</li>
            <li>Amélioration de la plateforme (base légale : intérêt légitime)</li>
            <li>Respect des obligations légales (base légale : obligation légale)</li>
          </ul>

          <H3>4. Durée de conservation</H3>
          <P>
            Les données sont conservées pendant la durée de vie du compte. À la suppression du compte, toutes les données personnelles sont effacées dans un délai de 30 jours, à l'exception des données requises par la loi.
          </P>

          <H3>5. Destinataires des données</H3>
          <P>Les données ne sont jamais vendues à des tiers. Elles peuvent être partagées avec :</P>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong className="text-foreground">Supabase</strong> : hébergement de la base de données (serveurs UE)</li>
            <li><strong className="text-foreground">Resend</strong> : envoi d'emails transactionnels</li>
            <li><strong className="text-foreground">Perplexity AI</strong> : traitement de requêtes pour les ressources locales (données anonymisées)</li>
            <li><strong className="text-foreground">Lovable AI Gateway</strong> : traitement des requêtes conversationnelles pour l'assistant Amal (données de profil anonymisées, non stockées)</li>
          </ul>

          <H3>6. Vos droits</H3>
          <P>Conformément au RGPD, vous disposez des droits suivants :</P>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong className="text-foreground">Accès</strong> : obtenir une copie de vos données</li>
            <li><strong className="text-foreground">Rectification</strong> : corriger des données inexactes</li>
            <li><strong className="text-foreground">Effacement</strong> : demander la suppression de vos données ("droit à l'oubli")</li>
            <li><strong className="text-foreground">Portabilité</strong> : recevoir vos données dans un format structuré</li>
            <li><strong className="text-foreground">Opposition</strong> : vous opposer à certains traitements</li>
            <li><strong className="text-foreground">Limitation</strong> : limiter le traitement de vos données</li>
          </ul>
          <P>
            Pour exercer ces droits, contactez-nous à <a href="mailto:contactaureastudent@gmail.com" className="text-primary hover:underline">contactaureastudent@gmail.com</a>. Nous répondrons dans un délai d'un mois. Vous pouvez également introduire une réclamation auprès de la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">CNIL</a>.
          </P>

          <H3>7. Cookies et traceurs</H3>
          <P>
            Aurea Student utilise uniquement des cookies techniques strictement nécessaires au fonctionnement de l'authentification et de la session utilisateur. Aucun cookie publicitaire ou de traçage tiers n'est utilisé.
          </P>

          <H3>8. Sécurité</H3>
          <P>
            Nous mettons en œuvre des mesures techniques appropriées pour protéger vos données : chiffrement en transit (HTTPS), hachage des tokens sensibles (SHA-256), contrôle d'accès par politiques RLS, et isolation des données par utilisateur.
          </P>
        </Section>

        <p className="text-xs text-muted-foreground text-center pt-6 border-t border-border">
          Pour toute question : <a href="mailto:contactaureastudent@gmail.com" className="text-primary hover:underline">contactaureastudent@gmail.com</a>
        </p>
      </main>
    </div>
  );
};

export default Legal;
