import { getActiveTenantId } from './saasStorage';

const getCounterSessionKey = () => `respark_counter_session_${getActiveTenantId()}`;
const getCounterHistoryKey = () => `respark_counter_history_${getActiveTenantId()}`;

const formatDateTime = (date = new Date()) => {
  const d = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
  const t = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `${d} ${t}`;
};

export const defaultCounterSession = {
  shiftId: 'SHIFT-101',
  status: 'ACTIVE', // 'ACTIVE' | 'CLOSED'
  openingBalance: 5000,
  openedAt: '26-Sep-2026 09:00 AM',
  openedBy: 'Cashier Terminal 1',
  closingBalance: null,
  inStoreCash: null,
  expectedCash: null,
  variance: null,
  remarks: '',
  closedAt: null,
  closedBy: null
};

export const initialShiftHistoryGlamour = [
  {
    shiftId: 'SHIFT-100',
    status: 'CLOSED',
    openingBalance: 5000,
    cashSales: 4200,
    cashExpenses: 700,
    expectedCash: 8500,
    closingBalance: 8500,
    inStoreCash: 3500,
    variance: 0,
    remarks: 'Previous day closed on tally with salon manager',
    openedAt: '25-Sep-2026 09:00 AM',
    openedBy: 'Cashier Terminal 1',
    closedAt: '25-Sep-2026 09:30 PM',
    closedBy: 'Cashier Terminal 1'
  }
];

export const getCurrentShift = () => {
  try {
    const key = getCounterSessionKey();
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(defaultCounterSession));
      return { ...defaultCounterSession };
    }
    return JSON.parse(data);
  } catch (err) {
    return { ...defaultCounterSession };
  }
};

export const openCounter = (openingBalance = 5000, openedBy = 'Cashier Terminal') => {
  const key = getCounterSessionKey();
  try {
    const prev = getCurrentShift();
    const prevNum = parseInt((prev?.shiftId || 'SHIFT-100').replace(/\D/g, ''), 10) || 100;
    const nextShiftId = `SHIFT-${prevNum + 1}`;

    const newSession = {
      shiftId: nextShiftId,
      status: 'ACTIVE',
      openingBalance: parseFloat(openingBalance) || 0,
      openedAt: formatDateTime(),
      openedBy: openedBy || 'Cashier Terminal',
      closingBalance: null,
      inStoreCash: null,
      expectedCash: null,
      variance: null,
      remarks: '',
      closedAt: null,
      closedBy: null
    };

    localStorage.setItem(key, JSON.stringify(newSession));
    window.dispatchEvent(new Event('counterStatusChanged'));
    return newSession;
  } catch (err) {
    return defaultCounterSession;
  }
};

export const closeCounter = (closingData = {}) => {
  const sessionKey = getCounterSessionKey();
  const historyKey = getCounterHistoryKey();
  try {
    const current = getCurrentShift();
    const now = formatDateTime();

    const closedRecord = {
      ...current,
      status: 'CLOSED',
      closingBalance: parseFloat(closingData.closingBalance) || 0,
      inStoreCash: parseFloat(closingData.inStoreCash) || 0,
      expectedCash: parseFloat(closingData.expectedCash) || 0,
      variance: parseFloat(closingData.variance) || 0,
      remarks: closingData.remarks || 'Shift closed normally',
      closedAt: now,
      closedBy: closingData.closedBy || 'Cashier Terminal'
    };

    // 1. Update active session
    localStorage.setItem(sessionKey, JSON.stringify(closedRecord));

    // 2. Archive to shift history
    const history = getShiftHistory();
    const updatedHistory = [closedRecord, ...history];
    localStorage.setItem(historyKey, JSON.stringify(updatedHistory));

    window.dispatchEvent(new Event('counterStatusChanged'));
    return closedRecord;
  } catch (err) {
    return null;
  }
};

export const getShiftHistory = () => {
  const key = getCounterHistoryKey();
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(initialShiftHistoryGlamour));
      return initialShiftHistoryGlamour;
    }
    return JSON.parse(data);
  } catch (err) {
    return initialShiftHistoryGlamour;
  }
};
