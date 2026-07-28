import { WebSocketServer, WebSocket } from 'ws';
import express from 'express';
import type { Express } from 'express';
import http from 'http';
import { joinPlayer, handlePlayerClick, buyUpgrade, getUpgradeInfo, getGameState, getAllUpgrades, getLeaderboardFromMemory, getPlayer, removePlayer, getClickPower, getContributions } from './game.js';

const MIN_CLICK_INTERVAL = 10;
const MAX_MESSAGES_PER_SECOND = 20;
const MAX_BURST = 100;

interface RateLimitState {
  lastClickAt: number;
  messageTimestamps: number[];
  burstTimestamps: number[];
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
  wss = new WebSocketServer({ server: httpServer });

  const HOST: string = '0.0.0.0';
  httpServer.listen(PORT, HOST, undefined, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });

  wss.on('close', () => {
    console.log('WebSocket server closed');
  });

  wss.on('connection', (wsRaw: unknown) => {
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
        ws.rateLimit = { lastClickAt: 0, messageTimestamps: [], burstTimestamps: [] };
      }

      const rl = ws.rateLimit;
      rl.messageTimestamps = rl.messageTimestamps.filter(t => now - t < 1000);
      if (rl.messageTimestamps.length >= MAX_MESSAGES_PER_SECOND) {
        return;
      }
      rl.messageTimestamps.push(now);

      rl.burstTimestamps = rl.burstTimestamps.filter(t => now - t < 500);
      if (rl.burstTimestamps.length >= MAX_BURST) {
        return;
      }
      rl.burstTimestamps.push(now);

      switch (msg.type) {
        case 'join': {
          const result = await joinPlayer(msg.id, msg.name);
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
          const quantity = msg.quantity || 1;
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
      removePlayer(ws.playerId);
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

function broadcastToTeam(team: string, message: any) {
  const data = JSON.stringify(message);
  for (const ws of wss.clients) {
    if ((ws as WsExt).team === team) {
      (ws as WebSocket).send(data);
    }
  }
}

export function broadcastToAll(message: any) {
  const data = JSON.stringify(message);
  for (const ws of wss.clients) {
    (ws as WebSocket).send(data);
  }
}

export { wss };
