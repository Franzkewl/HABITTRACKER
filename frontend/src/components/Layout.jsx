import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isAdmin) return;
    api.get('/notifications').then((r) => setUnread(r.data.unread)).catch(() => {});
    const t = setInterval(() => api.get('/notifications').then((r) => setUnread(r.data.unread)).catch(() => {}), 60000);
    return () => clearInterval(t);
  }, [isAdmin]);

  const link = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`;

  const items = isAdmin
    ? [['/admin', 'Overview'], ['/admin/users', 'Users'], ['/admin/categories', 'Categories']]
    : [['/', 'Dashboard'], ['/habits', 'Habits'], ['/goals', 'Goals'], ['/reminders', 'Reminders'], ['/stats', 'Stats']];

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to={isAdmin ? '/admin' : '/'} className="text-lg font-bold text-brand-600">✓ HabitTracker</Link>
          <button className="btn-ghost md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">☰</button>
          <nav className={`${open ? 'flex' : 'hidden'} absolute left-0 right-0 top-14 z-30 flex-col gap-1 border-b bg-white p-3 md:static md:flex md:flex-row md:items-center md:border-0 md:p-0`}>
            {items.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/' || to === '/admin'} className={link} onClick={() => setOpen(false)}>{label}</NavLink>
            ))}
            {!isAdmin && (
              <NavLink to="/notifications" className={link} onClick={() => setOpen(false)}>
                🔔{unread > 0 && <span className="ml-1 rounded-full bg-red-500 px-1.5 text-xs text-white">{unread}</span>}
              </NavLink>
            )}
            <NavLink to="/profile" className={link} onClick={() => setOpen(false)}>{user?.name}</NavLink>
            <button className="btn-ghost" onClick={async () => { await logout(); navigate('/login'); }}>Log out</button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet context={{ setUnread }} />
      </main>
    </div>
  );
}
