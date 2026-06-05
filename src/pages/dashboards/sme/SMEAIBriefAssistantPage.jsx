import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faMagicWandSparkles } from '@fortawesome/free-solid-svg-icons';

const initialBriefForm = {
  campaignName: '',
  productName: '',
  objective: '',
  targetAudience: '',
  keyMessage: '',
  platform: 'Instagram Reels',
  budget: '',
  deadline: '',
};

const buildBriefDraft = (formData) => {
  const lines = [
    `Nama promosi: ${formData.campaignName || '-'}`,
    `Produk/brand: ${formData.productName || '-'}`,
    `Tujuan promosi: ${formData.objective || '-'}`,
    `Target audiens: ${formData.targetAudience || '-'}`,
    `Platform utama: ${formData.platform || '-'}`,
    `Perkiraan anggaran: ${formData.budget ? `Rp ${Number(formData.budget).toLocaleString('id-ID')}` : '-'}`,
    `Deadline konten: ${formData.deadline || '-'}`,
    '',
    'Pesan utama:',
    formData.keyMessage || '-',
    '',
    'Arahan konten:',
    '- Gunakan gaya komunikasi natural dan relevan dengan audiens.',
    '- Tampilkan manfaat produk tanpa klaim berlebihan.',
    '- Sertakan call-to-action yang halus dan mudah diikuti.',
    '- Minta influencer menjaga tone sesuai karakter brand.',
    '',
    'Output yang diharapkan:',
    `- 1 draft konten untuk ${formData.platform || 'platform pilihan'}.`,
    '- Caption siap publikasi.',
    '- Revisi sesuai paket yang dipilih.',
  ];

  return lines.join('\n');
};

const SMEAIBriefAssistantPage = ({ embedded = false }) => {
  const [formData, setFormData] = useState(initialBriefForm);
  const [copied, setCopied] = useState(false);

  const briefDraft = useMemo(() => buildBriefDraft(formData), [formData]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
    setCopied(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(briefDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {!embedded && (
        <header>
          <p className="text-sm font-semibold text-gray-500 uppercase">Asisten AI Ringkasan</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-1">Susun Ringkasan Promosi</h1>
          <p className="text-gray-600 mt-2">Buat draf ringkasan yang rapi sebelum memilih influencer atau paket promosi.</p>
        </header>
      )}

      <div className="grid xl:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-lg bg-gray-900 text-white flex items-center justify-center">
              <FontAwesomeIcon icon={faMagicWandSparkles} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Formulir Ringkasan</h2>
              <p className="text-sm text-gray-500 mt-1">Isi informasi utama promosi.</p>
            </div>
          </div>

          <form className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Promosi</label>
              <input
                type="text"
                name="campaignName"
                value={formData.campaignName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="contoh: Launching Menu Kopi Susu"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Produk/Brand</label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="contoh: Kopi Senja"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tujuan Promosi</label>
              <textarea
                name="objective"
                value={formData.objective}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                placeholder="contoh: Meningkatkan awareness dan kunjungan outlet di Jakarta Selatan."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Target Audiens</label>
              <input
                type="text"
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="contoh: Mahasiswa dan pekerja muda usia 18-30 tahun"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Pesan Utama</label>
              <textarea
                name="keyMessage"
                value={formData.keyMessage}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                placeholder="contoh: Kopi susu dengan rasa ringan, harga terjangkau, cocok untuk teman kerja sore."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Platform</label>
              <select
                name="platform"
                value={formData.platform}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option>Instagram Story</option>
                <option>Instagram Feed</option>
                <option>Instagram Reels</option>
                <option>TikTok Video</option>
                <option>YouTube Shorts</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Perkiraan Anggaran</label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                min="0"
                step="1000"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="contoh: 1000000"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Deadline Konten</label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </form>
        </section>

        <aside className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase">Draf Ringkasan</p>
              <h2 className="text-xl font-bold text-gray-900 mt-1">Siap Disalin</h2>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <FontAwesomeIcon icon={faCopy} className="mr-2" />
              {copied ? 'Tersalin' : 'Salin'}
            </button>
          </div>
          <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 border border-gray-100 p-4 text-sm text-gray-700 leading-relaxed font-sans">
            {briefDraft}
          </pre>
        </aside>
      </div>
    </div>
  );
};

export default SMEAIBriefAssistantPage;
