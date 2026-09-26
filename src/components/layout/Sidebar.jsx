import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, ChevronRight, Briefcase, Settings, Receipt,
  Users, LogOut, Store, ShoppingCart, Calendar, KeyRound, Package,
  ShieldCheck, Boxes, BarChart3, TrendingUp, Wallet
} from 'lucide-react';
import {
  getActiveTenant,
  getActiveBranch,
  getCurrentUser,
  getCashierPermissions,
  isPlanFeatureAllowed
} from '../../utils/saasStorage';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(() => getActiveTenant());
  const [branch, setBranch] = useState(() => getActiveBranch());
  const [user, setUser] = useState(() => getCurrentUser());
  const [cashierPermissions, setCashierPermissions] = useState(() => getCashierPermissions());

  useEffect(() => {
    const handleUpdate = () => {
      setTenant(getActiveTenant());
      setBranch(getActiveBranch());
      setUser(getCurrentUser());
      setCashierPermissions(getCashierPermissions());
    };
    window.addEventListener('saasUpdated', handleUpdate);
    window.addEventListener('tenantChanged', handleUpdate);
    window.addEventListener('branchChanged', handleUpdate);
    window.addEventListener('saasUserChanged', handleUpdate);
    window.addEventListener('permissionsUpdated', handleUpdate);

    return () => {
      window.removeEventListener('saasUpdated', handleUpdate);
      window.removeEventListener('tenantChanged', handleUpdate);
      window.removeEventListener('branchChanged', handleUpdate);
      window.removeEventListener('saasUserChanged', handleUpdate);
      window.removeEventListener('permissionsUpdated', handleUpdate);
    };
  }, []);

  const rawAdminMenuItems = [
    { label: 'BACKOFFICE', path: '/master-bo', icon: Briefcase, desc: 'Services, Products, Packages & Memberships', key: 'masterBo' },
    { label: 'CASH MANAGEMENT', path: '/cash-mgmt', icon: Wallet, desc: 'Counter Sessions & Drawer Cash', key: 'cashMgmt' },
    { label: 'DISPOSABLES', path: '/disposables', icon: Package, desc: 'Capes, Gloves, Neck Strips & Wastage', key: 'disposables' },
    { label: 'STAFF MANAGEMENT', path: '/staff-management', icon: Users, desc: 'Stylists, Shift Roster & Payroll', key: 'staffManagement' },
    { label: 'CASHIER MANAGEMENT', path: '/cashier-management', icon: KeyRound, desc: 'Front-Desk Logins & Terminals', key: 'cashierManagement' },
    { label: 'PERMISSIONS', path: '/permissions', icon: ShieldCheck, desc: 'Cashier Module Access & Security', key: 'permissions' },
    { label: 'SETTINGS', path: '/settings', icon: Settings, desc: 'Business Hours, Store Status & Operations', key: 'settings' },
    { label: 'EXPENSES', path: '/expenses', icon: Receipt, desc: 'Operational Expenses & Spend Tracking', key: 'expenses' },
  ];

  // Filter admin menu items according to tenant plan limits
  const adminMenuItems = rawAdminMenuItems.filter(item => {
    return isPlanFeatureAllowed(tenant, item.key);
  });

  // Dynamically built cashier menu based on company permissions AND plan limits
  const cashierMenuItems = [];
  if (cashierPermissions.pos && isPlanFeatureAllowed(tenant, 'pos')) {
    cashierMenuItems.push({ label: 'POS BILLING', path: '/pos', icon: ShoppingCart, desc: 'Quick Sale & Invoice Checkout' });
  }
  if (cashierPermissions.appointment && isPlanFeatureAllowed(tenant, 'appointment')) {
    cashierMenuItems.push({ label: 'APPOINTMENTS', path: '/appointment', icon: Calendar, desc: 'Daily Schedule & Bookings' });
  }
  if (cashierPermissions.crm && isPlanFeatureAllowed(tenant, 'crm')) {
    cashierMenuItems.push({ label: 'CRM GUESTS', path: '/crm', icon: Users, desc: 'Guest Profiles & Visit History' });
  }
  if (cashierPermissions.masterBo && isPlanFeatureAllowed(tenant, 'masterBo')) {
    cashierMenuItems.push({ label: 'BACKOFFICE', path: '/master-bo', icon: Briefcase, desc: 'Services, Products, Packages & Memberships' });
  }
  if (cashierPermissions.disposables && isPlanFeatureAllowed(tenant, 'disposables')) {
    cashierMenuItems.push({ label: 'DISPOSABLES', path: '/disposables', icon: Package, desc: 'Capes, Gloves, Neck Strips & Wastage' });
  }
  if (cashierPermissions.inventory && isPlanFeatureAllowed(tenant, 'inventory')) {
    cashierMenuItems.push({ label: 'INVENTORY', path: '/inventory', icon: Boxes, desc: 'Purchase Orders & Stock' });
  }
  if (cashierPermissions.expenses && isPlanFeatureAllowed(tenant, 'expenses')) {
    cashierMenuItems.push({ label: 'EXPENSES', path: '/expenses', icon: Receipt, desc: 'Operational Expenses & Spend Tracking' });
  }
  if (cashierPermissions.cashMgmt && isPlanFeatureAllowed(tenant, 'cashMgmt')) {
    cashierMenuItems.push({ label: 'CASH MANAGEMENT', path: '/cash-mgmt', icon: Wallet, desc: 'Counter Sessions & Drawer Cash' });
  }
  if (cashierPermissions.reports && isPlanFeatureAllowed(tenant, 'reports')) {
    cashierMenuItems.push({ label: 'REPORTS', path: '/reports', icon: BarChart3, desc: 'Daily Revenue & Performance' });
  }
  if (cashierPermissions.trends && isPlanFeatureAllowed(tenant, 'trends')) {
    cashierMenuItems.push({ label: 'TRENDS', path: '/trends', icon: TrendingUp, desc: 'Business Growth & Charts' });
  }
  if (cashierPermissions.staffManagement && isPlanFeatureAllowed(tenant, 'staffManagement')) {
    cashierMenuItems.push({ label: 'STAFF MANAGEMENT', path: '/staff-management', icon: Users, desc: 'Stylists & Shift Roster' });
  }
  if (cashierPermissions.settings) {
    cashierMenuItems.push({ label: 'SETTINGS', path: '/settings', icon: Settings, desc: 'Business Hours & Store Status' });
  }

  const staffMenuItems = [];
  if (isPlanFeatureAllowed(tenant, 'appointment')) {
    staffMenuItems.push({ label: 'APPOINTMENTS', path: '/appointment', icon: Calendar, desc: 'My Daily Schedule & Calendar' });
  }

  const menuItems = 
    user?.role === 'CASHIER' 
      ? cashierMenuItems 
      : user?.role === 'STAFF' 
      ? staffMenuItems 
      : adminMenuItems;

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    navigate('/login');
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div 
        className={`fixed left-0 top-0 h-full w-80 bg-slate-900 text-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div>
          <div className="flex justify-between items-center px-6 py-5 border-b border-slate-800">
            <div>
              {tenant?.logoUrl ? (
                <img
                  src={tenant.logoUrl}
                  alt={tenant.companyName || 'Logo'}
                  className="h-8 max-w-[130px] object-contain rounded bg-white/10 p-0.5 mb-1"
                />
              ) : (
                <span className="text-lg font-black tracking-tight">
                  <span className="text-white">{tenant?.logoTextPrefix || 'GLA'}</span>
                  <span className="text-rose-400">{tenant?.logoTextSuffix || 'MOUR'}</span>
                </span>
              )}
              <span className="block text-[11px] text-slate-400 font-medium truncate max-w-[180px]">
                {tenant?.companyName || 'RESpark Management'}
              </span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
              <X size={20} />
            </button>
          </div>

          {/* Active Branch Pill */}
          <div className="mx-4 mt-3 px-3 py-2 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <Store size={14} className="text-rose-400 shrink-0" />
              <span className="text-slate-300 font-medium truncate">{branch?.name || 'Trial 1, Kalyaninagar'}</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Active Branch" />
          </div>

          {/* Menu Navigation */}
          <nav className="p-3 space-y-1 mt-3">
            {menuItems.map((item) => (
              <div 
                key={item.label} 
                onClick={() => handleNavigate(item.path)}
                className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <item.icon size={17} />
                  </div>
                  <div>
                    <span className="font-bold text-xs tracking-wide text-slate-200 group-hover:text-white block">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-slate-500 group-hover:text-slate-400 block">
                      {item.desc}
                    </span>
                  </div>
                </div>
                <ChevronRight size={15} className="text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
              </div>
            ))}
          </nav>
        </div>

        {/* Footer with Session & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between mb-3">
            <div className="truncate pr-2">
              <div className="text-xs font-bold text-white truncate">{user?.name || 'Salon Admin'}</div>
              <div className="text-[10px] text-slate-400 font-mono">@{user?.username || 'admin'}</div>
            </div>
            <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
              {user?.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : user?.role === 'CASHIER' ? 'CASHIER' : user?.role === 'STAFF' ? 'STAFF' : 'ADMIN'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 rounded-xl text-xs font-semibold text-slate-300 transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>Logout Session</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
