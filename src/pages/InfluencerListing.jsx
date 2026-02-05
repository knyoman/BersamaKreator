import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faFilter, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { getInfluencers } from '../services/api'
import InfluencerCard from '../components/common/InfluencerCard'

const InfluencerListing = () => {
  const [influencers, setInfluencers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
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
    setLoading(true)
    const { data, error } = await getInfluencers(appliedFilters)
    
    if (error) {
      setError(error.message)
    } else {
      setInfluencers(data || [])
    }
    setLoading(false)
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
    'Fashion & Lifestyle',
    'Beauty & Skincare',
    'Food & Culinary',
    'Technology & Gadget',
    'Travel',
    'Health & Fitness',
    'Gaming',
    'Education'
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-custom py-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Find Your Perfect Influencer
          </h1>
          <p className="text-lg text-gray-600">
            Browse {influencers.length}+ verified nano influencers ready to promote your brand
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="container-custom py-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center mb-4">
            <FontAwesomeIcon icon={faFilter} className="text-gray-900 mr-2" />
            <h2 className="font-bold text-gray-900">Filters</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-4">
            {/* Niche Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Niche</label>
              <select
                name="niche"
                value={filters.niche}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="">All Niches</option>
                {niches.map(niche => (
                  <option key={niche} value={niche}>{niche}</option>
                ))}
              </select>
            </div>

            {/* Min Followers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Followers</label>
              <input
                type="number"
                name="minFollowers"
                value={filters.minFollowers}
                onChange={handleFilterChange}
                placeholder="e.g. 10000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Price (IDR)</label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="e.g. 3000000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            {/* Verified Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Verification</label>
              <select
                name="isVerified"
                value={filters.isVerified}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="true">Verified Only</option>
                <option value="false">Not Verified</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleApplyFilters} className="btn btn-primary">
              Apply Filters
            </button>
            <button onClick={handleResetFilters} className="btn btn-outline">
              Reset
            </button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-16">
            <FontAwesomeIcon icon={faSpinner} className="text-4xl text-gray-900 animate-spin" />
            <p className="mt-4 text-gray-600">Loading influencers...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-600">{error}</p>
            <button onClick={() => fetchInfluencers()} className="btn btn-primary mt-4">
              Try Again
            </button>
          </div>
        ) : influencers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg mb-4">No influencers found</p>
            <button onClick={handleResetFilters} className="btn btn-outline">
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Showing <span className="font-bold text-gray-900">{influencers.length}</span> influencers
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
