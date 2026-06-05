import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBolt,
  faChartLine,
  faCopy,
  faLightbulb,
  faMagicWandSparkles,
  faPaperPlane,
  faRotateRight,
  faSearch,
  faSpinner,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import {
  MARKET_RESEARCH_FIELD_LIMITS,
  MARKET_RESEARCH_TIMEFRAMES,
  createEmptyMarketResearchForm,
  getMarketResearchRoleConfig,
  normalizeMarketResearchResult,
  sanitizeMarketResearchPayload,
} from '../../../features/shared/marketResearchAgent';
import { generateMarketResearchReport } from '../../../services/api';

const joinResearchText = (result) => [
  result.summary,
  ...(result.trends || []).map((item) => `Tren: ${item.title}\n${item.description}`),
  ...(result.pain_points || []).map((item) => `Pain Point: ${item.title}\n${item.description}`),
  ...(result.search_intents || []).map((item) => `Niat Pencarian: ${item.title}\n${item.description}`),
  ...(result.opportunities || []).map((item) => `Peluang: ${item.title}\n${item.description}${item.action ? `\nAksi: ${item.action}` : ''}`),
  ...(result.content_angles || []).map((item) => `Angle: ${item.title}\n${item.description}`),
  ...(result.recommended_actions || []).map((item) => `Aksi: ${item.title}\n${item.description}`),
  ...(result.cautions?.length ? [`Catatan\n- ${result.cautions.join('\n- ')}`] : []),
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

const ResearchSection = ({ title, icon, items }) => {
  if (!items?.length) return null;

  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-gray-900 text-white flex items-center justify-center">
          <FontAwesomeIcon icon={icon} />
        </div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>
      <div className="grid gap-4">
        {items.map((item, index) => (
          <article key={`${title}-${item.title}-${index}`} className="rounded-lg border border-gray-200 p-4">
            <p className="font-bold text-gray-900">{item.title}</p>
            {item.description && <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-wrap">{item.description}</p>}
            {item.implication && <p className="text-sm text-gray-700 mt-3"><span className="font-semibold">Implikasi:</span> {item.implication}</p>}
            {item.action && <p className="text-sm text-gray-700 mt-2"><span className="font-semibold">Aksi:</span> {item.action}</p>}
          </article>
        ))}
      </div>
    </section>
  );
};

const MarketResearchResult = ({ result, copied, onCopy }) => {
  if (!result) return null;

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faSearch} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase">Hasil Riset</p>
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

      <ResearchSection title="Tren Pasar" icon={faChartLine} items={result.trends} />
      <ResearchSection title="Pain Point Audiens" icon={faTriangleExclamation} items={result.pain_points} />
      <ResearchSection title="Niat Pencarian" icon={faSearch} items={result.search_intents} />
      <ResearchSection title="Peluang" icon={faLightbulb} items={result.opportunities} />
      <ResearchSection title="Angle Konten" icon={faMagicWandSparkles} items={result.content_angles} />
      <ResearchSection title="Aksi Prioritas" icon={faBolt} items={result.recommended_actions} />

      {result.cautions.length > 0 && (
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Catatan Risiko</h3>
          <ul className="space-y-2">
            {result.cautions.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-gray-600">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gray-900 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

const MarketResearchAgentComposer = ({ role = 'sme' }) => {
  const roleConfig = getMarketResearchRoleConfig(role);
  const [formData, setFormData] = useState(() => createEmptyMarketResearchForm(role));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  useEffect(() => {
    setFormData(createEmptyMarketResearchForm(role));
    setResult(null);
    setError(null);
    setCopied(false);
    setRateLimitCountdown(0);
  }, [role]);

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
      [name]: value,
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
      const payload = sanitizeMarketResearchPayload(formData, role);
      const { data, error: apiError } = await generateMarketResearchReport(payload);
      if (apiError) throw apiError;

      setResult(normalizeMarketResearchResult(data?.result));
    } catch (submitError) {
      if (submitError.retryAfter) {
        setRateLimitCountdown(Number(submitError.retryAfter));
      }

      setError(submitError.message || 'Gagal membuat riset pasar.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(joinResearchText(result));
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
            <FontAwesomeIcon icon={faSearch} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase">Asisten Riset Pasar</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">Riset Pasar untuk {roleConfig.label}</h2>
            <p className="text-sm text-gray-600 mt-2">
              Temukan tren, masalah audiens, niat pencarian, dan peluang promosi sebelum membuat konten.
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">{roleConfig.focusLabel} *</label>
            <input
              type="text"
              name="focus"
              value={formData.focus}
              onChange={handleChange}
              required
              maxLength={MARKET_RESEARCH_FIELD_LIMITS.focus}
              placeholder={roleConfig.focusPlaceholder}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Target Audiens *</label>
            <input
              type="text"
              name="target_audience"
              value={formData.target_audience}
              onChange={handleChange}
              required
              maxLength={MARKET_RESEARCH_FIELD_LIMITS.targetAudience}
              placeholder="contoh: perempuan 20-30 tahun, tinggal di kota besar, suka produk lokal"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Lokasi</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                maxLength={MARKET_RESEARCH_FIELD_LIMITS.location}
                placeholder="contoh: Jakarta, Bandung, Indonesia"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <SelectField
              label="Rentang Riset"
              name="timeframe"
              value={formData.timeframe}
              options={MARKET_RESEARCH_TIMEFRAMES}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{roleConfig.objectiveLabel} *</label>
            <textarea
              name="objective"
              value={formData.objective}
              onChange={handleChange}
              required
              rows={4}
              maxLength={MARKET_RESEARCH_FIELD_LIMITS.objective}
              placeholder={roleConfig.objectivePlaceholder}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-400 mt-2">{formData.objective.length}/{MARKET_RESEARCH_FIELD_LIMITS.objective} karakter</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Catatan Tambahan</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              maxLength={MARKET_RESEARCH_FIELD_LIMITS.notes}
              placeholder={roleConfig.notesPlaceholder}
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
                  Membuat riset...
                </>
              ) : rateLimitCountdown > 0 ? (
                <>
                  <FontAwesomeIcon icon={faRotateRight} className="mr-2" />
                  Tunggu {rateLimitCountdown}s
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                  Buat Riset
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

      <MarketResearchResult result={result} copied={copied} onCopy={handleCopy} />
    </div>
  );
};

export default MarketResearchAgentComposer;
