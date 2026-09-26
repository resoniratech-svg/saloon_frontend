import { getActiveTenantId } from './saasStorage';

export const initialMasterServices = [
  // Hair Cut & Style
  { id: 'ms_1', name: 'Hair Cut (With Shampoo)', category: 'Hair', gender: 'Both', price: 200, duration: '30m', staff: 'Piyush, Sohum', resource: 'Room 1', header: 'Hair Cut & Style' },
  { id: 'ms_2', name: 'Hair Style', category: 'Hair', gender: 'Both', price: 100, duration: '20m', staff: 'Respark Trial', resource: 'Room 1', header: 'Hair Cut & Style' },
  { id: 'ms_3', name: 'Head Wash', category: 'Hair', gender: 'Both', price: 100, duration: '15m', staff: 'Swati R', resource: 'Room 2', header: 'Hair Cut & Style' },
  { id: 'ms_4', name: 'Normal Shave', category: 'Hair', gender: 'Male', price: 100, duration: '20m', staff: 'Akshay D', resource: 'Room 1', header: 'Hair Cut & Style' },
  { id: 'ms_5', name: 'Hair Cut', category: 'Hair', gender: 'Both', price: 800, duration: '30m', staff: 'Swati R', resource: 'Room 1', header: 'Hair Cut & Style' },
  { id: 'ms_6', name: 'Trimming', category: 'Hair', gender: 'Both', price: 300, duration: '20m', staff: 'Respark Trial', resource: 'Room 1', header: 'Hair Cut & Style' },
  { id: 'ms_7', name: 'Hair Splitents', category: 'Hair', gender: 'Female', price: 450, duration: '30m', staff: 'Respark Trial', resource: 'Room 1', header: 'Hair Cut & Style' },
  { id: 'ms_8', name: 'Blow Dry', category: 'Hair', gender: 'Both', price: 250, duration: '20m', staff: 'Akshay D', resource: 'Room 1', header: 'Hair Cut & Style' },
  { id: 'ms_9', name: 'Hair Pressing', category: 'Hair', gender: 'Female', price: 350, duration: '30m', staff: 'Sohum K', resource: 'Room 1', header: 'Hair Cut & Style' },
  { id: 'ms_10', name: 'Only Shampoo', category: 'Hair', gender: 'Both', price: 250, duration: '15m', staff: 'Swati R', resource: 'Room 2', header: 'Hair Cut & Style' },
  
  // Hair Spa
  { id: 'ms_11', name: 'Hair Spa Normal', category: 'Hair', gender: 'Both', price: 1000, duration: '45m', staff: 'Madhu G', resource: 'Room 2', header: 'Hair Spa' },
  { id: 'ms_12', name: 'Hair Spa Loreal', category: 'Hair', gender: 'Both', price: 1200, duration: '60m', staff: 'Madhu G', resource: 'Room 2', header: 'Hair Spa' },
  { id: 'ms_13', name: 'Hair Spa Treatment', category: 'Hair', gender: 'Both', price: 1500, duration: '60m', staff: 'Madhu G', resource: 'Room 2', header: 'Hair Spa' },

  // Hair Color
  { id: 'ms_14', name: 'Global Color', category: 'Hair', gender: 'Both', price: 2000, duration: '90m', staff: 'Sohum K', resource: 'Room 1', header: 'Hair Color' },
  { id: 'ms_15', name: 'Highlights', category: 'Hair', gender: 'Both', price: 2500, duration: '90m', staff: 'Sohum K', resource: 'Room 1', header: 'Hair Color' },
  { id: 'ms_16', name: 'Root Touch Up', category: 'Hair', gender: 'Both', price: 800, duration: '45m', staff: 'Sohum K', resource: 'Room 1', header: 'Hair Color' },

  // Skin Care
  { id: 'ms_17', name: 'Fruit Clean Up', category: 'Skin', gender: 'Both', price: 400, duration: '45m', staff: 'Madhu G', resource: 'Room 2', header: 'Skin Care' },
  { id: 'ms_18', name: 'Facial Basic', category: 'Skin', gender: 'Both', price: 600, duration: '45m', staff: 'Madhu G', resource: 'Room 2', header: 'Skin Care' },
  { id: 'ms_19', name: 'Facial Premium', category: 'Skin', gender: 'Both', price: 1200, duration: '60m', staff: 'Madhu G', resource: 'Room 2', header: 'Skin Care' },
  { id: 'ms_20', name: 'Cleanup', category: 'Skin', gender: 'Both', price: 400, duration: '30m', staff: 'Swati R', resource: 'Room 2', header: 'Skin Care' },
  { id: 'ms_21', name: 'Bleach', category: 'Skin', gender: 'Both', price: 350, duration: '20m', staff: 'Swati R', resource: 'Room 2', header: 'Skin Care' },

  // Mani & Pedi
  { id: 'ms_22', name: 'Manicure', category: 'Mani & Pedi', gender: 'Both', price: 500, duration: '30m', staff: 'Swati R', resource: 'Room 2', header: 'Mani & Pedi' },
  { id: 'ms_23', name: 'Pedicure', category: 'Mani & Pedi', gender: 'Both', price: 600, duration: '45m', staff: 'Swati R', resource: 'Room 2', header: 'Mani & Pedi' },
  { id: 'ms_24', name: 'Gel Nails', category: 'Mani & Pedi', gender: 'Female', price: 1500, duration: '60m', staff: 'Swati R', resource: 'Room 2', header: 'Mani & Pedi' },
];

export const naturalsMasterServices = [
  { id: 'nat_s1', name: 'Naturals Organic Hair Spa', category: 'Hair', gender: 'Both', price: 1200, duration: '45m', staff: 'Anita D', resource: 'Room 1', header: 'Hair Spa' },
  { id: 'nat_s2', name: 'Herbal Hair Cut & Wash', category: 'Hair', gender: 'Both', price: 350, duration: '30m', staff: 'Pooja H', resource: 'Room 1', header: 'Hair Cut & Style' },
  { id: 'nat_s3', name: 'Aroma Glow Facial', category: 'Skin', gender: 'Both', price: 1500, duration: '60m', staff: 'Sneha K', resource: 'Room 2', header: 'Skin Care' },
  { id: 'nat_s4', name: 'Ayurvedic Head Massage', category: 'Hair', gender: 'Both', price: 500, duration: '30m', staff: 'Anita D', resource: 'Room 1', header: 'Hair Spa' },
  { id: 'nat_s5', name: 'Green Tea Pedicure', category: 'Mani & Pedi', gender: 'Both', price: 700, duration: '45m', staff: 'Sneha K', resource: 'Room 2', header: 'Mani & Pedi' },
];

export const enrichMasterServices = [
  { id: 'enr_s1', name: 'Enrich Signature Keratin', category: 'Hair', gender: 'Both', price: 3500, duration: '90m', staff: 'Rahul V', resource: 'Room 1', header: 'Hair Treatments' },
  { id: 'enr_s2', name: 'Men Executive Hair Cut', category: 'Hair', gender: 'Male', price: 500, duration: '30m', staff: 'Sameer S', resource: 'Room 1', header: 'Hair Cut & Style' },
  { id: 'enr_s3', name: 'O3+ Bridal Radiance Facial', category: 'Skin', gender: 'Female', price: 2200, duration: '60m', staff: 'Tina M', resource: 'Room 2', header: 'Skin Care' },
  { id: 'enr_s4', name: 'Deep Pore Cleansing', category: 'Skin', gender: 'Both', price: 800, duration: '30m', staff: 'Tina M', resource: 'Room 2', header: 'Skin Care' },
];

export const normalizeCategory = (cat) => {
  if (!cat) return 'HAIR';
  const trimmed = cat.trim();
  const u = trimmed.toUpperCase();
  if (u === 'HAIR') return 'HAIR';
  if (u === 'SKIN') return 'SKIN';
  if (u === 'MANI & PEDI' || u === 'MANI' || u === 'PEDI' || u === 'MANICURE' || u === 'PEDICURE' || u === 'MANICURE & PEDICURE') return 'MANI & PEDI';
  if (u === 'BRIDE' || u === 'BRIDAL' || u === 'BRIDAL SERVICES') return 'BRIDE';
  if (u === 'PACKAGE' || u === 'PACKAGES') return 'PACKAGE';
  // New or custom category (e.g. "HAIRR", "MASSAGE", "SPA", "TATTOO"):
  // Preserves its uppercase key so all services sharing the same name group together!
  return u;
};

export const getServiceHeader = (service) => {
  // If an explicit custom header was set (and is not an old template default)
  if (service.header && service.header !== 'Hair Cut & Style' && service.header !== 'Skin Care' && service.header !== 'Bridal Services') {
    return service.header;
  }
  const raw = (service.category || 'Services').trim();
  if (!raw) return 'Services';

  // Match the exact category name typed by user (e.g. "hair" -> "Hair", "skin" -> "Skin", "hairr" -> "Hairr")
  return raw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

export const getServiceStorageKey = () => {
  const tenantId = getActiveTenantId();
  return `respark_services_${tenantId}`;
};

export const getInitialServicesForTenant = (tenantId) => {
  if (tenantId === 'tenant_naturals') return naturalsMasterServices;
  if (tenantId === 'tenant_enrich') return enrichMasterServices;
  if (tenantId === 'tenant_glamour') return initialMasterServices;
  // All other / custom salons (like resonira): start fresh with empty catalog
  return [];
};

export const getMasterServices = () => {
  try {
    const tenantId = getActiveTenantId();
    const storageKey = getServiceStorageKey();
    let data = localStorage.getItem(storageKey);

    // Auto-migrate previous un-scoped key for Glamour so no data is lost
    if (!data && tenantId === 'tenant_glamour') {
      const legacy = localStorage.getItem('respark_master_services');
      if (legacy) {
        localStorage.setItem(storageKey, legacy);
        data = legacy;
      }
    }

    if (data === null || data === undefined) {
      const initial = getInitialServicesForTenant(tenantId);
      localStorage.setItem(storageKey, JSON.stringify(initial));
      return initial;
    }

    let parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      return [];
    }

    // For custom salons: automatically filter out legacy mock items (ids starting with 'ms_', 'nat_s', 'enr_s')
    if (tenantId !== 'tenant_glamour' && tenantId !== 'tenant_naturals' && tenantId !== 'tenant_enrich') {
      const mockIds = new Set([
        ...initialMasterServices.map(s => String(s.id)),
        ...naturalsMasterServices.map(s => String(s.id)),
        ...enrichMasterServices.map(s => String(s.id)),
      ]);
      const customOnly = parsed.filter(s => {
        const sid = String(s.id);
        const isUserCreated = /^\d{10,}$/.test(sid) || /^ms_\d{10,}$/.test(sid);
        if (isUserCreated) return true;
        const isMock = mockIds.has(sid) || /^ms_?\d{1,2}$/i.test(sid) || sid.startsWith('nat_s') || sid.startsWith('enr_s');
        return !isMock;
      });
      if (customOnly.length !== parsed.length) {
        localStorage.setItem(storageKey, JSON.stringify(customOnly));
        parsed = customOnly;
      }
    }

    // Ensure each service has gender assigned
    const sanitized = parsed.map(s => {
      if (s.gender) return s;
      if (s.name && s.name.toLowerCase().includes('shave')) return { ...s, gender: 'Male' };
      if (s.name && (s.name.toLowerCase().includes('nail') || s.name.toLowerCase().includes('bride') || s.name.toLowerCase().includes('splitent') || s.name.toLowerCase().includes('pressing'))) return { ...s, gender: 'Female' };
      return { ...s, gender: 'Both' };
    });
    return sanitized;
  } catch (err) {
    return [];
  }
};

export const saveMasterServices = (services) => {
  try {
    const storageKey = getServiceStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(services));
    window.dispatchEvent(new Event('servicesUpdated'));
  } catch (err) {
    console.error(err);
  }
};
