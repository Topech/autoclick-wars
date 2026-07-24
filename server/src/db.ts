import initSqlJs from 'sql.js';
import { Player } from './types.js';
import * as fs from 'fs';

let db: any = null;
let initialized = false;

const DB_PATH = './data/game.db';

export async function initDB(): Promise<void> {
  if (initialized) return;

  const SQL = await initSqlJs();

  let data: Uint8Array | null = null;
  try {
    data = new Uint8Array(fs.readFileSync(DB_PATH));
  } catch {
    // New database
  }

  db = data ? new SQL.Database(data) : new SQL.Database();
  initialized = true;

  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      team TEXT NOT NULL,
      points REAL NOT NULL DEFAULT 0,
      total_points REAL NOT NULL DEFAULT 0,
      total_clicks INTEGER NOT NULL DEFAULT 0,
      upgrades TEXT NOT NULL DEFAULT '{}',
      last_seen INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  saveDB();
}

export async function savePlayer(player: Player): Promise<void> {
  if (!db) throw new Error('DB not initialized');

  db.run(
    `INSERT OR REPLACE INTO players (id, name, team, points, total_points, total_clicks, upgrades, last_seen, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [player.id, player.name, player.team, player.points, player.totalPoints, player.totalClicks, JSON.stringify(player.upgrades), player.lastSeen, player.createdAt],
  );

  saveDB();
}

export async function loadPlayer(id: string): Promise<Player | null> {
  if (!db) throw new Error('DB not initialized');

  const rows = db.exec(`SELECT * FROM players WHERE id = '${id.replace(/'/g, "''")}'`);
  if (rows.length === 0 || rows[0].values.length === 0) return null;

  const row = rows[0].values[0];
  const cols = rows[0].columns;
  const obj: Record<string, any> = {};
  cols.forEach((col: string, i: number) => { obj[col] = row[i]; });

  return {
    id: obj.id,
    name: obj.name,
    team: obj.team as 'gnomes' | 'soldiers',
    points: obj.points,
    totalPoints: obj.total_points,
    totalClicks: obj.total_clicks,
    upgrades: JSON.parse(obj.upgrades),
    lastSeen: obj.last_seen,
    createdAt: obj.created_at,
  };
}

export async function getLeaderboard(team?: 'gnomes' | 'soldiers', limit = 20): Promise<any[]> {
  if (!db) throw new Error('DB not initialized');

  const query = team
    ? `SELECT * FROM players WHERE team = '${team.replace(/'/g, "''")}' ORDER BY total_points DESC LIMIT ${limit}`
    : `SELECT * FROM players ORDER BY total_points DESC LIMIT ${limit}`;

  const rows = db.exec(query);
  if (rows.length === 0) return [];

  const cols = rows[0].columns;
  return rows[0].values.map((row: any[]) => {
    const obj: Record<string, any> = {};
    cols.forEach((col: string, i: number) => { obj[col] = row[i]; });
    return obj;
  });
}

export async function getTeamScores(): Promise<{ gnomes: number; soldiers: number }> {
  if (!db) throw new Error('DB not initialized');

  const gnomesRows = db.exec(`SELECT COALESCE(SUM(points), 0) as score FROM players WHERE team = 'gnomes'`);
  const soldiersRows = db.exec(`SELECT COALESCE(SUM(points), 0) as score FROM players WHERE team = 'soldiers'`);

  return {
    gnomes: gnomesRows[0]?.values[0][0] || 0,
    soldiers: soldiersRows[0]?.values[0][0] || 0,
  };
}

export async function cleanupOfflinePlayers(cutoff: number): Promise<void> {
  if (!db) throw new Error('DB not initialized');

  db.run(`DELETE FROM players WHERE last_seen < ${cutoff}`);
  saveDB();
}

function saveDB(): void {
  if (!db) return;
  const data = db.export();
  try {
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch {
    // Ignore
  }
}
