import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRobot, faSpinner, faLightbulb } from '@fortawesome/free-solid-svg-icons'

const AIRecommendations = () => {
  const [formData, setFormData] = useState({
    budget: '',
    niche: '',
    targetAudience: '',
    campaignGoal: ''
  })
  const [loading, setLoading] = useState(false)
  const [recommendations, setRecommendations] = useState(null)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate AI processing
    setTimeout(() => {
      setRecommendations({
        message: 'Based on your requirements, we recommend these influencers...',
        influencers: []
      })
      setLoading(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-custom py-16 text-center">
          <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon icon={faRobot} className="text-white text-3xl" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            AI Recommendations
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Let our AI find the perfect influencer match for your campaign
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="container-custom py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl p-8 border border-gray-100">
            <div className="flex items-center mb-6">
              <FontAwesomeIcon icon={faLightbulb} className="text-gray-900 text-2xl mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Tell us about your campaign</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Budget (IDR) *
                </label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 5000000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Niche/Industry *
                </label>
                <select
                  name="niche"
                  value={formData.niche}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="">Select a niche</option>
                  <option value="fashion">Fashion & Lifestyle</option>
                  <option value="beauty">Beauty & Skincare</option>
                  <option value="food">Food & Culinary</option>
                  <option value="tech">Technology & Gadget</option>
                  <option value="travel">Travel</option>
                  <option value="health">Health & Fitness</option>
                  <option value="gaming">Gaming</option>
                  <option value="education">Education</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Audience *
                </label>
                <input
                  type="text"
                  name="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Women 18-35 in Jakarta"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Goal *
                </label>
                <textarea
                  name="campaignGoal"
                  value={formData.campaignGoal}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Describe what you want to achieve with this campaign..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full text-lg py-4"
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                    Finding matches...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faRobot} className="mr-2" />
                    Get AI Recommendations
                  </>
                )}
              </button>
            </form>

            {recommendations && (
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <p className="text-gray-700">{recommendations.message}</p>
                <p className="text-sm text-gray-500 mt-4">
                  Feature coming soon! For now, please browse our influencers manually.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 text-center text-sm text-gray-600">
            <p>Our AI analyzes your requirements to match you with the best influencers</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIRecommendations
