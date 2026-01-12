import { useEffect, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Forbidden from '../errors/Forbidden';
import Loading from '../../components/Loading';
import AdminLoginPage from './pages/Login';
import { AdminLayout } from './components/AdminLayout';
import { DashboardPage } from './pages/Dashboard';
import { UserList } from './pages/users/index';
import { ReportList } from './pages/reports/index';
import { OnboardingList } from './pages/onboarding/OnboardingList';
import { FeedbackList } from './pages/feedback/FeedbackList';
import { AdminList } from './pages/admins/index';
import { Metrics as MetricsPage } from './pages/Metrics';
import { Maintenance as MaintenancePage } from './pages/Maintenance';
import { AnimationManager as AnimationsPage } from './pages/Animations';
import { HomepageAds as AdsPage } from './pages/Ads';

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // List of admin emails
  const ADMIN_EMAILS = ['info.ops.chirp@gmail.com'];

  useEffect(() => {
    // Must have user loaded to check admin status
    if (!user || !user._id) {
      // User not loaded yet - wait
      return;
    }

    console.log('[AdminDashboard] Checking access:', {
      email: user.email,
      emailVerified: user.emailVerified,
      isAdmin: ADMIN_EMAILS.includes(user.email)
    });

    // Check if user is admin email AND verified
    const isAdmin = ADMIN_EMAILS.includes(user.email) && user.emailVerified;

    if (isAdmin) {
      console.log('[AdminDashboard] Admin access granted');
      setHasAccess(true);
    } else {
      console.log('[AdminDashboard] Admin access denied - not an admin user');
      setHasAccess(false);
    }
    
    setLoading(false);
  }, [user]);

  const isLoginPage = location.pathname === '/admin/login';

  // Show loading while checking auth
  if (loading) {
    return <Loading />;
  }

  // Show forbidden if not admin (for ALL admin routes including login)
  if (!hasAccess) {
    return <Forbidden />;
  }

  // Show login page only for admin users
  if (isLoginPage) {
    return (
      <Routes>
        <Route path="login" element={<AdminLoginPage />} />
      </Routes>
    );
  }

  // Show admin pages with layout
  return (
    <AdminLayout>
      <Routes>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="metrics" element={<MetricsPage />} />
        <Route path="reports" element={<ReportList />} />
        <Route path="users" element={<UserList />} />
        <Route path="admins" element={<AdminList />} />
        <Route path="onboarding" element={<OnboardingList />} />
        <Route path="feedback" element={<FeedbackList />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="animations" element={<AnimationsPage />} />
        <Route path="ads" element={<AdsPage />} />
        <Route path="*" element={<Forbidden />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard;
