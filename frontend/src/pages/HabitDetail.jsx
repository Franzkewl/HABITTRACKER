import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { parseError } from '../api';
import { useToast } from '../context/ToastContext';
import { CategoryBadge, Confirm, Empty, Field, Pagination, Spinner, StatCard, today } from '../components/UI';

const badge = { completed: 'bg-emerald-100 text-emerald-700', skipped: 'bg-amber-100 text-amber-700', missed: 'bg-red-100 text-red-700' };

export default function HabitDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [habit, setHabit] = useState(null);
  const [logs, setLogs] = useState(null);
  const [pageNo, setPageNo] = useState(1);
  const [form, setForm] = useState({ log_date: today(), status: 'completed', notes: '' });
  const [errors, setErrors] = useState({});
  const [removing, setRemoving] = useState(null);

  const load = useCallback(async () => {
    try {
      const [h, l] = await Promise.all([api.get(`/habits/${id}`), api.get(`/habits/${id}/logs`, { params: { page: pageNo } })]);
      setHabit(h.data); setLogs(l.data);
    } catch (e) { toast.error(parseError(e).message); }
  }, [id, pageNo, toast]);
  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.log_date) return setErrors({ log_date: 'Pick a date.' });
    if (form.log_date > today()) return setErrors({ log_date: 'Date cannot be in the future.' });
    setErrors({});
    try {
      await api.post(`/habits/${id}/logs`, form);
      toast.success('Log saved.');
      setForm({ ...form, notes: '' });
      load();
    } catch (err) { const { message, fields } = parseError(err); setErrors(fields); toast.error(message); }
  };

  const remove = async () => {
    try { await api.delete(`/habits/${id}/logs/${removing.id}`); toast.success('Log removed.'); setRemoving(null); load(); }
    catch (e) { toast.error(parseError(e).message); }
  };

  if (!habit || !logs) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/habits" className="text-sm text-brand-600">← Back to habits</Link>
        <h1 className="mt-1 text-2xl font-bold">{habit.name}</h1>
        <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
          <CategoryBadge category={habit.category} /><span className="capitalize">{habit.frequency} × {habit.target_per_period} · {habit.status}</span>
        </div>
        {habit.description && <p className="mt-2 text-sm text-slate-600">{habit.description}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Current streak" value={`${habit.current_streak} 🔥`} hint={habit.frequency === 'weekly' ? 'weeks' : 'days'} />
        <StatCard label="Longest streak" value={habit.longest_streak} />
        <StatCard label="30-day rate" value={`${habit.completion_rate}%`} />
      </div>

      <form onSubmit={submit} className="card grid gap-3 md:grid-cols-4" noValidate>
        <Field label="Date" error={errors.log_date}><input className="input" type="date" max={today()} value={form.log_date} onChange={(e) => setForm({ ...form, log_date: e.target.value })} /></Field>
        <Field label="Status" error={errors.status}>
          <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="completed">Completed</option><option value="skipped">Skipped</option><option value="missed">Missed</option>
          </select>
        </Field>
        <div className="md:col-span-2"><Field label="Notes (optional)" error={errors.notes}><input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field></div>
        <div className="md:col-span-4"><button className="btn-primary">Save log</button> <span className="ml-2 text-xs text-slate-400">Saving an existing date updates that entry.</span></div>
      </form>

      <div>
        <h2 className="mb-3 text-lg font-semibold">History</h2>
        {logs.data.length === 0 ? <Empty title="No logs yet">Log your first completion above.</Empty> : (
          <>
            <div className="card divide-y p-0">
              {logs.data.map((l) => (
                <div key={l.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className="w-28 font-medium">{l.log_date}</span>
                  <span className={`rounded px-2 py-0.5 text-xs capitalize ${badge[l.status]}`}>{l.status}</span>
                  <span className="flex-1 truncate text-slate-500">{l.notes}</span>
                  <button className="text-red-600 hover:underline" onClick={() => setRemoving(l)}>Remove</button>
                </div>
              ))}
            </div>
            <Pagination page={logs} onChange={setPageNo} />
          </>
        )}
      </div>
      {removing && <Confirm message={`Remove the log for ${removing.log_date}?`} confirmLabel="Remove" onConfirm={remove} onCancel={() => setRemoving(null)} />}
    </div>
  );
}
