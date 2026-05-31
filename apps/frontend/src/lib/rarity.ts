import type { Rarity } from '../types/api';

export const rarityLabel: Record<Rarity, string> = {
  CONSUMER_GRADE: 'Consumer Grade',
  INDUSTRIAL_GRADE: 'Industrial Grade',
  MIL_SPEC: 'Mil-Spec',
  RESTRICTED: 'Restricted',
  CLASSIFIED: 'Classified',
  COVERT: 'Covert',
  RARE_SPECIAL_ITEM: 'Rare Special Item'
};

export const rarityClass: Record<Rarity, string> = {
  CONSUMER_GRADE: 'from-slate-400 to-slate-600',
  INDUSTRIAL_GRADE: 'from-blue-400 to-blue-700',
  MIL_SPEC: 'from-indigo-400 to-indigo-700',
  RESTRICTED: 'from-purple-400 to-purple-700',
  CLASSIFIED: 'from-fuchsia-400 to-fuchsia-700',
  COVERT: 'from-red-500 to-rose-800',
  RARE_SPECIAL_ITEM: 'from-amber-300 to-yellow-600'
};
