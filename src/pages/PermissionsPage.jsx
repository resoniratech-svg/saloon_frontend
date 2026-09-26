import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShoppingCart, 
  Calendar, 
  Users, 
  Briefcase, 
  Package, 
  Boxes, 
  Receipt, 
  BarChart3, 
  TrendingUp, 
  UserCheck, 
  Settings, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Lock, 
  Unlock, 
  RotateCcw,
  Scissors,
  Crown,
  Gift,
  Wallet
} from 'lucide-react';
import { 
  getActiveTenant, 
  getCashierPermissions, 
  saveCashierPermissions, 
  DEFAULT_CASHIER_PERMISSIONS,
  isPlanFeatureAllowed
} from '../utils/saasStorage';

export default function PermissionsPage() {
  const [tenant, setTenant] = useState(getActiveTenant);
  const [permissions, setPermissions] = useState(() => getCashierPermissions());
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const handleSync = () => {
      setTenant(getActiveTenant());
      setPermissions(getCashierPermissions());
    };
    window.addEventListener('tenantChanged', handleSync);
    window.addEventListener('permissionsUpdated', handleSync);
    return () => {
      window.removeEventListener('tenantChanged', handleSync);
      window.removeEventListener('permissionsUpdated', handleSync);
    };
  }, []);

  const isAllowed = (key) => isPlanFeatureAllowed(tenant, key);

  const handleToggle = (key) => {
    if (!isAllowed(key)) return;
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setSaveSuccess(false);
  };

  const handleSave = () => {
    saveCashierPermissions(permissions, tenant?.id);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleApplyPreset = (presetType) => {
    let preset = { ...permissions };
    const shouldEnable = (key, defaultVal) => isAllowed(key) ? defaultVal : false;

    if (presetType === 'DEFAULT') {
      preset = {
        ...preset,
        pos: shouldEnable('pos', true),
        appointment: shouldEnable('appointment', true),
        crm: shouldEnable('crm', true),
        cashMgmt: shouldEnable('cashMgmt', true),
        masterBo: false,
        masterBoServices: shouldEnable('masterBo', true),
        masterBoProducts: shouldEnable('masterBo', true),
        masterBoPackages: false,
        masterBoMemberships: false,
        disposables: false,
        inventory: false,
        expenses: false,
        reports: false,
        trends: false,
        staffManagement: false,
        settings: false,
      };
    } else if (presetType === 'MANAGER') {
      preset = {
        ...preset,
        pos: shouldEnable('pos', true),
        appointment: shouldEnable('appointment', true),
        crm: shouldEnable('crm', true),
        cashMgmt: shouldEnable('cashMgmt', true),
        masterBo: shouldEnable('masterBo', true),
        masterBoServices: shouldEnable('masterBo', true),
        masterBoProducts: shouldEnable('masterBo', true),
        masterBoPackages: shouldEnable('masterBo', true),
        masterBoMemberships: shouldEnable('masterBo', true),
        disposables: shouldEnable('disposables', true),
        inventory: shouldEnable('inventory', true),
        expenses: shouldEnable('expenses', true),
        reports: shouldEnable('reports', true),
        trends: shouldEnable('trends', true),
        staffManagement: shouldEnable('staffManagement', true),
        settings: shouldEnable('settings', true),
      };
    } else if (presetType === 'BILLING_ONLY') {
      preset = {
        ...preset,
        pos: shouldEnable('pos', true),
        appointment: false,
        crm: false,
        cashMgmt: false,
        masterBo: false,
        masterBoServices: false,
        masterBoProducts: false,
        masterBoPackages: false,
        masterBoMemberships: false,
        disposables: false,
        inventory: false,
        expenses: false,
        reports: false,
        trends: false,
        staffManagement: false,
        settings: false,
      };
    }
    setPermissions(preset);
    setSaveSuccess(false);
  };

  const companyName = tenant?.companyName || tenant?.brandName || (tenant?.logoTextPrefix ? `${tenant.logoTextPrefix}${tenant.logoTextSuffix || ''}` : 'Salon Company');
  const companyLocation = tenant?.location || tenant?.city || 'Pune';

  // Count active modules among those permitted by Super Admin
  const allModulesList = [
    { key: 'pos', label: 'POS Billing' },
    { key: 'appointment', label: 'Appointments & Booking' },
    { key: 'crm', label: 'CRM & Guests' },
    { key: 'cashMgmt', label: 'Cash Management & Float' },
    { key: 'masterBo', label: 'Backoffice Master' },
    { key: 'disposables', label: 'Salon Disposables' },
    { key: 'inventory', label: 'Inventory & POs' },
    { key: 'expenses', label: 'Expenses' },
    { key: 'reports', label: 'Reports & Analytics' },
    { key: 'trends', label: 'Revenue Trends' },
    { key: 'staffManagement', label: 'Staff Management' },
    { key: 'settings', label: 'Store Settings' }
  ];

  const allowedModules = allModulesList.filter(m => isAllowed(m.key));
  const lockedModules = allModulesList.filter(m => !isAllowed(m.key));
  const enabledCount = allowedModules.filter(m => permissions[m.key]).length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-4 md:p-6 space-y-6 max-w-6xl mx-auto pb-24">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
            <ShieldCheck size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">Permissions & Role Access</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider">
                Admin Control
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configure module visibility and operational access for the <strong>Cashier Portal</strong> ({companyName})
            </p>
          </div>
        </div>

        {/* Salon Identifier Pill */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          {tenant?.logoUrl ? (
            <img src={tenant.logoUrl} alt={companyName} className="h-6 max-w-[80px] object-contain rounded" />
          ) : (
            <span className="w-6 h-6 rounded bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
              {companyName.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div className="text-left">
            <div className="font-bold text-slate-800 text-xs">{companyName}</div>
            <div className="text-[10px] text-slate-400">{companyLocation}</div>
          </div>
        </div>
      </div>

      {/* Preset Bar & Stats */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              <span>Quick Permission Presets</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Apply standard security profiles in one click</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleApplyPreset('DEFAULT')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors cursor-pointer"
            >
              Standard Cashier (Default)
            </button>
            <button
              onClick={() => handleApplyPreset('MANAGER')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors cursor-pointer"
            >
              Full Access (All Modules)
            </button>
            <button
              onClick={() => handleApplyPreset('BILLING_ONLY')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors cursor-pointer"
            >
              Billing Only Terminal
            </button>
          </div>
        </div>

        {/* Active Ratio */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500">
              Cashier Portal Status: <strong className="text-slate-800">{enabledCount} of {allowedModules.length} Allowed Modules Enabled</strong>
            </span>
            <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
              Super Admin Allowed: {allowedModules.length} Modules
            </span>
          </div>
          <span className="text-xs text-indigo-600 font-medium">
            Disabled modules are automatically hidden from the Cashier's Top Nav and Sidebar
          </span>
        </div>
      </div>

      {/* Success Banner */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
          <Check size={18} className="text-emerald-600 shrink-0" />
          <span>Permissions saved successfully! The Cashier portal navigation and security guards have been updated in real-time.</span>
        </div>
      )}

      {/* Module Permissions Grid */}
      <div className="space-y-6">

        {/* 1. FRONT-DESK CORE MODULES */}
        {(isAllowed('pos') || isAllowed('appointment') || isAllowed('crm') || isAllowed('cashMgmt')) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Front-Desk & Billing Core</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* POS Billing */}
              {isAllowed('pos') && (
                <div className={`p-5 rounded-2xl border transition-all ${permissions.pos ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/80 border-slate-200/60 opacity-70'}`}>
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <ShoppingCart size={20} />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('pos')}
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                        permissions.pos ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                          permissions.pos ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 text-sm">POS Billing</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${permissions.pos ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                        {permissions.pos ? 'ENABLED' : 'HIDDEN'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Quick Sale, Order Checkout, Receipt Printing & Invoices</p>
                    <span className="text-[10px] font-mono text-slate-400 mt-2 block">Route: /pos</span>
                  </div>
                </div>
              )}

              {/* Appointments */}
              {isAllowed('appointment') && (
                <div className={`p-5 rounded-2xl border transition-all ${permissions.appointment ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/80 border-slate-200/60 opacity-70'}`}>
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <Calendar size={20} />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('appointment')}
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                        permissions.appointment ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                          permissions.appointment ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 text-sm">Appointments</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${permissions.appointment ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                        {permissions.appointment ? 'ENABLED' : 'HIDDEN'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Daily Schedule, Stylist Time Slots & Rescheduling</p>
                    <span className="text-[10px] font-mono text-slate-400 mt-2 block">Route: /appointment</span>
                  </div>
                </div>
              )}

              {/* CRM Guests */}
              {isAllowed('crm') && (
                <div className={`p-5 rounded-2xl border transition-all ${permissions.crm ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/80 border-slate-200/60 opacity-70'}`}>
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Users size={20} />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('crm')}
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                        permissions.crm ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                          permissions.crm ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 text-sm">CRM Guests</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${permissions.crm ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                        {permissions.crm ? 'ENABLED' : 'HIDDEN'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Guest Profiles, Visit History, Loyalty Points & Filter</p>
                    <span className="text-[10px] font-mono text-slate-400 mt-2 block">Route: /crm</span>
                  </div>
                </div>
              )}

              {/* Cash Management */}
              {isAllowed('cashMgmt') && (
                <div className={`p-5 rounded-2xl border transition-all ${permissions.cashMgmt ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/80 border-slate-200/60 opacity-70'}`}>
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Wallet size={20} />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('cashMgmt')}
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                        permissions.cashMgmt ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                          permissions.cashMgmt ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 text-sm">Cash Management</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${permissions.cashMgmt ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                        {permissions.cashMgmt ? 'ENABLED' : 'HIDDEN'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Opening Cash Float, Drawer Balance & Shift Settlement</p>
                    <span className="text-[10px] font-mono text-slate-400 mt-2 block">Route: /cash-mgmt</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. CATALOG & PRICING (BACKOFFICE SECTION) */}
        {isAllowed('masterBo') && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-600" />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catalog & Pricing Master (Backoffice)</h3>
            </div>

            <div className={`p-5 rounded-2xl border transition-all ${permissions.masterBo ? 'bg-white border-violet-200 shadow-sm ring-1 ring-violet-500/20' : 'bg-slate-50/80 border-slate-200/60 opacity-70'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                    <Briefcase size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 text-base">Backoffice Master</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${permissions.masterBo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                        {permissions.masterBo ? 'CASHIER ACCESS ENABLED' : 'RESTRICTED / HIDDEN'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Central catalog management for salon services, retail products, service packages, and VIP memberships
                    </p>
                    <span className="text-[10px] font-mono text-slate-400 block mt-1">Route: /master-bo</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle('masterBo')}
                  className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out shrink-0 ${
                    permissions.masterBo ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      permissions.masterBo ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Granular Sub-options when Backoffice is Enabled */}
              {permissions.masterBo ? (
                <div className="mt-4 pt-1">
                  <span className="text-[11px] font-bold text-violet-800 uppercase tracking-wider block mb-2">
                    Granular Backoffice Sub-Section Permissions for Cashier:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3 bg-violet-50/50 rounded-xl border border-violet-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Scissors size={15} className="text-violet-600" />
                        <div>
                          <div className="text-xs font-bold text-slate-800">Services Catalog</div>
                          <span className="text-[10px] text-slate-500">Prices & duration</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={permissions.masterBoServices}
                        onChange={() => handleToggle('masterBoServices')}
                        className="w-4 h-4 rounded text-violet-600 accent-violet-600 cursor-pointer"
                      />
                    </div>

                    <div className="p-3 bg-violet-50/50 rounded-xl border border-violet-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package size={15} className="text-violet-600" />
                        <div>
                          <div className="text-xs font-bold text-slate-800">Products Catalog</div>
                          <span className="text-[10px] text-slate-500">Retail prices & stock</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={permissions.masterBoProducts}
                        onChange={() => handleToggle('masterBoProducts')}
                        className="w-4 h-4 rounded text-violet-600 accent-violet-600 cursor-pointer"
                      />
                    </div>

                    <div className="p-3 bg-violet-50/50 rounded-xl border border-violet-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gift size={15} className="text-violet-600" />
                        <div>
                          <div className="text-xs font-bold text-slate-800">Packages Master</div>
                          <span className="text-[10px] text-slate-500">Service bundle deals</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={permissions.masterBoPackages}
                        onChange={() => handleToggle('masterBoPackages')}
                        className="w-4 h-4 rounded text-violet-600 accent-violet-600 cursor-pointer"
                      />
                    </div>

                    <div className="p-3 bg-violet-50/50 rounded-xl border border-violet-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown size={15} className="text-violet-600" />
                        <div>
                          <div className="text-xs font-bold text-slate-800">Memberships</div>
                          <span className="text-[10px] text-slate-500">VIP discount tiers</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={permissions.masterBoMemberships}
                        onChange={() => handleToggle('masterBoMemberships')}
                        className="w-4 h-4 rounded text-violet-600 accent-violet-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
                  <Lock size={13} />
                  <span>Backoffice is currently disabled. Cashiers cannot view or modify salon services, product rates, packages, or memberships.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. INVENTORY, DISPOSABLES & EXPENSES */}
        {(isAllowed('disposables') || isAllowed('inventory') || isAllowed('expenses')) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operations & Stock Management</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Disposables */}
              {isAllowed('disposables') && (
                <div className={`p-5 rounded-2xl border transition-all ${permissions.disposables ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/80 border-slate-200/60 opacity-70'}`}>
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                      <Package size={20} />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('disposables')}
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                        permissions.disposables ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                          permissions.disposables ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 text-sm">Disposables</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${permissions.disposables ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                        {permissions.disposables ? 'ENABLED' : 'HIDDEN'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Capes, Gloves, Neck Strips, Wastage Tracking & Stock</p>
                    <span className="text-[10px] font-mono text-slate-400 mt-2 block">Route: /disposables</span>
                  </div>
                </div>
              )}

              {/* Inventory */}
              {isAllowed('inventory') && (
                <div className={`p-5 rounded-2xl border transition-all ${permissions.inventory ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/80 border-slate-200/60 opacity-70'}`}>
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                      <Boxes size={20} />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('inventory')}
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                        permissions.inventory ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                          permissions.inventory ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 text-sm">Inventory</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${permissions.inventory ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                        {permissions.inventory ? 'ENABLED' : 'HIDDEN'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Purchase Orders, Stock Reconciliation & Vendor Management</p>
                    <span className="text-[10px] font-mono text-slate-400 mt-2 block">Route: /inventory</span>
                  </div>
                </div>
              )}

              {/* Expenses */}
              {isAllowed('expenses') && (
                <div className={`p-5 rounded-2xl border transition-all ${permissions.expenses ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/80 border-slate-200/60 opacity-70'}`}>
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Receipt size={20} />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('expenses')}
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                        permissions.expenses ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                          permissions.expenses ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 text-sm">Expenses</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${permissions.expenses ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                        {permissions.expenses ? 'ENABLED' : 'HIDDEN'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Operational Spend Recording, Notes & Payment Receipts</p>
                    <span className="text-[10px] font-mono text-slate-400 mt-2 block">Route: /expenses</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. REPORTS, TRENDS, STAFF & SETTINGS */}
        {(isAllowed('reports') || isAllowed('trends') || isAllowed('staffManagement') || isAllowed('settings')) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reports, Trends & Administration</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Reports */}
              {isAllowed('reports') && (
                <div className={`p-4 rounded-2xl border transition-all ${permissions.reports ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/80 border-slate-200/60 opacity-70'}`}>
                  <div className="flex justify-between items-start">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <BarChart3 size={18} />
                    </div>
                    <input
                      type="checkbox"
                      checked={permissions.reports}
                      onChange={() => handleToggle('reports')}
                      className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                    />
                  </div>
                  <div className="mt-2.5">
                    <h4 className="font-bold text-slate-800 text-xs">Reports</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Sales Revenue & Stylist Metrics</p>
                    <span className="text-[10px] font-mono text-slate-400 mt-1 block">Route: /reports</span>
                  </div>
                </div>
              )}

              {/* Trends */}
              {isAllowed('trends') && (
                <div className={`p-4 rounded-2xl border transition-all ${permissions.trends ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/80 border-slate-200/60 opacity-70'}`}>
                  <div className="flex justify-between items-start">
                    <div className="w-9 h-9 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                      <TrendingUp size={18} />
                    </div>
                    <input
                      type="checkbox"
                      checked={permissions.trends}
                      onChange={() => handleToggle('trends')}
                      className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                    />
                  </div>
                  <div className="mt-2.5">
                    <h4 className="font-bold text-slate-800 text-xs">Trends</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Business Growth Charts & Trends</p>
                    <span className="text-[10px] font-mono text-slate-400 mt-1 block">Route: /trends</span>
                  </div>
                </div>
              )}

              {/* Staff Management */}
              {isAllowed('staffManagement') && (
                <div className={`p-4 rounded-2xl border transition-all ${permissions.staffManagement ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/80 border-slate-200/60 opacity-70'}`}>
                  <div className="flex justify-between items-start">
                    <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <UserCheck size={18} />
                    </div>
                    <input
                      type="checkbox"
                      checked={permissions.staffManagement}
                      onChange={() => handleToggle('staffManagement')}
                      className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                    />
                  </div>
                  <div className="mt-2.5">
                    <h4 className="font-bold text-slate-800 text-xs">Staff Management</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Stylists, Shift Roster & Payroll</p>
                    <span className="text-[10px] font-mono text-slate-400 mt-1 block">Route: /staff-management</span>
                  </div>
                </div>
              )}

              {/* Settings */}
              {isAllowed('settings') && (
                <div className={`p-4 rounded-2xl border transition-all ${permissions.settings ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/80 border-slate-200/60 opacity-70'}`}>
                  <div className="flex justify-between items-start">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <Settings size={18} />
                    </div>
                    <input
                      type="checkbox"
                      checked={permissions.settings}
                      onChange={() => handleToggle('settings')}
                      className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer"
                    />
                  </div>
                  <div className="mt-2.5">
                    <h4 className="font-bold text-slate-800 text-xs">Settings</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Business Hours & Store Status</p>
                    <span className="text-[10px] font-mono text-slate-400 mt-1 block">Route: /settings</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Locked Modules Notice */}
        {lockedModules.length > 0 && (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-slate-400" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Modules Not Included in Company Plan ({lockedModules.length})
              </h4>
            </div>
            <p className="text-xs text-slate-500">
              The following modules are not enabled by the Super Admin in your company's subscription plan. To grant cashier access to these modules, enable them in <strong>Platform Super Admin ➔ Registered Salons ➔ Edit</strong>.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {lockedModules.map(m => (
                <span key={m.key} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-200/70 text-slate-600">
                  <Lock size={11} className="text-slate-400" />
                  <span>{m.label}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 z-30 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Configuring permissions for <strong>{companyName}</strong>. Changes apply instantly to front-desk terminals.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => handleApplyPreset('DEFAULT')}
              className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Check size={16} />
              <span>Save & Apply Permissions</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
