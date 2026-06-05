import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBullseye,
  faCopy,
  faEnvelope,
  faLightbulb,
  faPaperPlane,
  faRotateRight,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import {
  EMAIL_CAMPAIGN_CHANNELS,
  EMAIL_CAMPAIGN_FIELD_LIMITS,
  EMAIL_CAMPAIGN_FUNNEL_STAGES,
  EMAIL_CAMPAIGN_SEQUENCE_COUNTS,
  EMAIL_CAMPAIGN_TONES,
  createEmptyEmailCampaignForm,
  normalizeEmailCampaignResult,
  sanitizeEmailCampaignPayload,
} from '../../../features/shared/emailCampaignAgent';
import { generateEmailCampaignPlan } from '../../../services/api';

const joinCampaignText = (result) => [
  result.title,
  result.summary,
  result.strategy?.positioning ? `Posisi: ${result.strategy.positioning}` : '',
  result.strategy?.message_angle ? `Angle: ${result.strategy.message_angle}` : '',
  result.strategy?.send_timing ? `Timing: ${result.strategy.send_timing}` : '',
  ...(result.subject_lines?.length ? [`Subjek Pesan\n- ${result.subject_lines.join('\n- ')}`] : []),
  ...(result.sequence || []).map((item) => [
    `Pesan ${item.step}: ${item.purpose || item.subject}`,
    item.subject ? `Subjek: ${item.subject}` : '',
    item.preview_text ? `Preview: ${item.preview_text}` : '',
    item.body,
    item.cta ? `CTA: ${item.cta}` : '',
    item.timing ? `Timing: ${item.timing}` : '',
  ].filter(Boolean).join('\n')),
  ...(result.objection_responses?.length ? [
    `Jawaban Keberatan\n${result.objection_responses.map((item) => [
      item.objection ? `Keberatan: ${item.objection}` : '',
      item.response ? `Respons: ${item.response}` : '',
    ].filter(Boolean).join('\n')).join('\n\n')}`,
  ] : []),
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

const SequenceCard = ({ item }) => (
  <article className="rounded-lg border border-gray-200 p-4">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <p className="font-bold text-gray-900">Pesan {item.step}</p>
      {item.timing && <span className="text-xs font-semibold text-gray-600 bg-gray-100 rounded-full px-3 py-1">{item.timing}</span>}
    </div>
    {item.purpose && <p className="text-sm text-gray-500 mt-2">{item.purpose}</p>}
    {item.subject && <p className="text-sm font-semibold text-gray-800 mt-4">Subjek: {item.subject}</p>}
    {item.preview_text && <p className="text-sm text-gray-500 mt-2">Preview: {item.preview_text}</p>}
    {item.body && <p className="text-sm text-gray-600 mt-4 leading-relaxed whitespace-pre-wrap">{item.body}</p>}
    {item.cta && <p className="text-sm text-gray-800 mt-4"><span className="font-semibold">CTA:</span> {item.cta}</p>}
  </article>
);

const EmailCampaignResult = ({ result, copied, onCopy }) => {
  if (!result) return null;

  const strategyItems = [
    ['Funnel', result.strategy?.funnel_stage],
    ['Positioning', result.strategy?.positioning],
    ['Angle', result.strategy?.message_angle],
    ['Timing', result.strategy?.send_timing],
  ].filter(([, value]) => value);

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faEnvelope} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase">Hasil Rangkaian Pesan</p>
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

      {strategyItems.length > 0 && (
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <FontAwesomeIcon icon={faBullseye} className="text-gray-700" />
            <h3 className="text-lg font-bold text-gray-900">Strategi Rangkaian Pesan</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {strategyItems.map(([label, value]) => (
              <div key={label} className="rounded-lg bg-gray-50 border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase">{label}</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {result.subject_lines.length > 0 && (
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <FontAwesomeIcon icon={faLightbulb} className="text-gray-700" />
            <h3 className="text-lg font-bold text-gray-900">Subjek dan Pembuka</h3>
          </div>
          <ul className="space-y-2">
            {result.subject_lines.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-gray-600">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gray-900 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.sequence.length > 0 && (
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-5">Draf Rangkaian Pesan</h3>
          <div className="grid gap-4">
            {result.sequence.map((item) => (
              <SequenceCard key={`${item.step}-${item.subject}`} item={item} />
            ))}
          </div>
        </section>
      )}

      {(result.objection_responses.length > 0 || result.ctas.length > 0 || result.testing_notes.length > 0) && (
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Tindak Lanjut</h3>
          <div className="grid lg:grid-cols-3 gap-4">
            {result.objection_responses.length > 0 && (
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
                <p className="text-sm font-bold text-gray-900">Jawaban Keberatan</p>
                <div className="space-y-3 mt-3">
                  {result.objection_responses.map((item, index) => (
                    <div key={`${item.objection}-${index}`} className="text-sm text-gray-600">
                      {item.objection && <p className="font-semibold text-gray-800">{item.objection}</p>}
                      {item.response && <p className="mt-1">{item.response}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {[
              ['CTA Alternatif', result.ctas],
              ['Catatan Testing', result.testing_notes],
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

const EmailCampaignAgentComposer = () => {
  const [formData, setFormData] = useState(createEmptyEmailCampaignForm);
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
      [name]: name === 'email_count' ? Number(value) : value,
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
      const payload = sanitizeEmailCampaignPayload(formData);
      const { data, error: apiError } = await generateEmailCampaignPlan(payload);
      if (apiError) throw apiError;

      setResult(normalizeEmailCampaignResult(data?.result));
    } catch (submitError) {
      if (submitError.retryAfter) {
        setRateLimitCountdown(Number(submitError.retryAfter));
      }

      setError(submitError.message || 'Gagal membuat rangkaian email dan WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(joinCampaignText(result));
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
            <FontAwesomeIcon icon={faEnvelope} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase">Asisten Email dan WhatsApp</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">Rangkaian Pesan untuk UMKM</h2>
            <p className="text-sm text-gray-600 mt-2">
              Susun subjek, isi email atau WhatsApp, CTA, dan tindak lanjut berdasarkan tahap funnel promosi.
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
              maxLength={EMAIL_CAMPAIGN_FIELD_LIMITS.offer}
              placeholder="contoh: paket bundling kopi susu botolan untuk pelanggan baru"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Segmen Audiens *</label>
            <input
              type="text"
              name="audience"
              value={formData.audience}
              onChange={handleChange}
              required
              maxLength={EMAIL_CAMPAIGN_FIELD_LIMITS.audience}
              placeholder="contoh: pelanggan baru area Jakarta yang pernah tanya harga via WhatsApp"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <SelectField
              label="Tahap Funnel"
              name="funnel_stage"
              value={formData.funnel_stage}
              options={EMAIL_CAMPAIGN_FUNNEL_STAGES}
              onChange={handleChange}
            />
            <SelectField
              label="Channel"
              name="channel"
              value={formData.channel}
              options={EMAIL_CAMPAIGN_CHANNELS}
              onChange={handleChange}
            />
            <SelectField
              label="Gaya Bahasa"
              name="tone"
              value={formData.tone}
              options={EMAIL_CAMPAIGN_TONES}
              onChange={handleChange}
            />
            <SelectField
              label="Jumlah Pesan"
              name="email_count"
              value={formData.email_count}
              options={EMAIL_CAMPAIGN_SEQUENCE_COUNTS}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tujuan Promosi *</label>
            <textarea
              name="goal"
              value={formData.goal}
              onChange={handleChange}
              required
              rows={3}
              maxLength={EMAIL_CAMPAIGN_FIELD_LIMITS.goal}
              placeholder="contoh: mendorong pelanggan melakukan order pertama melalui WhatsApp"
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
              maxLength={EMAIL_CAMPAIGN_FIELD_LIMITS.context}
              placeholder="contoh: brand lokal, ramah, ingin terlihat premium tapi tetap dekat"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Keberatan Pelanggan</label>
            <textarea
              name="objections"
              value={formData.objections}
              onChange={handleChange}
              rows={3}
              maxLength={EMAIL_CAMPAIGN_FIELD_LIMITS.objections}
              placeholder="contoh: takut ongkir mahal, belum yakin rasa cocok, merasa harga lebih tinggi"
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
              maxLength={EMAIL_CAMPAIGN_FIELD_LIMITS.notes}
              placeholder="contoh: jangan sebut diskon, gunakan CTA chat admin, maksimal 120 kata per pesan"
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
                  Membuat rangkaian...
                </>
              ) : rateLimitCountdown > 0 ? (
                <>
                  <FontAwesomeIcon icon={faRotateRight} className="mr-2" />
                  Tunggu {rateLimitCountdown}s
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                  Buat Rangkaian
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

      <EmailCampaignResult result={result} copied={copied} onCopy={handleCopy} />
    </div>
  );
};

export default EmailCampaignAgentComposer;
