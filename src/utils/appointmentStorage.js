import { getActiveTenantId } from './saasStorage';

const getAppointmentStorageKey = () => `respark_appointments_${getActiveTenantId()}`;

export const initialAppointmentsGlamour = [
  {
    id: 1,
    guest: 'Prakash',
    mobile: '+91 9876543210',
    service: 'Hair Cut (With Shampoo)',
    price: 200,
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
    staff: 'Respark Trial',
    timeSlot: '09:00 AM',
    duration: '45 min',
    status: 'Waiting',
    date: '18-Sep-2026',
    instruction: 'Prefers scissors over trimmer'
  },
  {
    id: 2,
    guest: 'Suhani',
    mobile: '+91 9876500002',
    service: 'Hair Spa Loreal',
    price: 1200,
    paymentMethod: 'Pay at Salon',
    paymentStatus: 'Unpaid',
    staff: 'Sohum K',
    timeSlot: '11:30 AM',
    duration: '60 min',
    status: 'In Progress',
    date: '18-Sep-2026',
    instruction: 'Requested organic shampoo'
  },
  {
    id: 3,
    guest: 'Amit',
    mobile: '+91 9811122234',
    service: 'Facial Premium',
    price: 1200,
    paymentMethod: 'GPay',
    paymentStatus: 'Paid',
    staff: 'Swati R',
    timeSlot: '08:30 AM',
    duration: '45 min',
    status: 'Completed',
    date: '18-Sep-2026',
    instruction: 'Sensitive skin'
  },
  {
    id: 4,
    guest: 'Kavita Patel',
    mobile: '+91 9876500001',
    service: 'Keratin Smoothing',
    price: 3500,
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    staff: 'Akshay D',
    timeSlot: '02:00 PM',
    duration: '90 min',
    status: 'Waiting',
    date: '18-Sep-2026',
    instruction: 'First time smoothing'
  },
  {
    id: 5,
    guest: 'Radhika Kapoor',
    mobile: '+91 9811122233',
    service: 'Manicure & Pedicure Deluxe',
    price: 1100,
    paymentMethod: 'Pay at Salon',
    paymentStatus: 'Unpaid',
    staff: 'Madhu G',
    timeSlot: '04:00 PM',
    duration: '60 min',
    status: 'In Progress',
    date: '18-Sep-2026',
    instruction: 'VIP member request'
  }
];

export const getAppointments = () => {
  const key = getAppointmentStorageKey();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initialAppointmentsGlamour));
      return initialAppointmentsGlamour;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load appointments from storage:', err);
    return initialAppointmentsGlamour;
  }
};

export const saveAppointment = (appointment) => {
  const appointments = getAppointments();
  const newAppt = {
    ...appointment,
    id: appointment.id || Date.now()
  };
  const updated = [newAppt, ...appointments];
  localStorage.setItem(getAppointmentStorageKey(), JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('appointmentsUpdated'));
  return newAppt;
};

export const updateAppointment = (id, updates) => {
  const appointments = getAppointments();
  const updated = appointments.map(a => a.id === id ? { ...a, ...updates } : a);
  localStorage.setItem(getAppointmentStorageKey(), JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('appointmentsUpdated'));
  return updated;
};

export const deleteAppointment = (id) => {
  const appointments = getAppointments();
  const updated = appointments.filter(a => a.id !== id);
  localStorage.setItem(getAppointmentStorageKey(), JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('appointmentsUpdated'));
  return updated;
};
