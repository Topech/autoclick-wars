<script setup lang="ts">
import { useGameStore } from '../stores/game'

const store = useGameStore()
</script>

<template>
  <div class="team-bar">
    <div class="team gnome-team">
      <span class="team-emoji">🍄</span>
      <span class="team-name">Gnomes</span>
      <span class="team-score">{{ store.formatNum(store.teamScores.gnomes) }}</span>
    </div>

    <div class="vs-divider" :class="{ 'score-up': store.scoreChange === 'up' }">
      VS
    </div>

    <div class="team soldier-team">
      <span class="team-emoji">🎖️</span>
      <span class="team-name">Soldiers</span>
      <span class="team-score">{{ store.formatNum(store.teamScores.soldiers) }}</span>
    </div>
  </div>
</template>

<style scoped>
.team-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 1rem;
  background: var(--bg-card);
  border-bottom: 2px solid var(--border);
}

.team {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-width: 120px;
}

.team-emoji {
  font-size: 2rem;
}

.team-name {
  font-weight: 700;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.gnome-team .team-name {
  color: var(--accent-gnome);
}

.soldier-team .team-name {
  color: var(--accent-soldier);
}

.team-score {
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--gold);
}

.vs-divider {
  font-size: 1.2rem;
  font-weight: 900;
  color: var(--text-muted);
  transition: transform 0.3s, color 0.3s;
}

.vs-divider.score-up {
  transform: scale(1.3);
  color: var(--gold);
}
</style>
