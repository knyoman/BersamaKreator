import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faRocket, 
  faUsers, 
  faBullhorn, 
  faChartLine, 
  faStar, 
  faCheckCircle,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons'

const HomePage = () => {
  return (
    <div>
      {/* Hero Section - Full Screen & Minimalist */}
      <section className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, black 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="container-custom relative z-10 text-center py-20">
          {/* Badge - Simple */}
          <div className="inline-flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2 mb-8">
            <FontAwesomeIcon icon={faRocket} className="text-gray-900" />
            <span className="text-sm font-medium text-gray-700">#1 Influencer Matching Platform</span>
          </div>

          {/* Main Headline - VERY LARGE & Clean */}
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-6 leading-tight text-gray-900">
            Connect with
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600">
              Nano Influencers
            </span>
          </h1>

          {/* Subheadline - Simple */}
          <p className="text-lg md:text-xl lg:text-2xl mb-12 text-gray-600 max-w-3xl mx-auto font-normal">
            Platform marketplace yang menghubungkan UMKM dengan nano influencer lokal.
            <br className="hidden md:block" />
            <span className="font-medium text-gray-900">Simple, Fast, Effective.</span>
          </p>

          {/* CTA Buttons - Clean */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link 
              to="/register" 
              className="btn btn-primary text-lg px-10 py-4"
            >
              Get Started
              <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
            </Link>
            <Link 
              to="/influencers" 
              className="btn btn-outline text-lg px-10 py-4"
            >
              Browse Influencers
            </Link>
          </div>

          {/* Stats - Minimal */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-20">
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-1">500+</div>
              <div className="text-sm text-gray-600">Influencers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-1">1,000+</div>
              <div className="text-sm text-gray-600">SME Partners</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-1">95%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Clean */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              3 langkah mudah untuk menemukan influencer yang tepat
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: faUsers,
                title: 'Create Profile',
                description: 'Daftar dan lengkapi profile bisnis Anda dengan target audience dan budget campaign'
              },
              {
                icon: faBullhorn,
                title: 'Browse & Match',
                description: 'Gunakan AI untuk menemukan influencer yang sesuai dengan niche dan budget Anda'
              },
              {
                icon: faChartLine,
                title: 'Launch Campaign',
                description: 'Hubungi influencer, buat kesepakatan, dan luncurkan campaign marketing Anda'
              }
            ].map((step, index) => (
              <div key={index} className="card p-8 text-center">
                <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FontAwesomeIcon icon={step.icon} className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Minimalist */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Why Choose Us
            </h2>
            <p className="text-lg text-gray-600">
              Platform terpercaya untuk connecting SME dengan nano influencer
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: faCheckCircle, title: 'AI-Powered Matching', desc: 'Smart algorithm untuk matching yang akurat' },
              { icon: faStar, title: 'Verified Influencers', desc: 'Semua influencer sudah terverifikasi' },
              { icon: faChartLine, title: 'Real-Time Analytics', desc: 'Tracking performa campaign secara real-time' },
              { icon: faUsers, title: 'Local Focus', desc: 'Fokus pada nano influencer lokal Indonesia' },
              { icon: faBullhorn, title: 'Budget Friendly', desc: 'Harga terjangkau untuk UMKM' },
              { icon: faRocket, title: 'Fast Results', desc: 'Launch campaign dalam hitungan hari' }
            ].map((feature, index) => (
              <div key={index} className="p-6">
                <FontAwesomeIcon icon={feature.icon} className="text-gray-900 text-2xl mb-4" />
                <h3 className="text-lg font-bold mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Clean Black */}
      <section className="section-padding bg-gray-900 text-white">
        <div className="container-custom text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Grow Your Business?
          </h2>
          <p className="text-lg mb-8 text-gray-300 max-w-2xl mx-auto">
            Mulai sekarang dan temukan influencer yang tepat untuk bisnis Anda
          </p>
          <Link to="/register" className="btn bg-white text-gray-900 hover:bg-gray-100 text-lg px-10 py-4 inline-block">
            Get Started Free
            <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default HomePage
