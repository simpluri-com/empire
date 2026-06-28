# Empire Supabase (online lobby)

Empire uses a **separate Supabase project** from Tripify. Schema and migrations live in this repo under `supabase/`.

**Project:** `Empire` · ref `zzkrqpptqjklpkgzetwr` · region `ap-southeast-2`  
**Dashboard:** https://supabase.com/dashboard/project/zzkrqpptqjklpkgzetwr

Client keys are in `assets/empire-config.js` (publishable key, same pattern as Tripify).

## One-time project setup

Already done for the Simpluri org project above. To recreate elsewhere:

1. Create a new project in [Supabase Dashboard](https://supabase.com/dashboard) (e.g. `empire-simpluri`).
2. Enable **pgcrypto**: Database → Extensions → `pgcrypto`.
3. Run SQL in order in the SQL Editor:
   - `supabase/001_empire_lobby_schema.sql`
   - `supabase/002_data_api_grants.sql`
4. Copy **Project URL** and **publishable (anon) key** from Project Settings → API.
5. Set them in `assets/empire-config.js`:

```javascript
window.EMPIRE_SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
window.EMPIRE_SUPABASE_ANON_KEY = 'YOUR_PUBLISHABLE_KEY';
```

**Never** put the `service_role` key in the client.

## Local dev

With keys configured, run the suite dev server from the workspace root:

```bash
python3 dev-server.py
```

- Host: http://127.0.0.1:8765/empire/
- Join: http://127.0.0.1:8765/empire/join/?r=ROOMCODE

## Data model

| Table | Purpose |
|-------|---------|
| `empire_rooms` | Ephemeral lobby (`code`, `dealer_token`, `status`, 24h TTL) |
| `empire_submissions` | One row per player: name + celebrity |

No expected player count is stored. Rooms expire after 24 hours.

## RPCs (client-facing)

| RPC | Who | Purpose |
|-----|-----|---------|
| `create_empire_room()` | Dealer | Create lobby; returns `code` + `dealer_token` |
| `submit_empire_entry(code, name, celebrity)` | Player | Single submission while room is `lobby` |
| `fetch_empire_lobby(dealer_token)` | Dealer | Manual refresh — player names only |
| `start_empire_game(dealer_token)` | Dealer | Lock room; return all submissions for the board |

## Cost notes

- One room + N submissions per game (writes only).
- Dealer pulls the list manually (no Realtime).
- Rows auto-expire via `expires_at`; optional periodic cleanup can delete old `started` rooms later.
