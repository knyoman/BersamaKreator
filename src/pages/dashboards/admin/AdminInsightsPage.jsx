import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBullhorn,
  faChartLine,
  faCircleCheck,
  faRotateRight,
  faSackDollar,
  faStar,
  faStore,
  faUserTie,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import {
  SME_ORDER_STATUS_LABELS,
  SME_PAYMENT_STATUS_LABELS,
} from '../../../features/sme/campaigns';
import { getAdminPlatformInsights } from '../../../services/api';

const emptyInsights = {
  stats: {
    totalUsers: 0,
    totalSMEs: 0,
    totalInfluencers: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    completedCampaigns: 0,
    paidRevenue: 0,
    unpaidRevenue: 0,
    averageRating: 0,
  },
  usersByMonth: [],
  campaignsByMonth: [],
  revenueByMonth: [],
  ratingDistribution: [],
  campaignStatusDistribution: [],
  paymentStatusDistribution: [],
  topNiches: [],
  topSMEs: [],
  topInfluencers: [],
};

const formatNumber = (value) => new Intl.NumberFormat('id-ID').format(Number(value || 0));

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const StatCard = ({ label, value, caption, icon, tone, loading }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
        <p className="mt-2 text-2xl font-bold text-gray-950">{loading ? '...' : value}</p>
        <p className="mt-1 text-xs text-gray-500">{caption}</p>
      </div>
      <div className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <FontAwesomeIcon icon={icon} />
      </div>
    </div>
  </div>
);

const maxValueFromSeries = (rows = [], keys = ['value']) => rows.reduce((max, row) => {
  const rowMax = keys.reduce((currentMax, key) => Math.max(currentMax, Number(row[key] || 0)), 0);
  return Math.max(max, rowMax);
}, 0);

const SeriesChart = ({ title, caption, rows, valueFormatter = formatNumber, secondaryLabel = '', secondaryFormatter = formatNumber }) => {
  const maxValue = maxValueFromSeries(rows, ['value', 'secondaryValue']);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-950">{title}</h2>
          <p className="mt-1 text-xs text-gray-500">{caption}</p>
        </div>
        <FontAwesomeIcon icon={faChartLine} className="text-gray-400" />
      </div>

      <div className="mt-5 grid grid-cols-6 items-end gap-3">
        {rows.map((row) => {
          const primaryHeight = maxValue > 0 ? Math.max(10, (Number(row.value || 0) / maxValue) * 140) : 10;
          const secondaryHeight = maxValue > 0 ? Math.max(8, (Number(row.secondaryValue || 0) / maxValue) * 140) : 8;

          return (
            <div key={row.key || row.label} className="min-w-0">
              <div className="flex h-40 items-end justify-center gap-1 rounded-lg bg-gray-50 px-2 py-2">
                <div
                  className="w-5 rounded-t bg-gray-900"
                  style={{ height: `${primaryHeight}px` }}
                  title={valueFormatter(row.value)}
                />
                {secondaryLabel && (
                  <div
                    className="w-5 rounded-t bg-emerald-500"
                    style={{ height: `${secondaryHeight}px` }}
                    title={secondaryFormatter(row.secondaryValue)}
                  />
                )}
              </div>
              <p className="mt-2 truncate text-center text-[11px] font-semibold text-gray-500">{row.label}</p>
              <p className="truncate text-center text-[11px] font-bold text-gray-950">{valueFormatter(row.value)}</p>
              {secondaryLabel && (
                <p className="truncate text-center text-[10px] text-emerald-700">{secondaryFormatter(row.secondaryValue)}</p>
              )}
            </div>
          );
        })}
      </div>

      {secondaryLabel && (
        <div className="mt-4 flex items-center gap-4 text-[11px] font-semibold text-gray-500">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gray-900" /> Total</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> {secondaryLabel}</span>
        </div>
      )}
    </section>
  );
};

const RankedList = ({ title, caption, icon, rows, valueLabel, secondaryFormatter = formatCurrency }) => (
  <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-2">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
        <FontAwesomeIcon icon={icon} />
      </div>
      <div>
        <h2 className="text-sm font-bold text-gray-950">{title}</h2>
        <p className="text-xs text-gray-500">{caption}</p>
      </div>
    </div>

    <div className="mt-4 space-y-3">
      {rows.length === 0 ? (
        <p className="rounded-lg bg-gray-50 px-3 py-3 text-xs text-gray-500">Belum ada data.</p>
      ) : (
        rows.map((row, index) => (
          <div key={row.id || row.label} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-gray-950">{index + 1}. {row.label}</p>
              <p className="text-[11px] text-gray-500">{formatNumber(row.value)} {valueLabel}</p>
            </div>
            <p className="shrink-0 text-xs font-bold text-gray-700">{secondaryFormatter(row.secondaryValue)}</p>
          </div>
        ))
      )}
    </div>
  </section>
);

const DistributionList = ({ title, rows, labelResolver }) => {
  const total = rows.reduce((sum, row) => sum + Number(row.count || 0), 0);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-gray-950">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.map((row) => {
          const percentage = total > 0 ? Math.round((Number(row.count || 0) / total) * 100) : 0;

          return (
            <div key={row.status || row.rating} className="grid grid-cols-[120px_minmax(0,1fr)_44px] items-center gap-3">
              <p className="truncate text-xs font-bold text-gray-700">{labelResolver(row)}</p>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-gray-900" style={{ width: `${percentage}%` }} />
              </div>
              <p className="text-right text-xs font-semibold text-gray-500">{formatNumber(row.count)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const AdminInsightsPage = () => {
  const [insights, setInsights] = useState(emptyInsights);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    const { data, error } = await getAdminPlatformInsights();

    if (error) {
      setErrorMessage(error.message || 'Insight platform belum bisa dimuat.');
    }

    setInsights(data || emptyInsights);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights, refreshIndex]);

  const statCards = useMemo(() => ([
    {
      label: 'Total User',
      value: formatNumber(insights.stats.totalUsers),
      caption: `${formatNumber(insights.stats.totalSMEs)} UMKM - ${formatNumber(insights.stats.totalInfluencers)} influencer`,
      icon: faUsers,
      tone: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Campaign',
      value: formatNumber(insights.stats.totalCampaigns),
      caption: `${formatNumber(insights.stats.activeCampaigns)} aktif - ${formatNumber(insights.stats.completedCampaigns)} selesai`,
      icon: faBullhorn,
      tone: 'bg-violet-50 text-violet-700',
    },
    {
      label: 'Revenue Paid',
      value: formatCurrency(insights.stats.paidRevenue),
      caption: `${formatCurrency(insights.stats.unpaidRevenue)} belum dibayar`,
      icon: faSackDollar,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Rating Rata-rata',
      value: Number(insights.stats.averageRating || 0).toFixed(1),
      caption: 'Berdasarkan review UMKM',
      icon: faStar,
      tone: 'bg-amber-50 text-amber-700',
    },
  ]), [insights]);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-gray-500">Dashboard Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-950">Insight Platform</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Lihat tren pertumbuhan user, campaign, revenue, rating, niche populer, dan pelaku platform paling aktif.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshIndex((current) => current + 1)}
          className="btn btn-outline inline-flex items-center justify-center gap-2 text-xs"
          disabled={loading}
        >
          <FontAwesomeIcon icon={faRotateRight} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => <StatCard key={card.label} {...card} loading={loading} />)}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SeriesChart
          title="Pertumbuhan User"
          caption="Pendaftaran user dalam 6 bulan terakhir."
          rows={insights.usersByMonth}
        />
        <SeriesChart
          title="Campaign per Bulan"
          caption="Volume campaign yang dibuat UMKM."
          rows={insights.campaignsByMonth}
        />
        <SeriesChart
          title="Revenue Campaign"
          caption="Total nilai campaign dan transaksi paid."
          rows={insights.revenueByMonth}
          valueFormatter={formatCurrency}
          secondaryLabel="Paid"
          secondaryFormatter={formatCurrency}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DistributionList
          title="Status Campaign"
          rows={insights.campaignStatusDistribution}
          labelResolver={(row) => SME_ORDER_STATUS_LABELS[row.status] || row.status}
        />
        <DistributionList
          title="Status Pembayaran"
          rows={insights.paymentStatusDistribution}
          labelResolver={(row) => SME_PAYMENT_STATUS_LABELS[row.status] || row.status}
        />
        <DistributionList
          title="Distribusi Rating"
          rows={insights.ratingDistribution}
          labelResolver={(row) => `${row.rating} Bintang`}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <RankedList
          title="Niche Terpopuler"
          caption="Jumlah influencer dan total followers."
          icon={faUserTie}
          rows={insights.topNiches}
          valueLabel="influencer"
          secondaryFormatter={formatNumber}
        />
        <RankedList
          title="UMKM Paling Aktif"
          caption="Campaign terbanyak dan nilai campaign."
          icon={faStore}
          rows={insights.topSMEs}
          valueLabel="campaign"
        />
        <RankedList
          title="Influencer Paling Aktif"
          caption="Campaign terbanyak dan nilai transaksi."
          icon={faCircleCheck}
          rows={insights.topInfluencers}
          valueLabel="campaign"
        />
      </section>
    </div>
  );
};

export default AdminInsightsPage;
