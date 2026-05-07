-- ============================================================
-- 008_password_security.sql
-- Adds forced password change status to profiles.
-- ============================================================

-- Add/Remove columns in profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS require_password_change BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN IF EXISTS phone;

-- Comment for clarity
COMMENT ON COLUMN public.profiles.require_password_change IS 'Flag to force the user to change their password on next login.';

-- Update the handle_new_user function to set default requirement
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inst_id uuid;
BEGIN
  -- Try to resolve institution from email domain
  SELECT id INTO inst_id
    FROM public.institutions
   WHERE domain = split_part(new.email, '@', 2)
     AND is_active = true
   LIMIT 1;

  INSERT INTO public.profiles (id, email, full_name, institution_id, role, require_password_change)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    inst_id,
    'voter',
    TRUE -- Always require password change on first default login
  );
  RETURN new;
END;
$$;
