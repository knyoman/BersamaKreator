import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faStar, 
  faUsers, 
  faCheckCircle, 
  faSpinner,
  faChartLine,
  faArrowLeft,
  faShoppingCart
} from '@fortawesome/free-solid-svg-icons'
import { 
  faInstagram,
  faTiktok,
  faYoutube
} from '@fortawesome/free-brands-svg-icons'
import { getInfluencerByUsername, getInfluencerReviews } from '../services/api'

const InfluencerDetail = () => {
  const { username } = useParams()
  const navigate = useNavigate()
  const [influencer, setInfluencer] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchInfluencerData()
  }, [username])

  const fetchInfluencerData = async () => {
    setLoading(true)
    setError(null)
    
    // 1. Fetch Influencer by Username
    const { data: infData, error: infError } = await getInfluencerByUsername(username)

    if (infError || !infData) {
      setError('Influencer not found')
      setLoading(false)
      return
    }

    setInfluencer(infData)

    // 2. Fetch Reviews (using ID from fetched influencer)
    const { data: revData } = await getInfluencerReviews(infData.id)
    setReviews(revData || [])

    setLoading(false)
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="text-4xl text-gray-900 animate-spin" />
      </div>
    )
  }

  if (error || !influencer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Influencer not found'}</p>
          <Link to="/influencers" className="btn btn-primary">
            Back to Influencers
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-custom py-8">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Back
          </button>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Profile Image */}
            <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
              {influencer.profile_image ? (
                <img src={influencer.profile_image} alt={influencer.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl text-gray-600 font-bold">
                  {influencer.name?.charAt(0)}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{influencer.name}</h1>
                {influencer.is_verified && (
                  <FontAwesomeIcon icon={faCheckCircle} className="text-primary-600 text-2xl" title="Verified" />
                )}
              </div>
              <p className="text-lg text-gray-600 mb-4">@{influencer.username}</p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div>
                  <div className="flex items-center text-gray-600 text-sm mb-1">
                    <FontAwesomeIcon icon={faUsers} className="mr-2" />
                    Followers
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{formatNumber(influencer.followers_count)}</div>
                </div>
                <div>
                  <div className="flex items-center text-gray-600 text-sm mb-1">
                    <FontAwesomeIcon icon={faChartLine} className="mr-2" />
                    Engagement
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{influencer.engagement_rate}%</div>
                </div>
                <div>
                  <div className="flex items-center text-gray-600 text-sm mb-1">
                    <FontAwesomeIcon icon={faStar} className="mr-2" />
                    Rating
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {influencer.rating_average > 0 ? influencer.rating_average.toFixed(1) : 'New'}
                  </div>
                </div>
              </div>

              {/* Niche */}
              <div className="mb-6">
                <span className="inline-block px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg">
                  {influencer.niche}
                </span>
              </div>

              {/* Social Media */}
              <div className="flex items-center gap-4 text-gray-600">
                {influencer.instagram_url && (
                  <a href={influencer.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">
                    <FontAwesomeIcon icon={faInstagram} size="2x" />
                  </a>
                )}
                {influencer.tiktok_url && (
                  <a href={influencer.tiktok_url} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">
                    <FontAwesomeIcon icon={faTiktok} size="2x" />
                  </a>
                )}
                {influencer.youtube_url && (
                  <a href={influencer.youtube_url} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">
                    <FontAwesomeIcon icon={faYoutube} size="2x" />
                  </a>
                )}
              </div>
            </div>

            {/* CTA Card */}
            <div className="w-full md:w-80 bg-white border border-gray-200 rounded-xl p-6">
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-1">Price per post</div>
                <div className="text-3xl font-bold text-gray-900">{formatPrice(influencer.price_per_post)}</div>
              </div>
              <Link to={`/order/${influencer.id}`} className="btn btn-primary w-full text-center">
                <FontAwesomeIcon icon={faShoppingCart} className="mr-2" />
                Book Now
              </Link>
              <div className="mt-4 text-xs text-gray-600 text-center">
                {influencer.total_orders} completed orders
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-custom py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="md:col-span-2 space-y-8">
            {/* Bio */}
            {influencer.bio && (
              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
                <p className="text-gray-700 leading-relaxed">{influencer.bio}</p>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews ({reviews.length})</h2>
              
              {reviews.length === 0 ? (
                <p className="text-gray-600">No reviews yet</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">{review.order?.sme?.name || 'Anonymous'}</div>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <FontAwesomeIcon
                              key={i}
                              icon={faStar}
                              className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 mb-2">{review.comment}</p>
                      )}
                      {review.response && (
                        <div className="mt-2 pl-4 border-l-2 border-gray-200">
                          <div className="text-sm font-medium text-gray-900 mb-1">Response:</div>
                          <p className="text-sm text-gray-600">{review.response}</p>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(review.created_at).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Stats */}
          <div>
            <div className="bg-white rounded-xl p-6 border border-gray-100 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Performance Stats</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Orders</span>
                  <span className="font-bold text-gray-900">{influencer.total_orders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Rating</span>
                  <span className="font-bold text-gray-900">
                    {influencer.rating_average > 0 ? influencer.rating_average.toFixed(1) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Response Rate</span>
                  <span className="font-bold text-gray-900">Fast</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InfluencerDetail
