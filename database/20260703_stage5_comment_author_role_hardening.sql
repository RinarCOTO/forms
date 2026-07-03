BEGIN;

-- Finding 18: author_role must reflect the authenticated author's profile role,
-- not a client-supplied value.

ALTER TABLE public.form_comments
  DROP CONSTRAINT IF EXISTS form_comments_author_role_check;

ALTER TABLE public.form_comments
  ADD CONSTRAINT form_comments_author_role_check
  CHECK (author_role IN (
    'laoo',
    'municipal_tax_mapper',
    'municipal_assessor',
    'admin',
    'super_admin',
    'assistant_provincial_assessor',
    'provincial_assessor'
  ));

CREATE OR REPLACE FUNCTION public.set_form_comment_author_role_from_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_role TEXT;
BEGIN
  SELECT role
    INTO profile_role
    FROM public.users
   WHERE id = NEW.author_id;

  IF profile_role IS NULL THEN
    RAISE EXCEPTION 'form_comments.author_id % does not match an active user profile', NEW.author_id
      USING ERRCODE = '23503';
  END IF;

  IF profile_role NOT IN (
    'laoo',
    'municipal_tax_mapper',
    'municipal_assessor',
    'admin',
    'super_admin',
    'assistant_provincial_assessor',
    'provincial_assessor'
  ) THEN
    RAISE EXCEPTION 'user role % cannot author form comments', profile_role
      USING ERRCODE = '23514';
  END IF;

  NEW.author_role := profile_role;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_form_comments_author_role_from_profile
  ON public.form_comments;

CREATE TRIGGER trg_form_comments_author_role_from_profile
  BEFORE INSERT OR UPDATE OF author_id, author_role
  ON public.form_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_form_comment_author_role_from_profile();

COMMENT ON FUNCTION public.set_form_comment_author_role_from_profile()
  IS 'Forces form_comments.author_role to match public.users.role for the selected author_id.';

COMMIT;
