import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCheckCircle, faArrowLeft, faClock, faStar, faTags } from '@fortawesome/free-solid-svg-icons';
import { getInfluencerById, getInfluencerPricingPackages } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatPackageCurrency, getPricingPackageTypeLabel } from '../features/influencer/pricingPackages';

const OrderSystem = () => {
  const { influencerId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [influencer, setInfluencer] = useState(null);
  const [pricingPackages, setPricingPackages] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    campaign_name: '',
    campaign_description: '',
    deadline: '',
    total_price: '',
    notes: '',
  });

  const selectedPackage = pricingPackages.find((item) => String(item.id) === String(selectedPackageId)) || null;
  const selectedTotalPrice = selectedPackage
    ? Number(selectedPackage.price || 0)
    : Number(influencer?.price_per_post || 0);

  useEffect(() => {
    fetchInfluencer();
  }, [influencerId]);

  const fetchInfluencer = async () => {
    setLoading(true);
    const { data, error } = await getInfluencerById(influencerId);
    if (error) {
      setError(error.message);
    } else {
      const { data: packagesData } = await getInfluencerPricingPackages(data.id);
      const safePackages = packagesData || [];
      const requestedPackageId = searchParams.get('package');
      const requestedPackage = safePackages.find((item) => String(item.id) === String(requestedPackageId));

      setInfluencer(data);
      setPricingPackages(safePackages);
      setSelectedPackageId(requestedPackage?.id || null);
      setFormData((prev) => ({
        ...prev,
        total_price: requestedPackage?.price || data.price_per_post,
      }));
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePackageChange = (packageId) => {
    const nextPackage = pricingPackages.find((item) => String(item.id) === String(packageId)) || null;
    setSelectedPackageId(nextPackage?.id || null);
    setFormData((prev) => ({
      ...prev,
      total_price: nextPackage?.price || influencer.price_per_post,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!user) {
      setError('Silakan login untuk membuat pesanan');
      setSubmitting(false);
      return;
    }

    const preOrderData = {
      influencer_id: Number(influencerId),
      pricing_package_id: selectedPackage?.id || null,
      campaign_name: formData.campaign_name,
      campaign_description: formData.campaign_description,
      total_price: selectedTotalPrice,
      deadline: formData.deadline,
      notes: formData.notes,
      package_label: selectedPackage?.title || 'Harga dasar per post',
    };

    // Redirect to Payment Page
    navigate('/payment', { 
      state: { 
        orderData: preOrderData,
        influencer: influencer 
      } 
    });
    setSubmitting(false);
  };

  const packageOptions = [
    {
      id: 'base',
      title: 'Harga dasar per post',
      typeLabel: 'Default',
      price: Number(influencer?.price_per_post || 0),
      description: 'Pesanan custom berdasarkan harga utama profil influencer.',
      deliverables: ['1x konten sesuai brief'],
      delivery_days: null,
      revision_count: null,
      is_featured: pricingPackages.length === 0,
    },
    ...pricingPackages,
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="text-4xl text-gray-900 animate-spin" />
      </div>
    );
  }

  if (!influencer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Influencer tidak ditemukan</p>
          <button onClick={() => navigate(-1)} className="btn btn-primary">
            Kembali
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Pesanan Berhasil Dibuat!</h2>
          <p className="text-gray-600 mb-6">Permintaan pemesanan Anda sudah dikirim ke {influencer.name}. Mereka akan meninjau dan segera merespons.</p>
          <p className="text-sm text-gray-500">Mengalihkan ke beranda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom max-w-4xl">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Kembali
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gray-900 text-white p-6">
            <h1 className="text-3xl font-bold mb-2">Buat Pesanan</h1>
            <p className="text-gray-300">Booking {influencer.name} untuk kampanye Anda</p>
          </div>

          {/* Influencer Summary */}
          <div className="p-6 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {influencer.profile_image ? <img src={influencer.profile_image} alt={influencer.name} className="w-full h-full object-cover" /> : <span className="text-2xl text-gray-600 font-bold">{influencer.name?.charAt(0)}</span>}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{influencer.name}</h3>
                <p className="text-sm text-gray-600">@{influencer.username}</p>
                <p className="text-sm text-gray-600">{influencer.niche}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

            <section>
              <div className="flex items-center gap-2 mb-4">
                <FontAwesomeIcon icon={faTags} className="text-gray-700" />
                <h2 className="text-lg font-bold text-gray-900">Pilih Paket</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {packageOptions.map((item) => {
                  const isBase = item.id === 'base';
                  const isSelected = isBase ? !selectedPackageId : String(selectedPackageId) === String(item.id);
                  const typeLabel = isBase ? item.typeLabel : getPricingPackageTypeLabel(item.package_type);

                  return (
                    <label
                      key={item.id}
                      className={`relative rounded-xl border p-4 cursor-pointer transition-colors ${
                        isSelected ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="pricing_package_id"
                        value={item.id}
                        checked={isSelected}
                        onChange={() => handlePackageChange(isBase ? null : item.id)}
                        className="sr-only"
                      />

                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase">{typeLabel}</p>
                          <h3 className="font-bold text-gray-900 mt-1">{item.title}</h3>
                        </div>
                        {item.is_featured && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-1 text-xs font-semibold text-yellow-700">
                            <FontAwesomeIcon icon={faStar} />
                            Utama
                          </span>
                        )}
                      </div>

                      <p className="text-xl font-bold text-gray-900 mt-3">{formatPackageCurrency(item.price)}</p>

                      <div className="flex flex-wrap gap-2 mt-3 text-xs font-semibold text-gray-600">
                        {item.delivery_days && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-2 py-1">
                            <FontAwesomeIcon icon={faClock} />
                            {item.delivery_days} hari
                          </span>
                        )}
                        {item.revision_count !== null && item.revision_count !== undefined && (
                          <span className="rounded-full bg-white border border-gray-200 px-2 py-1">
                            {item.revision_count} revisi
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-sm text-gray-600 mt-3 line-clamp-2">{item.description}</p>
                      )}

                      <ul className="mt-3 space-y-1">
                        {(item.deliverables || []).slice(0, 4).map((deliverable) => (
                          <li key={deliverable} className="flex gap-2 text-sm text-gray-700">
                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gray-900 flex-shrink-0" />
                            <span>{deliverable}</span>
                          </li>
                        ))}
                      </ul>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* Campaign Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Kampanye *</label>
              <input
                type="text"
                name="campaign_name"
                value={formData.campaign_name}
                onChange={handleChange}
                required
                placeholder="contoh: Peluncuran Koleksi Musim Panas"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            {/* Campaign Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi Kampanye *</label>
              <textarea
                name="campaign_description"
                value={formData.campaign_description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Jelaskan kampanye Anda secara detail..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            {/* Grid for Date and Price */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Batas Waktu *</label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Harga (IDR) *</label>
                <input
                  type="number"
                  name="total_price"
                  value={selectedTotalPrice}
                  readOnly
                  required
                  min={0}
                  step={1000}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Harga mengikuti pilihan paket: {selectedPackage?.title || 'Harga dasar per post'}
                </p>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Tambahan (Opsional)</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Tambahkan kebutuhan atau permintaan khusus..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button type="submit" disabled={submitting} className="btn btn-primary w-full text-lg py-4">
                {submitting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                    Membuat pesanan...
                  </>
                ) : (
                  'Kirim Permintaan Pesanan'
                )}
              </button>
              <p className="text-xs text-gray-500 text-center mt-3">Dengan mengirim, Anda menyetujui Syarat & Ketentuan kami</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrderSystem;
