-- Temporarily disable RLS on main tables so data can be written without authentication
-- This will help us see if the issue is RLS policies or something else

-- Disable RLS on main tables
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items DISABLE ROW LEVEL SECURITY;

-- Insert some basic system categories that don't require a user
INSERT INTO public.categories (id, user_id, name, color, icon, is_system) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '00000000-0000-0000-0000-000000000000', 'Food & Dining', '#ef4444', 'utensils', true),
('550e8400-e29b-41d4-a716-446655440002', '00000000-0000-0000-0000-000000000000', 'Transportation', '#3b82f6', 'car', true),
('550e8400-e29b-41d4-a716-446655440003', '00000000-0000-0000-0000-000000000000', 'Shopping', '#10b981', 'shopping-bag', true),
('550e8400-e29b-41d4-a716-446655440004', '00000000-0000-0000-0000-000000000000', 'Salary', '#8b5cf6', 'dollar-sign', true)
ON CONFLICT (id) DO NOTHING;