import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'ws://localhost:3001'

export type Team = 'gnomes' | 'soldiers'

export interface Player {
  id: string
  name: string
  team: Team
  points: number
  totalPoints: number
  totalClicks: number
  upgrades: Record<string, number>
  lastSeen: number
  createdAt: number
}

export interface GameState {
  gnomesScore: number
  soldiersScore: number
  players: Map<string, Player>
}

export interface LeaderboardEntry {
  id: string
  name: string
  team: Team
  totalPoints: number
  totalClicks: number
  rank: number
}

export interface UpgradeDef {
  id: string
  name: string
  description: string
  team: Team
  baseCost: number
  costMultiplier: number
  effect: (level: number) => number
  category: 'click' | 'auto' | 'crit' | 'team'
}

export const useGameStore = defineStore('game', () => {
  const ws = ref<WebSocket | null>(null)
  const connected = ref(false)
  const myPlayer = ref<Player | null>(null)
  const gameState = ref<GameState | null>(null)
  const leaderboard = ref<LeaderboardEntry[]>([])
  const error = ref<string | null>(null)
  const playerName = ref('')
  const clickFlash = ref(false)
  const lastScores = ref({ gnomes: 0, soldiers: 0 })
  const scoreChange = ref<'up' | 'down' | null>(null)

  function connect() {
    disconnect()
    const url = SERVER_URL.replace(/^http/, 'ws')
    const socket = new WebSocket(url)

    socket.onopen = () => {
      connected.value = true
      error.value = null
    }

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        handleMessage(msg)
      } catch {
        // ignore parse errors
      }
    }

    socket.onclose = () => {
      connected.value = false
      setTimeout(connect, 2000)
    }

    socket.onerror = () => {
      error.value = 'Connection failed'
    }

    ws.value = socket
  }

  function disconnect() {
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
  }

  function handleMessage(msg: any) {
    switch (msg.type) {
      case 'joined':
        myPlayer.value = msg.player
        gameState.value = msg.gameState
        break

      case 'game_state':
        gameState.value = msg.gameState
        break

      case 'score_update':
        if (msg.gameState) {
          lastScores.value.gnomes = gameState.value?.gnomesScore || 0
          lastScores.value.soldiers = gameState.value?.soldiersScore || 0
          gameState.value = msg.gameState
          const newGnomes = msg.gameState.gnomesScore
          const newSoldiers = msg.gameState.soldiersScore
          if (newGnomes > lastScores.value.gnomes || newSoldiers > lastScores.value.soldiers) {
            scoreChange.value = 'up'
            setTimeout(() => { scoreChange.value = null }, 300)
          }
        }
        break

      case 'click_result':
        if (msg.gameState) {
          gameState.value = msg.gameState
          triggerClickFlash()
        }
        break

      case 'upgrade_bought':
        if (gameState.value) gameState.value = msg.gameState
        break

      case 'upgrade_failed':
        error.value = msg.reason || 'Upgrade failed'
        setTimeout(() => { error.value = null }, 3000)
        break

      case 'leaderboard':
        leaderboard.value = (msg.entries || []).map((e: any, i: number) => ({
          id: e.id,
          name: e.name,
          team: e.team,
          totalPoints: e.totalPoints,
          totalClicks: e.totalClicks,
          rank: i + 1,
        }))
        break

      case 'player_joined':
        if (gameState.value && gameState.value.players) {
          const p = msg.player as Player
          gameState.value.players.set(p.id, p)
        }
        break
    }
  }

  function triggerClickFlash() {
    clickFlash.value = true
    setTimeout(() => { clickFlash.value = false }, 200)
  }

  function join(team: Team) {
    const id = crypto.randomUUID()
    const name = playerName.value.trim() || `${team.slice(0, 3)}_${id.slice(0, 4)}`
    if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
      connect()
      setTimeout(() => sendMsg({ type: 'join', id, name, team }), 500)
    } else {
      sendMsg({ type: 'join', id, name, team })
    }
  }

  function sendClick() {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: 'click' }))
    }
  }

  function purchaseUpgrade(upgradeId: string) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: 'buy_upgrade', upgradeId }))
    }
  }

  function getLeaderboard() {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: 'get_leaderboard' }))
    }
  }

  function sendMsg(msg: any) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(msg))
    }
  }

  const myTeam = computed(() => myPlayer.value?.team || null)
  const teamScores = computed(() => ({
    gnomes: gameState.value?.gnomesScore || 0,
    soldiers: gameState.value?.soldiersScore || 0,
  }))
  const totalScore = computed(() => (teamScores.value.gnomes + teamScores.value.soldiers) || 1)

  function formatNum(n: number): string {
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
    return Math.floor(n).toString()
  }

  function getUpgradeCost(baseCost: number, multiplier: number, level: number): number {
    return Math.floor(baseCost * Math.pow(multiplier, level))
  }

  return {
    connected, myPlayer, gameState, leaderboard, error, playerName, clickFlash, scoreChange,
    join, sendClick, purchaseUpgrade, getLeaderboard, connect, disconnect,
    myTeam, teamScores, totalScore, formatNum, getUpgradeCost,
  }
})
