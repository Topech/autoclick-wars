# Gnomes vs Toy Soldiers — Autoclicker Game Plan

## Overview
A real-time competing autoclicker game where two teams (Gnomes vs Toy Soldiers) race to accumulate points through clicking and upgrades. Forever game lasting ~6 hours with ~20 players.

## Tech Stack
- **Frontend**: Vue 3 + TypeScript + Vite
- **Backend**: Node.js + TypeScript + better-sqlite3
- **Real-time**: WebSocket (ws library)
- **State**: Pinia stores
- **Persistence**: SQLite via better-sqlite3

## Game Mechanics
- Player joins → assigned to Gnomes or Toy Soldiers
- Clicking adds points to player's team counter (tracked per-player too)
- Upgrades purchased with points for exponential scaling
- Leaderboard: top individual contributors per team
- Auto-clickers add points even when offline

## Themed Upgrades

### Gnome Upgrades
- **Mushroom Stool** — +1 auto-clicker
- **Beer Chug** — ×2 click power
- **Hat Collection** — +5% per hat (stacking)
- **Garden Gnome Army** — massive auto-clicker boost
- **Epic Fart Noise** — team morale: 10% crit chance for 30s

### Toy Soldier Upgrades
- **Plastic Ruler** — +1 auto-clicker
- **Drill Sergeant** — ×2 click power
- **Battle Formation** — +5% per formation (stacking)
- **Tank Division** — massive auto-clicker boost
- **Air Horn Rally** — team morale: 10% crit chance for 30s

## Scaling Math
- Click power starts at 1, max ~1000
- Auto-clickers start at 0, max ~500/sec
- Upgrade costs scale ×1.15 per purchase (Cookie Clicker formula)
- Rough progression: 0→100 clicks in first minute, 100→10K in 30min, 10K→1M by hour 3, 1M→1B by hour 6

## Animation System
- **Click feedback**: flying numbers + emoji (🍄 for gnomes, 🎖️ for soldiers)
- **Screen shake** on critical hits (>×5 click)
- **Character animations**: gnomes dance/sit on mushrooms, soldiers march/stand at attention
- **Particle explosions** on big milestones (1K, 10K, 100K, etc.)
- **Team score bar** with wobble animation when leading

## File Structure
```
autoclick-wars/
├── server/
│   ├── index.ts
│   ├── game.ts          (game loop, scoring)
│   ├── ws.ts            (WebSocket handler)
│   ├── db.ts            (SQLite schema + queries)
│   ├── upgrades.ts      (upgrade definitions + pricing)
│   ├── sql.d.ts         (custom type declarations for sql.js)
│   └── package.json
├── client/
│   ├── src/
│   │   ├── App.vue
│   │   ├── main.ts
│   │   ├── components/
│   │   │   ├── JoinScreen.vue
│   │   │   ├── GameScreen.vue
│   │   │   ├── ClickButton.vue
│   │   │   ├── TeamBar.vue
│   │   │   ├── UpgradeShop.vue
│   │   │   └── Leaderboard.vue
│   │   ├── stores/
│   │   │   └── game.ts  (pinia store)
│   │   └── styles/
│   │       └── animations.css
│   ├── vite.config.ts
│   └── package.json
├── tools/
│   ├── self-host.sh     (server startup)
│   └── dev-client.sh    (client dev server with hot reload)
├── README.md
└── AGENTS.md
```

## Current Status — Both Server and Client Complete, Ready for Integration Testing

### Server (✅ Complete)
- TypeScript compiles cleanly with `allowSyntheticDefaultImports` and custom `sql.d.ts`
- WebSocket handler (`ws.ts`) reads port from `GAME_SERVER_PORT` env var via `dotenv`
- All WebSocket tests passed: join, click, leaderboard, multi-player
- SQLite persistence via `sql.js` (replaced `better-sqlite3` due to Node 26 compilation failure)
- Game loop with scoring, upgrades, passive income working
- `tools/self-host.sh` runs server with `.env` support

### Client (✅ Complete)
- ✅ Pinia store (`src/stores/game.ts`) — aligned with server protocol
- ✅ Join screen (`src/components/JoinScreen.vue`) — team selection with name input
- ✅ Game screen (`src/components/GameScreen.vue`) — main layout with tabs
- ✅ Click button (`src/components/ClickButton.vue`) — animated click feedback
- ✅ Team bar (`src/components/TeamBar.vue`) — live score display
- ✅ Upgrade shop (`src/components/UpgradeShop.vue`) — themed upgrades, bulk buy
- ✅ Leaderboard (`src/components/Leaderboard.vue`) — ranked player table
- ✅ App routing between JoinScreen and GameScreen based on connection state
- ✅ Dark theme with team-specific colors (gnome green / soldier red)
- ✅ Responsive layout, CSS animations for click feedback and score changes
- ✅ Client builds cleanly (`pnpm run build`)

### Deferred
- Leaderboard bug: `totalPoints` shows 0 (needs fix in next iteration)
- Balance tuning & polish

## Implementation Order
1. Server: HTTP + WebSocket skeleton ✅
2. Server: Game loop + scoring logic ✅
3. Server: SQLite schema + persistence ✅
4. Server: Upgrade definitions + pricing formulas ✅
5. Client: Vue app + join screen ✅
6. Client: Pinia store aligned with server protocol ✅
7. Client: Game screen (score, click button, animations) ✅
8. Client: Upgrade shop ✅
9. Client: Leaderboard ✅
10. **Integration testing: Start client dev server + running server** ← NEXT
11. Polish: Balance tuning, all animations, responsive design (deferred)
