import { getActiveTenantId } from './saasStorage';
import { posApi } from '../api/client';
import { getMasterStaff } from './staffStorage';

/**
 * PURE DATABASE-ONLY ORDER STORAGE
 * All orders are saved and loaded directly from PostgreSQL database via posApi.
 * Zero orders are stored in browser localStorage.
 */

// In-memory runtime cache for instantaneous UI rendering
let inMemoryOrders = [];
let hasFetchedFromBackend = false;

// Purge any legacy localStorage order keys so browser storage remains completely clean
export const purgeLocalOrders = () => {
  try {
    const keysToRemove = [
      'respark_pos_orders',
      'respark_orders_tenant_glamour',
      'respark_orders_tenant_naturals',
      'respark_orders_tenant_enrich',
      'respark_orders_fea51c8e-0fd1-4b33-9134-074b90a84534',
    ];
    const activeTenantId = getActiveTenantId();
    if (activeTenantId) {
      keysToRemove.push(`respark_orders_${activeTenantId}`);
    }
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (err) {
    // Ignore storage errors
  }
};

// Immediately execute cleanup
purgeLocalOrders();

/**
 * Maps a PostgreSQL posOrder record into the frontend order format
 */
export const mapBackendOrderToFrontend = (b) => {
  const allItems = Array.isArray(b.items) ? b.items : [];
  const paymentsList = Array.isArray(b.payments) ? b.payments : [];

  return {
    id: b.id,
    backendId: b.id,
    orderNumber: b.orderNumber,
    invoiceId: b.orderNumber,
    invoiceNo: b.orderNumber,
    date: b.orderDate ? b.orderDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    dateDisplay: b.orderDate
      ? new Date(b.orderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '',
    time: b.createdAt
      ? new Date(b.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : '',
    guest: {
      id: b.guest?.id,
      name: b.guest?.name || 'Walk-in Guest',
      mobile: b.guest?.mobile || '',
      email: b.guest?.email || '',
      gender: b.guest?.gender || 'UNSPECIFIED',
    },
    items: allItems.map((i) => ({
      id: i.id,
      name: i.itemName,
      price: Number(i.unitPrice || 0),
      qty: i.quantity || 1,
      staff: i.staff?.name || '',
      discAmount: Number(i.discountAmount || 0),
      itemType: (i.itemType || 'SERVICE').toLowerCase(),
      category: i.itemCategory || undefined,
    })),
    subTotal: Number(b.subtotal || b.totalAmount || 0),
    discount: Number(b.discountAmount || 0),
    grandTotal: Number(b.totalAmount || 0),
    paymentMethod: (b.paymentStatus === 'UNPAID' || b.paymentMethod === 'PAY AT SALON') ? 'Pay at Salon' : (b.paymentMethod || 'Cash'),
    paymentStatus: (b.paymentStatus === 'UNPAID' || b.paymentMethod === 'PAY AT SALON') ? 'Unpaid' : (b.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid'),
    payments: paymentsList.map((p) => ({ method: p.method, amount: Number(p.amount) })),
    packageRedemptions: allItems
      .filter((i) => i.itemCategory === 'PACKAGE_REDEMPTION' || (i.itemName && String(i.itemName).toLowerCase().startsWith('redemption:')))
      .map((i) => ({
        packageName: String(i.itemName).replace(/^redemption:\s*/i, '').trim(),
        sessionsUsed: Number(i.quantity) || 1,
      })),
    status: b.status === 'COMPLETED' ? 'Completed' : b.status === 'CANCELLED' ? 'Cancelled' : 'New',
    orderType: 'POS',
    instruction: b.instruction || '',
    notes: b.notes || '',
    timeSlot: (b.notes && b.notes.match(/Slot:\s*([0-9]{1,2}:[0-9]{2}(?:\s*[AP]M)?)/i)) 
      ? b.notes.match(/Slot:\s*([0-9]{1,2}:[0-9]{2}(?:\s*[AP]M)?)/i)[1].trim() 
      : undefined,
  };
};

/**
 * Fetches all orders directly from PostgreSQL database via posApi
 */
export const syncOrdersFromBackend = async () => {
  try {
    purgeLocalOrders();
    const res = await posApi.getOrders({ limit: 100 });
    const items = Array.isArray(res?.data?.data) 
      ? res.data.data 
      : (Array.isArray(res?.data?.items) ? res.data.items : (Array.isArray(res?.data) ? res.data : []));
    if (res?.success) {
      const backendOrders = items.map(mapBackendOrderToFrontend);
      inMemoryOrders = backendOrders;
      hasFetchedFromBackend = true;
      window.dispatchEvent(new Event('ordersUpdated'));
      return inMemoryOrders;
    }
  } catch (err) {
    console.warn('syncOrdersFromBackend note:', err);
  }
  return inMemoryOrders;
};

/**
 * Returns current in-memory orders (synchronously) and triggers background fetch if needed
 */
export const getOrders = () => {
  purgeLocalOrders();
  if (!hasFetchedFromBackend) {
    syncOrdersFromBackend().catch(() => {});
  }
  return inMemoryOrders;
};

/**
 * Saves order directly to PostgreSQL backend database.
 * No orders are saved to localStorage.
 */
export const saveOrder = async (newOrder) => {
  purgeLocalOrders();

  const isUuid = (str) => typeof str === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

  const guest = newOrder.guest;
  const guestId = guest && isUuid(guest.id) ? guest.id : undefined;

  const cleanEmail = (guest?.email && guest.email.includes('@') && guest.email.trim() !== '-')
    ? guest.email.trim()
    : undefined;

  const cleanDob = (guest?.dob && /^\d{4}-\d{2}-\d{2}$/.test(guest.dob))
    ? guest.dob
    : undefined;

  let cleanGender = 'UNSPECIFIED';
  if (guest?.gender) {
    const g = String(guest.gender).toUpperCase();
    if (g === 'MALE' || g === 'FEMALE' || g === 'OTHER') cleanGender = g;
  }

  const guestPayload = {
    name: guest?.name?.trim() || 'Walk-in Guest',
    mobile: (guest?.mobile || guest?.phone || '9999999999').replace(/[^\d+]/g, '') || '9999999999',
    email: cleanEmail,
    gender: cleanGender,
    dateOfBirth: cleanDob,
  };

  const backendItems = (newOrder.items || []).map((item) => {
    let type = 'SERVICE';
    if (item.itemType) {
      const upper = item.itemType.toUpperCase();
      if (upper === 'PACKAGE_REDEMPTION' || upper === 'REDEMPTION') {
        type = 'SERVICE'; // Recorded as service performed under package
      } else if (['SERVICE', 'PRODUCT', 'DISPOSABLE', 'PACKAGE', 'MEMBERSHIP', 'OTHER'].includes(upper)) {
        type = upper;
      }
    } else if (item.category === 'PRODUCT' || item.isProduct) {
      type = 'PRODUCT';
    } else if (item.category === 'SUPPLIES' || item.isDisposable) {
      type = 'DISPOSABLE';
    } else if (item.category === 'PACKAGE') {
      type = 'PACKAGE';
    }

    const qty = Number(item.qty || item.quantity || 1);
    const price = Number(item.price || item.unitPrice || 0);
    const disc = Number(item.discAmount || item.discountAmount || 0);

    let resolvedStaffId = isUuid(item.staffId) ? item.staffId : (isUuid(item.staff) ? item.staff : undefined);
    const cleanStaffName = String(item.staff || '').trim().toLowerCase();
    if (!resolvedStaffId && cleanStaffName && cleanStaffName !== 'unassigned' && cleanStaffName !== 'select staff' && cleanStaffName !== '—') {
      try {
        const allStaff = getMasterStaff() || [];
        const s = allStaff.find(st => (typeof st === 'object' ? st.name : st)?.trim().toLowerCase() === cleanStaffName);
        if (s && typeof s === 'object' && isUuid(s.id)) {
          resolvedStaffId = s.id;
        }
      } catch (e) {}
    }

    return {
      itemType: type,
      serviceId: isUuid(item.serviceId) ? item.serviceId : (type === 'SERVICE' && isUuid(item.id) ? String(item.id) : undefined),
      productId: isUuid(item.productId) ? item.productId : (type === 'PRODUCT' && isUuid(item.id) ? String(item.id) : undefined),
      staffId: resolvedStaffId,
      itemName: item.name || item.itemName || (type === 'SERVICE' ? 'Salon Service' : 'Salon Item'),
      itemCategory: item.category || item.itemCategory || undefined,
      quantity: Math.max(1, qty),
      unitPrice: Math.max(0, price),
      discountAmount: Math.max(0, disc),
    };
  });

  const backendMethod = String(newOrder.paymentMethod || 'Cash').toUpperCase();
  const isPayAtSalon = backendMethod.includes('SALON') || newOrder.paymentStatus === 'Unpaid';
  const isPackageRedemption = backendMethod.includes('PACKAGE') || backendMethod.includes('REDEMPTION') || Number(newOrder.grandTotal || 0) === 0;

  let normalizedMethod = 'CASH';
  if (backendMethod.includes('CARD')) normalizedMethod = 'CARD';
  else if (backendMethod.includes('GPAY') || backendMethod.includes('UPI')) normalizedMethod = 'GPAY';
  else if (backendMethod.includes('PHONE')) normalizedMethod = 'PHONEPE';
  else if (backendMethod.includes('HDFC')) normalizedMethod = 'HDFC';
  else if (isPayAtSalon) normalizedMethod = 'PAY AT SALON';
  else if (isPackageRedemption) normalizedMethod = 'OTHER';

  const orderPayload = {
    guestId,
    guest: guestPayload,
    items:
      backendItems.length > 0
        ? backendItems
        : [{ itemType: 'SERVICE', itemName: 'Salon Service', unitPrice: Number(newOrder.grandTotal || 0), quantity: 1 }],
    paymentMethod: isPayAtSalon ? 'PAY AT SALON' : normalizedMethod,
    paymentStatus: isPayAtSalon ? 'UNPAID' : (newOrder.paymentStatus === 'Unpaid' ? 'UNPAID' : 'PAID'),
    payments: isPayAtSalon ? [] : [
      {
        method: normalizedMethod,
        amount: Number(newOrder.grandTotal || 0),
      },
    ],
    status: isPayAtSalon ? 'NEW' : (newOrder.status === 'Completed' ? 'COMPLETED' : 'NEW'),
    orderDate: newOrder.date
      ? new Date(newOrder.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    instruction: newOrder.instruction || undefined,
    notes: newOrder.timeSlot 
      ? (newOrder.notes ? `${newOrder.notes} | Slot: ${newOrder.timeSlot}` : `Slot: ${newOrder.timeSlot}`) 
      : (newOrder.notes || undefined),
  };

  const res = await posApi.createOrder(orderPayload);
  if (res?.success && res?.data?.id) {
    const createdDbOrder = mapBackendOrderToFrontend(res.data);
    inMemoryOrders = [createdDbOrder, ...inMemoryOrders.filter((o) => o.id !== createdDbOrder.id)];
    window.dispatchEvent(new Event('ordersUpdated'));
    return createdDbOrder;
  }

  const errorDetails = Array.isArray(res?.errors) 
    ? res.errors.map(e => `${e.field}: ${e.message}`).join(', ') 
    : (res?.message || 'Failed to save order in database');
  throw new Error(errorDetails);
};

/**
 * Returns temporary placeholder invoice ID if needed prior to DB insert
 */
export const getNextInvoiceId = () => {
  return 'Auto';
};

const mapMethodToBackend = (method) => {
  if (!method) return 'CASH';
  const m = String(method).toUpperCase().trim();
  if (m === 'PHONEPE' || m === 'PHONE PAY') return 'PHONEPE';
  if (m === 'GPAY' || m === 'GOOGLE PAY' || m === 'UPI') return 'GPAY';
  if (m === 'CARD') return 'CARD';
  if (m === 'HDFC') return 'HDFC';
  if (m === 'BALANCE') return 'BALANCE';
  if (m === 'SPLIT') return 'SPLIT';
  return 'CASH';
};

const mapStatusToBackend = (s) => {
  if (!s) return undefined;
  const upper = String(s).toUpperCase();
  if (upper === 'COMPLETED') return 'COMPLETED';
  if (upper === 'NEW') return 'NEW';
  if (upper === 'ACCEPTED') return 'ACCEPTED';
  if (upper === 'REJECTED') return 'REJECTED';
  if (upper === 'CANCELLED') return 'CANCELLED';
  return undefined;
};

export const updateOrder = async (orderId, updates) => {
  purgeLocalOrders();

  inMemoryOrders = inMemoryOrders.map((o) =>
    String(o.id) === String(orderId) || String(o.invoiceId) === String(orderId) ? { ...o, ...updates } : o
  );
  window.dispatchEvent(new Event('ordersUpdated'));

  const target = inMemoryOrders.find(
    (o) => String(o.id) === String(orderId) || String(o.invoiceId) === String(orderId)
  );

  const uuidCandidate = [orderId, target?.id, target?.backendId].find(
    (id) => typeof id === 'string' && /^[0-9a-fA-F-]{36}$/.test(id)
  );

  if (uuidCandidate) {
    try {
      const backendPayload = {};
      if (updates.status) {
        const s = mapStatusToBackend(updates.status);
        if (s) backendPayload.status = s;
      }
      if (updates.paymentStatus) {
        backendPayload.paymentStatus = updates.paymentStatus.toUpperCase() === 'PAID' ? 'PAID' : 'UNPAID';
      }
      if (updates.paymentMethod) {
        backendPayload.paymentMethod = mapMethodToBackend(updates.paymentMethod);
      }
      if (Array.isArray(updates.payments) && updates.payments.length > 0) {
        backendPayload.payments = updates.payments.map((p) => ({
          method: mapMethodToBackend(p.method || updates.paymentMethod),
          amount: Number(p.amount || 0),
        }));
      } else if (updates.paymentMethod && (updates.paymentStatus?.toUpperCase() === 'PAID' || target?.paymentStatus === 'Paid')) {
        const amt = Number(updates.amount || target?.grandTotal || target?.totalAmount || 0);
        if (amt > 0) {
          backendPayload.payments = [
            {
              method: mapMethodToBackend(updates.paymentMethod),
              amount: amt,
            },
          ];
        }
      }

      if (Object.keys(backendPayload).length > 0) {
        await posApi.updateOrder(uuidCandidate, backendPayload);
      }
    } catch (err) {
      console.warn('Failed to update POS order in backend database:', err);
    }
  }

  return inMemoryOrders;
};

export const updateOrderStatus = (orderId, newStatus) => {
  return updateOrder(orderId, { status: newStatus });
};

export const cancelOrderInStore = async (orderId) => {
  purgeLocalOrders();
  inMemoryOrders = inMemoryOrders.map((o) =>
    String(o.id) === String(orderId) || String(o.invoiceId) === String(orderId) ? { ...o, status: 'Cancelled' } : o
  );
  window.dispatchEvent(new Event('ordersUpdated'));

  const target = inMemoryOrders.find(
    (o) => String(o.id) === String(orderId) || String(o.invoiceId) === String(orderId)
  );
  const uuidCandidate = [orderId, target?.id, target?.backendId].find(
    (id) => typeof id === 'string' && /^[0-9a-fA-F-]{36}$/.test(id)
  );
  if (uuidCandidate) {
    try {
      await posApi.updateOrderStatus(uuidCandidate, 'CANCELLED');
    } catch (e) {
      console.warn('Backend cancel order failed:', e);
    }
  }
  return inMemoryOrders;
};

export const deleteOrderInStore = async (orderId) => {
  purgeLocalOrders();
  const cleanId = String(orderId || '').replace(/^#/, '').trim();
  const target = inMemoryOrders.find(
    (o) => String(o.id) === String(orderId) || 
           String(o.invoiceId) === String(orderId) ||
           String(o.id) === cleanId ||
           String(o.invoiceId) === cleanId
  );

  inMemoryOrders = inMemoryOrders.filter(
    (o) => String(o.id) !== String(orderId) && 
           String(o.invoiceId) !== String(orderId) &&
           String(o.id) !== cleanId &&
           String(o.invoiceId) !== cleanId
  );
  window.dispatchEvent(new Event('ordersUpdated'));

  const candidateIds = [
    target?.backendId,
    target?.id,
    target?.invoiceId,
    cleanId,
    orderId,
  ].filter(Boolean);

  for (const cand of candidateIds) {
    const c = String(cand).replace(/^#/, '').trim();
    if (!c) continue;
    try {
      await posApi.deleteOrder(c).catch(() => {});
    } catch (e) {}
  }

  return inMemoryOrders;
};
