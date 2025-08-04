-- Fix RLS issue on group_members table
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;