import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBolt,
  faBullseye,
  faCopy,
  faComments,
  faLightbulb,
  faPaperPlane,
  faRotateRight,
  faSpinner,
  faTriangleExclamation,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import {
  ICP_AGENT_CHANNELS,
  ICP_AGENT_FIELD_LIMITS,
  createEmptyICPAgentForm,
  getICPAgentRoleConfig,
  normalizeICPAgentResult,
  sanitizeICPAgentPayload,
} from '../../../features/shared/icpAgent';
import { generateICPProfile } from '../../../services/api';

const joinICPText = (result) => [
  result.summary,
  `${result.primary_icp.title}\n${result.primary_icp.description}`,
  result.primary_icp.demographics ? `Demografi\n${result.primary_icp.demographics}` : '',
  result.primary_icp.psychographics ? `Psikografi\n${result.primary_icp.psychographics}` : '',
  ...(result.primary_icp.needs?.length ? [`Kebutuhan\n- ${result.primary_icp.needs.join('\n- ')}`] : []),
  ...(result.primary_icp.buying_triggers?.length ? [`Trigger\n- ${result.primary_icp.buying_triggers.join('\n- ')}`] : []),
  ...(result.primary_icp.best_channels?.length ? [`Channel\n- ${result.primary_icp.best_channels.join('\n- ')}`] : []),
  ...(result.segments || []).map((item) => `Segmen: ${item.title}\n${item.description}`),
  ...(result.objections || []).map((item) => `Keberatan: ${item.title}\n${item.description}${item.action ? `\nRespons: ${item.action}` : ''}`),
  ...(result.messaging_angles || []).map((item) => `Pesan: ${item.title}\n${item.description}`),
  ...(result.validation_actions || []).map((item) => `Validasi: ${item.title}\n${item.description}`),
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

const ICPSection = ({ title, icon, items }) => {
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
            {item.signal && <p className="text-sm text-gray-700 mt-3"><span className="font-semibold">Sinyal:</span> {item.signal}</p>}
            {item.action && <p className="text-sm text-gray-700 mt-2"><span className="font-semibold">Aksi:</span> {item.action}</p>}
          </article>
        ))}
      </div>
    </section>
  );
};

const ICPResult = ({ result, copied, onCopy }) => {
  if (!result) return null;

  const primary = result.primary_icp;

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faBullseye} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase">Hasil ICP</p>
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

      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-gray-900 text-white flex items-center justify-center">
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{primary.title}</h3>
        </div>
        {primary.description && <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{primary.description}</p>}
        <div className="grid md:grid-cols-2 gap-4 mt-5">
          {[
            ['Demografi', primary.demographics],
            ['Psikografi', primary.psychographics],
          ].filter(([, value]) => value).map(([label, value]) => (
            <div key={label} className="rounded-lg bg-gray-50 border border-gray-100 p-4">
              <p className="text-sm font-bold text-gray-900">{label}</p>
              <p className="text-sm text-gray-600 mt-2">{value}</p>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          {[
            ['Kebutuhan', primary.needs],
            ['Trigger', primary.buying_triggers],
            ['Channel', primary.best_channels],
          ].filter(([, items]) => items.length > 0).map(([label, items]) => (
            <div key={label} className="rounded-lg bg-gray-50 border border-gray-100 p-4">
              <p className="text-sm font-bold text-gray-900">{label}</p>
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

      <ICPSection title="Segmen Bernilai" icon={faUsers} items={result.segments} />
      <ICPSection title="Keberatan dan Hambatan" icon={faTriangleExclamation} items={result.objections} />
      <ICPSection title="Angle Pesan" icon={faComments} items={result.messaging_angles} />
      <ICPSection title="Aksi Validasi" icon={faBolt} items={result.validation_actions} />

      {result.cautions.length > 0 && (
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <FontAwesomeIcon icon={faLightbulb} className="text-gray-700" />
            <h3 className="text-lg font-bold text-gray-900">Catatan Validasi</h3>
          </div>
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

const ICPAgentComposer = ({ role = 'sme' }) => {
  const roleConfig = getICPAgentRoleConfig(role);
  const [formData, setFormData] = useState(() => createEmptyICPAgentForm(role));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  useEffect(() => {
    setFormData(createEmptyICPAgentForm(role));
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
      const payload = sanitizeICPAgentPayload(formData, role);
      const { data, error: apiError } = await generateICPProfile(payload);
      if (apiError) throw apiError;

      setResult(normalizeICPAgentResult(data?.result));
    } catch (submitError) {
      if (submitError.retryAfter) {
        setRateLimitCountdown(Number(submitError.retryAfter));
      }

      setError(submitError.message || 'Gagal membuat ICP.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(joinICPText(result));
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
            <FontAwesomeIcon icon={faBullseye} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase">Asisten Profil Ideal</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">Profil Ideal untuk {roleConfig.label}</h2>
            <p className="text-sm text-gray-600 mt-2">
              Bangun profil pelanggan atau audiens ideal dari data awal, keberatan, dan tujuan promosi.
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
              maxLength={ICP_AGENT_FIELD_LIMITS.focus}
              placeholder={roleConfig.focusPlaceholder}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{roleConfig.evidenceLabel} *</label>
            <textarea
              name="evidence"
              value={formData.evidence}
              onChange={handleChange}
              required
              rows={5}
              maxLength={ICP_AGENT_FIELD_LIMITS.evidence}
              placeholder={roleConfig.evidencePlaceholder}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-400 mt-2">{formData.evidence.length}/{ICP_AGENT_FIELD_LIMITS.evidence} karakter</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <SelectField
              label="Channel Utama"
              name="channel"
              value={formData.channel}
              options={ICP_AGENT_CHANNELS}
              onChange={handleChange}
            />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Lokasi</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                maxLength={ICP_AGENT_FIELD_LIMITS.location}
                placeholder="contoh: Jakarta, Bandung, Indonesia"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{roleConfig.objectiveLabel} *</label>
            <textarea
              name="objective"
              value={formData.objective}
              onChange={handleChange}
              required
              rows={4}
              maxLength={ICP_AGENT_FIELD_LIMITS.objective}
              placeholder={roleConfig.objectivePlaceholder}
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
              maxLength={ICP_AGENT_FIELD_LIMITS.notes}
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
                  Membuat profil...
                </>
              ) : rateLimitCountdown > 0 ? (
                <>
                  <FontAwesomeIcon icon={faRotateRight} className="mr-2" />
                  Tunggu {rateLimitCountdown}s
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                  Buat Profil
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

      <ICPResult result={result} copied={copied} onCopy={handleCopy} />
    </div>
  );
};

export default ICPAgentComposer;
