import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarDays,
  faCopy,
  faLayerGroup,
  faLightbulb,
  faMagicWandSparkles,
  faPaperPlane,
  faRotateRight,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import {
  CONTENT_STRATEGY_FIELD_LIMITS,
  CONTENT_STRATEGY_PLATFORMS,
  CONTENT_STRATEGY_TIMEFRAMES,
  createEmptyContentStrategyForm,
  getContentStrategyRoleConfig,
  normalizeContentStrategyResult,
  sanitizeContentStrategyPayload,
} from '../../../features/shared/contentStrategyAgent';
import { generateContentStrategyPlan } from '../../../services/api';

const joinStrategyText = (result) => [
  result.summary,
  ...(result.pillars || []).map((item) => `${item.title}\n${item.description}`),
  ...(result.angles || []).map((item) => `${item.title}\n${item.hook || item.description}`),
  ...(result.weekly_plan || []).map((item) => [
    item.day || item.title,
    item.format,
    item.description,
    item.cta ? `CTA: ${item.cta}` : '',
  ].filter(Boolean).join('\n')),
  ...(result.hooks?.length ? [`Hook\n- ${result.hooks.join('\n- ')}`] : []),
  ...(result.ctas?.length ? [`CTA\n- ${result.ctas.join('\n- ')}`] : []),
  ...(result.tips?.length ? [`Tips\n- ${result.tips.join('\n- ')}`] : []),
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

const StrategyList = ({ title, icon, items, renderItem }) => {
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
          <article key={`${title}-${item.title || index}`} className="rounded-lg border border-gray-200 p-4">
            {renderItem(item, index)}
          </article>
        ))}
      </div>
    </section>
  );
};

const ContentStrategyResult = ({ result, copied, onCopy }) => {
  if (!result) return null;

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faMagicWandSparkles} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase">Hasil Strategi</p>
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

      <StrategyList
        title="Pilar Konten"
        icon={faLayerGroup}
        items={result.pillars}
        renderItem={(item) => (
          <>
            <p className="font-bold text-gray-900">{item.title}</p>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-wrap">{item.description}</p>
          </>
        )}
      />

      <StrategyList
        title="Angle dan Hook"
        icon={faLightbulb}
        items={result.angles}
        renderItem={(item) => (
          <>
            <p className="font-bold text-gray-900">{item.title}</p>
            {item.hook && <p className="text-sm font-semibold text-gray-800 mt-2">{item.hook}</p>}
            <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-wrap">{item.description}</p>
          </>
        )}
      />

      <StrategyList
        title="Rencana Mingguan"
        icon={faCalendarDays}
        items={result.weekly_plan}
        renderItem={(item) => (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="font-bold text-gray-900">{item.day || item.title}</p>
              {item.format && <span className="text-xs font-semibold text-gray-600 bg-gray-100 rounded-full px-3 py-1">{item.format}</span>}
            </div>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-wrap">{item.description}</p>
            {item.cta && <p className="text-sm font-semibold text-gray-800 mt-3">CTA: {item.cta}</p>}
          </>
        )}
      />

      {(result.hooks.length > 0 || result.ctas.length > 0 || result.tips.length > 0) && (
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Bank Eksekusi</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              ['Hook', result.hooks],
              ['CTA', result.ctas],
              ['Tips', result.tips],
            ].filter(([, items]) => items.length > 0).map(([title, items]) => (
              <div key={title} className="rounded-lg bg-gray-50 border border-gray-100 p-4">
                <p className="text-sm font-bold text-gray-900">{title}</p>
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

const ContentStrategyAgentComposer = ({ role = 'influencer' }) => {
  const roleConfig = getContentStrategyRoleConfig(role);
  const [formData, setFormData] = useState(() => createEmptyContentStrategyForm(role));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  useEffect(() => {
    setFormData(createEmptyContentStrategyForm(role));
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
      const payload = sanitizeContentStrategyPayload(formData, role);
      const { data, error: apiError } = await generateContentStrategyPlan(payload);
      if (apiError) throw apiError;

      setResult(normalizeContentStrategyResult(data?.result));
    } catch (submitError) {
      if (submitError.retryAfter) {
        setRateLimitCountdown(Number(submitError.retryAfter));
      }

      setError(submitError.message || 'Gagal membuat strategi konten.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(joinStrategyText(result));
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
            <FontAwesomeIcon icon={faMagicWandSparkles} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase">Asisten Strategi Konten</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">Rencana Konten untuk {roleConfig.label}</h2>
            <p className="text-sm text-gray-600 mt-2">
              Susun pilar, angle, hook, CTA, dan agenda konten yang siap dieksekusi.
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
              maxLength={CONTENT_STRATEGY_FIELD_LIMITS.focus}
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
              maxLength={CONTENT_STRATEGY_FIELD_LIMITS.targetAudience}
              placeholder="contoh: perempuan 20-30 tahun, tinggal di kota besar, suka produk lokal"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
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
              maxLength={CONTENT_STRATEGY_FIELD_LIMITS.objective}
              placeholder={roleConfig.objectivePlaceholder}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-400 mt-2">{formData.objective.length}/{CONTENT_STRATEGY_FIELD_LIMITS.objective} karakter</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <SelectField
              label="Platform"
              name="platform"
              value={formData.platform}
              options={CONTENT_STRATEGY_PLATFORMS}
              onChange={handleChange}
            />
            <SelectField
              label="Durasi Rencana"
              name="timeframe"
              value={formData.timeframe}
              options={CONTENT_STRATEGY_TIMEFRAMES}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Catatan Tambahan</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              maxLength={CONTENT_STRATEGY_FIELD_LIMITS.notes}
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
                  Membuat strategi...
                </>
              ) : rateLimitCountdown > 0 ? (
                <>
                  <FontAwesomeIcon icon={faRotateRight} className="mr-2" />
                  Tunggu {rateLimitCountdown}s
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                  Buat Strategi
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

      <ContentStrategyResult result={result} copied={copied} onCopy={handleCopy} />
    </div>
  );
};

export default ContentStrategyAgentComposer;
