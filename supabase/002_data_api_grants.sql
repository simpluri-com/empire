-- Empire Data API grants (run after 001_empire_lobby_schema.sql).
-- Tables stay behind RLS with no anon policies; only RPCs are callable from the client.

grant usage on schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

-- service_role for dashboard / maintenance only
grant select, insert, update, delete on public.empire_rooms to service_role;
grant select, insert, update, delete on public.empire_submissions to service_role;

-- RPC execute (anon key from static Empire app)
grant execute on function public.create_empire_room() to anon, authenticated;
grant execute on function public.submit_empire_entry(text, text, text) to anon, authenticated;
grant execute on function public.fetch_empire_lobby(text) to anon, authenticated;
grant execute on function public.start_empire_game(text) to anon, authenticated;
