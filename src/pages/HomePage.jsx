import { useState, useEffect } from 'react'
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
import { getPlatformStats } from '../services/api'

const HomePage = () => {
  const [stats, setStats] = useState({
    influencersCount: 0,
    smeCount: 0,
    successRate: 95
  })
  const [statsLoading, setStatsLoading] = useState(true)

  // Fetch platform stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      const { data, error } = await getPlatformStats()
      if (!error && data) {
        setStats(data)
      }
      setStatsLoading(false)
    }
    
    fetchStats()
  }, [])

  // Format numbers for display (e.g., 1234 => 1.2K)
  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.0', '') + 'K+'
    }
    return num + '+'
  }

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
            <span className="text-sm font-medium text-gray-700">Maksimalkan Promosi, Tingkatkan Penjualan</span>
          </div>

          {/* Main Headline - Clean */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-snug tracking-wide text-gray-900">
            Promosikan Brand Anda
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600">
              Dengan Influencer Yang Tepat
            </span>
          </h1>

          {/* Subheadline - Simple */}
          <p className="text-lg md:text-xl lg:text-2xl mb-12 text-gray-600 max-w-3xl mx-auto font-normal">
            Temukan nano dan micro influencer lokal untuk meningkatkan jangkauan dan penjualan bisnis Anda.
            <br className="hidden md:block" />
            <span className="font-medium text-gray-900">Mudah, cepat, efektif.</span>
          </p>

          {/* CTA Buttons - Clean */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link 
              to="/register" 
              className="btn btn-primary text-lg px-10 py-4"
            >
              Mulai Sekarang
              <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
            </Link>
            <Link 
              to="/influencers" 
              className="btn btn-outline text-lg px-10 py-4"
            >
              Jelajahi Influencer
            </Link>
          </div>

          {/* Stats - Dynamic from Database */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-20">
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-1">
                {statsLoading ? '...' : formatNumber(stats.influencersCount)}
              </div>
              <div className="text-sm text-gray-600">Influencer</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-1">
                {statsLoading ? '...' : formatNumber(stats.smeCount)}
              </div>
              <div className="text-sm text-gray-600">Mitra UMKM</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900 mb-1">
                {statsLoading ? '...' : `${stats.successRate}%`}
              </div>
              <div className="text-sm text-gray-600">Tingkat Sukses</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Clean */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Cara Kerja
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              3 langkah mudah untuk menemukan influencer yang tepat
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: faUsers,
                title: 'Buat Profil',
                description: 'Daftar dan lengkapi profil bisnis Anda dengan target audiens dan anggaran kampanye'
              },
              {
                icon: faBullhorn,
                title: 'Cari & Cocokkan',
                description: 'Gunakan AI untuk menemukan influencer yang sesuai dengan niche dan anggaran Anda'
              },
              {
                icon: faChartLine,
                title: 'Luncurkan Kampanye',
                description: 'Hubungi influencer, buat kesepakatan, dan luncurkan kampanye pemasaran Anda'
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
              Kenapa Memilih Kami
            </h2>
            <p className="text-lg text-gray-600">
              Platform terpercaya untuk menghubungkan UMKM dengan nano influencer
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: faCheckCircle, title: 'Pencocokan Berbasis AI', desc: 'Algoritma pintar untuk pencocokan yang akurat' },
              { icon: faStar, title: 'Influencer Terverifikasi', desc: 'Semua influencer sudah terverifikasi' },
              { icon: faChartLine, title: 'Analitik Real-Time', desc: 'Pantau performa kampanye secara real-time' },
              { icon: faUsers, title: 'Fokus Lokal', desc: 'Fokus pada nano influencer lokal Indonesia' },
              { icon: faBullhorn, title: 'Ramah Anggaran', desc: 'Harga terjangkau untuk UMKM' },
              { icon: faRocket, title: 'Hasil Cepat', desc: 'Luncurkan kampanye dalam hitungan hari' }
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
            Siap Mengembangkan Bisnis Anda?
          </h2>
          <p className="text-lg mb-8 text-gray-300 max-w-2xl mx-auto">
            Mulai sekarang dan temukan influencer yang tepat untuk bisnis Anda
          </p>
          <Link to="/register" className="btn bg-white text-gray-900 hover:bg-gray-100 text-lg px-10 py-4 inline-block">
            Mulai Gratis
            <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default HomePage
