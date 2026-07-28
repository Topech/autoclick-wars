<script setup lang="ts">
const url = 'https://github.com/Topech/autoclick-wars'
const logoUrl = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg'
</script>

<template>
  <a :href="url" target="_blank" rel="noopener noreferrer" class="github-link" title="GitHub repo">
    <span class="github-backdrop">
      <img :src="logoUrl" alt="GitHub" width="28" height="28" />
    </span>
  </a>
</template>

<style scoped>
.github-link {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 10;
}

.github-backdrop {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  color: #333;
  transition: transform 0.2s, background 0.2s;
}

.github-backdrop:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.15);
}

.github-backdrop img {
  width: 28px;
  height: 28px;
}
</style>
