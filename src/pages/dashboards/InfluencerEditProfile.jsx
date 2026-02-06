import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes, faSpinner, faCamera } from '@fortawesome/free-solid-svg-icons';
import { updateUserProfile } from '../../services/api';

const InfluencerEditProfile = ({ userProfile, onClose, onUpdateSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    niche: '',
    price_per_post: '',
    bio: '',
    instagram_url: '',
    tiktok_url: '',
    youtube_url: '',
    profile_image: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        username: userProfile.username || '',
        phone: userProfile.phone || '',
        niche: userProfile.niche || '',
        price_per_post: userProfile.price_per_post || '',
        bio: userProfile.bio || '',
        instagram_url: userProfile.instagram_url || '',
        tiktok_url: userProfile.tiktok_url || '',
        youtube_url: userProfile.youtube_url || '',
        profile_image: userProfile.profile_image || ''
      });
    }
  }, [userProfile]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await updateUserProfile(userProfile.id, formData);
      
      if (error) {
        throw error;
      }

      onUpdateSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-fade-in-up">
        {/* Header - Sticky */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center flex-shrink-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
            <p className="text-sm text-gray-500">Update your public presence</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
          
          <form id="editProfileForm" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100 flex items-start gap-3">
                 <div className="bg-red-100 p-1 rounded-full"><FontAwesomeIcon icon={faTimes} className="w-3 h-3"/></div>
                 {error}
              </div>
            )}

            {/* Section: Identity */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 border-l-4 border-primary-500 pl-3">Identity</h3>
              
              {/* Profile Image URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Image</label>
                <div className="flex gap-6 items-center">
                   <div className="w-24 h-24 bg-gray-100 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center border-4 border-white shadow-md">
                      {formData.profile_image ? (
                        <img src={formData.profile_image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <FontAwesomeIcon icon={faCamera} className="text-3xl text-gray-400" />
                      )}
                   </div>
                   <div className="flex-1">
                     <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Image URL</label>
                     <input
                      type="text"
                      name="profile_image"
                      value={formData.profile_image}
                      onChange={handleChange}
                      placeholder="https://example.com/photo.jpg"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all"
                    />
                    <p className="text-xs text-gray-400 mt-2">Paste a link to your photo (e.g. from Google Drive, etc).</p>
                   </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-gray-400 font-medium">@</span>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      placeholder="sarah.grams"
                      className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="my-8 border-gray-100" />

            {/* Section: Professional Info */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 border-l-4 border-primary-500 pl-3">Professional Info</h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Niche / Category</label>
                  <input
                    type="text"
                    name="niche"
                    value={formData.niche}
                    onChange={handleChange}
                    placeholder="e.g. Beauty, Tech, Travel"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price per Post (IDR)</label>
                  <div className="relative">
                     <span className="absolute left-4 top-3.5 text-gray-500 font-medium">Rp</span>
                    <input
                      type="number"
                      name="price_per_post"
                      value={formData.price_per_post}
                      onChange={handleChange}
                      placeholder="150000"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Tell SMEs about your audience and content style..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all resize-none"
                />
              </div>
            </div>

            <hr className="my-8 border-gray-100" />

            {/* Section: Social Media */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 border-l-4 border-primary-500 pl-3">Social Media Links</h3>
              
              <div className="grid gap-4">
                <div className="flex gap-3 items-center">
                   <div className="w-10 flex justify-center text-pink-600"><FontAwesomeIcon icon={["fab", "instagram"]} size="xl" /></div>
                   <input
                    type="text"
                    name="instagram_url"
                    value={formData.instagram_url}
                    onChange={handleChange}
                    placeholder="Instagram Profile URL"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
                <div className="flex gap-3 items-center">
                   <div className="w-10 flex justify-center text-black"><FontAwesomeIcon icon={["fab", "tiktok"]} size="xl" /></div>
                   <input
                    type="text"
                    name="tiktok_url"
                    value={formData.tiktok_url}
                    onChange={handleChange}
                    placeholder="TikTok Profile URL"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
                <div className="flex gap-3 items-center">
                   <div className="w-10 flex justify-center text-red-600"><FontAwesomeIcon icon={["fab", "youtube"]} size="xl" /></div>
                   <input
                    type="text"
                    name="youtube_url"
                    value={formData.youtube_url}
                    onChange={handleChange}
                    placeholder="YouTube Channel URL"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer - Sticky */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4 flex-shrink-0 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-white hover:shadow-md transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="editProfileForm"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                Saving Changes...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} className="mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfluencerEditProfile;
