import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRocket, faUsers, faChartLine, faHandshake } from '@fortawesome/free-solid-svg-icons'
import { getPlatformStats } from '../services/api'

const About = () => {
  const [stats, setStats] = useState({
    influencersCount: 0,
    smeCount: 0,
    successRate: 95,
    totalCampaigns: 5000 // We don't have this in API yet, keeping hardcoded or could simulate
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const { data, error } = await getPlatformStats()
      if (!error && data) {
        setStats(prev => ({
          ...prev,
          influencersCount: data.influencersCount,
          smeCount: data.smeCount,
          successRate: data.successRate,
          // Calculate a rough estimate for campaigns based on orders if available, or keep static
          totalCampaigns: Math.floor((data.smeCount * 5)) + 1000 // Just a simulation or keep static
        }))
      }
      setLoading(false)
    }
    fetchStats()
  }, [])

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.0', '') + 'K+'
    }
    return num + '+'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-custom py-16 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Tentang BersamaKreator
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Platform #1 di Indonesia untuk menghubungkan UMKM dengan nano influencer
          </p>
        </div>
      </div>

      {/* Mission */}
      <div className="container-custom section-padding">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">Misi Kami</h2>
          <p className="text-lg text-gray-700 leading-relaxed text-center mb-12">
            Kami percaya bahwa setiap UMKM layak memiliki akses ke pemasaran influencer yang efektif dan terjangkau.
            BersamaKreator hadir untuk menjembatani kesenjangan antara bisnis kecil dengan nano influencer lokal 
            yang memiliki interaksi tinggi dan audiens yang relevan.
          </p>

          <div className="grid md:grid-cols-4 gap-8 mt-12">
            {[
              { 
                icon: faUsers, 
                number: loading ? '...' : formatNumber(stats.influencersCount), 
                label: 'Influencer'
              },
              { 
                icon: faHandshake, 
                number: loading ? '...' : formatNumber(stats.smeCount), 
                label: 'Mitra UMKM'
              },
              { 
                icon: faChartLine, 
                number: loading ? '...' : `${stats.successRate}%`, 
                label: 'Tingkat Sukses'
              },
              { 
                icon: faRocket, 
                number: '5K+', // Keep static or use simulated
                label: 'Kampanye'
              }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={stat.icon} className="text-white text-2xl" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why Us */}
      <div className="bg-white">
        <div className="container-custom section-padding">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Kenapa Memilih BersamaKreator</h2>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {[
              {
                title: 'Ramah Anggaran',
                description: 'Harga yang terjangkau untuk UMKM dengan anggaran terbatas. Mulai dari Rp 500.000 per kampanye.'
              },
              {
                title: 'Fokus Lokal',
                description: 'Fokus pada nano influencer lokal Indonesia yang memahami pasar dan culture lokal.'
              },
              {
                title: 'Engagement Tinggi',
                description: 'Nano influencer memiliki tingkat interaksi lebih tinggi dibanding influencer makro.'
              },
              {
                title: 'Mudah Digunakan',
                description: 'Platform yang mudah digunakan dengan proses pemesanan yang sederhana dan cepat.'
              }
            ].map((item, index) => (
              <div key={index}>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-700">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="container-custom section-padding">
        <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">Cerita Kami</h2>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            BersamaKreator didirikan pada tahun 2026 dengan visi untuk memberdayakan UMKM Indonesia 
            melalui pemasaran influencer yang efektif dan terjangkau.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            Kami memahami bahwa tidak semua bisnis memiliki anggaran besar untuk pemasaran,
            namun setiap bisnis berhak untuk berkembang. Melalui BersamaKreator, kami menghubungkan 
            UMKM dengan nano influencer yang tepat untuk mencapai target audiens mereka.
          </p>
        </div>
      </div>
    </div>
  )
}

export default About
