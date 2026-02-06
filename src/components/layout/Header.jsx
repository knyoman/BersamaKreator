import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faBars, faTimes, faSignOut } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { signOut } from '../../services/api';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, userProfile, user } = useAuth();

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/influencers', label: 'Influencers' },
    { to: '/about', label: 'About' },
    { to: '/ai-recommendations', label: 'AI Match' },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
    setIsProfileOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <nav className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Simple */}
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/images/LogoHeader.png"
              alt="Bersama Kreator"
              className="h-8 w-auto"
            />
          </Link>


          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated && userProfile ? (
              <div className="relative">
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100">
                  <FontAwesomeIcon icon={faUser} className="text-gray-600" />
                  <span className="text-gray-700 font-medium text-sm">{userProfile.name}</span>
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-700">{userProfile.name}</p>
                      <p className="text-xs text-gray-500">{userProfile.email}</p>
                      <p className="text-xs text-gray-500 capitalize">{userProfile.user_type === 'sme' ? 'Business Owner' : 'Influencer'}</p>
                    </div>
                    <Link to="/dashboard" className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100">
                      Dashboard
                    </Link>
                    <button onClick={handleLogout} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2">
                      <FontAwesomeIcon icon={faSignOut} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary text-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-gray-700 hover:text-gray-900" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} size="lg" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className="block py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors" onClick={() => setIsMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
              {isAuthenticated && userProfile ? (
                <>
                  <div className="px-2 py-3 bg-gray-50 rounded-lg mb-2">
                    <p className="text-sm font-medium text-gray-700">{userProfile.name}</p>
                    <p className="text-xs text-gray-500">{userProfile.email}</p>
                  </div>
                  <button onClick={handleLogout} className="block w-full btn btn-outline text-center text-sm">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block btn btn-outline w-full text-center text-sm">
                    Login
                  </Link>
                  <Link to="/register" className="block btn btn-primary w-full text-center text-sm">
                    Get Started
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
