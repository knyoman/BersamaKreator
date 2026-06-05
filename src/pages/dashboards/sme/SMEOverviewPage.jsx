import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBullhorn,
  faChartLine,
  faCheckCircle,
  faMagicWandSparkles,
  faSearch,
  faSpinner,
  faWallet,
} from '@fortawesome/free-solid-svg-icons';
import {
  SME_ORDER_STATUS_CLASSES,
  SME_ORDER_STATUS_LABELS,
  SME_PAYMENT_STATUS_CLASSES,
  SME_PAYMENT_STATUS_LABELS,
  formatSMECurrency,
  formatSMEDate,
  getSMEPackageTitle,
} from '../../../features/sme/campaigns';

const StatCard = ({ label, value, caption, icon, tone = 'gray', loading = false }) => {
  const toneClasses = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <article className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : value}</p>
          {caption && <p className="text-sm text-gray-500 mt-1">{caption}</p>}
        </div>
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${toneClasses[tone]}`}>
          <FontAwesomeIcon icon={icon} />
        </div>
      </div>
    </article>
  );
};

const QuickAction = ({ to, icon, title, description, primary = false }) => (
  <Link
    to={to}
    className={`rounded-lg border p-5 transition-colors ${
      primary
        ? 'bg-gray-950 border-gray-950 text-white hover:bg-gray-800'
        : 'bg-white border-gray-200 text-gray-900 hover:border-gray-300 hover:bg-gray-50'
    }`}
  >
    <FontAwesomeIcon icon={icon} className={primary ? 'text-white' : 'text-gray-700'} />
    <h3 className="font-bold mt-3">{title}</h3>
    <p className={`text-sm mt-1 ${primary ? 'text-gray-300' : 'text-gray-500'}`}>{description}</p>
  </Link>
);

const CampaignRow = ({ order }) => (
  <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
    <td className="py-3 px-4">
      <div className="font-semibold text-gray-900">{order.campaign_name}</div>
      <div className="text-xs text-gray-500 mt-1">{getSMEPackageTitle(order)}</div>
    </td>
    <td className="py-3 px-4 text-sm text-gray-600">{order.influencer_username || '-'}</td>
    <td className="py-3 px-4 text-sm text-gray-600">{formatSMECurrency(order.total_price)}</td>
    <td className="py-3 px-4">
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${SME_ORDER_STATUS_CLASSES[order.order_status] || 'bg-gray-100 text-gray-700'}`}>
        {SME_ORDER_STATUS_LABELS[order.order_status] || order.order_status || '-'}
      </span>
    </td>
    <td className="py-3 px-4">
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${SME_PAYMENT_STATUS_CLASSES[order.payment_status] || 'bg-gray-100 text-gray-700'}`}>
        {SME_PAYMENT_STATUS_LABELS[order.payment_status] || order.payment_status || '-'}
      </span>
    </td>
  </tr>
);

const SMEOverviewPage = ({ userProfile, orders = [], loading = false, error = null, stats = {} }) => {
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-500 uppercase">Ruang Kerja UMKM</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-1">Ringkasan</h1>
          <p className="text-gray-600 mt-2">Selamat datang kembali, {userProfile?.name || 'Bisnis Anda'}.</p>
        </div>
        <Link to="/dashboard/influencers" className="btn btn-primary inline-flex items-center justify-center">
          <FontAwesomeIcon icon={faSearch} className="mr-2" />
          Cari Influencer
        </Link>
      </header>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error.message || 'Gagal memuat data promosi UMKM.'}
        </div>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Promosi"
          value={stats.totalCampaigns || 0}
          caption={`${stats.pendingCampaigns || 0} menunggu`}
          icon={faBullhorn}
          loading={loading}
        />
        <StatCard
          label="Promosi Aktif"
          value={stats.activeCampaigns || 0}
          caption="Sedang berjalan"
          icon={faChartLine}
          tone="blue"
          loading={loading}
        />
        <StatCard
          label="Promosi Selesai"
          value={stats.completedCampaigns || 0}
          caption="Siap dievaluasi"
          icon={faCheckCircle}
          tone="green"
          loading={loading}
        />
        <StatCard
          label="Anggaran Terkunci"
          value={formatSMECurrency(stats.committedBudget || 0)}
          caption={`${stats.unpaidCampaigns || 0} belum dibayar`}
          icon={faWallet}
          tone="yellow"
          loading={loading}
        />
      </div>

      <section className="grid lg:grid-cols-3 gap-4">
        <QuickAction
          to="/dashboard/influencers"
          icon={faSearch}
          title="Cari Influencer"
          description="Masuk ke katalog dan pilih kreator yang sesuai."
          primary
        />
        <QuickAction
          to="/ai-recommendations"
          icon={faMagicWandSparkles}
          title="Rekomendasi AI"
          description="Temukan kandidat berdasarkan anggaran dan target audiens."
        />
        <QuickAction
          to="/dashboard/ai-assistant"
          icon={faBullhorn}
          title="Buat Ringkasan"
          description="Susun ringkasan promosi sebelum melakukan pemesanan."
        />
      </section>

      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Promosi Terbaru</h2>
            <p className="text-sm text-gray-500 mt-1">Ringkasan aktivitas promosi UMKM Anda.</p>
          </div>
          <Link to="/dashboard/campaigns" className="text-sm font-semibold text-gray-900 hover:underline">
            Lihat Semua
          </Link>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-500">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
            Memuat promosi...
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
            <p className="font-semibold text-gray-900">Belum ada promosi</p>
            <p className="text-sm text-gray-500 mt-1">Mulai dengan mencari influencer dan memilih paket yang sesuai.</p>
            <Link to="/dashboard/influencers" className="btn btn-primary inline-flex mt-4">
              Cari Influencer
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Promosi</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Influencer</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Nilai</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Pembayaran</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => <CampaignRow key={order.id} order={order} />)}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!loading && recentOrders.length > 0 && (
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Deadline Terdekat</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {orders.slice(0, 3).map((order) => (
              <article key={order.id} className="rounded-lg border border-gray-200 p-4">
                <p className="text-sm font-bold text-gray-900 line-clamp-1">{order.campaign_name}</p>
                <p className="text-xs text-gray-500 mt-1">@{order.influencer_username || '-'}</p>
                <p className="text-sm font-semibold text-gray-700 mt-3">{formatSMEDate(order.deadline)}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default SMEOverviewPage;
