<script setup lang="ts">
import { useGameStore } from '../stores/game'
import NumberTooltip from './NumberTooltip.vue'
import { onUnmounted, ref, computed } from 'vue'

const store = useGameStore()
let lastGnomes = 0
let lastSoldiers = 0
let gnomesFlash = false
let soldiersFlash = false
let vsFlash = false

const gnomeContribs = computed(() => store.contributions.filter(c => c.team === 'gnomes').slice(-10))
const soldierContribs = computed(() => store.contributions.filter(c => c.team === 'soldiers').slice(-10))

function getRandomPos() {
  const positions = [
    { x: -40, y: -25 }, { x: 40, y: -25 },
    { x: -55, y: 0 }, { x: 55, y: 0 },
    { x: -40, y: 25 }, { x: 40, y: 25 },
    { x: 0, y: -35 }, { x: 0, y: 35 },
  ]
  return positions[Math.floor(Math.random() * positions.length)]
}

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
      <div class="score-wrapper">
        <span class="team-score" :class="{ 'flash': gnomesFlash }"><NumberTooltip :value="store.teamScores.gnomes">{{ store.formatNum(store.teamScores.gnomes) }}</NumberTooltip></span>
        <div class="contributions gnome">
          <span v-for="c in gnomeContribs" :key="c.id" class="contribution gnome" :style="{ left: c.pos.x + 'px', top: c.pos.y + 'px' }">+{{ Math.floor(c.increase) }}</span>
        </div>
      </div>
    </div>

    <div class="vs-divider" :class="{ 'score-up': vsFlash }">
      VS
    </div>

    <div class="team soldier-team">
      <span class="team-emoji" :class="{ 'flash': soldiersFlash }">🔫</span>
      <span class="team-name">Soldiers</span>
      <div class="score-wrapper">
        <span class="team-score" :class="{ 'flash': soldiersFlash }"><NumberTooltip :value="store.teamScores.soldiers">{{ store.formatNum(store.teamScores.soldiers) }}</NumberTooltip></span>
        <div class="contributions soldier">
          <span v-for="c in soldierContribs" :key="c.id" class="contribution soldier" :style="{ left: c.pos.x + 'px', top: c.pos.y + 'px' }">+{{ Math.floor(c.increase) }}</span>
        </div>
      </div>
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

.score-wrapper {
  position: relative;
  display: inline-block;
  width: 160px;
  text-align: center;
}

.contributions {
  display: flex;
  gap: 0.3rem;
  min-height: 1.5rem;
  align-items: center;
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
}

.contribution {
  font-size: 0.85rem;
  font-weight: 900;
  animation: contribFloat 2s ease-out forwards;
  pointer-events: none;
  position: absolute;
  transform: translate(-50%, -50%);
}

.contribution.gnome {
  color: #4ade80;
  text-shadow: 0 0 10px rgba(74, 222, 128, 0.6);
}

.contribution.soldier {
  color: #f87171;
  text-shadow: 0 0 10px rgba(248, 113, 113, 0.6);
}

@keyframes contribFloat {
  0% { transform: translateY(0) scale(0.5); opacity: 0; }
  20% { transform: translateY(-5px) scale(1.2); opacity: 1; }
  80% { transform: translateY(-20px) scale(1); opacity: 1; }
  100% { transform: translateY(-35px) scale(0.7); opacity: 0; }
}
</style>
