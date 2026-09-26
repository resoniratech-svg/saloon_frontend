import { getActiveTenantId } from './saasStorage';

const getOrderStorageKey = () => `respark_orders_${getActiveTenantId()}`;

export const initialOrdersGlamour = [
  {
    id: '2',
    invoiceId: '2',
    invoiceNo: '2',
    date: '2026-09-18',
    dateDisplay: '18-Sep-2026',
    time: '12:34 PM',
    guest: { 
      name: 'Bhanu Pratap', 
      mobile: '+91 987554321', 
      email: 'bhanu@gmail.com',
      dob: 'Sep 18',
      anniversaryDate: 'Sep 10',
      lastVisited: 'Sep 18',
      adv: 'NA',
      membership: 'NA',
      dueBal: 'NA',
      package: 'NA'
    },
    items: [
      { id: 's1', name: 'Hair Cut', price: 800, qty: 1, staff: 'Swati R', discPercent: '', discAmount: '' }
    ],
    subTotal: 800,
    discount: 0,
    grandTotal: 800,
    paymentMethod: 'Cash',
    payments: [{ method: 'Cash', amount: 800 }],
    status: 'Completed',
    orderType: 'Pickup',
  },
  {
    id: '3',
    invoiceId: '3',
    invoiceNo: '3',
    date: '2026-09-18',
    dateDisplay: '18-Sep-2026',
    time: '11:15 AM',
    guest: { name: 'Priya Sharma', mobile: '+91 9822012345', email: 'priya@gmail.com' },
    items: [
      { id: 's2', name: 'Blow Dry', price: 250, qty: 1, staff: 'Akshay D', discPercent: 0, discAmount: 0 },
      { id: 's3', name: 'Hair Spa Loreal', price: 1200, qty: 1, staff: 'Madhu G', discPercent: 10, discAmount: 120 }
    ],
    subTotal: 1450,
    discount: 120,
    grandTotal: 1330,
    paymentMethod: 'GPay',
    payments: [{ method: 'GPay', amount: 1330 }],
    status: 'New',
  }
];

export const initialOrdersNaturals = [
  {
    id: '101',
    invoiceId: '101',
    invoiceNo: '101',
    date: '2026-09-18',
    dateDisplay: '18-Sep-2026',
    time: '10:00 AM',
    guest: { name: 'Kavita Patel', mobile: '+91 9876500001', email: 'kavita@naturals.in' },
    items: [
      { id: 'ns1', name: 'Ayurvedic Scalp & Hair Therapy', price: 1200, qty: 1, staff: 'Ramesh K', discPercent: 0, discAmount: 0 }
    ],
    subTotal: 1200,
    discount: 0,
    grandTotal: 1200,
    paymentMethod: 'Cash',
    payments: [{ method: 'Cash', amount: 1200 }],
    status: 'Completed',
  }
];

export const initialOrdersEnrich = [
  {
    id: '201',
    invoiceId: '201',
    invoiceNo: '201',
    date: '2026-09-18',
    dateDisplay: '18-Sep-2026',
    time: '02:30 PM',
    guest: { name: 'Radhika Kapoor', mobile: '+91 9811122233', email: 'radhika@enrich.in' },
    items: [
      { id: 'es1', name: 'Signature Diamond Blowout', price: 1500, qty: 1, staff: 'Zoya Khan', discPercent: 0, discAmount: 0 },
      { id: 'es2', name: 'Keratin Smoothing Therapy', price: 5500, qty: 1, staff: 'Devraj Singh', discPercent: 500, discAmount: 500 }
    ],
    subTotal: 7000,
    discount: 500,
    grandTotal: 6500,
    paymentMethod: 'Card',
    payments: [{ method: 'Card', amount: 6500 }],
    status: 'Completed',
  }
];

export const getOrders = () => {
  const tenantId = getActiveTenantId();
  const storageKey = getOrderStorageKey();

  try {
    let data = localStorage.getItem(storageKey);

    // Auto-migrate legacy key for Glamour
    if (!data && tenantId === 'tenant_glamour') {
      const legacy = localStorage.getItem('respark_pos_orders');
      if (legacy) {
        localStorage.setItem(storageKey, legacy);
        data = legacy;
      }
    }

    if (!data) {
      let initial = initialOrdersGlamour;
      if (tenantId === 'tenant_naturals') initial = initialOrdersNaturals;
      else if (tenantId === 'tenant_enrich') initial = initialOrdersEnrich;
      else if (tenantId !== 'tenant_glamour') initial = [];

      localStorage.setItem(storageKey, JSON.stringify(initial));
      return initial;
    }

    const parsed = JSON.parse(data);

    // Read appointments for this tenant to cross-sync any order whose appointment was paid (e.g. at reception or via Card)
    let appointments = [];
    try {
      const apptRaw = localStorage.getItem(`respark_appointments_${tenantId}`);
      if (apptRaw) appointments = JSON.parse(apptRaw);
    } catch (e) {}

    let needsStorageWrite = false;

    // Normalize pure product / package orders & cross-sync settled appointment payments
    const normalized = parsed.map(o => {
      let currentOrder = { ...o };
      const hasServices = (currentOrder.items || []).some(i => (i.itemType === 'service' || (!i.itemType && i.category !== 'PACKAGE' && i.category !== 'MEMBERSHIP' && i.category !== 'PRODUCT')) && i.itemType !== 'product' && i.itemType !== 'disposable' && i.itemType !== 'package' && i.itemType !== 'membership');
      if (!hasServices && (currentOrder.items || []).length > 0) {
        if (currentOrder.status === 'Waiting' || currentOrder.status === 'In Progress') {
          const isPaid = currentOrder.paymentStatus === 'Paid' || (currentOrder.paymentMethod && currentOrder.paymentMethod !== 'Pay at Salon');
          currentOrder.status = isPaid ? 'Completed' : 'Unpaid';
        }
      }

      // If order is still marked "Pay at Salon" or "Unpaid", check if the linked appointment was paid
      if (
        (currentOrder.paymentMethod || '').toLowerCase() === 'pay at salon' || 
        currentOrder.paymentStatus === 'Unpaid'
      ) {
        const cleanPhone = (p) => String(p || '').replace(/\D/g, '');
        const oPhone = cleanPhone(currentOrder.guest?.mobile || currentOrder.guest?.phone);
        const oName = (currentOrder.guest?.name || currentOrder.customer || '').trim().toLowerCase();

        const linkedAppt = appointments.find(a => 
          (a.orderId && (String(a.orderId) === String(currentOrder.id) || String(a.orderId) === String(currentOrder.invoiceId) || String(a.orderId) === String(currentOrder.invoiceNo))) ||
          (a.invoiceId && (String(a.invoiceId) === String(currentOrder.invoiceId) || String(a.invoiceId) === String(currentOrder.id) || String(a.invoiceId) === String(currentOrder.invoiceNo))) ||
          (currentOrder.appointmentId && String(currentOrder.appointmentId) === String(a.id)) ||
          (oPhone && cleanPhone(a.mobile) && oPhone.endsWith(cleanPhone(a.mobile)) && (a.date === currentOrder.date || a.date === currentOrder.dateDisplay)) ||
          (oName && (a.guest || '').trim().toLowerCase() === oName && (a.date === currentOrder.date || a.date === currentOrder.dateDisplay))
        );

        if (linkedAppt && (linkedAppt.paymentStatus === 'Paid' || (linkedAppt.paymentMethod && linkedAppt.paymentMethod.toLowerCase() !== 'pay at salon'))) {
          const finalMethod = linkedAppt.paymentMethod || 'Card';
          currentOrder.paymentStatus = 'Paid';
          currentOrder.paymentMethod = finalMethod;
          currentOrder.payments = [{ method: finalMethod, amount: currentOrder.grandTotal ?? currentOrder.subTotal ?? linkedAppt.price ?? 0 }];
          needsStorageWrite = true;
        }
      }

      return currentOrder;
    });

    if (needsStorageWrite) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(normalized));
      } catch (e) {}
    }

    return normalized;
  } catch (err) {
    return [];
  }
};

export const saveOrder = (newOrder) => {
  const storageKey = getOrderStorageKey();
  try {
    const orders = getOrders();
    const existingIndex = orders.findIndex(
      o => String(o.id) === String(newOrder.id) || String(o.invoiceId) === String(newOrder.invoiceId)
    );
    let updated;
    if (existingIndex >= 0) {
      updated = [...orders];
      updated[existingIndex] = { ...updated[existingIndex], ...newOrder };
    } else {
      updated = [newOrder, ...orders];
    }
    localStorage.setItem(storageKey, JSON.stringify(updated));
    window.dispatchEvent(new Event('ordersUpdated'));
    return updated;
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const getNextInvoiceId = () => {
  try {
    const orders = getOrders();
    const numericIds = orders
      .map(o => parseInt(o.invoiceId || o.id, 10))
      .filter(n => !isNaN(n));
    const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 1;
    return String(maxId + 1);
  } catch (err) {
    return String(Date.now()).slice(-4);
  }
};

export const updateOrder = (orderId, updates) => {
  const storageKey = getOrderStorageKey();
  try {
    const orders = getOrders();
    const updated = orders.map(o => 
      (String(o.id) === String(orderId) || String(o.invoiceId) === String(orderId) || String(o.invoiceNo) === String(orderId))
        ? { ...o, ...updates }
        : o
    );
    localStorage.setItem(storageKey, JSON.stringify(updated));
    window.dispatchEvent(new Event('ordersUpdated'));
    return updated;
  } catch (err) {
    return [];
  }
};

export const updateOrderStatus = (orderId, newStatus) => {
  return updateOrder(orderId, { status: newStatus });
};

export const cancelOrderInStore = (orderId) => {
  const storageKey = getOrderStorageKey();
  try {
    const orders = getOrders();
    const updated = orders.map(o => String(o.id) === String(orderId) ? { ...o, status: 'Rejected' } : o);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    window.dispatchEvent(new Event('ordersUpdated'));
    return updated;
  } catch (err) {
    return [];
  }
};

export const deleteOrderInStore = (orderId) => {
  const storageKey = getOrderStorageKey();
  try {
    const orders = getOrders();
    const updated = orders.filter(o => String(o.id) !== String(orderId) && String(o.invoiceId) !== String(orderId));
    localStorage.setItem(storageKey, JSON.stringify(updated));
    window.dispatchEvent(new Event('ordersUpdated'));
    return updated;
  } catch (err) {
    return [];
  }
};
