import type React from 'react';
import type { InventoryItem, Item } from '../types/api';
import { rarityClass, rarityLabel } from '../lib/rarity';

export function ItemCard({ item, selected, onClick, action }: { item: Item | InventoryItem; selected?: boolean; onClick?: () => void; action?: React.ReactNode }) {
  const data = 'item' in item ? item.item : item;
  return <div onClick={onClick} className={`group rounded-3xl border bg-slate-950/70 p-4 transition hover:-translate-y-1 hover:border-cyan-300/60 ${selected ? 'border-gold shadow-neon' : 'border-white/10'}`}>
    <div className={`rounded-2xl bg-gradient-to-br ${rarityClass[data.rarity]} p-[1px]`}><div className="rounded-2xl bg-night/90 p-3"><img src={data.imageUrl} className="h-28 w-full rounded-xl object-cover opacity-90" /></div></div>
    <div className="mt-4 flex items-start justify-between gap-3"><div><p className="font-bold">{data.weapon}</p><p className="text-sm text-slate-300">{data.skin}</p></div><p className="text-gold font-black">{data.price}</p></div>
    <p className="mt-2 text-xs text-slate-400">{rarityLabel[data.rarity]} · {data.wear.replaceAll('_',' ')}</p>{action && <div className="mt-3">{action}</div>}
  </div>
}
