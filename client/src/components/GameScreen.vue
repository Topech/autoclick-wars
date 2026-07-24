<script setup lang="ts">
import { ref } from 'vue'
import TeamBar from './TeamBar.vue'
import ClickButton from './ClickButton.vue'
import UpgradeShop from './UpgradeShop.vue'
import Leaderboard from './Leaderboard.vue'
import { useGameStore } from '../stores/game'

const store = useGameStore()
const activeTab = ref<'shop' | 'leaderboard'>('shop')
</script>

<template>
  <div class="game-screen">
    <TeamBar />

    <div class="stats-bar" v-if="store.myPlayer">
      <span>⚡ {{ store.formatNum(store.myPlayer.totalPoints) }} pts</span>
      <span>👆 Power: {{ store.myPlayer.points }}</span>
      <span>🤖 Auto: {{ store.myPlayer.totalClicks }}/s</span>
    </div>

    <ClickButton />

    <div class="tabs">
      <button
        class="tab"
        :class="{ active: activeTab === 'shop' }"
        @click="activeTab = 'shop'"
      >
        🛒 Shop
      </button>
      <button
        class="tab"
        :class="{ active: activeTab === 'leaderboard' }"
        @click="activeTab = 'leaderboard'"
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
}

.tabs {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
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
}

.tab.active {
  border-color: var(--accent);
  background: rgba(82, 183, 136, 0.15);
  color: var(--accent);
}

.tab-content {
  flex: 1;
  overflow-y: auto;
}
</style>
