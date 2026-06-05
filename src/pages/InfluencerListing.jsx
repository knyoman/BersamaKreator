import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faFilter, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { getInfluencers } from '../services/api'
import { logger } from '../utils/logger'
import InfluencerCard from '../components/common/InfluencerCard'

const InfluencerListing = () => {
  const [influencers, setInfluencers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const requestIdRef = useRef(0)
  const [filters, setFilters] = useState({
    niche: '',
    minFollowers: '',
    maxPrice: '',
    isVerified: undefined
  })

  useEffect(() => {
    fetchInfluencers()
  }, [])

  const fetchInfluencers = async (appliedFilters = {}) => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    setLoading(true)
    setError(null)
    
    logger.debug('[InfluencerListing] Fetching influencers with filters:', appliedFilters);

    try {
      const { data, error: fetchError } = await getInfluencers(appliedFilters)

      if (requestId !== requestIdRef.current) return

      logger.debug('[InfluencerListing] Fetch result:', {
        dataCount: data?.length,
        hasError: !!fetchError
      });

      if (fetchError) {
        throw fetchError
      }

      setInfluencers(data || [])
    } catch (err) {
      if (requestId !== requestIdRef.current) return

      const errorMessage = err.message || 'Gagal mengambil data influencer';
      logger.error('[InfluencerListing] Error:', errorMessage);
      setError(errorMessage)
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleApplyFilters = () => {
    const appliedFilters = {}
    
    if (filters.niche) appliedFilters.niche = filters.niche
    if (filters.minFollowers) appliedFilters.minFollowers = parseInt(filters.minFollowers)
    if (filters.maxPrice) appliedFilters.maxPrice = parseFloat(filters.maxPrice)
    if (filters.isVerified !== undefined) appliedFilters.isVerified = filters.isVerified === 'true'

    fetchInfluencers(appliedFilters)
  }

  const handleResetFilters = () => {
    setFilters({
      niche: '',
      minFollowers: '',
      maxPrice: '',
      isVerified: undefined
    })
    fetchInfluencers()
  }

  const niches = [
    { value: 'Fashion & Lifestyle', label: 'Fashion & Gaya Hidup' },
    { value: 'Beauty & Skincare', label: 'Kecantikan & Perawatan Kulit' },
    { value: 'Food & Culinary', label: 'Makanan & Kuliner' },
    { value: 'Technology & Gadget', label: 'Teknologi & Gadget' },
    { value: 'Travel', label: 'Travel' },
    { value: 'Health & Fitness', label: 'Kesehatan & Kebugaran' },
    { value: 'Gaming', label: 'Gaming' },
    { value: 'Education', label: 'Edukasi' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-custom py-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Temukan Influencer yang Tepat
          </h1>
          <p className="text-lg text-gray-600">
            Jelajahi {influencers.length}+ nano influencer terverifikasi yang siap mempromosikan brand Anda
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="container-custom py-8">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center mb-3">
            <FontAwesomeIcon icon={faFilter} className="text-gray-900 mr-2 text-sm" />
            <h2 className="text-sm font-bold text-gray-900">Filter</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-3 mb-3">
            {/* Niche Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Niche</label>
              <select
                name="niche"
                value={filters.niche}
                onChange={handleFilterChange}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="">Semua Niche</option>
                {niches.map(niche => (
                  <option key={niche.value} value={niche.value}>{niche.label}</option>
                ))}
              </select>
            </div>

            {/* Min Followers */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Minimal Pengikut</label>
              <input
                type="number"
                name="minFollowers"
                value={filters.minFollowers}
                onChange={handleFilterChange}
                placeholder="contoh: 10000"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Harga Maksimal (IDR)</label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="contoh: 3000000"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            {/* Verified Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Verifikasi</label>
              <select
                name="isVerified"
                value={filters.isVerified}
                onChange={handleFilterChange}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="">Semua</option>
                <option value="true">Terverifikasi Saja</option>
                <option value="false">Belum Terverifikasi</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleApplyFilters} className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors">
              Terapkan Filter
            </button>
            <button onClick={handleResetFilters} className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-xs font-medium px-4 py-2 rounded-lg transition-colors">
              Reset
            </button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-16">
            <FontAwesomeIcon icon={faSpinner} className="text-4xl text-gray-900 animate-spin" />
            <p className="mt-4 text-gray-600">Memuat influencer...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
              <p className="text-red-600 font-semibold mb-2">Gagal Memuat Influencer</p>
              <p className="text-red-700 text-sm mb-4">{error}</p>
              <div className="text-xs text-gray-600 mb-4 text-left">
                <p className="font-semibold mb-1">Tips pengecekan:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Periksa console browser untuk detail error</li>
                  <li>Pastikan kredensial Supabase sudah benar di file .env</li>
                  <li>Pastikan view database 'v_influencer_profiles' tersedia</li>
                  <li>Pastikan tabel influencers memiliki data</li>
                </ul>
              </div>
              <button onClick={() => fetchInfluencers()} className="btn btn-primary">
                Coba Lagi
              </button>
            </div>
          </div>
        ) : influencers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg mb-4">Tidak ada influencer ditemukan</p>
            <button onClick={handleResetFilters} className="btn btn-outline">
              Hapus Filter
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Menampilkan <span className="font-bold text-gray-900">{influencers.length}</span> influencer
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {influencers.map(influencer => (
                <InfluencerCard key={influencer.id} influencer={influencer} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default InfluencerListing
