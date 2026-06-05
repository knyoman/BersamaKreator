import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faChartLine,
  faCheckCircle,
  faPercent,
  faSave,
  faSpinner,
  faStar,
  faUsers,
  faWallet,
} from '@fortawesome/free-solid-svg-icons';
import {
  calculatePerformanceInsights,
  createPerformanceSnapshotPayload,
  formatInsightCurrency,
  formatInsightNumber,
  formatInsightPercent,
  formatSnapshotPeriod,
  sortPerformanceSnapshots,
} from '../../../features/influencer/performanceInsights';
import { useInfluencerPerformanceSnapshots } from '../../../features/influencer/useInfluencerPerformanceSnapshots';
import { upsertInfluencerPerformanceSnapshot } from '../../../services/api';

const getSnapshotErrorMessage = (error) => {
  if (!error?.message) return 'Gagal memuat insight performa.';

  if (error.message.includes('influencer_performance_snapshots')) {
    return 'Tabel snapshot performa belum tersedia. Jalankan schema Supabase terbaru sebelum menggunakan fitur ini.';
  }

  return error.message;
};

const MetricCard = ({ label, value, caption, icon, iconClassName, loading }) => (
  <article className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-2">{loading ? '...' : value}</p>
        {caption && <p className="text-xs text-gray-500 mt-2">{caption}</p>}
      </div>
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${iconClassName}`}>
        <FontAwesomeIcon icon={icon} />
      </div>
    </div>
  </article>
);

const FollowersGrowthPanel = ({ growth }) => {
  const hasGrowth = growth.hasBaseline && growth.growth !== null;
  const isPositive = Number(growth.growth || 0) >= 0;
  const growthValue = hasGrowth
    ? `${isPositive ? '+' : ''}${formatInsightNumber(growth.growth)}`
    : '-';
  const growthRate = hasGrowth && growth.growthRate !== null
    ? `${isPositive ? '+' : ''}${formatInsightPercent(growth.growthRate)}`
    : 'Belum ada baseline';

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-lg bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
          <FontAwesomeIcon icon={faUsers} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-500 uppercase">Pertumbuhan Followers</p>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">{growthValue}</h2>
          <p className="text-sm text-gray-600 mt-2">
            Followers saat ini: <span className="font-semibold text-gray-900">{formatInsightNumber(growth.currentFollowers)}</span>
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">Baseline</p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            {growth.hasBaseline ? formatInsightNumber(growth.baselineFollowers) : '-'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {growth.hasBaseline ? formatSnapshotPeriod(growth.baselinePeriod) : 'Simpan snapshot untuk mulai melacak'}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">Laju Pertumbuhan</p>
          <p className={`text-lg font-bold mt-1 ${hasGrowth && isPositive ? 'text-green-700' : 'text-gray-900'}`}>
            {growthRate}
          </p>
          <p className="text-xs text-gray-500 mt-1">Dibanding baseline terakhir</p>
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            {hasGrowth ? (isPositive ? 'Naik' : 'Turun') : 'Menunggu Data'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Gunakan snapshot bulanan untuk akurasi</p>
        </div>
      </div>
    </section>
  );
};

const SnapshotHistory = ({ snapshots, loading, error }) => {
  const sortedSnapshots = sortPerformanceSnapshots(snapshots);

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-gray-900 text-white flex items-center justify-center">
          <FontAwesomeIcon icon={faCalendarAlt} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Riwayat Snapshot</h2>
          <p className="text-sm text-gray-500">Baseline bulanan untuk menghitung pertumbuhan followers.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-gray-900" />
          <p className="text-sm text-gray-500 mt-3">Memuat snapshot...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 text-yellow-900">
          <p className="font-semibold">Snapshot belum bisa dimuat</p>
          <p className="text-sm mt-1">{getSnapshotErrorMessage(error)}</p>
        </div>
      ) : sortedSnapshots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
          <p className="font-semibold text-gray-900">Belum ada snapshot performa</p>
          <p className="text-sm text-gray-500 mt-1">Simpan snapshot bulan ini untuk mulai melacak pertumbuhan followers.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Periode</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Followers</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Engagement</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Total Pesanan</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Penilaian</th>
              </tr>
            </thead>
            <tbody>
              {sortedSnapshots.map((snapshot) => (
                <tr key={snapshot.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-semibold text-gray-900">{formatSnapshotPeriod(snapshot.period_start)}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{formatInsightNumber(snapshot.followers_count)}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{formatInsightPercent(snapshot.engagement_rate)}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{formatInsightNumber(snapshot.total_orders)}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{Number(snapshot.rating_average || 0).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

const InfluencerPerformancePage = ({
  influencerId,
  userProfile,
  orders = [],
  ordersLoading = false,
  reviewStats = {},
  reviewsLoading = false,
}) => {
  const snapshotsState = useInfluencerPerformanceSnapshots(influencerId);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [snapshotActionError, setSnapshotActionError] = useState(null);
  const [snapshotActionMessage, setSnapshotActionMessage] = useState(null);

  const insights = useMemo(() => calculatePerformanceInsights({
    profile: userProfile,
    orders,
    reviewStats,
    snapshots: snapshotsState.snapshots,
  }), [orders, reviewStats, snapshotsState.snapshots, userProfile]);
  const metricsLoading = ordersLoading || reviewsLoading;

  const handleSaveSnapshot = async () => {
    setSavingSnapshot(true);
    setSnapshotActionError(null);
    setSnapshotActionMessage(null);

    try {
      const payload = createPerformanceSnapshotPayload(userProfile, influencerId);
      const { error } = await upsertInfluencerPerformanceSnapshot(payload);
      if (error) throw error;

      await snapshotsState.refresh();
      setSnapshotActionMessage('Snapshot performa bulan ini berhasil disimpan.');
    } catch (err) {
      setSnapshotActionError(err.message || 'Gagal menyimpan snapshot performa.');
    } finally {
      setSavingSnapshot(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-500 uppercase">Analisis Performa</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-1">Statistik Sederhana Influencer</h1>
          <p className="text-gray-600 mt-2">
            Pantau promosi, penilaian, penghasilan, engagement rate, dan pertumbuhan followers dari satu halaman.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveSnapshot}
          disabled={!influencerId || savingSnapshot}
          className="btn btn-primary inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {savingSnapshot ? (
            <>
              <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
              Menyimpan...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faSave} className="mr-2" />
              Simpan Snapshot Bulan Ini
            </>
          )}
        </button>
      </header>

      {snapshotActionError && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {snapshotActionError}
        </div>
      )}

      {snapshotActionMessage && (
        <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
          {snapshotActionMessage}
        </div>
      )}

      <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        <MetricCard
          label="Total Promosi"
          value={formatInsightNumber(insights.totalCampaigns)}
          caption="Semua promosi yang masuk"
          icon={faChartLine}
          iconClassName="bg-blue-100 text-blue-700"
          loading={ordersLoading}
        />
        <MetricCard
          label="Promosi Selesai"
          value={formatInsightNumber(insights.completedCampaigns)}
          caption="Promosi dengan status selesai"
          icon={faCheckCircle}
          iconClassName="bg-green-100 text-green-700"
          loading={ordersLoading}
        />
        <MetricCard
          label="Penilaian Rata-rata"
          value={insights.averageRating > 0 ? insights.averageRating.toFixed(1) : '-'}
          caption={`${reviewStats.totalReviews || 0} ulasan UMKM`}
          icon={faStar}
          iconClassName="bg-yellow-100 text-yellow-700"
          loading={reviewsLoading}
        />
        <MetricCard
          label="Total Penghasilan"
          value={formatInsightCurrency(insights.totalEarnings)}
          caption="Dari promosi selesai"
          icon={faWallet}
          iconClassName="bg-gray-900 text-white"
          loading={ordersLoading}
        />
        <MetricCard
          label="Engagement Rate"
          value={formatInsightPercent(insights.engagementRate)}
          caption="Diambil dari profil influencer"
          icon={faPercent}
          iconClassName="bg-purple-100 text-purple-700"
          loading={metricsLoading}
        />
        <MetricCard
          label="Pertumbuhan Followers"
          value={insights.followersGrowth.hasBaseline
            ? `${insights.followersGrowth.growth >= 0 ? '+' : ''}${formatInsightNumber(insights.followersGrowth.growth)}`
            : '-'}
          caption={insights.followersGrowth.hasBaseline
            ? `vs ${formatSnapshotPeriod(insights.followersGrowth.baselinePeriod)}`
            : 'Belum ada baseline snapshot'}
          icon={faUsers}
          iconClassName="bg-indigo-100 text-indigo-700"
          loading={snapshotsState.loading}
        />
      </section>

      <FollowersGrowthPanel growth={insights.followersGrowth} />

      <SnapshotHistory
        snapshots={snapshotsState.snapshots}
        loading={snapshotsState.loading}
        error={snapshotsState.error}
      />
    </div>
  );
};

export default InfluencerPerformancePage;
