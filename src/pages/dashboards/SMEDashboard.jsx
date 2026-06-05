import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSMEOrders } from '../../features/sme/useSMEOrders';
import SMEAIAssistantPage from './sme/SMEAIAssistantPage';
import SMEBusinessProfilePage from './sme/SMEBusinessProfilePage';
import SMECampaignsPage from './sme/SMECampaignsPage';
import SMEInfluencerSearchPage from './sme/SMEInfluencerSearchPage';
import SMEInsightsPage from './sme/SMEInsightsPage';
import SMEOverviewPage from './sme/SMEOverviewPage';
import SMEPaymentsPage from './sme/SMEPaymentsPage';
import SMEReviewsPage from './sme/SMEReviewsPage';
import SMEShortlistPage from './sme/SMEShortlistPage';
import SMEWorkspaceLayout from './sme/SMEWorkspaceLayout';

const SMEDashboard = () => {
  const { user, userProfile, setUserProfile } = useAuth();
  const ordersState = useSMEOrders(user?.id);

  return (
    <SMEWorkspaceLayout userProfile={userProfile}>
      <Routes>
        <Route index element={<Navigate to="overview" replace />} />
        <Route
          path="overview"
          element={(
            <SMEOverviewPage
              userProfile={userProfile}
              orders={ordersState.orders}
              loading={ordersState.loading}
              error={ordersState.error}
              stats={ordersState.stats}
            />
          )}
        />
        <Route
          path="campaigns"
          element={(
            <SMECampaignsPage
              orders={ordersState.orders}
              loading={ordersState.loading}
              error={ordersState.error}
              onRefresh={ordersState.refresh}
            />
          )}
        />
        <Route path="influencers" element={<SMEInfluencerSearchPage />} />
        <Route path="shortlist" element={<SMEShortlistPage />} />
        <Route path="ai-assistant" element={<SMEAIAssistantPage />} />
        <Route path="ai-brief" element={<Navigate to="/dashboard/ai-assistant" replace />} />
        <Route
          path="payments"
          element={(
            <SMEPaymentsPage
              orders={ordersState.orders}
              loading={ordersState.loading}
              stats={ordersState.stats}
            />
          )}
        />
        <Route
          path="reviews"
          element={(
            <SMEReviewsPage
              orders={ordersState.orders}
              loading={ordersState.loading}
            />
          )}
        />
        <Route
          path="insights"
          element={(
            <SMEInsightsPage
              orders={ordersState.orders}
              loading={ordersState.loading}
              stats={ordersState.stats}
            />
          )}
        />
        <Route
          path="business-profile"
          element={(
            <SMEBusinessProfilePage
              userProfile={userProfile}
              setUserProfile={setUserProfile}
            />
          )}
        />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </SMEWorkspaceLayout>
  );
};

export default SMEDashboard;
