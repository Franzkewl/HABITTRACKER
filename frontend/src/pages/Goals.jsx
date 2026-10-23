import { useCallback, useEffect, useState } from 'react';
import api, { parseError } from '../api';
import { useToast } from '../context/ToastContext';
import { Confirm, Empty, Field, Modal, Pagination, Spinner } from '../components/UI';

const tomorrow = () => new Date(Date.now() + 86400000).toLocaleDateString('en-CA');

function GoalForm({ goal, habits, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ habit_id: goal?.habit_id || habits[0]?.id || '', title: goal?.title || '', target_value: goal?.target_value || 30, target_date: goal?.target_date || '' });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const local = {};
    if (!form.habit_id) local.habit_id = 'Choose a habit.';
    if (!form.title.trim()) local.title = 'Title is required.';
    if (Number(form.target_value) < 1) local.target_value = 'Target must be at least 1.';
    if (!form.target_date || form.target_date < tomorrow()) local.target_date = 'Pick a date after today.';
    setErrors(local);
    if (Object.keys(local).length) return;
    try {
      const body = { ...form, habit_id: Number(form.habit_id), target_value: Number(form.target_value) };
      if (goal?.id) await api.put(`/goals/${goal.id}`, body); else await api.post('/goals', body);
      toast.success('Goal saved.'); onSaved();
    } catch (err) { const { message, fields } = parseError(err); setErrors(fields); toast.error(message); }
  };

  return (
    <Modal title={goal?.id ? 'Edit goal' : 'New goal'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <Field label="Habit" error={errors.habit_id}>
          <select className="input" value={form.habit_id} onChange={set('habit_id')}>
            {habits.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </Field>
        <Field label="Goal title" error={errors.title}><input className="input" placeholder="e.g. Read 30 times this month" value={form.title} onChange={set('title')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Completions needed" error={errors.target_value}><input className="input" type="number" min="1" value={form.target_value} onChange={set('target_value')} /></Field>
          <Field label="Target date" error={errors.target_date}><input className="input" type="date" min={tomorrow()} value={form.target_date} onChange={set('target_date')} /></Field>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary">Save</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Goals() {
  const toast = useToast();
  const [page, setPage] = useState(null);
  const [habits, setHabits] = useState([]);
  const [pageNo, setPageNo] = useState(1);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => api.get('/goals', { params: { page: pageNo } }).then((r) => setPage(r.data)).catch((e) => toast.error(parseError(e).message)), [pageNo, toast]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/habits', { params: { per_page: 100, status: 'active' } }).then((r) => setHabits(r.data.data)); }, []);

  const remove = async () => {
    try { await api.delete(`/goals/${deleting.id}`); toast.success('Goal deleted.'); setDeleting(null); load(); }
    catch (e) { toast.error(parseError(e).message); }
  };

  if (!page) return <Spinner />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Goals</h1>
        <button className="btn-primary" disabled={habits.length === 0} onClick={() => setEditing({})}>+ New goal</button>
      </div>
      {habits.length === 0 && <p className="text-sm text-slate-500">Create an active habit first to set a goal for it.</p>}
      {page.data.length === 0 ? <Empty title="No goals yet">Goals turn habits into targets, like “30 completions by month end”.</Empty> : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {page.data.map((g) => {
              const pct = Math.round((g.progress / g.target_value) * 100);
              return (
                <div key={g.id} className="card space-y-2">
                  <div className="flex items-start justify-between">
                    <div><p className="font-semibold">{g.title}</p><p className="text-xs text-slate-500">{g.habit?.name} · by {g.target_date}</p></div>
                    <span className={`rounded px-2 py-0.5 text-xs capitalize ${g.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{g.status}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-slate-100"><div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} /></div>
                  <p className="text-xs text-slate-500">{g.progress} / {g.target_value} ({pct}%)</p>
                  <div className="flex gap-2">
                    <button className="btn-ghost flex-1" onClick={() => setEditing(g)}>Edit</button>
                    <button className="btn-ghost flex-1 text-red-600" onClick={() => setDeleting(g)}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination page={page} onChange={setPageNo} />
        </>
      )}
      {editing && <GoalForm goal={editing.id ? editing : null} habits={habits} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      {deleting && <Confirm message={`Delete the goal “${deleting.title}”?`} onConfirm={remove} onCancel={() => setDeleting(null)} />}
    </div>
  );
}
