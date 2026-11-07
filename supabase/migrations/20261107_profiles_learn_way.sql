-- Shade School: how each person likes to learn. Own row only (existing profiles RLS); never exposed via public.people.
alter table public.profiles add column if not exists learn_way text[];
