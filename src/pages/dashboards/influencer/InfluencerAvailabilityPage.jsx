import InfluencerAvailabilityCalendar from '../../../components/dashboard/influencer/InfluencerAvailabilityCalendar';

const InfluencerAvailabilityPage = ({ influencerId }) => (
  <div className="space-y-8">
    <header>
      <p className="text-sm font-semibold text-gray-500 uppercase">Ketersediaan</p>
      <h1 className="text-3xl font-bold text-gray-900 mt-1">Kalender Ketersediaan</h1>
      <p className="text-gray-600 mt-2">
        Kelola tanggal sibuk dan tersedia agar UMKM dapat menyesuaikan jadwal campaign sebelum membuat pesanan.
      </p>
    </header>

    <InfluencerAvailabilityCalendar influencerId={influencerId} />
  </div>
);

export default InfluencerAvailabilityPage;
