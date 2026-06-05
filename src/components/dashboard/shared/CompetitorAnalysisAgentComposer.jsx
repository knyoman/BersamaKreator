import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBolt,
  faChartLine,
  faCopy,
  faLayerGroup,
  faLightbulb,
  faMagicWandSparkles,
  faPaperPlane,
  faRotateRight,
  faSpinner,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import {
  COMPETITOR_ANALYSIS_CHANNELS,
  COMPETITOR_ANALYSIS_FIELD_LIMITS,
  createEmptyCompetitorAnalysisForm,
  getCompetitorAnalysisRoleConfig,
  normalizeCompetitorAnalysisResult,
  sanitizeCompetitorAnalysisPayload,
} from '../../../features/shared/competitorAnalysisAgent';
import { generateCompetitorAnalysis } from '../../../services/api';

const joinAnalysisText = (result) => [
  result.summary,
  ...(result.competitors || []).map((item) => [
    `Kompetitor: ${item.title}`,
    item.positioning ? `Posisi: ${item.positioning}` : '',
    item.offer ? `Penawaran: ${item.offer}` : '',
    item.messaging ? `Pesan: ${item.messaging}` : '',
    item.weakness ? `Kelemahan: ${item.weakness}` : '',
    item.description,
  ].filter(Boolean).join('\n')),
  ...(result.gaps || []).map((item) => `Gap: ${item.title}\n${item.description}${item.opportunity ? `\nPeluang: ${item.opportunity}` : ''}`),
  ...(result.differentiation || []).map((item) => `Diferensiasi: ${item.title}\n${item.description}${item.proof_point ? `\nProof point: ${item.proof_point}` : ''}`),
  ...(result.content_opportunities || []).map((item) => `Konten: ${item.title}\n${item.description}${item.format ? `\nFormat: ${item.format}` : ''}`),
  ...(result.recommended_actions || []).map((item) => `Aksi: ${item.title}\n${item.description}${item.action ? `\nMulai: ${item.action}` : ''}`),
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

const AnalysisSection = ({ title, icon, items, variant = 'default' }) => {
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="font-bold text-gray-900">{item.title}</p>
              {item.priority && <span className="text-xs font-semibold text-gray-600 bg-gray-100 rounded-full px-3 py-1">{item.priority}</span>}
            </div>

            {variant === 'competitor' && (
              <div className="grid md:grid-cols-2 gap-3 mt-3">
                {[
                  ['Posisi', item.positioning],
                  ['Penawaran', item.offer],
                  ['Pesan', item.messaging],
                  ['Kelemahan', item.weakness],
                ].filter(([, value]) => value).map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                    <p className="text-xs font-bold text-gray-500 uppercase">{label}</p>
                    <p className="text-sm text-gray-700 mt-1">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {item.description && <p className="text-sm text-gray-600 mt-3 leading-relaxed whitespace-pre-wrap">{item.description}</p>}
            {item.opportunity && <p className="text-sm text-gray-700 mt-3"><span className="font-semibold">Peluang:</span> {item.opportunity}</p>}
            {item.proof_point && <p className="text-sm text-gray-700 mt-3"><span className="font-semibold">Proof point:</span> {item.proof_point}</p>}
            {item.format && <p className="text-sm text-gray-700 mt-3"><span className="font-semibold">Format:</span> {item.format}</p>}
            {item.action && <p className="text-sm text-gray-700 mt-2"><span className="font-semibold">Aksi:</span> {item.action}</p>}
          </article>
        ))}
      </div>
    </section>
  );
};

const CompetitorAnalysisResult = ({ result, copied, onCopy }) => {
  if (!result) return null;

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faChartLine} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase">Hasil Analisis</p>
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

      <AnalysisSection title="Breakdown Kompetitor" icon={faLayerGroup} items={result.competitors} variant="competitor" />
      <AnalysisSection title="Gap dan Kelemahan" icon={faTriangleExclamation} items={result.gaps} />
      <AnalysisSection title="Peluang Diferensiasi" icon={faLightbulb} items={result.differentiation} />
      <AnalysisSection title="Peluang Konten" icon={faMagicWandSparkles} items={result.content_opportunities} />
      <AnalysisSection title="Aksi Prioritas" icon={faBolt} items={result.recommended_actions} />

      {result.cautions.length > 0 && (
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Catatan Validasi</h3>
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

const CompetitorAnalysisAgentComposer = ({ role = 'sme' }) => {
  const roleConfig = getCompetitorAnalysisRoleConfig(role);
  const [formData, setFormData] = useState(() => createEmptyCompetitorAnalysisForm(role));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  useEffect(() => {
    setFormData(createEmptyCompetitorAnalysisForm(role));
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
      const payload = sanitizeCompetitorAnalysisPayload(formData, role);
      const { data, error: apiError } = await generateCompetitorAnalysis(payload);
      if (apiError) throw apiError;

      setResult(normalizeCompetitorAnalysisResult(data?.result));
    } catch (submitError) {
      if (submitError.retryAfter) {
        setRateLimitCountdown(Number(submitError.retryAfter));
      }

      setError(submitError.message || 'Gagal membuat analisis kompetitor.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(joinAnalysisText(result));
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
            <FontAwesomeIcon icon={faChartLine} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase">Asisten Analisis Kompetitor</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">Analisis Kompetitor untuk {roleConfig.label}</h2>
            <p className="text-sm text-gray-600 mt-2">
              Bandingkan posisi, penawaran, pesan, dan gap agar strategi Anda punya pembeda yang jelas.
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">{roleConfig.subjectLabel} *</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              maxLength={COMPETITOR_ANALYSIS_FIELD_LIMITS.subject}
              placeholder={roleConfig.subjectPlaceholder}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{roleConfig.competitorLabel} *</label>
            <textarea
              name="competitors"
              value={formData.competitors}
              onChange={handleChange}
              required
              rows={4}
              maxLength={COMPETITOR_ANALYSIS_FIELD_LIMITS.competitors}
              placeholder={roleConfig.competitorPlaceholder}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <SelectField
              label="Channel Utama"
              name="channel"
              value={formData.channel}
              options={COMPETITOR_ANALYSIS_CHANNELS}
              onChange={handleChange}
            />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{roleConfig.objectiveLabel} *</label>
              <input
                type="text"
                name="objective"
                value={formData.objective}
                onChange={handleChange}
                required
                maxLength={COMPETITOR_ANALYSIS_FIELD_LIMITS.objective}
                placeholder={roleConfig.objectivePlaceholder}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{roleConfig.evidenceLabel}</label>
            <textarea
              name="evidence"
              value={formData.evidence}
              onChange={handleChange}
              rows={5}
              maxLength={COMPETITOR_ANALYSIS_FIELD_LIMITS.evidence}
              placeholder={roleConfig.evidencePlaceholder}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-400 mt-2">{formData.evidence.length}/{COMPETITOR_ANALYSIS_FIELD_LIMITS.evidence} karakter</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Catatan Tambahan</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              maxLength={COMPETITOR_ANALYSIS_FIELD_LIMITS.notes}
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
                  Menganalisis...
                </>
              ) : rateLimitCountdown > 0 ? (
                <>
                  <FontAwesomeIcon icon={faRotateRight} className="mr-2" />
                  Tunggu {rateLimitCountdown}s
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                  Buat Analisis
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

      <CompetitorAnalysisResult result={result} copied={copied} onCopy={handleCopy} />
    </div>
  );
};

export default CompetitorAnalysisAgentComposer;
