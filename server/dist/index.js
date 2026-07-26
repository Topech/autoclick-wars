import { gameLoop } from './game.js';
import { startServer, broadcastToAll } from './ws.js';
import { getContributions } from './game.js';
async function main() {
    let currentState = null;
    const stopLoop = await gameLoop((state, tick) => {
        currentState = state;
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
        // Broadcast contributions immediately every tick
        const contributions = getContributions();
        if (contributions.length > 0) {
            broadcastToAll({ type: 'contributions', contributions });
        }
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
