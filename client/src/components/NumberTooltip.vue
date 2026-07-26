<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  value: number | string
}

const props = defineProps<Props>()

// Auto-detect if number is shortened (formatNum only shortens >= 1000)
const isShortened = computed(() => {
  const num = typeof props.value === 'number' ? props.value : parseFloat(props.value)
  return !isNaN(num) && num >= 1000
})
</script>

<template>
  <span class="tooltip-wrapper" v-if="isShortened">
    <slot />
    <span class="tooltip">{{ typeof props.value === 'number' ? Math.floor(props.value).toLocaleString() : props.value }}</span>
  </span>
  <span v-else>
    <slot />
  </span>
</template>

<style scoped>
.tooltip-wrapper {
  position: relative;
  cursor: default;
}

.tooltip {
  display: none;
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  z-index: 100;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.tooltip-wrapper:hover .tooltip {
  display: block;
}
</style>
