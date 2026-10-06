const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'qubexe_jwt_token';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('respark_jwt_token');
  } catch (e) {
    return null;
  }
};

export const setToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem('respark_jwt_token', token);
  } catch (e) {
    console.error('Error saving JWT token', e);
  }
};

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('respark_jwt_token');
  } catch (e) {
    console.error('Error clearing JWT token', e);
  }
};

export const purgeLegacyMockAuthData = () => {
  try {
    const preserveKeys = new Set([
      TOKEN_KEY,
      'qubexe_jwt_token',
      'respark_token',
      'respark_jwt_token',
      'respark_saas_user',
      'respark_saas_current_user',
      'respark_saas_active_tenant',
      'respark_saas_active_branch',
      'respark_saas_impersonation'
    ]);

    // Explicitly delete outdated mock cache keys
    localStorage.removeItem('respark_saas_tenants');
    localStorage.removeItem('respark_saas_plans');
    localStorage.removeItem('respark_master_staff');
    localStorage.removeItem('respark_staff_work_experience');
    localStorage.removeItem('respark_password_reset_requests');

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (
        key &&
        !preserveKeys.has(key) &&
        !key.startsWith('respark_cashiers_') &&
        !key.startsWith('respark_saas_')
      ) {
        localStorage.removeItem(key);
      }
    }

    // Clean mock dummy active tenant from respark_saas_active_tenant
    const rawActive = localStorage.getItem('respark_saas_active_tenant');
    if (rawActive) {
      try {
        const parsedActive = JSON.parse(rawActive);
        if (parsedActive?.id && (parsedActive.id === 'tenant_glamour' || parsedActive.id === 'tenant_naturals' || parsedActive.id === 'tenant_enrich')) {
          localStorage.setItem('respark_saas_active_tenant', JSON.stringify({
            id: '3846baad-5322-49af-b92f-22644ec559a9',
            companyName: 'knr, vmd',
            brandName: 'knr, vmd',
            branches: [{ id: 'b_1', name: 'Main Counter / Branch', isPrimary: true }]
          }));
        }
      } catch (e) {}
    }
  } catch (err) {
    console.error('Failed to purge legacy mock login data from localStorage', err);
  }
};

export const resolveCurrentTenantId = () => {
  try {
    const rawTenant = localStorage.getItem('respark_saas_active_tenant');
    if (rawTenant) {
      const parsed = JSON.parse(rawTenant);
      if (parsed?.id && !['tenant_glamour', 'tenant_naturals', 'tenant_enrich'].includes(parsed.id)) {
        return parsed.id;
      }
    }
    const rawUser = localStorage.getItem('respark_saas_current_user') || localStorage.getItem('respark_saas_user');
    if (rawUser) {
      const parsedUser = JSON.parse(rawUser);
      if (parsedUser?.tenantId && !['tenant_glamour', 'tenant_naturals', 'tenant_enrich'].includes(parsedUser.tenantId)) {
        return parsedUser.tenantId;
      }
      if (parsedUser?.companyId && !['tenant_glamour', 'tenant_naturals', 'tenant_enrich'].includes(parsedUser.companyId)) {
        return parsedUser.companyId;
      }
    }
  } catch (e) {}
  return '3846baad-5322-49af-b92f-22644ec559a9';
};

// Immediately execute scrubber upon module load
purgeLegacyMockAuthData();

export const apiFetch = async (endpoint, options = {}, isRetry = false) => {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const token = getToken();
  const activeTenantId = resolveCurrentTenantId();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(url, config);
    let data;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = { message: await res.text() };
    }

    if (
      res.status === 401 &&
      !endpoint.includes('/auth/login') &&
      !endpoint.includes('/auth/forgot-password') &&
      !endpoint.includes('/auth/reset-password')
    ) {
      clearToken();
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('respark_saas_user');
        window.location.href = '/login?expired=true';
      }
    }

    if (!res.ok) {
      const errorMsg = data?.message || data?.error || `HTTP error ${res.status}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// ==========================================
// AUTHENTICATION API MODULE
// ==========================================
export const authApi = {
  login: async (username, password) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: username.trim(),
        password: password.trim(),
      }),
    });
    const token = res?.data?.token || res?.token;
    if (token) {
      setToken(token);
    }
    return res;
  },

  getCurrentUser: async () => {
    return apiFetch('/auth/me');
  },

  getTenantBranding: async (tenantId) => {
    const id = tenantId || resolveCurrentTenantId();
    return apiFetch(`/auth/tenant/${id}`);
  },

  forgotPassword: async (identifier) => {
    return apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({
        identifier: identifier.trim(),
      }),
    });
  },

  resetPassword: async (token, newPassword) => {
    return apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token,
        newPassword,
      }),
    });
  },

  changePassword: async (currentPassword, newPassword, customToken = null) => {
    const token = customToken || getToken();
    return apiFetch('/auth/change-password', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });
  },

  requestCashierPasswordReset: async () => {
    return apiFetch('/auth/cashier/forgot-password', {
      method: 'POST',
    });
  },

  logout: () => {
    clearToken();
    try {
      localStorage.removeItem('respark_saas_current_user');
      window.dispatchEvent(new Event('saasUserChanged'));
    } catch (e) {}
  },
};

// ==========================================
// CASHIERS MANAGEMENT API MODULE (ADMIN)
// ==========================================
export const cashierApi = {
  getCashiers: async (params = {}) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    const queryObj = {
      ...(activeTenantId ? { tenantId: activeTenantId } : {}),
      ...params,
    };
    const query = new URLSearchParams(queryObj).toString();
    return apiFetch(`/cashiers${query ? `?${query}` : ''}`);
  },

  getCashierById: async (id) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/cashiers/${id}${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`);
  },

  createCashier: async (data) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/cashiers${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  updateCashier: async (id, data) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/cashiers/${id}${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  updateCashierStatus: async (id, status) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/cashiers/${id}/status${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  updateCashierModules: async (id, enabledModules) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/cashiers/${id}/modules${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabledModules }),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  approvePasswordReset: async (id) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/cashiers/${id}/approve-reset${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'POST',
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  deleteCashier: async (id) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/cashiers/${id}${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'DELETE',
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  getCompanyPermissions: async (tenantId) => {
    let activeTenantId = tenantId;
    if (!activeTenantId) {
      try {
        const rawTenant = localStorage.getItem('respark_saas_active_tenant');
        if (rawTenant) {
          const parsed = JSON.parse(rawTenant);
          activeTenantId = parsed?.id || null;
        }
      } catch (e) {}
    }
    return apiFetch(`/cashiers/permissions${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  updateCompanyPermissions: async (permissions, tenantId) => {
    let activeTenantId = tenantId;
    if (!activeTenantId) {
      try {
        const rawTenant = localStorage.getItem('respark_saas_active_tenant');
        if (rawTenant) {
          const parsed = JSON.parse(rawTenant);
          activeTenantId = parsed?.id || null;
        }
      } catch (e) {}
    }
    return apiFetch(`/cashiers/permissions${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },
};

// ==========================================
// CASHIER PERMISSIONS & ROLE ACCESS API
// ==========================================
export const permissionApi = {
  getPermissions: (params = {}) => {
    const tenantId = typeof params === 'string' ? params : (params?.tenantId || null);
    return cashierApi.getCompanyPermissions(tenantId);
  },
  updatePermissions: (permissions, tenantId) => {
    return cashierApi.updateCompanyPermissions(permissions, tenantId);
  },
};

// ==========================================
// GUESTS & CUSTOMERS API MODULE (CRM / POS)
// ==========================================
export const guestApi = {
  getGuests: async (params = {}) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    const queryObj = {
      ...(activeTenantId ? { tenantId: activeTenantId } : {}),
      ...params,
    };
    const query = new URLSearchParams(queryObj).toString();
    return apiFetch(`/guests${query ? `?${query}` : ''}`, {
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  getGuestById: async (id) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/guests/${id}${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  getGuestByMobile: async (mobile) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/guests/lookup/${encodeURIComponent(mobile)}${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  createGuest: async (data) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/guests${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  updateGuest: async (id, data) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/guests/${id}${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  deleteGuest: async (id) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/guests/${id}${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'DELETE',
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  addPackage: async (guestId, data) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/guests/${guestId}/packages${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  redeemPackageSession: async (guestId, packageId, sessions = 1) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/guests/${guestId}/packages/${packageId}/redeem${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'POST',
      body: JSON.stringify({ sessions }),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },
};

export const customerApi = guestApi;

// ==========================================
// SERVICE CATEGORIES API MODULE
// ==========================================
export const serviceCategoryApi = {
  getCategories: async (params = {}) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    const queryObj = {
      ...(activeTenantId ? { tenantId: activeTenantId } : {}),
      ...params,
    };
    const query = new URLSearchParams(queryObj).toString();
    return apiFetch(`/service-categories${query ? `?${query}` : ''}`);
  },

  createCategory: async (data) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/service-categories${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  updateCategory: async (id, data) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/service-categories/${id}${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  deleteCategory: async (id) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/service-categories/${id}${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'DELETE',
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },
};

// ==========================================
// SERVICES API MODULE
// ==========================================
export const serviceApi = {
  getServices: async (params = {}) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    const queryObj = {
      ...(activeTenantId ? { tenantId: activeTenantId } : {}),
      ...params,
    };
    const query = new URLSearchParams(queryObj).toString();
    return apiFetch(`/services${query ? `?${query}` : ''}`);
  },

  getServiceById: async (id) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/services/${id}${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`);
  },

  createService: async (data) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/services${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  updateService: async (id, data) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/services/${id}${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  updateServiceStatus: async (id, isActive) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/services/${id}/status${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  deleteService: async (id) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/services/${id}${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'DELETE',
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },
};

// ==========================================
// PRODUCT CATEGORIES API MODULE
// ==========================================
export const productCategoryApi = {
  getCategories: async (params = {}) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    const queryObj = {
      ...(activeTenantId ? { tenantId: activeTenantId } : {}),
      ...params,
    };
    const query = new URLSearchParams(queryObj).toString();
    return apiFetch(`/product-categories${query ? `?${query}` : ''}`);
  },

  createCategory: async (data) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/product-categories${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  updateCategory: async (id, data) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/product-categories/${id}${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  deleteCategory: async (id) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/product-categories/${id}${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'DELETE',
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },
};

// ==========================================
// PRODUCTS API MODULE
// ==========================================
export const productApi = {
  getProducts: async (params = {}) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    const queryObj = {
      ...(activeTenantId ? { tenantId: activeTenantId } : {}),
      ...params,
    };
    const query = new URLSearchParams(queryObj).toString();
    return apiFetch(`/products${query ? `?${query}` : ''}`);
  },

  getProductById: async (id) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/products/${id}${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`);
  },

  createProduct: async (data) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/products${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  updateProduct: async (id, data) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/products/${id}${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  updateProductStatus: async (id, isActive) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/products/${id}/status${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  deleteProduct: async (id) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/products/${id}${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'DELETE',
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },
};

// ==========================================
// PACKAGES API MODULE
// ==========================================
export const packageApi = {
  getPackages: async (params = {}) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    const queryObj = {
      ...(activeTenantId ? { tenantId: activeTenantId } : {}),
      ...params,
    };
    const query = new URLSearchParams(queryObj).toString();
    return apiFetch(`/packages${query ? `?${query}` : ''}`);
  },

  getPackageById: async (id) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/packages/${id}${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`);
  },

  createPackage: async (data) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/packages${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  updatePackage: async (id, data) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/packages/${id}${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  updatePackageStatus: async (id, isActive) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/packages/${id}/status${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  deletePackage: async (id) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/packages/${id}${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'DELETE',
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },
};

// ==========================================
// DISPOSABLES MODULE API
// ==========================================
export const disposableApi = {
  getDisposables: async (params = {}) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    const queryParams = new URLSearchParams(params);
    if (activeTenantId && !queryParams.has('tenantId')) {
      queryParams.set('tenantId', activeTenantId);
    }
    const query = queryParams.toString();
    return apiFetch(`/disposables${query ? `?${query}` : ''}`, {
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  getDisposableById: async (id) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/disposables/${id}${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  createDisposable: async (data) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/disposables${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  updateDisposable: async (id, data) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/disposables/${id}${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  updateDisposableStatus: async (id, isActive) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/disposables/${id}/status${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  deleteDisposable: async (id) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    return apiFetch(`/disposables/${id}${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'DELETE',
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },
};

// ==========================================
// STAFF MANAGEMENT API MODULE
// ==========================================
export const staffApi = {
  getStaffList: async (params = {}) => {
    const activeTenantId = resolveCurrentTenantId();
    const queryParams = new URLSearchParams(params);
    if (activeTenantId && !queryParams.has('tenantId')) {
      queryParams.set('tenantId', activeTenantId);
    }
    const query = queryParams.toString();
    return apiFetch(`/staff${query ? `?${query}` : ''}`, {
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  getStaffById: async (id) => {
    const activeTenantId = resolveCurrentTenantId();
    return apiFetch(`/staff/${id}${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  createStaff: async (data) => {
    const activeTenantId = resolveCurrentTenantId();
    return apiFetch(`/staff${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  updateStaff: async (id, data) => {
    const activeTenantId = resolveCurrentTenantId();
    return apiFetch(`/staff/${id}${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  updateStaffStatus: async (id, isActive) => {
    const activeTenantId = resolveCurrentTenantId();
    return apiFetch(`/staff/${id}/status${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  deleteStaff: async (id) => {
    const activeTenantId = resolveCurrentTenantId();
    return apiFetch(`/staff/${id}${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      method: 'DELETE',
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  getDesignations: async () => {
    const activeTenantId = resolveCurrentTenantId();
    return apiFetch(`/staff/meta/designations${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },

  getShifts: async () => {
    const activeTenantId = resolveCurrentTenantId();
    return apiFetch(`/staff/meta/shifts${activeTenantId ? `?tenantId=${activeTenantId}` : ''}`, {
      headers: {
        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
      },
    });
  },
};

// ==========================================
// SUPER ADMIN PLATFORM API MODULE
// ==========================================
export const platformApi = {
  getCompanies: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/platform/companies${query ? `?${query}` : ''}`);
  },
  getMetricsOverview: async () => {
    return apiFetch('/platform/metrics/overview');
  },
  createCompany: async (data) => {
    return apiFetch('/platform/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateCompany: async (id, data) => {
    return apiFetch(`/platform/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  updateCompanyStatus: async (id, isActive, reason) => {
    return apiFetch(`/platform/companies/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive, reason }),
    });
  },
  deleteCompany: async (id, password) => {
    return apiFetch(`/platform/companies/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ password, superAdminPassword: password }),
    });
  },
  updateSubscription: async (id, data) => {
    return apiFetch(`/platform/companies/${id}/subscription`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  updateCashierLimit: async (id, cashierLimit) => {
    return apiFetch(`/platform/companies/${id}/cashier-limit`, {
      method: 'PATCH',
      body: JSON.stringify({ cashierLimit: Number(cashierLimit) }),
    });
  },
  getPlans: async () => {
    return apiFetch('/platform/plans');
  },
  createPlan: async (data) => {
    return apiFetch('/platform/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updatePlan: async (id, data) => {
    return apiFetch(`/platform/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  deletePlan: async (id) => {
    return apiFetch(`/platform/plans/${id}`, {
      method: 'DELETE',
    });
  },
  getAdminResetRequests: async () => {
    return apiFetch('/platform/admin-reset-requests');
  },
  approveAdminReset: async (userId) => {
    return apiFetch(`/platform/admin-reset-requests/${userId}/approve`, {
      method: 'POST',
    });
  },
};

// ==========================================
// POS ORDERS MODULE API
// ==========================================
export const posApi = {
  getOrders: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/pos/orders${query ? `?${query}` : ''}`);
  },
  getOrderById: async (id) => {
    return apiFetch(`/pos/orders/${id}`);
  },
  getOrderByNumber: async (orderNumber) => {
    return apiFetch(`/pos/orders/number/${orderNumber}`);
  },
  calculateOrder: async (data) => {
    return apiFetch('/pos/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  createOrder: async (data) => {
    return apiFetch('/pos/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateOrder: async (id, data) => {
    return apiFetch(`/pos/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  updateOrderStatus: async (id, status, notes) => {
    return apiFetch(`/pos/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },
  cancelOrder: async (id, reason = 'Cancelled from Appointment scheduler') => {
    return apiFetch(`/pos/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
  deleteOrder: async (id) => {
    return apiFetch(`/pos/orders/${id}`, {
      method: 'DELETE',
    });
  },
  getDashboardSummary: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/pos/dashboard/summary${query ? `?${query}` : ''}`);
  },
  getStats: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/pos/stats${query ? `?${query}` : ''}`);
  },
};

// ==========================================
// APPOINTMENTS MODULE API
// ==========================================
export const appointmentApi = {
  getAppointments: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/appointments${query ? `?${query}` : ''}`);
  },
  getCalendar: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/appointments/calendar${query ? `?${query}` : ''}`);
  },
  getAppointmentById: async (id) => {
    return apiFetch(`/appointments/${id}`);
  },
  createAppointment: async (data) => {
    return apiFetch('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateAppointment: async (id, data) => {
    return apiFetch(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  updateStatus: async (id, status) => {
    return apiFetch(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  reschedule: async (id, data) => {
    return apiFetch(`/appointments/${id}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  deleteAppointment: async (id) => {
    return apiFetch(`/appointments/${id}`, {
      method: 'DELETE',
    });
  },
  checkout: async (id) => {
    return apiFetch(`/appointments/${id}/checkout`, {
      method: 'POST',
    });
  },
};

// ==========================================
// CASH MANAGEMENT MODULE API
// ==========================================
export const cashManagementApi = {
  getSummary: async () => {
    return apiFetch('/cash-management/summary');
  },
  getNextOpeningBalance: async () => {
    return apiFetch('/cash-management/next-opening-balance');
  },
  startSession: async (data) => {
    return apiFetch('/cash-management/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  closeSession: async (data) => {
    return apiFetch('/cash-management/close', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getTransactions: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/cash-management/transactions${query ? `?${query}` : ''}`);
  },
  getRevenue: async () => {
    return apiFetch('/cash-management/revenue');
  },
  getExpenses: async () => {
    return apiFetch('/cash-management/expenses');
  },
};

// ==========================================
// EXPENSES MODULE API
// ==========================================
export const expenseApi = {
  getExpenses: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/expenses${query ? `?${query}` : ''}`);
  },
  createExpense: async (data) => {
    return apiFetch('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateExpense: async (id, data) => {
    return apiFetch(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  deleteExpense: async (id) => {
    return apiFetch(`/expenses/${id}`, {
      method: 'DELETE',
    });
  },
  getAccounts: async () => {
    return apiFetch('/accounts');
  },
  createAccount: async (data) => {
    return apiFetch('/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ==========================================
// REPORTS API MODULE
// ==========================================
export const reportsApi = {
  getPackageRedemption: async (params = {}) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    const queryObj = {
      ...(activeTenantId ? { tenantId: activeTenantId } : {}),
      ...params,
    };
    const query = new URLSearchParams(queryObj).toString();
    return apiFetch(`/reports/package-redemption${query ? `?${query}` : ''}`);
  },

  getPackagesSold: async (params = {}) => {
    let activeTenantId = null;
    try {
      const rawTenant = localStorage.getItem('respark_saas_active_tenant');
      if (rawTenant) {
        const parsed = JSON.parse(rawTenant);
        activeTenantId = parsed?.id || null;
      }
    } catch (e) {}
    const queryObj = {
      ...(activeTenantId ? { tenantId: activeTenantId } : {}),
      ...params,
    };
    const query = new URLSearchParams(queryObj).toString();
    return apiFetch(`/reports/packages-sold${query ? `?${query}` : ''}`);
  },
};

export default {
  fetch: apiFetch,
  auth: authApi,
  cashier: cashierApi,
  service: serviceApi,
  serviceCategory: serviceCategoryApi,
  product: productApi,
  productCategory: productCategoryApi,
  package: packageApi,
  disposable: disposableApi,
  permission: permissionApi,
  guest: guestApi,
  customer: guestApi,
  staff: staffApi,
  platform: platformApi,
  pos: posApi,
  appointment: appointmentApi,
  cashManagement: cashManagementApi,
  expense: expenseApi,
  reports: reportsApi,
  getToken,
  setToken,
  clearToken,
};
