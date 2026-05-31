import type { Item, CaseItem } from '@prisma/client';

export function pickWeighted<T extends CaseItem & { item: Item }>(entries: readonly T[]): T {
  if (entries.length === 0) {
    throw new Error('Cannot pick from an empty weighted item list');
  }

  const total = entries.reduce((sum: number, entry: T) => sum + entry.chance, 0);
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= entry.chance;
    if (roll <= 0) return entry;
  }
  return entries[entries.length - 1];
}

export function upgradeChance(sourcePrice: number, targetPrice: number) {
  if (targetPrice <= sourcePrice) return 0;
  return Math.min((sourcePrice / targetPrice) * 0.9, 0.75);
}
