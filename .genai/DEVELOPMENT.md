# Autoclick Wars — Development Guide

## Quick Start

### Server
```bash
cd server
pnpm install
pnpm run dev        # starts with tsx watch on src/index.ts
```

### Client (dev)
```bash
cd client
pnpm install
pnpm run dev        # Vite dev server on localhost:5173
```

### Production build
```bash
cd client
pnpm run build      # outputs to client/dist/
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| GAME_SERVER_PORT | 3001 | WebSocket + HTTP server port |

Server `.env` file:
```
GAME_SERVER_PORT=3001
```

## Development Workflow

1. Start server: `cd server && pnpm run dev`
2. Start client: `cd client && pnpm run dev`
3. Open browser to `http://localhost:5173`
4. Enter name, select team, start clicking

## Key Files

- `.genai/ARCHITECTURE.md` — Full architecture overview
- `.genai/PLAN.md` — Game plan, tech stack, implementation history
- `server/src/game.ts` — Game loop, scoring, click handling
- `server/src/ws.ts` — WebSocket handler with rate limiting
- `server/src/db.ts` — SQLite persistence via sql.js
- `server/src/upgrades.ts` — Upgrade definitions and pricing
- `client/src/stores/game.ts` — Pinia store, WebSocket client, animations
- `client/src/components/` — All Vue components

## Testing

### WebSocket protocol
```bash
# Join
{"type": "join", "name": "test"}

# Click
{"type": "click"}

# Buy upgrade
{"type": "buy_upgrade", "upgradeId": "mushroom_stool", "quantity": 1}

# Get leaderboard
{"type": "get_leaderboard"}

# Get upgrades
{"type": "get_upgrades"}

# Ping
{"type": "ping"}
```

### Server startup script
```bash
./tools/self-host.sh    # starts server with .env support
```

### Client dev script
```bash
./tools/dev-client.sh   # starts client dev server
```

## Deployment

### GitHub Pages (client)
- Workflow: `.github/workflows/github_pages_static_client.yml`
- Builds client and deploys static files to GitHub Pages

### Self-hosted (server)
- Run `./tools/self-host.sh` or manually: `cd server && pnpm run dev`
- Server serves both WebSocket API and static client files from `../client/dist`

## Code Conventions

- TypeScript strict mode on both client and server
- Pinia for client state management (no Vuex)
- No default exports — use named exports throughout
- CSS scoped in Vue components
- Dark theme with team-specific colors (gnome green / soldier red)
- Rate limiting on server: 20 msg/s, 16 clicks/s, 10ms min click interval
