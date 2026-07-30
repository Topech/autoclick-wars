<script setup lang="ts">
import { useGameStore } from '../stores/game'
import { ref } from 'vue'

const store = useGameStore()
const isClicking = ref(false)
const shakeIntensity = ref(0)
const particles = ref<Array<{ id: number; x: number; y: number; angle: number; speed: number; size: number; color: string }>>([])
const lastClickPos = ref({ x: 0, y: 0 })
const flashOffset = ref({ x: 0, y: 0 })
const flashSize = ref(1.5)
const flashDuration = ref(2)

// 15 edge positions around the button (overlapping the edge)
const EDGE_POSITIONS = [
  { x: 0, y: -95 },    // top
  { x: 65, y: -65 },   // top-right
  { x: 95, y: -30 },   // right-top
  { x: 95, y: 10 },    // right-mid
  { x: 95, y: 55 },    // right-bottom
  { x: 65, y: 85 },    // bottom-right
  { x: 0, y: 95 },     // bottom
  { x: -65, y: 85 },   // bottom-left
  { x: -95, y: 55 },   // left-bottom
  { x: -95, y: 10 },   // left-mid
  { x: -95, y: -30 },  // left-top
  { x: -65, y: -65 },  // top-left
  { x: 45, y: -85 },   // top-right-inner
  { x: -45, y: -85 },  // top-left-inner
  { x: 0, y: -75 },    // top-center
]

function handleClick(e: MouseEvent) {
  isClicking.value = true
  shakeIntensity.value = 12
  lastClickPos.value = { x: e.clientX, y: e.clientY }

  for (let i = 0; i < 20; i++) {
    const angle = (Math.PI * 2 * i) / 20 + (Math.random() - 0.5) * 0.5
    const speed = 3 + Math.random() * 5
    particles.value.push({
      id: Date.now() + i,
      x: e.clientX,
      y: e.clientY,
      angle,
      speed,
      size: 4 + Math.random() * 8,
      color: ['#4ade80', '#f472b6', '#a855f7', '#feca57', '#ff6b6b', '#48dbfb'][Math.floor(Math.random() * 6)],
    })
  }

  const pos = EDGE_POSITIONS[Math.floor(Math.random() * EDGE_POSITIONS.length)]
  flashOffset.value = { x: pos.x, y: pos.y }
  flashSize.value = 1.2 + Math.random() * 1.2
  flashDuration.value = 1 + Math.random() * 2

  store.sendClick()

  setTimeout(() => { isClicking.value = false }, 150)
  setTimeout(() => { shakeIntensity.value = 0 }, 200)
  setTimeout(() => { cleanupParticles() }, 3000)
}

function cleanupParticles() {
  particles.value = []
}
</script>

<template>
  <div class="click-area" @click="handleClick">
    <div class="particle-container">
      <div
        v-for="p in particles"
        :key="p.id"
        class="particle"
        :style="{
          left: p.x - p.size / 2 + 'px',
          top: p.y - p.size / 2 + 'px',
          width: p.size + 'px',
          height: p.size + 'px',
          background: p.color,
          '--angle': p.angle + 'rad',
          '--speed': p.speed + 'px',
        }"
      ></div>
    </div>

    <div class="click-btn-casing">
      <div class="floor-shadow"></div>
      <div class="click-btn-wrapper" :style="{ animationDuration: shakeIntensity > 0 ? '0.1s' : '0s', animationIterationCount: shakeIntensity > 0 ? 'infinite' : '1' }">
        <div
          class="click-btn"
          :class="{ clicking: isClicking, gnome: store.myPlayer?.team === 'gnomes', soldier: store.myPlayer?.team === 'soldiers' }"
          :style="{ '--shake': shakeIntensity + 'px' }"
        >
        <span class="btn-glow"></span>
        <span v-if="store.myPlayer?.team === 'gnomes'" class="btn-emoji">🍄</span>
        <span v-else class="btn-emoji">🔫</span>
        <span class="btn-text">CLICK!</span>
        </div>
      </div>
    </div>

    <span
      v-for="tick in store.clickTicks"
      :key="tick.id"
      class="click-tick edge-float"
      :style="{ left: 'calc(50% + ' + tick.pos.x + 'px)', top: 'calc(50% + ' + tick.pos.y + 'px)' }"
    >+{{ Math.floor(tick.value) }}</span>
  </div>
</template>

<style scoped>
.click-area {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  position: relative;
}

.flash-text {
  position: absolute;
  font-weight: 900;
  color: #feca57;
  text-shadow: 0 0 20px rgba(254, 202, 87, 0.8), 0 0 40px rgba(254, 202, 87, 0.4);
  animation: floatEdge var(--duration) ease-out forwards;
  pointer-events: none;
}

@keyframes floatEdge {
  0% {
    transform: scale(0.3);
    opacity: 1;
  }
  20% {
    transform: scale(1.3);
    opacity: 1;
  }
  100% {
    transform: translateY(-40px) scale(0.6);
    opacity: 0;
  }
}

.particle-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 100;
}

.particle {
  position: absolute;
  border-radius: 50%;
  animation: particleBurst 0.6s ease-out forwards;
}

@keyframes particleBurst {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(calc(cos(var(--angle)) * var(--speed) * 3), calc(sin(var(--angle)) * var(--speed) * 3)) scale(0);
    opacity: 0;
  }
}

.click-btn-casing {
  width: 240px;
  height: 240px;
  border-radius: 50%;
  background: linear-gradient(180deg, #1e2a3a 0%, #162030 50%, #111927 100%);
  border: 1px solid #2a3a4e;
  box-shadow:
    inset 0 6px 16px rgba(0,0,0,0.7),
    inset 0 -2px 8px rgba(255,255,255,0.03),
    inset 4px 4px 12px rgba(255,255,255,0.02),
    inset -4px 2px 8px rgba(0,0,0,0.2),
    0 6px 24px rgba(0,0,0,0.5),
    0 3px 0 #0d1520;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.click-btn-casing::before {
  content: '';
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 30%, rgba(0,0,0,0.1) 100%);
  pointer-events: none;
}

.click-btn-casing::after {
  content: '';
  position: absolute;
  inset: 12px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.03);
  box-shadow: inset 0 3px 6px rgba(0,0,0,0.3);
  pointer-events: none;
}

.click-btn-casing .floor-shadow {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 140px;
  height: 24px;
  background: radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%);
  pointer-events: none;
}

.click-btn-wrapper {
  position: relative;
  animation: shakeBtn 0.1s linear infinite;
  animation-iteration-count: 1;
  top: -24px;
}

@keyframes shakeBtn {
  0%, 100% { transform: translate(0, 0) rotate(0); }
  25% { transform: translate(calc(var(--shake) * -0.5), calc(var(--shake) * 0.3)) rotate(calc(var(--shake) * -0.1deg)); }
  50% { transform: translate(calc(var(--shake) * 0.3), calc(var(--shake) * -0.5)) rotate(calc(var(--shake) * 0.15deg)); }
  75% { transform: translate(calc(var(--shake) * -0.4), calc(var(--shake) * 0.2)) rotate(calc(var(--shake) * -0.05deg)); }
}

.click-btn {
  width: 160px;
  height: 160px;
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
  position: relative;
  overflow: hidden;
  transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
  box-shadow:
    var(--shadow),
    0 8px 32px rgba(0, 0, 0, 0.25),
    inset 0 -4px 12px rgba(0, 0, 0, 0.15);
}

.click-btn.gnome,
.click-btn.soldier {
  background: linear-gradient(180deg, #c45a5a 0%, #b44a4a 50%, #a33e3e 100%);
  border: none;
  box-shadow:
    var(--shadow),
    inset 0 2px 0 rgba(255,255,255,0.15),
    inset 0 -4px 0 rgba(0,0,0,0.15),
    0 6px 0 #7a2e2e,
    0 8px 16px rgba(0, 0, 0, 0.3);
  transition: box-shadow 0.1s ease;
}

.click-btn.gnome:hover,
.click-btn.soldier:hover {
  transform: translateY(4px);
  box-shadow:
    var(--shadow),
    inset 0 2px 0 rgba(255,255,255,0.15),
    inset 0 -4px 0 rgba(0,0,0,0.15),
    0 2px 0 #7a2e2e,
    0 3px 6px rgba(0, 0, 0, 0.3);
}

.btn-glow {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: conic-gradient(from 0deg at 50% 50%, #4ade80, #f472b6, #a855f7, #feca57, #ff6b6b, #48dbfb, #4ade80);
  background-size: 200% 200%;
  animation: glowSpin 3s linear infinite;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: -1;
}

.click-btn::before {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  z-index: -1;
  background: transparent;
}

.click-btn.clicking {
  animation: clickPulse 0.15s ease;
}

@keyframes clickPulse {
  0% { transform: scale(1); }
  30% { transform: scale(0.82) rotate(-5deg); }
  60% { transform: scale(1.15) rotate(3deg); }
  100% { transform: scale(1) rotate(0); }
}

.click-btn.clicking::after {
  content: '';
  position: absolute;
  inset: -20px;
  border-radius: 50%;
  border: 3px solid rgba(74, 222, 128, 0.6);
  animation: ringExpand 0.4s ease-out forwards;
}

@keyframes ringExpand {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
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

.click-tick {
  position: absolute;
  transform: translate(-50%, -50%);
  font-size: 1.2rem;
  font-weight: 900;
  color: #feca57;
  text-shadow: 0 0 10px rgba(254, 202, 87, 0.6), 0 0 20px rgba(254, 202, 87, 0.3);
  animation: clickFloat 1s ease-out forwards;
  pointer-events: none;
}

@keyframes clickFloat {
  0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
  20% { transform: translate(-50%, calc(-50% - 5px)) scale(1.3); opacity: 1; }
  80% { transform: translate(-50%, calc(-50% - 20px)) scale(1); opacity: 1; }
  100% { transform: translate(-50%, calc(-50% - 35px)) scale(0.7); opacity: 0; }
}
</style>
