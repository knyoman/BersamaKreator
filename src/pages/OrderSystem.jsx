import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner, faCheckCircle, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { getInfluencerById, createOrder } from '../services/api'

const OrderSystem = () => {
  const { influencerId } = useParams()
  const navigate = useNavigate()
  const [influencer, setInfluencer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    campaign_name: '',
    campaign_description: '',
    deadline: '',
    total_price: '',
    notes: ''
  })

  useEffect(() => {
    fetchInfluencer()
  }, [influencerId])

  const fetchInfluencer = async () => {
    const { data, error } = await getInfluencerById(influencerId)
    if (error) {
      setError(error.message)
    } else {
      setInfluencer(data)
      setFormData(prev => ({
        ...prev,
        total_price: data.price_per_post
      }))
    }
    setLoading(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    // Note: In production, you would get the actual user ID from auth
    // For now, using a placeholder SME ID
    const orderData = {
      influencer_id: influencerId,
      sme_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', // Placeholder - should come from auth
      campaign_name: formData.campaign_name,
      campaign_description: formData.campaign_description,
      total_price: parseFloat(formData.total_price),
      deadline: formData.deadline,
      notes: formData.notes,
      order_status: 'pending',
      payment_status: 'unpaid'
    }

    const { data, error } = await createOrder(orderData)

    if (error) {
      setError(error.message)
      setSubmitting(false)
    } else {
      setSuccess(true)
      setSubmitting(false)
      setTimeout(() => {
        navigate('/')
      }, 2000)
    }
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

  if (!influencer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Influencer not found</p>
          <button onClick={() => navigate(-1)} className="btn btn-primary">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Order Created Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Your booking request has been sent to {influencer.name}. 
            They will review and respond soon.
          </p>
          <p className="text-sm text-gray-500">Redirecting to homepage...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom max-w-4xl">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Back
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gray-900 text-white p-6">
            <h1 className="text-3xl font-bold mb-2">Create Order</h1>
            <p className="text-gray-300">Book {influencer.name} for your campaign</p>
          </div>

          {/* Influencer Summary */}
          <div className="p-6 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {influencer.profile_image ? (
                  <img src={influencer.profile_image} alt={influencer.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl text-gray-600 font-bold">
                    {influencer.name?.charAt(0)}
                  </span>
                )}
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
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Campaign Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                name="campaign_name"
                value={formData.campaign_name}
                onChange={handleChange}
                required
                placeholder="e.g. Summer Collection Launch"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            {/* Campaign Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Description *
              </label>
              <textarea
                name="campaign_description"
                value={formData.campaign_description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Describe your campaign in detail..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            {/* Grid for Date and Price */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline *
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Price (IDR) *
                </label>
                <input
                  type="number"
                  name="total_price"
                  value={formData.total_price}
                  onChange={handleChange}
                  required
                  min={0}
                  step={1000}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: {formatPrice(influencer.price_per_post)}
                </p>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Any special requirements or requests..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary w-full text-lg py-4"
              >
                {submitting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                    Creating Order...
                  </>
                ) : (
                  'Submit Order Request'
                )}
              </button>
              <p className="text-xs text-gray-500 text-center mt-3">
                By submitting, you agree to our Terms & Conditions
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default OrderSystem
