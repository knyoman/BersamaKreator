import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBolt,
  faCircleCheck,
  faCircleInfo,
  faCode,
  faGlobe,
  faLink,
  faRobot,
  faRotateRight,
  faServer,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { getAdminAIMonitor } from '../../../services/api';

const emptyStats = {
  totalFeatures: 0,
  readyFeatures: 0,
  localFeatures: 0,
  localHealthyFeatures: 0,
  productionFeatures: 0,
  clientFeatures: 0,
  missingFeatures: 0,
  issueFeatures: 0,
};

const filterOptions = [
  { value: 'all', label: 'Semua' },
  { value: 'ready', label: 'Siap' },
  { value: 'issue', label: 'Perlu Cek' },
  { value: 'local', label: 'Lokal' },
  { value: 'production', label: 'Production' },
  { value: 'client', label: 'Tool Lokal' },
];

const statusMeta = {
  healthy: {
    icon: faCircleCheck,
    badge: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    iconTone: 'bg-emerald-50 text-emerald-700',
  },
  configured: {
    icon: faGlobe,
    badge: 'border-blue-100 bg-blue-50 text-blue-700',
    iconTone: 'bg-blue-50 text-blue-700',
  },
  client_ready: {
    icon: faCode,
    badge: 'border-gray-200 bg-gray-50 text-gray-700',
    iconTone: 'bg-gray-100 text-gray-800',
  },
  missing: {
    icon: faTriangleExclamation,
    badge: 'border-amber-100 bg-amber-50 text-amber-700',
    iconTone: 'bg-amber-50 text-amber-700',
  },
  invalid: {
    icon: faTriangleExclamation,
    badge: 'border-red-100 bg-red-50 text-red-700',
    iconTone: 'bg-red-50 text-red-700',
  },
  route_missing: {
    icon: faTriangleExclamation,
    badge: 'border-amber-100 bg-amber-50 text-amber-700',
    iconTone: 'bg-amber-50 text-amber-700',
  },
  local_error: {
    icon: faTriangleExclamation,
    badge: 'border-red-100 bg-red-50 text-red-700',
    iconTone: 'bg-red-50 text-red-700',
  },
  local_unreachable: {
    icon: faTriangleExclamation,
    badge: 'border-red-100 bg-red-50 text-red-700',
    iconTone: 'bg-red-50 text-red-700',
  },
};

const formatNumber = (value) => new Intl.NumberFormat('id-ID').format(Number(value || 0));

const formatDateTime = (value) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getFeatureStatusMeta = (status) => statusMeta[status] || statusMeta.missing;

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

const StatusBadge = ({ feature }) => {
  const meta = getFeatureStatusMeta(feature.status);

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.badge}`}>
      <FontAwesomeIcon icon={meta.icon} />
      {feature.statusLabel}
    </span>
  );
};

const LoadingCards = () => (
  <>
    {[1, 2, 3, 4, 5, 6].map((item) => (
      <div key={item} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-gray-100" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-32 rounded bg-gray-100" />
            <div className="h-3 w-full rounded bg-gray-100" />
            <div className="h-3 w-4/5 rounded bg-gray-100" />
            <div className="h-9 w-full rounded bg-gray-100" />
          </div>
        </div>
      </div>
    ))}
  </>
);

const FeatureCard = ({ feature }) => {
  const meta = getFeatureStatusMeta(feature.status);

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300">
      <div className="flex items-start gap-3">
        <div className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${meta.iconTone}`}>
          <FontAwesomeIcon icon={feature.featureType === 'client' ? faCode : faRobot} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase text-gray-500">{feature.audience}</p>
              <h2 className="mt-1 text-base font-bold text-gray-950">{feature.name}</h2>
            </div>
            <StatusBadge feature={feature} />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{feature.description}</p>

          <div className="mt-4 space-y-2 rounded-lg bg-gray-50 p-3">
            <div className="flex items-start gap-2">
              <FontAwesomeIcon icon={faLink} className="mt-0.5 text-xs text-gray-400" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase text-gray-500">Endpoint</p>
                <p className="mt-0.5 break-all font-mono text-[11px] text-gray-700">
                  {feature.endpoint || 'Tidak membutuhkan endpoint backend'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5 text-xs text-gray-400" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase text-gray-500">Sumber Konfigurasi</p>
                <p className="mt-0.5 break-all font-mono text-[11px] text-gray-700">
                  {feature.source === 'fallback'
                    ? `${feature.envName} memakai fallback dari ${feature.fallbackEnvName || feature.sourceLabel}`
                    : feature.sourceLabel}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-gray-500">{feature.statusMessage}</p>
        </div>
      </div>
    </article>
  );
};

const filterFeatures = (features, activeFilter) => {
  if (activeFilter === 'ready') return features.filter((feature) => feature.isReady);
  if (activeFilter === 'issue') return features.filter((feature) => !feature.isReady);
  if (activeFilter === 'local') return features.filter((feature) => feature.isLocal);
  if (activeFilter === 'production') return features.filter((feature) => feature.isProduction);
  if (activeFilter === 'client') return features.filter((feature) => feature.featureType === 'client');

  return features;
};

const AdminAIMonitorPage = () => {
  const [features, setFeatures] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [generatedAt, setGeneratedAt] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);

  const fetchMonitor = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    const { data, error } = await getAdminAIMonitor();

    if (error) {
      setErrorMessage(error.message || 'Status AI belum bisa dimuat.');
    }

    setFeatures(data?.features || []);
    setStats(data?.stats || emptyStats);
    setGeneratedAt(data?.generatedAt || '');
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMonitor();
  }, [fetchMonitor, refreshIndex]);

  const statCards = useMemo(() => ([
    {
      label: 'Total Fitur AI',
      value: formatNumber(stats.totalFeatures),
      caption: `${formatNumber(stats.clientFeatures)} tool lokal`,
      icon: faRobot,
      tone: 'bg-gray-100 text-gray-800',
    },
    {
      label: 'Siap Dipakai',
      value: formatNumber(stats.readyFeatures),
      caption: `${formatNumber(stats.productionFeatures)} production siap`,
      icon: faCircleCheck,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Backend Lokal',
      value: formatNumber(stats.localHealthyFeatures),
      caption: `${formatNumber(stats.localFeatures)} endpoint lokal terbaca`,
      icon: faServer,
      tone: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Perlu Cek',
      value: formatNumber(stats.issueFeatures),
      caption: `${formatNumber(stats.missingFeatures)} belum konfigurasi`,
      icon: faTriangleExclamation,
      tone: 'bg-amber-50 text-amber-700',
    },
  ]), [stats]);

  const filteredFeatures = useMemo(
    () => filterFeatures(features, activeFilter),
    [activeFilter, features],
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-gray-500">Dashboard Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-950">Monitor Penggunaan AI</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Pantau kesiapan endpoint AI, route backend lokal, dan tool AI yang berjalan langsung di browser.
          </p>
          <p className="mt-2 text-xs font-semibold text-gray-500">
            Terakhir dicek: {loading ? '...' : formatDateTime(generatedAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshIndex((current) => current + 1)}
          className="btn btn-outline inline-flex items-center justify-center gap-2 text-xs"
        >
          <FontAwesomeIcon icon={faRotateRight} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>

      {errorMessage && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => <StatCard key={card.label} {...card} loading={loading} />)}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-950">Daftar Fitur AI</h2>
            <p className="mt-1 text-xs text-gray-500">
              {loading ? 'Memuat status...' : `${formatNumber(filteredFeatures.length)} fitur ditampilkan`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setActiveFilter(option.value)}
                className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                  activeFilter === option.value
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {loading ? (
            <LoadingCards />
          ) : filteredFeatures.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500 xl:col-span-2">
              Tidak ada fitur AI untuk filter ini.
            </div>
          ) : (
            filteredFeatures.map((feature) => <FeatureCard key={feature.id} feature={feature} />)
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-800">
            <FontAwesomeIcon icon={faBolt} />
          </div>
          <h2 className="mt-3 text-sm font-bold text-gray-950">Saat Development</h2>
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            Jalankan <span className="font-mono font-bold text-gray-800">npm run dev:all</span> untuk Vite dan local API,
            atau <span className="font-mono font-bold text-gray-800">npm run dev:api</span> jika frontend sudah berjalan.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-800">
            <FontAwesomeIcon icon={faServer} />
          </div>
          <h2 className="mt-3 text-sm font-bold text-gray-950">Health Check Lokal</h2>
          <p className="mt-2 break-all font-mono text-xs leading-relaxed text-gray-600">
            GET http://127.0.0.1:8080/health
          </p>
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            Route fitur harus muncul dalam daftar response health agar tombol AI bisa mengirim request.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-800">
            <FontAwesomeIcon icon={faGlobe} />
          </div>
          <h2 className="mt-3 text-sm font-bold text-gray-950">Saat Production</h2>
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            Isi env <span className="font-mono font-bold text-gray-800">VITE_EDGE_FUNCTION_*</span> dengan URL backend production.
            API key tetap hanya disimpan di server function, bukan di Vite.
          </p>
        </div>
      </section>
    </div>
  );
};

export default AdminAIMonitorPage;
