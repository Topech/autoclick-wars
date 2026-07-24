<script setup lang="ts">
import { useGameStore } from '../stores/game'

const store = useGameStore()
const nameInput = store.playerName

function selectTeam(team: 'gnomes' | 'soldiers') {
  store.join(team)
}
</script>

<template>
  <div class="join-screen">
    <h1 class="title">Gnomes vs Toy Soldiers</h1>
    <p class="subtitle">Choose your team and enter the battlefield!</p>

    <div class="name-input-wrap">
      <input
        v-model="nameInput"
        type="text"
        placeholder="Enter your name..."
        maxlength="20"
        class="name-input"
      />
    </div>

    <div class="team-cards">
      <button
        class="team-card gnome-card"
        @click="selectTeam('gnomes')"
      >
        <span class="team-emoji">🍄</span>
        <span class="team-name">Gnomes</span>
        <span class="team-desc">Forest creatures of mischief</span>
      </button>

      <button
        class="team-card soldier-card"
        @click="selectTeam('soldiers')"
      >
        <span class="team-emoji">🎖️</span>
        <span class="team-name">Toy Soldiers</span>
        <span class="team-desc">Tiny troops, mighty clicks</span>
      </button>
    </div>

    <p v-if="!store.connected" class="connect-hint">
      Connecting to server...
    </p>
  </div>
</template>

<style scoped>
.join-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  gap: 1.5rem;
}

.title {
  font-size: clamp(2rem, 6vw, 3.5rem);
  font-weight: 900;
  text-align: center;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #4ade80, #f472b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.1rem;
  color: var(--text-muted);
  text-align: center;
}

.name-input-wrap {
  width: 100%;
  max-width: 320px;
}

.name-input {
  width: 100%;
  padding: 0.8rem 1.2rem;
  font-size: 1.1rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  background: var(--bg-card);
  color: var(--text);
  outline: none;
  transition: border-color 0.2s;
  text-align: center;
}

.name-input:focus {
  border-color: var(--accent);
}

.team-cards {
  display: flex;
  gap: 1.5rem;
  width: 100%;
  max-width: 600px;
  flex-wrap: wrap;
  justify-content: center;
}

.team-card {
  flex: 1;
  min-width: 240px;
  max-width: 300px;
  padding: 2rem 1.5rem;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.15s, box-shadow 0.15s;
  color: white;
}

.team-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.3);
}

.team-card:active {
  transform: scale(0.97);
}

.gnome-card {
  background: linear-gradient(135deg, #2d6a4f, #52b788);
  box-shadow: 0 4px 16px rgba(45, 106, 79, 0.4);
}

.soldier-card {
  background: linear-gradient(135deg, #9b2226, #e63946);
  box-shadow: 0 4px 16px rgba(155, 34, 38, 0.4);
}

.team-emoji {
  font-size: 3rem;
}

.team-name {
  font-size: 1.5rem;
  font-weight: 800;
}

.team-desc {
  font-size: 0.9rem;
  opacity: 0.85;
}

.connect-hint {
  color: var(--text-muted);
  font-size: 0.9rem;
}
</style>
