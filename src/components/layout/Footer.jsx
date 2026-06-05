import { Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInstagram, faTwitter, faLinkedin, faFacebook } from '@fortawesome/free-brands-svg-icons'
import { faEnvelope, faPhone, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../context/AuthContext'

const Footer = () => {
  const currentYear = new Date().getFullYear()
  const location = useLocation()
  const { userProfile } = useAuth()

  const isRoleWorkspace = ['influencer', 'sme', 'admin'].includes(userProfile?.user_type)

  if (isRoleWorkspace && location.pathname.startsWith('/dashboard')) {
    return null
  }

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">BersamaKreator</h3>
            <p className="text-sm mb-4">
              Platform yang menghubungkan UMKM dengan nano influencer lokal untuk kampanye pemasaran yang efektif.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/knyoman.26" className="hover:text-primary-400 transition-colors">
                <FontAwesomeIcon icon={faInstagram} size="lg" />
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                <FontAwesomeIcon icon={faTwitter} size="lg" />
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                <FontAwesomeIcon icon={faLinkedin} size="lg" />
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                <FontAwesomeIcon icon={faFacebook} size="lg" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Tautan Cepat</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-primary-400 transition-colors">Beranda</Link></li>
              <li><Link to="/influencers" className="hover:text-primary-400 transition-colors">Cari Influencer</Link></li>
              <li><Link to="/about" className="hover:text-primary-400 transition-colors">Tentang Kami</Link></li>
              <li><Link to="/ai-recommendations" className="hover:text-primary-400 transition-colors">Rekomendasi AI</Link></li>
            </ul>
          </div>

          {/* For Businesses */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Untuk Bisnis</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/register" className="hover:text-primary-400 transition-colors">Daftar sebagai UMKM</Link></li>
              <li><Link to="/how-it-works" className="hover:text-primary-400 transition-colors">Cara Kerja</Link></li>
              <li><Link to="/pricing" className="hover:text-primary-400 transition-colors">Harga</Link></li>
              <li><Link to="/terms" className="hover:text-primary-400 transition-colors">Syarat & Ketentuan</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Hubungi Kami</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-3">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mt-1" />
                <span>Palembang, Indonesia</span>
              </li>
              <li className="flex items-center space-x-3">
                <FontAwesomeIcon icon={faEnvelope} />
                <a href="mailto:support@bersamakreator.id" className="hover:text-primary-400 transition-colors">
                  support@bersamakreator.id
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <FontAwesomeIcon icon={faPhone} />
                <a href="tel:+6281134567890" className="hover:text-primary-400 transition-colors">
                  +62 811-3456-7890
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>&copy; {currentYear} BersamaKreator. Seluruh hak cipta dilindungi.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
