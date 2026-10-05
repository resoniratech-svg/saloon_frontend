import { getActiveTenantId } from './saasStorage';
import { serviceApi } from '../api/client';

/**
 * DATABASE-ONLY SERVICE STORAGE
 * Services are loaded from PostgreSQL via serviceApi.
 * Zero services are stored in browser localStorage.
 */

let inMemoryServices = [];
let hasFetchedFromBackend = false;

export const purgeLocalServices = () => {
  try {
    const keysToRemove = ['respark_master_services'];
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith('respark_services_')) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    });
  } catch (err) {}
};

purgeLocalServices();

export const normalizeCategory = (cat) => {
  if (!cat) return 'HAIR';
  const trimmed = cat.trim();
  const u = trimmed.toUpperCase();
  if (u === 'HAIR') return 'HAIR';
  if (u === 'SKIN') return 'SKIN';
  if (u === 'MANI & PEDI' || u === 'MANI' || u === 'PEDI' || u === 'MANICURE' || u === 'PEDICURE' || u === 'MANICURE & PEDICURE') return 'MANI & PEDI';
  if (u === 'BRIDE' || u === 'BRIDAL' || u === 'BRIDAL SERVICES') return 'BRIDE';
  if (u === 'PACKAGE' || u === 'PACKAGES') return 'PACKAGE';
  return u;
};

export const getServiceHeader = (service) => {
  if (service.header && service.header !== 'Hair Cut & Style' && service.header !== 'Skin Care' && service.header !== 'Bridal Services') {
    return service.header;
  }
  const raw = (service.category || 'Services').trim();
  if (!raw) return 'Services';
  return raw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

export const mapBackendServiceToFrontend = (s) => ({
  id: s.id,
  name: s.name,
  category: s.category?.name || s.category || 'Hair',
  gender: s.gender === 'MALE' ? 'Male' : (s.gender === 'FEMALE' ? 'Female' : 'Both'),
  price: Number(s.price || 0),
  duration: s.durationMinutes ? `${s.durationMinutes}m` : (s.duration || '30m'),
  header: s.header || (s.category?.name || 'Hair Cut & Style'),
  staff: s.staff || 'Staff',
  resource: s.resource || 'Room 1'
});

export const fetchServicesFromBackend = async () => {
  try {
    const res = await serviceApi.getServices({ limit: 100 });
    const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.items) ? res.data.items : []);
    if (items.length > 0) {
      inMemoryServices = items.map(mapBackendServiceToFrontend);
      hasFetchedFromBackend = true;
      window.dispatchEvent(new Event('servicesUpdated'));
      return inMemoryServices;
    }
  } catch (err) {
    console.warn('Could not fetch services from backend:', err);
  }
  return inMemoryServices;
};

export const getMasterServices = () => {
  if (!hasFetchedFromBackend) {
    fetchServicesFromBackend();
  }
  return [...inMemoryServices];
};

export const saveMasterServices = (services) => {
  inMemoryServices = Array.isArray(services) ? services : [];
  window.dispatchEvent(new Event('servicesUpdated'));
};
