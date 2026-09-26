import React, { useState, useEffect } from 'react';
import {
  CreditCard, Plus, Search, Shield, Eye, EyeOff,
  Edit2, Trash2, CheckCircle2, AlertCircle, X,
  KeyRound, User, Mail, Phone, Check, Lock, Copy, CheckCheck, MessageCircle
} from 'lucide-react';
import {
  getMasterCashiers,
  createCashier,
  updateCashier,
  deleteCashier
} from '../utils/cashierStorage';
import { getActiveTenant } from '../utils/saasStorage';
import {
  getCashierResetRequests,
  approveResetRequest,
  rejectResetRequest
} from '../utils/passwordResetStorage';

const CashierManagementPage = () => {
  const [cashiers, setCashiers] = useState(() => getMasterCashiers());
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState('');
  const [tenant, setTenant] = useState(() => getActiveTenant());

  // Password Reset Approval States
  const [cashierResetRequests, setCashierResetRequests] = useState(() => getCashierResetRequests(getActiveTenant()?.id));
  const [approvedCashierShareModal, setApprovedCashierShareModal] = useState(null);
  const [cashierCopySuccess, setCashierCopySuccess] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const emptyForm = {
    name: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    active: true
  };
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    const handleSync = () => {
      setCashiers(getMasterCashiers());
      const currentTenant = getActiveTenant();
      setTenant(currentTenant);
      if (currentTenant) {
        setCashierResetRequests(getCashierResetRequests(currentTenant.id));
      }
    };
    window.addEventListener('cashiersUpdated', handleSync);
    window.addEventListener('tenantChanged', handleSync);
    window.addEventListener('passwordResetsUpdated', handleSync);
    window.addEventListener('saasUpdated', handleSync);
    return () => {
      window.removeEventListener('cashiersUpdated', handleSync);
      window.removeEventListener('tenantChanged', handleSync);
      window.removeEventListener('passwordResetsUpdated', handleSync);
      window.removeEventListener('saasUpdated', handleSync);
    };
  }, []);

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3500);
  };

  const pendingCashierResetsCount = cashierResetRequests.filter(r => r.status === 'PENDING').length;

  const handleApproveCashierReset = (req) => {
    const updated = approveResetRequest(req.id, tenant?.ownerName || 'Company Admin');
    if (updated) {
      setCashierResetRequests(getCashierResetRequests(tenant?.id));
      setApprovedCashierShareModal({
        request: updated,
        tempPassword: updated.tempPassword
      });
      showToast(`Temporary password generated for cashier ${updated.userName}.`);
    }
  };

  const handleRejectCashierReset = (req) => {
    if (window.confirm(`Reject password reset request for cashier "${req.userName}"?`)) {
      rejectResetRequest(req.id, tenant?.ownerName || 'Company Admin');
      setCashierResetRequests(getCashierResetRequests(tenant?.id));
      showToast(`Rejected password reset for cashier ${req.userName}.`);
    }
  };

  const handleCopyCashierPassword = (pass) => {
    navigator.clipboard.writeText(pass);
    setCashierCopySuccess(true);
    setTimeout(() => setCashierCopySuccess(false), 2500);
  };

  // Effective maxCashiers allowed by Super Admin for this salon
  const maxCashiers = tenant?.maxCashiers !== undefined
    ? Number(tenant.maxCashiers)
    : (tenant?.planId === 'plan_enterprise' ? 5 : tenant?.planId === 'plan_growth' ? 2 : 1);
  const totalCashiers = cashiers.length;
  const isQuotaReached = totalCashiers >= maxCashiers;

  // Open Create Modal (with Quota Enforcement)
  const handleOpenCreate = () => {
    if (isQuotaReached) {
      showToast(`⚠️ Cashier Limit Reached: Your subscription allows maximum ${maxCashiers} cashier(s). Contact platform admin to increase limit.`);
      return;
    }
    setIsEditing(false);
    setSelectedId(null);
    setFormData(emptyForm);
    setShowPassword(false);
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (c) => {
    setIsEditing(true);
    setSelectedId(c.id);
    setFormData({
      name: c.name || '',
      email: c.email || '',
      username: c.username || '',
      password: c.password || '',
      phone: c.phone || '',
      active: c.active !== false
    });
    setShowPassword(false);
    setShowModal(true);
  };

  // Save Cashier Form
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter Cashier Name.');
      return;
    }
    if (!formData.username.trim()) {
      alert('Please enter Login Username.');
      return;
    }
    if (!isEditing && !formData.password.trim()) {
      alert('Please set a password for the cashier.');
      return;
    }

    if (!isEditing && cashiers.length >= maxCashiers) {
      alert(`Cannot create cashier: Your salon has reached the maximum allowed limit of ${maxCashiers} cashier(s). Please contact Platform Super Admin to increase your limit.`);
      return;
    }

    if (isEditing) {
      updateCashier(selectedId, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        username: formData.username.trim(),
        phone: formData.phone.trim(),
        active: formData.active,
        ...(formData.password.trim() ? { password: formData.password.trim() } : {})
      });
      showToast(`Cashier "${formData.name}" updated successfully.`);
    } else {
      createCashier(formData);
      showToast(`New Cashier "${formData.name}" created successfully.`);
    }
    setShowModal(false);
    setFormData(emptyForm);
  };

  // Toggle Active Status
  const handleToggleActive = (c) => {
    const updated = updateCashier(c.id, { active: !c.active });
    setCashiers(updated);
    showToast(`Cashier ${c.name} is now ${!c.active ? 'Active' : 'Inactive'}.`);
  };

  // Delete Cashier
  const handleDelete = (c) => {
    if (window.confirm(`Are you sure you want to remove cashier "${c.name}"? They will no longer be able to log in.`)) {
      const updated = deleteCashier(c.id);
      setCashiers(updated);
      showToast(`Cashier account removed.`);
    }
  };

  // Filtered Cashiers
  const filteredCashiers = cashiers.filter(c => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (c.name || '').toLowerCase().includes(q);
    const userMatch = (c.username || '').toLowerCase().includes(q);
    const emailMatch = (c.email || '').toLowerCase().includes(q);
    const phoneMatch = (c.phone || '').includes(q);
    return nameMatch || userMatch || emailMatch || phoneMatch;
  });

  const activeCount = cashiers.filter(c => c.active !== false).length;
  const inactiveCount = cashiers.filter(c => c.active === false).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
              <KeyRound size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Cashier Management
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage front-desk cashiers and login terminals for <span className="font-bold text-slate-700">{tenant?.companyName || 'your salon'}</span>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end border-r border-slate-200 pr-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Terminal Quota</span>
            <span className={`text-xs font-black ${isQuotaReached ? 'text-rose-600' : 'text-slate-800'}`}>
              {totalCashiers} / {maxCashiers} Created
            </span>
          </div>

          <button
            onClick={handleOpenCreate}
            disabled={isQuotaReached}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer ${
              isQuotaReached
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-indigo-200 active:scale-95'
            }`}
            title={isQuotaReached ? `Quota limit reached (${totalCashiers}/${maxCashiers} cashiers created). Please contact platform admin.` : 'Create New Cashier'}
          >
            <Plus size={16} />
            <span>Create New Cashier</span>
            {isQuotaReached && (
              <span className="bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0.5 rounded font-bold">
                Quota Full
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Quota Reached Alert Banner */}
      {isQuotaReached && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900 animate-in fade-in duration-200">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-rose-900">
                Cashier Account Limit Reached ({totalCashiers} of {maxCashiers} Cashiers Created)
              </p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                The Platform Super Admin has capped your salon at a maximum of <strong>{maxCashiers} cashier account{maxCashiers > 1 ? 's' : ''}</strong>. You cannot create more cashiers unless you upgrade your plan or remove an unused cashier.
              </p>
            </div>
          </div>
          <span className="shrink-0 bg-rose-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-lg text-center shadow-xs">
            Limit Reached ({totalCashiers}/{maxCashiers})
          </span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cashier Quota</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isQuotaReached ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
              <CreditCard size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-2xl font-black ${isQuotaReached ? 'text-rose-600' : 'text-slate-800'}`}>{totalCashiers}</span>
            <span className="text-sm font-bold text-slate-400">/ {maxCashiers} Allowed</span>
          </div>
          <div className="mt-1">
            {isQuotaReached ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                ● Maximum Quota Reached
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                ● {maxCashiers - totalCashiers} Slot{maxCashiers - totalCashiers > 1 ? 's' : ''} Available
              </span>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Terminals</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{activeCount}</div>
          <span className="text-[11px] text-emerald-600/80 font-medium">Allowed to log in to POS</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inactive Accounts</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-500 mt-2">{inactiveCount}</div>
          <span className="text-[11px] text-slate-400 font-medium">Access suspended</span>
        </div>
      </div>

      {/* Permissions Context Banner */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <Shield size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-bold">Cashier Role Permissions:</span> Cashiers have strictly scoped access. Once logged in, they can only view and operate the <span className="font-semibold underline">POS (Billing)</span>, <span className="font-semibold underline">Appointments Calendar</span>, and <span className="font-semibold underline">CRM (Guests)</span>. Backoffice master settings, staff records, payroll salaries, and company expenses are completely blocked.
        </div>
      </div>

      {/* Cashier Password Reset Requests Section */}
      {cashierResetRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-indigo-100 p-5 shadow-xs space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                <KeyRound size={16} />
              </div>
              <h3 className="text-sm font-black text-slate-800">
                Cashier Password Reset Requests
              </h3>
              {pendingCashierResetsCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                  {pendingCashierResetsCount} Pending Approval
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Self-service cashier recovery (Company Admin approval)
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Cashier Name</th>
                  <th className="py-2.5 px-4">Contact Info</th>
                  <th className="py-2.5 px-4">Requested At</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {cashierResetRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">{req.userName}</td>
                    <td className="py-3 px-4">
                      <div>{req.email || req.accountIdentifier}</div>
                      {req.phone && <div className="text-[10px] text-slate-400">{req.phone}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{req.createdAt}</td>
                    <td className="py-3 px-4 text-center">
                      {req.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span>Needs Approval</span>
                        </span>
                      )}
                      {req.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span>✓ Active: <code className="font-mono text-emerald-800">{req.tempPassword}</code></span>
                        </span>
                      )}
                      {req.status === 'COMPLETED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          <span>Password Changed</span>
                        </span>
                      )}
                      {req.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                          <span>Declined</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {req.status === 'PENDING' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApproveCashierReset(req)}
                            className="flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold px-3 py-1 rounded-lg text-xs shadow-xs transition-all cursor-pointer"
                          >
                            <KeyRound size={12} />
                            <span>Approve & Issue Temp Password</span>
                          </button>
                          <button
                            onClick={() => handleRejectCashierReset(req)}
                            className="px-2 py-1 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {req.status === 'APPROVED' && (
                        <button
                          onClick={() => setApprovedCashierShareModal({ request: req, tempPassword: req.tempPassword })}
                          className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-1 rounded-lg text-xs cursor-pointer ml-auto"
                        >
                          <Copy size={12} />
                          <span>View / Share Password</span>
                        </button>
                      )}
                      {req.status === 'COMPLETED' && (
                        <span className="text-[10px] text-slate-400 italic">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cashier by name, username, email, or phone..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
          />
        </div>
        <span className="text-xs text-slate-400 self-center">
          Showing {filteredCashiers.length} of {totalCashiers} cashier(s)
        </span>
      </div>

      {/* Cashier Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left border-collapse text-sm">
            <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-5">Cashier Profile</th>
                <th className="py-3.5 px-4">Login Username</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-center">Login Access</th>
                <th className="py-3.5 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCashiers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 text-xs">
                    No cashier accounts match your search. Click <strong>"+ Create New Cashier"</strong> to add one.
                  </td>
                </tr>
              ) : (
                filteredCashiers.map((c) => {
                  const initials = (c.name || 'Cashier')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();
                  const isActive = c.active !== false;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              {c.name}
                              <span className="text-[10px] bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded font-semibold border border-sky-200">
                                Cashier
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Mail size={11} className="text-slate-400" />
                              <span>{c.email || 'No email provided'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Login Username */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md font-mono text-xs font-bold border border-slate-200">
                          @{c.username || 'cashier'}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono text-slate-700 text-xs">
                        {c.phone || '-'}
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {c.createdAt || 'Recent'}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(c)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                          }`}
                          title="Click to toggle login status"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Cashier Profile & Credentials"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(c)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Cashier Account"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create / Edit Cashier */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {isEditing ? `Edit Cashier - ${formData.name}` : 'Create New Cashier Terminal'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Set front-desk login credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cashier Full Name *</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Pooja Sharma"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (Optional / Recovery)</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. pooja@saloon.com"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Login Username & Phone Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Login Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. cashier or pooja"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 9823412350"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isEditing ? 'New Password (leave blank to keep current)' : 'Password *'}
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!isEditing}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={isEditing ? '••••••••' : 'Enter login password'}
                    className="w-full pl-9 pr-10 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Allow Portal Login</span>
                  <span className="text-[11px] text-slate-400 block">Disable if the cashier is on leave or inactive</span>
                </div>
                <div
                  onClick={() => setFormData({ ...formData, active: !formData.active })}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                    formData.active ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      formData.active ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {isEditing ? 'Save Changes' : 'Create Cashier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Share Cashier Temporary Password */}
      {approvedCashierShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setApprovedCashierShareModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 border border-slate-200 z-10 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cashier Temporary Password Issued</h3>
                  <p className="text-[11px] text-slate-500">Provide this temporary code to the cashier.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApprovedCashierShareModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
              <div>Cashier: <strong className="text-slate-900">{approvedCashierShareModal.request?.userName}</strong></div>
              <div>Phone: <strong className="text-slate-700 font-mono">{approvedCashierShareModal.request?.phone || 'N/A'}</strong></div>
            </div>

            {/* Code Box */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                Single-Use Temporary Password
              </span>
              <div className="text-2xl font-black font-mono text-emerald-800 bg-white py-2 px-4 rounded-xl border border-emerald-200 inline-block shadow-xs">
                {approvedCashierShareModal.tempPassword}
              </div>
              <p className="text-[11px] text-emerald-700">
                When the cashier enters this code at login, they will be prompted to set their new permanent password immediately.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleCopyCashierPassword(approvedCashierShareModal.tempPassword)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                {cashierCopySuccess ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{cashierCopySuccess ? 'Copied to Clipboard!' : 'Copy Password'}</span>
              </button>

              <a
                href={`https://wa.me/${(approvedCashierShareModal.request?.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Hello ${approvedCashierShareModal.request?.userName}, your temporary cashier login password is: ${approvedCashierShareModal.tempPassword}. Please log in and create your new permanent password.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <MessageCircle size={14} />
                <span>Send WhatsApp</span>
              </a>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setApprovedCashierShareModal(null)}
                className="px-4 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierManagementPage;
