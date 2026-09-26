import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopNavBar from './TopNavBar';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-hidden">
      {/* Top Navigation */}
      <TopNavBar onMenuClick={toggleSidebar} />

      {/* Main Content Area */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Sidebar Component (conditionally visible/drawer) */}
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto w-full h-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
