import { useCallback, useEffect, useState } from 'react';
import api, { parseError } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Confirm, Empty, Pagination, Spinner } from '../../components/UI';

export default function AdminUsers() {
  const toast = useToast();
  const { user: me } = useAuth();
  const [page, setPage] = useState(null);
  const [pageNo, setPageNo] = useState(1);
  const [filters, setFilters] = useState({ search: '', role: '', status: '' });
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    const params = Object.fromEntries(Object.entries({ ...filters, page: pageNo }).filter(([, v]) => v !== ''));
    return api.get('/admin/users', { params }).then((r) => setPage(r.data)).catch((e) => toast.error(parseError(e).message));
  }, [filters, pageNo, toast]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const update = async (u, patch) => {
    try { await api.put(`/admin/users/${u.id}`, patch); toast.success('User updated.'); load(); }
    catch (e) { toast.error(parseError(e).message); }
  };
  const remove = async () => {
    try { await api.delete(`/admin/users/${deleting.id}`); toast.success('User deleted.'); setDeleting(null); load(); }
    catch (e) { toast.error(parseError(e).message); setDeleting(null); }
  };
  const setF = (k) => (e) => { setPageNo(1); setFilters({ ...filters, [k]: e.target.value }); };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Users</h1>
      <div className="card grid gap-3 md:grid-cols-3">
        <input className="input" placeholder="Search name or email…" value={filters.search} onChange={setF('search')} />
        <select className="input" value={filters.role} onChange={setF('role')}><option value="">Any role</option><option value="user">User</option><option value="admin">Admin</option></select>
        <select className="input" value={filters.status} onChange={setF('status')}><option value="">Any status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
      </div>
      {!page ? <Spinner /> : page.data.length === 0 ? <Empty title="No users match" /> : (
        <>
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Habits</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
              <tbody className="divide-y">
                {page.data.map((u) => (
                  <tr key={u.id}>
                    <td className="p-3 font-medium">{u.name}</td><td className="p-3">{u.email}</td>
                    <td className="p-3 capitalize">{u.role}</td><td className="p-3">{u.habits_count}</td>
                    <td className="p-3"><span className={`rounded px-2 py-0.5 text-xs capitalize ${u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{u.status}</span></td>
                    <td className="space-x-3 p-3 text-right">
                      {u.id !== me.id && (<>
                        <button className="text-brand-600 hover:underline" onClick={() => update(u, { status: u.status === 'active' ? 'inactive' : 'active' })}>{u.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                        <button className="text-brand-600 hover:underline" onClick={() => update(u, { role: u.role === 'admin' ? 'user' : 'admin' })}>{u.role === 'admin' ? 'Make user' : 'Make admin'}</button>
                        <button className="text-red-600 hover:underline" onClick={() => setDeleting(u)}>Delete</button>
                      </>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} onChange={setPageNo} />
        </>
      )}
      {deleting && <Confirm message={`Delete ${deleting.name} and all of their data?`} onConfirm={remove} onCancel={() => setDeleting(null)} />}
    </div>
  );
}
