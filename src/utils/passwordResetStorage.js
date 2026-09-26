import { getTenants, updateTenant } from './saasStorage';
import { getCashiersForTenant } from './cashierStorage';

const RESET_STORAGE_KEY = 'respark_password_reset_requests';

// Password Reset Requests Queue (starts clean, populated only by real user requests)
export const getResetRequests = () => {
  try {
    const data = localStorage.getItem(RESET_STORAGE_KEY);
    let parsed = [];
    if (data) {
      const raw = JSON.parse(data);
      if (Array.isArray(raw)) {
        const tenants = getTenants();
        // Only keep legitimate requests belonging to currently registered salons, purging any mock/demo entries
        parsed = raw.filter(r => 
          !r.id.startsWith('rst_demo_') && 
          tenants.some(t => t.id === r.tenantId)
        );
        if (parsed.length !== raw.length) {
          localStorage.setItem(RESET_STORAGE_KEY, JSON.stringify(parsed));
        }
      }
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load reset requests', err);
    return [];
  }
};

export const saveResetRequests = (requests) => {
  try {
    localStorage.setItem(RESET_STORAGE_KEY, JSON.stringify(requests));
    window.dispatchEvent(new Event('passwordResetsUpdated'));
  } catch (err) {
    console.error('Failed to save reset requests', err);
  }
};

// Find account and submit a password reset request
export const submitResetRequest = (rawIdentifier) => {
  const cleanId = (rawIdentifier || '').trim();
  if (!cleanId) {
    return { success: false, message: 'Please enter your registered Email, Mobile, or Username.' };
  }

  const cleanDigits = cleanId.replace(/\D/g, '');
  const cleanLower = cleanId.toLowerCase();

  // 1. Search Company Admins in saasStorage (strictly matching Admin Email or Contact Mobile)
  const tenants = getTenants();
  const matchedTenant = tenants.find(t => {
    const emailMatch = t.email && t.email.toLowerCase() === cleanLower;
    const phoneMatch = t.mobile && cleanDigits.length >= 7 && t.mobile.replace(/\D/g, '').endsWith(cleanDigits.slice(-10));
    return emailMatch || phoneMatch;
  });

  if (matchedTenant) {
    const requests = getResetRequests();
    // Check if there is already an active pending or approved request
    const existing = requests.find(r => r.userId === matchedTenant.id && (r.status === 'PENDING' || r.status === 'APPROVED'));
    if (existing) {
      if (existing.status === 'APPROVED') {
        return {
          success: true,
          role: 'COMPANY_ADMIN',
          tenant: matchedTenant,
          isAlreadyApproved: true,
          tempPassword: existing.tempPassword,
          request: existing,
          message: `Your password reset request was already APPROVED by Super Admin! Your temporary password is ready. Contact platform super admin to receive it, or use it now.`
        };
      }
      return {
        success: true,
        isAlreadyPending: true,
        role: 'COMPANY_ADMIN',
        tenant: matchedTenant,
        request: existing,
        message: `You have already requested your reset password! Your request for "${matchedTenant.companyName}" submitted on ${existing.createdAt || 'earlier'} is currently on hold pending Platform Super Admin review. A second request cannot be sent.`
      };
    }

    const newRequest = {
      id: 'rst_adm_' + Date.now(),
      role: 'COMPANY_ADMIN',
      userId: matchedTenant.id,
      userName: matchedTenant.ownerName || matchedTenant.companyName,
      accountIdentifier: cleanId,
      email: matchedTenant.email,
      phone: matchedTenant.mobile,
      tenantId: matchedTenant.id,
      tenantName: matchedTenant.companyName,
      status: 'PENDING',
      tempPassword: null,
      createdAt: new Date().toLocaleString('en-GB'),
      approvedAt: null,
      completedAt: null,
      approvedBy: null
    };

    saveResetRequests([newRequest, ...requests]);
    return {
      success: true,
      role: 'COMPANY_ADMIN',
      tenant: matchedTenant,
      request: newRequest,
      message: `Password reset request submitted for "${matchedTenant.companyName}". Please notify the Platform Super Admin to approve your request and obtain your temporary password.`
    };
  }

  // 2. Search Cashiers in cashierStorage across all salons
  for (const t of tenants) {
    const cashiers = getCashiersForTenant(t.id);
    const matchedCashier = cashiers.find(c => {
      const emailMatch = c.email && c.email.toLowerCase() === cleanLower;
      const phoneMatch = c.phone && cleanDigits.length >= 7 && c.phone.replace(/\D/g, '').endsWith(cleanDigits.slice(-10));
      const userMatch = c.username && c.username.toLowerCase() === cleanLower;
      return emailMatch || phoneMatch || userMatch;
    });

    if (matchedCashier) {
      const requests = getResetRequests();
      const existing = requests.find(r => r.userId === matchedCashier.id && (r.status === 'PENDING' || r.status === 'APPROVED'));
      if (existing) {
        if (existing.status === 'APPROVED') {
          return {
            success: true,
            role: 'CASHIER',
            tenant: t,
            cashier: matchedCashier,
            isAlreadyApproved: true,
            tempPassword: existing.tempPassword,
            request: existing,
            message: `Your password reset request was already APPROVED by ${t.companyName} Admin! Please ask your salon admin for your temporary password.`
          };
        }
        return {
          success: true,
          isAlreadyPending: true,
          role: 'CASHIER',
          tenant: t,
          cashier: matchedCashier,
          request: existing,
          message: `You have already requested your reset password! Your request for "${matchedCashier.name}" submitted on ${existing.createdAt || 'earlier'} is currently on hold pending approval by your Salon Admin (${t.companyName}). A second request cannot be sent.`
        };
      }

      const newRequest = {
        id: 'rst_csh_' + Date.now(),
        role: 'CASHIER',
        userId: matchedCashier.id,
        userName: matchedCashier.name,
        accountIdentifier: cleanId,
        email: matchedCashier.email,
        phone: matchedCashier.phone,
        tenantId: t.id,
        tenantName: t.companyName,
        status: 'PENDING',
        tempPassword: null,
        createdAt: new Date().toLocaleString('en-GB'),
        approvedAt: null,
        completedAt: null,
        approvedBy: null
      };

      saveResetRequests([newRequest, ...requests]);
      return {
        success: true,
        role: 'CASHIER',
        tenant: t,
        cashier: matchedCashier,
        message: `Password reset request submitted for Cashier "${matchedCashier.name}". Please ask your Salon Admin at ${t.companyName} to approve your request and issue your temporary password.`
      };
    }
  }

  return {
    success: false,
    message: 'No registered company admin or cashier found matching this email, phone, or username. Please check and try again.'
  };
};

// Real-time helper to detect whether an identifier belongs to Company Admin or Cashier
export const detectAccountRole = (rawIdentifier) => {
  const cleanId = (rawIdentifier || '').trim();
  if (!cleanId) return null;

  const cleanDigits = cleanId.replace(/\D/g, '');
  const cleanLower = cleanId.toLowerCase();
  const allRequests = getResetRequests();

  // 1. Search Company Admins in saasStorage (strictly matching Admin Email or Contact Mobile)
  const tenants = getTenants();
  const matchedTenant = tenants.find(t => {
    const emailMatch = t.email && t.email.toLowerCase() === cleanLower;
    const phoneMatch = t.mobile && cleanDigits.length >= 7 && t.mobile.replace(/\D/g, '').endsWith(cleanDigits.slice(-10));
    return emailMatch || phoneMatch;
  });

  if (matchedTenant) {
    const userReqs = allRequests.filter(r => r.userId === matchedTenant.id);
    const latestReq = userReqs[0];
    const isLatestRejected = latestReq && latestReq.status === 'REJECTED';

    return {
      role: 'COMPANY_ADMIN',
      tenant: matchedTenant,
      name: matchedTenant.ownerName || matchedTenant.companyName,
      companyName: matchedTenant.companyName,
      recentRejectedRequest: isLatestRejected ? latestReq : null
    };
  }

  // 2. Search Cashiers in cashierStorage across all salons
  for (const tenant of tenants) {
    const cashiers = getCashiersForTenant(tenant.id);
    const matchedCashier = cashiers.find(c => {
      const emailMatch = c.email && c.email.toLowerCase() === cleanLower;
      const phoneMatch = c.phone && cleanDigits.length >= 7 && c.phone.replace(/\D/g, '').endsWith(cleanDigits.slice(-10));
      const userMatch = c.username && c.username.toLowerCase() === cleanLower;
      return emailMatch || phoneMatch || userMatch;
    });

    if (matchedCashier) {
      const userReqs = allRequests.filter(r => r.userId === matchedCashier.id);
      const latestReq = userReqs[0];
      const isLatestRejected = latestReq && latestReq.status === 'REJECTED';

      return {
        role: 'CASHIER',
        tenant,
        cashier: matchedCashier,
        name: matchedCashier.name,
        companyName: tenant.companyName,
        recentRejectedRequest: isLatestRejected ? latestReq : null
      };
    }
  }

  return null;
};

// Retrieve Company Admin requests for Super Admin
export const getAdminResetRequests = () => {
  const requests = getResetRequests();
  return requests.filter(r => r.role === 'COMPANY_ADMIN');
};

// Retrieve Cashier requests for a specific Salon Company Admin
export const getCashierResetRequests = (tenantId) => {
  const requests = getResetRequests();
  return requests.filter(r => r.role === 'CASHIER' && r.tenantId === tenantId);
};

// Super Admin or Company Admin approves request & generates temporary password
export const approveResetRequest = (requestId, approverName = 'Super Admin') => {
  const requests = getResetRequests();
  const target = requests.find(r => r.id === requestId);
  if (!target) return null;

  // Generate secure readable temporary password
  const randomSixDigits = Math.floor(100000 + Math.random() * 900000);
  const tempPass = target.role === 'COMPANY_ADMIN' 
    ? `TMP-${randomSixDigits}` 
    : `CASH-${randomSixDigits}`;

  const updatedRequests = requests.map(r => {
    if (r.id === requestId) {
      return {
        ...r,
        status: 'APPROVED',
        tempPassword: tempPass,
        approvedAt: new Date().toLocaleString('en-GB'),
        approvedBy: approverName
      };
    }
    return r;
  });

  saveResetRequests(updatedRequests);
  const updated = updatedRequests.find(r => r.id === requestId);
  return updated;
};

// Reject a reset request
export const rejectResetRequest = (requestId, approverName = 'Admin') => {
  const requests = getResetRequests();
  const updatedRequests = requests.map(r => {
    if (r.id === requestId) {
      return {
        ...r,
        status: 'REJECTED',
        completedAt: new Date().toLocaleString('en-GB'),
        approvedBy: approverName
      };
    }
    return r;
  });
  saveResetRequests(updatedRequests);
  return true;
};

// Check if login credentials match an approved temporary password
export const checkActiveTemporaryPassword = (cleanUser, cleanPass) => {
  if (!cleanUser || !cleanPass) return null;
  const requests = getResetRequests();
  const trimmedPass = cleanPass.trim();
  const trimmedUser = cleanUser.trim().toLowerCase();
  const userDigits = cleanUser.replace(/\D/g, '');

  const match = requests.find(r => {
    if (r.status !== 'APPROVED') return false;
    if (r.tempPassword !== trimmedPass) return false;

    // Check if cleanUser matches account identifier, email, phone, or username
    const emailMatch = r.email && r.email.toLowerCase() === trimmedUser;
    const phoneMatch = r.phone && userDigits.length >= 7 && r.phone.replace(/\D/g, '').endsWith(userDigits.slice(-10));
    const idMatch = r.accountIdentifier && r.accountIdentifier.toLowerCase() === trimmedUser;

    return emailMatch || phoneMatch || idMatch;
  });

  return match || null;
};

// Complete reset: Update permanent password in appropriate storage and close ticket
export const completePasswordReset = (requestId, newPassword) => {
  const requests = getResetRequests();
  const target = requests.find(r => r.id === requestId);
  if (!target) return { success: false, message: 'Reset request not found' };

  if (target.role === 'COMPANY_ADMIN') {
    // Update company admin password in saasStorage
    updateTenant(target.tenantId, { adminPassword: newPassword });
  } else if (target.role === 'CASHIER') {
    // Update cashier password in cashierStorage
    try {
      const key = `respark_cashiers_${target.tenantId}`;
      const data = localStorage.getItem(key);
      if (data) {
        const cashiers = JSON.parse(data);
        const updated = cashiers.map(c => {
          if (c.id === target.userId) {
            return { ...c, password: newPassword };
          }
          return c;
        });
        localStorage.setItem(key, JSON.stringify(updated));
        window.dispatchEvent(new Event('cashiersUpdated'));
      }
    } catch (e) {
      console.error('Failed to update cashier password', e);
    }
  }

  // Mark ticket completed
  const updatedRequests = requests.map(r => {
    if (r.id === requestId) {
      return {
        ...r,
        status: 'COMPLETED',
        completedAt: new Date().toLocaleString('en-GB')
      };
    }
    return r;
  });

  saveResetRequests(updatedRequests);
  return { success: true, target };
};
