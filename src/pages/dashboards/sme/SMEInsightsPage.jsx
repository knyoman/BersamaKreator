import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullhorn, faChartLine, faCheckCircle, faStar, faWallet } from '@fortawesome/free-solid-svg-icons';
import {
  formatSMECurrency,
  getMostUsedInfluencer,
} from '../../../features/sme/campaigns';

const InsightCard = ({ label, value, caption, icon }) => (
  <article className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-gray-500">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        {caption && <p className="text-sm text-gray-500 mt-1">{caption}</p>}
      </div>
      <div className="w-11 h-11 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
        <FontAwesomeIcon icon={icon} />
      </div>
    </div>
  </article>
);

const SMEInsightsPage = ({ orders = [], loading = false, stats = {} }) => {
  const topInfluencer = getMostUsedInfluencer(orders);
  const completionRate = stats.totalCampaigns > 0
    ? (stats.completedCampaigns / stats.totalCampaigns) * 100
    : 0;

  const statusRows = [
    { label: 'Menunggu', value: stats.pendingCampaigns || 0, className: 'bg-yellow-500' },
    { label: 'Berjalan', value: stats.activeCampaigns || 0, className: 'bg-blue-500' },
    { label: 'Selesai', value: stats.completedCampaigns || 0, className: 'bg-green-500' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-gray-500 uppercase">Analisis</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-1">Analisis Promosi UMKM</h1>
        <p className="text-gray-600 mt-2">Lihat ringkasan promosi, anggaran, dan performa kerja sama influencer.</p>
      </header>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <InsightCard
          label="Total Promosi"
          value={loading ? '...' : stats.totalCampaigns || 0}
          caption="Semua promosi UMKM"
          icon={faBullhorn}
        />
        <InsightCard
          label="Tingkat Penyelesaian"
          value={loading ? '...' : `${completionRate.toFixed(1)}%`}
          caption={`${stats.completedCampaigns || 0} selesai`}
          icon={faCheckCircle}
        />
        <InsightCard
          label="Total Pengeluaran"
          value={loading ? '...' : formatSMECurrency(stats.totalSpend || 0)}
          caption="Promosi yang sudah dibayar"
          icon={faWallet}
        />
        <InsightCard
          label="Rata-rata Promosi"
          value={loading ? '...' : formatSMECurrency(stats.averageCampaignCost || 0)}
          caption="Berdasarkan nilai pesanan"
          icon={faChartLine}
        />
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900">Distribusi Status</h2>
          <div className="space-y-4 mt-5">
            {statusRows.map((row) => {
              const percentage = stats.totalCampaigns > 0 ? (row.value / stats.totalCampaigns) * 100 : 0;

              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-semibold text-gray-700">{row.label}</span>
                    <span className="text-gray-500">{row.value} promosi</span>
                  </div>
                  <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full ${row.className}`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="w-11 h-11 rounded-lg bg-yellow-100 text-yellow-700 flex items-center justify-center mb-4">
            <FontAwesomeIcon icon={faStar} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Influencer Teratas</h2>
          {topInfluencer ? (
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Nama</p>
                <p className="font-bold text-gray-900 mt-1">{topInfluencer.name}</p>
                {topInfluencer.username && <p className="text-sm text-gray-500">@{topInfluencer.username}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                  <p className="text-xs text-gray-500">Promosi</p>
                  <p className="font-bold text-gray-900 mt-1">{topInfluencer.campaigns}</p>
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                  <p className="text-xs text-gray-500">Nilai</p>
                  <p className="font-bold text-gray-900 mt-1">{formatSMECurrency(topInfluencer.spend)}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-3">Belum ada data influencer dari promosi UMKM.</p>
          )}
        </aside>
      </div>
    </div>
  );
};

export default SMEInsightsPage;
