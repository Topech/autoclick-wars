import { initDB } from './db.js';
import { gameLoop } from './game.js';
import { startServer, broadcastToAll } from './ws.js';
async function main() {
    await initDB();
    console.log('Database initialized');
    const stopLoop = await gameLoop((state, tick) => {
        if (tick % 10 === 0) { // Log every second
            console.log(`[Tick ${tick}] Gnomes: ${Math.floor(state.gnomesScore).toLocaleString()} | Soldiers: ${Math.floor(state.soldiersScore).toLocaleString()} | Players: ${state.players.size}`);
        }
        // Broadcast game state every tick for real-time updates
        const players = [...state.players.values()].map(p => ({
            id: p.id,
            name: p.name,
            team: p.team,
            points: p.points,
            totalPoints: p.totalPoints,
            upgrades: p.upgrades,
        }));
        broadcastToAll({
            type: 'game_state',
            gameState: {
                gnomesScore: state.gnomesScore,
                soldiersScore: state.soldiersScore,
                playerCount: state.players.size,
            },
            players,
        });
    });
    const { app, wss } = startServer();
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\nShutting down...');
        stopLoop();
        wss.close();
        process.exit(0);
    });
}
main().catch(console.error);
