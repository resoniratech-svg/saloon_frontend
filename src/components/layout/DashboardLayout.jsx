import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import TopNavBar from './TopNavBar';
import Sidebar from './Sidebar';
import ErrorBoundary from '../common/ErrorBoundary';
import { Eye, LogOut } from 'lucide-react';
import {
  isImpersonating,
  stopImpersonation,
  getActiveTenant
} from '../../utils/saasStorage';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [impersonating, setImpersonating] = useState(() => isImpersonating());
  const [tenant, setTenant] = useState(() => getActiveTenant());
  const navigate = useNavigate();

  useEffect(() => {
    const handleSync = () => {
      setImpersonating(isImpersonating());
      setTenant(getActiveTenant());
    };

    window.addEventListener('impersonationChanged', handleSync);
    window.addEventListener('saasUserChanged', handleSync);
    window.addEventListener('tenantChanged', handleSync);

    return () => {
      window.removeEventListener('impersonationChanged', handleSync);
      window.removeEventListener('saasUserChanged', handleSync);
      window.removeEventListener('tenantChanged', handleSync);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleExitImpersonation = () => {
    stopImpersonation();
    navigate('/super-admin');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-hidden">
      {/* Super Admin Read-Only Impersonation Warning Banner */}
      {impersonating && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 shadow-md z-50 sticky top-0 border-b border-amber-500">
          <div className="flex items-center gap-2.5 font-medium">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-white shrink-0 animate-pulse">
              <Eye size={14} />
            </span>
            <span>
              <strong className="font-bold uppercase tracking-wider text-amber-200">Impersonation Mode (Read-Only)</strong>
              {' — '}Viewing <strong>{tenant?.companyName || 'Company Portal'}</strong> as Platform Super Admin. <span className="opacity-90 hidden sm:inline">All bookings, edits, and deletions are disabled.</span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleExitImpersonation}
            className="flex items-center gap-1.5 bg-white text-slate-900 hover:bg-amber-50 font-bold px-3 py-1 rounded-lg text-xs transition-all shadow-xs cursor-pointer shrink-0 active:scale-95"
            title="Exit Impersonation and return to Super Admin Console"
          >
            <LogOut size={13} className="text-rose-600" />
            <span>Exit Impersonation ➔ Return to Super Admin</span>
          </button>
        </div>
      )}

      {/* Top Navigation */}
      <TopNavBar onMenuClick={toggleSidebar} />

      {/* Main Content Area */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Sidebar Component (conditionally visible/drawer) */}
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto w-full h-full">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
