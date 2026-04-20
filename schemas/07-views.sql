-- Views generated from schema CSV

CREATE OR REPLACE VIEW public.staff_members AS
 SELECT s.id,
    p.user_id,
    p.email,
    p.first_name,
    p.last_name,
    p.phone,
    p.avatar_url,
    s."position",
    s.hire_date,
    s.permissions,
    s.hourly_rate,
    p.is_active,
    p.created_at,
    p.updated_at
   FROM (staff s
     JOIN profiles p ON ((s.profile_id = p.id)))
  WHERE (p.role = ANY (ARRAY['staff'::text, 'admin'::text]));
