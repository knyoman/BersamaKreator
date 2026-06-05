import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faSignOut, faTimes, faUser } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { signOut } from '../../services/api';

const publicNavLinks = [
  { to: '/', label: 'Beranda' },
  { to: '/influencers', label: 'Influencer' },
  { to: '/about', label: 'Tentang' },
  { to: '/ai-recommendations', label: 'Rekomendasi AI' },
];

const getRoleLabel = (userType) => {
  const labels = {
    sme: 'Pemilik Bisnis',
    influencer: 'Influencer',
    admin: 'Admin',
  };

  return labels[userType] || 'Pengguna';
};

const getNavLinks = (userProfile) => {
  if (userProfile?.user_type === 'influencer') {
    return [
      { to: '/dashboard/overview', label: 'Dasbor' },
      { to: '/dashboard/performance', label: 'Analisis' },
      { to: '/dashboard/ai-assistant', label: 'AI' },
      { to: '/dashboard/portfolio', label: 'Portofolio' },
      { to: '/dashboard/pricing', label: 'Paket' },
      { to: '/dashboard/availability', label: 'Ketersediaan' },
      { to: '/dashboard/campaigns', label: 'Promosi' },
      { to: '/dashboard/earnings', label: 'Penghasilan' },
      { to: '/dashboard/reviews', label: 'Ulasan' },
      ...(userProfile.username ? [{ to: `/influencer/${userProfile.username}`, label: 'Profil Publik' }] : []),
    ];
  }

  if (userProfile?.user_type === 'sme') {
    return [
      { to: '/dashboard/overview', label: 'Dasbor' },
      { to: '/dashboard/campaigns', label: 'Promosi' },
      { to: '/dashboard/influencers', label: 'Cari Influencer' },
      { to: '/dashboard/ai-assistant', label: 'Asisten AI' },
      { to: '/dashboard/payments', label: 'Pembayaran' },
      { to: '/dashboard/insights', label: 'Analisis' },
    ];
  }

  return publicNavLinks;
};

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, userProfile } = useAuth();

  const navLinks = getNavLinks(userProfile);
  const isRoleWorkspace = isAuthenticated && ['influencer', 'sme', 'admin'].includes(userProfile?.user_type);
  const isDashboardPath = location.pathname.startsWith('/dashboard');
  const logoTarget = isRoleWorkspace ? '/dashboard' : '/';

  if (isRoleWorkspace && isDashboardPath) {
    return null;
  }

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    closeMenus();
    navigate('/login');
  };

  const isActiveLink = (link) => {
    const currentPath = `${location.pathname}${location.hash}`;
    if (link.to.includes('#')) return currentPath === link.to;
    if (location.hash) return currentPath === link.to;
    return location.pathname === link.to;
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <nav className="container-custom">
        <div className="flex items-center justify-between h-14">
          <Link to={logoTarget} className="flex items-center space-x-2" onClick={closeMenus}>
            <img
              src="/images/LogoHeader.png"
              alt="Bersama Kreator"
              className="h-8 w-auto"
            />
          </Link>

          <div className="hidden md:flex items-center space-x-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors text-xs ${
                  isActiveLink(link)
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated && userProfile ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((current) => !current)}
                  className="flex items-center space-x-2 px-2.5 py-1.5 rounded-md hover:bg-gray-100"
                >
                  <FontAwesomeIcon icon={faUser} className="text-xs text-gray-600" />
                  <span className="text-gray-700 font-semibold text-xs">{userProfile.name}</span>
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-700">{userProfile.name}</p>
                      <p className="text-xs text-gray-500">{userProfile.email}</p>
                      <p className="text-xs text-gray-500">{getRoleLabel(userProfile.user_type)}</p>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setIsProfileOpen(false)}
                      className="block w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                    >
                      Dasbor
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <FontAwesomeIcon icon={faSignOut} />
                      <span>Keluar</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-gray-900 font-semibold text-xs">
                  Masuk
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Mulai Sekarang
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="md:hidden w-9 h-9 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} />
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-3 border-t border-gray-100">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`block px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                    isActiveLink(link)
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  onClick={closeMenus}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
              {isAuthenticated && userProfile ? (
                <>
                  <div className="px-3 py-2.5 bg-gray-50 rounded-md mb-2">
                    <p className="text-sm font-medium text-gray-700">{userProfile.name}</p>
                    <p className="text-xs text-gray-500">{userProfile.email}</p>
                    <p className="text-xs text-gray-500">{getRoleLabel(userProfile.user_type)}</p>
                  </div>
                  <button type="button" onClick={handleLogout} className="block w-full btn btn-outline text-center">
                    Keluar
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={closeMenus} className="block btn btn-outline w-full text-center">
                    Masuk
                  </Link>
                  <Link to="/register" onClick={closeMenus} className="block btn btn-primary w-full text-center">
                    Mulai Sekarang
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
