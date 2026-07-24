<script setup lang="ts">
import { useGameStore } from '../stores/game'
import { ref, onMounted, onUnmounted } from 'vue'

const store = useGameStore()
let lastGnomes = 0
let lastSoldiers = 0
let gnomesFlash = false
let soldiersFlash = false
let vsFlash = false

function checkScores() {
  const gScore = store.teamScores.gnomes
  const sScore = store.teamScores.soldiers

  if (gScore !== lastGnomes) {
    gnomesFlash = true
    vsFlash = true
    setTimeout(() => { gnomesFlash = false }, 300)
    setTimeout(() => { vsFlash = false }, 200)
    lastGnomes = gScore
  }

  if (sScore !== lastSoldiers) {
    soldiersFlash = true
    vsFlash = true
    setTimeout(() => { soldiersFlash = false }, 300)
    lastSoldiers = sScore
  }
}

const interval = setInterval(checkScores, 50)
onUnmounted(() => clearInterval(interval))
</script>

<template>
  <div class="team-bar">
    <div class="team gnome-team">
      <span class="team-emoji" :class="{ 'flash': gnomesFlash }">🍄</span>
      <span class="team-name">Gnomes</span>
      <span class="team-score" :class="{ 'flash': gnomesFlash }">{{ store.formatNum(store.teamScores.gnomes) }}</span>
    </div>

    <div class="vs-divider" :class="{ 'score-up': vsFlash }">
      VS
    </div>

    <div class="team soldier-team">
      <span class="team-emoji" :class="{ 'flash': soldiersFlash }">🔫</span>
      <span class="team-name">Soldiers</span>
      <span class="team-score" :class="{ 'flash': soldiersFlash }">{{ store.formatNum(store.teamScores.soldiers) }}</span>
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
  transition: transform 0.1s;
}

.team-emoji.flash {
  animation: emojiPop 0.3s ease;
}

@keyframes emojiPop {
  0% { transform: scale(1) rotate(0); }
  30% { transform: scale(1.5) rotate(-10deg); }
  60% { transform: scale(1.3) rotate(5deg); }
  100% { transform: scale(1) rotate(0); }
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
  transition: transform 0.1s, text-shadow 0.2s;
}

.team-score.flash {
  animation: scorePulse 0.3s ease;
  color: #feca57;
  text-shadow: 0 0 25px rgba(254, 202, 87, 0.9);
}

@keyframes scorePulse {
  0% { transform: scale(1); }
  30% { transform: scale(1.6) rotate(-4deg); }
  60% { transform: scale(1.3) rotate(3deg); }
  100% { transform: scale(1) rotate(0); }
}

.vs-divider {
  font-size: 1.2rem;
  font-weight: 900;
  color: var(--text-muted);
  transition: transform 0.3s, color 0.3s, text-shadow 0.3s;
}

.vs-divider.score-up {
  animation: vsFlash 0.2s ease;
}

@keyframes vsFlash {
  0% { transform: scale(1); color: var(--text-muted); }
  50% { transform: scale(1.8); color: #feca57; text-shadow: 0 0 30px rgba(254, 202, 87, 0.8); }
  100% { transform: scale(1); color: var(--text-muted); }
}
</style>
