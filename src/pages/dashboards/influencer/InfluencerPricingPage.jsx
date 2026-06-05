import InfluencerPricingPackageManager from '../../../components/dashboard/influencer/InfluencerPricingPackageManager';

const InfluencerPricingPage = ({ influencerId }) => (
  <div className="space-y-8">
    <header>
      <p className="text-sm font-semibold text-gray-500 uppercase">Paket Harga</p>
      <h1 className="text-3xl font-bold text-gray-900 mt-1">Paket Layanan Campaign</h1>
      <p className="text-gray-600 mt-2">
        Kelola paket Story, Feed Post, Reels, TikTok, dan bundling agar UMKM bisa memilih layanan yang paling sesuai.
      </p>
    </header>

    <InfluencerPricingPackageManager influencerId={influencerId} />
  </div>
);

export default InfluencerPricingPage;
