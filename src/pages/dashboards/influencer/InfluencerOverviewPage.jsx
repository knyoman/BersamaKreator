import { useMemo, useState } from 'react';
import InfluencerCampaignTable from '../../../components/dashboard/influencer/InfluencerCampaignTable';
import InfluencerEditProfileModal from '../../../components/dashboard/influencer/InfluencerEditProfileModal';
import InfluencerProfileCompletionCard from '../../../components/dashboard/influencer/InfluencerProfileCompletionCard';
import InfluencerProfileSummary from '../../../components/dashboard/influencer/InfluencerProfileSummary';
import InfluencerStatsGrid from '../../../components/dashboard/influencer/InfluencerStatsGrid';
import { getInfluencerProfileCompletion } from '../../../features/influencer/profileCompletion';

const InfluencerOverviewPage = ({
  userProfile,
  setUserProfile,
  orders,
  ordersLoading,
  stats,
  reviewsLoading,
  reviewStats,
}) => {
  const [showEditProfile, setShowEditProfile] = useState(false);
  const profileCompletion = useMemo(
    () => getInfluencerProfileCompletion(userProfile),
    [userProfile],
  );

  const handleProfileUpdate = (updatedProfile) => {
    setUserProfile((currentProfile) => ({
      ...currentProfile,
      ...updatedProfile,
    }));
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold text-gray-500 uppercase">Ringkasan</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-1">Dasbor Influencer</h1>
        <p className="text-gray-600 mt-2">Selamat datang kembali, {userProfile?.name || 'Kreator'}.</p>
      </header>

      <InfluencerStatsGrid
        loading={ordersLoading}
        reviewLoading={reviewsLoading}
        stats={stats}
        reviewStats={reviewStats}
      />

      <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-8 items-start">
        <InfluencerProfileCompletionCard
          completion={profileCompletion}
          onEditProfile={() => setShowEditProfile(true)}
        />
        <InfluencerProfileSummary
          profile={userProfile}
          onEditProfile={() => setShowEditProfile(true)}
        />
      </div>

      <InfluencerCampaignTable loading={ordersLoading} orders={orders} />

      {showEditProfile && (
        <InfluencerEditProfileModal
          userProfile={userProfile}
          onClose={() => setShowEditProfile(false)}
          onUpdateSuccess={handleProfileUpdate}
        />
      )}
    </div>
  );
};

export default InfluencerOverviewPage;
