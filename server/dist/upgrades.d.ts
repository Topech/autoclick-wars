import { UpgradeDef } from './types.js';
export declare const gnomeUpgrades: UpgradeDef[];
export declare const soldierUpgrades: UpgradeDef[];
export declare const allUpgrades: UpgradeDef[];
export declare function getUpgradeCost(upgrade: UpgradeDef, level: number): number;
