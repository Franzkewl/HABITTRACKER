import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { parseError } from '../api';
import { useToast } from '../context/ToastContext';
import { Empty, Spinner } from '../components/UI';

export default function Stats() {
  const toast = useToast();
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    api.get('/stats', { params: { days } }).then((r) => setData(r.data)).catch((e) => toast.error(parseError(e).message));
  }, [days, toast]);

  if (!data) return <Spinner />;
  const total = data.daily.reduce((s, d) => s + d.completed, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Progress</h1>
        <select className="input w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option>
        </select>
      </div>
      {data.habits.length === 0 ? <Empty title="Nothing to chart yet">Create and log a habit to see statistics.</Empty> : (
        <>
          <div className="card">
            <h2 className="mb-1 font-semibold">Completions per day</h2>
            <p className="mb-3 text-xs text-slate-500">{total} completions in this period</p>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={data.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="completed" stroke="#4f46e5" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <h2 className="mb-3 font-semibold">Completion rate by habit (%)</h2>
            <div style={{ height: Math.max(180, data.habits.length * 44) }}>
              <ResponsiveContainer>
                <BarChart data={data.habits} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} fontSize={12} />
                  <YAxis type="category" dataKey="name" width={140} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="completion_rate" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Habit</th><th className="p-3">Rate</th><th className="p-3">Current streak</th><th className="p-3">Longest streak</th></tr></thead>
              <tbody className="divide-y">
                {data.habits.map((h) => <tr key={h.id}><td className="p-3 font-medium">{h.name}</td><td className="p-3">{h.completion_rate}%</td><td className="p-3">{h.current_streak}</td><td className="p-3">{h.longest_streak}</td></tr>)}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
