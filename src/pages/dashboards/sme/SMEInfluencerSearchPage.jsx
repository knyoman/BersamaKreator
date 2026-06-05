import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowUpRightFromSquare,
  faBookmark,
  faCalendarAlt,
  faMagicWandSparkles,
  faSearch,
  faStar,
  faTags,
} from '@fortawesome/free-solid-svg-icons';

const SearchOption = ({ to, icon, title, description, primary = false }) => (
  <Link
    to={to}
    className={`rounded-lg border p-6 transition-colors ${
      primary
        ? 'bg-gray-950 border-gray-950 text-white hover:bg-gray-800'
        : 'bg-white border-gray-200 text-gray-900 hover:border-gray-300 hover:bg-gray-50'
    }`}
  >
    <FontAwesomeIcon icon={icon} className={primary ? 'text-white' : 'text-gray-700'} />
    <h2 className="text-xl font-bold mt-4">{title}</h2>
    <p className={`text-sm mt-2 leading-relaxed ${primary ? 'text-gray-300' : 'text-gray-500'}`}>{description}</p>
    <div className="mt-5 text-sm font-semibold inline-flex items-center">
      Buka
      <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="ml-2" />
    </div>
  </Link>
);

const SMEInfluencerSearchPage = () => (
  <div className="space-y-6">
    <header>
      <p className="text-sm font-semibold text-gray-500 uppercase">Cari Influencer</p>
      <h1 className="text-3xl font-bold text-gray-900 mt-1">Temukan Kreator Untuk Promosi</h1>
      <p className="text-gray-600 mt-2">Pilih jalur pencarian yang paling sesuai dengan kebutuhan promosi UMKM.</p>
    </header>

    <section className="grid lg:grid-cols-3 gap-4">
      <SearchOption
        to="/influencers"
        icon={faSearch}
        title="Katalog Influencer"
        description="Telusuri semua influencer, filter niche, harga, followers, dan status verifikasi."
        primary
      />
      <SearchOption
        to="/ai-recommendations"
        icon={faMagicWandSparkles}
        title="Rekomendasi AI"
        description="Gunakan anggaran, target audiens, dan tujuan promosi untuk mendapatkan kandidat yang cocok."
      />
      <SearchOption
        to="/dashboard/shortlist"
        icon={faBookmark}
        title="Daftar Favorit"
        description="Kelola kandidat yang ingin dibandingkan sebelum membuat pesanan."
      />
    </section>

    <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900">Parameter Yang Perlu Dibandingkan</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        {[
          { icon: faTags, label: 'Paket Harga', text: 'Bandingkan deliverables, revisi, dan estimasi pengerjaan.' },
          { icon: faCalendarAlt, label: 'Ketersediaan', text: 'Pastikan tanggal promosi sesuai jadwal influencer.' },
          { icon: faStar, label: 'Ulasan', text: 'Gunakan penilaian dan komentar UMKM sebagai sinyal reputasi.' },
          { icon: faSearch, label: 'Kecocokan Niche', text: 'Utamakan audiens yang relevan dengan produk bisnis.' },
        ].map((item) => (
          <article key={item.label} className="rounded-lg border border-gray-200 p-4">
            <FontAwesomeIcon icon={item.icon} className="text-gray-700" />
            <p className="font-bold text-gray-900 mt-3">{item.label}</p>
            <p className="text-sm text-gray-500 mt-1">{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  </div>
);

export default SMEInfluencerSearchPage;
