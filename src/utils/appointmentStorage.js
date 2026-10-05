import { getActiveTenantId } from './saasStorage';
import { appointmentApi, posApi } from '../api/client';
import { getMasterStaff } from './staffStorage';
import { getMasterServices } from './serviceStorage';

/**
 * PURE DATABASE-ONLY APPOINTMENT STORAGE
 * Appointments are loaded and saved directly to the PostgreSQL database via appointmentApi.
 * Module Isolation: Deleting an appointment only clears the calendar schedule card
 * and NEVER deletes the financial Sales Order from Reports, CRM, or Trends.
 */

let inMemoryAppointments = [];
let hasFetchedFromBackend = false;

export const getDeletedAppointmentKeys = () => {
  try {
    const tenantId = getActiveTenantId();
    const raw = localStorage.getItem(`respark_deleted_appts_${tenantId}`);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (e) {}
  return new Set();
};

export const addDeletedAppointmentKeys = (keys) => {
  try {
    const tenantId = getActiveTenantId();
    const current = getDeletedAppointmentKeys();
    keys.forEach(k => {
      if (k) current.add(String(k));
    });
    localStorage.setItem(`respark_deleted_appts_${tenantId}`, JSON.stringify(Array.from(current)));
  } catch (e) {}
};

// Purge any legacy localStorage keys so browser storage remains completely clean
export const purgeLocalAppointments = () => {
  try {
    const keysToRemove = [];
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith('respark_appointments_')) {
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

purgeLocalAppointments();

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const formatToDDMMMYYYY = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = SHORT_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

export const parseToIsoDate = (dStr) => {
  if (!dStr) return new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) return dStr;
  const parts = dStr.split('-');
  if (parts.length === 3) {
    const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
    const day = parts[0].padStart(2, '0');
    const mStr = parts[1].toLowerCase().slice(0, 3);
    const month = months[mStr] || '01';
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  const d = new Date(dStr);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
};

export const parseTo24HourTime = (tStr) => {
  if (!tStr) return '09:00';
  const match = tStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return '09:00';
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = (match[3] || '').toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m}`;
};

export const formatTo12HourTime = (tStr) => {
  if (!tStr) return '09:00 AM';
  const trimmed = String(tStr).trim();
  if (/(AM|PM)/i.test(trimmed)) return trimmed;
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return trimmed;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
};

export const mapBackendAppointmentToFrontend = (item) => {
  const guestObj = item.guest || {};
  const firstItem = Array.isArray(item.items) && item.items.length > 0 ? item.items[0] : {};
  const serviceObj = firstItem.service || {};
  const staffObj = firstItem.staff || {};

  return {
    id: item.id,
    backendId: item.id,
    appointmentNumber: item.appointmentNumber,
    posOrderId: item.posOrderId || null,
    isPosOrder: false,
    guest: guestObj.name || `${guestObj.firstName || ''} ${guestObj.lastName || ''}`.trim() || 'Walk-in Guest',
    mobile: guestObj.mobile || '',
    email: guestObj.email || '',
    gender: guestObj.gender === 'MALE' ? 'Male' : (guestObj.gender === 'FEMALE' ? 'Female' : 'Other'),
    service: serviceObj.name || 'Salon Service',
    serviceId: serviceObj.id || firstItem.serviceId,
    price: Number(item.totalAmount || firstItem.price || 0),
    paymentMethod: item.isPaid ? (item.paymentMethod || 'Cash') : 'Pay at Salon',
    paymentStatus: item.isPaid ? 'Paid' : 'Unpaid',
    staff: staffObj.name || `${staffObj.firstName || ''} ${staffObj.lastName || ''}`.trim() || 'Staff',
    staffId: staffObj.id || firstItem.staffId,
    timeSlot: firstItem.startTime ? formatTo12HourTime(firstItem.startTime) : (item.timeSlot ? formatTo12HourTime(item.timeSlot) : '09:00 AM'),
    duration: (() => {
      if (firstItem.durationMinutes) return `${firstItem.durationMinutes} min`;
      try {
        const masterSvcs = getMasterServices();
        const match = masterSvcs.find(s => s.name?.toLowerCase() === (serviceObj.name || '').trim().toLowerCase() || String(s.id) === String(serviceObj.id || firstItem.serviceId));
        if (match) {
          const mins = parseInt(match.durationMinutes || match.duration) || 0;
          if (mins > 0) return `${mins} min`;
        }
      } catch (e) {}
      return '30 min';
    })(),
    status: item.status === 'IN_PROGRESS' ? 'In Progress' : (item.status === 'COMPLETED' ? 'Completed' : (item.status === 'CANCELLED' ? 'Cancelled' : 'Waiting')),
    date: item.appointmentDate ? formatToDDMMMYYYY(item.appointmentDate) : formatToDDMMMYYYY(new Date()),
    instruction: item.instruction || '',
    items: Array.isArray(item.items) ? item.items.map(it => ({
      id: it.id,
      name: it.service?.name || 'Service',
      price: Number(it.price || 0),
      duration: it.durationMinutes ? `${it.durationMinutes} min` : '30 min',
      staff: it.staff?.name || 'Staff'
    })) : []
  };
};

/**
 * Maps a POS Order from the database into an appointment row for the scheduler
 */
export const mapBackendOrderToAppointment = (b) => {
  const allItems = Array.isArray(b.items) ? b.items : [];
  const serviceItems = allItems.filter(i => {
    const t = String(i.itemType || '').toUpperCase();
    return t === 'SERVICE' || t === 'PACKAGE' || (!t && !i.isProduct && !i.isDisposable);
  });
  const hasServices = serviceItems.length > 0;
  const primaryItem = serviceItems[0] || allItems[0] || {};
  const serviceTitle = serviceItems.length > 0 
    ? serviceItems.map(i => i.itemName).join(', ') 
    : (primaryItem.itemName || 'Salon Service');

  let extractedSlot = b.timeSlot;
  if (!extractedSlot && b.notes) {
    const match = b.notes.match(/Slot:\s*([0-9]{1,2}:[0-9]{2}(?:\s*[AP]M)?)/i);
    if (match) extractedSlot = match[1].trim();
  }
  if (!extractedSlot && b.instruction) {
    const match = b.instruction.match(/Slot:\s*([0-9]{1,2}:[0-9]{2}(?:\s*[AP]M)?)/i);
    if (match) extractedSlot = match[1].trim();
  }

  let timeSlotStr = '';
  if (extractedSlot) {
    timeSlotStr = formatTo12HourTime(extractedSlot);
  } else {
    const orderTime = b.createdAt ? new Date(b.createdAt) : (b.orderDate ? new Date(b.orderDate) : new Date());
    const hours = orderTime.getHours();
    const minutes = orderTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const roundedMin = minutes < 30 ? '00' : '30';
    timeSlotStr = `${String(displayHours).padStart(2, '0')}:${roundedMin} ${ampm}`;
  }

  return {
    id: b.id,
    backendId: b.id,
    orderId: b.orderNumber,
    invoiceId: b.orderNumber,
    invoiceNo: b.orderNumber,
    appointmentNumber: b.orderNumber,
    isPosOrder: true,
    hasServices,
    guest: b.guest?.name || 'Walk-in Guest',
    mobile: b.guest?.mobile || '',
    email: b.guest?.email || '',
    gender: b.guest?.gender === 'MALE' ? 'Male' : (b.guest?.gender === 'FEMALE' ? 'Female' : 'Other'),
    service: serviceTitle,
    serviceId: primaryItem.serviceId || primaryItem.id,
    price: Number(b.totalAmount || 0),
    discAmount: Number(primaryItem.discountAmount || 0),
    discountAmount: Number(primaryItem.discountAmount || 0),
    servicesPrice: serviceItems.reduce((acc, i) => acc + Number(i.subtotal || i.total || i.unitPrice || 0), 0),
    paymentMethod: (b.paymentStatus === 'UNPAID' || b.paymentMethod === 'PAY AT SALON') ? 'Pay at Salon' : (b.paymentMethod || 'Cash'),
    paymentStatus: (b.paymentStatus === 'UNPAID' || b.paymentMethod === 'PAY AT SALON') ? 'Unpaid' : (b.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid'),
    staff: primaryItem.staff?.name || (hasServices ? (primaryItem.staffId ? 'Staff' : 'Unassigned') : '—'),
    staffId: primaryItem.staffId,
    timeSlot: timeSlotStr,
    duration: (() => {
      const sTitle = String(serviceTitle || '').toLowerCase();
      if (sTitle.startsWith('redemption:') || sTitle.includes('package redemption') || sTitle.includes('package session:')) {
        return '';
      }
      let orderDurationMinutes = 0;
      try {
        const masterSvcs = getMasterServices();
        if (serviceItems.length > 0) {
          serviceItems.forEach(item => {
            const itemRawName = (item.itemName || item.name || '').trim().toLowerCase();
            const match = masterSvcs.find(s => s.name?.toLowerCase() === itemRawName || String(s.id) === String(item.serviceId || item.id));
            if (match) {
              const mins = parseInt(match.durationMinutes || match.duration) || 0;
              if (mins > 0) orderDurationMinutes += mins;
            } else if (item.durationMinutes) {
              orderDurationMinutes += Number(item.durationMinutes);
            } else if (item.duration) {
              const parsed = parseInt(item.duration);
              if (parsed > 0) orderDurationMinutes += parsed;
            }
          });
        }
      } catch (e) {}
      return orderDurationMinutes > 0 ? `${orderDurationMinutes} min` : '30 min';
    })(),
    status: b.status === 'COMPLETED' ? 'Completed' : (b.status === 'CANCELLED' ? 'Cancelled' : (b.status === 'NEW' ? 'Waiting' : 'In Progress')),
    date: b.orderDate 
      ? formatToDDMMMYYYY(b.orderDate)
      : (b.createdAt ? formatToDDMMMYYYY(b.createdAt) : formatToDDMMMYYYY(new Date())),
    instruction: b.instruction || b.notes || 'Booked in POS',
    items: allItems.map(i => ({
      id: i.id,
      name: i.itemName,
      price: Number(i.unitPrice || 0),
      qty: i.quantity || 1,
      discAmount: Number(i.discountAmount || 0),
      discountAmount: Number(i.discountAmount || 0),
      staff: i.staff?.name || (i.staffId ? 'Staff' : 'Unassigned'),
      itemType: (i.itemType || 'SERVICE').toLowerCase()
    })),
    products: allItems.filter(i => i.itemType === 'PRODUCT').map(i => ({
      id: i.id,
      name: i.itemName,
      price: Number(i.unitPrice || 0),
      qty: i.quantity || 1,
      discAmount: Number(i.discountAmount || 0),
      discountAmount: Number(i.discountAmount || 0),
      itemType: 'product'
    })),
    services: serviceItems.map(i => ({
      id: i.id,
      name: i.itemName,
      price: Number(i.unitPrice || 0),
      qty: i.quantity || 1,
      discAmount: Number(i.discountAmount || 0),
      discountAmount: Number(i.discountAmount || 0),
      staff: i.staff?.name || (i.staffId ? 'Staff' : 'Unassigned'),
      itemType: 'service'
    })),
    disposables: allItems.filter(i => i.itemType === 'DISPOSABLE').map(i => ({
      id: i.id,
      name: i.itemName,
      price: Number(i.unitPrice || 0),
      qty: i.quantity || 1,
      discAmount: Number(i.discountAmount || 0),
      discountAmount: Number(i.discountAmount || 0),
      itemType: 'disposable'
    })),
    subTotal: Number(b.subtotal || b.totalAmount || 0),
    grandTotal: Number(b.totalAmount || 0),
  };
};

export const fetchAppointmentsFromBackend = async () => {
  try {
    // 1. Fetch appointments created in database
    const apptRes = await appointmentApi.getAppointments({ limit: 100 });
    const directAppts = (apptRes?.success && Array.isArray(apptRes?.data)) 
      ? apptRes.data.map(mapBackendAppointmentToFrontend) 
      : [];

    // 2. Fetch POS orders created in database to ensure any POS booked orders are never lost
    let orderAppts = [];
    try {
      const orderRes = await posApi.getOrders({ limit: 100 });
      const orderItems = Array.isArray(orderRes?.data?.data) 
        ? orderRes.data.data 
        : (Array.isArray(orderRes?.data?.items) ? orderRes.data.items : (Array.isArray(orderRes?.data) ? orderRes.data : []));
      if (orderRes?.success && orderItems.length > 0) {
        orderAppts = orderItems
          .map(mapBackendOrderToAppointment)
          .filter(a => a && a.hasServices !== false);
      }
    } catch (orderErr) {
      console.warn('Could not fetch POS orders for appointment view:', orderErr);
    }

    const orderMap = new Map();
    for (const o of orderAppts) {
      if (o.id) orderMap.set(String(o.id), o);
      if (o.orderId) orderMap.set(String(o.orderId), o);
      if (o.invoiceNo) orderMap.set(String(o.invoiceNo), o);
      if (o.invoiceId) orderMap.set(String(o.invoiceId), o);
    }

    // Merge without duplicates (enrich direct appointments with order payments)
    const seenIds = new Set();
    const merged = [];

    // Prioritize direct appointments
    for (const a of directAppts) {
      let linkedOrder = a.posOrderId ? orderMap.get(String(a.posOrderId)) : null;
      if (!linkedOrder) {
        // Link by matching orderId, invoiceId, or guest + date when booked from POS
        linkedOrder = orderAppts.find(o => 
          (a.orderId && (o.orderId === a.orderId || o.invoiceId === a.orderId)) ||
          (a.invoiceNo && (o.invoiceNo === a.invoiceNo || o.orderId === a.invoiceNo)) ||
          (a.instruction === 'Booked in POS' && o.guest && a.guest && o.guest.trim().toLowerCase() === a.guest.trim().toLowerCase() && (o.date === a.date || o.dateDisplay === a.date))
        );
      }

      const effectiveAppt = linkedOrder ? {
        ...a,
        paymentStatus: linkedOrder.paymentStatus,
        paymentMethod: linkedOrder.paymentMethod,
        payments: linkedOrder.payments,
        status: linkedOrder.status === 'Completed' ? 'Completed' : a.status,
        orderId: linkedOrder.orderId || a.orderId,
        invoiceId: linkedOrder.invoiceId || a.invoiceId,
        invoiceNo: linkedOrder.invoiceNo || a.invoiceNo,
        timeSlot: linkedOrder.timeSlot || a.timeSlot,
        staff: linkedOrder.staff || a.staff,
        staffId: linkedOrder.staffId || a.staffId,
      } : a;

      const idKey = String(effectiveAppt.id || effectiveAppt.appointmentNumber || effectiveAppt.orderId || '');
      if (idKey && !seenIds.has(idKey)) {
        seenIds.add(idKey);
        if (effectiveAppt.posOrderId) seenIds.add(String(effectiveAppt.posOrderId));
        if (effectiveAppt.orderId) seenIds.add(String(effectiveAppt.orderId));
        if (effectiveAppt.invoiceNo) seenIds.add(String(effectiveAppt.invoiceNo));
        if (linkedOrder) {
          if (linkedOrder.id) seenIds.add(String(linkedOrder.id));
          if (linkedOrder.orderId) seenIds.add(String(linkedOrder.orderId));
          if (linkedOrder.invoiceNo) seenIds.add(String(linkedOrder.invoiceNo));
        }
        merged.push(effectiveAppt);
      }
    }

    // Overlay remaining standalone POS orders
    for (const o of orderAppts) {
      const idKey = String(o.id || o.orderId || o.invoiceId || '');
      if (idKey && !seenIds.has(idKey)) {
        seenIds.add(idKey);
        if (o.orderId) seenIds.add(String(o.orderId));
        if (o.invoiceNo) seenIds.add(String(o.invoiceNo));
        merged.push(o);
      }
    }

    // Filter out deleted appointment cards (module isolation: preserves linked Sales Orders in Reports, CRM, Trends)
    const deletedKeys = getDeletedAppointmentKeys();
    inMemoryAppointments = merged.filter(a => {
      if (!a) return false;
      const idsToCheck = [
        a.id && String(a.id),
        a.backendId && String(a.backendId),
        a.orderId && String(a.orderId),
        a.orderId && String(a.orderId).replace(/^#/, ''),
        a.posOrderId && String(a.posOrderId),
        a.invoiceId && String(a.invoiceId),
        a.invoiceNo && String(a.invoiceNo),
        a.appointmentNumber && String(a.appointmentNumber),
        a.appointmentNumber && String(a.appointmentNumber).replace(/^#/, ''),
      ].filter(Boolean);
      return !idsToCheck.some(key => deletedKeys.has(key));
    });

    hasFetchedFromBackend = true;
    window.dispatchEvent(new CustomEvent('appointmentsUpdated'));
    return inMemoryAppointments;
  } catch (err) {
    console.warn('Could not fetch appointments from backend:', err);
  }
  return inMemoryAppointments;
};

export const isAppointmentsLoading = () => !hasFetchedFromBackend;

export const getAppointments = () => {
  if (!hasFetchedFromBackend) {
    fetchAppointmentsFromBackend();
  }
  return [...inMemoryAppointments];
};

export const saveAppointment = (appointment) => {
  // Option 1: Do not add retail product / disposable sales without services to appointment schedule
  const hasOnlyRetail = (appointment.hasServices === false) || 
    (Array.isArray(appointment.services) && appointment.services.length === 0 && (
      (Array.isArray(appointment.products) && appointment.products.length > 0) ||
      (Array.isArray(appointment.disposables) && appointment.disposables.length > 0)
    ));
  if (hasOnlyRetail) {
    return appointment;
  }

  const tempId = appointment.id || `appt_${Date.now()}`;
  const newAppt = {
    ...appointment,
    id: tempId
  };
  
  inMemoryAppointments = [newAppt, ...inMemoryAppointments.filter(a => a.id !== tempId && (!appointment.orderId || a.orderId !== appointment.orderId))];
  window.dispatchEvent(new CustomEvent('appointmentsUpdated'));

  // If this is a POS order (already saved or saving to pos_orders in PostgreSQL),
  // DO NOT create a duplicate record in appointments table!
  if (appointment.isPosOrder || appointment.orderId || appointment.invoiceId) {
    return newAppt;
  }

  // Persist to PostgreSQL database asynchronously for scheduler appointments
  (async () => {
    try {
      const dateStr = appointment.date && /^\d{4}-\d{2}-\d{2}$/.test(appointment.date)
        ? appointment.date
        : (appointment.date ? parseToIsoDate(appointment.date) : new Date().toISOString().slice(0, 10));

      const slot24 = parseTo24HourTime(appointment.timeSlot);

      const payload = {
        guest: {
          name: appointment.guest || 'Walk-in Guest',
          mobile: (appointment.mobile || '9999999999').replace(/\D/g, '') || '9999999999',
          gender: appointment.gender === 'Female' ? 'FEMALE' : (appointment.gender === 'Male' ? 'MALE' : 'OTHER'),
        },
        appointmentDate: dateStr,
        instruction: appointment.instruction || undefined,
        items: (appointment.items && appointment.items.length > 0)
          ? appointment.items.map(it => ({
              serviceId: it.serviceId || it.id,
              staffId: it.staffId || appointment.staffId || undefined,
              startTime: it.startTime ? parseTo24HourTime(it.startTime) : (slot24 || '09:00'),
              price: Number(it.price || 0),
            }))
          : [
              {
                serviceId: appointment.serviceId || '00000000-0000-0000-0000-000000000000',
                staffId: appointment.staffId || undefined,
                startTime: slot24 || '09:00',
                price: Number(appointment.price || 0),
              }
            ]
      };

      const res = await appointmentApi.createAppointment(payload);
      if (res?.success && res?.data?.id) {
        const persisted = mapBackendAppointmentToFrontend(res.data);
        inMemoryAppointments = inMemoryAppointments.map(a => a.id === tempId ? persisted : a);
        window.dispatchEvent(new CustomEvent('appointmentsUpdated'));
      }
    } catch (backendErr) {
      console.warn('Backend appointment save failed:', backendErr);
    }
  })();

  return newAppt;
};

export const updateAppointment = async (id, updates) => {
  const target = inMemoryAppointments.find(a => 
    String(a.id) === String(id) || 
    String(a.backendId) === String(id) || 
    String(a.orderId) === String(id) || 
    String(a.invoiceId) === String(id)
  );

  inMemoryAppointments = inMemoryAppointments.map(a => 
    (String(a.id) === String(id) || String(a.backendId) === String(id) || String(a.orderId) === String(id) || String(a.invoiceId) === String(id))
      ? { ...a, ...updates }
      : a
  );
  window.dispatchEvent(new CustomEvent('appointmentsUpdated'));

  const isPosOrder = Boolean(
    target?.isPosOrder ||
    (target?.orderId && (target.orderId.startsWith('INV-') || target.orderId.startsWith('ORD-'))) ||
    (!target?.appointmentNumber?.startsWith('APT-') && target?.orderId)
  );

  const realId = target?.backendId || target?.id || id;
  const isUuid = typeof realId === 'string' && /^[0-9a-fA-F-]{36}$/.test(realId);

  if (isUuid) {
    try {
      if (isPosOrder) {
        // Handle POS Order update in PostgreSQL pos_orders & pos_order_items
        if (updates.status) {
          const posStatusMap = {
            'Waiting': 'NEW',
            'In Progress': 'PENDING',
            'Completed': 'COMPLETED',
            'Cancelled': 'CANCELLED'
          };
          const posStatus = posStatusMap[updates.status] || updates.status.toUpperCase();
          await posApi.updateOrderStatus(realId, posStatus);
          if (posStatus === 'CANCELLED') {
            await posApi.cancelOrder(realId).catch(() => {});
          }
        }

        const posPayload = {};
        if (updates.staffId || updates.staff) {
          let resolvedStaffId = updates.staffId;
          if (!resolvedStaffId && updates.staff) {
            const allStaff = getMasterStaff();
            const s = allStaff.find(st => (typeof st === 'string' ? st : st.name)?.trim().toLowerCase() === updates.staff.trim().toLowerCase());
            if (s?.id) resolvedStaffId = s.id;
          }
          if (resolvedStaffId) posPayload.staffId = resolvedStaffId;
        }

        if (updates.date) {
          posPayload.orderDate = parseToIsoDate(updates.date);
        }

        if (Object.keys(posPayload).length > 0) {
          await posApi.updateOrder(realId, posPayload);
        }
      } else {
        // Handle direct Appointment update in PostgreSQL appointments & appointment_items
        if (updates.status) {
          const apptStatusMap = {
            'Waiting': 'CONFIRMED',
            'In Progress': 'IN_PROGRESS',
            'Completed': 'COMPLETED',
            'Cancelled': 'CANCELLED'
          };
          const apptStatus = apptStatusMap[updates.status] || updates.status;
          await appointmentApi.updateStatus(realId, apptStatus);
          if (target?.posOrderId) {
            const posStatusMap = { 'Waiting': 'NEW', 'In Progress': 'PENDING', 'Completed': 'COMPLETED', 'Cancelled': 'CANCELLED' };
            await posApi.updateOrderStatus(target.posOrderId, posStatusMap[updates.status] || 'PENDING').catch(() => {});
          }
        }

        let resolvedStaffId = updates.staffId;
        if (!resolvedStaffId && updates.staff) {
          const allStaff = getMasterStaff();
          const s = allStaff.find(st => (typeof st === 'string' ? st : st.name)?.trim().toLowerCase() === updates.staff.trim().toLowerCase());
          if (s?.id) resolvedStaffId = s.id;
        }

        if (updates.date || updates.timeSlot) {
          const isoDate = parseToIsoDate(updates.date || target?.date);
          const time24 = parseTo24HourTime(updates.timeSlot || target?.timeSlot);
          await appointmentApi.reschedule(realId, {
            appointmentDate: isoDate,
            startTime: time24,
            staffId: resolvedStaffId || undefined,
          });
          if (target?.posOrderId) {
            await posApi.updateOrder(target.posOrderId, { orderDate: isoDate, staffId: resolvedStaffId || undefined }).catch(() => {});
          }
        } else if (resolvedStaffId) {
          await appointmentApi.updateAppointment(realId, { staffId: resolvedStaffId });
          if (target?.posOrderId) {
            await posApi.updateOrder(target.posOrderId, { staffId: resolvedStaffId }).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.warn('Backend appointment/order update failed:', err);
    }
  }

  return inMemoryAppointments;
};

export const deleteAppointment = async (apptOrId) => {
  const isObj = typeof apptOrId === 'object' && apptOrId !== null;
  const id = isObj ? (apptOrId.backendId || apptOrId.id || apptOrId.orderId || apptOrId.appointmentNumber) : apptOrId;
  const objTarget = isObj ? apptOrId : null;
  const cleanId = String(id || '').replace(/^#/, '').trim();
  const target = objTarget || inMemoryAppointments.find(a => 
    String(a.id) === String(id) || 
    String(a.id) === cleanId ||
    String(a.backendId) === String(id) || 
    String(a.backendId) === cleanId ||
    String(a.orderId) === String(id) ||
    String(a.orderId) === cleanId ||
    String(a.invoiceId) === String(id) ||
    String(a.invoiceId) === cleanId ||
    String(a.appointmentNumber) === String(id) ||
    String(a.appointmentNumber) === cleanId
  );

  const idsToRemove = new Set([
    String(id),
    cleanId,
    target?.id && String(target.id),
    target?.backendId && String(target.backendId),
    target?.posOrderId && String(target.posOrderId),
    target?.orderId && String(target.orderId),
    target?.orderId && String(target.orderId).replace(/^#/, ''),
    target?.invoiceId && String(target.invoiceId),
    target?.invoiceNo && String(target.invoiceNo),
    target?.appointmentNumber && String(target.appointmentNumber),
    target?.appointmentNumber && String(target.appointmentNumber).replace(/^#/, ''),
  ].filter(Boolean));

  // Store in excluded keys so the appointment is never re-rendered on scheduler sync
  addDeletedAppointmentKeys(Array.from(idsToRemove));

  inMemoryAppointments = inMemoryAppointments.filter(a => {
    return !idsToRemove.has(String(a.id)) &&
           !idsToRemove.has(String(a.backendId)) &&
           !idsToRemove.has(String(a.orderId)) &&
           !idsToRemove.has(String(a.invoiceId)) &&
           !idsToRemove.has(String(a.invoiceNo)) &&
           !idsToRemove.has(String(a.appointmentNumber));
  });
  window.dispatchEvent(new CustomEvent('appointmentsUpdated'));

  // CRITICAL MODULE ISOLATION:
  // Only delete the appointment entry from the PostgreSQL appointments table.
  // DO NOT delete linked Sales Orders in pos_orders or orderStorage.
  // Completed sales revenue, Reports, CRM customer lifetime spend, and Trends remain 100% intact!
  const candidateApptIds = [
    target?.backendId,
    target?.id,
    target?.appointmentNumber,
    cleanId,
    id,
  ].filter(Boolean);

  for (const cand of candidateApptIds) {
    const c = String(cand).replace(/^#/, '').trim();
    if (!c) continue;
    try {
      await appointmentApi.deleteAppointment(c).catch(() => {});
    } catch (e) {}
  }

  return inMemoryAppointments;
};
