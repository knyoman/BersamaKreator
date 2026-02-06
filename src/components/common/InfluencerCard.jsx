import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faStar, 
  faUsers, 
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons'
import { 
  faInstagram,
  faTiktok,
  faYoutube
} from '@fortawesome/free-brands-svg-icons'

const InfluencerCard = ({ influencer }) => {
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

  return (
    <div className="card p-6 hover:scale-105 transition-transform">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            {influencer.profile_image ? (
              <img src={influencer.profile_image} alt={influencer.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-600 font-bold">
                {influencer.name?.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{influencer.name}</h3>
            <p className="text-sm text-gray-600">@{influencer.username}</p>
          </div>
        </div>
        {influencer.is_verified && (
          <FontAwesomeIcon icon={faCheckCircle} className="text-primary-600" title="Verified" />
        )}
      </div>

      {/* Niche */}
      <div className="mb-4">
        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
          {influencer.niche}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex items-center text-gray-600 text-sm mb-1">
            <FontAwesomeIcon icon={faUsers} className="mr-2" />
            Followers
          </div>
          <div className="font-bold text-gray-900">{formatNumber(influencer.followers_count)}</div>
        </div>
        <div>
          <div className="flex items-center text-gray-600 text-sm mb-1">
            <FontAwesomeIcon icon={faStar} className="mr-2" />
            Rating
          </div>
          <div className="font-bold text-gray-900">
            {influencer.rating_average > 0 ? influencer.rating_average.toFixed(1) : 'New'}
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="flex items-center space-x-3 mb-4 text-gray-600">
        {influencer.instagram_url && (
          <a href={influencer.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">
            <FontAwesomeIcon icon={faInstagram} size="lg" />
          </a>
        )}
        {influencer.tiktok_url && (
          <a href={influencer.tiktok_url} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">
            <FontAwesomeIcon icon={faTiktok} size="lg" />
          </a>
        )}
        {influencer.youtube_url && (
          <a href={influencer.youtube_url} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">
            <FontAwesomeIcon icon={faYoutube} size="lg" />
          </a>
        )}
      </div>

      {/* Price */}
      <div className="mb-4 pb-4 border-b border-gray-100">
        <div className="text-sm text-gray-600">Price per post</div>
        <div className="text-xl font-bold text-gray-900">{formatPrice(influencer.price_per_post)}</div>
      </div>

      {/* CTA */}
      <Link 
        to={`/influencer/${influencer.username}`}
        className="btn btn-primary w-full text-center text-sm"
      >
        View Profile
      </Link>
    </div>
  )
}

export default InfluencerCard
