// ============================
// MOCK DATA FOR SALON SOFTWARE
// ============================

export const serviceCategories = [
  { id: 'hair', label: 'HAIR' },
  { id: 'hair2', label: 'HAIR' },
  { id: 'skin', label: 'SKIN' },
  { id: 'mani-pedi', label: 'MANI & PEDI' },
  { id: 'bride', label: 'BRIDE' },
  { id: 'package', label: 'PACKAGE' },
];

export const services = {
  'Hair Cut & Style': [
    { id: 1, name: 'Hair Cut', price: 800 },
    { id: 2, name: 'Trimming', price: 300 },
    { id: 3, name: 'Hair Splitents', price: 450 },
    { id: 4, name: 'Blow Dry', price: 250 },
    { id: 5, name: 'Hair Pressing', price: 350 },
    { id: 6, name: 'Only Shampoo', price: 250 },
  ],
  'Hair Spa': [
    { id: 7, name: 'Hair Spa Normal', price: 1000 },
    { id: 8, name: 'Hair Spa Loreal', price: 1200 },
    { id: 9, name: 'Hair Spa Treatment', price: 1500 },
  ],
  'Hair Color': [
    { id: 10, name: 'Global Color', price: 2000 },
    { id: 11, name: 'Highlights', price: 2500 },
    { id: 12, name: 'Root Touch Up', price: 800 },
  ],
  'Skin Care': [
    { id: 13, name: 'Facial Basic', price: 600 },
    { id: 14, name: 'Facial Premium', price: 1200 },
    { id: 15, name: 'Cleanup', price: 400 },
    { id: 16, name: 'Bleach', price: 350 },
  ],
  'Mani & Pedi': [
    { id: 17, name: 'Manicure', price: 500 },
    { id: 18, name: 'Pedicure', price: 600 },
    { id: 19, name: 'Gel Nails', price: 1500 },
  ],
};

export const staffMembers = [
  { id: 1, name: 'Respark Trial' },
  { id: 2, name: 'Sohum K' },
  { id: 3, name: 'Swati R' },
  { id: 4, name: 'Akshay D' },
  { id: 5, name: 'Madhu G' },
];

export const customers = [
  {
    id: 1,
    mobile: '+91 9876543210',
    name: 'Nisha J',
    gender: 'Female',
    lastVisited: '18-Sep-2026',
    totalOrders: 1,
    totalPurchaseAmount: 800,
    averagePurchaseAmount: 800,
    onlineVisits: '-',
    loyalty: '-',
    referralCode: '-',
    advance: 0,
    balance: 0,
    membershipCount: '-',
    email: 'nj@gmail.com',
    birthDate: '18-Sep-2026',
    anniversary: '10-Sep-2026',
  },
  {
    id: 2,
    mobile: '+91 9123456789',
    name: 'Bhanu',
    gender: 'Male',
    lastVisited: '10-Sep-2026',
    totalOrders: 1,
    totalPurchaseAmount: 2000,
    averagePurchaseAmount: 2000,
    onlineVisits: '-',
    loyalty: '-',
    referralCode: '-',
    advance: 0,
    balance: 0,
    membershipCount: '-',
    email: '-',
    birthDate: '08-Sep-2026',
    anniversary: '09-Sep-2026',
  },
  {
    id: 3,
    mobile: '+91 9988776655',
    name: 'Priya Sharma',
    gender: 'Female',
    lastVisited: '15-Sep-2026',
    totalOrders: 5,
    totalPurchaseAmount: 8500,
    averagePurchaseAmount: 1700,
    onlineVisits: 3,
    loyalty: 'Gold',
    referralCode: 'REF001',
    advance: 0,
    balance: 0,
    membershipCount: '-',
    email: 'priya@gmail.com',
    birthDate: '12-Aug-1995',
    anniversary: '20-Nov-2021',
  },
  {
    id: 4,
    mobile: '+91 9811223344',
    name: 'Rahul M',
    gender: 'Male',
    lastVisited: '12-Sep-2026',
    totalOrders: 3,
    totalPurchaseAmount: 4200,
    averagePurchaseAmount: 1400,
    onlineVisits: 1,
    loyalty: 'Silver',
    referralCode: '-',
    advance: 0,
    balance: 0,
    membershipCount: '-',
    email: 'rahul.m@gmail.com',
    birthDate: '05-May-1992',
    anniversary: '-',
  },
];

export const sidebarMenuItems = [
  { id: 'backoffice', label: 'BACKOFFICE', hasChildren: true },
  { id: 'settings', label: 'SETTINGS', hasChildren: true },
  { id: 'expenses', label: 'EXPENSES', hasChildren: true },
  { id: 'campaign', label: 'CAMPAIGN', hasChildren: true },
];

export const timeSlots = [
  '08:00 AM', '08:30 AM',
  '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM',
  '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM',
  '07:00 PM', '07:30 PM',
  '08:00 PM',
];

export const paymentMethods = [
  { id: 'cash', label: 'Cash', icon: '💵' },
  { id: 'card', label: 'Card', icon: '💳' },
  { id: 'hdfc', label: 'HDFC', icon: '🏦' },
  { id: 'gpay', label: 'GPay', icon: '📱' },
  { id: 'phonepay', label: 'Phone Pay', icon: '📲' },
];
