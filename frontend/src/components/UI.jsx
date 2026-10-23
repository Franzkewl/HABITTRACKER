import { useEffect } from 'react';

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-slate-500" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      {label}
    </div>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="card py-10 text-center">
      <p className="font-medium text-slate-700">{title}</p>
      {children && <p className="mt-1 text-sm text-slate-500">{children}</p>}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4" onMouseDown={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Confirm({ message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  return (
    <Modal title="Are you sure?" onClose={onCancel}>
      <p className="mb-5 text-sm text-slate-600">{message}</p>
      <div className="flex justify-end gap-2">
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn-danger" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

export function Field({ label, error, children }) {
  return (
    <div className="mb-3">
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

export function Pagination({ page, onChange }) {
  if (!page || page.last_page <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-slate-500">Page {page.current_page} of {page.last_page} · {page.total} total</span>
      <div className="flex gap-2">
        <button className="btn-ghost" disabled={page.current_page <= 1} onClick={() => onChange(page.current_page - 1)}>Previous</button>
        <button className="btn-ghost" disabled={page.current_page >= page.last_page} onClick={() => onChange(page.current_page + 1)}>Next</button>
      </div>
    </div>
  );
}

export function StatCard({ label, value, hint }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function CategoryBadge({ category }) {
  if (!category) return null;
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ background: category.color }}>
      {category.name}
    </span>
  );
}

export const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
