import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Bell, Home, MessageCircle, Search, Shield, UserRound, Users } from 'lucide-react';
import './index.css';
import { api, tokenStore } from './lib/api';
import type { AdminStats, Notification, Post, User } from './types/api';

type View = 'home' | 'feed' | 'profile' | 'messages' | 'notifications' | 'admin';
type AuthMode = 'login' | 'register';

const avatar = (seed: string) => `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`;
const demoUsers: User[] = [
  { id: 'u1', email: 'anna@demo.local', username: 'anna', role: 'USER', createdAt: new Date().toISOString(), profile: { id: 'p1', userId: 'u1', name: 'Анна Смирнова', bio: 'Дизайнер интерфейсов, собираю идеи и вдохновение.', city: 'Москва', website: 'https://example.com', avatarUrl: avatar('Анна') }, _count: { followers: 128, following: 42, posts: 8 } },
  { id: 'u2', email: 'ivan@demo.local', username: 'ivan', role: 'USER', createdAt: new Date().toISOString(), profile: { id: 'p2', userId: 'u2', name: 'Иван Петров', bio: 'Пишу о TypeScript, продуктах и стартапах.', city: 'Казань', website: '', avatarUrl: avatar('Иван') }, _count: { followers: 91, following: 37, posts: 12 } },
  { id: 'admin', email: 'admin@demo.local', username: 'admin', role: 'ADMIN', createdAt: new Date().toISOString(), profile: { id: 'p3', userId: 'admin', name: 'Администратор', bio: 'Демо-админ социальной сети.', city: 'Санкт-Петербург', website: '', avatarUrl: avatar('Admin') }, _count: { followers: 500, following: 5, posts: 3 } }
];
const demoPosts: Post[] = [
  { id: 'post1', content: 'Запускаем MVP социальной сети: профиль, подписки, лайки, комментарии и уведомления уже на месте 🚀', createdAt: new Date().toISOString(), author: demoUsers[0], comments: [], likes: [{ id: 'l1', userId: 'u2', postId: 'post1' }], _count: { comments: 2, likes: 18 } },
  { id: 'post2', content: 'Mock/demo mode включается автоматически, если API недоступен. Можно показать продукт без поднятой базы.', createdAt: new Date(Date.now() - 3600000).toISOString(), author: demoUsers[1], comments: [], likes: [], _count: { comments: 1, likes: 12 } }
];

function App() {
  const [view, setView] = useState<View>('home');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>(demoPosts);
  const [people, setPeople] = useState<User[]>(demoUsers);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [error, setError] = useState('');
  const [postDraft, setPostDraft] = useState('');
  const [query, setQuery] = useState('');
  const [profileDraft, setProfileDraft] = useState({ name: '', bio: '', city: '', website: '' });

  const unread = notifications.filter((item) => !item.read).length;
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    async function bootstrap() {
      if (!tokenStore.get()) { setDemoMode(true); return; }
      try {
        const me = await api.me();
        setUser(me); setProfileDraft({ name: me.profile?.name ?? '', bio: me.profile?.bio ?? '', city: me.profile?.city ?? '', website: me.profile?.website ?? '' });
        await refresh(); setDemoMode(false);
      } catch {
        tokenStore.clear(); setDemoMode(true);
      }
    }
    bootstrap();
  }, []);

  async function refresh() {
    try {
      const [feed, notes] = await Promise.all([api.feed(), api.notifications().catch(() => [])]);
      setPosts(feed); setNotifications(notes as Notification[]); setDemoMode(false);
    } catch {
      setDemoMode(true);
    }
  }

  async function authenticate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email')); const password = String(data.get('password'));
    try {
      const payload = authMode === 'login'
        ? await api.login(email, password)
        : await api.register(email, String(data.get('username')), password, String(data.get('name')));
      tokenStore.set(payload.token); setUser(payload.user); setProfileDraft({ name: payload.user.profile?.name ?? '', bio: payload.user.profile?.bio ?? '', city: payload.user.profile?.city ?? '', website: payload.user.profile?.website ?? '' });
      setView('feed'); await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка авторизации');
      setDemoMode(true); const fallback = demoUsers[2]; setUser(fallback); setProfileDraft({ name: fallback.profile!.name, bio: fallback.profile!.bio, city: fallback.profile!.city, website: fallback.profile!.website });
    }
  }

  async function createPost() {
    if (!postDraft.trim() || !user) return;
    try { setPosts([await api.createPost(postDraft), ...posts]); setPostDraft(''); }
    catch { setDemoMode(true); setPosts([{ id: crypto.randomUUID(), content: postDraft, createdAt: new Date().toISOString(), author: user, comments: [], likes: [], _count: { comments: 0, likes: 0 } }, ...posts]); setPostDraft(''); }
  }

  async function toggleLike(post: Post) {
    if (!user) return;
    setPosts(posts.map((item) => item.id === post.id ? { ...item, _count: { ...item._count, likes: item._count.likes + (item.likes.some((like) => like.userId === user.id) ? -1 : 1) }, likes: item.likes.some((like) => like.userId === user.id) ? item.likes.filter((like) => like.userId !== user.id) : [...item.likes, { id: crypto.randomUUID(), postId: item.id, userId: user.id }] } : item));
    api.like(post.id).catch(() => setDemoMode(true));
  }

  async function searchUsers(q = query) {
    try { setPeople(q ? await api.search(q) : demoUsers); }
    catch { setDemoMode(true); setPeople(demoUsers.filter((person) => `${person.username} ${person.profile?.name}`.toLowerCase().includes(q.toLowerCase()))); }
  }

  async function saveProfile() {
    if (!user) return;
    try { const profile = await api.updateProfile(profileDraft); setUser({ ...user, profile }); }
    catch { setDemoMode(true); setUser({ ...user, profile: { ...(user.profile ?? { id: 'demo', userId: user.id, avatarUrl: avatar(profileDraft.name) }), ...profileDraft } }); }
  }

  async function openAdmin() {
    setView('admin');
    try { setAdminStats(await api.adminStats()); setPeople(await api.adminUsers()); }
    catch { setDemoMode(true); setAdminStats({ users: demoUsers.length, posts: posts.length, comments: 3, likes: 30, follows: 12, notifications: 5 }); }
  }

  const nav = [
    ['home', 'Главная', Home], ['feed', 'Лента', Users], ['profile', 'Профиль', UserRound], ['messages', 'Сообщения', MessageCircle], ['notifications', `Уведомления${unread ? ` (${unread})` : ''}`, Bell]
  ] as const;

  return <div className="min-h-screen bg-slate-950 text-white">
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <button onClick={() => setView('home')} className="text-2xl font-black tracking-tight"><span className="text-cyan-300">Social</span> MVP</button>
        <nav className="flex flex-wrap gap-2">{nav.map(([id, label, Icon]) => <button key={id} onClick={() => setView(id)} className={`rounded-2xl px-3 py-2 text-sm font-bold transition ${view === id ? 'bg-cyan-300 text-slate-950' : 'bg-white/5 hover:bg-white/10'}`}><Icon className="mr-1 inline size-4" />{label}</button>)}{isAdmin && <button onClick={openAdmin} className="rounded-2xl bg-amber-300 px-3 py-2 text-sm font-bold text-slate-950"><Shield className="mr-1 inline size-4" />Админ</button>}</nav>
        <div className="text-sm text-slate-300">{demoMode && <span className="mr-3 rounded-full bg-fuchsia-500/20 px-3 py-1 text-fuchsia-100">Demo mode</span>}{user ? <span>@{user.username}</span> : <span>Гость</span>}</div>
      </div>
    </header>

    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_320px]">
      <section className="space-y-6">
        {view === 'home' && <Hero setView={setView} />}
        {view === 'feed' && <Feed user={user} posts={posts} postDraft={postDraft} setPostDraft={setPostDraft} createPost={createPost} toggleLike={toggleLike} />}
        {view === 'profile' && <Profile user={user} draft={profileDraft} setDraft={setProfileDraft} save={saveProfile} />}
        {view === 'messages' && <Messages />}
        {view === 'notifications' && <Notifications items={notifications.length ? notifications : [{ id: 'n1', type: 'demo', message: 'Добро пожаловать! Уведомления о лайках, комментариях и подписках появятся здесь.', read: false, createdAt: new Date().toISOString() }]} />}
        {view === 'admin' && <Admin stats={adminStats} users={people} />}
      </section>
      <aside className="space-y-6">
        {!user && <AuthCard mode={authMode} setMode={setAuthMode} onSubmit={authenticate} error={error} />}
        <SearchCard query={query} setQuery={setQuery} search={searchUsers} people={people} />
      </aside>
    </main>
  </div>;
}

function Hero({ setView }: { setView: (view: View) => void }) { return <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/20 via-slate-900 to-fuchsia-500/20 p-8 shadow-2xl"><div className="max-w-2xl"><p className="mb-3 font-bold text-cyan-200">Русскоязычная социальная сеть</p><h1 className="text-5xl font-black leading-tight">Общайтесь, публикуйте посты и развивайте сообщество.</h1><p className="mt-5 text-lg text-slate-300">MVP включает регистрацию, JWT auth, профили, ленту, лайки, комментарии, подписки, поиск, уведомления, админ-панель и fallback demo mode.</p><button onClick={() => setView('feed')} className="mt-8 rounded-2xl bg-cyan-300 px-6 py-3 font-black text-slate-950">Открыть ленту</button></div></div>; }

function AuthCard({ mode, setMode, onSubmit, error }: { mode: AuthMode; setMode: (m: AuthMode) => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; error: string }) { return <form onSubmit={onSubmit} className="rounded-3xl border border-white/10 bg-white/5 p-5"><h2 className="text-xl font-black">{mode === 'login' ? 'Вход' : 'Регистрация'}</h2>{mode === 'register' && <><input name="name" placeholder="Имя" className="input mt-4" /><input name="username" placeholder="username" className="input mt-3" /></>}<input name="email" type="email" placeholder="email" defaultValue="admin@demo.local" className="input mt-4" /><input name="password" type="password" placeholder="пароль" defaultValue="password123" className="input mt-3" />{error && <p className="mt-3 text-sm text-rose-300">{error}</p>}<button className="mt-4 w-full rounded-2xl bg-cyan-300 py-3 font-black text-slate-950">Продолжить</button><button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="mt-3 text-sm text-cyan-200">{mode === 'login' ? 'Создать аккаунт' : 'Уже есть аккаунт'}</button></form>; }
function Feed(props: { user: User | null; posts: Post[]; postDraft: string; setPostDraft: (v: string) => void; createPost: () => void; toggleLike: (p: Post) => void }) { return <div className="space-y-4"><Composer {...props} />{props.posts.map((post) => <article key={post.id} className="rounded-3xl border border-white/10 bg-white/5 p-5"><div className="flex gap-3"><img src={post.author.profile?.avatarUrl ?? avatar(post.author.username)} className="size-12 rounded-2xl" /><div><b>{post.author.profile?.name ?? post.author.username}</b><p className="text-sm text-slate-400">@{post.author.username} · {new Date(post.createdAt).toLocaleString('ru-RU')}</p></div></div><p className="mt-4 whitespace-pre-line text-lg">{post.content}</p><div className="mt-4 flex gap-3 text-sm"><button onClick={() => props.toggleLike(post)} className="rounded-xl bg-white/10 px-3 py-2">❤ {post._count.likes}</button><span className="rounded-xl bg-white/10 px-3 py-2">💬 {post._count.comments}</span></div></article>)}</div>; }
function Composer({ user, postDraft, setPostDraft, createPost }: { user: User | null; postDraft: string; setPostDraft: (v: string) => void; createPost: () => void }) { return <div className="rounded-3xl border border-white/10 bg-white/5 p-5"><textarea value={postDraft} onChange={(e) => setPostDraft(e.target.value)} placeholder={user ? 'Что нового?' : 'Войдите или используйте demo mode'} className="input min-h-28 resize-none" /><button onClick={createPost} className="mt-3 rounded-2xl bg-cyan-300 px-5 py-3 font-black text-slate-950">Опубликовать</button></div>; }
function Profile({ user, draft, setDraft, save }: { user: User | null; draft: { name: string; bio: string; city: string; website: string }; setDraft: (v: { name: string; bio: string; city: string; website: string }) => void; save: () => void }) { if (!user) return <p>Войдите для просмотра профиля.</p>; return <div className="rounded-3xl border border-white/10 bg-white/5 p-6"><div className="flex flex-wrap items-center gap-5"><img src={user.profile?.avatarUrl ?? avatar(user.username)} className="size-24 rounded-3xl" /><div><h2 className="text-3xl font-black">{user.profile?.name}</h2><p className="text-slate-400">@{user.username}</p><p className="mt-2 text-sm text-slate-300">Подписчики: {user._count?.followers ?? 0} · Посты: {user._count?.posts ?? 0}</p></div></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /><input className="input" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /><input className="input sm:col-span-2" value={draft.website} onChange={(e) => setDraft({ ...draft, website: e.target.value })} /><textarea className="input min-h-28 sm:col-span-2" value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} /></div><button onClick={save} className="mt-4 rounded-2xl bg-cyan-300 px-5 py-3 font-black text-slate-950">Сохранить профиль</button></div>; }
function SearchCard({ query, setQuery, search, people }: { query: string; setQuery: (v: string) => void; search: () => void; people: User[] }) { return <div className="rounded-3xl border border-white/10 bg-white/5 p-5"><h2 className="font-black"><Search className="mr-1 inline size-4" />Поиск людей</h2><div className="mt-3 flex gap-2"><input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Имя или username" /><button onClick={search} className="rounded-xl bg-cyan-300 px-3 font-bold text-slate-950">Найти</button></div><div className="mt-4 space-y-3">{people.slice(0, 5).map((person) => <div key={person.id} className="flex items-center gap-3 rounded-2xl bg-white/5 p-3"><img src={person.profile?.avatarUrl ?? avatar(person.username)} className="size-10 rounded-xl" /><div><b>{person.profile?.name}</b><p className="text-sm text-slate-400">@{person.username}</p></div></div>)}</div></div>; }
function Notifications({ items }: { items: Notification[] }) { return <div className="space-y-3"><h2 className="text-3xl font-black">Уведомления</h2>{items.map((item) => <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><b>{item.message}</b><p className="text-sm text-slate-400">{new Date(item.createdAt).toLocaleString('ru-RU')}</p></div>)}</div>; }
function Messages() { return <div className="rounded-3xl border border-white/10 bg-white/5 p-6"><h2 className="text-3xl font-black">Сообщения</h2><p className="mt-2 text-slate-300">Раздел подготовлен для будущих диалогов. В MVP показан адаптивный placeholder.</p></div>; }
function Admin({ stats, users }: { stats: AdminStats | null; users: User[] }) { return <div className="space-y-4"><h2 className="text-3xl font-black">Админ-панель</h2><div className="grid gap-3 sm:grid-cols-3">{Object.entries(stats ?? {}).map(([key, value]) => <div key={key} className="rounded-2xl bg-amber-300/10 p-4"><p className="text-sm text-amber-100">{key}</p><b className="text-3xl">{value}</b></div>)}</div><div className="rounded-3xl border border-white/10 bg-white/5 p-5">{users.map((person) => <div key={person.id} className="flex justify-between border-b border-white/10 py-2"><span>@{person.username}</span><span>{person.role}</span></div>)}</div></div>; }

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
