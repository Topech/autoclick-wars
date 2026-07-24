<script setup lang="ts">
import { ref } from 'vue'
import TeamBar from './TeamBar.vue'
import ClickButton from './ClickButton.vue'
import UpgradeShop from './UpgradeShop.vue'
import Leaderboard from './Leaderboard.vue'
import { useGameStore } from '../stores/game'

const store = useGameStore()
const activeTab = ref<'shop' | 'leaderboard'>('shop')
const tabFlash = ref(false)
let lastPoints = 0
let lastAuto = 0
let lastGnomes = 0
let lastSoldiers = 0

function handleTabChange(tab: 'shop' | 'leaderboard') {
  activeTab.value = tab
  tabFlash.value = true
  setTimeout(() => { tabFlash.value = false }, 200)
}

function animateValue(current: number, last: number): boolean {
  if (current !== last) return true
  return false
}

let pointsChanged = false
let autoChanged = false
let gnomesChanged = false
let soldiersChanged = false

function checkChanges() {
  const myPoints = store.myPlayer?.points || 0
  const autoRate = store.getAutoClickRate()
  const gScore = store.teamScores.gnomes
  const sScore = store.teamScores.soldiers

  pointsChanged = myPoints !== lastPoints
  autoChanged = autoRate !== lastAuto
  gnomesChanged = gScore !== lastGnomes
  soldiersChanged = sScore !== lastSoldiers

  if (pointsChanged || autoChanged) {
    store.clickBurst = true
    setTimeout(() => { store.clickBurst = false }, 200)
  }

  lastPoints = myPoints
  lastAuto = autoRate
  lastGnomes = gScore
  lastSoldiers = sScore
}

setInterval(checkChanges, 50)
</script>

<template>
  <div class="game-screen">
    <TeamBar />

    <div class="player-bar" v-if="store.myPlayer">
      <span class="player-name">{{ store.myPlayer.name }}</span>
      <span class="player-points" :class="{ 'flash': pointsChanged }">⚡ {{ store.formatNum(store.myPlayer.points) }}</span>
    </div>

    <div class="stats-bar" v-if="store.myPlayer">
      <span :class="{ 'flash': pointsChanged }">👆 Power: {{ store.myPlayer.points }}</span>
      <span :class="{ 'flash': autoChanged }">🤖 Auto: {{ store.getAutoClickRate() }}/s</span>
    </div>

    <ClickButton />

    <div class="tabs" :class="{ 'flash': tabFlash }">
      <button
        class="tab"
        :class="{ active: activeTab === 'shop' }"
        @click="handleTabChange('shop')"
      >
        🛒 Shop
      </button>
      <button
        class="tab"
        :class="{ active: activeTab === 'leaderboard' }"
        @click="handleTabChange('leaderboard')"
      >
        🏆 Leaderboard
      </button>
    </div>

    <div class="tab-content">
      <UpgradeShop v-if="activeTab === 'shop'" />
      <Leaderboard v-if="activeTab === 'leaderboard'" />
    </div>
  </div>
</template>

<style scoped>
.game-screen {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.player-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  padding: 0.75rem;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  font-size: 0.9rem;
}

.player-name {
  font-weight: 700;
  color: var(--text);
}

.player-points {
  color: var(--accent);
  font-weight: 700;
  transition: transform 0.1s, color 0.2s, text-shadow 0.2s;
}

.player-points.flash {
  animation: valuePulse 0.3s ease;
  color: #feca57;
  text-shadow: 0 0 20px rgba(254, 202, 87, 0.8);
}

@keyframes valuePulse {
  0% { transform: scale(1); }
  30% { transform: scale(1.4) rotate(-3deg); }
  60% { transform: scale(1.2) rotate(2deg); }
  100% { transform: scale(1) rotate(0); }
}

.stats-bar {
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding: 0.75rem;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  font-size: 0.9rem;
  color: var(--text-muted);
}

.stats-bar span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: transform 0.1s, text-shadow 0.2s;
}

.stats-bar span.flash {
  animation: valuePulse 0.3s ease;
  color: #4ade80;
  text-shadow: 0 0 15px rgba(74, 222, 128, 0.6);
}

.tabs {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  transition: transform 0.1s;
}

.tabs.flash {
  animation: tabsShake 0.2s ease;
}

@keyframes tabsShake {
  0%, 100% { transform: translateX(0) rotate(0); }
  25% { transform: translateX(-3px) rotate(-1deg); }
  75% { transform: translateX(3px) rotate(1deg); }
}

.tab {
  padding: 0.6rem 1.5rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-weight: 700;
  transition: all 0.15s;
  position: relative;
  overflow: hidden;
}

.tab::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #4ade80, #f472b6);
  opacity: 0;
  transition: opacity 0.3s;
}

.tab:hover::before {
  opacity: 0.1;
}

.tab:hover {
  transform: translateY(-2px) scale(1.05);
  border-color: var(--accent);
  box-shadow: 0 4px 16px rgba(74, 222, 128, 0.3);
}

.tab:active {
  transform: translateY(1px) scale(0.95);
}

.tab.active {
  border-color: var(--accent);
  background: rgba(82, 183, 136, 0.15);
  color: var(--accent);
  box-shadow: 0 0 20px rgba(74, 222, 128, 0.2);
}

.tab-content {
  flex: 1;
  overflow-y: auto;
}
</style>
