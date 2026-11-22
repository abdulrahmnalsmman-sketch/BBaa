-- Close anonymous execute path on privileged SECURITY DEFINER functions.
REVOKE EXECUTE ON FUNCTION public.admin_change_password(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_create_student(text, text, date, text, text, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_update_student(uuid, text, text, boolean, text, text, text, text) FROM anon, public;

-- lookup_email_by_username stays callable by anon (used by the unified login
-- screen before sign-in), but only anon+authenticated, not PUBLIC.
REVOKE EXECUTE ON FUNCTION public.lookup_email_by_username(text) FROM public;
REVOKE EXECUTE ON FUNCTION public.public_site_stats() FROM public;

-- Pin the search path of the teacher recitation writer.
ALTER FUNCTION public.teacher_save_recitation_entry(uuid, uuid, text, text, uuid, uuid, integer, integer, text, integer, integer, uuid, integer, numeric, text, text) SET search_path = public;
