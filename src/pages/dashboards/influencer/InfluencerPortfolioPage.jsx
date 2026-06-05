import InfluencerPortfolioManager from '../../../components/dashboard/influencer/InfluencerPortfolioManager';

const InfluencerPortfolioPage = ({ influencerId }) => (
  <div className="space-y-8">
    <header>
      <p className="text-sm font-semibold text-gray-500 uppercase">Portofolio</p>
      <h1 className="text-3xl font-bold text-gray-900 mt-1">Portofolio / Berkas Media</h1>
      <p className="text-gray-600 mt-2">
        Kelola karya terbaik yang akan dilihat UMKM saat membuka profil publik Anda.
      </p>
    </header>

    <InfluencerPortfolioManager influencerId={influencerId} />
  </div>
);

export default InfluencerPortfolioPage;
