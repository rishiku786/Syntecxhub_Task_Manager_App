import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FiLogOut, FiCheckSquare, FiUser, FiList, FiActivity, FiSliders } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Navbar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand row layout for mobile and desktop */}
        <div className="navbar-brand-row">
          <div className="navbar-brand">
            <FiCheckSquare className="brand-icon" />
            <span className="brand-text">TaskSphere</span>
          </div>
          {user && (
            <button className="mobile-logout-btn" onClick={handleLogout} title="Logout">
              <FiLogOut />
            </button>
          )}
        </div>

        {user && (
          <>
            {/* Sidebar navigation links */}
            <div className="navbar-links">
              <button 
                className={`navbar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <FiList className="nav-link-icon" />
                <span>Dashboard</span>
              </button>
              <button 
                className={`navbar-link ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                <FiActivity className="nav-link-icon" />
                <span>Analytics</span>
              </button>
              <button 
                className={`navbar-link ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <FiSliders className="nav-link-icon" />
                <span>Settings</span>
              </button>
            </div>

            {/* Sidebar action and user profile at the bottom */}
            <div className="navbar-actions">
              <div className="navbar-user">
                <div className="navbar-user-avatar">
                  {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U'}
                </div>
                <div className="navbar-user-info">
                  <span className="navbar-user-name">{user.name}</span>
                  <span className="navbar-user-role">Product Lead</span>
                </div>
              </div>
              <button className="logout-btn" onClick={handleLogout} title="Logout">
                <FiLogOut className="btn-icon" />
                <span className="btn-text">Logout</span>
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

