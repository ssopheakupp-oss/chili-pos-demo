import { LayoutGrid, Armchair, CalendarDays, Bike, BarChart3, Settings, LogOut } from 'lucide-react';

const NAV = [
  ['menu', 'Menu', LayoutGrid],
  ['tables', 'Table Services', Armchair],
  ['reservation', 'Reservation', CalendarDays],
  ['delivery', 'Delivery', Bike],
  ['accounting', 'Accounting', BarChart3],
  ['settings', 'Settings', Settings],
];

const initials = (name = '') => name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

export default function Sidebar({ page, setPage, user, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">CHILI<br />POS</div>
        <span>CHILI POS</span>
      </div>
      <nav>
        {NAV.map(([id, label, Icon]) => (
          <button key={id} className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => setPage(id)}>
            <Icon size={18} /> {label}
          </button>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div className="user-chip"><span className="avatar">{initials(user.name)}</span>{user.name}</div>
        <button className="nav-item" onClick={onLogout}><LogOut size={18} /> Logout</button>
      </div>
    </aside>
  );
}
