import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faCircleInfo,
  faEye,
  faEyeSlash,
  faPenToSquare,
  faPlus,
  faSave,
  faSpinner,
  faStar,
  faTags,
  faTimes,
  faTriangleExclamation,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import {
  PRICING_PACKAGE_TYPES,
  createEmptyPricingPackageForm,
  formatPackageCurrency,
  getPricingPackageTypeLabel,
  sanitizePricingPackagePayload,
  toPricingPackageForm,
} from '../../../features/influencer/pricingPackages';
import {
  createInfluencerPricingPackage,
  deleteInfluencerPricingPackage,
  getCurrentInfluencerProfile,
  getInfluencerPricingPackages,
  updateInfluencerPricingPackage,
} from '../../../services/api';
import { logger } from '../../../utils/logger';

const getPricingPackageErrorMessage = (error) => {
  if (!error?.message) return 'Gagal memuat paket harga.';

  const message = error.message.toLowerCase();

  if (
    message.includes('influencer_pricing_packages')
    || message.includes('relation')
    || message.includes('does not exist')
    || message.includes('could not find the table')
  ) {
    return 'Tabel paket harga belum tersedia. Jalankan schema Supabase terbaru sebelum menggunakan fitur ini.';
  }

  if (message.includes('row-level security') || message.includes('violates row-level security')) {
    return 'Akses Supabase menolak penyimpanan paket. Pastikan akun aktif bertipe influencer dan profil influencer terhubung ke user login.';
  }

  if (message.includes('permission denied') || message.includes('permission')) {
    return 'Permission tabel paket harga belum lengkap. Jalankan GRANT dan policy terbaru di Supabase SQL Editor.';
  }

  return error.message;
};

const getInfluencerProfileErrorMessage = (error) => {
  if (!error?.message) {
    return 'Profil influencer belum siap. Lengkapi profil terlebih dahulu sebelum membuat paket layanan.';
  }

  return getPricingPackageErrorMessage(error);
};

const PackageStatusBadge = ({ item }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
    item.is_public ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
  }`}>
    <FontAwesomeIcon icon={item.is_public ? faEye : faEyeSlash} />
    {item.is_public ? 'Publik' : 'Privat'}
  </span>
);

const PricingPackageCard = ({ item, onEdit, onDelete }) => (
  <article className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase">
          {getPricingPackageTypeLabel(item.package_type)}
        </p>
        <h3 className="font-bold text-gray-900 text-lg mt-1">{item.title}</h3>
      </div>
      <div className="flex flex-col items-end gap-2">
        {item.is_featured && (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-1 text-xs font-semibold text-yellow-700">
            <FontAwesomeIcon icon={faStar} />
            Utama
          </span>
        )}
        <PackageStatusBadge item={item} />
      </div>
    </div>

    <p className="text-2xl font-bold text-gray-900 mt-4">{formatPackageCurrency(item.price)}</p>

    <div className="flex flex-wrap gap-2 mt-3 text-xs font-semibold text-gray-600">
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
        <FontAwesomeIcon icon={faClock} />
        {item.delivery_days || 0} hari
      </span>
      <span className="rounded-full bg-gray-100 px-2 py-1">
        {item.revision_count || 0} revisi
      </span>
    </div>

    {item.description && (
      <p className="text-sm text-gray-600 mt-4 line-clamp-3">{item.description}</p>
    )}

    <ul className="mt-4 space-y-2 flex-1">
      {(item.deliverables || []).slice(0, 5).map((deliverable) => (
        <li key={deliverable} className="flex gap-2 text-sm text-gray-700">
          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gray-900 flex-shrink-0" />
          <span>{deliverable}</span>
        </li>
      ))}
    </ul>

    <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
      <button
        type="button"
        onClick={() => onEdit(item)}
        className="w-9 h-9 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-900 hover:text-white transition-colors"
        title="Edit paket"
      >
        <FontAwesomeIcon icon={faPenToSquare} />
      </button>
      <button
        type="button"
        onClick={() => onDelete(item)}
        className="w-9 h-9 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-colors"
        title="Hapus paket"
      >
        <FontAwesomeIcon icon={faTrash} />
      </button>
    </div>
  </article>
);

const PricingPackageModal = ({
  formData,
  error,
  loading,
  isEditing,
  onChange,
  onClose,
  onSubmit,
}) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
      <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Paket Harga' : 'Tambah Paket Harga'}</h2>
          <p className="text-sm text-gray-500 mt-1">Buat pilihan layanan yang jelas untuk UMKM.</p>
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
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tipe Paket</label>
            <select
              name="package_type"
              value={formData.package_type}
              onChange={onChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {PRICING_PACKAGE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Harga *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={onChange}
              required
              min={0}
              step={1000}
              placeholder="500000"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Paket *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={onChange}
              required
              maxLength={120}
              placeholder="contoh: Paket Story + Reels Launch"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Estimasi Pengerjaan</label>
            <input
              type="number"
              name="delivery_days"
              value={formData.delivery_days}
              onChange={onChange}
              min={1}
              max={90}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Jumlah Revisi</label>
            <input
              type="number"
              name="revision_count"
              value={formData.revision_count}
              onChange={onChange}
              min={0}
              max={10}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Deliverables *</label>
            <textarea
              name="deliverablesText"
              value={formData.deliverablesText}
              onChange={onChange}
              required
              rows={5}
              placeholder="Tulis satu deliverable per baris"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Deskripsi</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={onChange}
              rows={3}
              maxLength={700}
              placeholder="Tambahkan konteks, cocok untuk promosi apa, atau batasan layanan."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          <label className="flex items-center gap-3 text-sm font-semibold text-gray-700">
            <input
              type="checkbox"
              name="is_public"
              checked={formData.is_public}
              onChange={onChange}
              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            Tampilkan di profil publik
          </label>

          <label className="flex items-center gap-3 text-sm font-semibold text-gray-700">
            <input
              type="checkbox"
              name="is_featured"
              checked={formData.is_featured}
              onChange={onChange}
              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            Jadikan paket utama
          </label>
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

const InfluencerPricingPackageManager = ({ influencerId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingProfile, setResolvingProfile] = useState(true);
  const [resolvedInfluencerId, setResolvedInfluencerId] = useState(influencerId || null);
  const [profileError, setProfileError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(createEmptyPricingPackageForm);

  const publicItemsCount = useMemo(
    () => items.filter((item) => item.is_public).length,
    [items],
  );
  const featuredItemsCount = useMemo(
    () => items.filter((item) => item.is_featured).length,
    [items],
  );
  const effectiveInfluencerId = influencerId || resolvedInfluencerId;
  const canManagePackages = Boolean(effectiveInfluencerId) && !resolvingProfile;

  useEffect(() => {
    let isMounted = true;

    const resolveInfluencerProfile = async () => {
      if (influencerId) {
        setResolvedInfluencerId(influencerId);
        setProfileError(null);
        setResolvingProfile(false);
        return;
      }

      setResolvingProfile(true);
      setProfileError(null);

      const { data, error: resolveError } = await getCurrentInfluencerProfile();
      if (!isMounted) return;

      if (resolveError) {
        logger.error('[InfluencerPricingPackageManager] Profile resolve error:', resolveError.message);
        setResolvedInfluencerId(null);
        setProfileError(getInfluencerProfileErrorMessage(resolveError));
      } else {
        setResolvedInfluencerId(data?.influencer_id || data?.id || null);
      }

      setResolvingProfile(false);
    };

    resolveInfluencerProfile();

    return () => {
      isMounted = false;
    };
  }, [influencerId]);

  const loadPackages = async () => {
    if (resolvingProfile) {
      return;
    }

    if (!effectiveInfluencerId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await getInfluencerPricingPackages(effectiveInfluencerId, { includePrivate: true });
      if (fetchError) throw fetchError;
      setItems(data || []);
    } catch (err) {
      logger.error('[InfluencerPricingPackageManager] Load error:', err.message);
      setError(getPricingPackageErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, [effectiveInfluencerId, resolvingProfile]);

  const openCreateModal = () => {
    if (!canManagePackages) {
      setError(profileError || 'Profil influencer belum siap. Lengkapi profil terlebih dahulu sebelum membuat paket layanan.');
      return;
    }

    setEditingItem(null);
    setFormData(createEmptyPricingPackageForm());
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData(toPricingPackageForm(item));
    setModalError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingItem(null);
    setModalError(null);
    setIsModalOpen(false);
    setFormData(createEmptyPricingPackageForm());
  };

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;

    if (name === 'package_type' && !editingItem) {
      setFormData((current) => ({
        ...createEmptyPricingPackageForm(value),
        price: current.price,
        is_public: current.is_public,
        is_featured: current.is_featured,
      }));
      return;
    }

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
      const payload = sanitizePricingPackagePayload(formData, effectiveInfluencerId);
      const response = editingItem
        ? await updateInfluencerPricingPackage(editingItem.id, payload)
        : await createInfluencerPricingPackage(payload);

      if (response.error) throw response.error;

      await loadPackages();
      closeModal();
    } catch (err) {
      setModalError(getPricingPackageErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Hapus paket "${item.title}"?`);
    if (!confirmed) return;

    try {
      const { error: deleteError } = await deleteInfluencerPricingPackage(item.id);
      if (deleteError) throw deleteError;
      setItems((current) => current.filter((packageItem) => packageItem.id !== item.id));
    } catch (err) {
      setError(err.message || 'Gagal menghapus paket harga.');
    }
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-lg bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon icon={faTags} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase">Paket Harga</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">Pilihan Layanan Promosi</h2>
            <p className="text-sm text-gray-600 mt-2">
              Susun paket konten dengan harga, deliverables, estimasi pengerjaan, dan jumlah revisi yang jelas.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={!canManagePackages}
          className="btn btn-primary inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Tambah Paket
        </button>
      </div>

      {resolvingProfile ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-blue-800">
          <FontAwesomeIcon icon={faSpinner} className="mt-0.5 animate-spin" />
          <div>
            <p className="font-semibold">Mengecek profil influencer...</p>
            <p className="mt-1 text-sm">Sistem sedang memastikan akun login terhubung ke profil influencer yang valid.</p>
          </div>
        </div>
      ) : profileError ? (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-900">
          <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5" />
          <div>
            <p className="font-semibold">Paket layanan belum tersedia untuk akun ini</p>
            <p className="mt-1 text-sm">{profileError}</p>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 p-4 text-green-800">
          <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5" />
          <div>
            <p className="font-semibold">Profil influencer siap</p>
            <p className="mt-1 text-sm">Anda bisa menambahkan paket layanan dan menampilkannya ke profil publik.</p>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">Total Paket</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{items.length}</p>
        </div>
        <div className="rounded-lg bg-green-50 border border-green-100 p-4">
          <p className="text-xs font-semibold text-green-700 uppercase">Publik</p>
          <p className="text-2xl font-bold text-green-900 mt-1">{publicItemsCount}</p>
        </div>
        <div className="rounded-lg bg-yellow-50 border border-yellow-100 p-4">
          <p className="text-xs font-semibold text-yellow-700 uppercase">Paket Utama</p>
          <p className="text-2xl font-bold text-yellow-900 mt-1">{featuredItemsCount}</p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-gray-900" />
          <p className="text-sm text-gray-500 mt-3">Memuat paket harga...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 text-yellow-900">
          <p className="font-semibold">Paket harga belum bisa dimuat</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <FontAwesomeIcon icon={faTags} className="text-4xl text-gray-300 mb-3" />
          <p className="font-semibold text-gray-900">Paket harga masih kosong</p>
          <p className="text-sm text-gray-500 mt-1 mb-5">Mulai dari paket Story, Feed, Reels, atau TikTok agar UMKM mudah memilih.</p>
          <button
            type="button"
            onClick={openCreateModal}
            disabled={!canManagePackages}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tambah Paket Pertama
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {items.map((item) => (
            <PricingPackageCard
              key={item.id}
              item={item}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <PricingPackageModal
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

export default InfluencerPricingPackageManager;
