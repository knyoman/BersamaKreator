import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBullseye,
  faCalendarDays,
  faChartLine,
  faCopy,
  faPaperPlane,
  faRotateRight,
  faSpinner,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import {
  MARKETING_OPS_CADENCES,
  MARKETING_OPS_CHANNELS,
  MARKETING_OPS_FIELD_LIMITS,
  MARKETING_OPS_WORKFLOWS,
  createEmptyMarketingOpsForm,
  normalizeMarketingOpsResult,
  sanitizeMarketingOpsPayload,
} from '../../../features/shared/marketingOpsAgent';
import { generateMarketingOpsPlan } from '../../../services/api';

const joinOpsText = (result) => [
  result.title,
  result.summary,
  result.operating_plan?.success_definition ? `Definisi sukses: ${result.operating_plan.success_definition}` : '',
  ...(result.calendar || []).map((item) => [
    `${item.date || '-'} - ${item.phase}`,
    item.focus,
    ...(item.tasks?.length ? [`Tugas:\n- ${item.tasks.join('\n- ')}`] : []),
    item.owner ? `PIC: ${item.owner}` : '',
    item.channel ? `Channel: ${item.channel}` : '',
    item.dependency ? `Kebutuhan terkait: ${item.dependency}` : '',
  ].filter(Boolean).join('\n')),
  ...(result.publish_checklist?.length ? [
    `Checklist Publikasi\n${result.publish_checklist.map((item) => [
      item.task,
      item.owner ? `PIC: ${item.owner}` : '',
      item.due_date ? `Deadline: ${item.due_date}` : '',
      item.priority ? `Priority: ${item.priority}` : '',
      item.status ? `Status: ${item.status}` : '',
    ].filter(Boolean).join(' | ')).join('\n')}`,
  ] : []),
  ...(result.asset_tracker?.length ? [
    `Pelacak Aset\n${result.asset_tracker.map((item) => [
      item.asset,
      item.purpose,
      item.format ? `Format: ${item.format}` : '',
      item.owner ? `PIC: ${item.owner}` : '',
      item.due_date ? `Deadline: ${item.due_date}` : '',
    ].filter(Boolean).join(' | ')).join('\n')}`,
  ] : []),
  ...(result.metrics_tracker?.length ? [
    `Pelacak Metrik\n${result.metrics_tracker.map((item) => [
      item.metric,
      item.target ? `Target: ${item.target}` : '',
      item.tracking_method ? `Cara pantau: ${item.tracking_method}` : '',
      item.review_frequency ? `Review: ${item.review_frequency}` : '',
    ].filter(Boolean).join(' | ')).join('\n')}`,
  ] : []),
  ...(result.report_outline?.length ? [
    `Kerangka Laporan\n${result.report_outline.map((item) => [
      item.section,
      item.insight ? `Insight: ${item.insight}` : '',
      item.action ? `Action: ${item.action}` : '',
    ].filter(Boolean).join(' | ')).join('\n')}`,
  ] : []),
  ...(result.risks?.length ? [
    `Risiko\n${result.risks.map((item) => [
      item.risk,
      item.mitigation ? `Mitigasi: ${item.mitigation}` : '',
    ].filter(Boolean).join(' | ')).join('\n')}`,
  ] : []),
  ...(result.next_steps?.length ? [`Langkah Berikutnya\n- ${result.next_steps.join('\n- ')}`] : []),
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

const ListBlock = ({ title, items, icon }) => {
  if (!items?.length) return null;

  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <FontAwesomeIcon icon={icon} className="text-gray-700" />
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>
      <div className="grid gap-3">
        {items}
      </div>
    </section>
  );
};

const MarketingOpsResult = ({ result, copied, onCopy }) => {
  if (!result) return null;

  const planItems = [
    ['Alur Kerja', result.operating_plan?.workflow],
    ['Ritme Kerja', result.operating_plan?.cadence],
    ['Channel', result.operating_plan?.primary_channel],
    ['Periode', result.operating_plan?.launch_window],
  ].filter(([, value]) => value);

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faCalendarDays} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase">Hasil Operasional Marketing</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">{result.title}</h2>
              {result.summary && <p className="text-gray-600 mt-2 leading-relaxed whitespace-pre-wrap">{result.summary}</p>}
              {result.operating_plan?.success_definition && (
                <p className="text-sm text-gray-700 mt-3">
                  <span className="font-semibold">Definisi sukses:</span> {result.operating_plan.success_definition}
                </p>
              )}
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

      {planItems.length > 0 && (
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="grid sm:grid-cols-2 gap-3">
            {planItems.map(([label, value]) => (
              <div key={label} className="rounded-lg bg-gray-50 border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase">{label}</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <ListBlock
        title="Kalender Eksekusi"
        icon={faCalendarDays}
        items={result.calendar.map((item, index) => (
          <article key={`${item.date}-${index}`} className="rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="font-bold text-gray-900">{item.date || item.phase}</p>
              {item.channel && <span className="text-xs font-semibold text-gray-600 bg-gray-100 rounded-full px-3 py-1">{item.channel}</span>}
            </div>
            <p className="text-sm font-semibold text-gray-800 mt-3">{item.phase}</p>
            {item.focus && <p className="text-sm text-gray-600 mt-2">{item.focus}</p>}
            {item.tasks.length > 0 && (
              <ul className="space-y-2 mt-3">
                {item.tasks.map((task) => (
                  <li key={task} className="flex gap-2 text-sm text-gray-600">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gray-900 flex-shrink-0" />
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            )}
            {(item.owner || item.dependency) && (
              <p className="text-xs text-gray-500 mt-3">
                {[item.owner && `PIC: ${item.owner}`, item.dependency && `Dependency: ${item.dependency}`].filter(Boolean).join(' | ')}
              </p>
            )}
          </article>
        ))}
      />

      <ListBlock
        title="Checklist Publikasi"
        icon={faPaperPlane}
        items={result.publish_checklist.map((item, index) => (
          <div key={`${item.task}-${index}`} className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-bold text-gray-900">{item.task}</p>
            <p className="text-xs text-gray-500 mt-2">
              {[item.owner && `PIC: ${item.owner}`, item.due_date && `Deadline: ${item.due_date}`, item.priority && `Prioritas: ${item.priority}`, item.status && `Status: ${item.status}`].filter(Boolean).join(' | ')}
            </p>
          </div>
        ))}
      />

      {(result.asset_tracker.length > 0 || result.metrics_tracker.length > 0) && (
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Pelacak</h3>
          <div className="grid lg:grid-cols-2 gap-4">
            {result.asset_tracker.length > 0 && (
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
                <p className="text-sm font-bold text-gray-900">Pelacak Aset</p>
                <div className="space-y-3 mt-3">
                  {result.asset_tracker.map((item, index) => (
                    <div key={`${item.asset}-${index}`} className="text-sm text-gray-600">
                      <p className="font-semibold text-gray-900">{item.asset || item.purpose}</p>
                      {item.purpose && <p className="mt-1">{item.purpose}</p>}
                      <p className="text-xs text-gray-500 mt-1">
                        {[item.format, item.owner && `PIC: ${item.owner}`, item.due_date && `Due: ${item.due_date}`].filter(Boolean).join(' | ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.metrics_tracker.length > 0 && (
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
                <p className="text-sm font-bold text-gray-900">Pelacak Metrik</p>
                <div className="space-y-3 mt-3">
                  {result.metrics_tracker.map((item, index) => (
                    <div key={`${item.metric}-${index}`} className="text-sm text-gray-600">
                      <p className="font-semibold text-gray-900">{item.metric}</p>
                      {item.target && <p className="mt-1">Target: {item.target}</p>}
                      <p className="text-xs text-gray-500 mt-1">
                        {[item.tracking_method, item.review_frequency && `Review: ${item.review_frequency}`].filter(Boolean).join(' | ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {(result.report_outline.length > 0 || result.risks.length > 0 || result.next_steps.length > 0) && (
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Laporan dan Kontrol Risiko</h3>
          <div className="grid lg:grid-cols-3 gap-4">
            {[
              ['Kerangka Laporan', result.report_outline.map((item) => [item.section, item.insight, item.action].filter(Boolean).join(' - ')), faChartLine],
              ['Risiko', result.risks.map((item) => [item.risk, item.mitigation && `Mitigasi: ${item.mitigation}`].filter(Boolean).join(' - ')), faTriangleExclamation],
              ['Langkah Berikutnya', result.next_steps, faBullseye],
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

const MarketingOpsAgentComposer = () => {
  const [formData, setFormData] = useState(createEmptyMarketingOpsForm);
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
      const payload = sanitizeMarketingOpsPayload(formData);
      const { data, error: apiError } = await generateMarketingOpsPlan(payload);
      if (apiError) throw apiError;

      setResult(normalizeMarketingOpsResult(data?.result));
    } catch (submitError) {
      if (submitError.retryAfter) {
        setRateLimitCountdown(Number(submitError.retryAfter));
      }

      setError(submitError.message || 'Gagal membuat rencana operasional marketing.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(joinOpsText(result));
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
            <FontAwesomeIcon icon={faCalendarDays} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase">Asisten Operasional Marketing</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">Rencana Eksekusi Promosi UMKM</h2>
            <p className="text-sm text-gray-600 mt-2">
              Ubah promosi menjadi kalender kerja, checklist publikasi, pelacak aset, metrik, dan kerangka laporan.
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Promosi *</label>
            <input
              type="text"
              name="campaign_name"
              value={formData.campaign_name}
              onChange={handleChange}
              required
              maxLength={MARKETING_OPS_FIELD_LIMITS.campaignName}
              placeholder="contoh: Launch Bundling Kopi Susu Akhir Bulan"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <SelectField
              label="Alur Kerja"
              name="workflow"
              value={formData.workflow}
              options={MARKETING_OPS_WORKFLOWS}
              onChange={handleChange}
            />
            <SelectField
              label="Channel Utama"
              name="primary_channel"
              value={formData.primary_channel}
              options={MARKETING_OPS_CHANNELS}
              onChange={handleChange}
            />
            <SelectField
              label="Ritme Kerja"
              name="cadence"
              value={formData.cadence}
              options={MARKETING_OPS_CADENCES}
              onChange={handleChange}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mulai *</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Selesai *</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tujuan Promosi *</label>
            <textarea
              name="objective"
              value={formData.objective}
              onChange={handleChange}
              required
              rows={3}
              maxLength={MARKETING_OPS_FIELD_LIMITS.objective}
              placeholder="contoh: meningkatkan order WhatsApp dan mengukur conversion dari konten influencer"
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
              maxLength={MARKETING_OPS_FIELD_LIMITS.audience}
              placeholder="contoh: pelanggan baru 20-35 tahun area Jakarta dan Bekasi"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Asset yang Dibutuhkan</label>
            <textarea
              name="assets"
              value={formData.assets}
              onChange={handleChange}
              rows={4}
              maxLength={MARKETING_OPS_FIELD_LIMITS.assets}
              placeholder="contoh: foto produk, video Reels, caption, UTM link, brief influencer, landing page"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Target Metrik</label>
            <textarea
              name="metrics"
              value={formData.metrics}
              onChange={handleChange}
              rows={3}
              maxLength={MARKETING_OPS_FIELD_LIMITS.metrics}
              placeholder="contoh: reach, CTR, add-to-cart, chat WhatsApp, order selesai, cost per lead"
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
              maxLength={MARKETING_OPS_FIELD_LIMITS.notes}
              placeholder="contoh: promosi melibatkan 2 influencer dan perlu persetujuan owner sebelum publikasi"
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
                  Membuat rencana...
                </>
              ) : rateLimitCountdown > 0 ? (
                <>
                  <FontAwesomeIcon icon={faRotateRight} className="mr-2" />
                  Tunggu {rateLimitCountdown}s
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                  Buat Rencana
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

      <MarketingOpsResult result={result} copied={copied} onCopy={handleCopy} />
    </div>
  );
};

export default MarketingOpsAgentComposer;
