import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowUpRightFromSquare,
  faBriefcase,
  faEye,
  faEyeSlash,
  faImage,
  faPenToSquare,
  faPlus,
  faSave,
  faSpinner,
  faTimes,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import {
  createEmptyPortfolioForm,
  getPortfolioContentTypeLabel,
  PORTFOLIO_CONTENT_TYPES,
  sanitizePortfolioPayload,
  toPortfolioForm,
} from '../../../features/influencer/portfolio';
import {
  createInfluencerPortfolioItem,
  deleteInfluencerPortfolioItem,
  getInfluencerPortfolioItems,
  updateInfluencerPortfolioItem,
} from '../../../services/api';
import { logger } from '../../../utils/logger';

const getPortfolioErrorMessage = (error) => {
  if (!error?.message) return 'Gagal memuat portfolio.';

  if (error.message.includes('influencer_portfolio_items')) {
    return 'Tabel portfolio belum tersedia. Jalankan schema Supabase terbaru sebelum menggunakan fitur ini.';
  }

  return error.message;
};

const PortfolioItemCard = ({ item, onEdit, onDelete }) => (
  <article className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
    <div className="aspect-[16/9] bg-gray-100 flex items-center justify-center overflow-hidden">
      {item.thumbnail_url ? (
        <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
      ) : (
        <div className="text-center text-gray-400">
          <FontAwesomeIcon icon={faImage} className="text-3xl mb-2" />
          <p className="text-sm">Tanpa thumbnail</p>
        </div>
      )}
    </div>

    <div className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase">{getPortfolioContentTypeLabel(item.content_type)}</p>
          <h3 className="font-bold text-gray-900 mt-1 line-clamp-2">{item.title}</h3>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold flex-shrink-0 ${
          item.is_public ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          <FontAwesomeIcon icon={item.is_public ? faEye : faEyeSlash} />
          {item.is_public ? 'Publik' : 'Privat'}
        </span>
      </div>

      {item.brand_name && (
        <p className="text-sm text-gray-600 mt-2">Brand: <span className="font-semibold text-gray-900">{item.brand_name}</span></p>
      )}

      {item.description && (
        <p className="text-sm text-gray-600 mt-3 line-clamp-3">{item.description}</p>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-5 pt-4 border-t border-gray-100">
        {item.content_url ? (
          <a
            href={item.content_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm font-semibold text-gray-900 hover:underline"
          >
            Lihat Karya
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="ml-2 text-xs" />
          </a>
        ) : (
          <span className="text-sm text-gray-400">Belum ada link karya</span>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="w-9 h-9 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-900 hover:text-white transition-colors"
            title="Edit portfolio"
          >
            <FontAwesomeIcon icon={faPenToSquare} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="w-9 h-9 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-colors"
            title="Hapus portfolio"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      </div>
    </div>
  </article>
);

const PortfolioModal = ({
  formData,
  error,
  loading,
  isEditing,
  onChange,
  onClose,
  onSubmit,
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Portfolio' : 'Tambah Portfolio'}</h2>
          <p className="text-sm text-gray-500 mt-1">Tampilkan karya terbaik agar UMKM lebih percaya.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
          title="Tutup"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <form onSubmit={onSubmit} className="p-6 overflow-y-auto">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-sm mb-6">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Judul Karya *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={onChange}
              required
              maxLength={120}
              placeholder="contoh: Reels Launching Skincare Lokal"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tipe Konten</label>
            <select
              name="content_type"
              value={formData.content_type}
              onChange={onChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {PORTFOLIO_CONTENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Brand / Klien</label>
            <input
              type="text"
              name="brand_name"
              value={formData.brand_name}
              onChange={onChange}
              maxLength={80}
              placeholder="contoh: Kopi Nusantara"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Link Karya</label>
            <input
              type="url"
              name="content_url"
              value={formData.content_url}
              onChange={onChange}
              placeholder="https://instagram.com/p/..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Thumbnail</label>
            <input
              type="url"
              name="thumbnail_url"
              value={formData.thumbnail_url}
              onChange={onChange}
              placeholder="https://example.com/thumbnail.jpg"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal Publikasi</label>
            <input
              type="date"
              name="published_at"
              value={formData.published_at}
              onChange={onChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <label className="flex items-center gap-3 mt-8 text-sm font-semibold text-gray-700">
            <input
              type="checkbox"
              name="is_public"
              checked={formData.is_public}
              onChange={onChange}
              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            Tampilkan di profil publik
          </label>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Deskripsi</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={onChange}
              rows={4}
              maxLength={1000}
              placeholder="Ceritakan tujuan promosi, gaya konten, atau hasil yang dicapai."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      </form>

      <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4 rounded-b-2xl">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-white"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
              Menyimpan...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faSave} className="mr-2" />
              Simpan
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);

const InfluencerPortfolioManager = ({ influencerId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(createEmptyPortfolioForm);

  const publicItemsCount = useMemo(
    () => items.filter((item) => item.is_public).length,
    [items],
  );

  const loadPortfolio = async () => {
    if (!influencerId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await getInfluencerPortfolioItems(influencerId, { includePrivate: true });
      if (fetchError) throw fetchError;
      setItems(data || []);
    } catch (err) {
      logger.error('[InfluencerPortfolioManager] Load error:', err.message);
      setError(getPortfolioErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, [influencerId]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData(createEmptyPortfolioForm());
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData(toPortfolioForm(item));
    setModalError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingItem(null);
    setModalError(null);
    setIsModalOpen(false);
    setFormData(createEmptyPortfolioForm());
  };

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    setSaving(true);
    setModalError(null);

    try {
      const payload = sanitizePortfolioPayload(formData, influencerId);
      const response = editingItem
        ? await updateInfluencerPortfolioItem(editingItem.id, payload)
        : await createInfluencerPortfolioItem(payload);

      if (response.error) throw response.error;

      await loadPortfolio();
      closeModal();
    } catch (err) {
      setModalError(err.message || 'Gagal menyimpan portfolio.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Hapus portfolio "${item.title}"?`);
    if (!confirmed) return;

    try {
      const { error: deleteError } = await deleteInfluencerPortfolioItem(item.id);
      if (deleteError) throw deleteError;
      setItems((current) => current.filter((portfolioItem) => portfolioItem.id !== item.id));
    } catch (err) {
      setError(err.message || 'Gagal menghapus portfolio.');
    }
  };

  return (
    <section id="portfolio" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 scroll-mt-24">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-lg bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon icon={faBriefcase} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase">Portfolio / Media Kit</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">Karya Terbaik Anda</h2>
            <p className="text-sm text-gray-600 mt-2">
              Tambahkan contoh konten, promosi brand, dan link karya agar UMKM lebih yakin memilih Anda.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={!influencerId}
          className="btn btn-primary inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Tambah Portfolio
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">Total Item</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{items.length}</p>
        </div>
        <div className="rounded-lg bg-green-50 border border-green-100 p-4">
          <p className="text-xs font-semibold text-green-700 uppercase">Publik</p>
          <p className="text-2xl font-bold text-green-900 mt-1">{publicItemsCount}</p>
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">Privat</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{items.length - publicItemsCount}</p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-gray-900" />
          <p className="text-sm text-gray-500 mt-3">Memuat portfolio...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 text-yellow-900">
          <p className="font-semibold">Portfolio belum bisa dimuat</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <FontAwesomeIcon icon={faBriefcase} className="text-4xl text-gray-300 mb-3" />
          <p className="font-semibold text-gray-900">Portfolio masih kosong</p>
          <p className="text-sm text-gray-500 mt-1 mb-5">Mulai dengan satu karya terbaik yang menunjukkan gaya konten Anda.</p>
          <button type="button" onClick={openCreateModal} className="btn btn-primary">
            Tambah Portfolio Pertama
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {items.map((item) => (
            <PortfolioItemCard
              key={item.id}
              item={item}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <PortfolioModal
          formData={formData}
          error={modalError}
          loading={saving}
          isEditing={Boolean(editingItem)}
          onChange={handleChange}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}
    </section>
  );
};

export default InfluencerPortfolioManager;
