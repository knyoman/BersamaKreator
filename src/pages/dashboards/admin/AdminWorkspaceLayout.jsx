import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faShieldHalved,
  faSignOut,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { signOut } from '../../../services/api';
import { adminNavItems } from './adminWorkspaceConfig';

const SidebarContent = ({ userProfile, onNavigate, onLogout }) => (
  <div className="h-full flex flex-col bg-gray-950 text-white">
    <div className="px-4 py-4 border-b border-white/10">
      <Link to="/dashboard/overview" onClick={onNavigate} className="inline-flex items-center">
        <div className="bg-white px-3 py-1.5 rounded-md shadow-md flex items-center justify-center">
          <img src="/images/LogoHeader.png" alt="Bersama Kreator" className="h-7 w-auto" />
        </div>
      </Link>
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase text-gray-400">Ruang Kendali Admin</p>
        <p className="text-sm font-bold text-white mt-1 truncate">{userProfile?.name || 'Admin Platform'}</p>
        <p className="text-xs text-gray-400 truncate">{userProfile?.email || 'Kelola operasional platform'}</p>
      </div>
    </div>

    <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto custom-scrollbar">
      {adminNavItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-semibold transition-colors ${
            isActive
              ? 'bg-white text-gray-950'
              : 'text-gray-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          <FontAwesomeIcon icon={item.icon} className="w-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>

    <div className="p-3 border-t border-white/10">
      <button
        type="button"
        onClick={onLogout}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-semibold text-red-200 hover:bg-red-500/10 hover:text-red-100 transition-colors"
      >
        <FontAwesomeIcon icon={faSignOut} className="w-4" />
        Keluar
      </button>
    </div>
  </div>
);

const AdminWorkspaceLayout = ({ userProfile, children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();

  const closeMobile = () => setIsMobileOpen(false);

  const handleLogout = async () => {
    await signOut();
    closeMobile();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-[240px]">
        <SidebarContent userProfile={userProfile} onNavigate={() => {}} onLogout={handleLogout} />
      </aside>

      <div className="lg:col-start-2 min-w-0">
        <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="h-14 px-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="w-9 h-9 rounded-md border border-gray-200 text-gray-700"
              title="Buka menu"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
            <img src="/images/LogoHeader.png" alt="Bersama Kreator" className="h-8 w-auto" />
            <FontAwesomeIcon icon={faShieldHalved} className="w-9 text-gray-500" />
          </div>
        </header>

        <main className="p-3 sm:p-5 lg:p-6">
          <div className="dashboard-content max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={closeMobile}
            aria-label="Tutup menu"
          />
          <div className="relative w-[260px] max-w-[86vw] h-full shadow-2xl">
            <button
              type="button"
              onClick={closeMobile}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-md bg-white/10 text-white"
              title="Tutup menu"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <SidebarContent userProfile={userProfile} onNavigate={closeMobile} onLogout={handleLogout} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkspaceLayout;
