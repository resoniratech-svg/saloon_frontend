import { getActiveTenantId } from './saasStorage';

const getVendorStorageKey = () => `respark_vendors_${getActiveTenantId()}`;

export const initialMasterVendors = [
  {
    id: 'v_nova',
    vendorName: 'Naveen Sharma',
    firmName: 'Nova Cosmetics & Salon Supplies',
    mobile: '9876543210',
    alternateMobile: '9876543211',
    email: 'nova.supplies@gmail.com',
    gstNumber: '27AABCN1234F1Z5',
    address: 'Shop 12, Phoenix Marketcity',
    area: 'Viman Nagar',
    landmark: 'Opp Inorbit Mall',
    city: 'Pune',
    pincode: '411014',
    active: true,
    items: ['p2', 'p3', 'p5']
  },
  {
    id: 'v_loreal',
    vendorName: 'Rajesh Malhotra',
    firmName: "L'Oreal Professional Distribution",
    mobile: '9823012345',
    alternateMobile: '',
    email: 'rajesh.loreal@distrib.com',
    gstNumber: '27AAACL1234D1Z2',
    address: 'A-402, Trade Center, BKC',
    area: 'Bandra East',
    landmark: 'Near Diamond Bourse',
    city: 'Mumbai',
    pincode: '400051',
    active: true,
    items: ['p4', 'p6']
  },
  {
    id: 'v_wella',
    vendorName: 'Amit Desai',
    firmName: 'Wella Care & Styling Products',
    mobile: '9845098765',
    alternateMobile: '9845098766',
    email: 'amit.wella@gmail.com',
    gstNumber: '27AABCP5678K1Z9',
    address: 'Plot 45, Hadapsar Industrial Area',
    area: 'Hadapsar',
    landmark: 'Behind Magarpatta City',
    city: 'Pune',
    pincode: '411028',
    active: true,
    items: ['p2', 'p5']
  }
];

export const initialVendorsNaturals = [
  {
    id: 'v_herbal',
    vendorName: 'Suresh Iyer',
    firmName: 'Organic Herbal Remedies Ltd',
    mobile: '9820011223',
    alternateMobile: '',
    email: 'suresh@organicherbals.in',
    gstNumber: '27AABCO9988H1Z1',
    address: 'Survey 14, Hinjewadi Phase 1',
    area: 'Hinjewadi',
    landmark: 'Near Infosys Circle',
    city: 'Pune',
    pincode: '411057',
    active: true,
    items: ['np1', 'np3']
  },
  {
    id: 'v_botanical',
    vendorName: 'Pooja Hegde',
    firmName: 'Green Botanicals Essential Oils',
    mobile: '9819988776',
    alternateMobile: '',
    email: 'pooja@greenbotanicals.com',
    gstNumber: '27AAACG5544B1Z3',
    address: 'Shop 4, Baner High Street',
    area: 'Baner',
    landmark: 'Opp Starbucks',
    city: 'Pune',
    pincode: '411045',
    active: true,
    items: ['np2']
  }
];

export const initialVendorsEnrich = [
  {
    id: 'v_schwarzkopf',
    vendorName: 'Vikram Seth',
    firmName: 'Schwarzkopf Professional Distribution',
    mobile: '9833322110',
    alternateMobile: '',
    email: 'orders@schwarzkopf-dist.in',
    gstNumber: '27AABCS7766K1Z8',
    address: 'Express Towers, Nariman Point',
    area: 'South Mumbai',
    landmark: 'Opp Air India Building',
    city: 'Mumbai',
    pincode: '400021',
    active: true,
    items: ['ep1', 'ep3']
  }
];

export const getMasterVendors = () => {
  const tenantId = getActiveTenantId();
  const storageKey = getVendorStorageKey();

  try {
    let data = localStorage.getItem(storageKey);

    // Auto-migrate legacy key for Glamour
    if (!data && tenantId === 'tenant_glamour') {
      const legacy = localStorage.getItem('respark_master_vendors');
      if (legacy) {
        localStorage.setItem(storageKey, legacy);
        data = legacy;
      }
    }

    if (!data) {
      let initial = initialMasterVendors;
      if (tenantId === 'tenant_naturals') initial = initialVendorsNaturals;
      else if (tenantId === 'tenant_enrich') initial = initialVendorsEnrich;
      else if (tenantId !== 'tenant_glamour') initial = [];

      localStorage.setItem(storageKey, JSON.stringify(initial));
      return initial;
    }

    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      return initialMasterVendors;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load vendors from localStorage', err);
    return initialMasterVendors;
  }
};

export const saveMasterVendors = (vendors) => {
  const storageKey = getVendorStorageKey();
  try {
    localStorage.setItem(storageKey, JSON.stringify(vendors));
    window.dispatchEvent(new Event('vendorsUpdated'));
  } catch (err) {
    console.error('Failed to save vendors to localStorage', err);
  }
};
