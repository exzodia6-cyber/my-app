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
type CaseCategory = 'Популярные' | 'Новые' | 'Дорогие' | 'Дешёвые';
type DemoCaseSeed = { slug: string; title: string; itemCount: number; price: number; rarityTag: string; shortDescription: string; from: string; to: string; itemOffset: number };

const placeholder = (label: string, from = '#f59e0b', to = '#22d3ee') =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M36 0H0v36" fill="none" stroke="#ffffff" stroke-opacity=".08"/></pattern></defs><rect width="640" height="420" rx="44" fill="#080b16"/><rect width="640" height="420" fill="url(#grid)"/><circle cx="106" cy="76" r="150" fill="${from}" opacity=".24"/><circle cx="548" cy="342" r="180" fill="${to}" opacity=".22"/><path d="M138 254c76-114 156-168 242-160 74 7 124 55 151 143-59-52-122-72-190-60-72 13-139 63-203 77Z" fill="url(#g)" opacity=".95" filter="url(#glow)"/><path d="M176 154h288l40 60-184 126-184-126 40-60Z" fill="url(#g)" opacity=".88" filter="url(#glow)"/><path d="M208 184h224l24 34-136 88-136-88 24-34Z" fill="#0f172a" opacity=".84"/><text x="320" y="375" text-anchor="middle" fill="#f8fafc" font-family="Arial, sans-serif" font-size="34" font-weight="800">${label}</text></svg>`)}`;

const mockItems: Item[] = [
  { id: 'mock-ak-redline', weapon: 'AK-47', skin: 'Redline', rarity: 'CLASSIFIED', price: 420, wear: 'FIELD_TESTED', imageUrl: placeholder('AK-47 | Redline', '#ef4444', '#111827') },
  { id: 'mock-awp-dragon-lore', weapon: 'AWP', skin: 'Dragon Lore', rarity: 'RARE_SPECIAL_ITEM', price: 8900, wear: 'FACTORY_NEW', imageUrl: placeholder('AWP | Dragon Lore', '#f59e0b', '#dc2626') },
  { id: 'mock-m4a1-printstream', weapon: 'M4A1-S', skin: 'Printstream', rarity: 'COVERT', price: 1750, wear: 'MINIMAL_WEAR', imageUrl: placeholder('M4A1-S | Printstream', '#f8fafc', '#a855f7') },
  { id: 'mock-deagle-blaze', weapon: 'Desert Eagle', skin: 'Blaze', rarity: 'COVERT', price: 2100, wear: 'FACTORY_NEW', imageUrl: placeholder('Desert Eagle | Blaze', '#fb923c', '#ef4444') },
  { id: 'mock-usp-kill-confirmed', weapon: 'USP-S', skin: 'Kill Confirmed', rarity: 'COVERT', price: 1450, wear: 'MINIMAL_WEAR', imageUrl: placeholder('USP-S | Kill Confirmed', '#dc2626', '#f8fafc') },
  { id: 'mock-glock-fade', weapon: 'Glock-18', skin: 'Fade', rarity: 'CLASSIFIED', price: 980, wear: 'FACTORY_NEW', imageUrl: placeholder('Glock-18 | Fade', '#f472b6', '#22d3ee') },
  { id: 'mock-m4a4-asiimov', weapon: 'M4A4', skin: 'Asiimov', rarity: 'COVERT', price: 1320, wear: 'FIELD_TESTED', imageUrl: placeholder('M4A4 | Asiimov', '#f97316', '#f8fafc') },
  { id: 'mock-knife-doppler', weapon: 'Knife', skin: 'Doppler', rarity: 'RARE_SPECIAL_ITEM', price: 5200, wear: 'FACTORY_NEW', imageUrl: placeholder('Knife | Doppler', '#a855f7', '#22d3ee') },
  { id: 'mock-ak-neon-rider', weapon: 'AK-47', skin: 'Neon Rider', rarity: 'COVERT', price: 1650, wear: 'MINIMAL_WEAR', imageUrl: placeholder('AK-47 | Neon Rider', '#22d3ee', '#ec4899') },
  { id: 'mock-awp-oni-taiji', weapon: 'AWP', skin: 'Oni Taiji', rarity: 'COVERT', price: 2800, wear: 'FIELD_TESTED', imageUrl: placeholder('AWP | Oni Taiji', '#ef4444', '#eab308') },
  { id: 'mock-m4a1-hot-rod', weapon: 'M4A1-S', skin: 'Hot Rod', rarity: 'CLASSIFIED', price: 2400, wear: 'FACTORY_NEW', imageUrl: placeholder('M4A1-S | Hot Rod', '#dc2626', '#f97316') },
  { id: 'mock-karambit-tiger', weapon: 'Karambit', skin: 'Tiger Volt', rarity: 'RARE_SPECIAL_ITEM', price: 7600, wear: 'FACTORY_NEW', imageUrl: placeholder('Karambit | Tiger Volt', '#f59e0b', '#22d3ee') }
];

const caseSeeds: DemoCaseSeed[] = [
  { slug: 'dragon', title: 'Кейс Дракон', itemCount: 12, price: 1000, rarityTag: 'Легендарный', shortDescription: 'Огненная подборка с высоким шансом на яркие covert-дропы.', from: '#ef4444', to: '#f59e0b', itemOffset: 1 },
  { slug: 'flame', title: 'Кейс Пламя', itemCount: 11, price: 750, rarityTag: 'Горячий', shortDescription: 'Агрессивные красные и янтарные скины для быстрых открытий.', from: '#fb923c', to: '#dc2626', itemOffset: 3 },
  { slug: 'samurai', title: 'Кейс Самурай', itemCount: 14, price: 1250, rarityTag: 'Премиум', shortDescription: 'Контрастные арты, клинки и винтовки в восточном неон-вайбе.', from: '#a855f7', to: '#ef4444', itemOffset: 9 },
  { slug: 'emperor', title: 'Кейс Император', itemCount: 15, price: 1900, rarityTag: 'Топ', shortDescription: 'Дорогая витрина для охоты за особенными редкими предметами.', from: '#facc15', to: '#8b5cf6', itemOffset: 11 },
  { slug: 'phantom', title: 'Кейс Фантом', itemCount: 10, price: 520, rarityTag: 'Новый', shortDescription: 'Тёмная подборка с холодным свечением и аккуратным риском.', from: '#64748b', to: '#22d3ee', itemOffset: 2 },
  { slug: 'ninja', title: 'Кейс Ниндзя', itemCount: 13, price: 680, rarityTag: 'Популярный', shortDescription: 'Быстрые открытия, компактная цена и много контрастных скинов.', from: '#111827', to: '#14b8a6', itemOffset: 5 },
  { slug: 'storm', title: 'Кейс Шторм', itemCount: 12, price: 430, rarityTag: 'Доступный', shortDescription: 'Электрический набор для старта с шансом на дорогие винтовки.', from: '#38bdf8', to: '#6366f1', itemOffset: 8 },
  { slug: 'legend', title: 'Кейс Легенда', itemCount: 15, price: 2600, rarityTag: 'Редкий', shortDescription: 'Самая насыщенная демо-витрина с максимальным glow-акцентом.', from: '#f59e0b', to: '#ec4899', itemOffset: 7 },
  { slug: 'cobra', title: 'Кейс Кобра', itemCount: 10, price: 390, rarityTag: 'Бюджет', shortDescription: 'Ядовитая зелёная палитра и понятный вход для частых открытий.', from: '#84cc16', to: '#22c55e', itemOffset: 4 },
  { slug: 'titan', title: 'Кейс Титан', itemCount: 14, price: 1550, rarityTag: 'Мощный', shortDescription: 'Тяжёлые редкости, крупные цены и плотный набор топ-дропов.', from: '#94a3b8', to: '#facc15', itemOffset: 10 },
  { slug: 'cyber', title: 'Кейс Кибер', itemCount: 13, price: 880, rarityTag: 'Неон', shortDescription: 'Киберпанк-обложка, сине-розовая подсветка и дорогие цели.', from: '#06b6d4', to: '#d946ef', itemOffset: 6 },
  { slug: 'neon', title: 'Кейс Неон', itemCount: 12, price: 610, rarityTag: 'Хит', shortDescription: 'Самый яркий средний кейс для первого экрана каталога.', from: '#22d3ee', to: '#f472b6', itemOffset: 0 }
];

const makeCaseItems = (seed: DemoCaseSeed) => Array.from({ length: seed.itemCount }, (_, index) => {
  const item = mockItems[(seed.itemOffset + index) % mockItems.length];
  return { id: `${seed.slug}-${index}-${item.id}`, chance: Math.max(1.5, 16 - index * 0.85), item };
});

const mockCases: Case[] = caseSeeds.map((seed) => ({
  id: `mock-${seed.slug}`,
  name: seed.title,
  description: seed.shortDescription,
  price: seed.price,
  imageUrl: placeholder(seed.title, seed.from, seed.to),
  accentColor: seed.from,
  items: makeCaseItems(seed)
}));

const mockRecentDrops: RecentDrop[] = [
  { id: 'drop-1', user: 'NeonFox', item: mockItems[11], caseName: 'Кейс Легенда' },
  { id: 'drop-2', user: 'DustKing', item: mockItems[1], caseName: 'Кейс Дракон' },
  { id: 'drop-3', user: 'MirageOne', item: mockItems[3], caseName: 'Кейс Пламя' },
  { id: 'drop-4', user: 'Redline', item: mockItems[8], caseName: 'Кейс Кибер' },
  { id: 'drop-5', user: 'PrintBot', item: mockItems[2], caseName: 'Кейс Фантом' },
  { id: 'drop-6', user: 'FadeLuck', item: mockItems[5], caseName: 'Кейс Неон' },
  { id: 'drop-7', user: 'StormTap', item: mockItems[10], caseName: 'Кейс Шторм' },
  { id: 'drop-8', user: 'TitanAim', item: mockItems[7], caseName: 'Кейс Титан' }
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
  const allCases = visibleCases(cases.data);
  const homeCases = allCases.slice(0, 10);
  const rareItems = mockItems.filter((item) => ['COVERT', 'RARE_SPECIAL_ITEM'].includes(item.rarity)).slice(0, 5);
  const recentDrops = history.data?.length ? history.data.slice(0, 8).map(historyToDrop) : mockRecentDrops;

  return <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
    <RecentWinsRail drops={recentDrops}/>
    <div className="space-y-10">
      <section className="grid items-center gap-6 rounded-[2rem] border border-white/10 bg-white/[.06] p-5 shadow-neon md:p-7 lg:grid-cols-[1.15fr_.85fr]">
        <div>
          <p className="mb-3 inline-flex rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-bold text-gold">Каталог виртуальных кейсов</p>
          <h1 className="max-w-4xl text-4xl font-black leading-tight md:text-5xl">Открывай кейсы, следи за дропами и выбирай цену сразу.</h1>
          <p className="mt-4 max-w-2xl text-base text-slate-300">Компактная витрина в тёмном неоновом стиле: много кейсов, понятные цены, демо-данные при пустом API и только виртуальные монеты.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={()=>setPage('cases')} className="rounded-2xl bg-gold px-5 py-3 font-black text-black shadow-neon transition hover:-translate-y-1">Смотреть каталог</button>
            <button onClick={()=>setPage('upgrade')} className="rounded-2xl border border-cyan-300/40 px-5 py-3 text-cyan-200 transition hover:-translate-y-1 hover:bg-cyan-300/10">Апгрейд</button>
            <button onClick={()=>setPage('contract')} className="rounded-2xl border border-fuchsia-300/40 px-5 py-3 text-fuchsia-200 transition hover:-translate-y-1 hover:bg-fuchsia-300/10">Контракт</button>
          </div>
        </div>
        <div className="hidden rounded-[1.7rem] bg-gradient-to-br from-amber-400 via-red-500 to-cyan-400 p-[1px] sm:block">
          <div className="rounded-[1.6rem] bg-night/95 p-5">
            <Gem className="h-14 w-14 text-gold"/>
            <p className="mt-4 text-2xl font-black">Кейс дня: Дракон</p>
            <p className="mt-1 text-sm text-slate-300">12 предметов · от 1 000 монет · неоновый огонь</p>
          </div>
        </div>
      </section>

      <Section title="Популярные кейсы" subtitle={cases.error ? 'API недоступен — показываем демо-кейсы.' : 'Плотная сетка: на desktop видно до пяти карточек в ряд.'}>
        {homeCases.map(c=><CaseCard key={c.id} c={c} onOpen={()=>setPage(`case:${c.id}`)}/>) }
      </Section>

      <section>
        <h2 className="mb-2 text-3xl font-black">Режимы</h2>
        <p className="mb-5 text-slate-400">Быстрый переход к основным механикам площадки.</p>
        <div className="grid gap-4 md:grid-cols-3">
          <Mode icon={<PackageOpen/>} title="Кейсы" description="Открывай кейсы с прозрачным списком возможных предметов." accent="from-gold/30 to-amber-500/5" onClick={()=>setPage('cases')}/>
          <Mode icon={<Zap/>} title="Апгрейд" description="Рискуй предметом ради более дорогой цели с расчётом шанса." accent="from-cyan-300/30 to-blue-500/5" onClick={()=>setPage('upgrade')}/>
          <Mode icon={<ScrollText/>} title="Контракт" description="Собирай 10 предметов в контракт и получай новую награду." accent="from-fuchsia-300/30 to-purple-500/5" onClick={()=>setPage('contract')}/>
        </div>
      </section>

      <Section title="Топ-дропы" subtitle="Редкие предметы, которые могут появиться в демо-кейсах.">
        {rareItems.map((item)=><ItemCard key={item.id} item={item}/>) }
      </Section>
    </div>
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
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-3xl font-black">{title}</h2>
        {subtitle && <p className="mt-2 text-slate-400">{subtitle}</p>}
      </div>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">{children}</div>
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
  const previewItems = c.items?.slice(0, 4) ?? [];
  return <article onClick={onOpen} className="group cursor-pointer rounded-[1.6rem] bg-gradient-to-br from-gold/80 via-cyan-300/50 to-fuchsia-400/70 p-[1px] transition duration-300 hover:-translate-y-2 hover:shadow-neon">
    <div className="flex h-full flex-col overflow-hidden rounded-[1.55rem] border border-white/10 bg-slate-950/90">
      <div className="relative overflow-hidden bg-white/5">
        <img src={c.imageUrl || placeholder(c.name)} className="h-40 w-full object-cover transition duration-300 group-hover:scale-110" alt={c.name}/>
        <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/70 px-3 py-1 text-xs font-bold text-cyan-100">{c.items?.length ?? 0} предметов</div>
        <div className="absolute bottom-3 right-3 rounded-full bg-gold px-3 py-1 text-sm font-black text-black shadow-lg transition group-hover:bg-cyan-300">{formatCoins(c.price)}</div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl font-black leading-tight">{normalizeCaseName(c.name)}</h3>
          <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[11px] text-slate-300">{caseTag(c)}</span>
        </div>
        <p className="mt-2 min-h-12 text-sm text-slate-400">{c.description || 'Виртуальный кейс с набором ярких предметов.'}</p>
        <div className="mt-3 flex flex-wrap gap-1">{previewItems.map(({ item }) => <span key={item.id} className={`h-2 w-8 rounded-full bg-gradient-to-r ${rarityClass[item.rarity]}`} />)}</div>
        <button onClick={(event)=>{ event.stopPropagation(); onOpen(); }} className="mt-4 w-full rounded-2xl border border-gold/40 bg-gold/90 px-4 py-3 font-black text-black transition group-hover:border-cyan-200 group-hover:bg-cyan-300">Открыть</button>
      </div>
    </div>
  </article>;
}

function caseTag(c: Case) {
  if (c.price >= 1900) return 'Дорогой';
  if (c.price <= 450) return 'Дешёвый';
  if (c.id.includes('neon') || c.id.includes('dragon')) return 'Популярный';
  return 'Новый';
}

function RecentWinsRail({ drops }: { drops: RecentDrop[] }) {
  return <aside className="lg:sticky lg:top-24 lg:self-start">
    <div className="rounded-[1.7rem] border border-cyan-300/20 bg-slate-950/85 p-4 shadow-neon backdrop-blur">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[.24em] text-cyan-200">live drop</p>
          <h2 className="text-xl font-black">Сейчас выигрывают</h2>
        </div>
        <Trophy className="h-7 w-7 text-gold"/>
      </div>
      <div className="space-y-3">
        {drops.slice(0, 8).map((drop) => <div key={drop.id} className="group flex gap-3 rounded-2xl border border-white/10 bg-white/[.04] p-2 transition hover:border-cyan-300/50 hover:bg-cyan-300/10">
          <img src={drop.item.imageUrl} className="h-14 w-16 rounded-xl object-cover" alt={`${drop.item.weapon} | ${drop.item.skin}`}/>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black">{drop.item.weapon}</p>
            <p className="truncate text-xs text-slate-300">{drop.item.skin}</p>
            <p className="mt-1 truncate text-[11px] text-gold">{rarityLabel[drop.item.rarity]}</p>
          </div>
        </div>)}
      </div>
    </div>
  </aside>;
}

function Cases({ page, refreshMe, setPage }: { page:string; refreshMe:()=>void; setPage:(p:string)=>void }) {
  const cases=useAsync<Case[]>(()=>api<Case[]>('/cases').catch(() => []), []);
  const allCases = visibleCases(cases.data);
  const history = useAsync<History[]>(()=>api<History[]>('/history').catch(() => []), []);
  const recentDrops = history.data?.length ? history.data.slice(0, 8).map(historyToDrop) : mockRecentDrops;
  const [category, setCategory] = useState<CaseCategory>('Популярные');
  const id=page.startsWith('case:')?page.split(':')[1]:'';
  const selected=allCases.find(c=>c.id===id);
  const [win,setWin]=useState<InventoryItem|null>(null);
  const [err,setErr]=useState('');
  const filteredCases = filterCases(allCases, category);

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

  return <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
    <RecentWinsRail drops={recentDrops}/>
    <div className="space-y-7">
      <section className="rounded-[2rem] border border-white/10 bg-white/[.06] p-6 shadow-neon">
        <p className="mb-2 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-sm font-bold text-cyan-200">Основная витрина</p>
        <h1 className="text-4xl font-black md:text-5xl">Каталог кейсов</h1>
        <p className="mt-3 max-w-3xl text-slate-300">Выбирай кейс по цене и категории. Если backend не вернул список, каталог автоматически заполняется демонстрационными кейсами.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {(['Популярные','Новые','Дорогие','Дешёвые'] as CaseCategory[]).map((name) => <button key={name} onClick={()=>setCategory(name)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${category===name?'bg-gold text-black':'border border-white/10 bg-white/5 text-slate-300 hover:border-cyan-300/50 hover:text-cyan-100'}`}>{name}</button>)}
        </div>
      </section>

      <Section title={`${category} кейсы`} subtitle={cases.error ? 'Показываем демо-кейсы, потому что API недоступен.' : `${filteredCases.length} кейсов в текущей подборке.`}>
        {filteredCases.map(c=><CaseCard key={c.id} c={c} onOpen={()=>setPage(`case:${c.id}`)} />)}
      </Section>
    </div>
  </div>;
}

function filterCases(cases: Case[], category: CaseCategory) {
  const sorted = [...cases];
  if (category === 'Дорогие') return sorted.sort((a, b) => b.price - a.price).slice(0, Math.max(10, Math.min(sorted.length, 15)));
  if (category === 'Дешёвые') return sorted.sort((a, b) => a.price - b.price).slice(0, Math.max(10, Math.min(sorted.length, 15)));
  if (category === 'Новые') return sorted.slice().reverse().slice(0, Math.max(10, Math.min(sorted.length, 15)));
  return sorted.sort((a, b) => Number(b.id.includes('dragon') || b.id.includes('neon')) - Number(a.id.includes('dragon') || a.id.includes('neon'))).slice(0, Math.max(10, Math.min(sorted.length, 15)));
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
