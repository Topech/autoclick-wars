<script setup lang="ts">
import { useGameStore } from '../stores/game'
import { ref } from 'vue'

const store = useGameStore()
const DEFAULT_SERVER = 'https://autoclick-wars.onrender.com'

const nameInput = ref(localStorage.getItem('autoclick_last_name') || '')
const urlInput = ref(localStorage.getItem('autoclick_last_server') || DEFAULT_SERVER)
const isClicking = ref(false)
const particles = ref<Array<{ id: number; x: number; y: number; size: number; duration: number; delay: number }>>([])

for (let i = 0; i < 50; i++) {
  particles.value.push({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * -20,
  })
}

function handleJoin() {
  store.error = null
  isClicking.value = true
  setTimeout(() => isClicking.value = false, 300)

  localStorage.setItem('autoclick_last_name', nameInput.value.trim())
  localStorage.setItem('autoclick_last_server', urlInput.value.trim())

  store.join(nameInput.value.trim(), urlInput.value.trim())
}

function resetServerUrl() {
  urlInput.value = DEFAULT_SERVER
  localStorage.removeItem('autoclick_last_server')
}
</script>

<template>
  <div class="join-screen">
    <!-- Animated background -->
    <div class="bg-gradient"></div>
    <div class="bg-grid"></div>

    <!-- Floating particles -->
    <div v-for="p in particles" :key="p.id" class="particle" :style="{
      left: `${p.x}%`,
      width: `${p.size}px`,
      height: `${p.size}px`,
      animationDuration: `${p.duration}s`,
      animationDelay: `${p.delay}s`,
    }"></div>

    <!-- Floating emojis -->
    <div class="emoji emoji-1">🍄</div>
    <div class="emoji emoji-2">🔫</div>
    <div class="emoji emoji-3">🍄</div>
    <div class="emoji emoji-4">🔫</div>
    <div class="emoji emoji-5">🍄</div>
    <div class="emoji emoji-6">🔫</div>

    <!-- Content -->
    <h1 class="title">
      <span class="title-word" v-for="(word, i) in 'Gnomes vs Toy Soldiers'.split(' ')" :key="i">{{ word }}</span>
    </h1>
    <p class="subtitle animate-in delay-1">Enter the battlefield!</p>

    <div class="name-input-wrap animate-in delay-2">
      <input
        v-model="nameInput"
        type="text"
        placeholder="Enter your name..."
        maxlength="20"
        class="name-input"
        @keyup.enter="handleJoin"
      />
    </div>

    <div class="url-input-wrap animate-in delay-3">
      <input
        v-model="urlInput"
        type="text"
        placeholder="Server URL (http://localhost)"
        maxlength="100"
        class="url-input"
        @keyup.enter="handleJoin"
      />
      <button class="reset-url-btn" @click="resetServerUrl" title="Reset to default server">↺</button>
    </div>

    <button class="join-btn" @click="handleJoin" :class="{ 'joining': store.joining, 'click': isClicking && !store.joining, 'animate-in delay-4': !store.joining }" :disabled="store.joining">
      <span v-if="!store.joining">⚔️ Join ⚔️</span>
      <span v-else class="spinner"></span>
    </button>

    <button v-if="store.joining" class="cancel-btn" @click="store.cancelJoin">Cancel</button>

    <div v-if="store.error" class="error-msg animate-in delay-4">{{ store.error }}</div>
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
  position: relative;
  overflow: hidden;
}

/* Animated gradient background */
.bg-gradient {
  position: absolute;
  inset: -50%;
  background: conic-gradient(from 0deg at 50% 50%,
    #1a1a2e, #16213e, #0f3460, #533483, #e94560, #ff6b6b,
    #feca57, #48dbfb, #0abde3, #1a1a2e
  );
  background-size: 200% 200%;
  animation: gradientSpin 15s linear infinite;
  opacity: 0.15;
}

@keyframes gradientSpin {
  to { transform: rotate(360deg); }
}

/* Grid overlay */
.bg-grid {
  position: absolute;
  inset: -50%;
  background-image:
    linear-gradient(rgba(74, 222, 128, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(74, 222, 128, 0.05) 1px, transparent 1px);
  background-size: 60px 60px;
  animation: gridMove 3s linear infinite;
}

@keyframes gridMove {
  to { transform: translate(60px, 60px); }
}

/* Particles */
.particle {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(74, 222, 128, 0.8), transparent);
  animation: floatParticle linear infinite;
  pointer-events: none;
}

@keyframes floatParticle {
  0% {
    transform: translateY(100vh) scale(0);
    opacity: 0;
  }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% {
    transform: translateY(-100px) scale(1);
    opacity: 0;
  }
}

/* Floating emojis */
.emoji {
  position: absolute;
  font-size: 2rem;
  animation: floatEmoji linear infinite;
  pointer-events: none;
  filter: drop-shadow(0 0 8px rgba(74, 222, 128, 0.5));
}

.emoji-1 { left: 5%; animation-duration: 12s; font-size: 2.5rem; }
.emoji-2 { left: 15%; animation-duration: 15s; animation-delay: -3s; }
.emoji-3 { left: 80%; animation-duration: 14s; animation-delay: -7s; font-size: 2.2rem; }
.emoji-4 { left: 90%; animation-duration: 16s; animation-delay: -5s; }
.emoji-5 { left: 50%; animation-duration: 13s; animation-delay: -9s; font-size: 2.8rem; }
.emoji-6 { left: 35%; animation-duration: 17s; animation-delay: -2s; }

@keyframes floatEmoji {
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  5% { opacity: 0.6; }
  95% { opacity: 0.6; }
  100% {
    transform: translateY(-100px) rotate(360deg);
    opacity: 0;
  }
}

/* Title */
.title {
  font-size: clamp(2rem, 6vw, 3.5rem);
  font-weight: 900;
  text-align: center;
  letter-spacing: -0.02em;
  position: relative;
  z-index: 1;
}

.title-word {
  display: inline-block;
  background: linear-gradient(135deg, #4ade80, #f472b6, #a855f7, #4ade80);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: titleGradient 4s ease infinite;
  filter: drop-shadow(0 0 20px rgba(74, 222, 128, 0.5));
}

.title-word:nth-child(2) {
  background: linear-gradient(135deg, #f472b6, #a855f7, #4ade80, #f472b6);
  animation-delay: -1s;
}

.title-word:nth-child(3) {
  background: linear-gradient(135deg, #a855f7, #4ade80, #f472b6, #a855f7);
  animation-delay: -2s;
}

@keyframes titleGradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.title-word:hover {
  animation: titleShake 0.3s ease infinite;
  filter: drop-shadow(0 0 40px rgba(244, 114, 182, 0.8));
}

@keyframes titleShake {
  0%, 100% { transform: translateX(0) rotate(0); }
  25% { transform: translateX(-3px) rotate(-2deg); }
  75% { transform: translateX(3px) rotate(2deg); }
}

.subtitle {
  font-size: 1.1rem;
  color: var(--text-muted);
  text-align: center;
  position: relative;
  z-index: 1;
}

.url-input-wrap {
  width: 100%;
  max-width: 320px;
  position: relative;
  z-index: 1;
}

.reset-url-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: rgba(74, 222, 128, 0.15);
  color: var(--text-muted);
  font-size: 1rem;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, background 0.2s;
}

.url-input-wrap:hover .reset-url-btn {
  opacity: 1;
}

.reset-url-btn:hover {
  background: rgba(74, 222, 128, 0.3);
  color: var(--text);
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
  transition: border-color 0.2s, box-shadow 0.3s, transform 0.2s;
  text-align: center;
}

.url-input:focus {
  border-color: #4ade80;
  box-shadow:
    0 0 0 3px rgba(74, 222, 128, 0.15),
    0 0 20px rgba(74, 222, 128, 0.3),
    inset 0 0 20px rgba(74, 222, 128, 0.05);
  transform: scale(1.02);
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
  transition: border-color 0.2s, box-shadow 0.3s, transform 0.2s;
  text-align: center;
}

.name-input:focus {
  border-color: #4ade80;
  box-shadow:
    0 0 0 3px rgba(74, 222, 128, 0.15),
    0 0 20px rgba(74, 222, 128, 0.3),
    inset 0 0 20px rgba(74, 222, 128, 0.05);
  transform: scale(1.02);
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
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
  box-shadow:
    0 4px 16px rgba(45, 106, 79, 0.4),
    0 0 40px rgba(74, 222, 128, 0.2);
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.join-btn::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 18px;
  background: linear-gradient(135deg, #4ade80, #f472b6, #a855f7, #4ade80);
  background-size: 300% 300%;
  animation: borderGradient 3s ease infinite;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s;
}

.join-btn:hover::before {
  opacity: 1;
}

@keyframes borderGradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.join-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  transform: translate(-50%, -50%);
  transition: width 0.6s ease, height 0.6s ease;
}

.join-btn:hover::after {
  width: 200px;
  height: 200px;
}

.join-btn:hover {
  transform: translateY(-4px) scale(1.08);
  box-shadow:
    0 8px 32px rgba(45, 106, 79, 0.6),
    0 0 60px rgba(74, 222, 128, 0.4);
}

.join-btn:active {
  transform: translateY(2px) scale(0.95);
  box-shadow: 0 2px 8px rgba(45, 106, 79, 0.3);
  transition-duration: 0.05s;
}

.join-btn.click {
  animation: clickBurst 0.3s ease;
}

@keyframes clickBurst {
  0% { transform: scale(1); }
  30% { transform: scale(0.85) rotate(-3deg); }
  60% { transform: scale(1.15) rotate(2deg); }
  100% { transform: scale(1) rotate(0); }
}

.join-btn.joining {
  background: linear-gradient(135deg, #6b7280, #4b5563);
  cursor: not-allowed;
  box-shadow:
    0 4px 16px rgba(107, 114, 128, 0.4),
    0 0 40px rgba(107, 114, 128, 0.2);
  pointer-events: none;
}

.join-btn.joining::after {
  display: none;
}

.join-btn:disabled {
  opacity: 0.6;
  transition: opacity 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
}

@keyframes pulse {
  0%, 100% {
    box-shadow:
      0 4px 16px rgba(236, 72, 153, 0.4),
      0 0 40px rgba(236, 72, 153, 0.2);
  }
  50% {
    box-shadow:
      0 4px 32px rgba(236, 72, 153, 0.8),
      0 0 80px rgba(236, 72, 153, 0.5);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.connect-hint {
  color: var(--text-muted);
  font-size: 0.9rem;
  animation: fadeInUp 0.3s ease;
}

.cancel-btn {
  padding: 0.5rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  border: 2px solid var(--border);
  border-radius: 12px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
  position: relative;
  z-index: 2;
}

.cancel-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.error-msg {
  color: #f87171;
  font-size: 0.95rem;
  font-weight: 600;
  text-align: center;
  max-width: 320px;
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 12px;
  padding: 0.75rem 1.25rem;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Entrance animations */
.animate-in {
  opacity: 0;
  animation: slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }
.delay-3 { animation-delay: 0.3s; }
.delay-4 { animation-delay: 0.4s; }

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
