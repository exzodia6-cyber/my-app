import { ReactNode } from 'react';
import { Shield, Sparkles } from 'lucide-react';
import type { User } from '../types/api';

const navLabels: Record<string, string> = {
  home: 'Главная',
  cases: 'Кейсы',
  inventory: 'Инвентарь',
  upgrade: 'Апгрейд',
  contract: 'Контракт',
  admin: 'Админка'
};

export function Layout({ children, user, page, setPage, onLogout }: { children:ReactNode; user?:User|null; page:string; setPage:(p:string)=>void; onLogout:()=>void }) {
  const nav = ['home','cases','inventory','upgrade','contract','admin'];
  const activePage = page.startsWith('case') ? 'cases' : page;

  return <div className="min-h-screen noise">
    <nav className="sticky top-0 z-20 border-b border-white/10 bg-night/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <button onClick={()=>setPage('home')} className="flex items-center gap-2 text-xl font-black"><Shield className="text-gold"/> CaseForge <span className="text-cyan-300">Arena</span></button>
        <div className="hidden gap-2 md:flex">{nav.map(n => <button key={n} onClick={()=>setPage(n)} className={`rounded-full px-4 py-2 text-sm ${activePage===n?'bg-gold text-black':'text-slate-300 hover:bg-white/10'}`}>{navLabels[n]}</button>)}</div>
        <div className="flex items-center gap-3">{user ? <>
          <span className="rounded-full bg-white/10 px-3 py-2 text-sm"><Sparkles className="mr-1 inline h-4 w-4 text-gold"/>Баланс: {user.balance.toLocaleString('ru-RU')} монет</span>
          <span className="hidden rounded-full bg-white/5 px-3 py-2 text-sm text-slate-300 sm:inline">Профиль: {user.username}</span>
          <button onClick={onLogout} className="text-sm text-slate-300">Выйти</button>
        </> : <button onClick={()=>setPage('auth')} className="rounded-full bg-cyan-400 px-4 py-2 font-bold text-slate-950">Войти</button>}</div>
      </div>
    </nav>
    <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    <footer className="border-t border-white/10 px-4 py-8 text-center text-sm text-slate-500">Виртуальное развлечение: без вывода реальных денег, обменов Steam и активов Valve.</footer>
  </div>;
}
