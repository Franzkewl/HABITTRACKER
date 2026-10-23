import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { parseError } from '../api';
import { Field } from '../components/UI';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const local = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) local.email = 'Enter a valid email address.';
    if (!form.password) local.password = 'Password is required.';
    setErrors(local);
    if (Object.keys(local).length) return;

    setBusy(true);
    try {
      const u = await login(form.email, form.password);
      navigate(u.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      const { message, fields } = parseError(err);
      setErrors({ ...fields, form: message });
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm" noValidate>
        <h1 className="mb-1 text-2xl font-bold text-brand-600">✓ HabitTracker</h1>
        <p className="mb-5 text-sm text-slate-500">Log in to continue your streak.</p>
        {errors.form && <p className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{errors.form}</p>}
        <Field label="Email" error={errors.email}>
          <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password" error={errors.password}>
          <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <p className="mt-4 text-center text-sm text-slate-500">No account? <Link className="text-brand-600" to="/register">Register</Link></p>
        <p className="mt-3 text-center text-xs text-slate-400">Demo: user@habittracker.test / admin@habittracker.test — password</p>
      </form>
    </div>
  );
}
