import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  User,
  Trophy,
  LogOut,
  ShieldCheck,
  Zap,
  Flame,
  Map
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Navbar({ borderClass = 'border-brand-border' }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { path: '/learning-path', icon: Map, label: 'Learning Path' },
    { path: '/daily-challenge', icon: Flame, label: 'Daily Challenge' },
    { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  ];

  if (user?.isAdmin) {
    navItems.push({ path: '/admin', icon: ShieldCheck, label: 'Admin' });
  }

  const userName = user?.fullName || user?.username || user?.name || 'Learner';
  const userEmail = user?.email || '';
  const avatar = user?.profileImage || user?.avatar;
  const xp = user?.xp || 0;

  return (
    <header className={`sticky top-0 z-50 glass border-b ${borderClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-brand-dark rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-brand-dark">FluentFun</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {/* Navigation Links */}
            <nav className="hidden sm:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                      isActive
                        ? 'bg-white/5 text-brand-dark'
                        : 'text-gray-500 hover:text-brand-dark hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${item.path === '/daily-challenge' ? 'text-orange-500' : ''}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-lg text-sm font-semibold">
                <Zap className="w-4 h-4" />
                <span>{xp}</span>
              </div>
              <div className="relative group">
                <Link to="/profile" className="flex items-center">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={userName}
                      className="w-8 h-8 rounded-full border-2 border-transparent object-cover transition-all duration-200 ease-out group-hover:border-brand-purple group-hover:scale-105 group-hover:shadow-lg group-hover:ring-2 group-hover:ring-brand-purple/40 group-hover:ring-offset-2 group-hover:ring-offset-transparent"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand-dark flex items-center justify-center text-white text-sm font-bold transition-all duration-200 ease-out group-hover:scale-105 group-hover:shadow-lg group-hover:ring-2 group-hover:ring-brand-purple/40 group-hover:ring-offset-2 group-hover:ring-offset-transparent">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                  <div className="p-2">
                    <p className="font-semibold text-brand-dark">{userName}</p>
                    {userEmail && <p className="text-sm text-gray-500">{userEmail}</p>}
                  </div>
                  <div className="h-px bg-brand-border my-1"></div>
                  <Link to="/profile" className="w-full text-left flex items-center space-x-2 p-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center space-x-2 p-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
