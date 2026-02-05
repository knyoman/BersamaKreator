import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInstagram, faTwitter, faLinkedin, faFacebook } from '@fortawesome/free-brands-svg-icons'
import { faEnvelope, faPhone, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">BersamaKreator</h3>
            <p className="text-sm mb-4">
              Platform yang menghubungkan UMKM/SME dengan nano influencer lokal untuk kampanye marketing yang efektif.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-primary-400 transition-colors">
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
            <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-primary-400 transition-colors">Home</Link></li>
              <li><Link to="/influencers" className="hover:text-primary-400 transition-colors">Find Influencers</Link></li>
              <li><Link to="/about" className="hover:text-primary-400 transition-colors">About Us</Link></li>
              <li><Link to="/ai-recommendations" className="hover:text-primary-400 transition-colors">AI Recommendations</Link></li>
            </ul>
          </div>

          {/* For Businesses */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">For Businesses</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/register" className="hover:text-primary-400 transition-colors">Sign Up as SME</Link></li>
              <li><Link to="/how-it-works" className="hover:text-primary-400 transition-colors">How It Works</Link></li>
              <li><Link to="/pricing" className="hover:text-primary-400 transition-colors">Pricing</Link></li>
              <li><Link to="/terms" className="hover:text-primary-400 transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-3">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mt-1" />
                <span>Jakarta, Indonesia</span>
              </li>
              <li className="flex items-center space-x-3">
                <FontAwesomeIcon icon={faEnvelope} />
                <a href="mailto:support@bersamakreator.id" className="hover:text-primary-400 transition-colors">
                  support@bersamakreator.id
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <FontAwesomeIcon icon={faPhone} />
                <a href="tel:+6281234567890" className="hover:text-primary-400 transition-colors">
                  +62 812-3456-7890
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>&copy; {currentYear} BersamaKreator. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
