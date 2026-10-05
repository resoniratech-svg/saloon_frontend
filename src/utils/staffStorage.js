import { getActiveTenantId } from './saasStorage';
import { staffApi } from '../api/client';

let inMemoryWorkExpMap = {};

export const getStoredStaffExperience = (staffId) => {
  if (!staffId) return [];
  return Array.isArray(inMemoryWorkExpMap[staffId]) ? inMemoryWorkExpMap[staffId] : [];
};

export const setStoredStaffExperience = (staffId, exp) => {
  if (!staffId) return;
  inMemoryWorkExpMap[staffId] = Array.isArray(exp) ? exp : [];
};

export const mapBackendStaffToFrontend = (item) => {
  const pd = item.personalDetails || {};
  const jd = item.joiningDetails || {};
  const bd = item.bankDetails || {};
  const as = item.appointmentSettings || {};
  const desigName = jd.designation?.name || item.designation || 'Stylist';
  const resolvedName = item.name || `${pd.firstName || ''} ${pd.lastName || ''}`.trim() || 'Staff';
  const nameParts = resolvedName.split(' ');

  // Compute weekly off day string if available
  let weeklyOffStr = 'Monday';
  if (Array.isArray(item.weeklySchedules) && item.weeklySchedules.length > 0) {
    const offDay = item.weeklySchedules.find(w => w.isWeeklyOff);
    if (offDay) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      weeklyOffStr = days[offDay.dayOfWeek] || 'Monday';
    }
  }

  // Work experience resolution (from encoded address or local storage cache)
  let workExp = [];
  let realAddress = pd.address || '';
  if (pd.address && pd.address.startsWith('EXP_DATA:')) {
    try {
      const parsed = JSON.parse(pd.address.replace('EXP_DATA:', ''));
      if (Array.isArray(parsed.exp)) {
        workExp = parsed.exp;
      }
      realAddress = parsed.addr || '';
    } catch (e) {}
  }

  if (workExp.length === 0 && item.id) {
    const localExp = getStoredStaffExperience(item.id);
    if (Array.isArray(localExp) && localExp.length > 0) {
      workExp = localExp;
    }
  }

  if (item.id && workExp.length > 0) {
    setStoredStaffExperience(item.id, workExp);
  }

  // KYC documents resolution (ensure both type/documentType and number/documentNumber are present)
  const docs = Array.isArray(item.documents)
    ? item.documents.map(d => ({
        id: d.id,
        type: d.documentType || d.type || 'Identity Proof',
        documentType: d.documentType || d.type || 'Identity Proof',
        number: d.documentNumber || d.number || '',
        documentNumber: d.documentNumber || d.number || '',
        url: d.documentUrl || d.url || '',
        documentUrl: d.documentUrl || d.url || '',
      }))
    : [];

  return {
    id: item.id,
    name: resolvedName,
    firstName: pd.firstName || nameParts[0] || '',
    lastName: pd.lastName || nameParts.slice(1).join(' ') || '',
    phone: pd.mobile || item.phone || '',
    mobile: pd.mobile || item.phone || '',
    email: pd.email || '',
    address: realAddress,
    dob: pd.dob ? new Date(pd.dob).toISOString().split('T')[0] : '',
    gender: pd.gender || 'Male',
    position: desigName,
    designation: desigName,
    role: 'Stylist',
    empNo: jd.employeeNumber || `EMP-${String(item.id).slice(-4)}`,
    joiningDate: jd.joiningDate ? new Date(jd.joiningDate).toISOString().split('T')[0] : '',
    workingHours: jd.workingHours || '9',
    reportingTo: jd.reportingTo?.name || '',
    bankName: bd.bankName || '',
    branch: bd.branch || '',
    accountNumber: bd.accountNumber || '',
    ifsc: bd.ifsc || '',
    active: item.isActive !== undefined ? item.isActive : true,
    enableAppointments: as.enableAppointments !== undefined ? as.enableAppointments : true,
    showAppointmentsInDashboard: as.showAllAppointments !== undefined ? as.showAllAppointments : true,
    weeklyOff: weeklyOffStr,
    workExperience: workExp,
    documents: docs,
  };
};

export const initialStaffMembers = [
  { 
    id: 1, 
    name: 'Siri H', 
    firstName: 'Siri', 
    lastName: 'H',
    designation: 'Senior Stylist', 
    empNo: 'EMP-001', 
    phone: '+91 9823412345', 
    email: 'siri.h@saloon.com',
    dob: '1990-05-15',
    position: 'Senior Stylist',
    gender: 'Female',
    role: 'Stylist',
    username: 'siri.h',
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
    reportingTo: 'Siri H',
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
    reportingTo: 'Siri H',
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
    reportingTo: 'Siri H',
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

export const getStaffForTenant = () => {
  return getMasterStaff();
};

let inMemoryStaff = [];
let hasFetchedStaffFromBackend = false;

export const purgeLocalStaff = () => {
  try {
    const keysToRemove = [
      'respark_master_staff',
      'respark_staff_work_experience',
      'staff_members',
    ];
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('respark_staff_') || k.startsWith('staff_'))) {
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

purgeLocalStaff();

export const getMasterStaff = () => {
  if (!hasFetchedStaffFromBackend) {
    syncStaffFromBackend();
  }
  return [...inMemoryStaff];
};

export const saveMasterStaff = (staffList) => {
  inMemoryStaff = Array.isArray(staffList) ? staffList : [];
  window.dispatchEvent(new Event('staffUpdated'));
  window.dispatchEvent(new CustomEvent('resparkStaffUpdated', { detail: inMemoryStaff }));
};

const DAY_MAP = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const toBackendWeeklyOff = (dayName) => {
  const norm = String(dayName || 'monday').toLowerCase();
  const dayIndex = DAY_MAP[norm] !== undefined ? DAY_MAP[norm] : 1;
  return [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    dayOfWeek: day,
    isWeeklyOff: day === dayIndex,
  }));
};

/**
 * Creates a staff member both in local storage (instant UI) and persists to PostgreSQL backend
 */
export const addStaffMember = async (staffData) => {
  const fullName = `${staffData.firstName || ''} ${staffData.lastName || ''}`.trim() || staffData.name?.trim() || 'Staff';
  const nameParts = fullName.split(' ');
  const tempId = staffData.id || `staff_${Date.now()}`;
  const empNo = staffData.empNo || `EMP-${Date.now().toString().slice(-4)}`;
  const desig = staffData.designation?.trim() || staffData.position?.trim() || 'Stylist';
  const firstName = (staffData.firstName?.trim() || nameParts[0] || 'Staff').trim();
  const lastName = (staffData.lastName?.trim() || nameParts.slice(1).join(' ') || '.').trim();
  const mobile = (staffData.mobile || staffData.phone || '9999999999').trim();

  const newStaff = {
    ...staffData,
    id: tempId,
    name: fullName,
    firstName,
    lastName,
    phone: mobile,
    mobile,
    empNo,
    position: desig,
    designation: desig,
    role: 'Stylist',
    active: staffData.active !== undefined ? staffData.active : true,
    weeklyOff: staffData.weeklyOff || 'Monday',
  };

  // 1. Optimistic UI update
  if (tempId && Array.isArray(staffData.workExperience) && staffData.workExperience.length > 0) {
    setStoredStaffExperience(tempId, staffData.workExperience);
  }
  const currentList = getMasterStaff();
  const optimistic = [newStaff, ...currentList.filter(s => String(s.id) !== String(tempId))];
  saveMasterStaff(optimistic);

  // 2. Persist to PostgreSQL backend via staffApi
  try {
    const expPayload = Array.isArray(staffData.workExperience) && staffData.workExperience.length > 0
      ? `EXP_DATA:${JSON.stringify({ exp: staffData.workExperience, addr: staffData.address || '' })}`
      : (staffData.address || undefined);

    const payload = {
      personalDetails: {
        firstName,
        lastName,
        displayName: fullName,
        mobile,
        email: staffData.email?.trim() || undefined,
        gender: staffData.gender || 'Male',
        dob: staffData.dob || undefined,
        address: expPayload,
      },
      joiningDetails: {
        joiningDate: staffData.joiningDate || new Date().toISOString().split('T')[0],
        designationId: desig,
        employeeNumber: empNo,
        reportingToId: staffData.reportingTo || undefined,
        workingHours: staffData.workingHours || '9',
      },
      documents: Array.isArray(staffData.documents) ? staffData.documents.map(d => ({
        documentType: d.type || d.documentType || 'Identity Proof',
        documentNumber: d.number || d.documentNumber || '',
        documentUrl: d.url || d.documentUrl || 'https://placeholder.internal/doc',
      })) : [],
      bankDetails: {
        bankName: staffData.bankName || 'General Bank',
        branch: staffData.branch || 'Main',
        accountNumber: staffData.accountNumber || '0000000000',
        ifsc: staffData.ifsc || 'BANK0000001',
      },
      appointmentSettings: {
        enableAppointments: staffData.enableAppointments !== undefined ? staffData.enableAppointments : true,
        showAllAppointments: staffData.showAppointmentsInDashboard !== undefined ? staffData.showAppointmentsInDashboard : true,
      },
      weeklySchedule: toBackendWeeklyOff(staffData.weeklyOff),
    };

    const res = await staffApi.createStaff(payload);
    if (res?.success && res?.data?.id) {
      if (Array.isArray(staffData.workExperience) && staffData.workExperience.length > 0) {
        setStoredStaffExperience(res.data.id, staffData.workExperience);
      }
      const persisted = mapBackendStaffToFrontend(res.data);
      if ((!persisted.workExperience || persisted.workExperience.length === 0) && staffData.workExperience?.length > 0) {
        persisted.workExperience = staffData.workExperience;
      }
      const liveList = getMasterStaff();
      const replaced = liveList.map(s => String(s.id) === String(tempId) ? persisted : s);
      saveMasterStaff(replaced);
      return replaced;
    }
  } catch (err) {
    console.error('Backend staff creation failed:', err);
    throw err;
  }

  return optimistic;
};

/**
 * Updates an existing staff member in local storage and persists to PostgreSQL backend
 */
export const updateStaffMember = async (staffId, updatedFields) => {
  if (staffId && updatedFields.workExperience !== undefined) {
    setStoredStaffExperience(staffId, updatedFields.workExperience);
  }

  const currentList = getMasterStaff();
  const fullName = `${updatedFields.firstName || ''} ${updatedFields.lastName || ''}`.trim() || updatedFields.name?.trim();
  const desig = updatedFields.designation?.trim() || updatedFields.position?.trim() || 'Stylist';

  const updated = currentList.map(s => {
    if (String(s.id) === String(staffId)) {
      return {
        ...s,
        ...updatedFields,
        ...(fullName ? { name: fullName } : {}),
        phone: updatedFields.mobile || updatedFields.phone || s.phone,
        mobile: updatedFields.mobile || updatedFields.phone || s.mobile,
        position: desig,
        designation: desig,
      };
    }
    return s;
  });

  saveMasterStaff(updated);

  // If staff has a UUID in PostgreSQL, update backend
  const isUuid = /^[0-9a-fA-F-]{36}$/.test(String(staffId));
  if (isUuid) {
    (async () => {
      try {
        const expPayload = updatedFields.workExperience !== undefined
          ? (Array.isArray(updatedFields.workExperience) && updatedFields.workExperience.length > 0
              ? `EXP_DATA:${JSON.stringify({ exp: updatedFields.workExperience, addr: updatedFields.address || '' })}`
              : (updatedFields.address || ''))
          : (updatedFields.address !== undefined ? updatedFields.address : undefined);

        const payload = {
          personalDetails: {
            ...(updatedFields.firstName ? { firstName: updatedFields.firstName } : {}),
            ...(updatedFields.lastName ? { lastName: updatedFields.lastName } : {}),
            ...(fullName ? { displayName: fullName } : {}),
            ...(updatedFields.mobile ? { mobile: updatedFields.mobile } : {}),
            ...(updatedFields.email !== undefined ? { email: updatedFields.email } : {}),
            ...(updatedFields.gender ? { gender: updatedFields.gender } : {}),
            ...(updatedFields.dob ? { dob: updatedFields.dob } : {}),
            ...(expPayload !== undefined ? { address: expPayload } : {}),
          },
          joiningDetails: {
            ...(desig ? { designationId: desig } : {}),
            ...(updatedFields.empNo ? { employeeNumber: updatedFields.empNo } : {}),
            ...(updatedFields.workingHours ? { workingHours: updatedFields.workingHours } : {}),
            ...(updatedFields.joiningDate ? { joiningDate: updatedFields.joiningDate } : {}),
            ...(updatedFields.reportingTo !== undefined ? { reportingToId: updatedFields.reportingTo } : {}),
          },
          ...(updatedFields.documents !== undefined ? {
            documents: Array.isArray(updatedFields.documents) ? updatedFields.documents.map(d => ({
              documentType: d.type || d.documentType || 'Identity Proof',
              documentNumber: d.number || d.documentNumber || '',
              documentUrl: d.url || d.documentUrl || 'https://placeholder.internal/doc',
            })) : []
          } : {}),
          bankDetails: {
            ...(updatedFields.bankName ? { bankName: updatedFields.bankName } : {}),
            ...(updatedFields.branch ? { branch: updatedFields.branch } : {}),
            ...(updatedFields.accountNumber ? { accountNumber: updatedFields.accountNumber } : {}),
            ...(updatedFields.ifsc ? { ifsc: updatedFields.ifsc } : {}),
          },
          appointmentSettings: {
            ...(updatedFields.enableAppointments !== undefined ? { enableAppointments: updatedFields.enableAppointments } : {}),
            ...(updatedFields.showAppointmentsInDashboard !== undefined ? { showAllAppointments: updatedFields.showAppointmentsInDashboard } : {}),
          },
          ...(updatedFields.weeklyOff ? { weeklySchedule: toBackendWeeklyOff(updatedFields.weeklyOff) } : {}),
        };
        await staffApi.updateStaff(staffId, payload);
      } catch (err) {
        console.warn('Backend staff update failed:', err);
      }
    })();
  }

  return updated;
};

/**
 * Toggles staff active status in local storage and backend
 */
export const toggleStaffStatusInBackend = async (staffId, newStatus) => {
  const isUuid = /^[0-9a-fA-F-]{36}$/.test(String(staffId));
  if (isUuid) {
    try {
      await staffApi.updateStaffStatus(staffId, newStatus);
    } catch (err) {
      console.warn('Failed to update staff status in backend:', err);
    }
  }
};

/**
 * Deletes staff member from local storage and backend PostgreSQL
 */
export const deleteStaffMember = async (staffId) => {
  const currentList = getMasterStaff();
  const updated = currentList.filter(s => String(s.id) !== String(staffId));
  saveMasterStaff(updated);

  delete inMemoryWorkExpMap[staffId];

  const isUuid = /^[0-9a-fA-F-]{36}$/.test(String(staffId));
  if (isUuid) {
    try {
      await staffApi.deleteStaff(staffId);
    } catch (err) {
      console.warn('Backend delete staff failed:', err);
    }
  }
  return updated;
};

/**
 * Syncs staff from PostgreSQL backend into localStorage and fires update event
 */
export const syncStaffFromBackend = async () => {
  try {
    const res = await staffApi.getStaffList({ limit: 100 });
    hasFetchedStaffFromBackend = true;
    if (res?.success && Array.isArray(res?.data?.items)) {
      const backendStaff = res.data.items.map(mapBackendStaffToFrontend);
      saveMasterStaff(backendStaff);
      return backendStaff;
    }
  } catch (err) {
    console.warn('syncStaffFromBackend failed, keeping local staff:', err);
  }
  return getMasterStaff();
};



