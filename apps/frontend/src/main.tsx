import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Gem, PackageOpen, ScrollText, Trophy, Zap } from 'lucide-react';
import './index.css';
import { api, tokenStore } from './lib/api';
import type { Case, History, InventoryItem, Item, User } from './types/api';
import { ItemCard } from './components/ItemCard';
import { Layout } from './components/Layout';
import { rarityClass, rarityLabel } from './lib/rarity';

type RecentDrop = { id: string; user: string; item: Item; caseName: string };
type ModeCardProps = { icon: React.ReactNode; title: string; description: string; accent: string; onClick: () => void };

const placeholder = (label: string, from = '#f59e0b', to = '#22d3ee') =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="640" height="420" rx="44" fill="#080b16"/><circle cx="106" cy="76" r="150" fill="${from}" opacity=".22"/><circle cx="548" cy="342" r="180" fill="${to}" opacity=".20"/><path d="M176 154h288l40 60-184 126-184-126 40-60Z" fill="url(#g)" opacity=".9" filter="url(#glow)"/><path d="M208 184h224l24 34-136 88-136-88 24-34Z" fill="#0f172a" opacity=".82"/><text x="320" y="375" text-anchor="middle" fill="#f8fafc" font-family="Arial, sans-serif" font-size="34" font-weight="800">${label}</text></svg>`)}`;

const mockItems: Item[] = [
  { id: 'mock-ak-redline', weapon: 'AK-47', skin: 'Redline', rarity: 'CLASSIFIED', price: 420, wear: 'FIELD_TESTED', imageUrl: placeholder('AK-47 | Redline', '#ef4444', '#111827') },
  { id: 'mock-awp-dragon-lore', weapon: 'AWP', skin: 'Dragon Lore', rarity: 'RARE_SPECIAL_ITEM', price: 8900, wear: 'FACTORY_NEW', imageUrl: placeholder('AWP | Dragon Lore', '#f59e0b', '#dc2626') },
  { id: 'mock-m4a1-printstream', weapon: 'M4A1-S', skin: 'Printstream', rarity: 'COVERT', price: 1750, wear: 'MINIMAL_WEAR', imageUrl: placeholder('M4A1-S | Printstream', '#f8fafc', '#a855f7') },
  { id: 'mock-deagle-blaze', weapon: 'Desert Eagle', skin: 'Blaze', rarity: 'COVERT', price: 2100, wear: 'FACTORY_NEW', imageUrl: placeholder('Desert Eagle | Blaze', '#fb923c', '#ef4444') },
  { id: 'mock-usp-kill-confirmed', weapon: 'USP-S', skin: 'Kill Confirmed', rarity: 'COVERT', price: 1450, wear: 'MINIMAL_WEAR', imageUrl: placeholder('USP-S | Kill Confirmed', '#dc2626', '#f8fafc') },
  { id: 'mock-glock-fade', weapon: 'Glock-18', skin: 'Fade', rarity: 'CLASSIFIED', price: 980, wear: 'FACTORY_NEW', imageUrl: placeholder('Glock-18 | Fade', '#f472b6', '#22d3ee') },
  { id: 'mock-m4a4-asiimov', weapon: 'M4A4', skin: 'Asiimov', rarity: 'COVERT', price: 1320, wear: 'FIELD_TESTED', imageUrl: placeholder('M4A4 | Asiimov', '#f97316', '#f8fafc') },
  { id: 'mock-knife-doppler', weapon: 'Knife', skin: 'Doppler', rarity: 'RARE_SPECIAL_ITEM', price: 5200, wear: 'FACTORY_NEW', imageUrl: placeholder('Knife | Doppler', '#a855f7', '#22d3ee') }
];

const mockCases: Case[] = [
  { id: 'mock-starter', name: 'Стартовый кейс', description: 'Быстрый старт с яркими базовыми скинами и понятной ценой входа.', price: 100, imageUrl: placeholder('Стартовый кейс', '#22d3ee', '#6366f1'), accentColor: '#22d3ee', items: mockItems.map((item, index) => ({ id: `starter-${item.id}`, chance: 18 - index * 1.6, item })) },
  { id: 'mock-dust', name: 'Кейс Dust', description: 'Песочная классика с шансом на культовые винтовки и пистолеты.', price: 250, imageUrl: placeholder('Кейс Dust', '#f59e0b', '#92400e'), accentColor: '#f59e0b', items: mockItems.map((item, index) => ({ id: `dust-${item.id}`, chance: 17 - index * 1.4, item })) },
  { id: 'mock-mirage', name: 'Кейс Mirage', description: 'Неоновая подборка для охоты за дорогими редкими предметами.', price: 500, imageUrl: placeholder('Кейс Mirage', '#38bdf8', '#a855f7'), accentColor: '#38bdf8', items: mockItems.map((item, index) => ({ id: `mirage-${item.id}`, chance: 16 - index * 1.2, item })) },
  { id: 'mock-dragon', name: 'Кейс Дракон', description: 'Премиальный кейс с огненным вайбом и легендарными дропами.', price: 1000, imageUrl: placeholder('Кейс Дракон', '#ef4444', '#f59e0b'), accentColor: '#ef4444', items: mockItems.map((item, index) => ({ id: `dragon-${item.id}`, chance: 14 - index, item })) },
  { id: 'mock-elite', name: 'Элитный кейс', description: 'Максимальная ставка для охотников за ножами и топовыми covert-скинами.', price: 2500, imageUrl: placeholder('Элитный кейс', '#facc15', '#ec4899'), accentColor: '#facc15', items: mockItems.map((item, index) => ({ id: `elite-${item.id}`, chance: 12 - index * 0.8, item })) }
];

const mockRecentDrops: RecentDrop[] = [
  { id: 'drop-1', user: 'NeonFox', item: mockItems[7], caseName: 'Элитный кейс' },
  { id: 'drop-2', user: 'DustKing', item: mockItems[1], caseName: 'Кейс Дракон' },
  { id: 'drop-3', user: 'MirageOne', item: mockItems[3], caseName: 'Кейс Mirage' },
  { id: 'drop-4', user: 'Redline', item: mockItems[0], caseName: 'Кейс Dust' },
  { id: 'drop-5', user: 'PrintBot', item: mockItems[2], caseName: 'Стартовый кейс' },
  { id: 'drop-6', user: 'FadeLuck', item: mockItems[5], caseName: 'Кейс Mirage' }
];

const normalizeCaseName = (name: string) => ({
  'Dragon Case': 'Кейс Дракон',
  'Starter Case': 'Стартовый кейс',
  'Dust Case': 'Кейс Dust',
  'Mirage Case': 'Кейс Mirage',
  'Elite Case': 'Элитный кейс'
}[name] ?? name);

const normalizeCase = (caseItem: Case): Case => ({ ...caseItem, name: normalizeCaseName(caseItem.name) });
const visibleCases = (cases?: Case[] | null) => cases?.length ? cases.map(normalizeCase) : mockCases;
const formatCoins = (value: number) => `${value.toLocaleString('ru-RU')} монет`;

function useAsync<T>(loader: () => Promise<T>, deps: React.DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    loader()
      .then((value) => alive && setData(value))
      .catch((err) => alive && setError((err as Error).message))
      .finally(() => alive && setLoading(false));

    return () => { alive = false; };
  }, deps);

  return { data, error, loading, setData };
}

function Auth({ setUser, setPage }: { setUser:(u:User)=>void; setPage:(p:string)=>void }) {
  const [mode,setMode]=useState<'login'|'register'>('login');
  const [error,setError]=useState('');

  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    try{
      const res=await api<{user:User;token:string}>(`/auth/${mode}`,{method:'POST',body:JSON.stringify(Object.fromEntries(f))});
      tokenStore.set(res.token);
      setUser(res.user);
      setPage('home');
    }catch(err){
      setError((err as Error).message);
    }
  }

  return <section className="mx-auto max-w-md rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-neon">
    <h1 className="text-3xl font-black">{mode==='login'?'Вход':'Регистрация'}</h1>
    <form onSubmit={submit} className="mt-6 space-y-4">
      {mode==='register'&&<input name="username" placeholder="Имя игрока" className="w-full rounded-2xl bg-black/40 p-3"/>}
      <input name="email" placeholder="Эл. почта" defaultValue="player@example.com" className="w-full rounded-2xl bg-black/40 p-3"/>
      <input name="password" type="password" placeholder="Пароль" defaultValue="password123" className="w-full rounded-2xl bg-black/40 p-3"/>
      <button className="w-full rounded-2xl bg-gold p-3 font-black text-black">{mode==='login'?'Войти':'Создать аккаунт'}</button>
    </form>
    {error&&<p className="mt-3 text-red-300">{error}</p>}
    <button onClick={()=>setMode(mode==='login'?'register':'login')} className="mt-4 text-cyan-300">{mode==='login'?'Нужна регистрация?':'Уже есть аккаунт?'}</button>
  </section>;
}

function Home({ setPage }: { setPage:(p:string)=>void }) {
  const cases = useAsync<Case[]>(()=>api<Case[]>('/cases').catch(() => []), []);
  const history = useAsync<History[]>(()=>api<History[]>('/history').catch(() => []), []);
  const homeCases = visibleCases(cases.data).slice(0, 5);
  const rareItems = mockItems.filter((item) => ['COVERT', 'RARE_SPECIAL_ITEM'].includes(item.rarity)).slice(0, 4);
  const recentDrops = history.data?.length ? history.data.slice(0, 6).map(historyToDrop) : mockRecentDrops;

  return <div className="space-y-14">
    <section className="grid items-center gap-8 py-12 lg:grid-cols-[1.1fr_.9fr]">
      <div>
        <p className="mb-4 inline-flex rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-gold">Русскоязычная арена виртуальных CS-кейсов</p>
        <h1 className="text-5xl font-black leading-tight md:text-7xl">Открывай кейсы, делай <span className="text-cyan-300">апгрейд</span> и собирай контракт.</h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-300">Игровая главная с гарантированными демо-кейсами, последними выигрышами и редкими предметами. Только виртуальные монеты — без вывода реальных денег.</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <button onClick={()=>setPage('cases')} className="rounded-2xl bg-gold px-6 py-4 font-black text-black shadow-neon transition hover:-translate-y-1">Начать открывать</button>
          <button onClick={()=>setPage('upgrade')} className="rounded-2xl border border-cyan-300/40 px-6 py-4 text-cyan-200 transition hover:-translate-y-1 hover:bg-cyan-300/10">Апгрейд</button>
          <button onClick={()=>setPage('contract')} className="rounded-2xl border border-fuchsia-300/40 px-6 py-4 text-fuchsia-200 transition hover:-translate-y-1 hover:bg-fuchsia-300/10">Контракт</button>
        </div>
      </div>
      <div className="rounded-[2.5rem] border border-white/10 bg-white/10 p-5 shadow-neon">
        <div className="rounded-[2rem] bg-gradient-to-br from-amber-400 via-red-500 to-cyan-400 p-1">
          <div className="rounded-[1.8rem] bg-night p-8">
            <Gem className="h-24 w-24 text-gold"/>
            <p className="mt-8 text-3xl font-black">Кейс Дракон</p>
            <p className="text-slate-300">Неоновые дропы · анимация рулетки · редкие особые предметы</p>
          </div>
        </div>
      </div>
    </section>

    <Section title="Популярные кейсы" subtitle={cases.error ? 'API недоступен — показываем демо-кейсы.' : 'Минимум пять карточек всегда видны на главной.'}>
      {homeCases.map(c=><CaseCard key={c.id} c={c} onOpen={()=>setPage(`case:${c.id}`)}/>) }
    </Section>

    <RecentDrops drops={recentDrops}/>

    <Section title="Редкие предметы" subtitle="Топовые предметы, которые можно встретить в демо-кейсах.">
      {rareItems.map((item)=><ItemCard key={item.id} item={item}/>) }
    </Section>

    <section>
      <h2 className="mb-2 text-3xl font-black">Режимы игры</h2>
      <p className="mb-5 text-slate-400">Выбирай режим и переходи к игре одним кликом.</p>
      <div className="grid gap-4 md:grid-cols-3">
        <Mode icon={<PackageOpen/>} title="Кейсы" description="Открывай кейсы с прозрачным списком возможных предметов." accent="from-gold/30 to-amber-500/5" onClick={()=>setPage('cases')}/>
        <Mode icon={<Zap/>} title="Апгрейд" description="Рискуй предметом ради более дорогой цели с расчётом шанса." accent="from-cyan-300/30 to-blue-500/5" onClick={()=>setPage('upgrade')}/>
        <Mode icon={<ScrollText/>} title="Контракт" description="Собирай 10 предметов в контракт и получай новую награду." accent="from-fuchsia-300/30 to-purple-500/5" onClick={()=>setPage('contract')}/>
      </div>
    </section>
  </div>;
}

function historyToDrop(history: History, index: number): RecentDrop {
  const item = mockItems[index % mockItems.length];
  const metadata = history.metadata ?? {};
  return {
    id: history.id,
    user: typeof metadata.user === 'string' ? metadata.user : `Игрок #${index + 1}`,
    item,
    caseName: typeof metadata.caseName === 'string' ? normalizeCaseName(metadata.caseName) : 'Кейс'
  };
}

function Section({title,subtitle,children}:{title:string;subtitle?:string;children:React.ReactNode}){
  return <section>
    <div className="mb-5">
      <h2 className="text-3xl font-black">{title}</h2>
      {subtitle && <p className="mt-2 text-slate-400">{subtitle}</p>}
    </div>
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">{children}</div>
  </section>;
}

function Mode({icon,title,description,accent,onClick}:ModeCardProps){
  return <button onClick={onClick} className={`group rounded-3xl border border-white/10 bg-gradient-to-br ${accent} p-6 text-left transition hover:-translate-y-1 hover:border-gold/70 hover:shadow-neon`}>
    <div className="inline-flex rounded-2xl bg-white/10 p-3 text-gold transition group-hover:scale-110">{icon}</div>
    <h3 className="mt-4 text-2xl font-black">{title}</h3>
    <p className="mt-2 text-slate-400">{description}</p>
  </button>;
}

function CaseCard({c,onOpen}:{c:Case;onOpen:()=>void}){
  const previewItems = c.items?.slice(0, 3) ?? [];
  return <article className="group rounded-[1.8rem] bg-gradient-to-br from-gold/80 via-cyan-300/50 to-fuchsia-400/70 p-[1px] transition hover:-translate-y-2 hover:shadow-neon">
    <div className="flex h-full flex-col rounded-[1.75rem] border border-white/10 bg-slate-950/90 p-4">
      <div className="relative overflow-hidden rounded-2xl bg-white/5">
        <img src={c.imageUrl || placeholder(c.name)} className="h-36 w-full object-cover transition duration-300 group-hover:scale-105" alt={c.name}/>
        <div className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs text-gold">{c.items?.length ?? 0} предметов</div>
      </div>
      <h3 className="mt-4 text-xl font-black">{normalizeCaseName(c.name)}</h3>
      <p className="mt-2 min-h-12 text-sm text-slate-400">{c.description || 'Виртуальный кейс с набором ярких предметов.'}</p>
      <div className="mt-3 flex flex-wrap gap-1">{previewItems.map(({ item }) => <span key={item.id} className={`h-2 w-8 rounded-full bg-gradient-to-r ${rarityClass[item.rarity]}`} />)}</div>
      <div className="mt-auto pt-4">
        <p className="text-2xl font-black text-gold">{formatCoins(c.price)}</p>
        <button onClick={onOpen} className="mt-3 w-full rounded-2xl bg-gold px-4 py-3 font-black text-black transition hover:bg-amber-300">Открыть</button>
      </div>
    </div>
  </article>;
}

function RecentDrops({ drops }: { drops: RecentDrop[] }) {
  return <section>
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-3xl font-black">Последние выигрыши</h2>
        <p className="mt-2 text-slate-400">Живая лента дропов с пользователем, предметом, редкостью, ценой и кейсом.</p>
      </div>
      <Trophy className="hidden h-10 w-10 text-gold sm:block"/>
    </div>
    <div className="flex gap-4 overflow-x-auto pb-3">
      {drops.map((drop) => <div key={drop.id} className="min-w-[260px] rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className={`rounded-2xl bg-gradient-to-br ${rarityClass[drop.item.rarity]} p-[1px]`}><img src={drop.item.imageUrl} className="h-24 w-full rounded-2xl object-cover" alt={`${drop.item.weapon} | ${drop.item.skin}`}/></div>
        <p className="mt-3 text-sm text-cyan-200">{drop.user}</p>
        <p className="font-black">{drop.item.weapon} | {drop.item.skin}</p>
        <p className="text-sm text-slate-400">{rarityLabel[drop.item.rarity]} · {drop.caseName}</p>
        <p className="mt-2 text-gold font-black">{formatCoins(drop.item.price)}</p>
      </div>)}
    </div>
  </section>;
}

function Cases({ page, refreshMe, setPage }: { page:string; refreshMe:()=>void; setPage:(p:string)=>void }) {
  const cases=useAsync<Case[]>(()=>api<Case[]>('/cases').catch(() => []), []);
  const allCases = visibleCases(cases.data);
  const id=page.startsWith('case:')?page.split(':')[1]:'';
  const selected=allCases.find(c=>c.id===id);
  const [win,setWin]=useState<InventoryItem|null>(null);
  const [err,setErr]=useState('');

  async function open(){
    if (!selected) return;
    if (selected.id.startsWith('mock-')) {
      const item = selected.items[Math.floor(Math.random() * selected.items.length)].item;
      setWin({ id: `demo-win-${Date.now()}`, acquiredAt: new Date().toISOString(), item });
      setErr('Демо-режим: backend недоступен или вернул пустой список, награда показана без сохранения.');
      return;
    }
    try{
      setErr('');
      const res=await api<{inventoryItem:InventoryItem}>(`/cases/${selected.id}/open`,{method:'POST'});
      setWin(res.inventoryItem);
      refreshMe();
    }catch(e){
      setErr((e as Error).message);
    }
  }

  if(cases.loading && !allCases.length)return <p>Загружаем кейсы...</p>;

  if(selected)return <div>
    <button onClick={()=>setPage('cases')} className="text-cyan-300">← Назад к кейсам</button>
    <div className="mt-4 grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
      <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6">
        <img src={selected.imageUrl || placeholder(selected.name)} className="rounded-3xl" alt={selected.name}/>
        <h1 className="mt-5 text-4xl font-black">{normalizeCaseName(selected.name)}</h1>
        <p className="text-slate-300">{selected.description}</p>
        <p className="mt-4 text-2xl font-black text-gold">{formatCoins(selected.price)}</p>
        <button onClick={open} className="mt-6 w-full rounded-2xl bg-gold py-4 font-black text-black">Открыть кейс</button>
        {err&&<p className="mt-3 text-amber-200">{err}</p>}
        {win&&<div className="mt-6"><h2 className="mb-3 text-2xl font-black">Ваш выигрыш</h2><ItemCard item={win}/></div>}
      </div>
      <Section title="Возможные предметы">
        {selected.items.map(ci=><div key={ci.id}><ItemCard item={ci.item}/><p className="mt-1 text-center text-sm text-slate-400">Шанс {ci.chance.toFixed(1)}%</p></div>)}
      </Section>
    </div>
  </div>;

  return <Section title="Все кейсы" subtitle={cases.error ? 'Показываем демо-кейсы, потому что API недоступен.' : undefined}>
    {allCases.map(c=><CaseCard key={c.id} c={c} onOpen={()=>setPage(`case:${c.id}`)} />)}
  </Section>;
}

function Inventory({ refreshMe }: { refreshMe:()=>void }) {
  const inv=useAsync<InventoryItem[]>(()=>api<InventoryItem[]>('/inventory').catch(() => []), []);
  const [q,setQ]=useState('');
  const [rarity,setRarity]=useState('');
  async function sell(id:string){await api(`/inventory/${id}/sell`,{method:'POST'}); inv.setData(inv.data!.filter(i=>i.id!==id)); refreshMe();}
  const filtered=useMemo(()=>inv.data?.filter(i=>(!q||`${i.item.weapon} ${i.item.skin}`.toLowerCase().includes(q.toLowerCase()))&&(!rarity||i.item.rarity===rarity)),[inv.data,q,rarity]);
  return <div>
    <h1 className="text-4xl font-black">Инвентарь</h1>
    <div className="my-5 flex flex-wrap gap-3">
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Поиск" className="rounded-2xl bg-white/10 p-3"/>
      <select value={rarity} onChange={e=>setRarity(e.target.value)} className="rounded-2xl bg-white/10 p-3">
        <option value="">Все редкости</option>{Object.entries(rarityLabel).map(([k,v])=><option key={k} value={k}>{v}</option>)}
      </select>
    </div>
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">{filtered?.map(i=><ItemCard key={i.id} item={i} action={<button onClick={(e)=>{e.stopPropagation();sell(i.id)}} className="w-full rounded-xl bg-white/10 p-2 text-sm">Продать</button>}/>)}</div>
  </div>;
}

function Upgrade({ refreshMe }: { refreshMe:()=>void }) {
  const inv=useAsync<InventoryItem[]>(()=>api<InventoryItem[]>('/inventory').catch(() => []), []);
  const items=useAsync<Item[]>(()=>api<Item[]>('/items').catch(() => mockItems), []);
  const [src,setSrc]=useState<InventoryItem>();
  const [target,setTarget]=useState<Item>();
  const [result,setResult]=useState('');
  const chance=src&&target&&target.price>src.item.price?Math.min(src.item.price/target.price*.9,.75):0;
  async function run(){const r=await api<{success:boolean}>(`/upgrade`,{method:'POST',body:JSON.stringify({inventoryItemId:src!.id,targetItemId:target!.id})}); setResult(r.success?'Успех — новый предмет добавлен':'Неудача — исходный предмет сгорел'); refreshMe();}
  return <div><h1 className="text-4xl font-black">Апгрейд</h1><p className="mt-2 text-slate-400">Шанс = цена исходного / цена целевого × 0.9, максимум 75%.</p><div className="mt-6 grid gap-6 lg:grid-cols-2"><Panel title="Ваш предмет">{inv.data?.map(i=><ItemCard key={i.id} item={i} selected={src?.id===i.id} onClick={()=>setSrc(i)}/>)}</Panel><Panel title="Цель">{items.data?.filter(i=>!src||i.price>src.item.price).slice(0,20).map(i=><ItemCard key={i.id} item={i} selected={target?.id===i.id} onClick={()=>setTarget(i)}/>)}</Panel></div><div className="sticky bottom-4 mt-6 rounded-3xl border border-cyan-300/30 bg-night/90 p-5 backdrop-blur"><p className="text-2xl font-black">Шанс {(chance*100).toFixed(1)}%</p><button disabled={!chance} onClick={run} className="mt-3 rounded-2xl bg-cyan-300 px-6 py-3 font-black text-black disabled:opacity-40">Запустить апгрейд</button>{result&&<span className="ml-4 text-gold">{result}</span>}</div></div>;
}

function Contract({ refreshMe }: { refreshMe:()=>void }) {
  const inv=useAsync<InventoryItem[]>(()=>api<InventoryItem[]>('/inventory').catch(() => []), []);
  const [ids,setIds]=useState<string[]>([]);
  const [reward,setReward]=useState<InventoryItem>();
  function toggle(id:string){setIds(v=>v.includes(id)?v.filter(x=>x!==id):v.length<10?[...v,id]:v);}
  async function run(){const r=await api<{inventoryItem:InventoryItem}>('/contract',{method:'POST',body:JSON.stringify({inventoryItemIds:ids})}); setReward(r.inventoryItem); refreshMe();}
  return <div><h1 className="text-4xl font-black">Контракт</h1><p className="text-slate-400">Выберите ровно 10 предметов для новой награды близкой или чуть большей стоимости.</p><div className="my-5 rounded-3xl border border-fuchsia-300/20 bg-white/5 p-5">Выбрано {ids.length}/10 <button disabled={ids.length!==10} onClick={run} className="ml-4 rounded-2xl bg-fuchsia-300 px-5 py-2 font-black text-black disabled:opacity-40">Завершить</button></div>{reward&&<div className="mb-5"><h2 className="text-2xl font-black text-gold">Награда контракта</h2><ItemCard item={reward}/></div>}<div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">{inv.data?.map(i=><ItemCard key={i.id} item={i} selected={ids.includes(i.id)} onClick={()=>toggle(i.id)}/>)}</div></div>;
}

function Panel({title,children}:{title:string;children:React.ReactNode}){return <div><h2 className="mb-4 text-2xl font-black">{title}</h2><div className="grid gap-4 md:grid-cols-2">{children}</div></div>;}
function Admin(){return <div className="rounded-3xl border border-white/10 bg-white/5 p-8"><h1 className="text-4xl font-black">Админка</h1><p className="mt-3 text-slate-300">REST-маршруты готовы: создание и редактирование предметов, кейсов, шансов выпадения и пополнение баланса пользователей. Используйте API с админским JWT от admin@example.com / password123.</p></div>;}
function App(){const [page,setPageState]=useState(location.hash.slice(1)||'home'); const [user,setUser]=useState<User|null>(null); const refreshMe=()=>api<User>('/me').then(setUser).catch(()=>setUser(null)); useEffect(()=>{if(tokenStore.get())refreshMe();},[]); function setPage(p:string){location.hash=p;setPageState(p);} let content= page==='auth'?<Auth setUser={setUser} setPage={setPage}/>:page==='home'?<Home setPage={setPage}/>:page.startsWith('case')||page==='cases'?<Cases page={page} refreshMe={refreshMe} setPage={setPage}/>:page==='inventory'?<Inventory refreshMe={refreshMe}/>:page==='upgrade'?<Upgrade refreshMe={refreshMe}/>:page==='contract'?<Contract refreshMe={refreshMe}/>:<Admin/>; return <Layout user={user} page={page} setPage={setPage} onLogout={()=>{tokenStore.clear();setUser(null);}}>{content}</Layout>;}

createRoot(document.getElementById('root')!).render(<App/>);
