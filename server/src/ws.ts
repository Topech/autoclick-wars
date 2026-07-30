import { WebSocketServer, WebSocket } from 'ws';
import express from 'express';
import type { Express } from 'express';
import http from 'http';
import { joinPlayer, handlePlayerClick, buyUpgrade, getUpgradeInfo, getGameState, getAllUpgrades, getLeaderboardFromMemory, getPlayer, disconnectPlayer, getClickPower, getContributions } from './game.js';

const MIN_CLICK_INTERVAL = 10;
const MAX_MESSAGES_PER_SECOND = 20;
const MAX_BURST = 100;
const MAX_CLICKS_PER_SECOND = 16;
const PLAYER_JOIN_LIMIT = 5;
const PLAYER_JOIN_WINDOW_MS = 60_000;

interface RateLimitState {
  lastClickAt: number;
  messageTimestamps: number[];
  burstTimestamps: number[];
  clickTimestamps: number[];
}

interface WsExt extends WebSocket {
  playerId: string;
  team: 'gnomes' | 'soldiers';
  rateLimit?: RateLimitState;
}

const PORT = Number(process.env.GAME_SERVER_PORT) || 3001;
let wss: WebSocketServer;

export function startServer(): { app: Express; wss: WebSocketServer } {
  const app: Express = express();

  // Serve static client
  app.use(express.static('../client/dist'));

  const httpServer = http.createServer(app);
  wss = new WebSocketServer({ server: httpServer, maxPayload: 1024 });

  const HOST: string = '0.0.0.0';
  httpServer.listen(PORT, HOST, undefined, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });

  wss.on('close', () => {
    console.log('WebSocket server closed');
  });

  // Global player join rate tracking
  const recentJoins: number[] = [];

  wss.on('connection', (wsRaw: unknown, req: http.IncomingMessage) => {
    const ws = wsRaw as WsExt;
    console.log('New WebSocket connection');

    ws.on('message', async (data: string) => {
      let msg: any;
      try {
        msg = JSON.parse(data);
      } catch {
        return;
      }

      const now = Date.now();
      if (!ws.rateLimit) {
        ws.rateLimit = { lastClickAt: 0, messageTimestamps: [], burstTimestamps: [], clickTimestamps: [] };
      }

      const rl = ws.rateLimit;
      rl.messageTimestamps = rl.messageTimestamps.filter(t => now - t < 1000);
      if (rl.messageTimestamps.length >= MAX_MESSAGES_PER_SECOND) {
        console.log(`Connection ${ws.readyState} rate limited: ${rl.messageTimestamps.length} msg/s`);
        ws.close(4299, 'Too many messages');
        return;
      }
      rl.messageTimestamps.push(now);

      rl.burstTimestamps = rl.burstTimestamps.filter(t => now - t < 500);
      if (rl.burstTimestamps.length >= MAX_BURST) {
        console.log(`Connection ${ws.readyState} burst limited: ${rl.burstTimestamps.length} msgs/500ms`);
        ws.close(4299, 'Too many messages');
        return;
      }
      rl.burstTimestamps.push(now);

      switch (msg.type) {
        case 'join': {
          // Validate name
          if (typeof msg.name !== 'string') {
            ws.send(JSON.stringify({ type: 'join_error', error: 'Name must be a string' }));
            break;
          }
          const normalizedName = msg.name.trim();
          if (normalizedName.length === 0) {
            ws.send(JSON.stringify({ type: 'join_error', error: 'Name cannot be empty' }));
            break;
          }
          if (normalizedName.length > 30) {
            ws.send(JSON.stringify({ type: 'join_error', error: 'Name too long (max 30 characters)' }));
            break;
          }

          // Global player join rate limiting
          recentJoins.push(now);
          const recent = recentJoins.filter(t => now - t < PLAYER_JOIN_WINDOW_MS);
          if (recent.length > PLAYER_JOIN_LIMIT) {
            recentJoins.pop();
            ws.send(JSON.stringify({ type: 'join_error', error: 'Too many players joining, try again later' }));
            break;
          }

          const result = await joinPlayer(normalizedName);
          if (result.error) {
            ws.send(JSON.stringify({ type: 'join_error', error: result.error }));
            break;
          }
          const player = result.player!;
          ws.playerId = player.id;
          ws.team = player.team;
          broadcastToTeam(ws.team, {
            type: 'player_joined',
            player: { id: player.id, name: player.name, team: player.team },
          });
          ws.send(JSON.stringify({
            type: 'joined',
            player: serializePlayer(player),
            gameState: getGameState(),
          }));
          break;
        }

        case 'click': {
          const rl = ws.rateLimit;
          if (now - rl.lastClickAt < MIN_CLICK_INTERVAL) {
            return;
          }
          rl.lastClickAt = now;

          rl.clickTimestamps = rl.clickTimestamps.filter(t => now - t < 1000);
          if (rl.clickTimestamps.length >= MAX_CLICKS_PER_SECOND) {
            console.log(`Connection ${ws.readyState} click limited: ${rl.clickTimestamps.length + 1} clicks/s`);
            ws.close(4299, 'Too many clicks');
            return;
          }
          rl.clickTimestamps.push(now);

          const result = handlePlayerClick(ws.playerId);
          if (result) {
            const player = getPlayer(ws.playerId);
            ws.send(JSON.stringify({
              type: 'click_result',
              points: result.points,
              isCrit: result.isCrit,
              player: serializePlayer(player),
              gameState: getGameState(),
            }));
            broadcastToAll({
              type: 'score_update',
              gameState: getGameState(),
            });
          }
          break;
        }

        case 'buy_upgrade': {
          const quantity = Math.max(1, Math.min(1000, Math.floor(Number(msg.quantity)) || 1));
          let result: { success: boolean; cost: number; newLevel: number } = { success: false, cost: 0, newLevel: 0 };
          for (let i = 0; i < quantity; i++) {
            result = buyUpgrade(ws.playerId, msg.upgradeId);
            if (!result.success) break;
          }
          if (result.success) {
            const upgrades = getUpgradeInfo(ws.playerId);
            const player = getPlayer(ws.playerId);
            ws.send(JSON.stringify({
              type: 'upgrade_bought',
              upgradeId: msg.upgradeId,
              newLevel: result.newLevel,
              cost: result.cost,
              upgrades,
              gameState: getGameState(),
              player: serializePlayer(player),
            }));
            broadcastToAll({
              type: 'score_update',
              gameState: getGameState(),
            });
          } else {
            ws.send(JSON.stringify({
              type: 'upgrade_failed',
              reason: 'insufficient_points',
            }));
          }
          break;
        }

        case 'get_upgrades': {
          ws.send(JSON.stringify({
            type: 'upgrades',
            upgrades: getAllUpgrades(),
          }));
          break;
        }

        case 'get_leaderboard': {
          const lb = getLeaderboardFromMemory();
          ws.send(JSON.stringify({
            type: 'leaderboard',
            entries: lb,
          }));
          break;
        }

        case 'ping': {
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        }
      }
    });

    ws.on('close', () => {
      console.log('WebSocket disconnected');
      if (ws.playerId) {
        disconnectPlayer(ws.playerId);
      }
    });
  });

  return { app, wss };
}

function serializePlayer(player: any) {
  return {
    id: player.id,
    name: player.name,
    team: player.team,
    points: player.points,
    totalPoints: player.totalPoints,
    totalClicks: player.totalClicks,
    upgrades: player.upgrades,
    clickPower: getClickPower(player),
  };
}

function safeSend(ws: WebSocket, data: string): boolean {
  if (ws.readyState !== WebSocket.OPEN) return false;
  try {
    ws.send(data);
    return true;
  } catch {
    return false;
  }
}

function broadcastToTeam(team: string, message: any) {
  const data = JSON.stringify(message);
  for (const ws of wss.clients) {
    if ((ws as WsExt).team === team) {
      safeSend(ws as WebSocket, data);
    }
  }
}

export function broadcastToAll(message: any) {
  const data = JSON.stringify(message);
  for (const ws of wss.clients) {
    safeSend(ws as WebSocket, data);
  }
}

export { wss };
