import { useCallback, useEffect, useState } from 'react';
import api, { parseError } from '../api';
import { useToast } from '../context/ToastContext';
import { Confirm, Empty, Field, Modal, Spinner } from '../components/UI';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function ReminderForm({ reminder, habits, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    habit_id: reminder?.habit_id || habits[0]?.id || '',
    remind_time: reminder?.remind_time?.slice(0, 5) || '08:00',
    days_of_week: reminder?.days_of_week || [1, 2, 3, 4, 5],
    is_active: reminder?.is_active ?? true,
  });
  const [errors, setErrors] = useState({});
  const toggleDay = (d) => setForm({ ...form, days_of_week: form.days_of_week.includes(d) ? form.days_of_week.filter((x) => x !== d) : [...form.days_of_week, d].sort() });

  const submit = async (e) => {
    e.preventDefault();
    const local = {};
    if (!form.habit_id) local.habit_id = 'Choose a habit.';
    if (!form.remind_time) local.remind_time = 'Pick a time.';
    if (form.days_of_week.length === 0) local.days_of_week = 'Select at least one day.';
    setErrors(local);
    if (Object.keys(local).length) return;
    try {
      const body = { ...form, habit_id: Number(form.habit_id) };
      if (reminder?.id) await api.put(`/reminders/${reminder.id}`, body); else await api.post('/reminders', body);
      toast.success('Reminder saved.'); onSaved();
    } catch (err) { const { message, fields } = parseError(err); setErrors(fields); toast.error(message); }
  };

  return (
    <Modal title={reminder?.id ? 'Edit reminder' : 'New reminder'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <Field label="Habit" error={errors.habit_id}>
          <select className="input" value={form.habit_id} onChange={(e) => setForm({ ...form, habit_id: e.target.value })}>
            {habits.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </Field>
        <Field label="Time" error={errors.remind_time}><input className="input" type="time" value={form.remind_time} onChange={(e) => setForm({ ...form, remind_time: e.target.value })} /></Field>
        <Field label="Days" error={errors.days_of_week}>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d, i) => (
              <button type="button" key={d} onClick={() => toggleDay(i)}
                className={`rounded-lg border px-3 py-1 text-sm ${form.days_of_week.includes(i) ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300'}`}>{d}</button>
            ))}
          </div>
        </Field>
        <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary">Save</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Reminders() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [habits, setHabits] = useState([]);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => api.get('/reminders').then((r) => setItems(r.data)).catch((e) => toast.error(parseError(e).message)), [toast]);
  useEffect(() => { load(); api.get('/habits', { params: { per_page: 100, status: 'active' } }).then((r) => setHabits(r.data.data)); }, [load]);

  const remove = async () => {
    try { await api.delete(`/reminders/${deleting.id}`); toast.success('Reminder deleted.'); setDeleting(null); load(); }
    catch (e) { toast.error(parseError(e).message); }
  };

  if (!items) return <Spinner />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reminders</h1>
        <button className="btn-primary" disabled={habits.length === 0} onClick={() => setEditing({})}>+ New reminder</button>
      </div>
      <p className="text-sm text-slate-500">Reminders appear on your dashboard once their time has passed and the habit isn’t done yet.</p>
      {items.length === 0 ? <Empty title="No reminders yet" /> : (
        <div className="card divide-y p-0">
          {items.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
              <span className="w-14 font-semibold">{r.remind_time.slice(0, 5)}</span>
              <span className="flex-1 font-medium">{r.habit?.name}</span>
              <span className="text-slate-500">{r.days_of_week.map((d) => DAYS[d]).join(', ')}</span>
              <span className={`rounded px-2 py-0.5 text-xs ${r.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{r.is_active ? 'Active' : 'Off'}</span>
              <button className="text-brand-600 hover:underline" onClick={() => setEditing(r)}>Edit</button>
              <button className="text-red-600 hover:underline" onClick={() => setDeleting(r)}>Delete</button>
            </div>
          ))}
        </div>
      )}
      {editing && <ReminderForm reminder={editing.id ? editing : null} habits={habits} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      {deleting && <Confirm message="Delete this reminder?" onConfirm={remove} onCancel={() => setDeleting(null)} />}
    </div>
  );
}
