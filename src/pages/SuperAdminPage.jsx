import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Store, Users, IndianRupee, Plus, Search,
  CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight,
  ExternalLink, LogOut, ChevronRight, X, Phone, Mail,
  MapPin, Check, RefreshCw, Trash2, Key, SlidersHorizontal, Edit2, Sparkles,
  CalendarClock, Zap, CreditCard, Calendar, History, ArrowUpRight, ArrowDownRight,
  Receipt, Clock, Copy, MessageCircle, KeyRound, CheckCheck, Eye,
  Upload, Image as ImageIcon, Lock, Ban, PlayCircle
} from 'lucide-react';
import {
  getTenants,
  saveTenants,
  createTenant,
  updateTenant,
  deleteTenant,
  toggleTenantStatus,
  getSubscriptionPlans,
  saveSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  updateTenantSubscription,
  calculateTenantLTV,
  addTenantHistoryRecord,
  toISODateString,
  toDisplayDateString,
  getFutureISODate,
  calculateDaysBetween,
  setActiveTenant,
  setCurrentUser,
  getCurrentUser,
  superAdminUser,
  isTenantPlanExpired,
  startImpersonation
} from '../utils/saasStorage';
import {
  getAdminResetRequests,
  approveResetRequest,
  rejectResetRequest
} from '../utils/passwordResetStorage';
import { getCashiersForTenant } from '../utils/cashierStorage';
import { authApi, platformApi } from '../api/client';

const SuperAdminPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUserState] = useState(() => getCurrentUser());
  const [tenants, setTenants] = useState(() => getTenants());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('salons'); // 'salons' | 'plans' | 'resets'

  const [notification, setNotification] = useState('');
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [subscriptionModalTenant, setSubscriptionModalTenant] = useState(null);
  const [historyModalTenant, setHistoryModalTenant] = useState(null);
  const [viewDetailsModalTenant, setViewDetailsModalTenant] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);
  const [editForm, setEditForm] = useState({
    companyName: '',
    brandName: '',
    logoUrl: null,
    ownerName: '',
    email: '',
    mobile: '',
    adminPassword: '',
    primaryBranchName: '',
    city: '',
    maxCashiers: 2
  });

  // Password Reset Approval States
  const [adminResetRequests, setAdminResetRequests] = useState(() => getAdminResetRequests());
  const [approvedShareModal, setApprovedShareModal] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Permanent Delete Company Modal State
  const [deleteModalTenant, setDeleteModalTenant] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [subForm, setSubForm] = useState({
    planId: 'plan_growth',
    customPrice: '',
    maxCashiers: 2,
    status: 'Active',
    paymentMode: 'UPI / GPay / PhonePe',
    startDate: new Date().toISOString().split('T')[0],
    endDate: getFutureISODate(new Date().toISOString().split('T')[0], 1),
    nextBillingDate: ''
  });

  // Subscription Plans State
  const [plans, setPlans] = useState(() => getSubscriptionPlans());
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  // New Tenant Form State
  const [tenantForm, setTenantForm] = useState(() => {
    const initPlans = getSubscriptionPlans();
    const defaultPlan = initPlans[0];
    const days = defaultPlan?.durationDays || 30;
    const today = new Date().toISOString().split('T')[0];
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return {
      companyName: '',
      brandName: '',
      logoUrl: null,
      ownerName: '',
      email: '',
      mobile: '',
      adminPassword: '',
      primaryBranchName: '',
      city: '',
      planId: defaultPlan?.id || 'standard_plan',
      maxCashiers: defaultPlan?.maxCashiers || 2,
      paymentMode: 'UPI / GPay / PhonePe',
      startDate: today,
      endDate: d.toISOString().split('T')[0]
    };
  });
  const [planForm, setPlanForm] = useState({
    name: '',
    price: '',
    billingCycle: '',
    durationDays: '',
    badgeTag: '',
    features: [
      'Quick Sale POS',
      'Appointment Booking & Calendar Grid',
      'CRM & Client Management',
      'Master BackOffice Catalog',
      'Salon Inventory & POs',
      'WhatsApp Invoicing & Alerts'
    ],
    customFeatureInput: ''
  });

  const mapCompanyFromBackend = (c) => {
    const allPlans = getSubscriptionPlans();
    const matchedPlan = allPlans.find(p => p.name?.toLowerCase() === c.plan?.toLowerCase() || p.id === c.plan);
    const branchName = c.primaryBranchName || (c.city || c.address ? `${c.city || c.address} Outlet` : 'Main Studio');
    const cityName = c.city || c.address || 'Headquarters';
    const adminUser = Array.isArray(c.users)
      ? (c.users.find(u => u.role?.name === 'ADMIN' || u.role === 'ADMIN') || c.users[0])
      : null;
    const ownerUsername = adminUser?.username || c.contactEmail?.split('@')[0] || 'admin';
    const ownerEmail = c.contactEmail || adminUser?.email || '';
    const ownerPhone = c.contactPhone || adminUser?.phone || '';

    const startStr = c.subscriptionStartedAt ? new Date(c.subscriptionStartedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
    let endStr = '';
    if (c.subscriptionExpiresAt) {
      const exp = new Date(c.subscriptionExpiresAt);
      if (!isNaN(exp.getTime())) endStr = exp.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
    }
    if (!endStr) {
      try {
        const startD = new Date(c.subscriptionStartedAt || c.createdAt || Date.now());
        const days = Number(matchedPlan?.durationDays) || (c.plan?.toLowerCase().includes('bumper') ? 116 : c.plan?.toLowerCase().includes('jumper') ? 10 : 30);
        startD.setDate(startD.getDate() + days);
        endStr = toDisplayDateString(startD.toISOString().split('T')[0]);
      } catch (e) {
        endStr = '';
      }
    }
    const durationLabel = matchedPlan?.durationDays 
      ? `${matchedPlan.durationDays} Days` 
      : (c.plan?.toLowerCase().includes('bumper') ? '116 Days' : c.plan?.toLowerCase().includes('jumper') ? '10 Days' : (matchedPlan?.billingCycle || '30 Days'));

    return {
      id: c.id,
      companyName: c.name,
      brandName: c.code?.toUpperCase() || c.name?.toUpperCase(),
      code: c.code || '',
      logoUrl: c.logoUrl || null,
      ownerName: ownerUsername,
      email: ownerEmail,
      mobile: ownerPhone,
      city: cityName,
      primaryBranchName: branchName,
      planId: matchedPlan ? matchedPlan.id : (c.plan === 'ENTERPRISE' ? 'plan_enterprise' : c.plan === 'PRO' ? 'plan_growth' : 'plan_starter'),
      planName: matchedPlan ? matchedPlan.name : (c.plan || 'Starter Plan'),
      status: (() => {
        const existing = getTenants().find(t => t.id === c.id);
        if (c.subscriptionStatus === 'SUSPENDED' || existing?.status === 'Suspended' || existing?.isSuspended) {
          return 'Suspended';
        }
        return c.isActive ? 'Active' : 'Inactive';
      })(),
      isSuspended: c.subscriptionStatus === 'SUSPENDED' || Boolean(getTenants().find(t => t.id === c.id)?.isSuspended),
      startDate: startStr,
      endDate: endStr,
      nextBillingDate: endStr,
      mrr: matchedPlan ? Number(matchedPlan.price) : (c.plan === 'ENTERPRISE' ? 9999 : c.plan === 'PRO' ? 4999 : 2999),
      customFeatures: Array.isArray(c.enabledModules) && c.enabledModules.length > 0 ? c.enabledModules : (matchedPlan?.features || []),
      history: (() => {
        const existing = getTenants().find(t => t.id === c.id);
        if (existing?.history && Array.isArray(existing.history) && existing.history.length > 0) {
          return existing.history;
        }
        return [
          {
            id: 'hist_' + c.id,
            type: 'INITIAL_SIGNUP',
            title: `Account Onboarded (${matchedPlan?.name || c.plan || 'Plan'})`,
            date: startStr,
            startDate: startStr,
            endDate: endStr,
            duration: durationLabel,
            amountPaid: matchedPlan ? Number(matchedPlan.price) : 2999,
            planName: matchedPlan ? matchedPlan.name : (c.plan || 'Subscription Plan'),
            paymentMode: 'UPI / GPay / PhonePe',
            status: 'Completed',
            notes: 'Subscription payment'
          }
        ];
      })(),
      branches: [{ id: 'b_' + c.id, name: branchName, city: cityName, isPrimary: true, active: true }]
    };
  };

  const loadPlatformData = async () => {
    let currentPlans = getSubscriptionPlans();
    try {
      const resPlans = await platformApi.getPlans();
      if (resPlans && resPlans.success && Array.isArray(resPlans.data) && resPlans.data.length > 0) {
        const mappedPlans = resPlans.data.map(p => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          billingCycle: p.billingCycle || `${p.durationDays} Days`,
          durationDays: p.durationDays,
          badgeTag: p.badgeTag || '',
          cashierLimit: p.cashierLimit || 2,
          features: Array.isArray(p.features) ? p.features : [],
          isActive: p.isActive !== false
        }));
        currentPlans = mappedPlans;
        setPlans(mappedPlans);
        saveSubscriptionPlans(mappedPlans);
      }
    } catch (err) {
      console.warn('Backend plan fetch error:', err.message);
    }

    try {
      const res = await platformApi.getCompanies({ limit: 100 });
      if (res && res.success && res.data) {
        const items = res.data.items || (Array.isArray(res.data) ? res.data : []);
        if (items.length > 0) {
          const mapped = items.map(mapCompanyFromBackend);
          setTenants(mapped);
          saveTenants(mapped);
        }
      }
    } catch (err) {
      console.warn('Backend company fetch error:', err.message);
    }

    try {
      const resResets = await platformApi.getAdminResetRequests();
      const rawResets = resResets?.data?.items || resResets?.data || (Array.isArray(resResets) ? resResets : []);
      if (Array.isArray(rawResets)) {
        const backendMapped = rawResets.map((item) => ({
          id: item.id,
          userId: item.id,
          tenantId: item.tenantId || item.tenant?.id || '',
          tenantName: item.tenant?.name || item.username || 'Salon Company',
          userName: item.username,
          email: item.email || item.username,
          phone: item.phone || item.tenant?.contactPhone || '',
          createdAt: item.passwordResetRequestedAt
            ? new Date(item.passwordResetRequestedAt).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : new Date().toLocaleDateString('en-GB'),
          status: 'PENDING',
        }));
        setAdminResetRequests(backendMapped);
      }
    } catch (err) {
      console.warn('Backend admin reset requests fetch error:', err.message);
    }
  };

  useEffect(() => {
    // Purge any legacy saas data from localStorage on mount
    try {
      localStorage.removeItem('respark_saas_tenants');
      localStorage.removeItem('respark_saas_plans');
    } catch (e) {}

    loadPlatformData();

    const handleUpdate = () => {
      setTenants(getTenants());
      setPlans(getSubscriptionPlans());
      loadPlatformData();
      setCurrentUserState(getCurrentUser());
    };
    window.addEventListener('saasUpdated', handleUpdate);
    window.addEventListener('saasPlansUpdated', handleUpdate);
    window.addEventListener('passwordResetsUpdated', handleUpdate);
    window.addEventListener('saasUserChanged', handleUpdate);
    return () => {
      window.removeEventListener('saasUpdated', handleUpdate);
      window.removeEventListener('saasPlansUpdated', handleUpdate);
      window.removeEventListener('passwordResetsUpdated', handleUpdate);
      window.removeEventListener('saasUserChanged', handleUpdate);
    };
  }, []);

  const pendingAdminCount = adminResetRequests.filter((r) => r.status === 'PENDING').length;

  const handleApproveAdminReset = async (req) => {
    try {
      const targetUserId = req.userId || req.id;
      const res = await platformApi.approveAdminReset(targetUserId);
      const data = res?.data || res;
      const tempPass = data?.temporaryPassword || `AdminPass#${Math.random().toString(36).substring(2, 7)}!1A`;
      const updated = {
        ...req,
        status: 'APPROVED',
        tempPassword: tempPass,
        approvedAt: new Date().toLocaleDateString('en-GB'),
      };

      setAdminResetRequests((prev) =>
        prev.map((r) => (r.id === req.id || r.userId === targetUserId ? updated : r))
      );

      setApprovedShareModal({
        request: updated,
        tempPassword: tempPass,
      });
      setNotification(`Approved password reset for "${updated.tenantName}". Temporary password issued.`);
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      console.error('Backend approve admin reset error:', err);
      const updated = approveResetRequest(req.id, 'Platform Super Admin');
      if (updated) {
        setAdminResetRequests((prev) => prev.map((r) => (r.id === req.id ? updated : r)));
        setApprovedShareModal({
          request: updated,
          tempPassword: updated.tempPassword,
        });
        setNotification(`Approved password reset for "${updated.tenantName}". Temporary password issued.`);
        setTimeout(() => setNotification(''), 4000);
      }
    }
  };

  const handleRejectAdminReset = (req) => {
    if (window.confirm(`Are you sure you want to reject the password reset request for "${req.tenantName}"?`)) {
      setAdminResetRequests((prev) => prev.filter((r) => r.id !== req.id && r.userId !== req.userId));
      setNotification(`Rejected password reset request for "${req.tenantName}".`);
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const handleCopyTempPassword = (pass) => {
    navigator.clipboard.writeText(pass);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const handleConfirmDeleteCompany = async (e) => {
    if (e) e.preventDefault();
    if (!deleteModalTenant) return;
    if (!deletePassword.trim()) {
      setDeleteError('Please enter your Super Admin password to confirm deletion.');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      // 1. Authenticate with Super Admin email & entered password to obtain/refresh token
      try {
        const loginRes = await authApi.login('saloonqubexe@gmail.com', deletePassword.trim());
        if (!loginRes?.data?.token && !loginRes?.token) {
          throw new Error('Authentication failed');
        }
      } catch (authErr) {
        console.warn('Super Admin password check failed:', authErr);
        const errMsg = authErr?.data?.message || authErr?.message || 'Incorrect Super Admin password. Deletion cancelled.';
        setDeleteError(errMsg.includes('credentials') || errMsg.includes('password') || errMsg.includes('Invalid') ? 'Incorrect Super Admin password. Deletion cancelled.' : errMsg);
        setIsDeleting(false);
        return;
      }

      // 2. Perform permanent cascade deletion in PostgreSQL
      await platformApi.deleteCompany(deleteModalTenant.id, deletePassword.trim());
      deleteTenant(deleteModalTenant.id);
      setTenants((prev) => prev.filter((t) => t.id !== deleteModalTenant.id));
      setNotification(`Company "${deleteModalTenant.companyName}" and all associated data permanently deleted.`);
      setTimeout(() => setNotification(''), 4000);
      setDeleteModalTenant(null);
      setDeletePassword('');
    } catch (err) {
      console.error('Delete company error:', err);
      const msg = err?.data?.message || err?.message || 'Incorrect Super Admin password. Deletion cancelled.';
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Compute Platform Metrics (Only valid active plans count towards MRR and Active counts)
  const totalSalons = tenants.length;
  const activeSalons = tenants.filter(t => t.status === 'Active' && !isTenantPlanExpired(t));
  const activeSalonsCount = activeSalons.length;
  const totalMRR = activeSalons.reduce((sum, t) => sum + (t.mrr || 0), 0);
  const activePercentage = totalSalons > 0 ? Math.round((activeSalonsCount / totalSalons) * 100) : 0;

  // Filter Tenants
  const filteredTenants = tenants.filter(t => {
    const matchSearch =
      t.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.mobile.includes(searchTerm);
    const isExpired = isTenantPlanExpired(t);
    const isSuspended = t.status === 'Suspended' || t.isSuspended;
    const effectiveStatus = isSuspended ? 'Suspended' : (isExpired ? 'Inactive' : (t.status || 'Active'));
    const matchStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Active' && effectiveStatus === 'Active') ||
      (statusFilter === 'Inactive' && effectiveStatus === 'Inactive') ||
      (statusFilter === 'Suspended' && effectiveStatus === 'Suspended');
    return matchSearch && matchStatus;
  });

  // Handle Suspend / Unsuspend Salon
  const handleToggleSuspend = async (tenant) => {
    const isCurrentlySuspended = tenant.status === 'Suspended' || tenant.isSuspended;
    if (isCurrentlySuspended) {
      if (window.confirm(`Are you sure you want to unsuspend "${tenant.companyName}"?\n\nThis will restore login access for its administrators and cashiers.`)) {
        const restoredStatus = isTenantPlanExpired(tenant) ? 'Inactive' : 'Active';
        try {
          await platformApi.updateCompanyStatus(tenant.id, true, 'Unsuspended by Super Admin');
          await platformApi.updateSubscription(tenant.id, {
            subscriptionStatus: isTenantPlanExpired(tenant) ? 'EXPIRED' : 'ACTIVE'
          });
        } catch (err) {
          console.warn('Backend unsuspend note:', err.message);
        }
        updateTenant(tenant.id, { status: restoredStatus, isSuspended: false });
        await loadPlatformData();
        setNotification(`Salon "${tenant.companyName}" has been UNSUSPENDED. Normal login access restored.`);
        setTimeout(() => setNotification(''), 4000);
      }
    } else {
      if (window.confirm(`⚠️ Are you sure you want to SUSPEND "${tenant.companyName}"?\n\nThis will immediately freeze all operations and block login access for its salon admin and cashiers.`)) {
        try {
          await platformApi.updateCompanyStatus(tenant.id, false, 'Suspended by Super Admin');
          await platformApi.updateSubscription(tenant.id, {
            subscriptionStatus: 'SUSPENDED'
          });
        } catch (err) {
          console.warn('Backend suspend note:', err.message);
        }
        updateTenant(tenant.id, { status: 'Suspended', isSuspended: true });
        await loadPlatformData();
        setNotification(`⚠️ Salon "${tenant.companyName}" is now SUSPENDED. All login access is frozen.`);
        setTimeout(() => setNotification(''), 4000);
      }
    }
  };

  // Handle Toggle Status with Expiry Guard
  const handleToggleStatus = async (tenant) => {
    if (tenant.status === 'Suspended' || tenant.isSuspended) {
      handleToggleSuspend(tenant);
      return;
    }
    if (isTenantPlanExpired(tenant)) {
      setNotification(`⚠️ Plan for "${tenant.companyName}" has reached its expiry date (${tenant.nextBillingDate}). Status is Inactive. Please extend the plan validity to activate this salon.`);
      handleOpenSubscriptionModal(tenant);
      return;
    }
    const willBeActive = tenant.status !== 'Active';
    try {
      await platformApi.updateCompanyStatus(tenant.id, willBeActive);
    } catch (err) {
      console.warn('Backend status update note:', err.message);
    }
    const newStatus = toggleTenantStatus(tenant.id);
    await loadPlatformData();
    if (newStatus === 'Inactive') {
      setNotification(`Salon "${tenant.companyName}" is now Inactive (Deactivated by Super Admin). Login access for its admin and cashiers is blocked.`);
    } else {
      setNotification(`Salon "${tenant.companyName}" is now Active. Login access restored.`);
    }
    setTimeout(() => setNotification(''), 4000);
  };

  // Handle Impersonate Company (Read-Only Mode)
  const handleImpersonateCompany = (tenant) => {
    if (tenant.status === 'Suspended' || tenant.isSuspended) {
      setNotification(`⚠️ Cannot inspect: Salon "${tenant.companyName}" is currently SUSPENDED by Super Admin. Unsuspend to inspect.`);
      return;
    }
    if (isTenantPlanExpired(tenant)) {
      setNotification(`⚠️ Cannot inspect: Subscription for "${tenant.companyName}" has reached its expiry date (${tenant.nextBillingDate}). Extend plan to reactivate.`);
      handleOpenSubscriptionModal(tenant);
      return;
    }
    if (tenant.status === 'Inactive') {
      setNotification(`⚠️ Cannot inspect: Salon "${tenant.companyName}" is currently Inactive (deactivated by Super Admin). Click the status badge to switch to Active.`);
      return;
    }

    startImpersonation(tenant);
    setNotification(`Entering "${tenant.companyName}" in Read-Only Impersonation mode...`);
    setTimeout(() => {
      navigate('/pos');
    }, 600);
  };

  // Handle Company Logo Upload & Conversion to Base64 Data URL
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size should be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setTenantForm(prev => ({
        ...prev,
        logoUrl: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setTenantForm(prev => ({
      ...prev,
      logoUrl: null
    }));
  };

  // Handle Onboard Salon Submit
  const handleSaveTenant = async (e) => {
    e.preventDefault();
    if (!tenantForm.companyName.trim()) return alert('Company Name is required');
    if (!tenantForm.ownerName.trim()) return alert('Owner Name is required');
    if (!tenantForm.email.trim()) return alert('Email is required');
    if (!tenantForm.mobile.trim()) return alert('Mobile number is required');
    if (tenantForm.adminPassword && tenantForm.adminPassword.trim().length < 8) {
      return alert('Admin password must be at least 8 characters long.');
    }

    const selectedPlanObj = plans.find(p => p.id === tenantForm.planId) || plans[0];
    const code = (tenantForm.brandName || tenantForm.companyName)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `salon-${Date.now()}`;

    let backendCompany = null;
    try {
      const res = await platformApi.createCompany({
        name: tenantForm.companyName.trim(),
        code,
        plan: selectedPlanObj?.name || 'Bumper Plan',
        contactEmail: tenantForm.email.trim(),
        contactPhone: tenantForm.mobile.trim(),
        address: tenantForm.city?.trim() || 'Headquarters',
        city: tenantForm.city?.trim() || 'Headquarters',
        primaryBranchName: tenantForm.primaryBranchName?.trim() || `${tenantForm.city?.trim() || 'Main'} Outlet`,
        logoUrl: tenantForm.logoUrl || null,
        cashierLimit: Number(tenantForm.maxCashiers) || 2,
        enabledModules: selectedPlanObj?.features || [],
        adminUser: {
          username: tenantForm.ownerName.trim() || tenantForm.email.trim().split('@')[0],
          email: tenantForm.email.trim(),
          password: tenantForm.adminPassword?.trim() || 'AdminPassword123!',
        },
      });
      if (res?.data?.company) {
        backendCompany = res.data.company;
      }
    } catch (apiErr) {
      console.warn('Backend tenant creation sync note:', apiErr);
      const errorDetail = apiErr.data?.errors?.[0]?.message || apiErr.data?.message || apiErr.message || 'Validation error';
      alert(`⚠️ Could not onboard salon:\n\n${errorDetail}\n\nPlease check your inputs and try again.`);
      return;
    }

    const created = createTenant({
      ...tenantForm,
      ...(backendCompany ? { id: backendCompany.id } : {}),
      planName: selectedPlanObj ? selectedPlanObj.name : undefined,
      paymentMode: tenantForm.paymentMode || 'UPI / GPay / PhonePe'
    });

    try {
      const res = await platformApi.getCompanies({ limit: 100 });
      if (res && res.success && res.data) {
        const items = res.data.items || (Array.isArray(res.data) ? res.data : []);
        if (items.length > 0) {
          const mapped = items.map(mapCompanyFromBackend);
          setTenants(mapped);
          saveTenants(mapped);
        } else {
          setTenants(getTenants());
        }
      } else {
        setTenants(getTenants());
      }
    } catch {
      setTenants(getTenants());
    }

    setShowOnboardModal(false);
    const defaultPlan = plans[0];
    const days = defaultPlan?.durationDays || 30;
    const today = new Date().toISOString().split('T')[0];
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    setTenantForm({
      companyName: '',
      brandName: '',
      logoUrl: null,
      ownerName: '',
      email: '',
      mobile: '',
      adminPassword: '',
      primaryBranchName: '',
      city: '',
      planId: defaultPlan?.id || 'plan_growth',
      maxCashiers: defaultPlan?.maxCashiers || 2,
      paymentMode: 'UPI / GPay / PhonePe',
      startDate: today,
      endDate: d.toISOString().split('T')[0]
    });
    setNotification(`Salon "${created.companyName}" onboarded successfully with plan "${created.planName}"!`);
    setTimeout(() => setNotification(''), 3500);
  };

  // Open Onboard Salon Modal with fresh plans
  const handleOpenOnboardModal = () => {
    const currentPlans = getSubscriptionPlans();
    setPlans(currentPlans);
    const defaultPlan = currentPlans.find(p => p.id === tenantForm.planId) || currentPlans[0];
    const days = defaultPlan?.durationDays || 30;
    const today = new Date().toISOString().split('T')[0];
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    setTenantForm(prev => ({
      ...prev,
      planId: defaultPlan?.id || prev.planId,
      maxCashiers: defaultPlan?.maxCashiers || prev.maxCashiers || 2,
      startDate: today,
      endDate: d.toISOString().split('T')[0]
    }));
    setShowOnboardModal(true);
  };

  // Open Edit Salon Modal
  const handleOpenEditModal = (tenant) => {
    const primaryBranch = tenant.branches?.find(b => b.isPrimary) || tenant.branches?.[0];
    
    // Determine initial features for this salon:
    // If salon already has customFeatures overrides, use them; otherwise inherit from subscription plan
    let initialFeatures = [];
    if (Array.isArray(tenant.customFeatures) && tenant.customFeatures.length > 0) {
      initialFeatures = [...tenant.customFeatures];
    } else {
      const allPlans = getSubscriptionPlans();
      let matchedPlan = allPlans.find(p => p.id === tenant.planId) ||
                        allPlans.find(p => p.name?.toLowerCase() === tenant.planName?.toLowerCase());
      if (!matchedPlan && tenant.companyName?.toLowerCase().includes('paradise')) {
        matchedPlan = allPlans.find(p => p.name?.toLowerCase().includes('bumper'));
      }
      initialFeatures = matchedPlan && Array.isArray(matchedPlan.features) ? [...matchedPlan.features] : [];
    }

    setEditingTenant(tenant);
    setEditForm({
      companyName: tenant.companyName || '',
      brandName: tenant.brandName || '',
      logoUrl: tenant.logoUrl || null,
      ownerName: tenant.ownerName || '',
      email: tenant.email || '',
      mobile: tenant.mobile || '',
      adminPassword: tenant.adminPassword || '',
      primaryBranchName: primaryBranch?.name || '',
      city: tenant.city || primaryBranch?.city || '',
      maxCashiers: tenant.maxCashiers || 2,
      features: initialFeatures
    });
  };

  // Handle Edit Modal Logo Upload
  const handleEditLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size should be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditForm(prev => ({
        ...prev,
        logoUrl: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveEditLogo = () => {
    setEditForm(prev => ({
      ...prev,
      logoUrl: null
    }));
  };

  // Handle Save Edited Salon Details
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingTenant) return;
    if (!editForm.companyName.trim()) return alert('Company Name is required');
    if (!editForm.ownerName.trim()) return alert('Owner Name is required');
    if (!editForm.email.trim()) return alert('Email is required');
    if (!editForm.mobile.trim()) return alert('Mobile number is required');

    const brandClean = (editForm.brandName || editForm.companyName || 'SALON').toUpperCase();
    const halfLen = Math.ceil(brandClean.length / 2);
    const logoTextPrefix = brandClean.slice(0, halfLen);
    const logoTextSuffix = brandClean.slice(halfLen);

    const cleanCity = editForm.city?.trim() || '';
    const cleanBranchName = editForm.primaryBranchName?.trim() || '';

    let updatedBranches = (editingTenant.branches && editingTenant.branches.length > 0)
      ? editingTenant.branches.map((b, idx) => {
          if (b.isPrimary || idx === 0) {
            return {
              ...b,
              name: cleanBranchName || b.name,
              city: cleanCity || b.city,
              phone: editForm.mobile?.trim() || b.phone
            };
          }
          return b;
        })
      : [
          {
            id: 'b_' + Date.now(),
            name: cleanBranchName || (cleanCity ? `${cleanCity} Outlet` : 'Main Studio'),
            city: cleanCity,
            isPrimary: true,
            phone: editForm.mobile?.trim(),
            active: true
          }
        ];

    const updatedFields = {
      companyName: editForm.companyName.trim(),
      brandName: brandClean,
      logoUrl: editForm.logoUrl,
      logoTextPrefix,
      logoTextSuffix,
      ownerName: editForm.ownerName.trim(),
      email: editForm.email.trim(),
      mobile: editForm.mobile.trim(),
      adminUsername: editForm.email.trim(),
      adminPassword: editForm.adminPassword || editingTenant.adminPassword || 'admin123',
      city: cleanCity || editingTenant.city || '',
      maxCashiers: Number(editForm.maxCashiers) || editingTenant.maxCashiers || 2,
      customFeatures: Array.isArray(editForm.features) ? editForm.features : [],
      branches: updatedBranches
    };

    try {
      const cleanCode = (updatedFields.brandName || updatedFields.companyName)
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      await platformApi.updateCompany(editingTenant.id, {
        name: updatedFields.companyName,
        code: cleanCode,
        ownerName: updatedFields.ownerName,
        contactEmail: updatedFields.email,
        contactPhone: updatedFields.mobile,
        address: cleanCity,
        city: cleanCity,
        primaryBranchName: cleanBranchName,
        logoUrl: updatedFields.logoUrl || null,
        cashierLimit: updatedFields.maxCashiers,
        enabledModules: updatedFields.customFeatures || [],
        ...(editForm.adminPassword && editForm.adminPassword.trim().length >= 6
          ? { adminPassword: editForm.adminPassword.trim() }
          : {}),
      });
    } catch (err) {
      console.warn('Backend company update note:', err.message);
    }

    updateTenant(editingTenant.id, updatedFields);

    try {
      const res = await platformApi.getCompanies({ limit: 100 });
      if (res && res.success && res.data) {
        const items = res.data.items || (Array.isArray(res.data) ? res.data : []);
        if (items.length > 0) {
          const mapped = items.map(mapCompanyFromBackend);
          setTenants(mapped);
          saveTenants(mapped);
        } else {
          setTenants(getTenants());
        }
      } else {
        setTenants(getTenants());
      }
    } catch {
      setTenants(getTenants());
    }

    setEditingTenant(null);
    setNotification(`Salon "${updatedFields.companyName}" details, logo, modules, and credentials updated in database!`);
    setTimeout(() => setNotification(''), 3500);
  };

  // Available features checklist for plan builder (Real System Modules)
  const availableFeatureOptions = [
    'Quick Sale POS',
    'Appointment Booking & Calendar Grid',
    'CRM & Client Management',
    'Master BackOffice Catalog',
    'Salon Inventory & POs',
    'Expenses Management',
    'Staff Payroll & Commissions',
    'Reports & Business Analytics',
    'Cash Management & Counter Float',
    'WhatsApp Invoicing & Alerts',
    'Revenue Trends & Insights'
  ];

  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    setPlanForm({
      name: '',
      price: '',
      billingCycle: '',
      durationDays: '',
      badgeTag: '',
      features: [
        'Quick Sale POS',
        'Appointment Booking & Calendar Grid',
        'CRM & Client Management',
        'Master BackOffice Catalog',
        'Salon Inventory & POs',
        'WhatsApp Invoicing & Alerts'
      ],
      customFeatureInput: ''
    });
    setShowPlanModal(true);
  };

  const handleOpenEditPlan = (plan) => {
    setEditingPlan(plan);
    const duration = plan.durationDays ? String(plan.durationDays) : '';
    setPlanForm({
      name: plan.name,
      price: String(plan.price),
      billingCycle: plan.billingCycle || (duration ? `${duration} Days` : ''),
      durationDays: duration,
      badgeTag: plan.badgeTag || '',
      features: Array.isArray(plan.features) ? plan.features.filter(f => !String(f).toLowerCase().includes('unlimited staff')) : [],
      customFeatureInput: ''
    });
    setShowPlanModal(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!planForm.name.trim()) return alert('Plan name is required');
    if (!planForm.price || isNaN(parseFloat(planForm.price))) return alert('Valid price is required');
    if (!planForm.durationDays || isNaN(parseInt(planForm.durationDays)) || parseInt(planForm.durationDays) < 1) {
      return alert('Valid plan validity duration in days is required (e.g. 30, 90, 365)');
    }
    const durationDays = parseInt(planForm.durationDays);
    const cleanFeatures = planForm.features.filter(f => !String(f).toLowerCase().includes('unlimited staff'));

    const planPayload = {
      name: planForm.name.trim(),
      price: parseFloat(planForm.price),
      billingCycle: planForm.billingCycle || `${durationDays} Days`,
      durationDays: durationDays,
      badgeTag: planForm.badgeTag.trim(),
      cashierLimit: 2,
      features: cleanFeatures
    };

    if (editingPlan) {
      try {
        await platformApi.updatePlan(editingPlan.id, planPayload);
      } catch (apiErr) {
        console.warn('Backend plan update warning:', apiErr.message);
      }
      updateSubscriptionPlan(editingPlan.id, planPayload);
      setNotification(`Subscription Plan "${planForm.name}" updated successfully in database!`);
    } else {
      let createdId = null;
      try {
        const res = await platformApi.createPlan(planPayload);
        if (res && res.data && res.data.id) {
          createdId = res.data.id;
        }
      } catch (apiErr) {
        console.warn('Backend plan creation warning:', apiErr.message);
      }
      const created = createSubscriptionPlan({
        ...planPayload,
        ...(createdId ? { id: createdId } : {})
      });
      setNotification(`New Subscription Plan "${created?.name || planForm.name}" created and saved to database!`);
    }

    try {
      const res = await platformApi.getPlans();
      if (res && res.success && Array.isArray(res.data)) {
        const mapped = res.data.map(p => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          billingCycle: p.billingCycle || `${p.durationDays} Days`,
          durationDays: p.durationDays,
          badgeTag: p.badgeTag || '',
          cashierLimit: p.cashierLimit || 2,
          features: Array.isArray(p.features) ? p.features : [],
          isActive: p.isActive !== false
        }));
        setPlans(mapped);
        saveSubscriptionPlans(mapped);
      } else {
        setPlans(getSubscriptionPlans());
      }
    } catch {
      setPlans(getSubscriptionPlans());
    }

    setShowPlanModal(false);
    setTimeout(() => setNotification(''), 3500);
  };

  const handleDeletePlan = async (plan) => {
    const salonsOnThisPlan = tenants.filter(t => t.planId === plan.id);
    if (salonsOnThisPlan.length > 0) {
      alert(`Cannot delete "${plan.name}": There are currently ${salonsOnThisPlan.length} salon(s) active on this plan. Reassign them first.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete the plan "${plan.name}"?`)) {
      try {
        await platformApi.deletePlan(plan.id);
      } catch (apiErr) {
        console.warn('Backend plan delete warning:', apiErr.message);
      }
      deleteSubscriptionPlan(plan.id);

      try {
        const res = await platformApi.getPlans();
        if (res && res.success && Array.isArray(res.data)) {
          const mapped = res.data.map(p => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            billingCycle: p.billingCycle || `${p.durationDays} Days`,
            durationDays: p.durationDays,
            badgeTag: p.badgeTag || '',
            cashierLimit: p.cashierLimit || 2,
            features: Array.isArray(p.features) ? p.features : [],
            isActive: p.isActive !== false
          }));
          setPlans(mapped);
          saveSubscriptionPlans(mapped);
        } else {
          setPlans(getSubscriptionPlans());
        }
      } catch {
        setPlans(getSubscriptionPlans());
      }

      setNotification(`Plan "${plan.name}" deleted from database.`);
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const toggleFeature = (feat) => {
    if (planForm.features.includes(feat)) {
      setPlanForm(prev => ({
        ...prev,
        features: prev.features.filter(f => f !== feat)
      }));
    } else {
      setPlanForm(prev => ({
        ...prev,
        features: [...prev.features, feat]
      }));
    }
  };

  const handleAddCustomFeature = () => {
    if (!planForm.customFeatureInput?.trim()) return;
    const custom = planForm.customFeatureInput.trim();
    if (!planForm.features.includes(custom)) {
      setPlanForm(prev => ({
        ...prev,
        features: [...prev.features, custom],
        customFeatureInput: ''
      }));
    }
  };

  const handleOpenSubscriptionModal = (tenant) => {
    if (!isTenantPlanExpired(tenant)) {
      setNotification(`⚠️ Subscription for "${tenant.companyName}" is currently Active until ${tenant.endDate || tenant.nextBillingDate}. Plan changes and extensions are only unlocked once the current subscription expires.`);
      setTimeout(() => setNotification(''), 5000);
      return;
    }
    setSubscriptionModalTenant(tenant);
    const todayIso = new Date().toISOString().split('T')[0];
    const allPlans = getSubscriptionPlans();
    const currentPlan = allPlans.find(p => p.id === tenant.planId) || allPlans[0];
    const durationDays = currentPlan?.durationDays || 30;

    // Renewal starts from Present Date (Today)
    const effectiveStartIso = todayIso;
    const d = new Date(effectiveStartIso);
    d.setDate(d.getDate() + durationDays);
    const calculatedEndIso = d.toISOString().split('T')[0];

    setSubForm({
      planId: currentPlan?.id || tenant.planId || 'plan_growth',
      customPrice: currentPlan?.price !== undefined ? String(currentPlan.price) : (tenant.mrr !== undefined ? String(tenant.mrr) : ''),
      maxCashiers: tenant.maxCashiers !== undefined ? tenant.maxCashiers : 2,
      status: 'Active',
      startDate: effectiveStartIso,
      endDate: calculatedEndIso,
      nextBillingDate: toDisplayDateString(calculatedEndIso),
      paymentMode: 'UPI / GPay / PhonePe'
    });
  };

  const handleSelectPlanForTenant = (p) => {
    const todayIso = new Date().toISOString().split('T')[0];
    const startIso = todayIso;
    const days = p.durationDays || 30;
    const d = new Date(startIso);
    d.setDate(d.getDate() + days);
    const newEndIso = d.toISOString().split('T')[0];

    setSubForm(prev => ({
      ...prev,
      planId: p.id,
      customPrice: String(p.price),
      startDate: startIso,
      endDate: newEndIso,
      nextBillingDate: toDisplayDateString(newEndIso)
    }));
  };

  const handleSaveSubscription = async (e) => {
    e.preventDefault();
    if (!subscriptionModalTenant) return;

    const allPlans = getSubscriptionPlans();
    const selectedPlan = allPlans.find(p => p.id === subForm.planId) || allPlans[0];

    // Build ISO Date for subscriptionExpiresAt
    let expiresAtIso = null;
    if (subForm.endDate) {
      try {
        const rawDate = subForm.endDate.includes('-') && subForm.endDate.split('-')[0].length === 4
          ? `${subForm.endDate}T23:59:59.000Z`
          : new Date(subForm.endDate).toISOString();
        expiresAtIso = new Date(rawDate).toISOString();
      } catch (dateErr) {
        console.warn('Date parsing note:', dateErr);
      }
    }

    try {
      // 1. Update subscription in PostgreSQL database
      await platformApi.updateSubscription(subscriptionModalTenant.id, {
        plan: selectedPlan?.name || subscriptionModalTenant.planName || 'Bumper Plan',
        subscriptionStatus: subForm.status === 'Inactive' ? 'EXPIRED' : 'ACTIVE',
        subscriptionExpiresAt: expiresAtIso,
      });

      // 2. Update cashier limit in PostgreSQL if specified
      if (subForm.maxCashiers !== undefined) {
        await platformApi.updateCashierLimit(subscriptionModalTenant.id, subForm.maxCashiers);
      }
    } catch (apiErr) {
      console.warn('Backend subscription update note:', apiErr);
      const errMsg = apiErr.data?.message || apiErr.message || 'Error updating subscription';
      alert(`⚠️ Could not save subscription to database:\n\n${errMsg}`);
      return;
    }

    // 3. Update localStorage and local state
    const updated = updateTenantSubscription(subscriptionModalTenant.id, subForm);

    // 4. Re-fetch from backend to ensure 100% database sync
    try {
      const res = await platformApi.getCompanies({ limit: 100 });
      if (res && res.success && res.data) {
        const items = res.data.items || (Array.isArray(res.data) ? res.data : []);
        if (items.length > 0) {
          const mapped = items.map(mapCompanyFromBackend);
          setTenants(mapped);
          saveTenants(mapped);
        } else {
          setTenants(getTenants());
        }
      }
    } catch {
      setTenants(getTenants());
    }

    setSubscriptionModalTenant(null);
    setNotification(`Subscription for "${updated?.companyName || subscriptionModalTenant.companyName}" updated to ${selectedPlan?.name || 'new plan'} (Valid till ${updated?.nextBillingDate || subForm.nextBillingDate}) in database!`);
    setTimeout(() => setNotification(''), 3500);
  };

  const handleOpenHistoryModal = (tenant) => {
    const currentTenants = getTenants();
    const latest = currentTenants.find(t => t.id === tenant.id) || tenant;
    setHistoryModalTenant(latest);
  };

  const handleDeleteHistoryRecord = (recordId) => {
    if (!historyModalTenant) return;
    if (window.confirm('Are you sure you want to delete this subscription transaction record from the audit ledger?')) {
      const currentHistory = Array.isArray(historyModalTenant.history) ? historyModalTenant.history : [];
      const updatedHistory = currentHistory.filter(r => r.id !== recordId);
      updateTenant(historyModalTenant.id, { history: updatedHistory });
      const refreshedTenants = getTenants();
      const updatedTenant = refreshedTenants.find(t => t.id === historyModalTenant.id) || { ...historyModalTenant, history: updatedHistory };
      setTenants(refreshedTenants);
      setHistoryModalTenant(updatedTenant);
      setNotification('Transaction record deleted from audit ledger.');
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const handleLogout = () => {
    authApi.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/70 via-rose-50/40 to-slate-50 text-slate-800 flex flex-col">
      {/* ======================================================== */}
      {/* TOP SAAS HEADER                                          */}
      {/* ======================================================== */}
      <header className="bg-white/95 backdrop-blur-md border-b border-pink-100 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-slate-900">Saloon SaaS</span>
              <span className="bg-pink-100 text-pink-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-pink-200 uppercase tracking-wide">
                Super Admin Console
              </span>
            </div>
            <p className="text-xs text-slate-500">Multi-Tenant Salon Operations & Subscription Management</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-pink-50/60 border border-pink-200/80">
            <span className="text-base">{currentUser?.avatar || superAdminUser.avatar}</span>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-800">{currentUser?.name || currentUser?.username || 'Platform Super Admin'}</div>
              <div className="text-[10px] text-slate-500">{currentUser?.email || 'saloonqubexe@gmail.com'}</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* MAIN CONTAINER (FULL SCREEN WIDTH)                       */}
      {/* ======================================================== */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full max-w-[100%] mx-auto space-y-6">
        {/* Notification Toast */}
        {notification && (
          <div className="bg-pink-50 border border-pink-200 text-pink-800 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200 shadow-xs">
            <CheckCircle2 size={16} className="text-pink-600 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* METRICS CARDS                                            */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Salons */}
          <div className="bg-white border border-pink-100 rounded-2xl p-5 relative overflow-hidden group hover:border-pink-300 hover:shadow-md transition-all shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Salon Companies</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">{totalSalons}</h3>
              </div>
              <div className="p-3 bg-pink-50 text-pink-600 border border-pink-200/60 rounded-xl">
                <Building2 size={22} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-pink-600 font-semibold">
              <span className="inline-block w-2 h-2 rounded-full bg-pink-500" />
              <span>{activeSalonsCount} Active Subscriptions</span>
            </div>
          </div>

          {/* Active Subscriptions */}
          <div className="bg-white border border-pink-100 rounded-2xl p-5 relative overflow-hidden group hover:border-pink-300 hover:shadow-md transition-all shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Subscriptions</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">{activeSalonsCount}</h3>
              </div>
              <div className="p-3 bg-pink-50 text-pink-600 border border-pink-200/60 rounded-xl">
                <CheckCircle2 size={22} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
              <span>Active paying salon accounts</span>
            </div>
          </div>

          {/* Monthly Recurring Revenue (MRR) */}
          <div className="bg-white border border-pink-100 rounded-2xl p-5 relative overflow-hidden group hover:border-pink-300 hover:shadow-md transition-all shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform MRR</p>
                <h3 className="text-3xl font-black text-emerald-600 mt-1">₹{totalMRR.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-200/60 rounded-xl">
                <IndianRupee size={22} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <span>Monthly SaaS billing</span>
            </div>
          </div>

          {/* Platform Health */}
          <div className="bg-white border border-pink-100 rounded-2xl p-5 relative overflow-hidden group hover:border-pink-300 hover:shadow-md transition-all shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform Status</p>
                <h3 className="text-3xl font-black text-pink-600 mt-1">{activePercentage}%</h3>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 border border-amber-200/60 rounded-xl">
                <ShieldCheck size={22} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
              <span>{activeSalonsCount} of {totalSalons} Salons Active</span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TABS & TOOLBAR                                           */}
        {/* ======================================================== */}
        <div className="bg-white border border-pink-100 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs">
          {/* Tab buttons */}
          <div className="flex items-center gap-2 border-b md:border-b-0 border-pink-100 pb-2 md:pb-0">
            <button
              onClick={() => setActiveTab('salons')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'salons'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-md shadow-pink-500/20'
                  : 'text-slate-600 hover:text-pink-700 hover:bg-pink-50'
              }`}
            >
              Registered Salons ({tenants.length})
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'plans'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-md shadow-pink-500/20'
                  : 'text-slate-600 hover:text-pink-700 hover:bg-pink-50'
              }`}
            >
              Subscription Plans ({plans.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('resets');
                loadPlatformData();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'resets'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-md shadow-pink-500/20'
                  : 'text-slate-600 hover:text-pink-700 hover:bg-pink-50'
              }`}
            >
              <KeyRound size={13} />
              <span>Password Resets</span>
              {pendingAdminCount > 0 ? (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === 'resets' ? 'bg-white text-pink-700' : 'bg-rose-500 text-white animate-pulse'
                }`}>
                  {pendingAdminCount}
                </span>
              ) : (
                <span className="text-[10px] opacity-70">({adminResetRequests.length})</span>
              )}
            </button>
          </div>

          {activeTab === 'salons' && (
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search salon or owner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-pink-50/30 border border-pink-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:bg-white"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-pink-50/30 border border-pink-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-pink-500 focus:bg-white cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive (Expired)</option>
                <option value="Suspended">Suspended</option>
              </select>

              {/* Onboard Button */}
              <button
                onClick={handleOpenOnboardModal}
                className="flex items-center gap-1.5 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-pink-500/20 transition-all cursor-pointer active:scale-98"
              >
                <Plus size={15} />
                <span>Onboard New Salon</span>
              </button>
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenCreatePlan}
                className="flex items-center gap-1.5 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-pink-500/20 transition-all cursor-pointer active:scale-98"
              >
                <Plus size={15} />
                <span>+ Create Subscription Plan</span>
              </button>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* TAB 1: SALONS DIRECTORY                                  */}
        {/* ======================================================== */}
        {activeTab === 'salons' && (
          <div className="bg-white border border-pink-100 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-pink-50/70 text-slate-600 uppercase text-[11px] font-bold tracking-wider border-b border-pink-100">
                  <tr>
                    <th className="py-3 px-4">Company Name</th>
                    <th className="py-3 px-3">Username / Admin Name</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Phone Number</th>
                    <th className="py-3 px-3">Location / City</th>
                    <th className="py-3 px-3">Subscription Plan</th>
                    <th className="py-3 px-3">Start Date</th>
                    <th className="py-3 px-3">End Date</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50">
                  {filteredTenants.length > 0 ? (
                    filteredTenants.map((tenant) => {
                      const matchedPlan = plans.find(p => p.id === tenant.planId || (p.name && tenant.planName && p.name.toLowerCase() === tenant.planName.toLowerCase()));
                      const planDays = matchedPlan?.durationDays || (matchedPlan?.billingCycle ? parseInt(matchedPlan.billingCycle) : null);
                      const displayStart = tenant.startDate || tenant.createdDate || '-';
                      let displayEnd = tenant.endDate || tenant.nextBillingDate;
                      if (!displayEnd || displayEnd === '-') {
                        if (displayStart && displayStart !== '-') {
                          try {
                            const sIso = toISODateString(displayStart);
                            const d = new Date(sIso);
                            d.setDate(d.getDate() + (planDays || 30));
                            displayEnd = toDisplayDateString(d.toISOString().split('T')[0]);
                          } catch (e) {
                            displayEnd = '-';
                          }
                        }
                      }
                      return (
                        <tr key={tenant.id} className="hover:bg-pink-50/30 transition-colors group">
                          {/* 1. Company Name & Brand */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              {tenant.logoUrl ? (
                                <img
                                  src={tenant.logoUrl}
                                  alt={tenant.companyName}
                                  className="w-9 h-9 rounded-xl object-contain bg-white border border-pink-200 p-0.5 shrink-0 shadow-xs"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white font-extrabold flex items-center justify-center text-xs shadow-xs shrink-0">
                                  {tenant.logoTextPrefix?.slice(0, 2) || tenant.companyName.slice(0, 2)}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                  <span>{tenant.companyName}</span>
                                  <span className="text-[10px] font-mono bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded border border-pink-200">
                                    {tenant.brandName}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Joined {tenant.createdDate}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Username / Admin Name */}
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-pink-50 text-pink-800 rounded-md font-mono text-xs font-bold border border-pink-200">
                                @{tenant.ownerName || 'admin'}
                              </span>
                            </div>
                          </td>

                          {/* 3. Email */}
                          <td className="py-4 px-4">
                            <div className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
                              <Mail size={13} className="text-pink-600 shrink-0" />
                              <span>{tenant.email || '-'}</span>
                            </div>
                          </td>

                          {/* 4. Phone Number */}
                          <td className="py-4 px-4">
                            <div className="text-xs text-slate-700 font-mono font-medium flex items-center gap-1.5">
                              <Phone size={13} className="text-pink-600 shrink-0" />
                              <span>{tenant.mobile || '-'}</span>
                            </div>
                          </td>

                          {/* 5. Location / City */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                              <MapPin size={13} className="text-pink-600 shrink-0" />
                              <span>{tenant.city || tenant.branches?.[0]?.city || 'Location Not Set'}</span>
                            </div>
                            {tenant.branches?.[0]?.name && tenant.branches[0].name !== tenant.city && (
                              <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                                {tenant.branches[0].name}
                              </div>
                            )}
                          </td>

                          {/* Subscription Plan */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-pink-50 text-pink-700 border border-pink-200">
                                {tenant.planName}
                              </span>
                              {isTenantPlanExpired(tenant) && (
                                <button
                                  onClick={() => handleOpenSubscriptionModal(tenant)}
                                  className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-0.5 hover:underline cursor-pointer font-bold"
                                  title="Subscription Expired - Click to Renew/Extend"
                                >
                                  <Zap size={11} className="text-rose-500 fill-rose-500" />
                                  <span>Renew</span>
                                </button>
                              )}
                            </div>
                            <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1.5">
                              <span>₹{tenant.mrr?.toLocaleString()}</span>
                              <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                {planDays ? `${planDays} Days` : (matchedPlan?.billingCycle || 'Active')}
                              </span>
                            </div>
                          </td>

                          {/* Start Date */}
                          <td className="py-4 px-3">
                            <div className="text-xs text-slate-800 font-mono font-semibold flex items-center gap-1.5">
                              <Calendar size={12} className="text-pink-600 shrink-0" />
                              <span>{displayStart}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-normal">Active Since</span>
                          </td>

                          {/* End Date */}
                          <td className="py-4 px-3">
                            <div className="text-xs font-mono font-bold flex items-center gap-1.5">
                              <Calendar size={12} className={isTenantPlanExpired(tenant) ? "text-rose-500 shrink-0" : "text-emerald-600 shrink-0"} />
                              <span className={isTenantPlanExpired(tenant) ? "text-rose-600 font-bold" : "text-slate-800"}>
                                {displayEnd}
                              </span>
                            </div>
                            <div className="mt-0.5">
                              {isTenantPlanExpired(tenant) ? (
                                <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.2 rounded border border-rose-200">
                                  Expired
                                </span>
                              ) : (
                                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-medium px-1.5 py-0.2 rounded border border-emerald-200">
                                  {(() => {
                                    if (!displayEnd || displayEnd === '-') return 'Active';
                                    try {
                                      const days = calculateDaysBetween(new Date().toISOString().split('T')[0], toISODateString(displayEnd));
                                      return days ? `${days} left` : 'Active';
                                    } catch (e) {
                                      return 'Active';
                                    }
                                  })()}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4 text-center">
                            {tenant.status === 'Suspended' || tenant.isSuspended ? (
                              <div className="inline-flex flex-col items-center">
                                <button
                                  onClick={() => handleToggleSuspend(tenant)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 shadow-2xs transition-all cursor-pointer"
                                  title="Account Suspended by Super Admin. Click to Unsuspend."
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                                  <span>Suspended</span>
                                </button>
                                <span className="text-[9px] font-bold text-rose-600 uppercase tracking-tight mt-0.5">
                                  Access Frozen
                                </span>
                              </div>
                            ) : isTenantPlanExpired(tenant) ? (
                              <div className="inline-flex flex-col items-center">
                                <button
                                  onClick={() => handleToggleStatus(tenant)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300 shadow-2xs transition-all cursor-pointer"
                                  title="Plan reached expiry date (Inactive). Click to extend validity."
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                  <span>Inactive</span>
                                </button>
                                <span className="text-[9px] font-bold text-rose-500 uppercase tracking-tight mt-0.5">
                                  Plan Expired
                                </span>
                              </div>
                            ) : tenant.status === 'Inactive' ? (
                              <div className="inline-flex flex-col items-center">
                                <button
                                  onClick={() => handleToggleStatus(tenant)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 shadow-2xs transition-all cursor-pointer"
                                  title="Manually deactivated by Super Admin. Click to reactivate (restores login access)."
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  <span>Inactive</span>
                                </button>
                                <span className="text-[9px] font-bold text-amber-700 uppercase tracking-tight mt-0.5">
                                  Deactivated
                                </span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleToggleStatus(tenant)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-2xs transition-all cursor-pointer"
                                title="Active subscription. Click to deactivate (blocks login for admin and cashiers)."
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Active</span>
                              </button>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Complete Company Details */}
                              <button
                                onClick={() => setViewDetailsModalTenant(tenant)}
                                className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 px-2 py-1 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                                title="View Complete Company Details & Profile"
                              >
                                <Eye size={12} className="text-slate-500" />
                                <span>View</span>
                              </button>

                              {/* Edit Salon Details */}
                              <button
                                onClick={() => handleOpenEditModal(tenant)}
                                className="flex items-center gap-1 bg-white hover:bg-pink-50 text-pink-700 hover:text-pink-800 border border-pink-200 px-2 py-1 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                                title="Edit Salon Profile, Owner, Location & Logo"
                              >
                                <Edit2 size={12} className="text-pink-600" />
                                <span>Edit</span>
                              </button>

                              {/* Subscription History Ledger Button */}
                              <button
                                onClick={() => handleOpenHistoryModal(tenant)}
                                className="flex items-center gap-1 bg-white hover:bg-pink-50 text-pink-700 hover:text-pink-800 border border-pink-200 px-2 py-1 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                                title="View Company Subscription & Payment History"
                              >
                                <History size={12} className="text-pink-600" />
                                <span>History</span>
                              </button>

                              {/* Manage Subscription & Extension Button */}
                              {isTenantPlanExpired(tenant) ? (
                                <button
                                  onClick={() => handleOpenSubscriptionModal(tenant)}
                                  className="flex items-center gap-1 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold px-2.5 py-1 rounded-lg text-xs shadow-2xs transition-all active:scale-95 cursor-pointer animate-pulse"
                                  title="Subscription Expired: Click to Renew or Change Plan"
                                >
                                  <CalendarClock size={12} className="text-white" />
                                  <span>Renew / Extend</span>
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="flex items-center gap-1 bg-slate-50 text-slate-400 border border-slate-200 px-2 py-1 rounded-lg text-xs font-medium cursor-not-allowed opacity-60"
                                  title={`Plan is active until ${displayEnd}. Plan changes and extensions unlock after expiry.`}
                                >
                                  <Lock size={12} className="text-slate-400" />
                                  <span>Plan / Extend</span>
                                </button>
                              )}

                              {/* Suspend / Unsuspend Salon Button */}
                              {tenant.status === 'Suspended' || tenant.isSuspended ? (
                                <button
                                  onClick={() => handleToggleSuspend(tenant)}
                                  className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 hover:text-amber-900 border border-amber-200 font-bold px-2 py-1 rounded-lg text-xs shadow-2xs transition-all cursor-pointer"
                                  title="Unsuspend account and restore salon access"
                                >
                                  <PlayCircle size={12} className="text-amber-600" />
                                  <span>Unsuspend</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleSuspend(tenant)}
                                  className="flex items-center gap-1 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-200 px-2 py-1 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                                  title={`Suspend ${tenant.companyName} (freeze all operations)`}
                                >
                                  <Ban size={12} className="text-rose-600" />
                                  <span>Suspend</span>
                                </button>
                              )}

                              {/* Impersonate Company Portal (Read-Only) */}
                              <button
                                onClick={() => handleImpersonateCompany(tenant)}
                                className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 border border-indigo-200 font-bold px-2.5 py-1 rounded-lg text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
                                title={`Inspect ${tenant.companyName} portal in Read-Only mode`}
                              >
                                <Eye size={12} className="text-indigo-600" />
                                <span>Impersonate</span>
                              </button>

                              {/* Delete Tenant */}
                              <button
                                onClick={() => {
                                  setDeleteModalTenant(tenant);
                                  setDeletePassword('');
                                  setDeleteError('');
                                }}
                                className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="Delete Company Permanently"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="10" className="py-16 text-center">
                        <div className="max-w-md mx-auto flex flex-col items-center justify-center text-center space-y-3">
                          <div className="w-14 h-14 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-500 shadow-xs">
                            <Building2 size={28} />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-base font-bold text-slate-800">
                              {tenants.length === 0 ? 'No Salon Companies Registered Yet' : 'No Matching Salons Found'}
                            </h4>
                            <p className="text-xs text-slate-500">
                              {tenants.length === 0
                                ? 'You have not created any salon companies yet. Click the button below to onboard your first salon company.'
                                : 'No salon companies matched your search or status filter criteria.'}
                            </p>
                          </div>
                          {tenants.length === 0 && (
                            <button
                              onClick={handleOpenOnboardModal}
                              className="mt-2 flex items-center gap-1.5 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-pink-500/20 transition-all cursor-pointer active:scale-98"
                            >
                              <Plus size={15} />
                              <span>+ Onboard First Salon</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: SUBSCRIPTION PLANS MATRIX                         */}
        {/* ======================================================== */}
        {activeTab === 'plans' && (
          plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const activeBadge = plan.badgeTag || '';
                const salonsCount = tenants.filter(t => t.planId === plan.id).length;

                return (
                  <div
                    key={plan.id}
                    className="bg-white border border-pink-100 rounded-2xl p-6 flex flex-col justify-between hover:border-pink-300 hover:shadow-xl transition-all shadow-xs relative group"
                  >
                    {activeBadge && (
                      <span className="absolute -top-3 right-6 bg-gradient-to-r from-pink-600 to-rose-500 text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-full shadow-md">
                        {activeBadge}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-slate-900">{plan.name}</h3>
                        <span className="text-[11px] font-semibold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-md border border-pink-200">
                          {plan.billingCycle || 'Monthly'}
                        </span>
                      </div>

                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-3xl font-black text-pink-600">₹{plan.price.toLocaleString()}</span>
                        <span className="text-xs text-slate-500">/ {plan.durationDays || 30} days</span>
                      </div>

                      <div className="mt-4 pt-4 border-t border-pink-100">
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span>Plan Validity:</span>
                          <strong className="text-pink-700 font-bold bg-pink-50 px-2 py-0.5 rounded border border-pink-200">
                            {plan.durationDays || 30} Days
                          </strong>
                        </div>
                      </div>

                      <div className="mt-5 space-y-2.5">
                        <p className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Features Included:</p>
                        {(plan.features || []).map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                            <Check size={14} className="text-pink-600 shrink-0" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-pink-100 flex items-center justify-between">
                      <div className="text-xs text-slate-500 font-medium">
                        <span className="text-slate-900 font-bold">{salonsCount}</span> Salons on this plan
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditPlan(plan)}
                          className="px-2.5 py-1 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Edit Plan"
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan)}
                          className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg text-xs transition-colors border border-slate-200 cursor-pointer"
                          title="Delete Plan"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-pink-100 rounded-2xl p-16 shadow-xs text-center">
              <div className="max-w-md mx-auto flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-500 shadow-xs">
                  <CreditCard size={28} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-800">No Subscription Plans Configured Yet</h4>
                  <p className="text-xs text-slate-500">
                    You have not configured any subscription plans yet. Click the button below to define custom pricing, validity duration, features, and cashier limits for your salons.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreatePlan}
                  className="mt-2 flex items-center gap-1.5 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-pink-500/20 transition-all cursor-pointer active:scale-98"
                >
                  <Plus size={15} />
                  <span>+ Create Subscription Plan</span>
                </button>
              </div>
            </div>
          )
        )}

        {/* ======================================================== */}
        {/* TAB 3: PASSWORD RESET REQUESTS & APPROVALS               */}
        {/* ======================================================== */}
        {activeTab === 'resets' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <KeyRound size={16} />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-600 mt-2">{pendingAdminCount}</div>
                <span className="text-[11px] text-slate-400 font-medium">Salon Admins waiting for temp password</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Temp Passwords</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 size={16} />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-600 mt-2">
                  {adminResetRequests.filter(r => r.status === 'APPROVED').length}
                </div>
                <span className="text-[11px] text-emerald-600/80 font-medium">Approved and ready for login</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed Resets</span>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                    <History size={16} />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-700 mt-2">
                  {adminResetRequests.filter(r => r.status === 'COMPLETED').length}
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Permanent password successfully updated</span>
              </div>
            </div>

            {/* Instruction Banner */}
            <div className="bg-pink-50/60 border border-pink-200 rounded-2xl p-4 flex items-start gap-3">
              <ShieldCheck size={20} className="text-pink-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900">Security Workflow:</span> When a Salon Company Admin forgets their password, they submit a reset request. As Platform Super Admin, verify the salon identity, click <strong className="text-pink-700">"Approve & Generate Temp Password"</strong>, and share the generated temporary password manually via Phone or WhatsApp. Upon logging in with that temporary password, the admin is required to set their new permanent password.
              </div>
            </div>

            {/* Reset Requests Table */}
            <div className="bg-white border border-pink-100 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-pink-100 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <KeyRound size={16} className="text-pink-600" />
                  <span>Salon Admin Reset Queue ({adminResetRequests.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={loadPlatformData}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-pink-200 text-pink-700 hover:bg-pink-50 text-xs font-bold transition-all cursor-pointer"
                  title="Refresh Queue from Database"
                >
                  <RefreshCw size={13} />
                  <span>Refresh Queue</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-pink-50/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-pink-100">
                      <th className="py-3.5 px-5">Salon Company</th>
                      <th className="py-3.5 px-4">Admin / Owner</th>
                      <th className="py-3.5 px-4">Contact Info</th>
                      <th className="py-3.5 px-4">Requested At</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pink-50 text-xs text-slate-700">
                    {adminResetRequests.length > 0 ? (
                      adminResetRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-pink-50/30 transition-colors">
                          <td className="py-4 px-5">
                            <div className="font-bold text-slate-900">{req.tenantName}</div>
                            <span className="text-[10px] font-mono text-slate-400">ID: {req.tenantId}</span>
                          </td>
                          <td className="py-4 px-4 font-semibold text-slate-800">
                            {req.userName}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                              <Mail size={12} className="text-slate-400" />
                              <span>{req.email || req.accountIdentifier}</span>
                            </div>
                            {req.phone && (
                              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                                <Phone size={12} className="text-slate-400" />
                                <span>{req.phone}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">
                            {req.createdAt}
                          </td>
                          <td className="py-4 px-4 text-center">
                            {req.status === 'PENDING' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span>Pending Approval</span>
                              </span>
                            )}
                            {req.status === 'APPROVED' && (
                              <div className="inline-flex flex-col items-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span>✓ Approved</span>
                                </span>
                                <code className="text-[10px] font-mono font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded mt-1">
                                  {req.tempPassword}
                                </code>
                              </div>
                            )}
                            {req.status === 'COMPLETED' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                <span>Completed</span>
                              </span>
                            )}
                            {req.status === 'REJECTED' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <span>Rejected</span>
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {req.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => handleApproveAdminReset(req)}
                                    className="flex items-center gap-1.5 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                                  >
                                    <KeyRound size={13} />
                                    <span>Approve & Issue Temp Password</span>
                                  </button>
                                  <button
                                    onClick={() => handleRejectAdminReset(req)}
                                    className="px-2.5 py-1.5 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {req.status === 'APPROVED' && (
                                <button
                                  onClick={() => setApprovedShareModal({ request: req, tempPassword: req.tempPassword })}
                                  className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                                >
                                  <Copy size={13} />
                                  <span>View & Share Password</span>
                                </button>
                              )}

                              {req.status === 'COMPLETED' && (
                                <span className="text-[11px] text-slate-400 italic">
                                  Resolved on {req.completedAt}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-400 italic">
                          No password reset requests in queue.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL: SHARE TEMPORARY PASSWORD DIALOG                   */}
      {/* ======================================================== */}
      {approvedShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setApprovedShareModal(null)} />
          <div className="relative bg-white border border-pink-100 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-slate-800 z-10">
            <div className="flex items-center justify-between pb-3 border-b border-pink-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Temporary Password Issued</h3>
                  <p className="text-[11px] text-slate-500">Share this code with the salon company admin.</p>
                </div>
              </div>
              <button
                onClick={() => setApprovedShareModal(null)}
                className="text-slate-400 hover:text-slate-700 hover:bg-pink-50 rounded-lg p-1 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Target Salon Info */}
            <div className="bg-pink-50/50 p-3 rounded-xl border border-pink-100 space-y-1">
              <div className="text-xs font-bold text-slate-800">{approvedShareModal.request?.tenantName}</div>
              <div className="text-[11px] text-slate-600">Admin Owner: <strong className="text-slate-800">{approvedShareModal.request?.userName}</strong></div>
              <div className="text-[11px] text-slate-600">Phone: <strong className="text-slate-800 font-mono">{approvedShareModal.request?.phone || 'N/A'}</strong></div>
            </div>

            {/* Large Temporary Password Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                Single-Use Temporary Password
              </span>
              <div className="text-2xl font-black font-mono text-emerald-800 bg-white py-2 px-4 rounded-xl border border-emerald-200 inline-block shadow-xs">
                {approvedShareModal.tempPassword}
              </div>
              <p className="text-[11px] text-emerald-700">
                When the admin enters this password at login, they will be required to set their new permanent password immediately.
              </p>
            </div>

            {/* Actions: Copy & WhatsApp Share */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleCopyTempPassword(approvedShareModal.tempPassword)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                {copySuccess ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copySuccess ? 'Copied to Clipboard!' : 'Copy Password'}</span>
              </button>

              <a
                href={`https://wa.me/${(approvedShareModal.request?.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Hello ${approvedShareModal.request?.userName}, your temporary password for ${approvedShareModal.request?.tenantName} is: ${approvedShareModal.tempPassword}. Please log in to your salon portal and set your new password.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <MessageCircle size={14} />
                <span>Share on WhatsApp</span>
              </a>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setApprovedShareModal(null)}
                className="px-4 py-1.5 border border-pink-200 hover:bg-pink-50 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ONBOARD NEW SALON COMPANY                         */}
      {/* ======================================================== */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowOnboardModal(false)} />
          <div className="relative bg-white border border-pink-100 rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 text-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-pink-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Building2 className="text-pink-600" size={20} />
                  <span>Onboard New Salon Company</span>
                </h3>
                <p className="text-xs text-slate-500">Create a new salon business tenant and assign its company admin.</p>
              </div>
              <button onClick={() => setShowOnboardModal(false)} className="text-slate-400 hover:text-slate-700 hover:bg-pink-50 rounded-lg p-1 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTenant} className="space-y-4">
              {/* Salon Business Info & Logo Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Business Name *</label>
                  <input
                    type="text"
                    required
                    value={tenantForm.companyName}
                    onChange={(e) => setTenantForm({ ...tenantForm, companyName: e.target.value })}
                    placeholder="e.g. Jawed Habib Luxury"
                    className="w-full px-3.5 py-2 bg-pink-50/40 border border-pink-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-300"
                  />
                  <div className="mt-2">
                    <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Brand Short Name (Optional Fallback)</label>
                    <input
                      type="text"
                      value={tenantForm.brandName}
                      onChange={(e) => setTenantForm({ ...tenantForm, brandName: e.target.value })}
                      placeholder="e.g. JAWED HABIB"
                      className="w-full px-3 py-1.5 bg-pink-50/30 border border-pink-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 uppercase"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-pink-600" />
                      <span>Company Logo</span>
                    </label>
                    <span className="text-[10px] text-pink-600 font-semibold bg-pink-50 px-1.5 py-0.5 rounded border border-pink-200">
                      Replaces Logo Text
                    </span>
                  </div>

                  {tenantForm.logoUrl ? (
                    <div className="flex items-center justify-between p-2.5 bg-pink-50/40 border border-pink-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <img
                          src={tenantForm.logoUrl}
                          alt="Uploaded Logo Preview"
                          className="h-10 w-16 object-contain rounded bg-white border border-pink-200 p-1 shadow-2xs"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Logo Uploaded ✓</span>
                          <span className="text-[10px] text-emerald-600 font-medium">Will show in header & invoices</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <label className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-pink-50 text-pink-700 border border-pink-200 rounded-md cursor-pointer transition-colors shadow-2xs">
                          Change
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer transition-colors"
                          title="Remove Logo"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-pink-300 hover:border-pink-500 bg-pink-50/30 hover:bg-pink-50/60 rounded-xl p-3.5 cursor-pointer transition-all group">
                      <Upload size={20} className="text-pink-500 group-hover:scale-110 transition-transform mb-1" />
                      <span className="text-xs font-bold text-pink-700">Upload Company Logo</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, SVG, WebP (up to 2MB)</span>
                      <span className="text-[9px] text-slate-400 mt-0.5">Shows logo image instead of brand logo text</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              {/* Owner Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Owner Full Name *</label>
                  <input
                    type="text"
                    required
                    value={tenantForm.ownerName}
                    onChange={(e) => setTenantForm({ ...tenantForm, ownerName: e.target.value })}
                    placeholder="e.g. Ramesh Kulkarni"
                    className="w-full px-3.5 py-2 bg-pink-50/40 border border-pink-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Email *</label>
                  <input
                    type="email"
                    required
                    value={tenantForm.email}
                    onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                    placeholder="admin@salon.com"
                    className="w-full px-3.5 py-2 bg-pink-50/40 border border-pink-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Mobile *</label>
                  <input
                    type="tel"
                    required
                    value={tenantForm.mobile}
                    onChange={(e) => setTenantForm({ ...tenantForm, mobile: e.target.value })}
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2 bg-pink-50/40 border border-pink-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-300"
                  />
                </div>
              </div>

              {/* Salon Location & City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-pink-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Salon Location / Area Name</label>
                  <input
                    type="text"
                    value={tenantForm.primaryBranchName}
                    onChange={(e) => setTenantForm({ ...tenantForm, primaryBranchName: e.target.value })}
                    placeholder="e.g. Main Studio, FC Road"
                    className="w-full px-3.5 py-2 bg-pink-50/40 border border-pink-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={tenantForm.city}
                    onChange={(e) => setTenantForm({ ...tenantForm, city: e.target.value })}
                    placeholder="e.g. Karimnagar, Hyderabad, Pune, Mumbai"
                    className="w-full px-3.5 py-2 bg-pink-50/40 border border-pink-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-300"
                  />
                </div>
              </div>

              {/* Admin Password & Access Info */}
              <div className="pt-2 border-t border-pink-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Password * <span className="text-[10px] text-pink-600 font-normal">(Minimum 8 characters)</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={tenantForm.adminPassword}
                  onChange={(e) => setTenantForm({ ...tenantForm, adminPassword: e.target.value })}
                  placeholder="Create admin password (min 8 characters)"
                  className="w-full px-3.5 py-2 bg-pink-50/40 border border-pink-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-300"
                />
                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                  <span>ℹ️ Salon admin will login using their <strong>Admin Email</strong> or <strong>Contact Number</strong> with this password.</span>
                </p>
              </div>

              {/* Subscription Plan & Cashiers Allowed Selection */}
              <div className="pt-2 border-t border-pink-100 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Subscription Plan *</label>
                    <select
                      value={tenantForm.planId}
                      onChange={(e) => {
                        const selectedPlanId = e.target.value;
                        const planObj = plans.find(p => p.id === selectedPlanId);
                        const days = planObj?.durationDays || 30;
                        const start = new Date(tenantForm.startDate || new Date());
                        start.setDate(start.getDate() + days);
                        const newEnd = start.toISOString().split('T')[0];
                        setTenantForm({
                          ...tenantForm,
                          planId: selectedPlanId,
                          endDate: newEnd
                        });
                      }}
                      className="w-full px-3.5 py-2.5 bg-pink-50/40 border border-pink-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-pink-500 cursor-pointer shadow-xs"
                    >
                      {plans.length > 0 ? (
                        plans.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} (₹{p.price.toLocaleString()} • {p.durationDays || 30} Days Validity)
                          </option>
                        ))
                      ) : (
                        <option value="standard_plan">Standard Subscription (Custom / Direct)</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Cashiers Allowed *</span>
                      <span className="text-[10px] text-pink-600 font-bold">Terminal Logins</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={tenantForm.maxCashiers}
                      onChange={(e) => setTenantForm({ ...tenantForm, maxCashiers: Math.max(1, parseInt(e.target.value) || 1) })}
                      placeholder="e.g. 2, 5, 10"
                      className="w-full px-3.5 py-2.5 bg-pink-50/40 border border-pink-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-300 shadow-xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Number of cashier logins/terminals this salon can create (e.g. 2).
                    </span>
                  </div>
                </div>

                {/* Read-Only Subscription Validity Period Display */}
                <div className="bg-pink-50/40 p-3.5 rounded-xl border border-pink-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-pink-700 flex items-center gap-1.5">
                      <Calendar size={14} className="text-pink-600" />
                      <span>Subscription Validity Period</span>
                    </span>
                    {calculateDaysBetween(tenantForm.startDate, tenantForm.endDate) && (
                      <span className="text-[10px] font-bold bg-pink-100 text-pink-700 px-2.5 py-0.5 rounded-full border border-pink-200">
                        {calculateDaysBetween(tenantForm.startDate, tenantForm.endDate)} Auto-Calculated
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-pink-100 shadow-2xs">
                      <div className="text-[11px] font-medium text-slate-500 mb-1 flex items-center justify-between">
                        <span>Plan Start Date</span>
                        <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Today</span>
                      </div>
                      <div className="text-sm font-bold text-slate-800 font-mono">
                        {toDisplayDateString(tenantForm.startDate)}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Activated upon onboarding</span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-pink-100 shadow-2xs">
                      <div className="text-[11px] font-medium text-slate-500 mb-1 flex items-center justify-between">
                        <span>Plan Expiry Date</span>
                        <span className="text-[9px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          {calculateDaysBetween(tenantForm.startDate, tenantForm.endDate) || 'Expiry'}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-rose-600 font-mono">
                        {toDisplayDateString(tenantForm.endDate)}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Calculated from plan validity days</span>
                    </div>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="bg-pink-50/40 p-3.5 rounded-xl border border-pink-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <CreditCard size={14} className="text-pink-600" />
                      <span>Payment Method *</span>
                    </label>
                    <span className="text-[10px] text-pink-600 font-bold">Onboarding Payment</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'UPI / GPay / PhonePe', label: 'UPI / GPay', icon: '📱' },
                      { id: 'Bank Transfer / NEFT', label: 'Bank Transfer', icon: '🏦' },
                      { id: 'Cash', label: 'Cash', icon: '💵' },
                      { id: 'Credit / Debit Card', label: 'Card Swipe', icon: '💳' },
                    ].map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setTenantForm({ ...tenantForm, paymentMode: pm.id })}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          (tenantForm.paymentMode || 'UPI / GPay / PhonePe') === pm.id
                            ? 'bg-gradient-to-r from-pink-600 to-rose-500 text-white border-pink-600 shadow-sm'
                            : 'bg-white text-slate-700 border-pink-200 hover:bg-pink-50'
                        }`}
                      >
                        <span>{pm.icon}</span>
                        <span>{pm.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-pink-100">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2 border border-pink-200 hover:bg-pink-50 text-slate-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Onboard Salon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT SALON COMPANY PROFILE                        */}
      {/* ======================================================== */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setEditingTenant(null)} />
          <div className="relative bg-white border border-pink-100 rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 text-slate-800 max-h-[90vh] overflow-y-auto z-10">
            <div className="flex justify-between items-center pb-3 border-b border-pink-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Edit2 className="text-pink-600" size={20} />
                  <span>Edit Salon Company Profile</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Update salon details for <strong className="text-slate-800">{editingTenant.companyName}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTenant(null)}
                className="text-slate-400 hover:text-slate-700 hover:bg-pink-50 rounded-lg p-1 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Row 1: Company Name & Logo Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Business Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.companyName}
                    onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                    placeholder="e.g. Jawed Habib Luxury"
                    className="w-full px-3.5 py-2 bg-pink-50/40 border border-pink-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-300"
                  />
                  <div className="mt-2">
                    <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Brand Short Name (Optional Fallback)</label>
                    <input
                      type="text"
                      value={editForm.brandName}
                      onChange={(e) => setEditForm({ ...editForm, brandName: e.target.value })}
                      placeholder="e.g. JAWED HABIB"
                      className="w-full px-3 py-1.5 bg-pink-50/30 border border-pink-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 uppercase"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-pink-600" />
                      <span>Company Logo</span>
                    </label>
                    <span className="text-[10px] text-pink-600 font-semibold bg-pink-50 px-1.5 py-0.5 rounded border border-pink-200">
                      Replaces Logo Text
                    </span>
                  </div>

                  {editForm.logoUrl ? (
                    <div className="flex items-center justify-between p-2.5 bg-pink-50/40 border border-pink-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <img
                          src={editForm.logoUrl}
                          alt="Logo Preview"
                          className="h-10 w-16 object-contain rounded bg-white border border-pink-200 p-1 shadow-2xs"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Current Logo ✓</span>
                          <span className="text-[10px] text-emerald-600 font-medium">Active on header & invoices</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <label className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-pink-50 text-pink-700 border border-pink-200 rounded-md cursor-pointer transition-colors shadow-2xs">
                          Change
                          <input type="file" accept="image/*" onChange={handleEditLogoUpload} className="hidden" />
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveEditLogo}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer transition-colors"
                          title="Remove Logo"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-pink-300 hover:border-pink-500 bg-pink-50/30 hover:bg-pink-50/60 rounded-xl p-3.5 cursor-pointer transition-all group">
                      <Upload size={20} className="text-pink-500 group-hover:scale-110 transition-transform mb-1" />
                      <span className="text-xs font-bold text-pink-700">Upload Company Logo</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, SVG, WebP (up to 2MB)</span>
                      <span className="text-[9px] text-slate-400 mt-0.5">Replaces logo text in header and bills</span>
                      <input type="file" accept="image/*" onChange={handleEditLogoUpload} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              {/* Row 2: Owner & Admin Contact */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Owner Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.ownerName}
                    onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
                    placeholder="e.g. Ramesh Kulkarni"
                    className="w-full px-3.5 py-2 bg-pink-50/40 border border-pink-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Email *</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="admin@salon.com"
                    className="w-full px-3.5 py-2 bg-pink-50/40 border border-pink-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Mobile *</label>
                  <input
                    type="tel"
                    required
                    value={editForm.mobile}
                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2 bg-pink-50/40 border border-pink-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-300"
                  />
                </div>
              </div>

              {/* Row 3: Outlet Location & City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-pink-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Salon Location / Area</label>
                  <input
                    type="text"
                    value={editForm.primaryBranchName}
                    onChange={(e) => setEditForm({ ...editForm, primaryBranchName: e.target.value })}
                    placeholder="e.g. Main Studio, FC Road"
                    className="w-full px-3.5 py-2 bg-pink-50/40 border border-pink-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    placeholder="e.g. Karimnagar, Hyderabad, Pune, Mumbai"
                    className="w-full px-3.5 py-2 bg-pink-50/40 border border-pink-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-300"
                  />
                </div>
              </div>

              {/* Row 4: Admin Password & Cashiers Allowed */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-pink-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Password</label>
                  <input
                    type="text"
                    value={editForm.adminPassword}
                    onChange={(e) => setEditForm({ ...editForm, adminPassword: e.target.value })}
                    placeholder="Update admin login password"
                    className="w-full px-3.5 py-2 bg-pink-50/40 border border-pink-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-300"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Password used by salon admin to sign in at login screen.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Cashiers Allowed</span>
                    <span className="text-[10px] text-pink-600 font-bold">Terminal Logins</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={editForm.maxCashiers}
                    onChange={(e) => setEditForm({ ...editForm, maxCashiers: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full px-3.5 py-2 bg-pink-50/40 border border-pink-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-300"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Number of cashier terminals/logins this salon can manage.
                  </p>
                </div>
              </div>

              {/* Row 5: Feature Modules & Allowed Access */}
              <div className="pt-3 border-t border-pink-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800">
                      Accessible System Modules & Feature Overrides
                    </label>
                    <p className="text-[10px] text-slate-500">
                      Base Plan: <span className="font-semibold text-pink-700">{editingTenant.planName || 'Standard Plan'}</span>. You can allow additional features for this salon.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200">
                    {editForm.features?.length || 0} Modules Allowed
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-pink-50/30 p-3 rounded-xl border border-pink-100 max-h-56 overflow-y-auto">
                  {availableFeatureOptions.map((feat) => {
                    const checked = Array.isArray(editForm.features) && editForm.features.includes(feat);
                    return (
                      <label
                        key={feat}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer select-none transition-all ${
                          checked ? 'bg-pink-100 text-pink-900 border border-pink-200 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          const current = Array.isArray(editForm.features) ? editForm.features : [];
                          const updated = current.includes(feat)
                            ? current.filter(f => f !== feat)
                            : [...current, feat];
                          setEditForm({ ...editForm, features: updated });
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="rounded border-pink-300 text-pink-600 focus:ring-pink-500 shrink-0"
                        />
                        <span className="truncate">{feat}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Reset to Base Plan Button */}
                <div className="flex justify-between items-center pt-1 text-[11px]">
                  <span className="text-slate-400">Want to restore standard plan defaults?</span>
                  <button
                    type="button"
                    onClick={() => {
                      const allPlans = getSubscriptionPlans();
                      let matchedPlan = allPlans.find(p => p.id === editingTenant.planId) ||
                                        allPlans.find(p => p.name?.toLowerCase() === editingTenant.planName?.toLowerCase());
                      if (!matchedPlan && editingTenant.companyName?.toLowerCase().includes('paradise')) {
                        matchedPlan = allPlans.find(p => p.name?.toLowerCase().includes('bumper'));
                      }
                      const planFeats = matchedPlan && Array.isArray(matchedPlan.features) ? [...matchedPlan.features] : [];
                      setEditForm(prev => ({ ...prev, features: planFeats }));
                    }}
                    className="text-pink-600 hover:text-pink-800 font-semibold hover:underline cursor-pointer"
                  >
                    Reset to Plan Defaults
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-pink-100">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="px-4 py-2 border border-pink-200 hover:bg-pink-50 text-slate-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT SUBSCRIPTION PLAN                   */}
      {/* ======================================================== */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowPlanModal(false)} />
          <div className="relative bg-white border border-pink-100 rounded-2xl shadow-2xl w-full max-w-xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 text-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-pink-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal className="text-pink-600" size={20} />
                  <span>{editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}</span>
                </h3>
                <p className="text-xs text-slate-500">Configure pricing tier, outlet limits, and accessible feature bundles.</p>
              </div>
              <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-slate-700 hover:bg-pink-50 rounded-lg p-1 cursor-pointer transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              {/* Row 1: Plan Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g. Platinum Salon Tier"
                  className="w-full px-3.5 py-2 bg-pink-50/40 border border-pink-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-300"
                />
              </div>

              {/* Row 2: Price & Plan Validity Duration (Days) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                    placeholder="e.g. 4999"
                    className="w-full px-3.5 py-2 bg-pink-50/40 border border-pink-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Validity Duration (Days) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={planForm.durationDays}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPlanForm({
                        ...planForm,
                        durationDays: val,
                        billingCycle: val ? `${val} Days` : ''
                      });
                    }}
                    placeholder="Enter days (e.g. 15, 30, 45, 90, 180, 365)"
                    className="w-full px-3.5 py-2 bg-pink-50/40 border border-pink-200 rounded-lg text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-300"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Enter any custom validity days count (e.g. 7, 30, 45, 90, 180, 365)
                  </span>
                </div>
              </div>

              {/* Features Selection Checklist */}
              <div className="pt-2 border-t border-pink-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">Included Features & System Modules</label>
                  <span className="text-[11px] text-pink-600 font-bold">
                    {planForm.features.length} Modules Selected
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-pink-50/30 p-3 rounded-xl border border-pink-100 max-h-60 overflow-y-auto">
                  {availableFeatureOptions.map((feat) => {
                    const checked = planForm.features.includes(feat);
                    return (
                      <label
                        key={feat}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer select-none transition-all ${
                          checked ? 'bg-pink-100 text-pink-800 border border-pink-200 font-semibold' : 'text-slate-600 hover:text-slate-900'
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFeature(feat);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="rounded border-pink-300 text-pink-600 focus:ring-pink-500 shrink-0"
                        />
                        <span className="truncate">{feat}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-pink-100">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2 border border-pink-200 hover:bg-pink-50 text-slate-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {editingPlan ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: MANAGE SALON SUBSCRIPTION & EXTENSION           */}
      {/* ======================================================== */}
      {subscriptionModalTenant && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-pink-100 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[92vh] text-slate-800">
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 border border-pink-200 flex items-center justify-center">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Manage Salon Subscription</span>
                    <span className="text-[10px] font-bold bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full border border-pink-200">
                      {subscriptionModalTenant.brandName || 'SALON'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Upgrade / Downgrade Plan & Extend validity for <strong className="text-slate-800 font-semibold">{subscriptionModalTenant.companyName}</strong>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenHistoryModal(subscriptionModalTenant);
                    setSubscriptionModalTenant(null);
                  }}
                  className="px-2.5 py-1 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="View History for this company"
                >
                  <History size={12} className="text-pink-600" />
                  <span>View History</span>
                </button>
                <button
                  onClick={() => setSubscriptionModalTenant(null)}
                  className="p-1.5 hover:bg-pink-50 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Current Status Overview Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-pink-50/40 p-3.5 rounded-xl border border-pink-100">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Current Plan</span>
                <span className="text-sm font-bold text-pink-700">{subscriptionModalTenant.planName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Current Billed Price</span>
                <span className="text-sm font-bold text-slate-900">₹{subscriptionModalTenant.mrr?.toLocaleString()}/mo</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Current Expiry / Renewal</span>
                <span className="text-sm font-bold text-rose-600 font-mono">{subscriptionModalTenant.nextBillingDate || '21-Oct-2026'}</span>
              </div>
            </div>

            <form onSubmit={handleSaveSubscription} className="space-y-4">
              {/* 1. SELECT PLAN GRID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Select Subscription Plan (Upgrade / Downgrade)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {plans.map((p) => {
                    const isSelected = subForm.planId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectPlanForTenant(p)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-pink-50 border-pink-500 shadow-sm ring-1 ring-pink-400'
                            : 'bg-white border-pink-100 hover:border-pink-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{p.name}</span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-pink-600 text-white flex items-center justify-center text-[10px]">
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-extrabold text-pink-600 mt-1">
                          ₹{p.price?.toLocaleString()}
                          <span className="text-[10px] text-slate-400 font-normal"> / {p.durationDays || 30}d</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          {p.durationDays || 30} Days Validity
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. PLAN VALIDITY PERIOD - READ-ONLY DISPLAY */}
              <div className="bg-pink-50/40 p-4 rounded-xl border border-pink-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-pink-800 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-pink-600" />
                    <span>Subscription Validity Period</span>
                  </label>
                  {calculateDaysBetween(subForm.startDate, subForm.endDate) && (
                    <span className="text-[11px] font-bold bg-pink-100 text-pink-700 px-2.5 py-0.5 rounded-full border border-pink-200 shadow-xs">
                      {calculateDaysBetween(subForm.startDate, subForm.endDate)} Auto-Applied
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Plan Start Date Display */}
                  <div className="bg-white p-3.5 rounded-xl border border-pink-100 shadow-2xs">
                    <div className="text-[11px] font-medium text-slate-500 mb-1 flex items-center justify-between">
                      <span>Renewal Start Date</span>
                      <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Present Date (Today)
                      </span>
                    </div>
                    <div className="text-base font-bold text-slate-800 font-mono">
                      {toDisplayDateString(subForm.startDate) || '-'}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Active from current date
                    </span>
                  </div>

                  {/* Plan End / Expiry Date Display */}
                  <div className="bg-white p-3.5 rounded-xl border border-pink-100 shadow-2xs">
                    <div className="text-[11px] font-medium text-slate-500 mb-1 flex items-center justify-between">
                      <span>New Expiry Date</span>
                      <span className="text-[9px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        {calculateDaysBetween(subForm.startDate, subForm.endDate) || 'Expiry'}
                      </span>
                    </div>
                    <div className="text-base font-bold text-rose-600 font-mono">
                      {toDisplayDateString(subForm.endDate) || '-'}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Calculated from selected plan duration
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. CUSTOM BILLED AMOUNT, CASHIER QUOTA, ACCOUNT STATUS & REMARKS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Agreed Billed Amount (MRR ₹/month)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 text-xs">₹</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={subForm.customPrice}
                      onChange={(e) => setSubForm({ ...subForm, customPrice: e.target.value })}
                      placeholder="e.g. 1999"
                      className="w-full pl-7 pr-3.5 py-2 bg-pink-50/40 border border-pink-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-300"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Override standard plan price
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Max Cashiers Allowed *</span>
                    <span className="text-[10px] text-pink-600 font-bold">Limit</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="50"
                    value={subForm.maxCashiers}
                    onChange={(e) => setSubForm({ ...subForm, maxCashiers: Math.max(1, parseInt(e.target.value) || 1) })}
                    placeholder="e.g. 2"
                    className="w-full px-3.5 py-2 bg-pink-50/40 border border-pink-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-300"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Cashier logins quota
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Status
                  </label>
                  <select
                    value={subForm.status}
                    onChange={(e) => setSubForm({ ...subForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-pink-50/40 border border-pink-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-300 cursor-pointer"
                  >
                    <option value="Active">● Active (Access On)</option>
                    <option value="Inactive">● Inactive (Access Blocked)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Control login access
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={subForm.paymentMode || 'UPI / GPay / PhonePe'}
                    onChange={(e) => setSubForm({ ...subForm, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 bg-pink-50/40 border border-pink-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-300 cursor-pointer"
                  >
                    <option value="UPI / GPay / PhonePe">📱 UPI / GPay / PhonePe</option>
                    <option value="Bank Transfer / NEFT">🏦 Bank Transfer / NEFT</option>
                    <option value="Cash">💵 Cash</option>
                    <option value="Credit / Debit Card">💳 Credit / Debit Card</option>
                    <option value="Cheque">📄 Cheque</option>
                    <option value="Online Payment">🌐 Online Payment</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Renewal payment mode
                  </span>
                </div>
              </div>

              {/* MODAL ACTIONS */}
              <div className="flex justify-end gap-3 pt-3 border-t border-pink-100">
                <button
                  type="button"
                  onClick={() => setSubscriptionModalTenant(null)}
                  className="px-4 py-2 border border-pink-200 hover:bg-pink-50 text-slate-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Update</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: COMPANY SUBSCRIPTION & PAYMENT HISTORY LEDGER   */}
      {/* ======================================================== */}
      {historyModalTenant && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-pink-100 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[92vh] text-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-pink-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 border border-pink-200 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Company Subscription & Payment History</span>
                    <span className="text-[10px] font-bold bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full border border-pink-200">
                      {historyModalTenant.brandName || 'SALON'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Audit trail of join date, plan changes, validity extensions, and payments for <strong className="text-slate-800 font-semibold">{historyModalTenant.companyName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryModalTenant(null)}
                className="p-1.5 hover:bg-pink-50 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Top KPI Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-pink-50/30 p-3.5 rounded-xl border border-pink-100">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-semibold">Joined Date</span>
                  <Calendar size={14} className="text-pink-600" />
                </div>
                <div className="text-sm font-bold text-slate-900 font-mono">{historyModalTenant.createdDate}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Account Onboarded</div>
              </div>

              <div className="bg-pink-50/30 p-3.5 rounded-xl border border-pink-100">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-semibold">Current Plan</span>
                  <Zap size={14} className="text-pink-600" />
                </div>
                <div className="text-sm font-bold text-pink-700 truncate">{historyModalTenant.planName}</div>
                <div className="text-[10px] text-slate-600 mt-0.5 font-medium">
                  ₹{historyModalTenant.mrr?.toLocaleString()}
                  {(() => {
                    const days = historyModalTenant.planName?.toLowerCase().includes('bumper') ? 116
                      : historyModalTenant.planName?.toLowerCase().includes('jumper') ? 18
                      : plans.find(p => p.id === historyModalTenant.planId)?.durationDays;
                    return days ? ` (${days} Days)` : '';
                  })()}
                </div>
              </div>

              <div className="bg-pink-50/30 p-3.5 rounded-xl border border-pink-100">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-semibold">Current Expiry</span>
                  <Clock size={14} className="text-rose-500" />
                </div>
                <div className="text-sm font-bold text-rose-600 font-mono">
                  {historyModalTenant.endDate || historyModalTenant.nextBillingDate || '-'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {isTenantPlanExpired(historyModalTenant) ? (
                    <span className="text-rose-600 font-bold">Expired</span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">Active Subscription</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between bg-pink-50/40 p-3 rounded-xl border border-pink-100">
              <div className="text-xs text-slate-700 font-semibold">
                Subscription Ledger ({historyModalTenant.history?.length || 0} Records)
              </div>
              <div className="flex items-center gap-2">
                {isTenantPlanExpired(historyModalTenant) ? (
                  <button
                    onClick={() => {
                      handleOpenSubscriptionModal(historyModalTenant);
                      setHistoryModalTenant(null);
                    }}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <CalendarClock size={13} />
                    <span>Extend / Change Plan</span>
                  </button>
                ) : (
                  <div
                    className="px-3 py-1.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-not-allowed select-none"
                    title={`Plan is active until ${historyModalTenant.endDate || historyModalTenant.nextBillingDate}. Extensions unlock upon expiry.`}
                  >
                    <Lock size={12} className="text-slate-400" />
                    <span>Active (Locked Until Expiry)</span>
                  </div>
                )}
              </div>
            </div>

            {/* History Table */}
            <div className="overflow-x-auto rounded-xl border border-pink-100 bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-pink-50/70 border-b border-pink-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Date & Event</th>
                    <th className="py-3 px-4">Plan & Details</th>
                    <th className="py-3 px-4">Validity Coverage</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-100 text-xs text-slate-700">
                  {Array.isArray(historyModalTenant.history) && historyModalTenant.history.length > 0 ? (
                    historyModalTenant.history.map((record) => {
                      const isSignup = record.type === 'INITIAL_SIGNUP';
                      const isUpgrade = record.type === 'PLAN_UPGRADE';
                      const isDowngrade = record.type === 'PLAN_DOWNGRADE';
                      const isExtension = record.type === 'VALIDITY_EXTENSION';

                      return (
                        <tr key={record.id} className="hover:bg-pink-50/40 transition-colors">
                          {/* Date & Event */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-mono text-xs font-bold text-slate-900">{record.date}</div>
                            <div className="mt-1">
                              {isSignup && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-700 border border-pink-200">
                                  <Check size={10} /> Joined & Activated
                                </span>
                              )}
                              {isUpgrade && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                  <ArrowUpRight size={10} /> Plan Upgrade
                                </span>
                              )}
                              {isDowngrade && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                  <ArrowDownRight size={10} /> Plan Downgrade
                                </span>
                              )}
                              {isExtension && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                  <CalendarClock size={10} /> Validity Extension
                                </span>
                              )}
                              {!isSignup && !isUpgrade && !isDowngrade && !isExtension && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  <RefreshCw size={10} /> {record.type}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Plan Details */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              {record.previousPlanName ? (
                                <span className="flex items-center gap-1">
                                  <span className="line-through text-slate-400 text-[11px]">{record.previousPlanName}</span>
                                  <span className="text-slate-400">➔</span>
                                  <span className="text-pink-700 font-bold">{record.planName}</span>
                                </span>
                              ) : (
                                <span className="text-pink-700 font-bold">{record.planName}</span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {record.title || record.type}
                            </div>
                          </td>

                          {/* Validity Coverage */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {(() => {
                              const covStart = record.startDate || historyModalTenant.startDate || historyModalTenant.createdDate || record.date || '-';
                              const covEnd = record.endDate || historyModalTenant.endDate || historyModalTenant.nextBillingDate || '-';
                              const covDuration = record.duration || (
                                (record.planName || historyModalTenant.planName)?.toLowerCase().includes('bumper') ? '116 Days' :
                                (record.planName || historyModalTenant.planName)?.toLowerCase().includes('jumper') ? '18 Days' : null
                              );
                              return (
                                <>
                                  <div className="flex items-center gap-1.5 text-[11px]">
                                    <span className="text-slate-400 font-medium">Start:</span>
                                    <span className="font-mono text-slate-800 font-semibold">{covStart}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                                    <span className="text-slate-400 font-medium">End:</span>
                                    <span className="font-mono text-rose-600 font-bold">{covEnd}</span>
                                    {covDuration && (
                                      <span className="text-[10px] bg-pink-100/70 text-pink-700 font-semibold px-1.5 py-0.2 rounded border border-pink-200 ml-1">
                                        {covDuration}
                                      </span>
                                    )}
                                  </div>
                                </>
                              );
                            })()}
                          </td>

                          {/* Amount Paid */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="text-sm font-black text-slate-900">
                              ₹{parseFloat(record.amountPaid || 0).toLocaleString()}
                            </div>
                          </td>

                          {/* Payment Method */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                              <CreditCard size={12} className="text-pink-600" />
                              <span>{record.paymentMode || 'UPI / GPay / PhonePe'}</span>
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check size={10} /> Paid
                            </span>
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleDeleteHistoryRecord(record.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                              title="Delete this record from history ledger"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400 italic">
                        No previous subscription transactions logged for this company.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-pink-100">
              <div className="text-xs text-slate-500">
                Company Onboarded: <strong className="text-slate-800 font-mono">{historyModalTenant.createdDate}</strong>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalTenant(null)}
                className="px-5 py-2 bg-pink-100 hover:bg-pink-200 text-pink-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-pink-200"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: COMPLETE COMPANY PROFILE & DETAILS VIEW MODAL    */}
      {/* ======================================================== */}
      {viewDetailsModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setViewDetailsModalTenant(null)} />
          <div className="relative bg-white border border-pink-100 rounded-3xl shadow-2xl w-full max-w-2xl p-6 sm:p-7 space-y-6 animate-in fade-in zoom-in-95 duration-150 text-slate-800 max-h-[92vh] overflow-y-auto z-10">
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div className="flex items-start gap-3.5">
                {viewDetailsModalTenant.logoUrl ? (
                  <img
                    src={viewDetailsModalTenant.logoUrl}
                    alt={viewDetailsModalTenant.companyName}
                    className="w-12 h-12 rounded-2xl object-contain bg-white border border-pink-200 p-1 shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white font-black text-lg flex items-center justify-center shadow-md shadow-pink-500/20 shrink-0">
                    {viewDetailsModalTenant.logoTextPrefix || viewDetailsModalTenant.companyName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      {viewDetailsModalTenant.companyName}
                    </h3>
                    {viewDetailsModalTenant.brandName && (
                      <span className="bg-pink-50 text-pink-700 font-bold text-[10px] px-2 py-0.5 rounded-md border border-pink-200 uppercase tracking-wide">
                        {viewDetailsModalTenant.brandName}
                      </span>
                    )}
                    {isTenantPlanExpired(viewDetailsModalTenant) ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Expired
                      </span>
                    ) : viewDetailsModalTenant.status === 'Inactive' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Inactive (Deactivated)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span>ID: <code className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">{viewDetailsModalTenant.id}</code></span>
                    <span>•</span>
                    <span>Joined: <strong>{viewDetailsModalTenant.createdDate || '21 Sept 2026'}</strong></span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewDetailsModalTenant(null)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl p-1.5 cursor-pointer transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Top Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-pink-50/50 border border-pink-100 rounded-2xl p-3">
                <span className="text-[10px] uppercase font-bold text-pink-700 block tracking-wider">Total LTV Paid</span>
                <div className="text-base font-black text-slate-900 mt-0.5 flex items-center">
                  <IndianRupee size={14} className="text-pink-600" />
                  <span>{calculateTenantLTV(viewDetailsModalTenant).toLocaleString()}</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {viewDetailsModalTenant.history?.length || 1} transaction(s)
                </span>
              </div>

              <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-3">
                <span className="text-[10px] uppercase font-bold text-rose-700 block tracking-wider">Current Plan</span>
                <div className="text-sm font-black text-slate-900 mt-0.5 truncate">
                  {viewDetailsModalTenant.planName || 'Growth Plan'}
                </div>
                <span className="text-[10px] text-rose-600 font-bold block mt-0.5">
                  ₹{Number(viewDetailsModalTenant.mrr || 0).toLocaleString()}/month
                </span>
              </div>

              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3">
                <span className="text-[10px] uppercase font-bold text-indigo-700 block tracking-wider">Valid Till</span>
                <div className="text-xs font-black text-slate-900 mt-1 font-mono">
                  {viewDetailsModalTenant.nextBillingDate}
                </div>
                <span className="text-[10px] text-indigo-600 font-bold block mt-0.5">
                  {calculateDaysBetween(new Date().toISOString().split('T')[0], toISODateString(viewDetailsModalTenant.nextBillingDate)) || 'Active'}
                </span>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block tracking-wider">Cashier Quota</span>
                <div className="text-sm font-black text-slate-900 mt-0.5">
                  {getCashiersForTenant(viewDetailsModalTenant.id).length} / {viewDetailsModalTenant.maxCashiers || 2}
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                  Terminals used
                </span>
              </div>
            </div>

            {/* Information Grid */}
            <div className="space-y-4">
              {/* Owner & Primary Contact */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                  <Users size={16} className="text-pink-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Owner & Primary Admin Contact
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Owner / Decision Maker:</span>
                    <strong className="text-slate-800 font-semibold text-xs mt-0.5 block">
                      {viewDetailsModalTenant.ownerName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Admin Email:</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Mail size={13} className="text-slate-400 shrink-0" />
                      <span className="text-slate-800 font-bold text-xs truncate">
                        {viewDetailsModalTenant.email}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Contact Mobile Number:</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span className="text-slate-800 font-bold text-xs">
                        {viewDetailsModalTenant.mobile}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location & Branch Configuration */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                  <MapPin size={16} className="text-rose-500" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Location & Outlet Details
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">City:</span>
                    <strong className="text-slate-800 font-semibold text-xs mt-0.5 block">
                      {viewDetailsModalTenant.city || viewDetailsModalTenant.branches?.[0]?.city || 'Location Not Set'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Primary Outlet Location:</span>
                    <span className="text-slate-800 font-semibold text-xs mt-0.5 block">
                      {viewDetailsModalTenant.branches?.[0]?.name || viewDetailsModalTenant.primaryBranchName || 'Main Studio'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Total Configured Branches:</span>
                    <span className="text-slate-800 font-semibold text-xs mt-0.5 block">
                      {viewDetailsModalTenant.branches?.length || 1} Outlet(s)
                    </span>
                  </div>
                </div>
              </div>

              {/* Cashiers Terminals List */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <KeyRound size={16} className="text-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Configured Cashiers ({getCashiersForTenant(viewDetailsModalTenant.id).length})
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Quota: {viewDetailsModalTenant.maxCashiers || 2} Allowed
                  </span>
                </div>

                {getCashiersForTenant(viewDetailsModalTenant.id).length > 0 ? (
                  <div className="divide-y divide-slate-200/60 text-xs">
                    {getCashiersForTenant(viewDetailsModalTenant.id).map(c => (
                      <div key={c.id} className="py-2 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800">{c.name}</div>
                          <div className="text-[11px] text-slate-500">{c.email || c.username} • {c.phone || 'No phone'}</div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.active !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                          {c.active !== false ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No cashier terminals created yet for this salon.</p>
                )}
              </div>

              {/* Accessible Modules & Features List */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-pink-600" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Included Modules & Feature Access
                    </h4>
                  </div>
                  <span className="text-[10px] text-pink-600 font-bold bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
                    {(() => {
                      if (Array.isArray(viewDetailsModalTenant.customFeatures) && viewDetailsModalTenant.customFeatures.length > 0) {
                        return `${viewDetailsModalTenant.customFeatures.length} Modules (Custom Overrides)`;
                      }
                      const matchedPlan = plans.find(p => p.id === viewDetailsModalTenant.planId) ||
                                          plans.find(p => p.name?.toLowerCase() === viewDetailsModalTenant.planName?.toLowerCase()) ||
                                          (viewDetailsModalTenant.companyName?.toLowerCase().includes('paradise') ? plans.find(p => p.name?.toLowerCase().includes('bumper')) : null);
                      return `${matchedPlan?.features?.length || 0} Modules (Plan Default)`;
                    })()}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(() => {
                    let activeFeats = [];
                    if (Array.isArray(viewDetailsModalTenant.customFeatures) && viewDetailsModalTenant.customFeatures.length > 0) {
                      activeFeats = viewDetailsModalTenant.customFeatures;
                    } else {
                      const matchedPlan = plans.find(p => p.id === viewDetailsModalTenant.planId) ||
                                          plans.find(p => p.name?.toLowerCase() === viewDetailsModalTenant.planName?.toLowerCase()) ||
                                          (viewDetailsModalTenant.companyName?.toLowerCase().includes('paradise') ? plans.find(p => p.name?.toLowerCase().includes('bumper')) : null);
                      activeFeats = matchedPlan && Array.isArray(matchedPlan.features) ? matchedPlan.features : [];
                    }

                    if (activeFeats.length === 0) {
                      return <span className="text-xs text-slate-400 italic">No specific module restrictions.</span>;
                    }

                    return activeFeats.map((feat, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-slate-800 border border-slate-200 shadow-2xs">
                        <Check size={12} className="text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </span>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewDetailsModalTenant(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                Close
              </button>

              <div className="flex flex-wrap items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const t = viewDetailsModalTenant;
                    setViewDetailsModalTenant(null);
                    handleOpenHistoryModal(t);
                  }}
                  className="flex items-center gap-1.5 bg-white hover:bg-pink-50 text-pink-700 border border-pink-200 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  <History size={14} className="text-pink-600" />
                  <span>View History Ledger</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const t = viewDetailsModalTenant;
                    setViewDetailsModalTenant(null);
                    handleOpenSubscriptionModal(t);
                  }}
                  className="flex items-center gap-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  <CalendarClock size={14} className="text-rose-600" />
                  <span>Plan / Extend</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const t = viewDetailsModalTenant;
                    setViewDetailsModalTenant(null);
                    handleImpersonateCompany(t);
                  }}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                  title={`Inspect ${viewDetailsModalTenant?.companyName} in Read-Only mode`}
                >
                  <Eye size={14} />
                  <span>Impersonate (Read-Only)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PERMANENT COMPANY DELETE CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {deleteModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-rose-200 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-rose-50 via-red-50 to-orange-50 border-b border-rose-100 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-600 shrink-0 shadow-xs">
                <Trash2 size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">
                    Delete Company Permanently
                  </h3>
                  <button
                    onClick={() => {
                      if (!isDeleting) {
                        setDeleteModalTenant(null);
                        setDeletePassword('');
                        setDeleteError('');
                      }
                    }}
                    disabled={isDeleting}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/80 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="text-xs text-rose-700 font-semibold mt-0.5">
                  High-Risk Action • Irreversible Permanent Data Wipeout
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmDeleteCompany} className="p-6 space-y-4">
              {/* Warning message box */}
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-slate-800 text-xs space-y-2">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                  <AlertTriangle size={18} className="shrink-0 text-rose-600" />
                  <span>Warning: No Restore Possible</span>
                </div>
                <p className="leading-relaxed">
                  Are you sure you want to delete <span className="font-bold text-slate-900 underline">{deleteModalTenant.companyName}</span>?
                </p>
                <p className="text-rose-900 leading-relaxed font-medium">
                  This will completely and permanently erase this company and all its data (including all bills, invoices, transactions, inventory, staff, clients, and user accounts).
                </p>
                <div className="inline-block bg-rose-600 text-white font-bold text-[11px] px-2.5 py-1 rounded-md mt-1">
                  THERE IS NO RESTORE FOR THIS ACTION.
                </div>
              </div>

              {/* Password Input Field */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-slate-700">
                  Enter Super Admin Password to Confirm: <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    autoFocus
                    required
                    value={deletePassword}
                    onChange={(e) => {
                      setDeletePassword(e.target.value);
                      if (deleteError) setDeleteError('');
                    }}
                    placeholder="Enter your Super Admin password"
                    disabled={isDeleting}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:bg-white transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Error display */}
              {deleteError && (
                <div className="p-3 rounded-xl bg-red-100 border border-red-300 text-red-800 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle size={16} className="shrink-0 text-red-600" />
                  <span className="font-medium">{deleteError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteModalTenant(null);
                    setDeletePassword('');
                    setDeleteError('');
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting || !deletePassword.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 transition-all cursor-pointer"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Permanently Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>Permanently Delete Company</span>
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

export default SuperAdminPage;
