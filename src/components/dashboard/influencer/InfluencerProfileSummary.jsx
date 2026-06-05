import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faPen, faUser } from '@fortawesome/free-solid-svg-icons';
import { faInstagram, faTiktok, faYoutube } from '@fortawesome/free-brands-svg-icons';

const formatCurrency = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
}).format(Number(value || 0));

const getSocialLinks = (profile) => [
  { key: 'instagram', label: 'Instagram', url: profile?.instagram_url, icon: faInstagram },
  { key: 'tiktok', label: 'TikTok', url: profile?.tiktok_url, icon: faTiktok },
  { key: 'youtube', label: 'YouTube', url: profile?.youtube_url, icon: faYoutube },
].filter((social) => social.url);

const InfluencerProfileSummary = ({ profile, onEditProfile }) => {
  const socialLinks = getSocialLinks(profile);

  return (
    <aside className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-sm font-semibold text-gray-500 uppercase">Profil Publik</p>
          <h2 className="text-xl font-bold text-gray-900 mt-1">Ringkasan Kreator</h2>
        </div>
        <button
          onClick={onEditProfile}
          className="w-10 h-10 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-900 hover:text-white transition-colors"
          title="Edit profil"
          type="button"
        >
          <FontAwesomeIcon icon={faPen} />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
          {profile?.profile_image ? (
            <img src={profile.profile_image} alt="Profil" className="w-full h-full object-cover" />
          ) : (
            <FontAwesomeIcon icon={faUser} className="text-3xl text-gray-500" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 text-lg truncate">{profile?.name || 'Nama belum diisi'}</h3>
          <p className="text-gray-500 truncate">@{profile?.username || 'username-belum-diisi'}</p>
          <div className={`inline-flex items-center gap-2 text-xs font-semibold rounded-full px-3 py-1 mt-2 ${
            profile?.is_verified ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
          }`}>
            <FontAwesomeIcon icon={faCheckCircle} />
            {profile?.is_verified ? 'Terverifikasi' : 'Menunggu verifikasi'}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase">Niche</p>
          <p className="font-semibold text-gray-900 mt-1">{profile?.niche || 'Belum diisi'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase">Harga per posting</p>
          <p className="font-semibold text-gray-900 mt-1">{formatCurrency(profile?.price_per_post)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase">Bio</p>
          <p className="text-sm text-gray-600 mt-1 line-clamp-3">{profile?.bio || 'Bio belum diisi.'}</p>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Link Sosial</p>
        {socialLinks.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada link sosial.</p>
        ) : (
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.key}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-900 hover:text-white flex items-center justify-center transition-colors"
                title={social.label}
              >
                <FontAwesomeIcon icon={social.icon} />
              </a>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

export default InfluencerProfileSummary;
