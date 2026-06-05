import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faGear,
  faPlug,
  faRotateRight,
  faTags,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { getAdminPlatformSettings } from '../../../services/api';

const emptySettings = {
  platform: {
    status: 'active',
    platformFeePercent: 0,
    publicSMEEstimate: 0,
    publicSuccessRateEstimate: 95,
  },
  integrations: [],
  niches: [],
  recommendations: [],
};

const formatNumber = (value) => new Intl.NumberFormat('id-ID').format(Number(value || 0));

const IntegrationBadge = ({ isConfigured }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
    isConfigured
      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
      : 'border-amber-100 bg-amber-50 text-amber-700'
  }`}
  >
    <FontAwesomeIcon icon={isConfigured ? faCircleCheck : faTriangleExclamation} />
    {isConfigured ? 'Terkonfigurasi' : 'Perlu konfigurasi'}
  </span>
);

const ConfigCard = ({ label, value, envName, description }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-bold uppercase text-gray-500">{label}</p>
    <p className="mt-2 text-2xl font-bold text-gray-950">{value}</p>
    <p className="mt-1 text-xs leading-relaxed text-gray-500">{description}</p>
    <p className="mt-3 break-all rounded-lg bg-gray-50 px-3 py-2 font-mono text-[11px] font-semibold text-gray-600">
      {envName}
    </p>
  </div>
);

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState(emptySettings);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    const { data, error } = await getAdminPlatformSettings();

    if (error) {
      setErrorMessage(error.message || 'Pengaturan platform belum bisa dimuat.');
    }

    setSettings(data || emptySettings);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings, refreshIndex]);

  const configuredIntegrations = useMemo(
    () => settings.integrations.filter((item) => item.isConfigured).length,
    [settings.integrations],
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-gray-500">Dashboard Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-950">Pengaturan Platform</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Pantau konfigurasi dasar platform, integrasi backend, fee, estimasi publik, dan kategori niche yang sedang aktif.
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

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ConfigCard
          label="Status Platform"
          value={loading ? '...' : settings.platform.status}
          envName="VITE_PLATFORM_STATUS"
          description="Status operasional yang bisa dipakai untuk label internal admin."
        />
        <ConfigCard
          label="Fee Platform"
          value={loading ? '...' : `${settings.platform.platformFeePercent}%`}
          envName="VITE_PLATFORM_FEE_PERCENT"
          description="Dipakai untuk estimasi revenue di pusat pembayaran."
        />
        <ConfigCard
          label="Estimasi UMKM Publik"
          value={loading ? '...' : formatNumber(settings.platform.publicSMEEstimate)}
          envName="VITE_PUBLIC_SME_COUNT_ESTIMATE"
          description="Fallback angka publik bila data Supabase belum bisa dibaca."
        />
        <ConfigCard
          label="Estimasi Success Rate"
          value={loading ? '...' : `${settings.platform.publicSuccessRateEstimate}%`}
          envName="VITE_PUBLIC_SUCCESS_RATE_ESTIMATE"
          description="Fallback persentase sukses untuk halaman publik."
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Integrasi</p>
              <h2 className="mt-1 text-lg font-bold text-gray-950">Status Backend & Environment</h2>
              <p className="mt-1 text-xs text-gray-500">
                {loading ? 'Memuat...' : `${configuredIntegrations} dari ${settings.integrations.length} integrasi siap`}
              </p>
            </div>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
              <FontAwesomeIcon icon={faPlug} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {settings.integrations.map((integration) => (
              <div key={integration.key} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-950">{integration.label}</p>
                    <p className="mt-1 text-xs text-gray-500">{integration.detail || 'Konfigurasi dibaca dari environment Vite.'}</p>
                  </div>
                  <IntegrationBadge isConfigured={integration.isConfigured} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {integration.envNames.map((envName) => (
                    <span key={envName} className="rounded-md bg-gray-50 px-2 py-1 font-mono text-[11px] font-semibold text-gray-600">
                      {envName}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
              <FontAwesomeIcon icon={faGear} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-950">Catatan Operasional</h2>
              <p className="text-xs text-gray-500">Rekomendasi agar platform stabil.</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {settings.recommendations.map((item) => (
              <div key={item} className="flex gap-2 rounded-lg bg-gray-50 px-3 py-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-900" />
                <p className="text-xs leading-relaxed text-gray-600">{item}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
            <FontAwesomeIcon icon={faTags} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-950">Kategori Niche Aktif</h2>
            <p className="text-xs text-gray-500">Diambil dari profil influencer yang sudah ada di database.</p>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-bold">Niche</th>
                <th className="px-4 py-3 font-bold">Influencer</th>
                <th className="px-4 py-3 font-bold">Verified</th>
                <th className="px-4 py-3 font-bold">Kesiapan</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                [1, 2, 3].map((item) => (
                  <tr key={item} className="border-t border-gray-100">
                    <td className="px-4 py-4"><div className="h-4 w-40 rounded bg-gray-100" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-20 rounded bg-gray-100" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-20 rounded bg-gray-100" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-32 rounded bg-gray-100" /></td>
                  </tr>
                ))
              ) : settings.niches.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-sm text-gray-500">
                    Belum ada kategori niche dari data influencer.
                  </td>
                </tr>
              ) : (
                settings.niches.map((item) => {
                  const readiness = item.totalInfluencers > 0
                    ? Math.round((item.verifiedInfluencers / item.totalInfluencers) * 100)
                    : 0;

                  return (
                    <tr key={item.niche} className="border-t border-gray-100 hover:bg-gray-50/70">
                      <td className="px-4 py-3 text-sm font-bold text-gray-950">{item.niche}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatNumber(item.totalInfluencers)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatNumber(item.verifiedInfluencers)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-100">
                            <div className="h-full rounded-full bg-gray-900" style={{ width: `${readiness}%` }} />
                          </div>
                          <span className="text-xs font-bold text-gray-700">{readiness}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminSettingsPage;
