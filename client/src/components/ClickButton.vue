<script setup lang="ts">
import { useGameStore } from '../stores/game'

const store = useGameStore()

function handleClick() {
  store.sendClick()
}
</script>

<template>
  <div class="click-area" @click="handleClick">
    <div class="click-btn">
      <span v-if="store.myPlayer?.team === 'gnomes'" class="btn-emoji">🍄</span>
      <span v-else class="btn-emoji">🔫</span>
      <span class="btn-text">CLICK!</span>
    </div>
    <p v-if="store.clickFlash" class="flash-text">{{ store.lastClickPoints > 0 ? '+' : '' }}{{ Math.floor(store.lastClickPoints) }}</p>
  </div>
</template>

<style scoped>
.click-area {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.click-btn {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  font-size: 1.2rem;
  font-weight: 800;
  color: white;
  transition: transform 0.1s, box-shadow 0.1s;
  box-shadow: var(--shadow);
}

.click-btn:hover {
  transform: scale(1.05);
}

.click-btn:active {
  transform: scale(0.95);
}

.gnome .click-btn {
  background: linear-gradient(135deg, #2d6a4f, #52b788);
}

.soldier .click-btn {
  background: linear-gradient(135deg, #9b2226, #e63946);
}

.btn-emoji {
  font-size: 3rem;
}

.flash-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2rem;
  font-weight: 900;
  color: var(--gold);
  animation: fly-up 0.5s ease-out forwards;
}

@keyframes fly-up {
  to {
    opacity: 0;
    transform: translate(-50%, -150%);
  }
}
</style>
