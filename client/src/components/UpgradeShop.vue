<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '../stores/game'

const store = useGameStore()

interface UpgradeDef {
  id: string
  name: string
  description: string
  team: 'gnomes' | 'soldiers'
  baseCost: number
  costMultiplier: number
  effect: (level: number) => number
  category: 'click' | 'auto' | 'crit' | 'team'
}

const upgrades: UpgradeDef[] = [
  { id: 'mushroom', name: '🍄 Mushroom Stool', description: '+1 auto-clicker', team: 'gnomes', baseCost: 10, costMultiplier: 1.15, effect: (l) => l, category: 'auto' },
  { id: 'beer', name: '🍺 Beer Chug', description: '×2 click power', team: 'gnomes', baseCost: 50, costMultiplier: 1.15, effect: (l) => Math.pow(2, l), category: 'click' },
  { id: 'hat', name: '🎩 Hat Collection', description: '+5% per hat', team: 'gnomes', baseCost: 100, costMultiplier: 1.15, effect: (l) => 1 + l * 0.05, category: 'team' },
  { id: 'army', name: '🏰 Gnome Army', description: 'Massive auto-clicker boost', team: 'gnomes', baseCost: 500, costMultiplier: 1.15, effect: (l) => l * 10, category: 'auto' },
  { id: 'fart', name: '💨 Epic Fart Noise', description: '10% crit chance for 30s', team: 'gnomes', baseCost: 1000, costMultiplier: 1.15, effect: (l) => l * 0.1, category: 'crit' },
  { id: 'ruler', name: '📏 Plastic Ruler', description: '+1 auto-clicker', team: 'soldiers', baseCost: 10, costMultiplier: 1.15, effect: (l) => l, category: 'auto' },
  { id: 'drill', name: '⚙️ Drill Sergeant', description: '×2 click power', team: 'soldiers', baseCost: 50, costMultiplier: 1.15, effect: (l) => Math.pow(2, l), category: 'click' },
  { id: 'formation', name: '📐 Battle Formation', description: '+5% per formation', team: 'soldiers', baseCost: 100, costMultiplier: 1.15, effect: (l) => 1 + l * 0.05, category: 'team' },
  { id: 'tank', name: '🛡️ Tank Division', description: 'Massive auto-clicker boost', team: 'soldiers', baseCost: 500, costMultiplier: 1.15, effect: (l) => l * 10, category: 'auto' },
  { id: 'airhorn', name: '📢 Air Horn Rally', description: '10% crit chance for 30s', team: 'soldiers', baseCost: 1000, costMultiplier: 1.15, effect: (l) => l * 0.1, category: 'crit' },
]

const bulkOptions = [1, 10, 100]
const selectedBulk = ref(1)

function getCost(upgrade: UpgradeDef): number {
  const owned = store.myPlayer?.upgrades?.[upgrade.id] || 0
  return store.getUpgradeCost(upgrade.baseCost, upgrade.costMultiplier, owned)
}

function canAfford(upgrade: UpgradeDef): boolean {
  const cost = getCost(upgrade)
  return (store.myPlayer?.points || 0) >= cost
}

function buy(upgrade: UpgradeDef) {
  store.purchaseUpgrade(upgrade.id)
}
</script>

<template>
  <div class="upgrade-shop">
    <div class="bulk-selector">
      <button
        v-for="opt in bulkOptions"
        :key="opt"
        class="bulk-btn"
        :class="{ active: selectedBulk === opt }"
        @click="selectedBulk = opt"
      >
        ×{{ opt }}
      </button>
    </div>

    <div class="upgrade-grid">
      <div
        v-for="u in upgrades"
        :key="u.id"
        class="upgrade-card"
        :class="{
          [u.team]: true,
          owned: (store.myPlayer?.upgrades?.[u.id] || 0) > 0,
          affordable: canAfford(u),
        }"
      >
        <div class="upgrade-header">
          <span class="upgrade-name">{{ u.name }}</span>
          <span class="upgrade-owned">×{{ store.myPlayer?.upgrades?.[u.id] || 0 }}</span>
        </div>
        <p class="upgrade-desc">{{ u.description }}</p>
        <button
          class="buy-btn"
          :disabled="!canAfford(u)"
          @click="buy(u)"
        >
          {{ store.formatNum(getCost(u)) }} pts
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upgrade-shop {
  padding: 1rem;
}

.bulk-selector {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.bulk-btn {
  padding: 0.4rem 1rem;
  border: 2px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text);
  cursor: pointer;
  font-weight: 700;
  transition: all 0.15s;
}

.bulk-btn.active {
  border-color: var(--accent);
  background: rgba(82, 183, 136, 0.2);
  color: var(--accent);
}

.upgrade-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.upgrade-card {
  padding: 1rem;
  border-radius: 12px;
  background: var(--bg-card);
  border: 2px solid var(--border);
  transition: all 0.15s;
}

.upgrade-card.gnome:hover {
  border-color: var(--accent-gnome);
}

.upgrade-card.soldier:hover {
  border-color: var(--accent-soldier);
}

.upgrade-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.upgrade-name {
  font-weight: 700;
  font-size: 1rem;
}

.upgrade-owned {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.upgrade-desc {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}

.buy-btn {
  width: 100%;
  padding: 0.6rem;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
}

.buy-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
