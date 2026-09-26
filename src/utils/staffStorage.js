import { getActiveTenantId } from './saasStorage';

const STAFF_STORAGE_KEY = 'respark_master_staff';

export const initialStaffMembers = [
  { 
    id: 1, 
    name: 'Respark Trial', 
    firstName: 'Respark', 
    lastName: 'Trial',
    designation: 'Senior Stylist', 
    empNo: 'EMP-001', 
    phone: '+91 9823412345', 
    email: 'respark.trial@saloon.com',
    dob: '1990-05-15',
    position: 'Senior Stylist',
    gender: 'Male',
    role: 'Stylist',
    username: 'respark.trial',
    password: 'password123',
    useMobileAsUsername: false,
    active: true,
    enableAppointments: true,
    showAppointmentsInDashboard: true,
    weeklyOff: 'Monday',
    joiningDate: '2022-01-10',
    uanNumber: '100902837465',
    reportingTo: 'Manager',
    workingHours: '9',
    bankName: 'HDFC Bank',
    branch: 'Kalyaninagar',
    accountNumber: '50100234567890',
    ifsc: 'HDFC0001234',
    workExperience: [],
    documents: [],
  },
  { 
    id: 2, 
    name: 'Sohum K', 
    firstName: 'Sohum', 
    lastName: 'K',
    designation: 'Color Specialist', 
    empNo: 'EMP-002', 
    phone: '+91 9823412346', 
    email: 'sohum.k@saloon.com',
    dob: '1993-08-22',
    position: 'Color Specialist',
    gender: 'Male',
    role: 'Stylist',
    username: 'sohum.k',
    password: 'password123',
    useMobileAsUsername: false,
    active: true,
    enableAppointments: true,
    showAppointmentsInDashboard: true,
    weeklyOff: 'Tuesday',
    joiningDate: '2023-03-01',
    uanNumber: '100902837466',
    reportingTo: 'Respark Trial',
    workingHours: '9',
    bankName: 'ICICI Bank',
    branch: 'Kalyaninagar',
    accountNumber: '001201567890',
    ifsc: 'ICIC0000012',
    workExperience: [],
    documents: [],
  },
  { 
    id: 3, 
    name: 'Swati R', 
    firstName: 'Swati', 
    lastName: 'R',
    designation: 'Beautician & Spa', 
    empNo: 'EMP-003', 
    phone: '+91 9823412347', 
    email: 'swati.r@saloon.com',
    dob: '1995-11-12',
    position: 'Beautician & Spa',
    gender: 'Female',
    role: 'Beautician',
    username: 'swati.r',
    password: 'password123',
    useMobileAsUsername: false,
    active: true,
    enableAppointments: true,
    showAppointmentsInDashboard: true,
    weeklyOff: 'Wednesday',
    joiningDate: '2023-06-15',
    uanNumber: '100902837467',
    reportingTo: 'Manager',
    workingHours: '8',
    bankName: 'SBI Bank',
    branch: 'Pune Main',
    accountNumber: '302001987654',
    ifsc: 'SBIN0000456',
    workExperience: [],
    documents: [],
  },
  { 
    id: 4, 
    name: 'Akshay D', 
    firstName: 'Akshay', 
    lastName: 'D',
    designation: 'Grooming Expert', 
    empNo: 'EMP-004', 
    phone: '+91 9823412348', 
    email: 'akshay.d@saloon.com',
    dob: '1992-04-18',
    position: 'Grooming Expert',
    gender: 'Male',
    role: 'Stylist',
    username: 'akshay.d',
    password: 'password123',
    useMobileAsUsername: false,
    active: true,
    enableAppointments: true,
    showAppointmentsInDashboard: true,
    weeklyOff: 'Thursday',
    joiningDate: '2022-11-01',
    uanNumber: '100902837468',
    reportingTo: 'Respark Trial',
    workingHours: '9',
    bankName: 'Axis Bank',
    branch: 'Kalyaninagar',
    accountNumber: '91201004567890',
    ifsc: 'UTIB0000123',
    workExperience: [],
    documents: [],
  },
  { 
    id: 5, 
    name: 'Madhu G', 
    firstName: 'Madhu', 
    lastName: 'G',
    designation: 'Hair Stylist', 
    empNo: 'EMP-005', 
    phone: '+91 9823412349', 
    email: 'madhu.g@saloon.com',
    dob: '1996-09-05',
    position: 'Hair Stylist',
    gender: 'Female',
    role: 'Stylist',
    username: 'madhu.g',
    password: 'password123',
    useMobileAsUsername: false,
    active: true,
    enableAppointments: true,
    showAppointmentsInDashboard: true,
    weeklyOff: 'Monday',
    joiningDate: '2024-01-15',
    uanNumber: '100902837469',
    reportingTo: 'Respark Trial',
    workingHours: '9',
    bankName: 'HDFC Bank',
    branch: 'Viman Nagar',
    accountNumber: '50100987654321',
    ifsc: 'HDFC0001234',
    workExperience: [],
    documents: [],
  },
];

export const naturalsStaffMembers = [
  {
    id: 101,
    name: 'Pooja H',
    firstName: 'Pooja',
    lastName: 'H',
    designation: 'Senior Stylist',
    empNo: 'NAT-001',
    phone: '+91 9845012345',
    email: 'pooja@naturalssalon.in',
    gender: 'Female',
    role: 'Stylist',
    username: 'pooja.h',
    password: 'password123',
    active: true,
    enableAppointments: true,
    weeklyOff: 'Tuesday'
  },
  {
    id: 102,
    name: 'Anita D',
    firstName: 'Anita',
    lastName: 'D',
    designation: 'Spa Specialist',
    empNo: 'NAT-002',
    phone: '+91 9845098765',
    email: 'anita@naturalssalon.in',
    gender: 'Female',
    role: 'Beautician',
    username: 'anita.d',
    password: 'password123',
    active: true,
    enableAppointments: true,
    weeklyOff: 'Wednesday'
  },
  {
    id: 103,
    name: 'Sneha K',
    firstName: 'Sneha',
    lastName: 'K',
    designation: 'Beautician',
    empNo: 'NAT-003',
    phone: '+91 9845065432',
    email: 'sneha@naturalssalon.in',
    gender: 'Female',
    role: 'Staff',
    username: 'sneha.k',
    password: 'password123',
    active: true,
    enableAppointments: true,
    weeklyOff: 'Monday'
  }
];

export const enrichStaffMembers = [
  {
    id: 201,
    name: 'Rahul V',
    firstName: 'Rahul',
    lastName: 'V',
    designation: 'Master Stylist',
    empNo: 'ENR-001',
    phone: '+91 9890123456',
    email: 'rahul@enrichstudio.com',
    gender: 'Male',
    role: 'Stylist',
    username: 'rahul.v',
    password: 'password123',
    active: true,
    enableAppointments: true,
    weeklyOff: 'Monday'
  },
  {
    id: 202,
    name: 'Sameer S',
    firstName: 'Sameer',
    lastName: 'S',
    designation: 'Color Specialist',
    empNo: 'ENR-002',
    phone: '+91 9890198765',
    email: 'sameer@enrichstudio.com',
    gender: 'Male',
    role: 'Stylist',
    username: 'sameer.s',
    password: 'password123',
    active: true,
    enableAppointments: true,
    weeklyOff: 'Thursday'
  },
  {
    id: 203,
    name: 'Tina M',
    firstName: 'Tina',
    lastName: 'M',
    designation: 'Salon Manager',
    empNo: 'ENR-003',
    phone: '+91 9890134567',
    email: 'tina@enrichstudio.com',
    gender: 'Female',
    role: 'Manager',
    username: 'tina.m',
    password: 'password123',
    active: true,
    enableAppointments: true,
    weeklyOff: 'Tuesday'
  }
];

export const getStaffStorageKey = () => {
  const tenantId = getActiveTenantId();
  return `respark_staff_${tenantId}`;
};

export const getInitialStaffForTenant = (tenantId) => {
  if (tenantId === 'tenant_naturals') return naturalsStaffMembers;
  if (tenantId === 'tenant_enrich') return enrichStaffMembers;
  if (tenantId === 'tenant_glamour') return initialStaffMembers;
  return [];
};

export const getStaffForTenant = (tenantId) => {
  try {
    const storageKey = `respark_staff_${tenantId}`;
    let data = localStorage.getItem(storageKey);

    if (!data && tenantId === 'tenant_glamour') {
      const legacy = localStorage.getItem('respark_master_staff');
      if (legacy) data = legacy;
    }

    if (!data) {
      const initial = getInitialStaffForTenant(tenantId);
      localStorage.setItem(storageKey, JSON.stringify(initial));
      return initial;
    }

    let parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      return [];
    }
    // Filter out any cashiers (as cashiers are now kept in dedicated cashierStorage)
    let pureStaff = parsed.filter(s => 
      s.role !== 'Cashier' && 
      !s.position?.toLowerCase().includes('cashier') &&
      !s.designation?.toLowerCase().includes('cashier') &&
      s.username !== 'cashier'
    );

    // For custom salons: filter out demo mock staff members
    if (tenantId !== 'tenant_glamour' && tenantId !== 'tenant_naturals' && tenantId !== 'tenant_enrich') {
      const mockIds = new Set([
        ...initialStaffMembers.map(s => String(s.id)),
        ...naturalsStaffMembers.map(s => String(s.id)),
        ...enrichStaffMembers.map(s => String(s.id)),
      ]);
      const mockNames = new Set([
        'respark trial', 'sohum k', 'swati r', 'akshay d', 'madhu g',
        'pooja h', 'anita d', 'sneha k', 'rahul v'
      ]);
      const customOnly = pureStaff.filter(s => {
        const sid = String(s.id);
        const sName = (s.name || `${s.firstName || ''} ${s.lastName || ''}`).trim().toLowerCase();
        // User created staff have timestamp IDs
        const isUserCreated = /^\d{10,}$/.test(sid);
        if (isUserCreated) return true;
        const isMock = mockIds.has(sid) || mockNames.has(sName) || Number(sid) < 1000;
        return !isMock;
      });
      if (customOnly.length !== pureStaff.length) {
        localStorage.setItem(storageKey, JSON.stringify(customOnly));
        pureStaff = customOnly;
      }
    }

    return pureStaff;
  } catch (err) {
    return getInitialStaffForTenant(tenantId);
  }
};

export const getMasterStaff = () => {
  try {
    const tenantId = getActiveTenantId();
    const storageKey = getStaffStorageKey();
    let data = localStorage.getItem(storageKey);

    // Auto-migrate previous un-scoped key for Glamour so no data is lost
    if (!data && tenantId === 'tenant_glamour') {
      const legacy = localStorage.getItem('respark_master_staff');
      if (legacy) {
        localStorage.setItem(storageKey, legacy);
        data = legacy;
      }
    }

    if (!data) {
      const initial = getInitialStaffForTenant(tenantId);
      localStorage.setItem(storageKey, JSON.stringify(initial));
      return initial;
    }
    let parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      return [];
    }
    // Filter out any cashiers
    let pureStaff = parsed.filter(s => 
      s.role !== 'Cashier' && 
      !s.position?.toLowerCase().includes('cashier') &&
      !s.designation?.toLowerCase().includes('cashier') &&
      s.username !== 'cashier'
    );

    // For custom salons: automatically filter out legacy mock staff items
    if (tenantId !== 'tenant_glamour' && tenantId !== 'tenant_naturals' && tenantId !== 'tenant_enrich') {
      const mockIds = new Set([
        ...initialStaffMembers.map(s => String(s.id)),
        ...naturalsStaffMembers.map(s => String(s.id)),
        ...enrichStaffMembers.map(s => String(s.id)),
      ]);
      const mockNames = new Set([
        'respark trial', 'sohum k', 'swati r', 'akshay d', 'madhu g',
        'pooja h', 'anita d', 'sneha k', 'rahul v'
      ]);
      const customOnly = pureStaff.filter(s => {
        const sid = String(s.id);
        const sName = (s.name || `${s.firstName || ''} ${s.lastName || ''}`).trim().toLowerCase();
        // User created staff have timestamp IDs
        const isUserCreated = /^\d{10,}$/.test(sid);
        if (isUserCreated) return true;
        const isMock = mockIds.has(sid) || mockNames.has(sName) || Number(sid) < 1000;
        return !isMock;
      });
      if (customOnly.length !== pureStaff.length) {
        localStorage.setItem(storageKey, JSON.stringify(customOnly));
        pureStaff = customOnly;
      }
    }

    return pureStaff.map(s => {
      const resolvedName = (s.name || `${s.firstName || ''} ${s.lastName || ''}`).trim() || 'Staff';
      const nameParts = resolvedName.split(' ');
      return {
        ...s,
        name: resolvedName,
        firstName: s.firstName || nameParts[0] || '',
        lastName: s.lastName || nameParts.slice(1).join(' ') || '',
        phone: s.phone || s.mobile || '+91 9823412345',
        email: s.email || '',
        dob: s.dob || '',
        position: s.position || s.designation || 'Staff',
        gender: s.gender || 'Male',
        role: s.role || 'Stylist',
        username: s.username || (resolvedName ? resolvedName.toLowerCase().replace(/\s+/g, '.') : ''),
        password: s.password || '',
        useMobileAsUsername: s.useMobileAsUsername || false,
        active: s.active !== undefined ? s.active : true,
        enableAppointments: s.enableAppointments !== undefined ? s.enableAppointments : true,
        showAppointmentsInDashboard: s.showAppointmentsInDashboard !== undefined ? s.showAppointmentsInDashboard : true,
        weeklyOff: s.weeklyOff || 'Monday',
        joiningDate: s.joiningDate || '',
        designation: s.designation || s.position || 'Hair Stylist',
        uanNumber: s.uanNumber || '',
        reportingTo: s.reportingTo || '',
        workingHours: s.workingHours || '9',
        bankName: s.bankName || '',
        branch: s.branch || '',
        accountNumber: s.accountNumber || '',
        ifsc: s.ifsc || '',
        workExperience: s.workExperience || [],
        documents: s.documents || [],
      };
    });
  } catch (err) {
    console.error('Error in getMasterStaff:', err);
    return initialStaffMembers;
  }
};

export const saveMasterStaff = (staffList) => {
  try {
    const storageKey = getStaffStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(staffList));
    window.dispatchEvent(new Event('staffUpdated'));
    window.dispatchEvent(new CustomEvent('resparkStaffUpdated', { detail: staffList }));
  } catch (err) {
    console.error('Error in saveMasterStaff:', err);
  }
};


