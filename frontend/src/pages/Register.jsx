import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { parseError } from '../api';
import { Field } from '../components/UI';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const local = {};
    if (!form.name.trim()) local.name = 'Name is required.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) local.email = 'Enter a valid email address.';
    if (form.password.length < 8) local.password = 'Password must be at least 8 characters.';
    if (form.password !== form.password_confirmation) local.password_confirmation = 'Passwords do not match.';
    setErrors(local);
    if (Object.keys(local).length) return;

    setBusy(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      const { message, fields } = parseError(err);
      setErrors({ ...fields, form: message });
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm" noValidate>
        <h1 className="mb-1 text-2xl font-bold text-brand-600">Create account</h1>
        <p className="mb-5 text-sm text-slate-500">Start building better habits today.</p>
        {errors.form && !Object.keys(errors).some((k) => k !== 'form' && errors[k]) && (
          <p className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{errors.form}</p>
        )}
        <Field label="Name" error={errors.name}><input className="input" value={form.name} onChange={set('name')} /></Field>
        <Field label="Email" error={errors.email}><input className="input" type="email" value={form.email} onChange={set('email')} /></Field>
        <Field label="Password" error={errors.password}><input className="input" type="password" value={form.password} onChange={set('password')} /></Field>
        <Field label="Confirm password" error={errors.password_confirmation}><input className="input" type="password" value={form.password_confirmation} onChange={set('password_confirmation')} /></Field>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Register'}</button>
        <p className="mt-4 text-center text-sm text-slate-500">Already registered? <Link className="text-brand-600" to="/login">Log in</Link></p>
      </form>
    </div>
  );
}
