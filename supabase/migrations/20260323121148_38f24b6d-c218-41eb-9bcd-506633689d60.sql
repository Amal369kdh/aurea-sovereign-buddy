
-- 1. Allow admin to delete any comment (moderation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Admins can delete any comment'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can delete any comment" ON public.comments FOR DELETE TO public USING (is_admin(auth.uid()))';
  END IF;
END $$;

-- 2. Seed demo announcements (tagged #demo for easy cleanup later)
INSERT INTO public.announcements (id, author_id, category, content, is_pinned, created_at)
VALUES
  (
    'aaaaaaaa-0001-4000-a000-000000000001',
    '403e0f7f-9274-4a76-9db4-8279eed357eb',
    'entraide',
    E'Bonjour tout le monde ! Je cherche quelqu''un pour m''aider à comprendre le système CAF — j''ai reçu un courrier qui me demande de mettre à jour ma situation et je ne sais pas trop comment remplir le formulaire. Est-ce qu''il y a quelqu''un qui l''a déjà fait ? #CAF #aides #entraide #demo',
    false,
    now() - interval '3 days'
  ),
  (
    'aaaaaaaa-0002-4000-a000-000000000002',
    '403e0f7f-9274-4a76-9db4-8279eed357eb',
    'logement',
    E'Salut ! Je cherche une colocation à Grenoble pour le mois de septembre. Budget autour de 400 €/mois charges comprises. Je suis étudiant en Master 2 à l''UGA, très calme et ordonné. Si quelqu''un a une chambre libre ou connaît quelqu''un, n''hésitez pas à me contacter ici 🙏 #logement #coloc #Grenoble #demo',
    false,
    now() - interval '2 days'
  ),
  (
    'aaaaaaaa-0003-4000-a000-000000000003',
    '403e0f7f-9274-4a76-9db4-8279eed357eb',
    'sorties',
    E'Hey les Grenoblois ! Ce week-end il y a une randonnée organisée par l''asso étudiante de Grenoble INP direction le Vercors 🏔️ — départ samedi matin à 9h depuis la gare. C''est gratuit et ouvert à tous les étudiants. On sera environ 20 personnes. Qui est dispo ? #randonnée #Vercors #sorties #Grenoble #demo',
    false,
    now() - interval '1 day'
  ),
  (
    'aaaaaaaa-0004-4000-a000-000000000004',
    '403e0f7f-9274-4a76-9db4-8279eed357eb',
    'general',
    E'Petite question pour ceux qui sont déjà passés par là : j''ai besoin de renouveler mon titre de séjour étudiant et le préfet de l''Isère est souvent difficile à avoir en rendez-vous. Est-ce que vous avez des astuces ou des créneaux disponibles que vous n''utilisez plus ? Merci d''avance 🙏 #titredeséjour #préfecture #Isère #demo',
    false,
    now() - interval '5 hours'
  ),
  (
    'aaaaaaaa-0005-4000-a000-000000000005',
    '403e0f7f-9274-4a76-9db4-8279eed357eb',
    'entraide',
    E'Je donne des cours de maths et physique niveau licence — je suis en doctorat à Grenoble et j''ai du temps libre le soir en semaine. C''est gratuit, c''est pour aider la communauté 💪 Si tu as besoin d''aide pour tes partiels, écris-moi ici ! #tutorat #maths #physique #entraide #UGA #demo',
    false,
    now() - interval '2 hours'
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Seed demo comments
INSERT INTO public.comments (id, announcement_id, author_id, content, is_solution, created_at)
VALUES
  (
    'bbbbbbbb-0001-4000-b000-000000000001',
    'aaaaaaaa-0001-4000-a000-000000000001',
    '403e0f7f-9274-4a76-9db4-8279eed357eb',
    E'Oui j''ai fait ça il y a 3 mois ! Il faut aller sur le site caf.fr, rubrique "Mon compte", puis "Déclarer ma situation". Tu auras besoin de ton avis d''imposition et de ton contrat de location. Si tu bloques à une étape, dis-moi laquelle.',
    true,
    now() - interval '3 days' + interval '2 hours'
  ),
  (
    'bbbbbbbb-0002-4000-b000-000000000002',
    'aaaaaaaa-0001-4000-a000-000000000001',
    '403e0f7f-9274-4a76-9db4-8279eed357eb',
    E'Merci beaucoup ! Et si je n''ai pas encore de numéro d''allocataire, est-ce que je peux quand même faire la mise à jour ?',
    false,
    now() - interval '3 days' + interval '4 hours'
  ),
  (
    'bbbbbbbb-0003-4000-b000-000000000003',
    'aaaaaaaa-0002-4000-a000-000000000002',
    '403e0f7f-9274-4a76-9db4-8279eed357eb',
    E'Regarde du côté de la résidence Le Rabot ou des internats universitaires du CROUS — ils ont souvent des places disponibles en septembre pour les étudiants étrangers. Le CROUS Grenoble a un service logement très réactif.',
    false,
    now() - interval '2 days' + interval '1 hour'
  ),
  (
    'bbbbbbbb-0004-4000-b000-000000000004',
    'aaaaaaaa-0003-4000-a000-000000000003',
    '403e0f7f-9274-4a76-9db4-8279eed357eb',
    E'Je suis partant ! Est-ce qu''il y a un niveau minimum requis pour la randonnée ou c''est accessible pour les débutants ?',
    false,
    now() - interval '1 day' + interval '3 hours'
  ),
  (
    'bbbbbbbb-0005-4000-b000-000000000005',
    'aaaaaaaa-0003-4000-a000-000000000003',
    '403e0f7f-9274-4a76-9db4-8279eed357eb',
    E'C''est accessible à tous les niveaux ! On marche environ 2h, le dénivelé est modéré. Prends juste de bonnes chaussures et de l''eau 🙂',
    false,
    now() - interval '1 day' + interval '5 hours'
  ),
  (
    'bbbbbbbb-0006-4000-b000-000000000006',
    'aaaaaaaa-0004-4000-a000-000000000004',
    '403e0f7f-9274-4a76-9db4-8279eed357eb',
    E'L''astuce que j''ai utilisée : connecte-toi très tôt le matin (vers 7h30) sur le site de la préfecture, les créneaux s''ouvrent souvent à cette heure-là. Il y a aussi l''application "Rendez-vous préfecture" qui envoie des notifications en temps réel.',
    false,
    now() - interval '4 hours'
  ),
  (
    'bbbbbbbb-0007-4000-b000-000000000007',
    'aaaaaaaa-0005-4000-a000-000000000005',
    '403e0f7f-9274-4a76-9db4-8279eed357eb',
    E'C''est super généreux ! Je suis en L3 physique et j''ai un partiel dans 3 semaines, je serais très intéressé. Comment on fait pour organiser une séance ?',
    false,
    now() - interval '1 hour'
  )
ON CONFLICT (id) DO NOTHING;

-- 4. Update comments_count for demo posts
UPDATE public.announcements SET comments_count = 2 WHERE id = 'aaaaaaaa-0001-4000-a000-000000000001';
UPDATE public.announcements SET comments_count = 1 WHERE id = 'aaaaaaaa-0002-4000-a000-000000000002';
UPDATE public.announcements SET comments_count = 2 WHERE id = 'aaaaaaaa-0003-4000-a000-000000000003';
UPDATE public.announcements SET comments_count = 1 WHERE id = 'aaaaaaaa-0004-4000-a000-000000000004';
UPDATE public.announcements SET comments_count = 1 WHERE id = 'aaaaaaaa-0005-4000-a000-000000000005';
