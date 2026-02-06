import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faSpinner, faLightbulb, faClock, faExclamationTriangle, faSync } from '@fortawesome/free-solid-svg-icons';

const AIRecommendations = () => {
  const [formData, setFormData] = useState({
    budget: '',
    niche: '',
    targetAudience: '',
    campaignGoal: '',
  });
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState(null); // NEW: Error state

  // Anti-bot protection states
  const [honeypot, setHoneypot] = useState('');
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const COOLDOWN_SECONDS = 60;
  const STORAGE_KEY = 'ai_recommendations_last_request';

  // Check and update cooldown timer on mount and when localStorage changes
  useEffect(() => {
    const checkCooldown = () => {
      const lastRequestTime = localStorage.getItem(STORAGE_KEY);
      if (lastRequestTime) {
        const elapsed = (Date.now() - parseInt(lastRequestTime)) / 1000;
        const remaining = Math.max(0, Math.ceil(COOLDOWN_SECONDS - elapsed));
        setCooldownRemaining(remaining);
      }
    };

    checkCooldown();

    // Update countdown every second
    const interval = setInterval(() => {
      checkCooldown();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Extracted fetch logic for reuse
  const fetchAIRecommendations = async () => {
    setLoading(true);
    setRecommendations(null);
    setError(null);

    try {
      const aiUrl = import.meta.env.VITE_EDGE_FUNCTION_AI_URL;
      const isConfigured = aiUrl && !aiUrl.includes('your-edgeone-domain');

      let resultData;

      if (isConfigured) {
        // 1. Production/Test Mode: Call Edge Function
        console.log('📤 Sending request to:', aiUrl);

        const response = await fetch(aiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            _honeypot: honeypot, // Backend will verify this is empty
          }),
        });

        const result = await response.json();
        console.log('📥 API Response:', result);

        // Handle API errors gracefully
        if (!response.ok) {
          // Different error messages based on status code
          if (response.status === 401) {
            throw new Error('⚠️ Authentication failed. Please check API configuration.');
          } else if (response.status === 429) {
            throw new Error('⏳ Too many requests. Please wait a moment and try again.');
          } else if (response.status === 503 || response.status === 504) {
            throw new Error('🔄 AI service is temporarily busy. Please try again in 30 seconds.');
          } else {
            throw new Error(result.error || `❌ Server error (${response.status})`);
          }
        }

        // Validate response has data
        if (!result.data || !result.data.influencers) {
          throw new Error('❌ Invalid response from server. Please try again.');
        }

        resultData = result.data;
        console.log('✅ Result Data:', resultData);
      } else {
        // 2. Not Configured
        throw new Error('⚙️ AI Backend URL is not configured. Please check .env.local');
      }

      setRecommendations(resultData);
    } catch (error) {
      console.error('❌ AI Error:', error);

      // Determine error type and set appropriate message
      let errorMessage = '❌ Oops! Something went wrong.';

      if (error.message) {
        errorMessage = error.message;
      }

      // Network errors
      if (error instanceof TypeError) {
        errorMessage = '🌐 Network error. Please check your internet connection.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ========== ANTI-BOT CHECK 1: HONEYPOT ==========
    // If honeypot field is filled, it's a bot (humans can't see this field)
    if (honeypot !== '') {
      console.warn('🤖 Bot detected: Honeypot field was filled');
      // Silent rejection - don't give feedback to bots
      return;
    }

    // ========== ANTI-BOT CHECK 2: COOLDOWN ==========
    const now = Date.now();
    const lastRequestTime = localStorage.getItem(STORAGE_KEY);

    if (lastRequestTime) {
      const elapsed = (now - parseInt(lastRequestTime)) / 1000;
      if (elapsed < COOLDOWN_SECONDS) {
        const remaining = Math.ceil(COOLDOWN_SECONDS - elapsed);
        setError(`⏱️ Please wait ${remaining} seconds before submitting again to prevent spam.`);
        return;
      }
    }

    // Save request timestamp
    localStorage.setItem(STORAGE_KEY, now.toString());
    setCooldownRemaining(COOLDOWN_SECONDS);

    // Call the extracted fetch function
    await fetchAIRecommendations();
  };

  // Retry handler (resubmit form without cooldown reset)
  const handleRetry = () => {
    setError(null);
    fetchAIRecommendations();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-custom py-16 text-center">
          <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon icon={faRobot} className="text-white text-3xl" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">AI Recommendations</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Let our AI find the perfect influencer match for your campaign</p>
        </div>
      </div>

      {/* Form */}
      <div className="container-custom py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center mb-6">
              <FontAwesomeIcon icon={faLightbulb} className="text-primary-600 text-2xl mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Tell us about your campaign</h2>
            </div>

            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Goal *</label>
                <textarea
                  name="campaignGoal"
                  value={formData.campaignGoal}
                  onChange={handleChange}
                  required
                  rows={3}
                  placeholder="Describe what you want to achieve (e.g., Increase brand awareness for new coffee shop in Jakarta South)..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Budget (IDR) *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Niche/Industry *</label>
                <select name="niche" value={formData.niche} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent">
                  <option value="">Select a niche</option>
                  <option value="fashion">Fashion & Lifestyle</option>
                  <option value="beauty">Beauty & Skincare</option>
                  <option value="food">Food & Culinary</option>
                  <option value="tech">Technology & Gadget</option>
                  <option value="travel">Travel</option>
                  <option value="health">Health & Fitness</option>
                  <option value="gaming">Gaming</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience *</label>
                <input
                  type="text"
                  name="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Women 18-35 in Jakarta who love skincare"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              {/* ===== HONEYPOT FIELD (HIDDEN - CATCHES BOTS) ===== */}
              <input
                type="text"
                name="website_url"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{
                  position: 'absolute',
                  left: '-9999px',
                  opacity: 0,
                  pointerEvents: 'none',
                  width: '1px',
                  height: '1px',
                }}
                tabIndex="-1"
                autoComplete="off"
                aria-hidden="true"
              />

              <div className="md:col-span-2 mt-4">
                {cooldownRemaining > 0 && (
                  <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                    <FontAwesomeIcon icon={faClock} className="text-yellow-600 mr-2" />
                    <span className="text-sm text-yellow-800">
                      Please wait <strong>{cooldownRemaining}s</strong> before submitting again
                    </span>
                  </div>
                )}

                <button type="submit" disabled={loading || cooldownRemaining > 0} className="btn btn-primary w-full text-lg py-4 shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                      Analyzing Database with AI...
                    </>
                  ) : cooldownRemaining > 0 ? (
                    <>
                      <FontAwesomeIcon icon={faClock} className="mr-2" />
                      Wait {cooldownRemaining}s
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faRobot} className="mr-2" />
                      Get AI Recommendations
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ERROR ALERT SECTION */}
          {error && (
            <div className="mt-8 animate-fade-in-up">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 pt-1">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 text-2xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-900 mb-1">Unable to Get Recommendations</h3>
                    <p className="text-red-700 mb-4">{error}</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button onClick={handleRetry} className="inline-flex items-center justify-center px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors">
                        <FontAwesomeIcon icon={faSync} className="mr-2" />
                        Try Again
                      </button>
                      <button onClick={() => setError(null)} className="inline-flex items-center justify-center px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-medium rounded-lg transition-colors">
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {recommendations && (
            <div className="mt-12 animate-fade-in-up">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
                  <span className="text-4xl">🤖</span>
                  AI Matched Influencers
                </h3>
                <p className="text-gray-600">Based on your campaign requirements</p>
              </div>

              <div className="grid gap-8">
                {recommendations.influencers && recommendations.influencers.length > 0 ? (
                  recommendations.influencers.map((inf, index) => (
                    <div key={inf.id} className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                      <div className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Left: Profile Image & Score */}
                          <div className="flex-shrink-0 flex flex-col items-center gap-4">
                            <div className="relative">
                              <img
                                src={inf.users?.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(inf.users?.name || 'User')}&size=120&background=6366f1&color=fff`}
                                alt={inf.users?.name}
                                className="w-24 h-24 rounded-full object-cover border-4 border-primary-100 shadow-md"
                              />
                              {inf.is_verified && (
                                <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white rounded-full p-1.5 shadow-lg">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* Match Score Badge */}
                            <div className="relative">
                              <svg className="w-20 h-20 transform -rotate-90">
                                <circle cx="40" cy="40" r="32" stroke="#e5e7eb" strokeWidth="6" fill="none" />
                                <circle
                                  cx="40"
                                  cy="40"
                                  r="32"
                                  stroke={inf.match_score >= 85 ? '#10b981' : inf.match_score >= 70 ? '#f59e0b' : '#6366f1'}
                                  strokeWidth="6"
                                  fill="none"
                                  strokeDasharray={`${inf.match_score * 2} 200`}
                                  className="transition-all duration-1000"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-gray-900">{inf.match_score}</span>
                                <span className="text-xs text-gray-500 font-medium">MATCH</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Details */}
                          <div className="flex-1 space-y-4">
                            {/* Header */}
                            <div>
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div>
                                  <h4 className="text-2xl font-bold text-gray-900 mb-1">{inf.users?.name || 'Unknown Influencer'}</h4>
                                  <p className="text-gray-600">@{inf.username}</p>
                                </div>
                                <span className="px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-semibold">{inf.niche}</span>
                              </div>

                              {inf.bio && <p className="text-gray-600 text-sm mt-2">{inf.bio}</p>}
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Followers</div>
                                <div className="text-lg font-bold text-gray-900">{inf.followers_count ? (inf.followers_count / 1000).toFixed(0) + 'K' : 'N/A'}</div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Engagement</div>
                                <div className="text-lg font-bold text-green-600">{inf.engagement_rate ? inf.engagement_rate.toFixed(1) + '%' : 'N/A'}</div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Rating</div>
                                <div className="text-lg font-bold text-yellow-600">★ {inf.rating_average?.toFixed(1) || '0.0'}</div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3 text-center">
                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Orders</div>
                                <div className="text-lg font-bold text-gray-900">{inf.total_orders || 0}</div>
                              </div>
                            </div>

                            {/* AI Reasoning */}
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-1">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <FontAwesomeIcon icon={faRobot} className="text-white text-sm" />
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-1">AI Analysis</p>
                                  <p className="text-sm text-gray-700 leading-relaxed italic">"{inf.reasoning}"</p>
                                </div>
                              </div>
                            </div>

                            {/* Social Links & Price */}
                            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-200">
                              <div className="flex items-center gap-3">
                                {inf.instagram_url && (
                                  <a
                                    href={inf.instagram_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white hover:scale-110 transition-transform">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                    </svg>
                                  </a>
                                )}
                                {inf.tiktok_url && (
                                  <a href={inf.tiktok_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center text-white hover:scale-110 transition-transform">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                                    </svg>
                                  </a>
                                )}
                                {inf.youtube_url && (
                                  <a href={inf.youtube_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white hover:scale-110 transition-transform">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                    </svg>
                                  </a>
                                )}
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="text-xs text-gray-500 uppercase tracking-wide">Price/Post</div>
                                  <div className="text-2xl font-bold text-gray-900">Rp {parseInt(inf.price_per_post).toLocaleString('id-ID')}</div>
                                </div>
                                <button className="btn btn-primary px-6 py-3 text-base">Book Now</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                    <div className="text-6xl mb-4">🔍</div>
                    <p className="text-xl font-semibold text-gray-900 mb-2">No matches found</p>
                    <p className="text-gray-500">Try adjusting your budget or niche filters</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIRecommendations;
