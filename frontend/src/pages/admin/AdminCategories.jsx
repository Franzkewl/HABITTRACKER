import { useCallback, useEffect, useState } from 'react';
import api, { parseError } from '../../api';
import { useToast } from '../../context/ToastContext';
import { Confirm, Empty, Field, Modal, Spinner } from '../../components/UI';

function CategoryForm({ item, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: item?.name || '', description: item?.description || '', color: item?.color || '#6366f1' });
  const [errors, setErrors] = useState({});
  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setErrors({ name: 'Name is required.' });
    try {
      if (item?.id) await api.put(`/admin/categories/${item.id}`, form); else await api.post('/admin/categories', form);
      toast.success('Category saved.'); onSaved();
    } catch (err) { const { message, fields } = parseError(err); setErrors(fields); toast.error(message); }
  };
  return (
    <Modal title={item?.id ? 'Edit category' : 'New category'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <Field label="Name" error={errors.name}><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Description" error={errors.description}><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <Field label="Color" error={errors.color}><input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></Field>
        <div className="mt-4 flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary">Save</button></div>
      </form>
    </Modal>
  );
}

export default function AdminCategories() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const load = useCallback(() => api.get('/admin/categories').then((r) => setItems(r.data)).catch((e) => toast.error(parseError(e).message)), [toast]);
  useEffect(() => { load(); }, [load]);

  const remove = async () => {
    try { await api.delete(`/admin/categories/${deleting.id}`); toast.success('Category deleted.'); setDeleting(null); load(); }
    catch (e) { toast.error(parseError(e).message); }
  };

  if (!items) return <Spinner />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Categories</h1><button className="btn-primary" onClick={() => setEditing({})}>+ New category</button></div>
      {items.length === 0 ? <Empty title="No categories" /> : (
        <div className="card divide-y p-0">
          {items.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className="h-4 w-4 rounded-full" style={{ background: c.color }} />
              <span className="font-medium">{c.name}</span><span className="flex-1 text-slate-500">{c.description}</span>
              <span className="text-slate-400">{c.habits_count} habits</span>
              <button className="text-brand-600 hover:underline" onClick={() => setEditing(c)}>Edit</button>
              <button className="text-red-600 hover:underline" onClick={() => setDeleting(c)}>Delete</button>
            </div>
          ))}
        </div>
      )}
      {editing && <CategoryForm item={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      {deleting && <Confirm message={`Delete “${deleting.name}”? Habits in it will become uncategorized.`} onConfirm={remove} onCancel={() => setDeleting(null)} />}
    </div>
  );
}
