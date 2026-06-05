import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faCheckCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { updateUserProfile } from '../../../services/api';

const SMEBusinessProfilePage = ({ userProfile, setUserProfile }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    profile_image: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setFormData({
      name: userProfile?.name || '',
      phone: userProfile?.phone || '',
      profile_image: userProfile?.profile_image || '',
    });
  }, [userProfile]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
    setSuccess(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { data, error: updateError } = await updateUserProfile(userProfile.id, formData);
      if (updateError) throw updateError;

      if (data?.profile && setUserProfile) {
        setUserProfile(data.profile);
      }

      setSuccess(true);
    } catch (submitError) {
      setError(submitError.message || 'Gagal menyimpan profil bisnis.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-gray-500 uppercase">Profil Bisnis</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-1">Identitas UMKM</h1>
        <p className="text-gray-600 mt-2">Kelola informasi dasar bisnis yang digunakan di workspace BersamaKreator.</p>
      </header>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-lg bg-gray-900 text-white flex items-center justify-center">
              <FontAwesomeIcon icon={faBuilding} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Data Bisnis</h2>
              <p className="text-sm text-gray-500 mt-1">Pastikan nama bisnis dan kontak aktif.</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-lg border border-green-100 bg-green-50 p-4 text-sm text-green-700">
              <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
              Profil bisnis berhasil disimpan.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Bisnis</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Nama UMKM"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nomor Telepon</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="contoh: 081234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">URL Logo / Foto Profil</label>
              <input
                type="url"
                name="profile_image"
                value={formData.profile_image}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="https://..."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />}
              Simpan Profil
            </button>
          </form>
        </section>

        <aside className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <p className="text-sm font-semibold text-gray-500 uppercase">Preview</p>
          <div className="mt-5 flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
              {formData.profile_image ? (
                <img src={formData.profile_image} alt={formData.name || 'Logo bisnis'} className="w-full h-full object-cover" />
              ) : (
                <FontAwesomeIcon icon={faBuilding} className="text-gray-500 text-2xl" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 truncate">{formData.name || 'Nama Bisnis'}</p>
              <p className="text-sm text-gray-500 truncate">{userProfile?.email || '-'}</p>
              <p className="text-sm text-gray-500 truncate">{formData.phone || 'Nomor telepon belum diisi'}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SMEBusinessProfilePage;
