import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBullhorn,
  faBullseye,
  faCopy,
  faLightbulb,
  faPaperPlane,
  faRotateRight,
  faSpinner,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import {
  AD_COPY_FIELD_LIMITS,
  AD_COPY_OBJECTIVES,
  AD_COPY_PLATFORMS,
  AD_COPY_TONES,
  AD_COPY_VARIATION_COUNTS,
  createEmptyAdCopyForm,
  normalizeAdCopyResult,
  sanitizeAdCopyPayload,
} from '../../../features/shared/adCopyAgent';
import { generateAdCopyPlan } from '../../../services/api';

const joinAdCopyText = (result) => [
  result.title,
  result.summary,
  ...(result.angles?.length ? [
    `Angle Iklan\n${result.angles.map((item) => [
      item.title,
      item.rationale ? `Alasan: ${item.rationale}` : '',
      item.best_for ? `Cocok untuk: ${item.best_for}` : '',
    ].filter(Boolean).join('\n')).join('\n\n')}`,
  ] : []),
  ...(result.variations || []).map((item) => [
    `Variasi: ${item.title}`,
    item.platform ? `Platform: ${item.platform}` : '',
    item.angle ? `Angle: ${item.angle}` : '',
    item.headline ? `Headline: ${item.headline}` : '',
    item.primary_text,
    item.description ? `Deskripsi: ${item.description}` : '',
    item.cta ? `CTA: ${item.cta}` : '',
    item.creative_direction ? `Arah Kreatif: ${item.creative_direction}` : '',
  ].filter(Boolean).join('\n')),
  ...(result.hooks?.length ? [`Hook\n- ${result.hooks.join('\n- ')}`] : []),
  ...(result.negative_prompts?.length ? [`Batasan Konten\n- ${result.negative_prompts.join('\n- ')}`] : []),
  ...(result.ctas?.length ? [`CTA Alternatif\n- ${result.ctas.join('\n- ')}`] : []),
  ...(result.testing_notes?.length ? [`Catatan Testing\n- ${result.testing_notes.join('\n- ')}`] : []),
].filter(Boolean).join('\n\n');

const SelectField = ({ label, name, value, options, onChange }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  </div>
);

const VariationCard = ({ item }) => (
  <article className="rounded-lg border border-gray-200 p-4">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <p className="font-bold text-gray-900">{item.title}</p>
      {item.platform && <span className="text-xs font-semibold text-gray-600 bg-gray-100 rounded-full px-3 py-1">{item.platform}</span>}
    </div>
    {item.angle && <p className="text-sm text-gray-500 mt-2">Angle: {item.angle}</p>}
    {item.headline && <p className="text-sm font-semibold text-gray-800 mt-4">Headline: {item.headline}</p>}
    {item.primary_text && <p className="text-sm text-gray-600 mt-3 leading-relaxed whitespace-pre-wrap">{item.primary_text}</p>}
    {item.description && <p className="text-sm text-gray-500 mt-3">{item.description}</p>}
    {item.cta && <p className="text-sm text-gray-800 mt-4"><span className="font-semibold">CTA:</span> {item.cta}</p>}
    {item.creative_direction && (
      <p className="text-sm text-gray-500 mt-3">
        <span className="font-semibold text-gray-700">Arah kreatif:</span> {item.creative_direction}
      </p>
    )}
  </article>
);

const AdCopyResult = ({ result, copied, onCopy }) => {
  if (!result) return null;

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faBullhorn} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase">Hasil Naskah Iklan</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">{result.title}</h2>
              {result.summary && <p className="text-gray-600 mt-2 leading-relaxed whitespace-pre-wrap">{result.summary}</p>}
            </div>
          </div>

          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faCopy} className="mr-2" />
            {copied ? 'Tersalin' : 'Salin'}
          </button>
        </div>
      </section>

      {result.angles.length > 0 && (
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <FontAwesomeIcon icon={faBullseye} className="text-gray-700" />
            <h3 className="text-lg font-bold text-gray-900">Angle Iklan</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {result.angles.map((item, index) => (
              <div key={`${item.title}-${index}`} className="rounded-lg bg-gray-50 border border-gray-100 p-4">
                <p className="text-sm font-bold text-gray-900">{item.title}</p>
                {item.rationale && <p className="text-sm text-gray-600 mt-2">{item.rationale}</p>}
                {item.best_for && <p className="text-xs font-semibold text-gray-500 uppercase mt-3">{item.best_for}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {result.variations.length > 0 && (
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-5">Variasi Naskah</h3>
          <div className="grid gap-4">
            {result.variations.map((item, index) => (
              <VariationCard key={`${item.title}-${index}`} item={item} />
            ))}
          </div>
        </section>
      )}

      {(result.hooks.length > 0 || result.negative_prompts.length > 0 || result.ctas.length > 0 || result.testing_notes.length > 0) && (
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Optimasi Iklan</h3>
          <div className="grid lg:grid-cols-2 gap-4">
            {[
              ['Hook', result.hooks, faLightbulb],
              ['Batasan Konten', result.negative_prompts, faTriangleExclamation],
              ['CTA Alternatif', result.ctas, faPaperPlane],
              ['Catatan Testing', result.testing_notes, faBullseye],
            ].filter(([, items]) => items.length > 0).map(([title, items, icon]) => (
              <div key={title} className="rounded-lg bg-gray-50 border border-gray-100 p-4">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={icon} className="text-gray-700" />
                  <p className="text-sm font-bold text-gray-900">{title}</p>
                </div>
                <ul className="space-y-2 mt-3">
                  {items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-gray-600">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gray-900 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const AdCopyAgentComposer = () => {
  const [formData, setFormData] = useState(createEmptyAdCopyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  useEffect(() => {
    if (rateLimitCountdown <= 0) return undefined;

    const timerId = window.setInterval(() => {
      setRateLimitCountdown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [rateLimitCountdown]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: name === 'variation_count' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (rateLimitCountdown > 0) {
      setError(`Tunggu ${rateLimitCountdown} detik sebelum mencoba lagi.`);
      return;
    }

    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const payload = sanitizeAdCopyPayload(formData);
      const { data, error: apiError } = await generateAdCopyPlan(payload);
      if (apiError) throw apiError;

      setResult(normalizeAdCopyResult(data?.result));
    } catch (submitError) {
      if (submitError.retryAfter) {
        setRateLimitCountdown(Number(submitError.retryAfter));
      }

      setError(submitError.message || 'Gagal membuat naskah iklan.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(joinAdCopyText(result));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (copyError) {
      setError('Gagal menyalin otomatis. Silakan salin teks secara manual.');
    }
  };

  return (
    <div className="grid xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] gap-6 items-start">
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-11 h-11 rounded-lg bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon icon={faBullhorn} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase">Asisten Naskah Iklan</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">Variasi Naskah Iklan untuk UMKM</h2>
            <p className="text-sm text-gray-600 mt-2">
              Buat angle, headline, isi iklan, CTA, dan catatan pengujian untuk iklan berbayar.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Produk / Penawaran *</label>
            <textarea
              name="offer"
              value={formData.offer}
              onChange={handleChange}
              required
              rows={4}
              maxLength={AD_COPY_FIELD_LIMITS.offer}
              placeholder="contoh: paket starter skincare lokal untuk kulit berminyak"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Target Audiens *</label>
            <input
              type="text"
              name="audience"
              value={formData.audience}
              onChange={handleChange}
              required
              maxLength={AD_COPY_FIELD_LIMITS.audience}
              placeholder="contoh: perempuan 20-30 tahun yang baru mulai skincare routine"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <SelectField
              label="Tujuan Iklan"
              name="objective"
              value={formData.objective}
              options={AD_COPY_OBJECTIVES}
              onChange={handleChange}
            />
            <SelectField
              label="Platform"
              name="platform"
              value={formData.platform}
              options={AD_COPY_PLATFORMS}
              onChange={handleChange}
            />
            <SelectField
              label="Gaya Bahasa"
              name="tone"
              value={formData.tone}
              options={AD_COPY_TONES}
              onChange={handleChange}
            />
            <SelectField
              label="Jumlah Variasi"
              name="variation_count"
              value={formData.variation_count}
              options={AD_COPY_VARIATION_COUNTS}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Detail Tujuan *</label>
            <textarea
              name="objective_detail"
              value={formData.objective_detail}
              onChange={handleChange}
              required
              rows={3}
              maxLength={AD_COPY_FIELD_LIMITS.objectiveDetail}
              placeholder="contoh: mendorong pembelian pertama lewat landing page dan menaikkan add-to-cart"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Konteks Brand / Promosi</label>
            <textarea
              name="context"
              value={formData.context}
              onChange={handleChange}
              rows={4}
              maxLength={AD_COPY_FIELD_LIMITS.context}
              placeholder="contoh: brand lokal, dermatology-inspired, ingin terasa aman untuk pemula"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Batasan / Hal yang Dihindari</label>
            <textarea
              name="constraints"
              value={formData.constraints}
              onChange={handleChange}
              rows={3}
              maxLength={AD_COPY_FIELD_LIMITS.constraints}
              placeholder="contoh: jangan klaim menyembuhkan jerawat, jangan menyebut diskon jika tidak ada"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Catatan Tambahan</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              maxLength={AD_COPY_FIELD_LIMITS.notes}
              placeholder="contoh: gunakan CTA beli sekarang, headline maksimal 40 karakter"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={loading || rateLimitCountdown > 0}
              className="btn btn-primary inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                  Membuat naskah...
                </>
              ) : rateLimitCountdown > 0 ? (
                <>
                  <FontAwesomeIcon icon={faRotateRight} className="mr-2" />
                  Tunggu {rateLimitCountdown}s
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                  Buat Naskah
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !result || rateLimitCountdown > 0}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faRotateRight} className="mr-2" />
              Buat Ulang
            </button>
          </div>
        </form>
      </section>

      <AdCopyResult result={result} copied={copied} onCopy={handleCopy} />
    </div>
  );
};

export default AdCopyAgentComposer;
