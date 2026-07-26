<script setup lang="ts">
interface Props {
  name: string
  team: 'gnomes' | 'soldiers'
}

defineProps<Props>()
</script>

<template>
  <span class="player-avatar-row">
    <span class="avatar">{{ team === 'gnomes' ? '🍄' : '🔫' }}</span>
    <span class="name">{{ name }}</span>
  </span>
</template>

<style scoped>
.player-avatar-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  line-height: 1;
  background: var(--bg-card);
  border: 2px solid var(--border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.name {
  font-weight: 700;
  color: var(--text);
}
</style>
