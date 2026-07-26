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

function handleTabChange(tab: 'shop' | 'leaderboard') {
  activeTab.value = tab
  tabFlash.value = true
  setTimeout(() => { tabFlash.value = false }, 200)
}

let pointsChanged = false
let autoChanged = false

function checkChanges() {
  const myPoints = store.myPlayer?.points || 0
  const autoRate = store.getAutoClickRate()

  pointsChanged = myPoints !== lastPoints
  autoChanged = autoRate !== lastAuto

  if (pointsChanged || autoChanged) {
    store.clickBurst = true
    setTimeout(() => { store.clickBurst = false }, 200)
  }

  lastPoints = myPoints
  lastAuto = autoRate
}

setInterval(checkChanges, 50)
</script>

<template>
    <div class="game-screen">
      <TeamBar />

      <div class="player-bar" v-if="store.myPlayer && !store._disconnected">
        <span class="player-name">{{ store.myPlayer.name }}</span>
        <span :class="{ 'flash': pointsChanged }">⚔️ Power: {{ store.myPlayer.clickPower?.toFixed(1) || 1.0 }}</span>
        <span :class="{ 'flash': autoChanged }">🤖 Auto: {{ store.getAutoClickRate() }}/s</span>
      </div>

      <div class="player-bar points-bar" v-if="store.myPlayer && !store._disconnected">
        <span class="points-pill" :class="{ 'flash': pointsChanged }">⚡ {{ store.formatNum(store.myPlayer.points) }}</span>
        <span class="player-total">📊 {{ store.formatNum(store.myPlayer.totalPoints) }} total</span>
      </div>

      <ClickButton v-if="!store._disconnected" />

      <div class="tabs" :class="{ 'flash': tabFlash }" v-if="!store._disconnected">
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

      <div class="tab-content" v-if="!store._disconnected">
        <UpgradeShop v-if="activeTab === 'shop'" />
        <Leaderboard v-if="activeTab === 'leaderboard'" />
      </div>

      <div v-if="store._disconnected" class="disconnected-overlay">
        <div class="disconnected-box">
          <div class="disconnected-icon">📡</div>
          <h2>Disconnected from server</h2>
          <p>Your points and upgrades are safe. Reconnect to continue playing.</p>
          <button class="reconnect-btn" @click="store.reconnect()">
            🔌 Reconnect
          </button>
        </div>
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

.points-bar {
  justify-content: center;
  gap: 1rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.points-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 1rem;
  background: var(--accent);
  color: var(--bg);
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.95rem;
  transition: transform 0.1s, color 0.2s, text-shadow 0.2s;
}

.points-pill.flash {
  animation: valuePulse 0.3s ease;
  background: #feca57;
}

.player-total {
  color: var(--text-muted);
  font-size: 0.85rem;
  opacity: 0.6;
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

.disconnected-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
}

.disconnected-box {
  text-align: center;
  background: var(--bg-card);
  border: 2px solid #ef4444;
  border-radius: 16px;
  padding: 3rem 2rem;
  max-width: 400px;
  box-shadow: 0 0 40px rgba(239, 68, 68, 0.2);
}

.disconnected-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: pingPong 2s ease-in-out infinite;
}

@keyframes pingPong {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px) rotate(-10deg); }
  75% { transform: translateX(10px) rotate(10deg); }
}

.disconnected-box h2 {
  color: var(--text);
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
}

.disconnected-box p {
  color: var(--text-muted);
  margin: 0 0 1.5rem;
  font-size: 0.95rem;
}

.reconnect-btn {
  padding: 0.75rem 2rem;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.15s;
}

.reconnect-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 16px rgba(74, 222, 128, 0.4);
}

.reconnect-btn:active {
  transform: translateY(1px) scale(0.95);
}
</style>
