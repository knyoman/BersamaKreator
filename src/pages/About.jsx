import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRocket, faUsers, faChartLine, faHandshake } from '@fortawesome/free-solid-svg-icons'

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-custom py-16 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            About BersamaKreator
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Indonesia's #1 platform for connecting SMEs with nano influencers
          </p>
        </div>
      </div>

      {/* Mission */}
      <div className="container-custom section-padding">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">Our Mission</h2>
          <p className="text-lg text-gray-700 leading-relaxed text-center mb-12">
            Kami percaya bahwa setiap UMKM layak memiliki akses ke influencer marketing yang efektif dan terjangkau. 
            BersamaKreator hadir untuk menjembatani kesenjangan antara bisnis kecil dengan nano influencer lokal 
            yang memiliki engagement tinggi dan audience yang relevan.
          </p>

          <div className="grid md:grid-cols-4 gap-8 mt-12">
            {[
              { icon: faUsers, number: '500+', label: 'Influencers' },
              { icon: faHandshake, number: '1,000+', label: 'SME Partners' },
              { icon: faChartLine, number: '95%', label: 'Success Rate' },
              { icon: faRocket, number: '5,000+', label: 'Campaigns' }
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
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Why Choose BersamaKreator</h2>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {[
              {
                title: 'Budget-Friendly',
                description: 'Harga yang terjangkau untuk UMKM dengan budget terbatas. Mulai dari Rp 500.000 per campaign.'
              },
              {
                title: 'Local Focus',
                description: 'Fokus pada nano influencer lokal Indonesia yang memahami pasar dan culture lokal.'
              },
              {
                title: 'High Engagement',
                description: 'Nano influencer memiliki engagement rate lebih tinggi dibanding macro influencer.'
              },
              {
                title: 'Easy to Use',
                description: 'Platform yang user-friendly dengan proses booking yang sederhana dan cepat.'
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
        <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">Our Story</h2>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            BersamaKreator didirikan pada tahun 2024 dengan visi untuk memberdayakan UMKM Indonesia 
            melalui influencer marketing yang efektif dan terjangkau.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            Kami memahami bahwa tidak semua bisnis memiliki budget besar untuk marketing, 
            namun setiap bisnis berhak untuk berkembang. Melalui BersamaKreator, kami menghubungkan 
            UMKM dengan nano influencer yang tepat untuk mencapai target audience mereka.
          </p>
        </div>
      </div>
    </div>
  )
}

export default About
