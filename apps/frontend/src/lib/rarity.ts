import type { Rarity } from '../types/api';

export const rarityLabel: Record<Rarity, string> = {
  CONSUMER_GRADE: 'Ширпотреб',
  INDUSTRIAL_GRADE: 'Промышленное качество',
  MIL_SPEC: 'Армейское качество',
  RESTRICTED: 'Запрещённое',
  CLASSIFIED: 'Засекреченное',
  COVERT: 'Тайное',
  RARE_SPECIAL_ITEM: 'Редкий особый предмет'
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
