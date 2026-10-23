import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { parseError } from '../../api';
import { useToast } from '../../context/ToastContext';
import { Spinner, StatCard } from '../../components/UI';

export default function AdminOverview() {
  const toast = useToast();
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/admin/stats').then((r) => setS(r.data)).catch((e) => toast.error(parseError(e).message)); }, [toast]);
  if (!s) return <Spinner />;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin overview</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Users" value={s.total_users} />
        <StatCard label="Active users" value={s.active_users} />
        <StatCard label="Habits" value={s.total_habits} />
        <StatCard label="Completions today" value={s.completions_today} />
      </div>
      <div className="card">
        <h2 className="mb-3 font-semibold">Completions, last 14 days</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={s.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="completed" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
