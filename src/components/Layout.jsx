import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineHome, HiOutlineUserAdd, HiOutlineTruck,
  HiOutlineClipboardList, HiOutlineLogout, HiOutlineMenu, HiOutlineX,
  HiOutlineShieldCheck, HiOutlineUsers
} from 'react-icons/hi';

export default function Layout() {
  const { employee, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = [
    { to: '/dashboard', icon: <HiOutlineHome />, label: 'Dashboard' },
    { to: '/register-user', icon: <HiOutlineUserAdd />, label: 'Register Customer' },
    { to: '/customers', icon: <HiOutlineUsers />, label: 'Customers' },
    { to: '/bikes', icon: <HiOutlineTruck />, label: 'Bikes' },
    { to: '/rentals', icon: <HiOutlineClipboardList />, label: 'Rentals' },
    { to: '/deposits', icon: <HiOutlineShieldCheck />, label: 'Deposits' },
  ];

  return (
    <div className="app-layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand" style={{ marginBottom: 'var(--space-xl)' }}>
          <img src="/logo.jpeg" alt="StartEv" style={{ height: '80px', objectFit: 'contain' }} />
        </div>
        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}>
              {link.icon}<span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{employee?.name}</p>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Store: {employee?.store_id}</p>
          </div>
          <button className="sidebar-link" onClick={handleLogout} style={{ color: 'var(--error)' }}>
            <HiOutlineLogout /> Logout
          </button>
        </div>
      </aside>
      <div className="main-content">
        <header className="topbar">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <HiOutlineX /> : <HiOutlineMenu />}
          </button>
          <div></div>
          <div className="topbar-actions">
            <span className="badge badge-purple">Store: {employee?.store_id}</span>
          </div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}
