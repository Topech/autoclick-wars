# ARCHITECTURE

## Tech Stack
- **Frontend**: Vue 3 + TypeScript + Vite + Pinia
- **Backend**: Node.js + TypeScript (tsx) + Express + WebSocket (ws)
- **Database**: sql.js (SQLite in-memory with file persistence)
- **Deployment**: GitHub Pages (static client), self-hosted server

## Architecture Overview
```
┌─────────────┐         WebSocket        ┌──────────────┐
│   Client     │ ◄────────────────────►  │    Server     │
│   Vue SPA    │                          │   Express     │
│              │                          │              │
│  JoinScreen  │  join, click, buy_upgrade│  Game Loop   │
│  GameScreen  │  get_leaderboard         │  (100ms tick)│
│  UpgradeShop │  get_upgrades            │              │
│  Leaderboard │                          │  WebSocket   │
│              │                          │  Handler     │
│  Pinia Store │                          │              │
│  (game.ts)   │                          │  SQLite DB   │
└──────────────┘                          └──────────────┘
```

## Server Architecture

### Entry Point (`server/src/index.ts`)
- Starts game loop and HTTP/WS server on port from `GAME_SERVER_PORT` env var (default 3001)
- Broadcasts game state to all clients every tick
- Broadcasts contributions every tick

### Game Engine (`server/src/game.ts`)
- **Game loop**: 100ms interval, calculates passive income per player
- **Scoring**: `recalcScores()` sums all player totalPoints per team
- **Click handling**: Calculates click power with upgrades, crit chance
- **Upgrades**: Exponential cost scaling (×1.15 per purchase)
- **Contributions**: Buffered passive income flushed every 11 seconds

### WebSocket Handler (`server/src/ws.ts`)
- Rate limiting: 20 msg/s, 100 burst/500ms, 16 clicks/s, 10ms min click interval
- Message types: join, click, buy_upgrade, get_upgrades, get_leaderboard, ping
- Broadcasts: score_update (all), player_joined (team)

### Database (`server/src/db.ts`)
- SQLite via sql.js with file persistence at `./data/game.db`
- Schema: players table with id, name, team, points, total_points, total_clicks, upgrades JSON, last_seen, created_at
- Functions: initDB, savePlayer, loadPlayer, getLeaderboard, getTeamScores, cleanupOfflinePlayers

### Types (`server/src/types.ts`)
- Player, GameState, UpgradeDef, ClickEvent, LeaderboardEntry

### Upgrades (`server/src/upgrades.ts`)
- Team-specific upgrade definitions with costs and effects
- Gnome upgrades: mushroom_stool, beer_chug, hat_collection, gnome_army, epic_fart
- Soldier upgrades: plastic_ruler, drill_sergeant, battle_formation, tank_division, air_horn

## Client Architecture

### App (`client/src/App.vue`)
- Routes between JoinScreen (not connected) and GameScreen (connected)
- Uses Pinia store to determine connection state

### Pinia Store (`client/src/stores/game.ts`)
- WebSocket management with auto-reconnect and heartbeat check (5s timeout)
- Message handler for all server message types
- Click burst animation, contribution tracking, click ticker system
- Edge positions for click tickers (30 positions around button perimeter)
- Computed: myTeam, teamScores, totalScore

### Components
- **JoinScreen**: Team selection with name input, server URL config
- **GameScreen**: Main layout with tabs (score, upgrades, leaderboard), GitHubIcon link
- **ClickButton**: Click button with tickers, burst animation, emoji feedback
- **TeamBar**: Live team score display with change indicators
- **UpgradeShop**: Team-specific upgrades, bulk buy, cost display
- **Leaderboard**: Ranked player table per team
- **GitHubIcon**: Shared GitHub logo component with circular backdrop

### Styles
- `client/src/styles/main.css`: Global styles, CSS animations
- Dark theme with team colors (gnome green / soldier red)

## Data Flow

### Join Flow
1. Client → `join` message with name
2. Server → assigns team (balance), creates player, saves to DB
3. Server → `joined` response with player data + game state
4. Client → Pinia sets myPlayer, routes to GameScreen
5. Client → `get_upgrades` request

### Click Flow
1. Client → `click` message (rate limited)
2. Server → calculates click power with upgrades, crit chance
3. Server → `click_result` response with points + updated state
4. Server → broadcasts `score_update` to all clients
5. Client → Pinia triggers click burst animation + click ticker

### Upgrade Flow
1. Client → `buy_upgrade` message with upgradeId + quantity
2. Server → calculates cost, checks points, applies upgrades
3. Server → `upgrade_bought` response with updated player data
4. Server → broadcasts `score_update` to all clients
5. Client → Pinia updates myPlayer and upgrades

## State Management

### Server State (in-memory)
- GameState: gnomesScore, soldiersScore, players Map
- Players persist to SQLite via savePlayer on join/rejoin
- Passive income buffer per player, flushed every 11 seconds

### Client State (Pinia)
- myPlayer: current player data
- gameState: team scores + player map
- leaderboard: ranked entries
- upgrades: available upgrades for team
- contributions: recent team contribution events
- clickTicks: active click ticker animations
- connected/_disconnected: connection state

## Deployment
- Client: Built to `client/dist/`, served by GitHub Pages via workflow
- Server: Self-hosted via `tools/self-host.sh` with `.env` support
- Static client files also served by server at `../client/dist`
