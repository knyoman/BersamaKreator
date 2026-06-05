import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faBullhorn,
  faChartLine,
  faCircleCheck,
  faStore,
  faUserTie,
} from '@fortawesome/free-solid-svg-icons';
import { getPlatformStats } from '../../../services/api';
import { logger } from '../../../utils/logger';
import { adminQuickActions } from './adminWorkspaceConfig';

const defaultStats = {
  totalInfluencers: 0,
  totalOrders: 0,
  totalSMEs: 0,
  successRate: 0,
};

const formatNumber = (value) => new Intl.NumberFormat('id-ID').format(Number(value || 0));

const StatCard = ({ label, value, caption, icon, tone, loading }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
    <div className="flex items-start justify-between gap-4">
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

const AdminOverviewPage = ({ userProfile }) => {
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        const { data, error } = await getPlatformStats();
        if (isMounted && error) {
          setErrorMessage('Sebagian statistik memakai data fallback karena koneksi data belum lengkap.');
        }

        if (isMounted && data) {
          setStats({ ...defaultStats, ...data });
        }
      } catch (error) {
        logger.error('[AdminOverviewPage] Error fetching stats:', error.message);
        if (isMounted) {
          setErrorMessage('Statistik platform belum bisa dimuat. Coba refresh halaman.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const statCards = [
    {
      label: 'Total Influencer',
      value: formatNumber(stats.totalInfluencers),
      caption: 'Kreator yang terdaftar di marketplace.',
      icon: faUserTie,
      tone: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Total UMKM',
      value: formatNumber(stats.totalSMEs),
      caption: 'Bisnis yang memakai platform.',
      icon: faStore,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Total Campaign',
      value: formatNumber(stats.totalOrders),
      caption: 'Pesanan/campaign yang tercatat.',
      icon: faBullhorn,
      tone: 'bg-violet-50 text-violet-700',
    },
    {
      label: 'Tingkat Selesai',
      value: `${formatNumber(stats.successRate)}%`,
      caption: 'Rasio campaign selesai dari total campaign.',
      icon: faCircleCheck,
      tone: 'bg-amber-50 text-amber-700',
    },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-gray-500">Dashboard Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-950">Ringkasan Platform</h1>
          <p className="mt-1 text-sm text-gray-600">
            Selamat datang, {userProfile?.name || 'Admin'}. Pantau kesehatan operasional BersamaKreator dari satu ruang kerja.
          </p>
        </div>
        <Link to="/dashboard/insights" className="btn btn-outline inline-flex items-center justify-center gap-2 text-xs">
          Lihat Insight
          <FontAwesomeIcon icon={faArrowRight} />
        </Link>
      </header>

      {errorMessage && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
          {errorMessage}
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} loading={loading} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-950">Aksi Cepat Admin</h2>
              <p className="mt-1 text-xs text-gray-500">Pintu masuk untuk pekerjaan operasional yang paling sering dipakai.</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {adminQuickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="group rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-900 hover:bg-gray-50"
              >
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-950 text-white">
                    <FontAwesomeIcon icon={action.icon} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-950">{action.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">{action.description}</p>
                  </div>
                  <FontAwesomeIcon icon={faArrowRight} className="ml-auto mt-1 text-xs text-gray-400 group-hover:text-gray-900" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
              <FontAwesomeIcon icon={faChartLine} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-950">Fokus Minggu Ini</h2>
              <p className="text-xs text-gray-500">Prioritas admin untuk menjaga kualitas platform.</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {[
              'Verifikasi influencer yang sudah melengkapi profil.',
              'Pantau campaign aktif agar tidak melewati deadline.',
              'Cek review rating rendah untuk menjaga reputasi platform.',
              'Monitor fitur AI jika ada error atau limit request.',
            ].map((item) => (
              <div key={item} className="flex gap-2 rounded-lg bg-gray-50 px-3 py-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-900" />
                <p className="text-xs leading-relaxed text-gray-600">{item}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
};

export default AdminOverviewPage;
