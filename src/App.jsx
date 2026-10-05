import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import SuperAdminPage from './pages/SuperAdminPage'
import POSPage from './pages/POSPage'
import POSDashboardPage from './pages/POSDashboardPage'
import AppointmentPage from './pages/AppointmentPage'
import CRMPage from './pages/CRMPage'
import InventoryPage from './pages/InventoryPage'
import DisposablesPage from './pages/DisposablesPage'
import TrendsPage from './pages/TrendsPage'
import ExpensesPage from './pages/ExpensesPage'
import ReportsPage from './pages/ReportsPage'
import MasterBOPage from './pages/MasterBOPage'
import StaffManagementPage from './pages/StaffManagementPage'
import CashierManagementPage from './pages/CashierManagementPage'
import SettingsPage from './pages/SettingsPage'
import PermissionsPage from './pages/PermissionsPage'
import CashManagementPage from './pages/CashManagementPage'
import DashboardLayout from './components/layout/DashboardLayout'
import { getCurrentUser, getCashierPermissions, getActiveTenant, isPlanFeatureAllowed } from './utils/saasStorage'

const RoleGuard = ({ allowedRoles, moduleKey, children, fallback = '/pos' }) => {
  const user = getCurrentUser();
  const tenant = getActiveTenant();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectPath = user.role === 'STAFF' ? '/appointment' : fallback;
    return <Navigate to={redirectPath} replace />;
  }
  // Check Cashier module permissions
  if (user.role === 'CASHIER' && moduleKey) {
    const permissions = getCashierPermissions();
    if (!permissions[moduleKey]) {
      return <Navigate to="/pos" replace />;
    }
  }
  // Check Subscription Plan Feature Gating (Super Admin bypasses)
  if (user.role !== 'SUPER_ADMIN' && moduleKey) {
    if (!isPlanFeatureAllowed(tenant, moduleKey)) {
      return <Navigate to="/pos" replace />;
    }
  }
  return children;
};

function App() {
  const adminOnly = ['COMPANY_ADMIN', 'ADMIN', 'SUPER_ADMIN'];
  const cashierAllowed = ['COMPANY_ADMIN', 'ADMIN', 'SUPER_ADMIN', 'CASHIER'];
  const allStaffAllowed = ['COMPANY_ADMIN', 'ADMIN', 'SUPER_ADMIN', 'CASHIER', 'STAFF'];

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/super-admin" element={<SuperAdminPage />} />
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/pos" replace />} />
          <Route path="pos" element={
            <RoleGuard allowedRoles={cashierAllowed} moduleKey="pos" fallback="/appointment">
              <POSPage />
            </RoleGuard>
          } />
          <Route path="pos-dashboard" element={<Navigate to="/pos" replace />} />
          <Route path="appointment" element={
            <RoleGuard allowedRoles={allStaffAllowed} moduleKey="appointment">
              <AppointmentPage />
            </RoleGuard>
          } />
          <Route path="crm" element={
            <RoleGuard allowedRoles={cashierAllowed} moduleKey="crm">
              <CRMPage />
            </RoleGuard>
          } />
          <Route path="reports" element={
            <RoleGuard allowedRoles={cashierAllowed} moduleKey="reports">
              <ReportsPage />
            </RoleGuard>
          } />
          <Route path="inventory" element={
            <RoleGuard allowedRoles={cashierAllowed} moduleKey="inventory">
              <InventoryPage />
            </RoleGuard>
          } />
          <Route path="disposables" element={<Navigate to="/master-bo?tab=Disposables" replace />} />
          <Route path="trends" element={
            <RoleGuard allowedRoles={cashierAllowed} moduleKey="trends">
              <TrendsPage />
            </RoleGuard>
          } />
          <Route path="cash-mgmt" element={
            <RoleGuard allowedRoles={cashierAllowed} moduleKey="cashMgmt">
              <CashManagementPage />
            </RoleGuard>
          } />
          <Route path="master-bo" element={
            <RoleGuard allowedRoles={cashierAllowed} moduleKey="masterBo">
              <MasterBOPage />
            </RoleGuard>
          } />
          <Route path="staff-management" element={
            <RoleGuard allowedRoles={cashierAllowed} moduleKey="staffManagement">
              <StaffManagementPage />
            </RoleGuard>
          } />
          <Route path="staff" element={<Navigate to="/staff-management" replace />} />
          <Route path="cashier-management" element={
            <RoleGuard allowedRoles={adminOnly}>
              <CashierManagementPage />
            </RoleGuard>
          } />
          <Route path="cashier" element={<Navigate to="/cashier-management" replace />} />
          <Route path="permissions" element={
            <RoleGuard allowedRoles={adminOnly}>
              <PermissionsPage />
            </RoleGuard>
          } />
          <Route path="settings" element={
            <RoleGuard allowedRoles={cashierAllowed} moduleKey="settings">
              <SettingsPage />
            </RoleGuard>
          } />
          <Route path="expenses" element={
            <RoleGuard allowedRoles={cashierAllowed} moduleKey="expenses">
              <ExpensesPage />
            </RoleGuard>
          } />
          <Route path="payroll" element={<Navigate to="/staff-management" replace />} />
          <Route path="enquiries" element={<Navigate to="/pos" replace />} />
          <Route path="whatsapp" element={<Navigate to="/pos" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
