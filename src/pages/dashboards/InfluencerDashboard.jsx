import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInfluencerId, useInfluencerOrders } from '../../features/influencer/useInfluencerOrders';
import { useInfluencerReviews } from '../../features/influencer/useInfluencerReviews';
import InfluencerAIAssistantPage from './influencer/InfluencerAIAssistantPage';
import InfluencerAvailabilityPage from './influencer/InfluencerAvailabilityPage';
import InfluencerCampaignsPage from './influencer/InfluencerCampaignsPage';
import InfluencerEarningsPage from './influencer/InfluencerEarningsPage';
import InfluencerOverviewPage from './influencer/InfluencerOverviewPage';
import InfluencerPerformancePage from './influencer/InfluencerPerformancePage';
import InfluencerPortfolioPage from './influencer/InfluencerPortfolioPage';
import InfluencerPricingPage from './influencer/InfluencerPricingPage';
import InfluencerReviewsPage from './influencer/InfluencerReviewsPage';
import InfluencerWorkspaceLayout from './influencer/InfluencerWorkspaceLayout';

const InfluencerDashboard = () => {
  const { userProfile, setUserProfile } = useAuth();
  const influencerId = getInfluencerId(userProfile);
  const ordersState = useInfluencerOrders(influencerId);
  const reviewsState = useInfluencerReviews(influencerId);

  return (
    <InfluencerWorkspaceLayout userProfile={userProfile}>
      <Routes>
        <Route index element={<Navigate to="overview" replace />} />
        <Route
          path="overview"
          element={(
            <InfluencerOverviewPage
              userProfile={userProfile}
              setUserProfile={setUserProfile}
              orders={ordersState.orders}
              ordersLoading={ordersState.loading}
              stats={ordersState.stats}
              reviewsLoading={reviewsState.loading}
              reviewStats={reviewsState.stats}
            />
          )}
        />
        <Route
          path="portfolio"
          element={<InfluencerPortfolioPage influencerId={influencerId} />}
        />
        <Route
          path="performance"
          element={(
            <InfluencerPerformancePage
              influencerId={influencerId}
              userProfile={userProfile}
              orders={ordersState.orders}
              ordersLoading={ordersState.loading}
              reviewStats={reviewsState.stats}
              reviewsLoading={reviewsState.loading}
            />
          )}
        />
        <Route
          path="ai-assistant"
          element={<InfluencerAIAssistantPage />}
        />
        <Route
          path="pricing"
          element={<InfluencerPricingPage influencerId={influencerId} />}
        />
        <Route
          path="availability"
          element={<InfluencerAvailabilityPage influencerId={influencerId} />}
        />
        <Route
          path="campaigns"
          element={(
            <InfluencerCampaignsPage
              orders={ordersState.orders}
              loading={ordersState.loading}
              error={ordersState.error}
              onRefresh={ordersState.refresh}
            />
          )}
        />
        <Route
          path="earnings"
          element={(
            <InfluencerEarningsPage
              orders={ordersState.orders}
              loading={ordersState.loading}
              error={ordersState.error}
            />
          )}
        />
        <Route
          path="reviews"
          element={(
            <InfluencerReviewsPage
              reviews={reviewsState.reviews}
              loading={reviewsState.loading}
              error={reviewsState.error}
              stats={reviewsState.stats}
              onRefresh={reviewsState.refresh}
            />
          )}
        />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </InfluencerWorkspaceLayout>
  );
};

export default InfluencerDashboard;
