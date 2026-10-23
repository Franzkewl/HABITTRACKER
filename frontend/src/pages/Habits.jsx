import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { parseError } from '../api';
import { useToast } from '../context/ToastContext';
import { CategoryBadge, Confirm, Empty, Field, Modal, Pagination, Spinner, today } from '../components/UI';

const blank = { name: '', description: '', category_id: '', frequency: 'daily', target_per_period: 1, start_date: today(), status: 'active' };

function HabitForm({ initial, categories, onSaved, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState({ ...blank, ...initial, category_id: initial?.category_id ?? '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const local = {};
    if (!form.name.trim()) local.name = 'Name is required.';
    if (!form.start_date) local.start_date = 'Start date is required.';
    if (Number(form.target_per_period) < 1) local.target_per_period = 'Target must be at least 1.';
    setErrors(local);
    if (Object.keys(local).length) return;

    setBusy(true);
    const payload = { ...form, category_id: form.category_id || null, target_per_period: Number(form.target_per_period) };
    try {
      if (initial?.id) await api.put(`/habits/${initial.id}`, payload);
      else await api.post('/habits', payload);
      toast.success(initial?.id ? 'Habit updated.' : 'Habit created.');
      onSaved();
    } catch (err) {
      const { message, fields } = parseError(err);
      setErrors(fields);
      toast.error(message);
    } finally { setBusy(false); }
  };

  return (
    <Modal title={initial?.id ? 'Edit habit' : 'New habit'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <Field label="Name" error={errors.name}><input className="input" value={form.name} onChange={set('name')} /></Field>
        <Field label="Description" error={errors.description}><textarea className="input" rows={2} value={form.description || ''} onChange={set('description')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category" error={errors.category_id}>
            <select className="input" value={form.category_id} onChange={set('category_id')}>
              <option value="">None</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Frequency" error={errors.frequency}>
            <select className="input" value={form.frequency} onChange={set('frequency')}>
              <option value="daily">Daily</option><option value="weekly">Weekly</option>
            </select>
          </Field>
          <Field label={form.frequency === 'weekly' ? 'Times per week' : 'Times per day'} error={errors.target_per_period}>
            <input className="input" type="number" min="1" max="7" value={form.target_per_period} onChange={set('target_per_period')} />
          </Field>
          <Field label="Start date" error={errors.start_date}><input className="input" type="date" value={form.start_date} onChange={set('start_date')} /></Field>
        </div>
        {initial?.id && (
          <Field label="Status" error={errors.status}>
            <select className="input" value={form.status} onChange={set('status')}>
              <option value="active">Active</option><option value="paused">Paused</option><option value="archived">Archived</option>
            </select>
          </Field>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Habits() {
  const toast = useToast();
  const [page, setPage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: '', category_id: '', frequency: '', status: '' });
  const [pageNo, setPageNo] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | {} (new) | habit
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries({ ...filters, page: pageNo }).filter(([, v]) => v !== ''));
      const { data } = await api.get('/habits', { params });
      setPage(data);
    } catch (e) { toast.error(parseError(e).message); }
    finally { setLoading(false); }
  }, [filters, pageNo, toast]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => { api.get('/categories').then((r) => setCategories(r.data)); }, []);

  const setFilter = (k) => (e) => { setPageNo(1); setFilters({ ...filters, [k]: e.target.value }); };

  const remove = async () => {
    try { await api.delete(`/habits/${deleting.id}`); toast.success('Habit deleted.'); setDeleting(null); load(); }
    catch (e) { toast.error(parseError(e).message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Habits</h1>
        <button className="btn-primary" onClick={() => setEditing({})}>+ New habit</button>
      </div>

      <div className="card grid gap-3 md:grid-cols-4">
        <input className="input" placeholder="Search by name…" value={filters.search} onChange={setFilter('search')} />
        <select className="input" value={filters.category_id} onChange={setFilter('category_id')}>
          <option value="">All categories</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input" value={filters.frequency} onChange={setFilter('frequency')}>
          <option value="">Any frequency</option><option value="daily">Daily</option><option value="weekly">Weekly</option>
        </select>
        <select className="input" value={filters.status} onChange={setFilter('status')}>
          <option value="">Any status</option><option value="active">Active</option><option value="paused">Paused</option><option value="archived">Archived</option>
        </select>
      </div>

      {loading && !page ? <Spinner /> : page?.data.length === 0 ? (
        <Empty title="No habits found">Try different filters or create a new habit.</Empty>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {page?.data.map((h) => (
              <div key={h.id} className="card flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/habits/${h.id}`} className="font-semibold hover:text-brand-600">{h.name}</Link>
                  <span className={`rounded px-2 py-0.5 text-xs capitalize ${h.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{h.status}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CategoryBadge category={h.category} />
                  <span className="capitalize">{h.frequency} × {h.target_per_period}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>{h.current_streak} 🔥 <span className="text-xs text-slate-400">best {h.longest_streak}</span></span>
                  <span className="text-slate-500">{h.completion_rate}% (30d)</span>
                </div>
                <div className="h-2 overflow-hidden rounded bg-slate-100"><div className="h-full bg-brand-500" style={{ width: `${h.completion_rate}%` }} /></div>
                <div className="flex gap-2">
                  <button className="btn-ghost flex-1" onClick={() => setEditing(h)}>Edit</button>
                  <button className="btn-ghost flex-1 text-red-600" onClick={() => setDeleting(h)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} onChange={setPageNo} />
        </>
      )}

      {editing && <HabitForm initial={editing} categories={categories} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      {deleting && <Confirm message={`Delete “${deleting.name}” and all of its logs, goals and reminders? This cannot be undone.`} onConfirm={remove} onCancel={() => setDeleting(null)} />}
    </div>
  );
}
