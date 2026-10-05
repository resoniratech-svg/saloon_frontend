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
  const expStr = tenant?.endDate || tenant?.nextBillingDate || tenant?.subscriptionExpiresAt;
  if (!expStr) return false;
  try {
    const expiryIso = toISODateString(expStr);
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

export const initialSubscriptionPlans = [];

export const initialTenants = [];

export const superAdminUser = {
  id: 'usr_superadmin',
  username: 'superadmin',
  name: 'Platform Super Admin',
  role: 'SUPER_ADMIN',
  email: 'saloonqubexe@gmail.com',
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
// TENANTS GET & SAVE (PURE IN-MEMORY & DATABASE)
// ==========================================
let inMemoryTenants = (() => {
  try {
    const raw = sessionStorage.getItem('respark_cached_tenants');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
})();

export const purgeLocalTenants = () => {
  try {
    localStorage.removeItem(SAAS_STORAGE_KEY);
  } catch (e) {}
};

purgeLocalTenants();

export const getTenants = () => {
  return [...inMemoryTenants];
};

export const saveTenants = (tenants) => {
  inMemoryTenants = Array.isArray(tenants) ? tenants : [];
  try {
    if (inMemoryTenants.length > 0) {
      sessionStorage.setItem('respark_cached_tenants', JSON.stringify(inMemoryTenants));
    }
  } catch (e) {}
  window.dispatchEvent(new Event('saasUpdated'));
};

// ==========================================
// CURRENT SESSION: USER, TENANT, BRANCH
// ==========================================
export const getCurrentUser = () => {
  try {
    const data = localStorage.getItem(SAAS_USER_KEY);
    const activeTenant = getActiveTenant();
    if (!data) {
      const defaultUser = {
        id: 'usr_admin',
        username: 'admin',
        name: `${activeTenant?.companyName || activeTenant?.name || 'Company'} Admin`,
        role: 'COMPANY_ADMIN',
        companyId: activeTenant?.id || '3846baad-5322-49af-b92f-22644ec559a9',
        companyName: activeTenant?.companyName || activeTenant?.name || 'Salon ERP',
        branchId: activeTenant?.branches?.[0]?.id || 'b_1',
        branchName: activeTenant?.branches?.[0]?.name || 'Main Counter / Branch'
      };
      localStorage.setItem(SAAS_USER_KEY, JSON.stringify(defaultUser));
      return defaultUser;
    }
    const parsed = JSON.parse(data);

    if (parsed && (parsed.companyId === 'tenant_glamour' || parsed.companyId === 'tenant_naturals' || parsed.companyId === 'tenant_enrich')) {
      parsed.companyId = activeTenant?.id || '3846baad-5322-49af-b92f-22644ec559a9';
      parsed.companyName = activeTenant?.companyName || activeTenant?.name || 'Salon ERP';
      parsed.name = `${activeTenant?.companyName || activeTenant?.name || 'Company'} Admin`;
      localStorage.setItem(SAAS_USER_KEY, JSON.stringify(parsed));
    }

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

const DB_DEFAULT_TENANT = {
  id: '3846baad-5322-49af-b92f-22644ec559a9',
  companyName: 'prakash',
  brandName: 'prakash',
  branches: [{ id: 'b_1', name: 'knr', city: 'vmd', isPrimary: true }]
};

export const syncActiveTenantBranding = async (tenantId) => {
  try {
    const id = tenantId || getActiveTenantId();
    if (!id || id === 'tenant_glamour' || id === 'tenant_naturals' || id === 'tenant_enrich') return null;
    const res = await fetch(`/api/auth/tenant/${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.data) {
        const t = data.data;
        const current = getActiveTenant() || {};
        const updated = {
          ...current,
          id: t.id,
          companyName: t.name || current.companyName,
          brandName: t.code?.toUpperCase() || t.name?.toUpperCase() || current.brandName,
          logoUrl: t.logoUrl || current.logoUrl || null,
          city: t.city || current.city,
          primaryBranchName: t.primaryBranchName || current.primaryBranchName,
          branches: current.branches && current.branches.length > 0 && current.branches[0].name !== 'Main Counter / Branch'
            ? current.branches
            : [{ id: 'b_1', name: t.primaryBranchName || 'Main Counter / Branch', city: t.city, isPrimary: true }]
        };
        localStorage.setItem(SAAS_ACTIVE_TENANT_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event('tenantChanged'));
        window.dispatchEvent(new Event('saasUpdated'));
        return updated;
      }
    }
  } catch (err) {
    console.error('Failed to sync tenant branding', err);
  }
  return null;
};

export const getActiveTenant = () => {
  try {
    const data = localStorage.getItem(SAAS_ACTIVE_TENANT_KEY);
    const tenants = getTenants();
    if (!data) {
      const defaultTenant = tenants[0] || DB_DEFAULT_TENANT;
      if (defaultTenant) {
        localStorage.setItem(SAAS_ACTIVE_TENANT_KEY, JSON.stringify(defaultTenant));
      }
      return defaultTenant;
    }
    const parsed = JSON.parse(data);
    // Purge legacy mock tenant if found in active tenant slot
    if (parsed && (parsed.id === 'tenant_glamour' || parsed.id === 'tenant_naturals' || parsed.id === 'tenant_enrich')) {
      const realMatch = tenants.find(t => t.id === parsed.id);
      if (!realMatch) {
        localStorage.setItem(SAAS_ACTIVE_TENANT_KEY, JSON.stringify(tenants[0] || DB_DEFAULT_TENANT));
        return tenants[0] || DB_DEFAULT_TENANT;
      }
    }
    // Find latest version of this tenant in storage
    const match = tenants.find(t => t.id === parsed.id);
    return match || parsed || DB_DEFAULT_TENANT;
  } catch (err) {
    return DB_DEFAULT_TENANT;
  }
};

export const getActiveTenantId = () => {
  try {
    const tenant = getActiveTenant();
    return tenant?.id || '3846baad-5322-49af-b92f-22644ec559a9';
  } catch (err) {
    return '3846baad-5322-49af-b92f-22644ec559a9';
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
  const tenantId = formData.id || ('tenant_' + Date.now());
  const branchId = 'b_' + Date.now();

  const allPlans = getSubscriptionPlans();
  const plan = allPlans.find(p => p.id === formData.planId) 
    || allPlans.find(p => p.name?.toLowerCase() === formData.planName?.toLowerCase())
    || allPlans[0]
    || { id: 'standard_plan', name: formData.planName || 'Standard Plan', maxCashiers: 2, price: 0 };

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
      if (t.status === 'Suspended' || t.isSuspended) {
        newStatus = isTenantPlanExpired(t) ? 'Inactive' : 'Active';
        return { ...t, status: newStatus, isSuspended: false };
      }
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
let inMemoryPlans = (() => {
  try {
    const raw = sessionStorage.getItem('respark_cached_plans');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
})();

export const purgeLocalPlans = () => {
  try {
    localStorage.removeItem(SAAS_PLANS_STORAGE_KEY);
  } catch (e) {}
};

purgeLocalPlans();

export const getSubscriptionPlans = () => {
  return [...inMemoryPlans];
};

export const saveSubscriptionPlans = (plans) => {
  inMemoryPlans = Array.isArray(plans) ? plans : [];
  try {
    if (inMemoryPlans.length > 0) {
      sessionStorage.setItem('respark_cached_plans', JSON.stringify(inMemoryPlans));
    }
  } catch (e) {}
  window.dispatchEvent(new Event('saasPlansUpdated'));
  window.dispatchEvent(new Event('saasUpdated'));
};

export const createSubscriptionPlan = (planData) => {
  try {
    const plans = getSubscriptionPlans();
    const durationDays = parseInt(planData.durationDays) || 30;
    const newPlan = {
      id: planData.id || ('plan_' + Date.now()),
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
    case 'posDashboard':
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
