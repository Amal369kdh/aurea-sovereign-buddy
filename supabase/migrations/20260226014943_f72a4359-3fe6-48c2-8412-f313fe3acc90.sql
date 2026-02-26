ALTER TABLE public.reports
ADD CONSTRAINT reports_reported_user_fk
FOREIGN KEY (reported_user_id)
REFERENCES auth.users(id)
ON DELETE SET NULL;