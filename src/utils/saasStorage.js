const SAAS_STORAGE_KEY = 'respark_saas_tenants';
const SAAS_USER_KEY = 'respark_saas_current_user';
const SAAS_ACTIVE_TENANT_KEY = 'respark_saas_active_tenant';
const SAAS_ACTIVE_BRANCH_KEY = 'respark_saas_active_branch';

export const toISODateString = (dateStr) => {
  if (!dateStr) {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  const parts = String(dateStr).trim().split('-');
  if (parts.length === 3) {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const partMonth = parts[1].toLowerCase().trim();
    const mIdx = months.findIndex(m => partMonth.startsWith(m));
    if (mIdx >= 0) {
      const day = parts[0].padStart(2, '0');
      const month = String(mIdx + 1).padStart(2, '0');
      const year = parts[2].trim();
      return `${year}-${month}-${day}`;
    }
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
};

export const isTenantPlanExpired = (tenant) => {
  if (!tenant || !tenant.nextBillingDate) return false;
  try {
    const expiryIso = toISODateString(tenant.nextBillingDate);
    const todayIso = new Date().toISOString().split('T')[0];
    return expiryIso <= todayIso;
  } catch (e) {
    return false;
  }
};

export const toDisplayDateString = (isoDateStr) => {
  if (!isoDateStr) return '';
  const parts = String(isoDateStr).split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parts[2].padStart(2, '0');
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${day}-${months[monthIdx]}-${year}`;
    }
  }
  const d = new Date(isoDateStr);
  if (!isNaN(d.getTime())) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
  }
  return String(isoDateStr);
};

export const getFutureISODate = (fromIsoDate, monthsToAdd) => {
  const base = fromIsoDate ? new Date(fromIsoDate) : new Date();
  if (isNaN(base.getTime())) return new Date().toISOString().split('T')[0];
  base.setMonth(base.getMonth() + monthsToAdd);
  return base.toISOString().split('T')[0];
};

export const calculateDaysBetween = (startIso, endIso) => {
  if (!startIso || !endIso) return '';
  const d1 = new Date(startIso);
  const d2 = new Date(endIso);
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (isNaN(diffDays)) return '';
  if (diffDays <= 0) return '0 days';
  if (diffDays >= 360) {
    const years = Math.round((diffDays / 365) * 10) / 10;
    return `${diffDays} days (~${years} yr)`;
  }
  if (diffDays >= 28) {
    const months = Math.round((diffDays / 30) * 10) / 10;
    return `${diffDays} days (~${months} mo)`;
  }
  return `${diffDays} days`;
};

export const initialSubscriptionPlans = [
  {
    id: 'plan_starter',
    name: 'Starter Plan (30 Days)',
    price: 1999,
    durationDays: 30,
    billingCycle: '30 Days',
    maxCashiers: 1,
    features: ['Quick Sale POS', 'Appointment Booking & Calendar Grid', 'Reports & Business Analytics', 'Cash Management & Counter Float', '1 Cashier Terminal'],
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300'
  },
  {
    id: 'plan_growth',
    name: 'Growth Plan (90 Days)',
    price: 4999,
    durationDays: 90,
    billingCycle: '90 Days',
    maxCashiers: 2,
    features: ['Quick Sale POS', 'Appointment Booking & Calendar Grid', 'CRM & Client Management', 'Salon Inventory & POs', 'Expenses Management', 'WhatsApp Invoicing & Alerts', '2 Cashier Terminals'],
    badgeColor: 'bg-pink-50 text-pink-700 border-pink-300'
  },
  {
    id: 'plan_enterprise',
    name: 'Annual Enterprise (365 Days)',
    price: 9999,
    durationDays: 365,
    billingCycle: '365 Days',
    maxCashiers: 5,
    features: ['Quick Sale POS', 'Appointment Booking & Calendar Grid', 'CRM & Client Management', 'Master BackOffice Catalog', 'Salon Inventory & POs', 'Expenses Management', 'Staff Payroll & Commissions', 'Reports & Business Analytics', 'Cash Management & Counter Float', 'WhatsApp Invoicing & Alerts', 'Revenue Trends & Insights', '5 Cashier Terminals'],
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-300'
  }
];

export const initialTenants = [
  {
    id: 'tenant_glamour',
    companyName: 'Glamour Salons & Spa',
    brandName: 'GLAMOUR',
    logoTextPrefix: 'GLA',
    logoTextSuffix: 'MOUR',
    ownerName: 'Vikram Singhania',
    email: 'admin@glamoursalon.com',
    mobile: '9820123456',
    adminUsername: 'admin',
    adminPassword: 'admin123',
    planId: 'plan_enterprise',
    planName: 'Enterprise Plan',
    maxCashiers: 2,
    status: 'Active', // 'Active' | 'Suspended'
    createdDate: '10-Jan-2026',
    nextBillingDate: '10-Oct-2026',
    mrr: 9999,
    branches: [
      { id: 'b_glamour_1', name: 'Trial 1, Kalyaninagar', city: 'Pune', isPrimary: true, phone: '020-26654321', active: true },
      { id: 'b_glamour_2', name: 'Branch 2, Koregaon Park', city: 'Pune', isPrimary: false, phone: '020-26658888', active: true },
      { id: 'b_glamour_3', name: 'Branch 3, Baner High St', city: 'Pune', isPrimary: false, phone: '020-27751234', active: true }
    ]
  },
  {
    id: 'tenant_naturals',
    companyName: 'Naturals Luxury Salon',
    brandName: 'NATURALS',
    logoTextPrefix: 'NATU',
    logoTextSuffix: 'RALS',
    ownerName: 'Pooja Hegde',
    email: 'contact@naturalssalon.in',
    mobile: '9845012345',
    adminUsername: 'naturals_admin',
    adminPassword: 'admin123',
    planId: 'plan_growth',
    planName: 'Growth Plan',
    maxCashiers: 2,
    status: 'Active',
    createdDate: '18-Feb-2026',
    nextBillingDate: '18-Oct-2026',
    mrr: 4999,
    branches: [
      { id: 'b_naturals_1', name: 'Viman Nagar Central', city: 'Pune', isPrimary: true, phone: '020-41235678', active: true },
      { id: 'b_naturals_2', name: 'FC Road Flagship', city: 'Pune', isPrimary: false, phone: '020-41239999', active: true }
    ]
  },
  {
    id: 'tenant_enrich',
    companyName: 'Enrich Hair Studio',
    brandName: 'ENRICH',
    logoTextPrefix: 'EN',
    logoTextSuffix: 'RICH',
    ownerName: 'Rahul Verma',
    email: 'rahul@enrichstudio.com',
    mobile: '9890123456',
    adminUsername: 'enrich_admin',
    adminPassword: 'admin123',
    planId: 'plan_starter',
    planName: 'Starter Plan',
    maxCashiers: 1,
    status: 'Active',
    createdDate: '01-Mar-2026',
    nextBillingDate: '01-Oct-2026',
    mrr: 1999,
    branches: [
      { id: 'b_enrich_1', name: 'Aundh West Outlet', city: 'Pune', isPrimary: true, phone: '020-25881234', active: true }
    ]
  }
];

export const superAdminUser = {
  id: 'usr_superadmin',
  username: 'superadmin',
  name: 'Platform Super Admin',
  role: 'SUPER_ADMIN',
  email: 'superadmin@respark.in',
  avatar: '👑'
};

export const generateDefaultTenantHistory = (t) => {
  if (t.id === 'tenant_glamour') {
    return [
      {
        id: 'hist_glamour_3',
        date: '10-Jul-2026',
        type: 'VALIDITY_EXTENSION',
        title: 'Quarterly Validity Extension (+3 Months)',
        planId: 'plan_enterprise',
        planName: 'Enterprise Plan',
        startDate: '10-Jul-2026',
        endDate: t.nextBillingDate || '10-Oct-2026',
        duration: '3 Months',
        amountPaid: 29997,
        paymentMode: 'Bank Transfer / NEFT',
        status: 'Completed',
        notes: 'Q3 Enterprise renewal paid via HDFC Bank NEFT'
      },
      {
        id: 'hist_glamour_2',
        date: '10-Apr-2026',
        type: 'PLAN_UPGRADE',
        title: 'Plan Upgraded: Growth ➔ Enterprise Plan',
        planId: 'plan_enterprise',
        planName: 'Enterprise Plan',
        previousPlanName: 'Growth Plan',
        startDate: '10-Apr-2026',
        endDate: '10-Jul-2026',
        duration: '3 Months',
        amountPaid: 29997,
        paymentMode: 'Online / UPI',
        status: 'Completed',
        notes: 'Upgraded to Enterprise tier for 3 multi-salon branches across Pune'
      },
      {
        id: 'hist_glamour_1',
        date: '10-Jan-2026',
        type: 'INITIAL_SIGNUP',
        title: 'Company Joined & Growth Plan Activated',
        planId: 'plan_growth',
        planName: 'Growth Plan',
        startDate: '10-Jan-2026',
        endDate: '10-Apr-2026',
        duration: '3 Months',
        amountPaid: 14997,
        paymentMode: 'Online / Card',
        status: 'Completed',
        notes: 'Initial platform signup & onboarding on Growth Plan'
      }
    ];
  } else if (t.id === 'tenant_naturals') {
    return [
      {
        id: 'hist_nat_2',
        date: '18-Jun-2026',
        type: 'VALIDITY_EXTENSION',
        title: 'Subscription Extension (+4 Months)',
        planId: 'plan_growth',
        planName: 'Growth Plan',
        startDate: '18-Jun-2026',
        endDate: t.nextBillingDate || '18-Oct-2026',
        duration: '4 Months',
        amountPaid: 19996,
        paymentMode: 'Online / UPI',
        status: 'Completed',
        notes: 'Extended renewal for 2 salon outlets'
      },
      {
        id: 'hist_nat_1',
        date: '18-Feb-2026',
        type: 'INITIAL_SIGNUP',
        title: 'Company Joined & Growth Plan Activated',
        planId: 'plan_growth',
        planName: 'Growth Plan',
        startDate: '18-Feb-2026',
        endDate: '18-Jun-2026',
        duration: '4 Months',
        amountPaid: 19996,
        paymentMode: 'Online / UPI',
        status: 'Completed',
        notes: 'Initial salon chain onboarding'
      }
    ];
  } else if (t.id === 'tenant_enrich') {
    return [
      {
        id: 'hist_enr_1',
        date: '01-Mar-2026',
        type: 'INITIAL_SIGNUP',
        title: 'Company Joined & Starter Plan Activated',
        planId: 'plan_starter',
        planName: 'Starter Plan',
        startDate: '01-Mar-2026',
        endDate: t.nextBillingDate || '01-Oct-2026',
        duration: '7 Months',
        amountPaid: 13993,
        paymentMode: 'Online / UPI',
        status: 'Completed',
        notes: 'Initial single outlet subscription'
      }
    ];
  } else {
    return [
      {
        id: 'hist_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        date: t.createdDate || '21-Sep-2026',
        type: 'INITIAL_SIGNUP',
        title: `Account Onboarded (${t.planName || 'Plan'})`,
        planId: t.planId || 'plan_growth',
        planName: t.planName || 'Growth Plan',
        startDate: t.createdDate || '21-Sep-2026',
        endDate: t.nextBillingDate || '21-Oct-2026',
        duration: '1 Month',
        amountPaid: 0,
        paymentMode: 'Account Setup',
        status: 'Completed',
        notes: `Account registered & onboarded for ${t.companyName}`
      }
    ];
  }
};

// ==========================================
// TENANTS GET & SAVE
// ==========================================
export const getTenants = () => {
  try {
    const data = localStorage.getItem(SAAS_STORAGE_KEY);
    let parsedTenants = initialTenants;
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsedTenants = parsed;
      }
    }

    const todayIso = new Date().toISOString().split('T')[0];
    let modified = false;

    // Auto-check plan expiry: if plan reached expiry date, automatically change status from 'Active' to 'Inactive'
    const enriched = parsedTenants.map(t => {
      let updatedTenant = { ...t };
      if (t.nextBillingDate) {
        const expiryIso = toISODateString(t.nextBillingDate);
        if (expiryIso <= todayIso) {
          if (updatedTenant.status === 'Active') {
            updatedTenant.status = 'Inactive';
            modified = true;
          }
        }
      }

      // Ensure adminUsername is strictly kept in sync with the registered Admin Email
      if (t.email && updatedTenant.adminUsername !== t.email) {
        updatedTenant.adminUsername = t.email;
        modified = true;
      }

      // Ensure maxCashiers quota is defined
      if (updatedTenant.maxCashiers === undefined) {
        updatedTenant.maxCashiers = updatedTenant.planId === 'plan_enterprise' ? 5 : updatedTenant.planId === 'plan_growth' ? 2 : 1;
        modified = true;
      }

      // Ensure every tenant has a valid history array
      if (!Array.isArray(updatedTenant.history) || updatedTenant.history.length === 0) {
        modified = true;
        const initHist = generateDefaultTenantHistory(updatedTenant);
        updatedTenant.history = initHist;
      }

      // Ensure tenant city is normalized and synchronised with primary branch
      const primaryBranchCity = updatedTenant.branches?.[0]?.city;
      if (!updatedTenant.city && primaryBranchCity) {
        updatedTenant.city = primaryBranchCity;
        modified = true;
      } else if (updatedTenant.city && updatedTenant.branches?.[0] && (!updatedTenant.branches[0].city || (updatedTenant.branches[0].city === 'Pune' && updatedTenant.city !== 'Pune'))) {
        updatedTenant.branches[0].city = updatedTenant.city;
        modified = true;
      }

      // Filter out removed POS Dashboard from customFeatures if present
      if (Array.isArray(updatedTenant.customFeatures)) {
        const filteredFeatures = updatedTenant.customFeatures.filter(f => {
          const str = String(f).toLowerCase();
          return !str.includes('order dashboard') && !str.includes('pos dashboard');
        });
        if (filteredFeatures.length !== updatedTenant.customFeatures.length) {
          updatedTenant.customFeatures = filteredFeatures;
          modified = true;
        }
      }

      // Auto-reconcile custom subscription plan (e.g. paradise with bumper plan)
      const allPlans = getSubscriptionPlans();
      const bumperPlan = allPlans.find(p => p.name && p.name.toLowerCase().includes('bumper'));
      if (bumperPlan && updatedTenant.companyName?.toLowerCase().includes('paradise')) {
        if (updatedTenant.planName?.toLowerCase().includes('growth') || !updatedTenant.mrr) {
          updatedTenant.planId = bumperPlan.id;
          updatedTenant.planName = bumperPlan.name;
          updatedTenant.mrr = bumperPlan.price;
          modified = true;
        }
        if (Array.isArray(updatedTenant.history)) {
          updatedTenant.history = updatedTenant.history.map(h => {
            if (h.type === 'INITIAL_SIGNUP' && (!h.amountPaid || h.amountPaid === 0)) {
              modified = true;
              return {
                ...h,
                title: `Account Onboarded (${bumperPlan.name})`,
                planId: bumperPlan.id,
                planName: bumperPlan.name,
                amountPaid: bumperPlan.price || 1500,
                paymentMode: h.paymentMode && h.paymentMode !== 'Account Setup' ? h.paymentMode : 'UPI / GPay / PhonePe'
              };
            }
            return h;
          });
        }
      }

      return updatedTenant;
    });

    if (modified || !data) {
      localStorage.setItem(SAAS_STORAGE_KEY, JSON.stringify(enriched));
    }
    return enriched;
  } catch (err) {
    console.error('Failed to load tenants', err);
    return initialTenants;
  }
};

export const saveTenants = (tenants) => {
  try {
    localStorage.setItem(SAAS_STORAGE_KEY, JSON.stringify(tenants));
    window.dispatchEvent(new Event('saasUpdated'));
  } catch (err) {
    console.error('Failed to save tenants', err);
  }
};

// ==========================================
// CURRENT SESSION: USER, TENANT, BRANCH
// ==========================================
export const getCurrentUser = () => {
  try {
    const data = localStorage.getItem(SAAS_USER_KEY);
    if (!data) {
      // Default to Glamour Company Admin for seamless fallback
      const defaultUser = {
        id: 'usr_glamour_admin',
        username: 'admin',
        name: 'Glamour Salon Admin',
        role: 'COMPANY_ADMIN',
        companyId: 'tenant_glamour',
        companyName: 'Glamour Salons & Spa',
        branchId: 'b_glamour_1',
        branchName: 'Trial 1, Kalyaninagar'
      };
      localStorage.setItem(SAAS_USER_KEY, JSON.stringify(defaultUser));
      return defaultUser;
    }
    const parsed = JSON.parse(data);

    // If current session is a CASHIER and is missing their dedicated email, auto-resolve it from cashier storage
    if (parsed && parsed.role === 'CASHIER' && !parsed.email) {
      try {
        const tenantId = parsed.companyId || getActiveTenantId();
        const rawCashiers = localStorage.getItem(`respark_cashiers_${tenantId}`);
        if (rawCashiers) {
          const cashiers = JSON.parse(rawCashiers);
          const matched = cashiers.find(c => 
            (parsed.cashierId && String(c.id) === String(parsed.cashierId)) ||
            (parsed.username && c.username?.toLowerCase() === parsed.username?.toLowerCase()) ||
            (parsed.name && c.name?.toLowerCase() === parsed.name?.toLowerCase())
          );
          if (matched?.email) {
            parsed.email = matched.email;
            localStorage.setItem(SAAS_USER_KEY, JSON.stringify(parsed));
          } else {
            parsed.email = parsed.username?.includes('@') ? parsed.username : `${parsed.username || parsed.name || 'cashier'}@saloon.com`;
            localStorage.setItem(SAAS_USER_KEY, JSON.stringify(parsed));
          }
        }
      } catch (e) {}
    }

    return parsed;
  } catch (err) {
    return { role: 'COMPANY_ADMIN', username: 'admin' };
  }
};

// ==========================================
// SUPER ADMIN IMPERSONATION (READ-ONLY)
// ==========================================
export const IMPERSONATION_KEY = 'respark_superadmin_impersonation';

export const isImpersonating = () => {
  try {
    const raw = localStorage.getItem(IMPERSONATION_KEY);
    return !!raw;
  } catch (e) {
    return false;
  }
};

export const getImpersonationSession = () => {
  try {
    const raw = localStorage.getItem(IMPERSONATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const isReadOnlySession = () => {
  return isImpersonating();
};

export const notifyReadOnlyBlocked = (actionName = 'This action') => {
  alert(`⚠️ Read-Only Mode Active:\n\nYou are inspecting this salon in Impersonation Mode as Platform Super Admin.\n${actionName} is blocked to ensure company records cannot be modified.`);
};

export const startImpersonation = (tenant) => {
  try {
    const sessionData = {
      startedAt: new Date().toISOString(),
      superAdmin: superAdminUser,
      targetTenantId: tenant.id,
      targetTenantName: tenant.companyName,
      readOnly: true
    };
    localStorage.setItem(IMPERSONATION_KEY, JSON.stringify(sessionData));

    const impersonatedUser = {
      id: 'usr_impersonated_' + tenant.id,
      username: `superadmin_viewing_${tenant.id}`,
      email: tenant.email,
      name: `${tenant.ownerName} (View-Only)`,
      role: 'COMPANY_ADMIN',
      companyId: tenant.id,
      companyName: tenant.companyName,
      branchId: tenant.branches?.[0]?.id || 'b_1',
      branchName: tenant.branches?.[0]?.name || 'Main Branch',
      isImpersonated: true,
      readOnly: true,
      originalRole: 'SUPER_ADMIN'
    };

    setActiveTenant(tenant);
    setCurrentUser(impersonatedUser);

    window.dispatchEvent(new Event('impersonationChanged'));
    window.dispatchEvent(new Event('saasUserChanged'));
    window.dispatchEvent(new Event('tenantChanged'));
    return true;
  } catch (err) {
    console.error('Failed to start impersonation', err);
    return false;
  }
};

export const stopImpersonation = () => {
  try {
    localStorage.removeItem(IMPERSONATION_KEY);
    setCurrentUser(superAdminUser);

    window.dispatchEvent(new Event('impersonationChanged'));
    window.dispatchEvent(new Event('saasUserChanged'));
    window.dispatchEvent(new Event('tenantChanged'));
    return true;
  } catch (err) {
    console.error('Failed to stop impersonation', err);
    return false;
  }
};

export const setCurrentUser = (user) => {
  try {
    localStorage.setItem(SAAS_USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event('saasUserChanged'));
  } catch (err) {
    console.error(err);
  }
};

export const getActiveTenant = () => {
  try {
    const data = localStorage.getItem(SAAS_ACTIVE_TENANT_KEY);
    const tenants = getTenants();
    if (!data) {
      const defaultTenant = tenants[0] || initialTenants[0];
      localStorage.setItem(SAAS_ACTIVE_TENANT_KEY, JSON.stringify(defaultTenant));
      return defaultTenant;
    }
    const parsed = JSON.parse(data);
    // Find latest version of this tenant in storage
    const match = tenants.find(t => t.id === parsed.id);
    return match || parsed;
  } catch (err) {
    return initialTenants[0];
  }
};

export const getActiveTenantId = () => {
  try {
    const tenant = getActiveTenant();
    return tenant?.id || 'tenant_glamour';
  } catch (err) {
    return 'tenant_glamour';
  }
};

export const setActiveTenant = (tenant) => {
  try {
    localStorage.setItem(SAAS_ACTIVE_TENANT_KEY, JSON.stringify(tenant));
    // Set active branch to primary or first branch of new tenant
    if (tenant.branches && tenant.branches.length > 0) {
      const primary = tenant.branches.find(b => b.isPrimary) || tenant.branches[0];
      setActiveBranch(primary);
    }
    window.dispatchEvent(new Event('tenantChanged'));
    window.dispatchEvent(new Event('saasUpdated'));
    window.dispatchEvent(new Event('servicesUpdated'));
    window.dispatchEvent(new Event('productsUpdated'));
    window.dispatchEvent(new Event('staffUpdated'));
    window.dispatchEvent(new Event('vendorsUpdated'));
    window.dispatchEvent(new Event('ordersUpdated'));
    window.dispatchEvent(new Event('customersUpdated'));
    window.dispatchEvent(new Event('expensesUpdated'));
    window.dispatchEvent(new Event('accountsUpdated'));
  } catch (err) {
    console.error(err);
  }
};


export const getActiveBranch = () => {
  try {
    const data = localStorage.getItem(SAAS_ACTIVE_BRANCH_KEY);
    const tenant = getActiveTenant();
    if (!data) {
      const defaultBranch = tenant.branches?.[0] || { id: 'b_1', name: 'Main Branch', city: 'Pune' };
      localStorage.setItem(SAAS_ACTIVE_BRANCH_KEY, JSON.stringify(defaultBranch));
      return defaultBranch;
    }
    const parsed = JSON.parse(data);
    // Ensure the branch belongs to current tenant
    const match = tenant.branches?.find(b => b.id === parsed.id);
    return match || tenant.branches?.[0] || parsed;
  } catch (err) {
    return { id: 'b_1', name: 'Trial 1, Kalyaninagar', city: 'Pune' };
  }
};

export const setActiveBranch = (branch) => {
  try {
    localStorage.setItem(SAAS_ACTIVE_BRANCH_KEY, JSON.stringify(branch));
    // Update user's active branch
    const user = getCurrentUser();
    if (user) {
      user.branchId = branch.id;
      user.branchName = branch.name;
      setCurrentUser(user);
    }
    window.dispatchEvent(new Event('branchChanged'));
  } catch (err) {
    console.error(err);
  }
};

// ==========================================
// TENANT CREATION & MUTATION
// ==========================================
export const createTenant = (formData) => {
  const tenants = getTenants();
  const tenantId = 'tenant_' + Date.now();
  const branchId = 'b_' + Date.now();

  const allPlans = getSubscriptionPlans();
  const plan = allPlans.find(p => p.id === formData.planId) 
    || allPlans.find(p => p.name?.toLowerCase() === formData.planName?.toLowerCase())
    || allPlans.find(p => p.id === 'plan_growth')
    || allPlans[0]
    || initialSubscriptionPlans[1];

  const brandClean = (formData.brandName || formData.companyName || 'SALON').toUpperCase();
  const halfLen = Math.ceil(brandClean.length / 2);
  const logoTextPrefix = brandClean.slice(0, halfLen);
  const logoTextSuffix = brandClean.slice(halfLen);

  const newTenant = {
    id: tenantId,
    companyName: formData.companyName.trim(),
    brandName: brandClean,
    logoUrl: formData.logoUrl || null,
    logoTextPrefix,
    logoTextSuffix,
    ownerName: formData.ownerName.trim(),
    email: formData.email.trim(),
    mobile: formData.mobile.trim(),
    adminUsername: formData.email.trim(),
    adminPassword: formData.adminPassword || 'admin123',
    city: formData.city ? formData.city.trim() : '',
    planId: plan.id,
    planName: plan.name,
    maxCashiers: formData.maxCashiers !== undefined && formData.maxCashiers !== '' ? Number(formData.maxCashiers) : (plan.maxCashiers || 2),
    status: (formData.endDate && toISODateString(formData.endDate) <= new Date().toISOString().split('T')[0]) ? 'Inactive' : 'Active',
    createdDate: formData.startDate ? toDisplayDateString(formData.startDate) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
    nextBillingDate: formData.endDate ? toDisplayDateString(formData.endDate) : (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
    })(),
    mrr: plan.price,
    history: [
      {
        id: 'hist_' + Date.now(),
        date: formData.startDate ? toDisplayDateString(formData.startDate) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
        type: 'INITIAL_SIGNUP',
        title: `Account Onboarded (${plan.name})`,
        planId: plan.id,
        planName: plan.name,
        previousPlanName: null,
        startDate: formData.startDate ? toDisplayDateString(formData.startDate) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
        endDate: formData.endDate ? toDisplayDateString(formData.endDate) : (() => {
          const d = new Date();
          d.setMonth(d.getMonth() + 1);
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
        })(),
        duration: calculateDaysBetween(
          toISODateString(formData.startDate),
          toISODateString(formData.endDate)
        ) || '1 Month',
        amountPaid: plan.price || 0,
        paymentMode: formData.paymentMode || 'UPI / GPay / PhonePe',
        status: 'Completed',
        notes: `Initial onboarding subscription payment via ${formData.paymentMode || 'UPI / GPay / PhonePe'}`
      }
    ],
    branches: [
      {
        id: branchId,
        name: formData.primaryBranchName ? formData.primaryBranchName.trim() : `${formData.city || 'Main'} Outlet`,
        city: formData.city ? formData.city.trim() : '',
        isPrimary: true,
        phone: formData.mobile,
        active: true
      }
    ]
  };

  const updated = [newTenant, ...tenants];
  saveTenants(updated);
  return newTenant;
};

export const updateTenant = (id, updatedFields) => {
  const tenants = getTenants();
  const updated = tenants.map(t => {
    if (t.id === id) {
      const merged = { ...t, ...updatedFields };
      if (updatedFields.city && Array.isArray(merged.branches) && merged.branches.length > 0) {
        merged.branches = merged.branches.map((b, idx) => {
          if (b.isPrimary || idx === 0) {
            return { ...b, city: updatedFields.city };
          }
          return b;
        });
      }
      return merged;
    }
    return t;
  });
  saveTenants(updated);

  const active = getActiveTenant();
  if (active && active.id === id) {
    const updatedActive = { ...active, ...updatedFields };
    if (updatedFields.city && Array.isArray(updatedActive.branches) && updatedActive.branches.length > 0) {
      updatedActive.branches = updatedActive.branches.map((b, idx) => {
        if (b.isPrimary || idx === 0) {
          return { ...b, city: updatedFields.city };
        }
        return b;
      });
    }
    setActiveTenant(updatedActive);
  }
};

export const deleteTenant = (id) => {
  const tenants = getTenants();
  const updated = tenants.filter(t => t.id !== id);
  saveTenants(updated);

  const active = getActiveTenant();
  if (active && active.id === id && updated.length > 0) {
    setActiveTenant(updated[0]);
  }
};

export const toggleTenantStatus = (id) => {
  const tenants = getTenants();
  let newStatus = 'Active';
  const updated = tenants.map(t => {
    if (t.id === id) {
      const isExpired = isTenantPlanExpired(t);
      if (isExpired) {
        // If expired, status remains Inactive
        newStatus = 'Inactive';
        return { ...t, status: 'Inactive' };
      }
      newStatus = t.status === 'Active' ? 'Inactive' : 'Active';
      return { ...t, status: newStatus };
    }
    return t;
  });
  saveTenants(updated);
  return newStatus;
};

export const createTenantBranch = (tenantId, branchData) => {
  const tenants = getTenants();
  const updated = tenants.map(t => {
    if (t.id === tenantId) {
      const newBranch = {
        id: 'b_' + Date.now(),
        name: branchData.name.trim(),
        city: branchData.city.trim() || 'Pune',
        phone: branchData.phone || t.mobile,
        isPrimary: false,
        active: true
      };
      return {
        ...t,
        branches: [...(t.branches || []), newBranch]
      };
    }
    return t;
  });
  saveTenants(updated);

  const active = getActiveTenant();
  if (active && active.id === tenantId) {
    const updatedTenant = updated.find(t => t.id === tenantId);
    if (updatedTenant) setActiveTenant(updatedTenant);
  }
};

const SAAS_PLANS_STORAGE_KEY = 'respark_saas_plans';

export const getSubscriptionPlans = () => {
  try {
    const data = localStorage.getItem(SAAS_PLANS_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(SAAS_PLANS_STORAGE_KEY, JSON.stringify(initialSubscriptionPlans));
      return initialSubscriptionPlans;
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return initialSubscriptionPlans;
    }
    // Normalize plans to ensure durationDays exists and remove unlimited staff and pos dashboard
    const normalized = parsed.map(p => {
      let days = p.durationDays;
      if (!days) {
        if (p.billingCycle === 'Quarterly' || (p.name && p.name.includes('Growth'))) days = 90;
        else if (p.billingCycle === 'Yearly' || (p.name && p.name.includes('Enterprise'))) days = 365;
        else days = 30;
      }
      return {
        ...p,
        durationDays: parseInt(days) || 30,
        features: Array.isArray(p.features)
          ? p.features.filter(f => {
              const str = String(f).toLowerCase();
              return !str.includes('unlimited staff') && !str.includes('order dashboard') && !str.includes('pos dashboard');
            })
          : []
      };
    });
    return normalized;
  } catch (err) {
    return initialSubscriptionPlans;
  }
};

export const saveSubscriptionPlans = (plans) => {
  try {
    localStorage.setItem(SAAS_PLANS_STORAGE_KEY, JSON.stringify(plans));
    window.dispatchEvent(new Event('saasPlansUpdated'));
    window.dispatchEvent(new Event('saasUpdated'));
  } catch (err) {
    console.error(err);
  }
};

export const createSubscriptionPlan = (planData) => {
  try {
    const plans = getSubscriptionPlans();
    const durationDays = parseInt(planData.durationDays) || 30;
    const newPlan = {
      id: 'plan_' + Date.now(),
      name: planData.name.trim(),
      price: parseFloat(planData.price) || 0,
      durationDays: durationDays,
      billingCycle: planData.billingCycle || `${durationDays} Days`,
      features: Array.isArray(planData.features) 
        ? planData.features 
        : (planData.features ? planData.features.split(',').map(f => f.trim()).filter(Boolean) : []),
      badgeColor: planData.badgeColor || 'bg-pink-50 text-pink-700 border-pink-300',
      badgeTag: planData.badgeTag || ''
    };
    const updated = [...plans, newPlan];
    saveSubscriptionPlans(updated);
    return newPlan;
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const updateSubscriptionPlan = (planId, updatedData) => {
  try {
    const plans = getSubscriptionPlans();
    const updated = plans.map(p => {
      if (p.id === planId) {
        const nextDuration = updatedData.durationDays !== undefined 
          ? (parseInt(updatedData.durationDays) || 30) 
          : (p.durationDays || 30);
        return {
          ...p,
          ...updatedData,
          price: updatedData.price !== undefined ? parseFloat(updatedData.price) || 0 : p.price,
          durationDays: nextDuration,
          billingCycle: updatedData.billingCycle || p.billingCycle || `${nextDuration} Days`,
          features: Array.isArray(updatedData.features) 
            ? updatedData.features 
            : (updatedData.features ? updatedData.features.split(',').map(f => f.trim()).filter(Boolean) : p.features),
        };
      }
      return p;
    });
    saveSubscriptionPlans(updated);
    return updated;
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const deleteSubscriptionPlan = (planId) => {
  try {
    const plans = getSubscriptionPlans();
    const updated = plans.filter(p => p.id !== planId);
    saveSubscriptionPlans(updated);
    return updated;
  } catch (err) {
    console.error(err);
    return [];
  }
};

/**
 * Checks whether a specific module is allowed by the tenant's active subscription plan
 * @param {Object} tenant - The tenant object (or defaults to getActiveTenant())
 * @param {string} moduleKey - The key of the module (e.g. 'pos', 'posDashboard', 'appointment', 'crm', etc.)
 * @returns {boolean}
 */
export const isPlanFeatureAllowed = (tenant, moduleKey) => {
  const currentTenant = tenant || getActiveTenant();
  if (!currentTenant) return true;

  let rawFeatures = null;

  // 1. Check if salon has custom feature overrides set by Super Admin
  if (Array.isArray(currentTenant.customFeatures) && currentTenant.customFeatures.length > 0) {
    rawFeatures = currentTenant.customFeatures;
  } else {
    // 2. Fall back to base subscription plan features
    const plans = getSubscriptionPlans();
    let plan = plans.find(p => p.id === currentTenant.planId) ||
               plans.find(p => p.name && currentTenant.planName && p.name.toLowerCase().trim() === currentTenant.planName.toLowerCase().trim());

    // Fallback for special named tenant (e.g. paradise)
    if (!plan && currentTenant.companyName?.toLowerCase().includes('paradise')) {
      plan = plans.find(p => p.name?.toLowerCase().includes('bumper'));
    }

    if (!plan || !Array.isArray(plan.features) || plan.features.length === 0) {
      return true; // No restrictive feature gating configured
    }
    rawFeatures = plan.features;
  }

  const features = rawFeatures.map(f => String(f).toLowerCase().trim());

  switch (moduleKey) {
    case 'pos':
      return features.some(f => 
        f.includes('pos') || 
        f.includes('quick sale') || 
        f.includes('billing')
      );
    case 'appointment':
      return features.some(f => 
        f.includes('appointment') || 
        f.includes('booking') || 
        f.includes('calendar')
      );
    case 'crm':
      return features.some(f => 
        f.includes('crm') || 
        f.includes('client') || 
        f.includes('customer') || 
        f.includes('guest')
      );
    case 'reports':
      return features.some(f => 
        f.includes('report') || 
        f.includes('analytic')
      );
    case 'inventory':
      return features.some(f => 
        f.includes('inventory') || 
        f.includes('stock') || 
        f.includes('purchase order')
      );
    case 'disposables':
      return features.some(f => 
        f.includes('disposable') || 
        f.includes('consumable') || 
        f.includes('wastage')
      );
    case 'trends':
      return features.some(f => 
        f.includes('trend') || 
        f.includes('insight')
      );
    case 'masterBo':
      return features.some(f => 
        f.includes('backoffice') || 
        f.includes('catalog') || 
        f.includes('master bo') || 
        f.includes('services & product')
      );
    case 'expenses':
      return features.some(f => 
        f.includes('expense')
      );
    case 'staffManagement':
      return features.some(f => 
        f.includes('staff') || 
        f.includes('payroll') || 
        f.includes('commission') || 
        f.includes('stylist')
      );
    case 'cashMgmt':
      return features.some(f => 
        f.includes('cash') || 
        f.includes('counter')
      );
    case 'settings':
    case 'cashierManagement':
    case 'permissions':
      // Core salon administration utilities always available for tenant admin
      return true;
    default:
      return true;
  }
};

export const updateTenantSubscription = (tenantId, subscriptionData) => {
  const tenants = getTenants();
  const plans = getSubscriptionPlans();
  const selectedPlan = plans.find(p => p.id === subscriptionData.planId) || plans[0];

  const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');

  const updated = tenants.map(t => {
    if (t.id === tenantId) {
      const oldPlanId = t.planId;
      const oldPlanName = t.planName;
      const oldNextBillingDate = t.nextBillingDate || t.createdDate || todayStr;
      const oldMrr = typeof t.mrr === 'number' ? t.mrr : 0;

      const newPlanId = selectedPlan.id;
      const newPlanName = selectedPlan.name;
      const newPrice = subscriptionData.customPrice !== undefined && subscriptionData.customPrice !== ''
        ? parseFloat(subscriptionData.customPrice)
        : selectedPlan.price;
      const newNextBillingDate = subscriptionData.nextBillingDate || t.nextBillingDate || todayStr;

      const isPlanChanged = oldPlanId !== newPlanId;
      const isExtended = oldNextBillingDate !== newNextBillingDate;

      let eventType = 'VALIDITY_EXTENSION';
      let eventTitle = 'Subscription Renewal & Extension';

      if (isPlanChanged && isExtended) {
        eventType = newPrice >= oldMrr ? 'PLAN_UPGRADE' : 'PLAN_DOWNGRADE';
        eventTitle = `Plan Change (${oldPlanName} ➔ ${newPlanName}) & Extension`;
      } else if (isPlanChanged) {
        eventType = newPrice >= oldMrr ? 'PLAN_UPGRADE' : 'PLAN_DOWNGRADE';
        eventTitle = `Plan Changed: ${oldPlanName} ➔ ${newPlanName}`;
      } else if (isExtended) {
        eventType = 'VALIDITY_EXTENSION';
        eventTitle = `Validity Extended to ${newNextBillingDate}`;
      } else {
        eventType = 'SUBSCRIPTION_UPDATE';
        eventTitle = `Subscription Details Updated`;
      }

      const effectiveStartDate = subscriptionData.startDate 
        ? (subscriptionData.startDate.includes('-') && subscriptionData.startDate.split('-')[0].length === 4 ? toDisplayDateString(subscriptionData.startDate) : subscriptionData.startDate)
        : (oldNextBillingDate || todayStr);

      const effectiveEndDate = subscriptionData.endDate
        ? (subscriptionData.endDate.includes('-') && subscriptionData.endDate.split('-')[0].length === 4 ? toDisplayDateString(subscriptionData.endDate) : subscriptionData.endDate)
        : (subscriptionData.nextBillingDate || t.nextBillingDate || todayStr);

      const calculatedDuration = calculateDaysBetween(
        toISODateString(effectiveStartDate),
        toISODateString(effectiveEndDate)
      );

      const newHistoryEntry = {
        id: 'hist_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        date: todayStr,
        type: eventType,
        title: eventTitle,
        planId: newPlanId,
        planName: newPlanName,
        previousPlanName: isPlanChanged ? oldPlanName : null,
        startDate: effectiveStartDate,
        endDate: effectiveEndDate,
        duration: subscriptionData.duration || calculatedDuration || (isExtended ? 'Extension' : '1 Month'),
        amountPaid: newPrice,
        paymentMode: subscriptionData.paymentMode || 'Online / Bank Transfer',
        status: 'Completed',
        notes: subscriptionData.notes?.trim() || (isPlanChanged 
          ? `Plan switched from ${oldPlanName} to ${newPlanName}`
          : `Validity extended till ${effectiveEndDate}`)
      };

      const existingHistory = Array.isArray(t.history) ? t.history : [];
      const todayIso = new Date().toISOString().split('T')[0];
      const endIso = toISODateString(effectiveEndDate);

      let newStatus = 'Active';
      if (subscriptionData.status === 'Inactive') {
        newStatus = 'Inactive';
      } else if (endIso && endIso <= todayIso) {
        newStatus = 'Inactive';
      } else {
        newStatus = 'Active';
      }

      const newMaxCashiers = subscriptionData.maxCashiers !== undefined && subscriptionData.maxCashiers !== ''
        ? Number(subscriptionData.maxCashiers)
        : (isPlanChanged ? (selectedPlan.maxCashiers || 2) : (t.maxCashiers || 2));

      return {
        ...t,
        planId: newPlanId,
        planName: newPlanName,
        maxCashiers: newMaxCashiers,
        mrr: newPrice,
        nextBillingDate: effectiveEndDate,
        status: newStatus,
        history: [newHistoryEntry, ...existingHistory]
      };
    }
    return t;
  });

  saveTenants(updated);

  const active = getActiveTenant();
  if (active && active.id === tenantId) {
    const updatedTenant = updated.find(t => t.id === tenantId);
    if (updatedTenant) setActiveTenant(updatedTenant);
  }

  return updated.find(t => t.id === tenantId);
};

export const calculateTenantLTV = (tenant) => {
  if (!tenant) return 0;
  if (Array.isArray(tenant.history) && tenant.history.length > 0) {
    return tenant.history.reduce((sum, h) => sum + (parseFloat(h.amountPaid) || 0), 0);
  }
  return typeof tenant.mrr === 'number' ? tenant.mrr : 0;
};

export const addTenantHistoryRecord = (tenantId, recordData) => {
  const tenants = getTenants();
  let updatedTenant = null;
  const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');

  const updated = tenants.map(t => {
    if (t.id === tenantId) {
      const newEntry = {
        id: 'hist_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        date: recordData.date || todayStr,
        type: recordData.type || 'RENEWAL',
        title: recordData.title || 'Subscription Payment / Renewal',
        planId: recordData.planId || t.planId,
        planName: recordData.planName || t.planName,
        previousPlanName: recordData.previousPlanName || null,
        startDate: recordData.startDate || t.createdDate || todayStr,
        endDate: recordData.endDate || t.nextBillingDate || todayStr,
        duration: recordData.duration || 'Custom',
        amountPaid: parseFloat(recordData.amountPaid) || 0,
        paymentMode: recordData.paymentMode || 'Online / Bank Transfer',
        status: 'Completed',
        notes: recordData.notes || 'Recorded by Super Admin'
      };

      const updatedHistory = [newEntry, ...(t.history || [])];
      const recordEndIso = toISODateString(recordData.endDate || t.nextBillingDate);
      const todayIso = new Date().toISOString().split('T')[0];
      const newStatus = recordEndIso > todayIso ? 'Active' : 'Inactive';

      updatedTenant = {
        ...t,
        nextBillingDate: recordData.endDate || t.nextBillingDate,
        status: newStatus,
        history: updatedHistory
      };
      return updatedTenant;
    }
    return t;
  });

  saveTenants(updated);
  return updatedTenant;
};

// ==========================================
// CASHIER PERMISSION & ROLE ACCESS HELPERS
// ==========================================
export const DEFAULT_CASHIER_PERMISSIONS = {
  pos: true,               // Quick Sale POS Billing
  appointment: true,       // Daily Calendar & Appointment Schedule
  crm: true,               // CRM Guests & Loyalty Management
  masterBo: false,         // Backoffice Catalog Master
  masterBoServices: true,  // Sub-feature: Services
  masterBoProducts: true,  // Sub-feature: Retail Products
  masterBoPackages: false, // Sub-feature: Packages
  masterBoMemberships: false,// Sub-feature: Memberships
  disposables: false,      // Disposables & Wastage
  inventory: false,        // Inventory Purchase Orders & Reconciliation
  expenses: false,         // Operational Expenses & Spend
  cashMgmt: true,          // Cash Management & Counter Float
  reports: false,          // Reports & Sales Performance
  trends: false,           // Trends & Analytics
  staffManagement: false,  // Staff Management & Rosters
  settings: false,         // Salon Business Hours & Store Status
};

export const getCashierPermissions = (tenantId) => {
  const tenants = getTenants();
  const targetTenant = tenantId
    ? tenants.find(t => t.id === tenantId)
    : getActiveTenant();
  
  if (!targetTenant) return { ...DEFAULT_CASHIER_PERMISSIONS };
  return { ...DEFAULT_CASHIER_PERMISSIONS, ...(targetTenant.cashierPermissions || {}) };
};

export const saveCashierPermissions = (newPermissions, tenantId) => {
  const tenants = getTenants();
  const active = getActiveTenant();
  const targetId = tenantId || active?.id;
  if (!targetId) return;

  const merged = { ...DEFAULT_CASHIER_PERMISSIONS, ...newPermissions };

  const updated = tenants.map(t => {
    if (t.id === targetId) {
      return { ...t, cashierPermissions: merged };
    }
    return t;
  });

  saveTenants(updated);

  if (active && active.id === targetId) {
    const updatedActive = updated.find(t => t.id === targetId);
    if (updatedActive) setActiveTenant(updatedActive);
  }

  window.dispatchEvent(new Event('permissionsUpdated'));
  window.dispatchEvent(new Event('tenantChanged'));
};
