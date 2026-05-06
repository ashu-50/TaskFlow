import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard">
          <span className="brand-icon">⬡</span>
          <span className="brand-name">TaskFlow</span>
        </Link>
      </div>

      <div className="navbar-links">
        <Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>
          Dashboard
        </Link>

        <Link to="/projects" className={isActive('/projects') ? 'active' : ''}>
          Projects
        </Link>

        <Link to="/tasks" className={isActive('/tasks') ? 'active' : ''}>
          My Tasks
        </Link>

        {isAdmin && (
          <Link to="/admin" className={isActive('/admin') ? 'active' : ''}>
            Admin
          </Link>
        )}
      </div>

      <div className="navbar-user">
        <span className={`role-badge role-${user.role}`}>
          {user.role}
        </span>

        <span className="user-name">
          {user.name || 'User'}
        </span>

        <button className="btn-logout" onClick={handleLogout} aria-label="Logout">
          Sign Out
        </button>
      </div>
    </nav>
  );
};