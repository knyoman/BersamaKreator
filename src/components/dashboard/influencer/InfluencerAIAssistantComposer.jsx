import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCopy,
  faLightbulb,
  faMagicWandSparkles,
  faPaperPlane,
  faRotateRight,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import {
  AI_ASSISTANT_FIELD_LIMITS,
  AI_ASSISTANT_MODES,
  AI_ASSISTANT_PLATFORMS,
  AI_ASSISTANT_TONES,
  createEmptyAIAssistantForm,
  getAIAssistantModeLabel,
  normalizeAIAssistantResult,
  sanitizeAIAssistantPayload,
} from '../../../features/influencer/aiAssistant';
import { generateInfluencerAIContent } from '../../../services/api';

const joinResultText = (result) => [
  result.content,
  ...(result.variants || []).map((variant) => `${variant.label}\n${variant.text}`),
  ...(result.tips?.length ? [`Tips\n- ${result.tips.join('\n- ')}`] : []),
].filter(Boolean).join('\n\n');

const SelectField = ({ label, name, value, options, onChange }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  </div>
);

const AIAssistantResult = ({ result, copied, onCopy }) => {
  if (!result) return null;

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon icon={faMagicWandSparkles} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase">Hasil AI</p>
            <h2 className="text-xl font-bold text-gray-900 mt-1">{result.title}</h2>
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

      {result.content && (
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{result.content}</p>
        </div>
      )}

      {result.variants.length > 0 && (
        <div className="grid gap-4 mt-5">
          {result.variants.map((variant) => (
            <article key={`${variant.label}-${variant.text}`} className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-bold text-gray-900 mb-2">{variant.label}</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{variant.text}</p>
            </article>
          ))}
        </div>
      )}

      {result.tips.length > 0 && (
        <div className="mt-5 rounded-xl bg-blue-50 border border-blue-100 p-4">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-sm mb-2">
            <FontAwesomeIcon icon={faLightbulb} />
            Tips Eksekusi
          </div>
          <ul className="space-y-2">
            {result.tips.map((tip) => (
              <li key={tip} className="flex gap-2 text-sm text-blue-800">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-700 flex-shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

const InfluencerAIAssistantComposer = ({
  initialForm = null,
  campaignContext = null,
  compact = false,
  allowedModes = null,
}) => {
  const [formData, setFormData] = useState(() => initialForm || createEmptyAIAssistantForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  const modeOptions = useMemo(() => {
    if (!Array.isArray(allowedModes) || allowedModes.length === 0) {
      return AI_ASSISTANT_MODES;
    }

    return AI_ASSISTANT_MODES.filter((mode) => allowedModes.includes(mode.value));
  }, [allowedModes]);

  const activeModeDescription = useMemo(
    () => modeOptions.find((mode) => mode.value === formData.mode)?.description,
    [formData.mode, modeOptions],
  );

  useEffect(() => {
    if (modeOptions.length === 0) return;
    if (modeOptions.some((mode) => mode.value === formData.mode)) return;

    setFormData((current) => ({
      ...current,
      mode: modeOptions[0].value,
    }));
  }, [formData.mode, modeOptions]);

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
      const payload = sanitizeAIAssistantPayload(formData, campaignContext);
      const { data, error: apiError } = await generateInfluencerAIContent(payload);
      if (apiError) throw apiError;

      setResult(normalizeAIAssistantResult(data?.result));
    } catch (err) {
      if (err.retryAfter) {
        setRateLimitCountdown(Number(err.retryAfter));
      }

      setError(err.message || 'Gagal membuat draf Asisten AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(joinResultText(result));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (copyError) {
      setError('Gagal menyalin otomatis. Silakan salin teks secara manual.');
    }
  };

  return (
    <div className={compact ? 'space-y-5' : 'grid xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)] gap-6 items-start'}>
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-11 h-11 rounded-lg bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon icon={faMagicWandSparkles} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase">Asisten AI</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">{getAIAssistantModeLabel(formData.mode)}</h2>
            <p className="text-sm text-gray-600 mt-2">{activeModeDescription}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-5">
            <SelectField
              label="Mode"
              name="mode"
              value={formData.mode}
              options={modeOptions}
              onChange={handleChange}
            />
            <SelectField
              label="Platform"
              name="platform"
              value={formData.platform}
              options={AI_ASSISTANT_PLATFORMS}
              onChange={handleChange}
            />
            <SelectField
              label="Nada"
              name="tone"
              value={formData.tone}
              options={AI_ASSISTANT_TONES}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ringkasan *</label>
            <textarea
              name="brief"
              value={formData.brief}
              onChange={handleChange}
              rows={compact ? 7 : 9}
              maxLength={AI_ASSISTANT_FIELD_LIMITS.brief}
              required
              placeholder="Masukkan ringkasan UMKM, tujuan promosi, produk, dan pesan utama yang harus muncul."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-400 mt-2">{formData.brief.length}/{AI_ASSISTANT_FIELD_LIMITS.brief} karakter</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Target Audiens</label>
              <input
                type="text"
                name="target_audience"
                value={formData.target_audience}
                onChange={handleChange}
                maxLength={AI_ASSISTANT_FIELD_LIMITS.targetAudience}
                placeholder="contoh: Perempuan 20-30 tahun, suka skincare lokal"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Catatan Tambahan</label>
              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                maxLength={AI_ASSISTANT_FIELD_LIMITS.notes}
                placeholder="contoh: Hindari klaim berlebihan, CTA halus"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
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
                  Membuat draf...
                </>
              ) : rateLimitCountdown > 0 ? (
                <>
                  <FontAwesomeIcon icon={faRotateRight} className="mr-2" />
                  Tunggu {rateLimitCountdown}s
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                  Buat Draf
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

      <AIAssistantResult result={result} copied={copied} onCopy={handleCopy} />
    </div>
  );
};

export default InfluencerAIAssistantComposer;
