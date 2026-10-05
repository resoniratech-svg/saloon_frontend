import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, UserCircle, Building2, Shield, LogOut, MapPin, Eye } from 'lucide-react';
import {
  getActiveTenant,
  getCurrentUser,
  getCashierPermissions,
  isPlanFeatureAllowed,
  isImpersonating,
  stopImpersonation,
  syncActiveTenantBranding
} from '../../utils/saasStorage';
import { getCashiersForTenant } from '../../utils/cashierStorage';

const TopNavBar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(() => getActiveTenant());
  const [user, setUser] = useState(() => getCurrentUser());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [cashierPermissions, setCashierPermissions] = useState(() => getCashierPermissions());

  // Determine correct user email without leaking Company Admin email to Cashier accounts
  const displayEmail = useMemo(() => {
    if (user?.role === 'CASHIER') {
      if (user?.email && user.email !== tenant?.email) {
        return user.email;
      }
      try {
        const cashiers = getCashiersForTenant(tenant?.id || user?.companyId);
        const matched = cashiers.find(c => 
          (user?.cashierId && String(c.id) === String(user.cashierId)) ||
          (user?.username && c.username?.toLowerCase() === user.username?.toLowerCase()) ||
          (user?.name && c.name?.toLowerCase() === user.name?.toLowerCase())
        );
        if (matched?.email) return matched.email;
      } catch (e) {}

      return user?.email || (user?.username?.includes('@') ? user.username : `${user?.username || user?.name || 'cashier'}@saloon.com`);
    }

    return user?.email || tenant?.email || (user?.username?.includes('@') ? user.username : `${user?.username || 'admin'}@gmail.com`);
  }, [user, tenant]);

  useEffect(() => {
    const handleUpdate = () => {
      setTenant(getActiveTenant());
      setUser(getCurrentUser());
      setCashierPermissions(getCashierPermissions());
    };
    window.addEventListener('saasUpdated', handleUpdate);
    window.addEventListener('tenantChanged', handleUpdate);
    window.addEventListener('saasUserChanged', handleUpdate);
    window.addEventListener('permissionsUpdated', handleUpdate);
    window.addEventListener('impersonationChanged', handleUpdate);

    return () => {
      window.removeEventListener('saasUpdated', handleUpdate);
      window.removeEventListener('tenantChanged', handleUpdate);
      window.removeEventListener('saasUserChanged', handleUpdate);
      window.removeEventListener('permissionsUpdated', handleUpdate);
      window.removeEventListener('impersonationChanged', handleUpdate);
    };
  }, []);

  // Sync active tenant branding (including company logo from PostgreSQL)
  useEffect(() => {
    syncActiveTenantBranding(tenant?.id).then(synced => {
      if (synced) {
        setTenant(synced);
      }
    });
  }, [tenant?.id]);

  const allTabs = [
    { name: 'POS', path: '/pos', key: 'pos' },
    { name: 'APPOINTMENT', path: '/appointment', key: 'appointment' },
    { name: 'CRM', path: '/crm', key: 'crm' },
    { name: 'CASH MGMT', path: '/cash-mgmt', key: 'cashMgmt' },
    { name: 'REPORTS', path: '/reports', key: 'reports', adminOnly: true },
    { name: 'INVENTORY', path: '/inventory', key: 'inventory', adminOnly: true },
    { name: 'TRENDS', path: '/trends', key: 'trends', adminOnly: true },
  ];

  const tabPermissionKey = {
    'pos': 'pos',
    'appointment': 'appointment',
    'crm': 'crm',
    'cashMgmt': 'cashMgmt',
    'reports': 'reports',
    'inventory': 'inventory',
    'disposables': 'disposables',
    'trends': 'trends',
  };

  const tabs = allTabs.filter(t => {
    // 1. Subscription Plan Level Check: Filter out any module not purchased in company's plan
    if (!isPlanFeatureAllowed(tenant, t.key)) {
      return false;
    }

    // 2. Role Level Checks
    if (user?.role === 'CASHIER') {
      const permKey = tabPermissionKey[t.key] || t.key;
      return permKey ? Boolean(cashierPermissions[permKey]) : false;
    }
    if (user?.role === 'STAFF') {
      return t.key === 'appointment';
    }
    return true;
  });

  // Helper to format date
  const getFormattedDate = () => {
    const options = { weekday: 'short', day: '2-digit', month: 'short' };
    return new Date().toLocaleDateString('en-GB', options).replace(/,/g, '');
  };

  const getCompanyLocation = () => {
    if (tenant?.location) return tenant.location;
    if (tenant?.city && tenant?.state) return `${tenant.city}, ${tenant.state}`;
    const branch = tenant?.branches?.find(b => b.isPrimary) || tenant?.branches?.[0];
    if (branch) {
      if (branch.name && branch.city) {
        if (branch.name.toLowerCase().includes(branch.city.toLowerCase())) {
          return branch.name;
        }
        return `${branch.name}, ${branch.city}`;
      }
      return branch.name || branch.city;
    }
    if (tenant?.city) return tenant.city;
    return '';
  };

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="w-full bg-indigo-700 text-white shadow-md z-40 relative">
      <div className="flex items-center justify-between px-4 h-14">
        
        {/* Left Section: Menu, Logo & Location */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button 
            onClick={onMenuClick}
            className="p-1 hover:bg-indigo-600 rounded-md transition-colors focus:outline-none cursor-pointer"
          >
            <Menu className="h-6 w-6 text-white" />
          </button>
          
          <div className="flex items-center gap-2 sm:gap-2.5">
            {tenant?.logoUrl && (
              <img
                src={tenant.logoUrl}
                alt={tenant.companyName || 'Logo'}
                className="h-8 max-w-[130px] object-contain rounded bg-white/10 p-0.5 shrink-0"
              />
            )}

            {/* Brand Name of Company */}
            <span className="text-base sm:text-lg font-black tracking-tight select-none uppercase whitespace-nowrap">
              {(() => {
                if (tenant?.logoTextPrefix) {
                  return (
                    <>
                      <span className="text-white">{tenant.logoTextPrefix}</span>
                      <span className="text-rose-400">{tenant.logoTextSuffix || ''}</span>
                    </>
                  );
                }
                const name = (tenant?.brandName || tenant?.companyName || tenant?.name || 'SALON').trim();
                const parts = name.split(' ');
                if (parts.length > 1) {
                  return (
                    <>
                      <span className="text-white">{parts[0]} </span>
                      <span className="text-rose-400">{parts.slice(1).join(' ')}</span>
                    </>
                  );
                }
                const mid = Math.ceil(name.length / 2);
                return (
                  <>
                    <span className="text-white">{name.slice(0, mid)}</span>
                    <span className="text-rose-400">{name.slice(mid)}</span>
                  </>
                );
              })()}
            </span>

            {/* Company Location Pill */}
            <div 
              className="flex items-center gap-1.5 px-2.5 py-0.5 bg-white/10 hover:bg-white/15 border border-white/20 rounded-full text-xs text-indigo-100 font-medium select-none shadow-xs transition-colors"
              title={`Company Location: ${getCompanyLocation()}`}
            >
              <MapPin size={11} className="text-rose-400 shrink-0" />
              <span className="truncate max-w-[160px] sm:max-w-[220px]">{getCompanyLocation()}</span>
            </div>
          </div>
        </div>

        {/* Center Section: Navigation Tabs (Desktop only) */}
        <div className="hidden lg:flex flex-1 justify-center px-4 overflow-x-auto no-scrollbar space-x-1">
          {tabs.map((tab) => (
            <NavLink
              key={tab.name}
              to={tab.path}
              className={({ isActive }) =>
                `whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white shadow-xs'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {tab.name}
            </NavLink>
          ))}
        </div>

        {/* Right Section: Date & Profile */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="hidden md:block text-xs font-medium text-white/90">
            {getFormattedDate()}
          </div>

          {/* User Avatar & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="p-1 hover:bg-indigo-600 rounded-full transition-colors focus:outline-none cursor-pointer"
            >
              <UserCircle className="h-7 w-7 text-white" />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-3 border-b border-slate-100">
                    {/* Top: Role Badge */}
                    <div className="mb-2">
                      {isImpersonating() ? (
                        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-md border border-amber-300">
                          <Eye size={12} className="text-amber-600" />
                          <span>Super Admin (View-Only)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-md border border-indigo-200">
                          <Building2 size={12} className="text-indigo-600" />
                          <span>
                            {user?.role === 'SUPER_ADMIN' 
                              ? 'Platform Super Admin' 
                              : user?.role === 'CASHIER'
                              ? 'Front Desk Cashier'
                              : user?.role === 'STAFF' 
                              ? `Staff (${user.position || 'Stylist'})` 
                              : 'Company Admin'}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Down: Admin Name */}
                    <div className="text-sm font-bold text-slate-800 leading-tight">
                      {user?.name || tenant?.ownerName || 'Salon Admin'}
                    </div>

                    {/* Down: Email */}
                    <div className="text-xs text-slate-500 mt-1 font-medium break-all">
                      {displayEmail}
                    </div>
                  </div>

                  <div className="py-1">
                    {isImpersonating() && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          stopImpersonation();
                          navigate('/super-admin');
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-50 flex items-center gap-2 cursor-pointer border-b border-slate-100"
                        title="Exit read-only impersonation and return to Super Admin Console"
                      >
                        <LogOut size={14} className="text-amber-600" />
                        <span>Exit Impersonation (Return to Super Admin)</span>
                      </button>
                    )}
                    {user?.role === 'SUPER_ADMIN' && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/super-admin');
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 cursor-pointer"
                      >
                        <Shield size={14} className="text-amber-500" />
                        <span>Super Admin Portal</span>
                      </button>
                    )}


                    {user?.role === 'STAFF' && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/appointment');
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 cursor-pointer"
                      >
                        <Building2 size={14} className="text-indigo-500" />
                        <span>My Schedule & Appointments</span>
                      </button>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut size={14} />
                      <span>Logout Session</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default TopNavBar;
