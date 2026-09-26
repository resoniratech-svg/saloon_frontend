import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Building2, Shield, ArrowRight, CheckCircle2, AlertCircle, KeyRound, Mail, Phone, X, Check, HelpCircle, Clock, AlertTriangle } from 'lucide-react';
import {
  getTenants,
  getActiveTenant,
  setActiveTenant,
  setCurrentUser,
  superAdminUser,
  isTenantPlanExpired
} from '../utils/saasStorage';
import { findCashierByCredentials, getCashiersForTenant } from '../utils/cashierStorage';
import {
  submitResetRequest,
  checkActiveTemporaryPassword,
  completePasswordReset,
  detectAccountRole
} from '../utils/passwordResetStorage';



const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [tenants, setTenants] = useState(() => getTenants());
  const [activeTenant, setActiveTenantState] = useState(() => getActiveTenant());
  const navigate = useNavigate();

  // Password Recovery Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotFeedback, setForgotFeedback] = useState(null);
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);

  // Forced Set New Password Modal States (When logging in with Temporary Password)
  const [showForceResetModal, setShowForceResetModal] = useState(false);
  const [activeTempResetRequest, setActiveTempResetRequest] = useState(null);
  const [newPasswordForm, setNewPasswordForm] = useState({
    tempPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetModalError, setResetModalError] = useState('');

  useEffect(() => {
    const handleSync = () => {
      setTenants(getTenants());
      setActiveTenantState(getActiveTenant());
    };
    window.addEventListener('saasUpdated', handleSync);
    window.addEventListener('tenantChanged', handleSync);
    window.addEventListener('passwordResetsUpdated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('saasUpdated', handleSync);
      window.removeEventListener('tenantChanged', handleSync);
      window.removeEventListener('passwordResetsUpdated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const cleanUser = username.trim();
    const cleanLower = cleanUser.toLowerCase();
    const cleanDigits = cleanUser.replace(/\D/g, '');
    const cleanPass = password.trim();

    // 0. Check if user is logging in with an approved Temporary Password
    const tempPassMatch = checkActiveTemporaryPassword(cleanUser, cleanPass);
    if (tempPassMatch) {
      setActiveTempResetRequest(tempPassMatch);
      setNewPasswordForm({
        tempPassword: cleanPass,
        newPassword: '',
        confirmPassword: ''
      });
      setResetModalError('');
      setShowForceResetModal(true);
      return;
    }

    // 1. Check Super Admin credentials
    if ((cleanLower === 'superadmin' || cleanLower === 'superadmin@respark.com' || cleanDigits === '9876543210') && cleanPass === 'admin123') {
      setCurrentUser(superAdminUser);
      navigate('/super-admin');
      return;
    }

    // 2. Check Company Admin credentials across all registered tenants (strictly matching Admin Email or Contact Mobile)
    const tenants = getTenants();
    const matchedTenant = tenants.find(t => {
      const emailMatch = t.email && t.email.toLowerCase() === cleanLower;
      const phoneMatch = t.mobile && cleanDigits.length >= 7 && t.mobile.replace(/\D/g, '').endsWith(cleanDigits.slice(-10));
      const passMatch = t.adminPassword === cleanPass;
      return (emailMatch || phoneMatch) && passMatch;
    });

    if (matchedTenant) {
      if (isTenantPlanExpired(matchedTenant)) {
        setErrorMessage('This salon subscription has reached its expiry date and is Inactive. Please contact your platform super administrator to renew your plan.');
        return;
      }
      if (matchedTenant.status === 'Inactive') {
        setErrorMessage('This salon account has been marked Inactive by the platform super administrator. Login access is disabled. Please contact support.');
        return;
      }
      if (matchedTenant.status === 'Suspended') {
        setErrorMessage('This salon account has been suspended by the platform administrator. Please contact support.');
        return;
      }

      const companyAdmin = {
        id: 'usr_' + matchedTenant.id,
        username: matchedTenant.email,
        email: matchedTenant.email,
        name: `${matchedTenant.ownerName} (Admin)`,
        role: 'COMPANY_ADMIN',
        companyId: matchedTenant.id,
        companyName: matchedTenant.companyName,
        branchId: matchedTenant.branches?.[0]?.id || 'b_1',
        branchName: matchedTenant.branches?.[0]?.name || 'Main Branch'
      };

      setActiveTenant(matchedTenant);
      setCurrentUser(companyAdmin);
      navigate('/pos');
      return;
    }

    // 3. Check Cashier credentials across all registered salon companies
    const cashierAuth = findCashierByCredentials(cleanUser, cleanPass);
    if (cashierAuth) {
      const { tenant: t, cashier: c } = cashierAuth;

      if (isTenantPlanExpired(t)) {
        setErrorMessage('This salon subscription has reached its expiry date and is Inactive. Please contact your salon owner to renew.');
        return;
      }
      if (t.status === 'Inactive') {
        setErrorMessage('This salon account is currently Inactive. Login access for cashiers is disabled. Please contact your salon owner.');
        return;
      }
      if (t.status === 'Suspended') {
        setErrorMessage('This salon account has been suspended by the platform administrator.');
        return;
      }
      if (c.active === false) {
        setErrorMessage('This cashier account is currently disabled. Please contact your salon manager.');
        return;
      }

      const cashierUser = {
        id: 'usr_cashier_' + c.id,
        cashierId: c.id,
        username: c.username,
        email: c.email || (c.username?.includes('@') ? c.username : `${c.username || 'cashier'}@saloon.com`),
        name: c.name,
        role: 'CASHIER',
        position: 'Front Desk Cashier',
        companyId: t.id,
        companyName: t.companyName,
        branchId: t.branches?.[0]?.id || 'b_1',
        branchName: c.branchName || t.branches?.[0]?.name || 'Main Counter',
        phone: c.phone
      };

      setActiveTenant(t);
      setCurrentUser(cashierUser);
      navigate('/pos');
      return;
    }

    // 4. Fallback for legacy admin
    if (cleanUser === 'admin' && cleanPass === 'admin123') {
      const defaultTenant = tenants[0];
      setActiveTenant(defaultTenant);
      setCurrentUser({
        id: 'usr_admin',
        username: 'admin',
        name: 'Salon Admin',
        role: 'COMPANY_ADMIN',
        companyId: defaultTenant.id,
        companyName: defaultTenant.companyName,
        branchId: defaultTenant.branches?.[0]?.id,
        branchName: defaultTenant.branches?.[0]?.name
      });
      navigate('/pos');
      return;
    }

    setErrorMessage('Invalid username or password. Please check your credentials.');
  };

  // Handle Submit Forgot Password Request
  const handleSubmitForgotRequest = (e) => {
    e.preventDefault();
    setForgotFeedback(null);
    setIsSubmittingForgot(true);

    const res = submitResetRequest(forgotIdentifier);
    setIsSubmittingForgot(false);
    if (!res.success) {
      setForgotFeedback({
        type: 'error',
        message: res.message
      });
    } else {
      setForgotFeedback({
        type: 'success',
        role: res.role,
        tenant: res.tenant,
        cashier: res.cashier,
        isAlreadyPending: res.isAlreadyPending,
        isAlreadyApproved: res.isAlreadyApproved,
        tempPassword: res.tempPassword,
        request: res.request,
        message: res.message
      });
    }
  };

  // Handle Forced Reset Password Submission (when using Temporary Password)
  const handleForceResetSubmit = (e) => {
    e.preventDefault();
    setResetModalError('');
    if (!newPasswordForm.newPassword || newPasswordForm.newPassword.length < 4) {
      setResetModalError('New password must be at least 4 characters long.');
      return;
    }
    if (newPasswordForm.newPassword !== newPasswordForm.confirmPassword) {
      setResetModalError('New password and Confirm password do not match.');
      return;
    }

    const res = completePasswordReset(activeTempResetRequest.id, newPasswordForm.newPassword);
    if (!res.success) {
      setResetModalError(res.message || 'Failed to update password.');
      return;
    }

    setShowForceResetModal(false);

    // Auto-login into workspace
    if (activeTempResetRequest.role === 'COMPANY_ADMIN') {
      const currentTenants = getTenants();
      const target = currentTenants.find(t => t.id === activeTempResetRequest.tenantId) || currentTenants[0];
      const companyAdmin = {
        id: 'usr_' + target.id,
        username: target.email || target.adminUsername,
        email: target.email,
        name: `${target.ownerName} (Admin)`,
        role: 'COMPANY_ADMIN',
        companyId: target.id,
        companyName: target.companyName,
        branchId: target.branches?.[0]?.id || 'b_1',
        branchName: target.branches?.[0]?.name || 'Main Branch'
      };
      setActiveTenant(target);
      setCurrentUser(companyAdmin);
      navigate('/pos');
    } else if (activeTempResetRequest.role === 'CASHIER') {
      const currentTenants = getTenants();
      const target = currentTenants.find(t => t.id === activeTempResetRequest.tenantId) || currentTenants[0];
      const cashiers = getCashiersForTenant(target.id);
      const cashier = cashiers.find(c => c.id === activeTempResetRequest.userId) || {
        id: activeTempResetRequest.userId,
        name: activeTempResetRequest.userName,
        username: 'cashier'
      };
      const cashierUser = {
        id: 'usr_cashier_' + cashier.id,
        cashierId: cashier.id,
        username: cashier.username || 'cashier',
        email: cashier.email || (cashier.username?.includes('@') ? cashier.username : `${cashier.username || 'cashier'}@saloon.com`),
        name: cashier.name,
        role: 'CASHIER',
        position: 'Front Desk Cashier',
        companyId: target.id,
        companyName: target.companyName,
        branchId: target.branches?.[0]?.id || 'b_1',
        branchName: cashier.branchName || 'Main Counter',
        phone: cashier.phone
      };
      setActiveTenant(target);
      setCurrentUser(cashierUser);
      navigate('/pos');
    }
  };

  // Quick 1-Click Demo Login Helper
  const handleQuickLogin = (roleType, tenantId) => {
    setErrorMessage('');
    if (roleType === 'SUPER_ADMIN') {
      setUsername('superadmin');
      setPassword('admin123');
      setCurrentUser(superAdminUser);
      navigate('/super-admin');
    } else if (roleType === 'CASHIER') {
      const currentTenants = getTenants();
      const target = currentTenants.find(t => t.id === tenantId) || currentTenants[0];
      if (!target) return;
      const cashiers = getCashiersForTenant(target.id);
      const cashier = cashiers.find(c => c.active !== false) || cashiers[0] || {
        id: 'c_' + target.id,
        name: 'Front Desk Cashier',
        username: 'cashier',
        password: 'password123',
        branchName: 'Main Counter'
      };

      setUsername(cashier.username || 'cashier');
      setPassword(cashier.password || 'password123');

      const cashierUser = {
        id: 'usr_cashier_' + (cashier.id || target.id),
        cashierId: cashier.id,
        username: cashier.username || 'cashier',
        email: cashier.email || (cashier.username?.includes('@') ? cashier.username : `${cashier.username || 'cashier'}@saloon.com`),
        name: cashier.name,
        role: 'CASHIER',
        position: 'Front Desk Cashier',
        companyId: target.id,
        companyName: target.companyName,
        branchId: target.branches?.[0]?.id || 'b_1',
        branchName: cashier.branchName || 'Main Counter',
        phone: cashier.phone || '+91 9823412350'
      };

      setActiveTenant(target);
      setCurrentUser(cashierUser);
      navigate('/pos');
    } else {
      const currentTenants = getTenants();
      const target = currentTenants.find(t => t.id === tenantId);
      if (!target) return;

      if (target.status === 'Inactive' || isTenantPlanExpired(target)) {
        setErrorMessage('This salon subscription has reached its expiry date and is Inactive.');
        return;
      }
      if (target.status === 'Suspended') {
        setErrorMessage('This salon account has been suspended by the platform administrator.');
        return;
      }

      setUsername(target.email || target.adminUsername);
      setPassword(target.adminPassword);

      const companyAdmin = {
        id: 'usr_' + target.id,
        username: target.email || target.adminUsername,
        email: target.email,
        name: `${target.ownerName} (Admin)`,
        role: 'COMPANY_ADMIN',
        companyId: target.id,
        companyName: target.companyName,
        branchId: target.branches?.[0]?.id || 'b_1',
        branchName: target.branches?.[0]?.name || 'Main Branch'
      };
      setActiveTenant(target);
      setCurrentUser(companyAdmin);
      navigate('/pos');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 flex items-center justify-center p-4">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-indigo-500/30 to-violet-500/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-tl from-rose-500/30 to-pink-500/30 rounded-full blur-3xl"></div>

      {/* Logo Area */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center space-x-2.5 z-10">
        {activeTenant?.logoUrl ? (
          <img 
            src={activeTenant.logoUrl} 
            alt={activeTenant.companyName || 'Logo'} 
            className="h-10 max-w-[150px] object-contain rounded-lg bg-white/70 backdrop-blur-xs p-1 shadow-xs border border-white/60"
          />
        ) : (
          <span className="text-3xl font-extrabold tracking-tight">
            <span className="text-indigo-600">{activeTenant?.logoTextPrefix || 'GLA'}</span>
            <span className="text-rose-500">{activeTenant?.logoTextSuffix || 'MOUR'}</span>
          </span>
        )}
        <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
          Saloon SaaS
        </span>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 md:p-10 border border-slate-100">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Sign In to Workspace</h2>
          <p className="text-slate-500 mt-1.5 text-xs">Access Super Admin Console or your Salon Store.</p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2 animate-in fade-in duration-150">
            <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email or Contact Number Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email or Contact Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all text-slate-800 text-sm placeholder:text-slate-400"
                placeholder="Enter Email or Contact Number"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-9 pr-10 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all text-slate-800 text-sm placeholder:text-slate-400"
                placeholder="Enter Password"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                setForgotFeedback(null);
                setForgotIdentifier(username || '');
                setShowForgotModal(true);
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform active:scale-98 cursor-pointer"
          >
            Login to Account
          </button>
        </form>

        {/* 1-Click Role Switcher Demo Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
            Quick 1-Click Demo Login
          </div>
          <div>
            {/* Super Admin Shortcut */}
            <button
              type="button"
              onClick={() => handleQuickLogin('SUPER_ADMIN')}
              className="w-full p-2.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-xl text-left transition-all cursor-pointer group flex items-center justify-between shadow-2xs"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-amber-900">👑 Super Admin</span>
                </div>
                <span className="text-[10px] text-amber-700 block mt-0.5 font-mono">superadmin / admin123</span>
              </div>
              <ArrowRight size={14} className="text-amber-600 group-hover:translate-x-1 transition-transform shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: FORGOT PASSWORD REQUEST SUBMISSION               */}
      {/* ======================================================== */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowForgotModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 border border-slate-200 z-10 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${
                  forgotFeedback?.type === 'success'
                    ? forgotFeedback.isAlreadyPending
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-emerald-50 text-emerald-700'
                    : 'bg-indigo-50 text-indigo-700'
                }`}>
                  {forgotFeedback?.type === 'success' ? (
                    forgotFeedback.isAlreadyPending ? <Clock size={20} /> : <CheckCircle2 size={20} />
                  ) : (
                    <KeyRound size={20} />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {forgotFeedback?.type === 'success'
                      ? forgotFeedback.isAlreadyPending
                        ? 'Request Already Pending'
                        : 'Reset Request Submitted'
                      : 'Forgot Password'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {forgotFeedback?.type === 'success'
                      ? forgotFeedback.isAlreadyPending
                        ? 'You have already requested your reset password.'
                        : 'Your password reset request has been received and routed.'
                      : 'Submit a verified reset request to your administrator.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotFeedback(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {forgotFeedback?.type === 'success' ? (
              /* ======================================================== */
              /* SUCCESS / PENDING STATE: CONFIRMATION (FORM HIDDEN)     */
              /* ======================================================== */
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-150">
                {forgotFeedback.isAlreadyPending ? (
                  /* Amber Alert for already pending / on hold */
                  <div className="p-4 rounded-xl border bg-amber-50 border-amber-200 text-amber-900">
                    <div className="flex items-start gap-3">
                      <Clock size={22} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-xs text-amber-950">You Already Requested Your Reset Password</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-amber-800">{forgotFeedback.message}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Green Alert for new reset request */
                  <div className="p-4 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-900">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={22} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-xs text-emerald-950">Reset Request Processed</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-emerald-800">{forgotFeedback.message}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account & Routing Details */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] pb-2 border-b border-slate-200/60">
                    <span className="text-slate-500">Account Identifier:</span>
                    <span className="font-bold text-slate-800 font-mono">{forgotIdentifier}</span>
                  </div>

                  {forgotFeedback.isAlreadyPending && (
                    <>
                      <div className="flex items-center justify-between text-[11px] pb-2 border-b border-slate-200/60">
                        <span className="text-slate-500">Current Status:</span>
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          Pending Review (On Hold)
                        </span>
                      </div>
                      {forgotFeedback.request?.createdAt && (
                        <div className="flex items-center justify-between text-[11px] pb-2 border-b border-slate-200/60">
                          <span className="text-slate-500">Requested On:</span>
                          <span className="font-semibold text-slate-700">{forgotFeedback.request.createdAt}</span>
                        </div>
                      )}
                    </>
                  )}

                  {forgotFeedback.role === 'COMPANY_ADMIN' && (
                    <div className="flex items-start gap-2 pt-1 text-[11px] text-indigo-900">
                      <Shield size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Company Admin • {forgotFeedback.tenant?.companyName}</span>
                        <p className="text-slate-600 text-[11px] mt-0.5">
                          {forgotFeedback.isAlreadyPending
                            ? 'Your request is already waiting in the Platform Super Admin dashboard. A duplicate request cannot be sent. Please contact the Super Admin directly to approve.'
                            : 'Routed to Platform Super Admin. They will approve and issue your temporary password.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {forgotFeedback.role === 'CASHIER' && (
                    <div className="flex items-start gap-2 pt-1 text-[11px] text-emerald-900">
                      <Building2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Cashier ({forgotFeedback.cashier?.name}) • {forgotFeedback.tenant?.companyName}</span>
                        <p className="text-slate-600 text-[11px] mt-0.5">
                          {forgotFeedback.isAlreadyPending
                            ? 'Your request is already waiting in your Salon Owner dashboard. A duplicate request cannot be sent. Please ask your salon admin directly to approve.'
                            : 'Routed to your Salon Company Admin. They will approve and issue your temporary password.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* If already approved with temp password */}
                {forgotFeedback.isAlreadyApproved && forgotFeedback.tempPassword && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 animate-in fade-in">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                      Your Approved Temporary Password:
                    </span>
                    <div className="flex items-center justify-between mt-1.5">
                      <code className="text-sm font-black font-mono text-emerald-900 bg-white px-2.5 py-1 rounded border border-emerald-200 shadow-xs">
                        {forgotFeedback.tempPassword}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          setUsername(forgotIdentifier);
                          setPassword(forgotFeedback.tempPassword);
                          setShowForgotModal(false);
                          setForgotFeedback(null);
                        }}
                        className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                      >
                        Fill in Login
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirmation Footer: Back to Login button */}
                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotFeedback(null);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all active:scale-95 cursor-pointer"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            ) : (
              /* ======================================================== */
              /* INPUT STATE: FORM & SUBMIT BUTTON                         */
              /* ======================================================== */
              <>
                {/* Previous Request Rejection Notice (if last request was rejected) */}
                {(() => {
                  const detected = detectAccountRole(forgotIdentifier);
                  if (detected?.recentRejectedRequest) {
                    const rej = detected.recentRejectedRequest;
                    const approverTitle = detected.role === 'COMPANY_ADMIN' ? 'Super Admin' : 'Salon Admin';
                    const rejDate = rej.completedAt || rej.createdAt || 'recently';
                    return (
                      <div className="p-3.5 rounded-xl border bg-rose-50 border-rose-200 text-rose-950 text-xs leading-relaxed animate-in fade-in duration-150">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-rose-900">Previous Reset Request Rejected</p>
                            <p className="mt-0.5 text-[11px] leading-relaxed text-rose-800">
                              Your previous reset request was Rejected by the {approverTitle} on {rejDate}. If this was a mistake, you can submit a new request below.
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Dynamic Single-Role Approval Routing Notice */}
                {(() => {
                  const detected = detectAccountRole(forgotIdentifier);
                  if (detected?.role === 'COMPANY_ADMIN') {
                    return (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-[11px] text-indigo-900 flex items-start gap-2 animate-in fade-in">
                        <Shield size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-indigo-950">Company Admin ({detected.companyName}):</span>
                          <p className="mt-0.5 text-indigo-800">
                            Request routes to <strong>Platform Super Admin</strong> to approve & issue your temporary password.
                          </p>
                        </div>
                      </div>
                    );
                  }
                  if (detected?.role === 'CASHIER') {
                    return (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-900 flex items-start gap-2 animate-in fade-in">
                        <Building2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-emerald-950">Cashier ({detected.name} • {detected.companyName}):</span>
                          <p className="mt-0.5 text-emerald-800">
                            Request routes to your <strong>Salon Company Admin</strong> to approve & issue your temporary password.
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 flex items-start gap-2">
                      <KeyRound size={15} className="text-indigo-600 shrink-0 mt-0.5" />
                      <span>Enter your registered Email or Contact Number below to route your request to the appropriate administrator.</span>
                    </div>
                  );
                })()}

                {/* Error alert if any */}
                {forgotFeedback?.type === 'error' && (
                  <div className="p-3.5 rounded-xl border bg-rose-50 border-rose-200 text-rose-900 text-xs leading-relaxed animate-in fade-in duration-150">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Cannot Find Account</p>
                        <p className="mt-0.5 text-[11px]">{forgotFeedback.message}</p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmitForgotRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Registered Email or Contact Number *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input
                        type="text"
                        required
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        placeholder="e.g. ramesh@glamoursalon.com or 9876543210"
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      The system will automatically detect whether this is a Salon Admin or Cashier account.
                    </span>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotModal(false);
                        setForgotFeedback(null);
                      }}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingForgot}
                      className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmittingForgot ? 'Verifying...' : 'Submit Reset Request'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: FORCED SET NEW PERMANENT PASSWORD                */}
      {/* ======================================================== */}
      {showForceResetModal && activeTempResetRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 border border-slate-200 z-10 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create New Password</h3>
                  <p className="text-[11px] text-slate-500">Temporary password verified. Set your permanent credentials.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForceResetModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Account Info Pill */}
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">Account Authenticated</span>
                <span className="text-xs font-bold text-slate-900">{activeTempResetRequest.userName}</span>
                <span className="text-[11px] text-slate-500 block">{activeTempResetRequest.tenantName}</span>
              </div>
              <span className="text-[10px] font-extrabold bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase">
                {activeTempResetRequest.role === 'COMPANY_ADMIN' ? 'Company Admin' : 'Cashier'}
              </span>
            </div>

            {resetModalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{resetModalError}</span>
              </div>
            )}

            <form onSubmit={handleForceResetSubmit} className="space-y-3.5">
              {/* Temporary Password Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Password Used</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    readOnly
                    value={newPasswordForm.tempPassword}
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 cursor-not-allowed"
                  />
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
                  ✓ Verified by administrator
                </span>
              </div>

              {/* New Password Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Permanent Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={newPasswordForm.newPassword}
                    onChange={(e) => setNewPasswordForm({ ...newPasswordForm, newPassword: e.target.value })}
                    placeholder="Enter new permanent password"
                    className="w-full pl-9 pr-9 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={newPasswordForm.confirmPassword}
                    onChange={(e) => setNewPasswordForm({ ...newPasswordForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    className="w-full pl-9 pr-9 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowForceResetModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Save Password & Open Workspace</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
