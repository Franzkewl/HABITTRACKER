import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api, { parseError } from '../api';
import { useToast } from '../context/ToastContext';
import { Empty, Pagination, Spinner } from '../components/UI';

export default function Notifications() {
  const toast = useToast();
  const { setUnread } = useOutletContext();
  const [data, setData] = useState(null);
  const [pageNo, setPageNo] = useState(1);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications', { params: { page: pageNo } });
      setData(data); setUnread(data.unread);
    } catch (e) { toast.error(parseError(e).message); }
  }, [pageNo, setUnread, toast]);
  useEffect(() => { load(); }, [load]);

  const markRead = async (n) => { if (!n.is_read) { await api.post(`/notifications/${n.id}/read`); load(); } };
  const markAll = async () => { await api.post('/notifications/read-all'); toast.success('All marked as read.'); load(); };

  if (!data) return <Spinner />;
  const page = data.notifications;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <button className="btn-ghost" disabled={data.unread === 0} onClick={markAll}>Mark all as read</button>
      </div>
      {page.data.length === 0 ? <Empty title="You're all caught up">Streak milestones and goal updates will appear here.</Empty> : (
        <>
          <div className="card divide-y p-0">
            {page.data.map((n) => (
              <button key={n.id} onClick={() => markRead(n)} className={`block w-full px-4 py-3 text-left text-sm ${n.is_read ? '' : 'bg-brand-50'}`}>
                <p className="font-medium">{!n.is_read && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-brand-500" />}{n.title}</p>
                <p className="text-slate-600">{n.message}</p>
                <p className="mt-1 text-xs text-slate-400">{new Date(n.created_at).toLocaleString()}</p>
              </button>
            ))}
          </div>
          <Pagination page={page} onChange={setPageNo} />
        </>
      )}
    </div>
  );
}
