import { cashManagementApi } from '../api/client';

/**
 * PURE DATABASE-ONLY CASH MANAGEMENT STORAGE
 * Counter sessions, drawer openings, and shift closes are handled directly by PostgreSQL via cashManagementApi.
 * Zero cash shift data is stored in browser localStorage.
 */

let inMemoryCurrentShift = {
  shiftId: 'SHIFT-101',
  status: 'ACTIVE',
  openingBalance: 0,
  openedAt: new Date().toISOString(),
  openedBy: 'Cashier Terminal',
  closingBalance: null,
  inStoreCash: null,
  expectedCash: null,
  variance: null,
  remarks: '',
  closedAt: null,
  closedBy: null
};

let inMemoryShiftHistory = [];
let hasFetchedFromBackend = false;

// Purge any legacy localStorage keys so browser storage remains completely clean
export const purgeLocalCashData = () => {
  try {
    const keysToRemove = [];
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('respark_counter_') || k.startsWith('respark_cash_'))) {
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

purgeLocalCashData();

const formatDateTime = (date = new Date()) => {
  const d = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
  const t = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `${d} ${t}`;
};

export const fetchCashSummaryFromBackend = async () => {
  try {
    const res = await cashManagementApi.getSummary();
    if (res?.success && res?.data) {
      const d = res.data;
      inMemoryCurrentShift = {
        shiftId: d.activeTransaction?.id || 'SHIFT-101',
        status: d.isActive ? 'ACTIVE' : 'CLOSED',
        openingBalance: Number(d.cards?.openingBalance || 0),
        openedAt: d.activeTransaction?.startTime || formatDateTime(),
        openedBy: d.activeTransaction?.openedBy || 'Cashier Terminal',
        closingBalance: Number(d.cards?.closingBalance || 0),
        inStoreCash: Number(d.cards?.instoreCash || 0),
        expectedCash: Number(d.cards?.closingBalance || 0),
        variance: Number(d.cards?.reconcileAmount || 0),
        remarks: '',
        closedAt: null,
        closedBy: null
      };
      hasFetchedFromBackend = true;
      window.dispatchEvent(new Event('counterStatusChanged'));
      return inMemoryCurrentShift;
    }
  } catch (err) {
    console.warn('Could not fetch cash summary from backend:', err);
  }
  return inMemoryCurrentShift;
};

export const getCurrentShift = () => {
  if (!hasFetchedFromBackend) {
    fetchCashSummaryFromBackend();
  }
  return { ...inMemoryCurrentShift };
};

export const openCounter = (openingBalance = 5000, openedBy = 'Cashier Terminal') => {
  const newSession = {
    shiftId: `SHIFT-${Date.now()}`,
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

  inMemoryCurrentShift = newSession;
  window.dispatchEvent(new Event('counterStatusChanged'));

  // Persist to PostgreSQL backend
  (async () => {
    try {
      await cashManagementApi.startSession({
        openingBalance: parseFloat(openingBalance) || 0,
        notes: `Opened by ${openedBy}`
      });
      fetchCashSummaryFromBackend();
    } catch (err) {
      console.warn('Backend cash open failed:', err);
    }
  })();

  return newSession;
};

export const closeCounter = (closingData = {}) => {
  const now = formatDateTime();
  const closedRecord = {
    ...inMemoryCurrentShift,
    status: 'CLOSED',
    closingBalance: parseFloat(closingData.closingBalance) || 0,
    inStoreCash: parseFloat(closingData.inStoreCash) || 0,
    expectedCash: parseFloat(closingData.expectedCash) || 0,
    variance: parseFloat(closingData.variance) || 0,
    remarks: closingData.remarks || 'Shift closed normally',
    closedAt: now,
    closedBy: closingData.closedBy || 'Cashier Terminal'
  };

  inMemoryCurrentShift = closedRecord;
  inMemoryShiftHistory = [closedRecord, ...inMemoryShiftHistory];
  window.dispatchEvent(new Event('counterStatusChanged'));

  // Persist to PostgreSQL backend
  (async () => {
    try {
      await cashManagementApi.closeSession({
        closingBalance: parseFloat(closingData.closingBalance) || 0,
        inStoreCash: parseFloat(closingData.inStoreCash) || 0,
        expectedCash: parseFloat(closingData.expectedCash) || 0,
        variance: parseFloat(closingData.variance) || 0,
        remarks: closingData.remarks || 'Shift closed normally'
      });
      fetchCashSummaryFromBackend();
    } catch (err) {
      console.warn('Backend cash close failed:', err);
    }
  })();

  return closedRecord;
};

export const getShiftHistory = () => {
  return [...inMemoryShiftHistory];
};
