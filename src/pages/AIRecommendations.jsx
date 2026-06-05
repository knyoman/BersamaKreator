import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faExclamationTriangle,
  faLightbulb,
  faRobot,
  faSpinner,
  faSync,
} from '@fortawesome/free-solid-svg-icons';
import { logger } from '../utils/logger';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const COOLDOWN_SECONDS = 60;
const STORAGE_KEY = 'ai_recommendations_last_request';
const REQUEST_TIMEOUT_MS = 30000;
const MAX_NETWORK_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 2000;

const initialFormData = {
  budget: '',
  niche: '',
  targetAudience: '',
  campaignGoal: '',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isLocalBackendUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    return ['localhost', '127.0.0.1', '::1'].includes(parsedUrl.hostname);
  } catch (error) {
    return false;
  }
};

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request AI terlalu lama. Coba beberapa saat lagi.');
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const parseJsonResponse = async (response) => {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error('Server AI mengirim respons yang tidak valid. Coba lagi.');
  }
};

const createApiError = (response, result) => {
  if (response.status === 401) {
    return new Error('Autentikasi gagal. Silakan login ulang lalu coba lagi.');
  }

  if (response.status === 403) {
    return new Error(result?.error || 'Anda tidak memiliki akses ke rekomendasi AI.');
  }

  if (response.status === 429) {
    const retryAfter = result?.retryAfter || Number(response.headers.get('Retry-After')) || 60;
    const error = new Error(`Server sedang sibuk (rate limit). Silakan tunggu ${retryAfter} detik lalu coba lagi.`);
    error.retryAfter = retryAfter;
    return error;
  }

  if (response.status === 503 || response.status === 504) {
    return new Error('Layanan AI sedang sibuk. Coba lagi dalam 30 detik.');
  }

  return new Error(result?.error || `Error server (${response.status}). Coba lagi.`);
};

const getNetworkErrorMessage = (error, aiUrl) => {
  if (isLocalBackendUrl(aiUrl)) {
    return 'Tidak bisa terhubung ke AI backend lokal. Pastikan `npm run dev:api` atau `npm run dev:all` berjalan, URL .env.local benar, dan CORS mengizinkan port frontend.';
  }

  return error.message || 'Terjadi gangguan jaringan. Periksa koneksi Anda lalu coba lagi.';
};

const formatFollowers = (value) => {
  if (!value) return '-';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return value.toString();
};

const formatPrice = (value) => {
  const numericValue = Number(value || 0);
  return numericValue.toLocaleString('id-ID');
};

const getCooldownRemaining = () => {
  const lastRequestTime = localStorage.getItem(STORAGE_KEY);
  if (!lastRequestTime) return 0;

  const elapsed = (Date.now() - Number(lastRequestTime)) / 1000;
  return Math.max(0, Math.ceil(COOLDOWN_SECONDS - elapsed));
};

const AIRecommendations = () => {
  const { isAuthenticated, userProfile, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState(null);
  const [honeypot, setHoneypot] = useState('');
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const canUseAI = isAuthenticated && ['sme', 'admin'].includes(userProfile?.user_type);

  useEffect(() => {
    const interval = setInterval(() => {
      setCooldownRemaining(getCooldownRemaining());
    }, 1000);

    setCooldownRemaining(getCooldownRemaining());

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (rateLimitCountdown <= 0) return undefined;

    const interval = setInterval(() => {
      setRateLimitCountdown((prev) => {
        if (prev <= 1) {
          setError(null);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [rateLimitCountdown]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const startCooldown = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setCooldownRemaining(COOLDOWN_SECONDS);
  };

  const requestRecommendations = async ({ startCooldownOnSuccess = false } = {}) => {
    const aiUrl = import.meta.env.VITE_EDGE_FUNCTION_AI_URL;
    const isConfigured = aiUrl && !aiUrl.includes('your-edgeone-domain');

    setLoading(true);
    setRecommendations(null);
    setError(null);

    const attemptFetch = async (retryCount = 0) => {
      try {
        if (!isConfigured) {
          throw new Error('URL backend AI belum dikonfigurasi. Periksa file .env.local.');
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.access_token) {
          throw new Error('Silakan login terlebih dahulu untuk menggunakan rekomendasi AI.');
        }

        logger.info('[AIRecommendations] Sending request to:', aiUrl);

        const response = await fetchWithTimeout(aiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            ...formData,
            _honeypot: honeypot,
          }),
        });

        const result = await parseJsonResponse(response);
        logger.debug('[AIRecommendations] API response:', result);

        if (!response.ok) {
          throw createApiError(response, result);
        }

        if (!result.data || !Array.isArray(result.data.influencers)) {
          throw new Error('Respons dari server AI tidak valid. Coba lagi.');
        }

        return result.data;
      } catch (requestError) {
        if (retryCount < MAX_NETWORK_RETRIES && requestError instanceof TypeError) {
          const delayMs = BASE_RETRY_DELAY_MS * Math.pow(2, retryCount);
          logger.warn(`[AIRecommendations] Gangguan jaringan. Percobaan ulang ${retryCount + 1}/${MAX_NETWORK_RETRIES} dalam ${delayMs / 1000}s.`);
          await sleep(delayMs);
          return attemptFetch(retryCount + 1);
        }

        throw requestError;
      }
    };

    try {
      const resultData = await attemptFetch();
      setRecommendations(resultData);

      if (startCooldownOnSuccess) {
        startCooldown();
      }

      return true;
    } catch (requestError) {
      logger.error('[AIRecommendations] AI error:', requestError.message);

      const errorMessage = requestError instanceof TypeError
        ? getNetworkErrorMessage(requestError, aiUrl)
        : requestError.message || 'Terjadi kesalahan. Coba lagi.';

      if (requestError.retryAfter) {
        setRateLimitCountdown(requestError.retryAfter);
      }

      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (authLoading) {
      setError('Sesi login sedang diperiksa. Mohon tunggu sebentar.');
      return;
    }

    if (!isAuthenticated) {
      setError('Silakan login sebagai akun UMKM untuk menggunakan rekomendasi AI.');
      return;
    }

    if (!canUseAI) {
      setError('Fitur rekomendasi AI tersedia untuk akun UMKM.');
      return;
    }

    if (honeypot !== '') {
      logger.warn('[AIRecommendations] Bot detected: Honeypot field was filled.');
      return;
    }

    const remaining = getCooldownRemaining();
    if (remaining > 0) {
      setCooldownRemaining(remaining);
      setError(`Mohon tunggu ${remaining} detik sebelum mengirim ulang.`);
      return;
    }

    await requestRecommendations({ startCooldownOnSuccess: true });
  };

  const handleRetry = () => {
    if (authLoading) {
      setError('Sesi login sedang diperiksa. Mohon tunggu sebentar.');
      return;
    }

    if (!isAuthenticated) {
      setError('Silakan login sebagai akun UMKM untuk menggunakan rekomendasi AI.');
      return;
    }

    if (!canUseAI) {
      setError('Fitur rekomendasi AI tersedia untuk akun UMKM.');
      return;
    }

    requestRecommendations();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="container-custom py-16 text-center">
          <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon icon={faRobot} className="text-white text-3xl" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">Rekomendasi AI</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Biarkan AI menemukan influencer yang paling sesuai untuk kampanye Anda</p>
        </div>
      </div>

      <div className="container-custom py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center mb-6">
              <FontAwesomeIcon icon={faLightbulb} className="text-primary-600 text-2xl mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Ceritakan Kampanye Anda</h2>
            </div>

            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tujuan Kampanye *</label>
                <textarea
                  name="campaignGoal"
                  value={formData.campaignGoal}
                  onChange={handleChange}
                  required
                  rows={3}
                  placeholder="Jelaskan target yang ingin dicapai, misalnya meningkatkan awareness kedai kopi baru di Jakarta Selatan."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Anggaran Kampanye (IDR) *</label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="contoh: 5000000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Niche/Industri *</label>
                <select
                  name="niche"
                  value={formData.niche}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="">Pilih niche</option>
                  <option value="fashion">Fashion & Gaya Hidup</option>
                  <option value="beauty">Kecantikan & Perawatan Kulit</option>
                  <option value="food">Makanan & Kuliner</option>
                  <option value="tech">Teknologi & Gadget</option>
                  <option value="travel">Travel</option>
                  <option value="health">Kesehatan & Kebugaran</option>
                  <option value="gaming">Gaming</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Audiens *</label>
                <input
                  type="text"
                  name="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleChange}
                  required
                  placeholder="contoh: Perempuan 18-35 tahun di Jakarta yang menyukai skincare"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <input
                type="text"
                name="website_url"
                value={honeypot}
                onChange={(event) => setHoneypot(event.target.value)}
                style={{
                  position: 'absolute',
                  left: '-9999px',
                  opacity: 0,
                  pointerEvents: 'none',
                  width: '1px',
                  height: '1px',
                }}
                tabIndex="-1"
                autoComplete="off"
                aria-hidden="true"
              />

              <div className="md:col-span-2 mt-4">
                {authLoading && (
                  <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                    <FontAwesomeIcon icon={faSpinner} className="text-gray-600 animate-spin mr-2" />
                    <span className="text-sm text-gray-700">Memeriksa sesi login...</span>
                  </div>
                )}



                {!authLoading && isAuthenticated && !canUseAI && (
                  <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                    <span className="text-sm text-yellow-800">
                      Rekomendasi AI hanya tersedia untuk akun UMKM.
                    </span>
                  </div>
                )}

                {cooldownRemaining > 0 && (
                  <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                    <FontAwesomeIcon icon={faClock} className="text-yellow-600 mr-2" />
                    <span className="text-sm text-yellow-800">
                      Mohon tunggu <strong>{cooldownRemaining}s</strong> sebelum mengirim ulang
                    </span>
                  </div>
                )}

                {rateLimitCountdown > 0 && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                    <FontAwesomeIcon icon={faClock} className="text-red-600 mr-2" />
                    <span className="text-sm text-red-800">
                      Server terkena rate limit. Mohon tunggu <strong>{rateLimitCountdown}s</strong> sebelum mencoba lagi
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading || !canUseAI || loading || cooldownRemaining > 0 || rateLimitCountdown > 0}
                  className="btn btn-primary w-full text-lg py-4 shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {authLoading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                      Memeriksa sesi...
                    </>
                  ) : !isAuthenticated ? (
                    <>
                      <FontAwesomeIcon icon={faRobot} className="mr-2" />
                      Login untuk Menggunakan AI
                    </>
                  ) : !canUseAI ? (
                    <>
                      <FontAwesomeIcon icon={faRobot} className="mr-2" />
                      Khusus Akun UMKM
                    </>
                  ) : loading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                      Menganalisis database dengan AI...
                    </>
                  ) : rateLimitCountdown > 0 ? (
                    <>
                      <FontAwesomeIcon icon={faClock} className="mr-2" />
                      Rate limit - tunggu {rateLimitCountdown}s
                    </>
                  ) : cooldownRemaining > 0 ? (
                    <>
                      <FontAwesomeIcon icon={faClock} className="mr-2" />
                      Tunggu {cooldownRemaining}s
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faRobot} className="mr-2" />
                      Dapatkan Rekomendasi AI
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {error && (
            <div className="mt-8 animate-fade-in-up">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 pt-1">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 text-2xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-900 mb-1">Tidak Bisa Mengambil Rekomendasi</h3>
                    <p className="text-red-700 mb-4">{error}</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleRetry}
                        disabled={authLoading || !canUseAI || loading || rateLimitCountdown > 0}
                        className="inline-flex items-center justify-center px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FontAwesomeIcon icon={faSync} className="mr-2" />
                        Coba Lagi
                      </button>
                      <button
                        onClick={() => setError(null)}
                        className="inline-flex items-center justify-center px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-medium rounded-lg transition-colors"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {recommendations && (
            <div className="mt-12 animate-fade-in-up">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
                  <FontAwesomeIcon icon={faRobot} className="text-primary-600" />
                  Influencer Hasil Rekomendasi AI
                </h3>
                <p className="text-gray-600">Berdasarkan kebutuhan kampanye Anda</p>
              </div>

              <div className="grid gap-8">
                {recommendations.influencers.length > 0 ? (
                  recommendations.influencers.map((influencer) => (
                    <div key={influencer.id} className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                      <div className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex-shrink-0 flex flex-col items-center gap-4">
                            <img
                              src={influencer.users?.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(influencer.users?.name || 'Pengguna')}&size=120&background=6366f1&color=fff`}
                              alt={influencer.users?.name || influencer.username}
                              className="w-24 h-24 rounded-full object-cover border-4 border-primary-100 shadow-md"
                            />

                            <div className="w-20 h-20 rounded-full border-4 border-primary-500 flex flex-col items-center justify-center">
                              <span className="text-2xl font-bold text-gray-900">{influencer.match_score}</span>
                              <span className="text-xs text-gray-500 font-medium">COCOK</span>
                            </div>
                          </div>

                          <div className="flex-1 space-y-4">
                            <div>
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                                <div>
                                  <h4 className="text-2xl font-bold text-gray-900 mb-1">{influencer.users?.name || 'Influencer Tidak Diketahui'}</h4>
                                  <p className="text-gray-600">@{influencer.username}</p>
                                </div>
                                <span className="self-start px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-semibold">
                                  {influencer.niche || 'Umum'}
                                </span>
                              </div>

                              {influencer.bio && <p className="text-gray-600 text-sm mt-2">{influencer.bio}</p>}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pengikut</div>
                                <div className="text-lg font-bold text-gray-900">{formatFollowers(influencer.followers_count)}</div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Interaksi</div>
                                <div className="text-lg font-bold text-green-600">
                                  {influencer.engagement_rate ? `${Number(influencer.engagement_rate).toFixed(1)}%` : '-'}
                                </div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Penilaian</div>
                                <div className="text-lg font-bold text-yellow-600">
                                  {influencer.rating_average ? Number(influencer.rating_average).toFixed(1) : '0.0'}
                                </div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pesanan</div>
                                <div className="text-lg font-bold text-gray-900">{influencer.total_orders || 0}</div>
                              </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                              <p className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-1">Analisis AI</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{influencer.reasoning}</p>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-200">
                              <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Harga/Posting</div>
                                <div className="text-2xl font-bold text-gray-900">Rp {formatPrice(influencer.price_per_post)}</div>
                              </div>
                              <Link to={`/influencer/${influencer.username}`} className="btn btn-primary px-6 py-3 text-base text-center">
                                Pesan Sekarang
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                    <p className="text-xl font-semibold text-gray-900 mb-2">Tidak ada kecocokan ditemukan</p>
                    <p className="text-gray-500">Coba sesuaikan anggaran atau filter niche Anda</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIRecommendations;
