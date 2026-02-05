import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faBars, faTimes } from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/influencers', label: 'Influencers' },
    { to: '/about', label: 'About' },
    { to: '/ai-recommendations', label: 'AI Match' },
  ]

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <nav className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Simple */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              BersamaKreator
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons - Clean */}
          <div className="hidden md:flex items-center space-x-3">
            <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm">
              Login
            </Link>
            <Link to="/register" className="btn btn-primary text-sm">
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700 hover:text-gray-900"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} size="lg" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 space-y-2">
              <Link to="/login" className="block btn btn-outline w-full text-center text-sm">
                Login
              </Link>
              <Link to="/register" className="block btn btn-primary w-full text-center text-sm">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Header
