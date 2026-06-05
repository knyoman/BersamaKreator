import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminAIMonitorPage from './admin/AdminAIMonitorPage';
import AdminCampaignsPage from './admin/AdminCampaignsPage';
import AdminComingSoonPage from './admin/AdminComingSoonPage';
import AdminContentModerationPage from './admin/AdminContentModerationPage';
import AdminInfluencersPage from './admin/AdminInfluencersPage';
import AdminInsightsPage from './admin/AdminInsightsPage';
import AdminOverviewPage from './admin/AdminOverviewPage';
import AdminPaymentsPage from './admin/AdminPaymentsPage';
import AdminReportsPage from './admin/AdminReportsPage';
import AdminReviewsPage from './admin/AdminReviewsPage';
import AdminSettingsPage from './admin/AdminSettingsPage';
import AdminSMEsPage from './admin/AdminSMEsPage';
import AdminSupportPage from './admin/AdminSupportPage';
import AdminUsersPage from './admin/AdminUsersPage';
import AdminVerificationPage from './admin/AdminVerificationPage';
import AdminWorkspaceLayout from './admin/AdminWorkspaceLayout';
import { adminNavItems, adminPageDetails } from './admin/adminWorkspaceConfig';

const adminRoutes = adminNavItems.filter((item) => ![
  'overview',
  'users',
  'influencers',
  'smes',
  'campaigns',
  'payments',
  'reviews',
  'verification',
  'content-moderation',
  'ai-monitor',
  'insights',
  'reports',
  'support',
  'settings',
].includes(item.path));

const AdminDashboard = () => {
  const { userProfile } = useAuth();

  return (
    <AdminWorkspaceLayout userProfile={userProfile}>
      <Routes>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<AdminOverviewPage userProfile={userProfile} />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="influencers" element={<AdminInfluencersPage />} />
        <Route path="smes" element={<AdminSMEsPage />} />
        <Route path="campaigns" element={<AdminCampaignsPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="reviews" element={<AdminReviewsPage />} />
        <Route path="verification" element={<AdminVerificationPage />} />
        <Route path="content-moderation" element={<AdminContentModerationPage />} />
        <Route path="ai-monitor" element={<AdminAIMonitorPage />} />
        <Route path="insights" element={<AdminInsightsPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="support" element={<AdminSupportPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        {adminRoutes.map((item) => (
          <Route
            key={item.path}
            path={item.path}
            element={(
              <AdminComingSoonPage
                page={{
                  ...item,
                  details: adminPageDetails[item.path],
                }}
              />
            )}
          />
        ))}
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </AdminWorkspaceLayout>
  );
};

export default AdminDashboard;
