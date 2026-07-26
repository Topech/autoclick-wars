import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const DEFAULT_SERVER = 'http://localhost:3001'
const STORAGE_KEY = 'autoclick_server_url'

function getServerUrl(): string {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_SERVER
}

function setServerUrl(url: string) {
  localStorage.setItem(STORAGE_KEY, url)
}

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
  clickPower?: number
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
  const upgrades = ref<UpgradeDef[]>([])
  const error = ref<string | null>(null)
  const playerName = ref('')
  const lastClickPoints = ref(0)
  const clickFlash = ref(false)
  const lastScores = ref({ gnomes: 0, soldiers: 0 })
  const scoreChange = ref<'up' | 'down' | null>(null)
  const clickBurst = ref(false)
  const valueFlash = ref(0)
  const contributions = ref<Array<{ id: number; team: 'gnomes' | 'soldiers'; increase: number }>>([])
  const _joining = ref(false)
  const _intentionalDisconnect = ref(false)
  const _disconnected = ref(false)
  let _joinTimeoutId: ReturnType<typeof setTimeout> | null = null
  let _lastMessageTime = Date.now()
  let _heartbeatCheck: ReturnType<typeof setInterval> | null = null

  const joining = computed(() => _joining.value || (connected.value && !myPlayer.value))

  function triggerClickBurst() {
    clickBurst.value = true
    valueFlash.value = 1
    setTimeout(() => { clickBurst.value = false }, 200)
    setTimeout(() => { valueFlash.value = 0 }, 300)
  }

  function connect(url?: string) {
    disconnect()
    const serverUrl = url || getServerUrl()
    const wsUrl = serverUrl
      .replace(/^http/, 'ws')
      .replace(/^https/, 'wss')
    const socket = new WebSocket(wsUrl)

    _lastMessageTime = Date.now()

    const connectTimeoutId = setTimeout(() => {
      if (!connected.value) {
        _disconnected.value = true
        error.value = 'Cannot reach server'
        ws.value?.close()
        ws.value = null
      }
    }, 5000)

    socket.onopen = () => {
      connected.value = true
      error.value = null
      _intentionalDisconnect.value = false
      _disconnected.value = false
      clearTimeout(connectTimeoutId)
      // Clear join timeout on successful connect
      if (_joinTimeoutId) {
        clearTimeout(_joinTimeoutId)
        _joinTimeoutId = null
      }
      // Start heartbeat check - server broadcasts every 100ms
      _heartbeatCheck = setInterval(() => {
        if (connected.value) {
          const elapsed = Date.now() - _lastMessageTime
          if (elapsed > 5000) {
            connected.value = false
            _disconnected.value = true
            error.value = 'Lost connection to server'
            ws.value?.close()
            ws.value = null
          }
        }
      }, 1000)
    }

    socket.onmessage = (event) => {
      _lastMessageTime = Date.now()
      try {
        const msg = JSON.parse(event.data)
        handleMessage(msg)
      } catch {
        // ignore parse errors
      }
    }

    console.log('[WS] Connecting to', wsUrl)

    socket.onclose = () => {
      if (_heartbeatCheck) clearInterval(_heartbeatCheck)
      connected.value = false
      if (!_intentionalDisconnect.value) {
        _disconnected.value = true
        error.value = 'Disconnected from server'
        setTimeout(connect, 2000)
      }
    }

    socket.onerror = () => {
      error.value = 'Connection failed'
    }

    // Short timeout for ongoing reconnects (not first connect)
    if (!_joining.value) {
      const reconnectTimeoutId = setTimeout(() => {
        if (!connected.value && ws.value) {
          error.value = 'Reconnect timed out'
          ws.value.close()
          ws.value = null
        }
      }, 5000)

      socket.addEventListener('open', () => {
        clearTimeout(reconnectTimeoutId)
      }, { once: true })
    }

    ws.value = socket
  }

  function disconnect() {
    _intentionalDisconnect.value = true
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
  }

  function startHeartbeat() {
    stopHeartbeat()
    _pingInterval = setInterval(() => {
      if (ws.value?.readyState === WebSocket.OPEN) {
        ws.value.send(JSON.stringify({ type: 'ping' }))
        _pongTimeout = setTimeout(() => {
          // No pong received, connection is dead - force disconnect state
          stopHeartbeat()
          connected.value = false
          _disconnected.value = true
          error.value = 'Lost connection to server'
          ws.value?.close()
          ws.value = null
          setTimeout(connect, 2000)
        }, 3000)
      }
    }, 15000)
  }

  function stopHeartbeat() {
    if (_pingInterval) {
      clearInterval(_pingInterval)
      _pingInterval = null
    }
    if (_pongTimeout) {
      clearTimeout(_pongTimeout)
      _pongTimeout = null
    }
  }

  function reconnect() {
    _disconnected.value = false
    error.value = null
    connect()
    // Rejoin after connecting
    setTimeout(() => {
      if (myPlayer.value && ws.value?.readyState === WebSocket.OPEN) {
        const id = localStorage.getItem('autoclick_player_id') || myPlayer.value.id
        const name = localStorage.getItem('autoclick_last_name') || myPlayer.value.name
        ws.value.send(JSON.stringify({ type: 'join', id, name }))
      }
    }, 500)
  }

  function handleMessage(msg: any) {
    switch (msg.type) {
      case 'join_error':
        _joining.value = false
        error.value = msg.error || 'Join failed'
        setTimeout(() => { error.value = null }, 5000)
        break

      case 'joined':
        myPlayer.value = msg.player
        gameState.value = msg.gameState
        _joining.value = false
        if (ws.value?.readyState === WebSocket.OPEN) {
          ws.value.send(JSON.stringify({ type: 'get_upgrades' }))
        }
        break

      case 'game_state':
        gameState.value = msg.gameState
        if (msg.players && myPlayer.value) {
          const playerMap = new Map<string, Player>()
          for (const p of msg.players as any[]) {
            playerMap.set(p.id, p)
          }
          // Update my player data from server
          const myServerPlayer = msg.players.find((p: any) => p.id === myPlayer.value!.id)
          if (myServerPlayer) {
            myPlayer.value = { ...myPlayer.value, ...myServerPlayer } as Player
          }
          gameState.value = {
            gnomesScore: gameState.value?.gnomesScore || 0,
            soldiersScore: gameState.value?.soldiersScore || 0,
            players: playerMap,
          }
        }
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
          if (msg.player) {
            myPlayer.value = { ...myPlayer.value, ...msg.player } as Player
          }
          lastClickPoints.value = msg.points || 0
          triggerClickFlash()
          triggerClickBurst()
        }
        break

      case 'upgrade_bought':
        if (gameState.value) gameState.value = msg.gameState
        if (msg.player) {
          myPlayer.value = { ...myPlayer.value, ...msg.player } as Player
        }
        break

      case 'upgrades':
        upgrades.value = (msg.upgrades || []) as UpgradeDef[]
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

      case 'team_increase':
        for (const inc of msg.increases || []) {
          contributions.value.push({ id: Date.now() + Math.random(), team: inc.team, increase: inc.increase })
        }
        if (contributions.value.length > 10) contributions.value = contributions.value.slice(-10)
        break

      case 'contributions':
        for (const c of msg.contributions || []) {
          const positions = [
            { x: -35, y: -20 }, { x: 35, y: -20 },
            { x: -45, y: 0 }, { x: 45, y: 0 },
            { x: -35, y: 20 }, { x: 35, y: 20 },
            { x: 0, y: -25 }, { x: 0, y: 25 },
            { x: -60, y: -15 }, { x: 60, y: -15 },
            { x: -60, y: 15 }, { x: 60, y: 15 },
            { x: -25, y: -35 }, { x: 25, y: -35 },
            { x: -25, y: 35 }, { x: 25, y: 35 },
            { x: -70, y: 0 }, { x: 70, y: 0 },
            { x: -15, y: -45 }, { x: 15, y: -45 },
            { x: -15, y: 45 }, { x: 15, y: 45 },
            { x: -50, y: -30 }, { x: 50, y: -30 },
            { x: -50, y: 30 }, { x: 50, y: 30 },
            { x: -40, y: -40 }, { x: 40, y: -40 },
            { x: -40, y: 40 }, { x: 40, y: 40 },
            { x: -30, y: -50 }, { x: 30, y: -50 },
            { x: -30, y: 50 }, { x: 30, y: 50 },
          ]
          const pos = positions[Math.floor(Math.random() * positions.length)]
          // Add random jitter to prevent stacking
          const jitterX = (Math.random() - 0.5) * 10
          const jitterY = (Math.random() - 0.5) * 10
          contributions.value.push({ id: Date.now() + Math.random(), team: c.team, increase: c.points, pos: { x: pos.x + jitterX, y: pos.y + jitterY } })
        }
        if (contributions.value.length > 50) contributions.value = contributions.value.slice(-50)
        break
    }
  }

  function triggerClickFlash() {
    clickFlash.value = true
    setTimeout(() => { clickFlash.value = false }, 200)
  }

  function join(name: string, url: string) {
    error.value = null
    let id = localStorage.getItem('autoclick_player_id')
    const displayName = name || `player_${id ? id.slice(0, 4) : crypto.randomUUID().slice(0, 4)}`
    
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('autoclick_player_id', id)
    }
    
    setServerUrl(url)
    _joining.value = true
    
    // 15 second timeout for first connect
    _joinTimeoutId = setTimeout(() => {
      if (!connected.value) {
        error.value = 'Cannot reach server'
        _joining.value = false
        disconnect()
      }
    }, 15000)

    if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
      connect(url)
      setTimeout(() => sendMsg({ type: 'join', id, name: displayName }), 500)
    } else {
      sendMsg({ type: 'join', id, name: displayName })
    }
  }

  function cancelJoin() {
    _joining.value = false
    if (_joinTimeoutId) {
      clearTimeout(_joinTimeoutId)
      _joinTimeoutId = null
    }
    disconnect()
  }

  function sendClick() {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: 'click' }))
    }
  }

  function purchaseUpgrade(upgradeId: string, quantity = 1) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: 'buy_upgrade', upgradeId, quantity }))
    }
  }

  function getLeaderboard() {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: 'get_leaderboard' }))
    }
  }

  function getUpgrades() {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: 'get_upgrades' }))
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

  function getAutoClickRate(): number {
    if (!myPlayer.value) return 0
    const p = myPlayer.value
    let autoClickers = 0
    if (p.team === 'gnomes') {
      autoClickers += (p.upgrades['mushroom_stool'] || 0)
      autoClickers += (p.upgrades['gnome_army'] || 0) * 50
    } else {
      autoClickers += (p.upgrades['plastic_ruler'] || 0)
      autoClickers += (p.upgrades['tank_division'] || 0) * 50
    }
    const hatLevel = p.team === 'gnomes' ? (p.upgrades['hat_collection'] || 0) : 0
    const formationLevel = p.team === 'soldiers' ? (p.upgrades['battle_formation'] || 0) : 0
    const teamBonus = 1 + hatLevel * 0.05 + formationLevel * 0.05
    return Math.floor(autoClickers * teamBonus)
  }

  return {
    connected, myPlayer, gameState, leaderboard, upgrades, error, playerName, lastClickPoints, clickFlash, scoreChange, clickBurst, valueFlash, joining, cancelJoin, reconnect, _disconnected, contributions,
    join, sendClick, purchaseUpgrade, getLeaderboard, getUpgrades, connect, disconnect,
    myTeam, teamScores, totalScore, formatNum, getUpgradeCost, getAutoClickRate,
  }
})
