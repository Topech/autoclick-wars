<script setup lang="ts">
import { useGameStore } from '../stores/game'

const store = useGameStore()

function refresh() {
  store.getLeaderboard()
}
</script>

<template>
  <div class="leaderboard">
    <div class="leaderboard-header">
      <h3>🏆 Leaderboard</h3>
      <button class="refresh-btn" @click="refresh">↻</button>
    </div>

    <div v-if="store.leaderboard.length === 0" class="empty-state">
      No players yet. Join the game!
    </div>

    <table v-else class="lb-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Player</th>
          <th>Team</th>
          <th>Points</th>
          <th>Clicks</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="entry in store.leaderboard"
          :key="entry.id"
          class="lb-row"
          :class="{ 'is-me': entry.id === store.myPlayer?.id }"
        >
          <td class="rank">{{ entry.rank }}</td>
          <td class="name">
            {{ entry.name }}
            <span v-if="entry.id === store.myPlayer?.id" class="you-badge">(You)</span>
          </td>
          <td class="team">
            <span :class="['team-badge', entry.team]">
              {{ entry.team === 'gnomes' ? '🍄' : '🎖️' }}
            </span>
          </td>
          <td class="points">{{ store.formatNum(entry.totalPoints) }}</td>
          <td class="clicks">{{ store.formatNum(entry.totalClicks) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.leaderboard {
  padding: 1rem;
}

.leaderboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.leaderboard-header h3 {
  font-size: 1.2rem;
  font-weight: 800;
}

.refresh-btn {
  padding: 0.4rem 0.8rem;
  border: 2px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text);
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.15s;
}

.refresh-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
  font-size: 1.1rem;
}

.lb-table {
  width: 100%;
  border-collapse: collapse;
}

.lb-table th,
.lb-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.lb-table th {
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.lb-row.is-me {
  background: rgba(82, 183, 136, 0.1);
}

.rank {
  font-weight: 800;
  color: var(--gold);
}

.name {
  font-weight: 600;
}

.you-badge {
  color: var(--accent);
  font-size: 0.8rem;
}

.team-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

.team-badge.gnomes {
  background: rgba(74, 222, 128, 0.15);
}

.team-badge.soldiers {
  background: rgba(248, 113, 113, 0.15);
}

.points {
  font-weight: 700;
  color: var(--gold);
}

.clicks {
  color: var(--text-muted);
}
</style>
