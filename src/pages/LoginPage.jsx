import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Lock, Eye, EyeOff, Building2, Shield, ArrowRight,
  CheckCircle2, AlertCircle, KeyRound, Mail, Phone, X, Check,
  Clock, AlertTriangle, Loader2
} from 'lucide-react';
import {
  setActiveTenant,
  setCurrentUser,
} from '../utils/saasStorage';
import { authApi, purgeLegacyMockAuthData, getToken, setToken } from '../api/client';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();

  // Automatically clear old mock login data on mount
  useEffect(() => {
    purgeLegacyMockAuthData();
  }, []);

  // Password Recovery Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotFeedback, setForgotFeedback] = useState(null);
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);

  // Forced Set New Password Modal States (When logging in with mustChangePassword = true)
  const [showForceResetModal, setShowForceResetModal] = useState(false);
  const [activeTempResetUser, setActiveTempResetUser] = useState(null);
  const [tempAuthToken, setTempAuthToken] = useState(null);
  const [newPasswordForm, setNewPasswordForm] = useState({
    tempPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetModalError, setResetModalError] = useState('');
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  const routeByRole = (user) => {
    const role = user.role?.name || user.role;
    if (user.isSuperAdmin || role === 'SUPERADMIN' || role === 'SUPER_ADMIN') {
      navigate('/super-admin');
    } else {
      navigate('/pos');
    }
  };

  const syncUserSession = (authData) => {
    const user = authData.user;
    const roleName = user.role?.name || user.role;
    const normalizedRole = (roleName === 'SUPERADMIN' || user.isSuperAdmin)
      ? 'SUPER_ADMIN'
      : roleName === 'ADMIN'
      ? 'COMPANY_ADMIN'
      : 'CASHIER';

    const sessionUser = {
      id: user.id,
      username: user.username,
      email: user.email || `${user.username}@saloon.local`,
      name: user.username,
      role: normalizedRole,
      backendRole: roleName,
      isSuperAdmin: Boolean(user.isSuperAdmin || roleName === 'SUPERADMIN'),
      mustChangePassword: Boolean(user.mustChangePassword),
      companyId: user.tenantId,
      companyName: user.company?.name || 'Salon Company',
      tenantId: user.tenantId,
      enabledModules: user.enabledModules || [],
      permissions: user.role?.permissions || [],
    };

    setCurrentUser(sessionUser);

    if (user.company) {
      setActiveTenant({
        id: user.company.id,
        companyName: user.company.name,
        brandName: user.company.name,
        logoUrl: user.company.logoUrl || null,
        status: user.subscription?.status || 'Active',
        email: user.company.contactEmail || user.email,
        mobile: user.company.contactPhone,
        address: user.company.address,
        planName: user.subscription?.plan || 'Enterprise Plan',
        branches: [{ id: 'b_1', name: user.company.primaryBranchName || 'Main Counter / Branch', isPrimary: true }]
      });
    }

    return sessionUser;
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await authApi.login(cleanUser, cleanPass);
      const authData = res.data;
      const sessionUser = syncUserSession(authData);
      const authToken = authData?.token || res?.token || res?.data?.token;

      if (authToken) {
        setToken(authToken);
        setTempAuthToken(authToken);
      }

      if (authData.user?.mustChangePassword) {
        setActiveTempResetUser(sessionUser);
        setNewPasswordForm({
          tempPassword: cleanPass,
          newPassword: '',
          confirmPassword: ''
        });
        setResetModalError('');
        setShowForceResetModal(true);
      } else {
        routeByRole(sessionUser);
      }
    } catch (err) {
      const msg = err.data?.message || err.message || 'Login failed. Please check your credentials.';
      setErrorMessage(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Forced Reset Password Submission (when using Temporary Password)
  const handleForceResetSubmit = async (e) => {
    e.preventDefault();
    setResetModalError('');

    if (!newPasswordForm.newPassword || newPasswordForm.newPassword.length < 8) {
      setResetModalError('New password must be at least 8 characters long.');
      return;
    }
    if (newPasswordForm.newPassword !== newPasswordForm.confirmPassword) {
      setResetModalError('New password and Confirm password do not match.');
      return;
    }

    setIsSubmittingReset(true);
    try {
      const activeToken = tempAuthToken || getToken();
      await authApi.changePassword(newPasswordForm.tempPassword, newPasswordForm.newPassword, activeToken);
      setShowForceResetModal(false);

      if (activeTempResetUser) {
        const updated = { ...activeTempResetUser, mustChangePassword: false };
        setCurrentUser(updated);
        routeByRole(updated);
      } else {
        navigate('/pos');
      }
    } catch (err) {
      setResetModalError(err.data?.message || err.message || 'Failed to update password.');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // Handle Submit Forgot Password Request
  const handleSubmitForgotRequest = async (e) => {
    e.preventDefault();
    setForgotFeedback(null);
    setIsSubmittingForgot(true);

    try {
      const res = await authApi.forgotPassword(forgotIdentifier);
      const data = res.data || res;
      setForgotFeedback({
        type: 'success',
        role: data.role,
        message: data.message || res.message,
        status: data.status,
        isPending: data.status === 'PENDING_APPROVAL',
        temporaryPassword: data.temporaryPassword,
      });
    } catch (err) {
      setForgotFeedback({
        type: 'error',
        message: err.data?.message || err.message || 'Could not find an account matching that identifier.',
      });
    } finally {
      setIsSubmittingForgot(false);
    }
  };


  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 flex items-center justify-center p-4">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-indigo-500/30 to-violet-500/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-tl from-rose-500/30 to-pink-500/30 rounded-full blur-3xl"></div>

      {/* Logo Area */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center space-x-2.5 z-10">
        <span className="text-3xl font-extrabold tracking-tight">
          <span className="text-indigo-600">QUB</span>
          <span className="text-rose-500">EXE</span>
        </span>
        <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
          Salon ERP
        </span>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 md:p-10 border border-slate-100">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Sign In to Portal</h2>
          <p className="text-slate-500 mt-1.5 text-xs">Enter your credentials for Super Admin, Company Admin, or Cashier.</p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2 animate-in fade-in duration-150">
            <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Username / Email Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Username or Registered Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all text-slate-800 text-sm placeholder:text-slate-400"
                placeholder="e.g. superadmin, admin, or cashier"
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
                placeholder="Enter password"
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
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform active:scale-98 cursor-pointer disabled:opacity-60"
          >
            {isLoggingIn ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                <span>Authenticating with Backend...</span>
              </>
            ) : (
              <span>Login to Account</span>
            )}
          </button>
        </form>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: FORGOT PASSWORD REQUEST                          */}
      {/* ======================================================== */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowForgotModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 border border-slate-200 z-10 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Password Recovery</h3>
                  <p className="text-[11px] text-slate-500">Reset your password or submit an approval request.</p>
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
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className={`p-4 rounded-xl border ${
                  forgotFeedback.isPending ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="flex items-start gap-3">
                    {forgotFeedback.isPending ? (
                      <Clock size={22} className="text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 size={22} className="text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold text-xs">{forgotFeedback.isPending ? 'Approval Request Pending' : 'Recovery Processed'}</p>
                      <p className="mt-1 text-[11px] leading-relaxed">{forgotFeedback.message}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotFeedback(null);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 cursor-pointer"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            ) : (
              <>
                {forgotFeedback?.type === 'error' && (
                  <div className="p-3.5 rounded-xl border bg-rose-50 border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                    <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                    <span>{forgotFeedback.message}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitForgotRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Registered Username, Email or Phone Number *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input
                        type="text"
                        required
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        placeholder="e.g. superadmin, admin, or cashier"
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      SuperAdmins receive temporary passwords via email; Company Admins & Cashiers route to their approver.
                    </span>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingForgot}
                      className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingForgot ? 'Processing...' : 'Submit Request'}
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
      {showForceResetModal && activeTempResetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 border border-slate-200 z-10 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Set New Permanent Password</h3>
                  <p className="text-[11px] text-slate-500">First-time login or temporary password detected.</p>
                </div>
              </div>
            </div>

            {/* Account Info Pill */}
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">Logged In As</span>
                <span className="text-xs font-bold text-slate-900">{activeTempResetUser.username}</span>
                <span className="text-[11px] text-slate-500 block">{activeTempResetUser.companyName}</span>
              </div>
              <span className="text-[10px] font-extrabold bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase">
                {activeTempResetUser.role}
              </span>
            </div>

            {resetModalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{resetModalError}</span>
              </div>
            )}

            <form onSubmit={handleForceResetSubmit} className="space-y-3.5">
              {/* New Password Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Permanent Password (Min 8 characters) *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={8}
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
                    minLength={8}
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
                  type="submit"
                  disabled={isSubmittingReset}
                  className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingReset ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving New Password...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Save Password & Open Workspace</span>
                    </>
                  )}
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
