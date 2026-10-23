import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { parseError } from '../api';
import { useToast } from '../context/ToastContext';
import { CategoryBadge, Empty, Spinner, StatCard, today } from '../components/UI';

export default function Dashboard() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => api.get('/dashboard').then((r) => setData(r.data)).catch((e) => toast.error(parseError(e).message)), [toast]);
  useEffect(() => { load(); }, [load]);

  const toggle = async (h) => {
    setBusyId(h.id);
    try {
      if (h.today_status === 'completed') {
        // Switch to "missed"-free state by removing today's log.
        const logs = await api.get(`/habits/${h.id}/logs`, { params: { per_page: 1 } });
        const log = logs.data.data[0];
        if (log && log.log_date === today()) await api.delete(`/habits/${h.id}/logs/${log.id}`);
      } else {
        await api.post(`/habits/${h.id}/logs`, { log_date: today(), status: 'completed' });
        toast.success(`Nice! "${h.name}" done for today.`);
      }
      await load();
    } catch (e) { toast.error(parseError(e).message); }
    finally { setBusyId(null); }
  };

  if (!data) return <Spinner />;
  const { summary, today: list, due_reminders } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Today</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Active habits" value={summary.active_habits} />
        <StatCard label="Done today" value={`${summary.completed_today}/${summary.active_habits}`} />
        <StatCard label="Best current streak" value={`${summary.best_current_streak} 🔥`} />
        <StatCard label="7-day completion" value={`${summary.weekly_completion_rate}%`} />
      </div>

      {due_reminders.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="mb-1 font-medium">⏰ Reminders</p>
          <ul className="list-inside list-disc">
            {due_reminders.map((r) => <li key={r.id}>Time to do “{r.habit.name}” (set for {r.remind_time.slice(0, 5)})</li>)}
          </ul>
        </div>
      )}

      {list.length === 0 ? (
        <Empty title="No active habits yet">
          <Link className="text-brand-600" to="/habits">Create your first habit</Link> to start tracking.
        </Empty>
      ) : (
        <div className="space-y-3">
          {list.map((h) => {
            const done = h.today_status === 'completed';
            return (
              <div key={h.id} className="card flex items-center gap-4 py-4">
                <button onClick={() => toggle(h)} disabled={busyId === h.id} aria-label={done ? 'Undo' : 'Mark complete'}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-lg transition ${done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 text-transparent hover:border-brand-500'}`}>✓</button>
                <div className="min-w-0 flex-1">
                  <Link to={`/habits/${h.id}`} className={`font-medium hover:text-brand-600 ${done ? 'text-slate-400 line-through' : ''}`}>{h.name}</Link>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <CategoryBadge category={h.category} /> <span className="capitalize">{h.frequency}</span>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold">{h.current_streak} 🔥</p>
                  <p className="text-xs text-slate-400">best {h.longest_streak}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
