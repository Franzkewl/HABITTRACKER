import { useState } from 'react';
import api, { parseError } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Field } from '../components/UI';

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name, email: user.email, password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const local = {};
    if (!form.name.trim()) local.name = 'Name is required.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) local.email = 'Enter a valid email address.';
    if (form.password && form.password.length < 8) local.password = 'Password must be at least 8 characters.';
    if (form.password !== form.password_confirmation) local.password_confirmation = 'Passwords do not match.';
    setErrors(local);
    if (Object.keys(local).length) return;
    try {
      const { data } = await api.put('/me', form);
      setUser(data); setForm({ ...form, password: '', password_confirmation: '' });
      toast.success('Profile updated.');
    } catch (err) { const { message, fields } = parseError(err); setErrors(fields); toast.error(message); }
  };

  return (
    <form onSubmit={submit} className="card mx-auto max-w-md" noValidate>
      <h1 className="mb-4 text-2xl font-bold">Profile</h1>
      <Field label="Name" error={errors.name}><input className="input" value={form.name} onChange={set('name')} /></Field>
      <Field label="Email" error={errors.email}><input className="input" type="email" value={form.email} onChange={set('email')} /></Field>
      <Field label="New password (leave blank to keep)" error={errors.password}><input className="input" type="password" value={form.password} onChange={set('password')} /></Field>
      <Field label="Confirm new password" error={errors.password_confirmation}><input className="input" type="password" value={form.password_confirmation} onChange={set('password_confirmation')} /></Field>
      <button className="btn-primary">Save changes</button>
    </form>
  );
}
