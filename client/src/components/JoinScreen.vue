<script setup lang="ts">
import { useGameStore } from '../stores/game'
import { ref } from 'vue'

const STORAGE_KEY = 'autoclick_server_url'
const store = useGameStore()
const nameInput = ref('')
const urlInput = ref(localStorage.getItem(STORAGE_KEY) || 'http://localhost')

function handleJoin() {
  const raw = urlInput.value.trim().replace(/\/+$/, '')
  let wsUrl: string
  if (raw.startsWith('ws')) {
    wsUrl = raw.replace(/^http/, 'ws')
  } else {
    wsUrl = raw.replace(/^http/, 'ws') + ':3001'
  }
  localStorage.setItem(STORAGE_KEY, urlInput.value.trim())
  store.join(nameInput.value.trim(), wsUrl)
}
</script>

<template>
  <div class="join-screen">
    <h1 class="title">Gnomes vs Toy Soldiers</h1>
    <p class="subtitle">Enter the battlefield!</p>

    <div class="name-input-wrap">
      <input
        v-model="nameInput"
        type="text"
        placeholder="Enter your name..."
        maxlength="20"
        class="name-input"
        @keyup.enter="handleJoin"
      />
    </div>

    <div class="url-input-wrap">
      <input
        v-model="urlInput"
        type="text"
        placeholder="Server URL (http://localhost)"
        maxlength="100"
        class="url-input"
      />
    </div>

    <button class="join-btn" @click="handleJoin">Join</button>

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

.url-input-wrap {
  width: 100%;
  max-width: 320px;
}

.url-input {
  width: 100%;
  padding: 0.6rem 1.2rem;
  font-size: 0.95rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  background: var(--bg-card);
  color: var(--text);
  outline: none;
  transition: border-color 0.2s;
  text-align: center;
}

.url-input:focus {
  border-color: var(--accent);
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

.join-btn {
  padding: 1rem 3rem;
  font-size: 1.2rem;
  font-weight: 800;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #4ade80, #2d6a4f);
  color: white;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 4px 16px rgba(45, 106, 79, 0.4);
}

.join-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(45, 106, 79, 0.5);
}

.join-btn:active {
  transform: scale(0.97);
}

.connect-hint {
  color: var(--text-muted);
  font-size: 0.9rem;
}
</style>
