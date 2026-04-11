
-- Create app_users table for predefined users
CREATE TABLE public.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  display_name text NOT NULL,
  role text NOT NULL DEFAULT 'general',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS - NO permissive policies = only service_role can access
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Seed HR/Admin users
INSERT INTO public.app_users (username, password, display_name, role) VALUES
('abdulqudoos', 'Thmanyah@HR2024', 'عبدالقدوس', 'hr_admin'),
('baraa', 'Thmanyah@HR2024', 'براء', 'hr_admin'),
('taghreed', 'Thmanyah@HR2024', 'تغريد', 'hr_admin');

-- Seed sample Manager user
INSERT INTO public.app_users (username, password, display_name, role) VALUES
('manager', 'Thmanyah@Mgr2024', 'مدير', 'manager');

-- Seed sample General user
INSERT INTO public.app_users (username, password, display_name, role) VALUES
('employee', 'Thmanyah@2024', 'موظف', 'general');
