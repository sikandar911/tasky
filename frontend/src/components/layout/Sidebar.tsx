import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, Users, LogOut, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Sidebar() {
  const { user, logout, isSuperAdmin } = useAuthStore();
  const isAdminOrAbove = user?.role === 'SUPERADMIN' || user?.role === 'ADMIN';
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-60 flex-shrink-0 bg-bg-secondary border-r border-bg-border flex flex-col h-screen">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-bg-border">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20">
            <Zap size={16} className="text-accent-cyan" />
          </div>
          <span className="text-lg font-bold font-mono tracking-widest text-accent-cyan">TASKY</span>
        </div>
        <p className="text-xs text-text-muted mt-1 font-mono">task management system</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-bg-tertiary text-accent-cyan border-l-2 border-accent-cyan pl-[10px]'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary border-l-2 border-transparent'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
        {isSuperAdmin && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-bg-tertiary text-accent-cyan border-l-2 border-accent-cyan pl-[10px]'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary border-l-2 border-transparent'
              }`
            }
          >
            <Users size={16} />
            Users
          </NavLink>
        )}
        {!isSuperAdmin && isAdminOrAbove && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-bg-tertiary text-accent-cyan border-l-2 border-accent-cyan pl-[10px]'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary border-l-2 border-transparent'
              }`
            }
          >
            <Users size={16} />
            Users
          </NavLink>
        )}
      </nav>

      {/* User info */}
      <div className="px-3 py-4 border-t border-bg-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-bg-tertiary transition-colors">
          <div className="w-8 h-8 rounded-full bg-accent-cyan/20 border border-accent-cyan/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold font-mono text-accent-cyan">
              {user ? getInitials(user.full_name) : '??'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{user?.full_name}</p>
            <p className="text-xs text-text-muted font-mono truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-accent-red hover:bg-accent-red/10 transition-all"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
