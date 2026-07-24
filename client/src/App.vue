<script setup lang="ts">
import { useGameStore } from './stores/game'
import JoinScreen from './components/JoinScreen.vue'
import GameScreen from './components/GameScreen.vue'

const store = useGameStore()
store.connect()
</script>

<template>
  <JoinScreen v-if="!store.myPlayer" />
  <GameScreen v-else />
</template>
