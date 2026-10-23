import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import { Spinner } from './components/UI';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Habits from './pages/Habits';
import HabitDetail from './pages/HabitDetail';
import Goals from './pages/Goals';
import Reminders from './pages/Reminders';
import Stats from './pages/Stats';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCategories from './pages/admin/AdminCategories';

/** Role-based route guard. role="admin" -> admins only; role="user" -> regular users only. */
function Protected({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'admin' && user.role !== 'admin') return <Navigate to="/" replace />;
  if (role === 'user' && user.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/profile" element={<Profile />} />

        <Route path="/" element={<Protected role="user"><Dashboard /></Protected>} />
        <Route path="/habits" element={<Protected role="user"><Habits /></Protected>} />
        <Route path="/habits/:id" element={<Protected role="user"><HabitDetail /></Protected>} />
        <Route path="/goals" element={<Protected role="user"><Goals /></Protected>} />
        <Route path="/reminders" element={<Protected role="user"><Reminders /></Protected>} />
        <Route path="/stats" element={<Protected role="user"><Stats /></Protected>} />
        <Route path="/notifications" element={<Protected role="user"><Notifications /></Protected>} />

        <Route path="/admin" element={<Protected role="admin"><AdminOverview /></Protected>} />
        <Route path="/admin/users" element={<Protected role="admin"><AdminUsers /></Protected>} />
        <Route path="/admin/categories" element={<Protected role="admin"><AdminCategories /></Protected>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
