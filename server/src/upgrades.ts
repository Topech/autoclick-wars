import { UpgradeDef } from './types.js';

export const gnomeUpgrades: UpgradeDef[] = [
  {
    id: 'mushroom_stool',
    name: '🍄 Mushroom Stool',
    description: '+1 auto-clicker per tick',
    team: 'gnomes',
    baseCost: 10,
    costMultiplier: 1.15,
    effect: (level) => level,
    category: 'auto',
  },
  {
    id: 'beer_chug',
    name: '🍺 Beer Chug',
    description: '×2 click power per level',
    team: 'gnomes',
    baseCost: 50,
    costMultiplier: 1.25,
    effect: (level) => Math.pow(2, level),
    category: 'click',
  },
  {
    id: 'hat_collection',
    name: '🎩 Hat Collection',
    description: '+5% team bonus per hat',
    team: 'gnomes',
    baseCost: 200,
    costMultiplier: 1.30,
    effect: (level) => 1 + level * 0.05,
    category: 'team',
  },
  {
    id: 'gnome_army',
    name: '🏔️ Garden Gnome Army',
    description: '+50 auto-clickers per tick',
    team: 'gnomes',
    baseCost: 1000,
    costMultiplier: 1.20,
    effect: (level) => level * 50,
    category: 'auto',
  },
  {
    id: 'epic_fart',
    name: '💨 Epic Fart Noise',
    description: '+10% crit chance for 30s when activated',
    team: 'gnomes',
    baseCost: 500,
    costMultiplier: 2.0,
    effect: (level) => level * 0.10,
    category: 'crit',
  },
];

export const soldierUpgrades: UpgradeDef[] = [
  {
    id: 'plastic_ruler',
    name: '📏 Plastic Ruler',
    description: '+1 auto-clicker per tick',
    team: 'soldiers',
    baseCost: 10,
    costMultiplier: 1.15,
    effect: (level) => level,
    category: 'auto',
  },
  {
    id: 'drill_sergeant',
    name: '🎖️ Drill Sergeant',
    description: '×2 click power per level',
    team: 'soldiers',
    baseCost: 50,
    costMultiplier: 1.25,
    effect: (level) => Math.pow(2, level),
    category: 'click',
  },
  {
    id: 'battle_formation',
    name: '⚔️ Battle Formation',
    description: '+5% team bonus per formation',
    team: 'soldiers',
    baseCost: 200,
    costMultiplier: 1.30,
    effect: (level) => 1 + level * 0.05,
    category: 'team',
  },
  {
    id: 'tank_division',
    name: '🛡️ Tank Division',
    description: '+50 auto-clickers per tick',
    team: 'soldiers',
    baseCost: 1000,
    costMultiplier: 1.20,
    effect: (level) => level * 50,
    category: 'auto',
  },
  {
    id: 'air_horn',
    name: '📢 Air Horn Rally',
    description: '+10% crit chance for 30s when activated',
    team: 'soldiers',
    baseCost: 500,
    costMultiplier: 2.0,
    effect: (level) => level * 0.10,
    category: 'crit',
  },
];

export const allUpgrades = [...gnomeUpgrades, ...soldierUpgrades];

export function getUpgradeCost(upgrade: UpgradeDef, level: number): number {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));
}
