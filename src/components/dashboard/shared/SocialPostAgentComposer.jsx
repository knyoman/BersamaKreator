import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCopy,
  faLightbulb,
  faPaperPlane,
  faPenNib,
  faRotateRight,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import {
  SOCIAL_POST_FIELD_LIMITS,
  SOCIAL_POST_PLATFORMS,
  SOCIAL_POST_TONES,
  createEmptySocialPostForm,
  getSocialPostRoleConfig,
  normalizeSocialPostResult,
  sanitizeSocialPostPayload,
} from '../../../features/shared/socialPostAgent';
import { generateSocialPostDraft } from '../../../services/api';

const joinPostText = (result) => [
  result.summary,
  ...(result.hooks?.length ? [`Hook\n- ${result.hooks.join('\n- ')}`] : []),
  ...(result.posts || []).map((item) => [
    item.title,
    item.platform ? `Platform: ${item.platform}` : '',
    item.hook ? `Hook: ${item.hook}` : '',
    item.body,
    item.cta ? `CTA: ${item.cta}` : '',
    item.note ? `Catatan: ${item.note}` : '',
  ].filter(Boolean).join('\n')),
  ...(result.variants || []).map((item) => [
    `Variasi: ${item.title}`,
    item.hook ? `Hook: ${item.hook}` : '',
    item.body,
    item.cta ? `CTA: ${item.cta}` : '',
  ].filter(Boolean).join('\n')),
  ...(result.ctas?.length ? [`CTA\n- ${result.ctas.join('\n- ')}`] : []),
  ...(result.editing_notes?.length ? [`Catatan Editing\n- ${result.editing_notes.join('\n- ')}`] : []),
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

const PostCard = ({ item, label }) => (
  <article className="rounded-lg border border-gray-200 p-4">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <p className="font-bold text-gray-900">{item.title || label}</p>
      {item.platform && <span className="text-xs font-semibold text-gray-600 bg-gray-100 rounded-full px-3 py-1">{item.platform}</span>}
    </div>
    {item.hook && <p className="text-sm font-semibold text-gray-800 mt-3">Hook: {item.hook}</p>}
    {item.body && <p className="text-sm text-gray-600 mt-3 leading-relaxed whitespace-pre-wrap">{item.body}</p>}
    {item.cta && <p className="text-sm text-gray-800 mt-3"><span className="font-semibold">CTA:</span> {item.cta}</p>}
    {item.note && <p className="text-sm text-gray-500 mt-3">{item.note}</p>}
  </article>
);

const SocialPostResult = ({ result, copied, onCopy }) => {
  if (!result) return null;

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faPenNib} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase">Hasil Konten Sosial</p>
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

      {result.hooks.length > 0 && (
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <FontAwesomeIcon icon={faLightbulb} className="text-gray-700" />
            <h3 className="text-lg font-bold text-gray-900">Pilihan Hook Konten</h3>
          </div>
          <ul className="space-y-2">
            {result.hooks.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-gray-600">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gray-900 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.posts.length > 0 && (
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-5">Draft Utama</h3>
          <div className="grid gap-4">
            {result.posts.map((item, index) => (
              <PostCard key={`${item.title}-${index}`} item={item} label={`Draf ${index + 1}`} />
            ))}
          </div>
        </section>
      )}

      {result.variants.length > 0 && (
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-5">Variasi</h3>
          <div className="grid gap-4">
            {result.variants.map((item, index) => (
              <PostCard key={`${item.title}-${index}`} item={item} label={`Variasi ${index + 1}`} />
            ))}
          </div>
        </section>
      )}

      {(result.ctas.length > 0 || result.editing_notes.length > 0) && (
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Eksekusi</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              ['CTA', result.ctas],
              ['Catatan Editing', result.editing_notes],
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

const SocialPostAgentComposer = ({ role = 'influencer' }) => {
  const roleConfig = getSocialPostRoleConfig(role);
  const [formData, setFormData] = useState(() => createEmptySocialPostForm(role));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  useEffect(() => {
    setFormData(createEmptySocialPostForm(role));
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
      const payload = sanitizeSocialPostPayload(formData, role);
      const { data, error: apiError } = await generateSocialPostDraft(payload);
      if (apiError) throw apiError;

      setResult(normalizeSocialPostResult(data?.result));
    } catch (submitError) {
      if (submitError.retryAfter) {
        setRateLimitCountdown(Number(submitError.retryAfter));
      }

      setError(submitError.message || 'Gagal membuat draf konten sosial.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(joinPostText(result));
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
            <FontAwesomeIcon icon={faPenNib} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase">Asisten Draf Konten</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">Draf Konten Sosial untuk {roleConfig.label}</h2>
            <p className="text-sm text-gray-600 mt-2">
              Ubah satu ide menjadi hook, isi konten, CTA, dan variasi posting yang siap dipakai.
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">{roleConfig.ideaLabel} *</label>
            <textarea
              name="idea"
              value={formData.idea}
              onChange={handleChange}
              required
              rows={4}
              maxLength={SOCIAL_POST_FIELD_LIMITS.idea}
              placeholder={roleConfig.ideaPlaceholder}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
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
              maxLength={SOCIAL_POST_FIELD_LIMITS.targetAudience}
              placeholder="contoh: perempuan 20-30 tahun yang suka produk lokal"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <SelectField
              label="Platform"
              name="platform"
              value={formData.platform}
              options={SOCIAL_POST_PLATFORMS}
              onChange={handleChange}
            />
            <SelectField
              label="Tone"
              name="tone"
              value={formData.tone}
              options={SOCIAL_POST_TONES}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{roleConfig.contextLabel}</label>
            <textarea
              name="context"
              value={formData.context}
              onChange={handleChange}
              rows={4}
              maxLength={SOCIAL_POST_FIELD_LIMITS.context}
              placeholder={roleConfig.contextPlaceholder}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{roleConfig.objectiveLabel} *</label>
            <textarea
              name="objective"
              value={formData.objective}
              onChange={handleChange}
              required
              rows={3}
              maxLength={SOCIAL_POST_FIELD_LIMITS.objective}
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
              maxLength={SOCIAL_POST_FIELD_LIMITS.notes}
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

      <SocialPostResult result={result} copied={copied} onCopy={handleCopy} />
    </div>
  );
};

export default SocialPostAgentComposer;
