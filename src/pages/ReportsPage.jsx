import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Download, Calendar, Filter, ChevronDown, Search, ArrowUpDown, ChevronRight, Inbox } from 'lucide-react';
import { getOrders } from '../utils/orderStorage';
import { getAppointments } from '../utils/appointmentStorage';
import { getExpenses } from '../utils/expenseStorage';
import { getCustomers } from '../utils/customerStorage';
import { getPackages } from '../utils/packageStorage';
import { reportsApi } from '../api/client';

const parseDateToMs = (dateStr) => {
  if (!dateStr) return 0;
  const clean = String(dateStr).trim().replace(/\s+/g, '-');
  const parts = clean.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)).getTime();
    } else {
      // DD-MMM-YYYY (e.g. 28-Sep-2026 or 28-Sept-2026)
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const mIdx = months.indexOf(parts[1].toLowerCase().slice(0, 3));
      if (mIdx >= 0) {
        return new Date(parseInt(parts[2], 10), mIdx, parseInt(parts[0], 10)).getTime();
      }
    }
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

const getInitialDates = () => {
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = String(now.getMonth() + 1).padStart(2, '0');
  const curDay = String(now.getDate()).padStart(2, '0');
  return {
    from: `${curYear}-${curMonth}-01`,
    to: `${curYear}-${curMonth}-${curDay}`
  };
};

const toDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const ms = parseDateToMs(dateStr);
  if (!ms) return dateStr;
  const d = new Date(ms);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
};

const isDateInRange = (orderDateStr, fromStr, toStr) => {
  if (!fromStr && !toStr) return true;
  const orderMs = parseDateToMs(orderDateStr);
  if (!orderMs) return true;
  const fromMs = fromStr ? parseDateToMs(fromStr) : 0;
  const toMs = toStr ? parseDateToMs(toStr) + 86400000 - 1 : Infinity;
  return orderMs >= fromMs && orderMs <= toMs;
};

const getApptInvoiceNumber = (appt, allOrders = []) => {
  if (!appt) return '#INV-101';
  const formatInv = (val) => {
    if (!val) return '';
    const s = String(val).trim();
    return s.startsWith('#') ? s : `#${s}`;
  };
  if (appt.invoiceNo) return formatInv(appt.invoiceNo);
  if (appt.invoiceId) return formatInv(appt.invoiceId);
  if (appt.orderId) {
    const raw = String(appt.orderId).replace(/^ord_/, '');
    return formatInv(raw.length > 5 ? raw.slice(-4) : raw);
  }
  const cleanPhone = (p) => String(p || '').replace(/\D/g, '');
  const apptPhone = cleanPhone(appt.mobile);
  const apptGuest = (appt.guest || '').trim().toLowerCase();

  const matched = (allOrders || []).find(o => {
    if (appt.orderId && String(o.id) === String(appt.orderId)) return true;
    if (appt.invoiceId && String(o.invoiceId) === String(appt.invoiceId)) return true;
    if (o.appointmentId && String(o.appointmentId) === String(appt.id)) return true;
    const oPhone = cleanPhone(o.guest?.mobile || o.guest?.phone);
    const oName = (o.guest?.name || '').trim().toLowerCase();
    if (apptPhone && oPhone && (apptPhone.endsWith(oPhone) || oPhone.endsWith(apptPhone)) && (o.date === appt.date || o.dateDisplay === appt.dateDisplay)) {
      return true;
    }
    if (apptGuest && oName && apptGuest === oName && (o.date === appt.date || o.dateDisplay === appt.dateDisplay)) {
      return true;
    }
    return false;
  });

  if (matched) {
    return formatInv(matched.invoiceNo || matched.invoiceId || matched.id);
  }

  return formatInv(appt.id ? (String(appt.id).length > 6 ? String(appt.id).slice(-4) : `INV-${appt.id}`) : 'INV-101');
};

export default function ReportsPage() {
  const initial = useMemo(() => getInitialDates(), []);
  const [selectedReport, setSelectedReport] = useState('Sales Summary');
  const [fromDate, setFromDate] = useState(initial.from);
  const [toDate, setToDate] = useState(initial.to);
  const [appliedFromDate, setAppliedFromDate] = useState(initial.from);
  const [appliedToDate, setAppliedToDate] = useState(initial.to);
  const [orders, setOrders] = useState(() => getOrders());
  const [appointments, setAppointments] = useState(() => getAppointments());
  const [expenses, setExpenses] = useState(() => getExpenses());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [backendRedemptions, setBackendRedemptions] = useState([]);

  useEffect(() => {
    if (selectedReport === 'Package Redemption') {
      (async () => {
        try {
          const res = await reportsApi.getPackageRedemption({
            startDate: appliedFromDate,
            endDate: appliedToDate,
          });
          const rows = res?.data?.rows || (Array.isArray(res?.data) ? res.data : []);
          if (Array.isArray(rows)) {
            setBackendRedemptions(rows);
          }
        } catch (err) {
          console.warn('Package redemption report fetch:', err);
        }
      })();
    }
  }, [selectedReport, appliedFromDate, appliedToDate]);

  useEffect(() => {
    const handleSync = () => {
      setOrders(getOrders());
      setAppointments(getAppointments());
      setExpenses(getExpenses());
    };
    window.addEventListener('ordersUpdated', handleSync);
    window.addEventListener('appointmentsUpdated', handleSync);
    window.addEventListener('expensesUpdated', handleSync);
    window.addEventListener('tenantChanged', handleSync);
    return () => {
      window.removeEventListener('ordersUpdated', handleSync);
      window.removeEventListener('appointmentsUpdated', handleSync);
      window.removeEventListener('expensesUpdated', handleSync);
      window.removeEventListener('tenantChanged', handleSync);
    };
  }, []);

  // Filter orders by chosen date range
  const filteredOrders = useMemo(() => {
    return (orders || []).filter(o => {
      if (!o) return false;
      const orderDate = o.dateDisplay || o.date || '';
      return isDateInRange(orderDate, appliedFromDate, appliedToDate);
    });
  }, [orders, appliedFromDate, appliedToDate]);

  // Filter appointments by chosen date range
  const filteredAppointments = useMemo(() => {
    return (appointments || []).filter(a => {
      if (!a) return false;
      const apptDate = a.date || '';
      return isDateInRange(apptDate, appliedFromDate, appliedToDate);
    });
  }, [appointments, appliedFromDate, appliedToDate]);

  // Filter expenses by chosen date range
  const filteredExpenses = useMemo(() => {
    return (expenses || []).filter(e => {
      if (!e) return false;
      const expDate = e.date || '';
      return isDateInRange(expDate, appliedFromDate, appliedToDate);
    });
  }, [expenses, appliedFromDate, appliedToDate]);

  // Report Library structure
  const reportCategories = [
    {
      category: 'Sales & Revenue',
      reports: [
        'Sales Summary',
        'Product Revenue',
        'Service Revenue',
        'Monthly Sale',
        'Day Wise Report',
      ]
    },
    {
      category: 'Packages Report',
      reports: [
        'Packages Sold',
        'Package Redemption',
      ]
    },
    {
      category: 'Operational & Customer',
      reports: [
        'Appointment Report',
        'Cancelled Orders',
        'Cash Transactions',
      ]
    },
    {
      category: 'Inventory Reports',
      reports: [
        'Daily Stock',
        'Stock Transaction',
        'Material Received',
        'Minimum Stock',
        'Reconcile Stock',
        'Consumable Tracking',
        'Stock Transfer',
        'Total Consumed',
        'Purchase Order Report',
        'GST Outwards Report',
        'Inventory Transaction Report',
      ]
    },
    {
      category: 'Financial Analytics',
      reports: [
        'PnL Report',
      ]
    }
  ];

  const getReportColumns = () => {
    switch (selectedReport) {
      case 'Sales Summary':
        return ['Date', 'Invoices', 'Services Rev', 'Product Rev', 'Package Rev', 'Discount', 'Total Net Revenue'];
      case 'Product Revenue':
        return ['Product Name', 'Category', 'Units Sold', 'Unit Price', 'Total Revenue'];
      case 'Service Revenue':
        return ['Service Name', 'Category', 'Times Performed', 'Rate', 'Discount', 'Net Amount'];
      case 'Packages Sold':
        return ['Package Name', 'Customer Name', 'Category', 'Units Sold', 'Rate', 'Total Revenue'];
      case 'Package Redemption':
        return ['Customer Name', 'Package Name', 'Total Sessions', 'Sessions Redeemed', 'Sessions Remaining', 'Date', 'Status'];
      case 'Monthly Sale':
        return ['Month', 'Total Orders', 'Service Revenue', 'Product Revenue', 'Total Revenue'];
      case 'Day Wise Report':
        return ['Date', 'Total Orders', 'Cash Sales', 'Digital Sales', 'Total Revenue'];
      case 'PnL Report':
        return ['Particulars / Category', 'POS Revenue', 'Direct Expenses', 'Overhead', 'Net Profit / Loss'];
      case 'Daily Stock':
        return ['Item Name', 'Category', 'Opening Stock', 'Received', 'Consumed / Sold', 'Closing Stock'];
      case 'Appointment Report':
        return ['Invoice Number', 'Customer Name', 'Service', 'Staff', 'Time Slot', 'Date', 'Status'];
      case 'Cancelled Orders':
        return ['Invoice Number', 'Date', 'Customer', 'Items', 'Amount', 'Reason', 'Status'];
      case 'Cash Transactions':
        return ['Invoice Number', 'Date & Time', 'Type', 'Staff / Counter', 'Amount', 'Mode', 'Status'];
      default:
        return ['ID', 'Reference / Name', 'Category', 'Quantity', 'Amount (₹)', 'Date', 'Status'];
    }
  };

  const getReportRows = () => {
    switch (selectedReport) {
      // REAL DATA: Sales Summary (Aggregated by day from live orders)
      case 'Sales Summary': {
        const byDate = {};
        filteredOrders.forEach(o => {
          const d = o.dateDisplay || o.date || 'Unknown Date';
          if (!byDate[d]) {
            byDate[d] = {
              date: d,
              invoices: 0,
              servicesRev: 0,
              productRev: 0,
              packageRev: 0,
              discount: 0,
              totalNet: 0
            };
          }
          byDate[d].invoices += 1;
          const items = o.items || [];
          items.forEach(item => {
            const price = Number(item.price) || 0;
            const qty = Number(item.qty) || 1;
            const disc = Number(item.discAmount) || 0;
            const lineTotal = Math.max(0, (price * qty) - disc);

            const type = (item.itemType || '').toLowerCase();
            const cat = (item.category || '').toUpperCase();
            const isProd = type === 'product' || cat === 'PRODUCT';
            const isPkg = type === 'package' || cat === 'PACKAGE';
            if (isProd) {
              byDate[d].productRev += lineTotal;
            } else if (isPkg) {
              byDate[d].packageRev += lineTotal;
            } else {
              byDate[d].servicesRev += lineTotal;
            }
            byDate[d].discount += disc;
          });
          byDate[d].discount += (Number(o.discount) || 0);
          byDate[d].totalNet += (Number(o.grandTotal ?? o.subTotal ?? 0));
        });

        const sortedDates = Object.values(byDate).sort((a, b) => parseDateToMs(b.date) - parseDateToMs(a.date));
        return sortedDates.map(r => {
          return [
            r.date,
            String(r.invoices),
            `₹${r.servicesRev.toLocaleString()}`,
            `₹${r.productRev.toLocaleString()}`,
            `₹${r.packageRev.toLocaleString()}`,
            `₹${r.discount.toLocaleString()}`,
            `₹${r.totalNet.toLocaleString()}`
          ];
        });
      }

      // REAL DATA: Product Revenue (Aggregated from real products in orders)
      case 'Product Revenue': {
        const prodMap = {};
        filteredOrders.forEach(o => {
          (o.items || []).forEach(item => {
            const type = (item.itemType || '').toLowerCase();
            const cat = (item.category || '').toUpperCase();
            const isProd = type === 'product' || cat === 'PRODUCT' || cat === 'RETAIL';
            if (isProd) {
              const name = item.name || 'Retail Product';
              if (!prodMap[name]) {
                prodMap[name] = {
                  name,
                  category: item.category || 'Retail Product',
                  unitsSold: 0,
                  unitPrice: Number(item.price) || 0,
                  totalRevenue: 0
                };
              }
              const q = Number(item.qty) || 1;
              const disc = Number(item.discAmount) || 0;
              prodMap[name].unitsSold += q;
              prodMap[name].totalRevenue += Math.max(0, (prodMap[name].unitPrice * q) - disc);
            }
          });
        });
        const list = Object.values(prodMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
        return list.map(p => [
          p.name,
          p.category,
          String(p.unitsSold),
          `₹${p.unitPrice.toLocaleString()}`,
          `₹${p.totalRevenue.toLocaleString()}`
        ]);
      }

      // REAL DATA: Service Revenue (Aggregated from real services in orders)
      case 'Service Revenue': {
        const srvMap = {};
        filteredOrders.forEach(o => {
          (o.items || []).forEach(item => {
            const type = (item.itemType || '').toLowerCase();
            const cat = (item.category || '').toUpperCase();
            const isProd = type === 'product' || cat === 'PRODUCT' || cat === 'RETAIL';
            const isPkg = type === 'package' || cat === 'PACKAGE';
            const isMem = type === 'membership' || cat === 'MEMBERSHIP';
            if (!isProd && !isPkg && !isMem) {
              const name = item.name || 'Salon Service';
              if (!srvMap[name]) {
                srvMap[name] = {
                  name,
                  category: item.category || 'Service',
                  timesPerformed: 0,
                  rate: Number(item.price) || 0,
                  discount: 0,
                  netAmount: 0
                };
              }
              const q = Number(item.qty) || 1;
              const disc = Number(item.discAmount) || 0;
              srvMap[name].timesPerformed += q;
              srvMap[name].discount += disc;
              srvMap[name].netAmount += Math.max(0, ((Number(item.price) || 0) * q) - disc);
            }
          });
        });
        const list = Object.values(srvMap).sort((a, b) => b.netAmount - a.netAmount);
        return list.map(s => [
          s.name,
          s.category,
          String(s.timesPerformed),
          `₹${s.rate.toLocaleString()}`,
          `₹${s.discount.toLocaleString()}`,
          `₹${s.netAmount.toLocaleString()}`
        ]);
      }

      // REAL DATA: Packages Sold (Aggregated from packages in orders)
      case 'Packages Sold': {
        const pkgMap = {};
        const masterPackages = getPackages() || [];
        filteredOrders.forEach(o => {
          (o.items || []).forEach(item => {
            const type = (item.itemType || '').toLowerCase();
            const cat = (item.category || '').toUpperCase();
            const isPkg = type === 'package' || cat === 'PACKAGE';
            if (isPkg) {
              const name = item.name || 'Salon Package';
              const customerName = o.guest?.name || 'Customer';
              const key = `${name}_${customerName}_${o.id || ''}`;
              
              const matchedMaster = masterPackages.find(p => p.name && p.name.trim().toLowerCase() === name.trim().toLowerCase());
              const resolvedCategory = (item.category && item.category !== 'Special Packages' && item.category !== 'PACKAGE' ? item.category : null)
                || (matchedMaster?.header && matchedMaster.header !== 'Special Packages' ? matchedMaster.header : null)
                || (matchedMaster?.category && matchedMaster.category !== 'Special Packages' ? matchedMaster.category : null)
                || matchedMaster?.header
                || item.category
                || 'Special Packages';

              if (!pkgMap[key]) {
                pkgMap[key] = {
                  name,
                  customerName,
                  category: resolvedCategory,
                  unitsSold: 0,
                  rate: Number(item.price) || 0,
                  discount: Number(item.discAmount) || 0,
                  totalRevenue: 0
                };
              }
              const q = Number(item.qty) || 1;
              const disc = Number(item.discAmount) || 0;
              pkgMap[key].unitsSold += q;
              pkgMap[key].totalRevenue += Math.max(0, ((Number(item.price) || 0) * q) - disc);
            }
          });
        });
        const list = Object.values(pkgMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
        return list.map(p => [
          p.name,
          p.customerName,
          p.category,
          String(p.unitsSold),
          `₹${p.rate.toLocaleString()}`,
          `₹${p.totalRevenue.toLocaleString()}`
        ]);
      }

      case 'Package Redemption': {
        const redemptionRows = [];

        // 1. From live backend reports API if rows were returned
        if (backendRedemptions && backendRedemptions.length > 0) {
          backendRedemptions.forEach(r => {
            redemptionRows.push([
              r.clientName || 'Customer',
              r.packageName || 'Service Package',
              String(r.totalSessions || 1),
              String(r.redeemedSessions || 0),
              String(r.remainingSessions || 0),
              toDisplayDate(r.date || 'Today'),
              r.status || (r.remainingSessions === 0 ? 'COMPLETED' : 'ACTIVE')
            ]);
          });
          return redemptionRows;
        }

        // 2. Aggregate from real orders, redemption events & master packages
        const seenKeys = new Set();
        const masterPackages = getPackages() || [];

        // Count all redemption deductions per customer + package across entire order history
        const redemptionsByCustPkg = {};
        (orders || []).forEach(o => {
          const custName = o.guest?.name || o.customer || 'Customer';
          (o.items || []).forEach(item => {
            const isRedeem = item.category === 'PACKAGE_REDEMPTION' ||
                             item.itemType === 'package_redemption' ||
                             (item.name && String(item.name).toLowerCase().startsWith('redemption:'));
            if (isRedeem) {
              const cleanPkg = String(item.name).replace(/^redemption:\s*/i, '').trim().toLowerCase();
              const key = `${custName.toLowerCase()}_${cleanPkg}`;
              const qty = Number(item.qty) || 1;
              redemptionsByCustPkg[key] = (redemptionsByCustPkg[key] || 0) + qty;
            }
          });
          (o.packageRedemptions || []).forEach(pr => {
            const cleanPkg = String(pr.packageName || '').trim().toLowerCase();
            const key = `${custName.toLowerCase()}_${cleanPkg}`;
            const used = Number(pr.sessionsUsed) || 1;
            redemptionsByCustPkg[key] = Math.max(redemptionsByCustPkg[key] || 0, used);
          });
        });

        // A. Extract package activities (both redemptions and package sales) within filtered date range
        filteredOrders.forEach(o => {
          const custName = o.guest?.name || o.customer || 'Customer';
          const orderDate = o.dateDisplay || o.date || 'Today';

          (o.items || []).forEach(item => {
            const isRedeem = item.category === 'PACKAGE_REDEMPTION' ||
                             item.itemType === 'package_redemption' ||
                             (item.name && String(item.name).toLowerCase().startsWith('redemption:'));
            const isPkgSale = item.category === 'PACKAGE' || item.itemType === 'package';

            if (isRedeem) {
              const pkgName = String(item.name).replace(/^redemption:\s*/i, '').trim();
              const key = `${custName.toLowerCase()}_${pkgName.toLowerCase()}`;
              if (!seenKeys.has(key)) {
                seenKeys.add(key);
                const matchedPkg = masterPackages.find(p => p.name && p.name.trim().toLowerCase() === pkgName.toLowerCase());
                const total = Number(matchedPkg?.totalSessions || item.totalSessions || 8);
                const redeemed = redemptionsByCustPkg[key] || Number(item.qty || 1);
                const remaining = Math.max(0, total - redeemed);
                redemptionRows.push([
                  custName,
                  pkgName,
                  String(total),
                  String(redeemed),
                  String(remaining),
                  toDisplayDate(orderDate),
                  remaining === 0 ? 'COMPLETED' : 'ACTIVE'
                ]);
              }
            } else if (isPkgSale) {
              const pkgName = item.name.trim();
              const key = `${custName.toLowerCase()}_${pkgName.toLowerCase()}`;
              if (!seenKeys.has(key)) {
                seenKeys.add(key);
                const matchedPkg = masterPackages.find(p => p.name && p.name.trim().toLowerCase() === pkgName.toLowerCase());
                const total = Number(matchedPkg?.totalSessions || item.totalSessions || 1);
                const redeemed = redemptionsByCustPkg[key] || 0;
                const remaining = Math.max(0, total - redeemed);
                redemptionRows.push([
                  custName,
                  pkgName,
                  String(total),
                  String(redeemed),
                  String(remaining),
                  toDisplayDate(orderDate),
                  remaining === 0 ? 'COMPLETED' : 'ACTIVE'
                ]);
              }
            }
          });
        });

        // B. Customers' active / historical packages from CRM
        const allCustomers = getCustomers();
        allCustomers.forEach(cust => {
          (cust.packages || []).forEach(pkg => {
            const key = `${cust.name?.toLowerCase()}_${pkg.name?.toLowerCase()}`;
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              const total = Number(pkg.totalSessions || 1);
              const rem = Number(pkg.remainingSessions !== undefined ? pkg.remainingSessions : (total - (redemptionsByCustPkg[key] || 0)));
              const used = Math.max(0, total - rem);
              redemptionRows.push([
                cust.name,
                pkg.name,
                String(total),
                String(used),
                String(rem),
                toDisplayDate(pkg.purchaseDate || 'Today'),
                pkg.status || (rem === 0 ? 'COMPLETED' : 'ACTIVE')
              ]);
            }
          });
        });

        return redemptionRows;
      }

      // REAL DATA: Monthly Sale (Aggregated from real orders by month)
      case 'Monthly Sale': {
        const monthMap = {};
        filteredOrders.forEach(o => {
          const dStr = o.dateDisplay || o.date || '';
          let monthKey = 'Current Month';
          const ms = parseDateToMs(dStr);
          if (ms) {
            const d = new Date(ms);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            monthKey = `${months[d.getMonth()]}-${d.getFullYear()}`;
          }
          if (!monthMap[monthKey]) {
            monthMap[monthKey] = {
              month: monthKey,
              ordersCount: 0,
              serviceRev: 0,
              productRev: 0,
              totalRev: 0
            };
          }
          monthMap[monthKey].ordersCount += 1;
          (o.items || []).forEach(item => {
            const price = Number(item.price) || 0;
            const qty = Number(item.qty) || 1;
            const disc = Number(item.discAmount) || 0;
            const line = Math.max(0, (price * qty) - disc);
            const isProd = item.itemType === 'product' || (!item.itemType && item.category === 'PRODUCT');
            if (isProd) {
              monthMap[monthKey].productRev += line;
            } else {
              monthMap[monthKey].serviceRev += line;
            }
          });
          monthMap[monthKey].totalRev += (Number(o.grandTotal ?? o.subTotal ?? 0));
        });
        return Object.values(monthMap).map(m => [
          m.month,
          String(m.ordersCount),
          `₹${m.serviceRev.toLocaleString()}`,
          `₹${m.productRev.toLocaleString()}`,
          `₹${m.totalRev.toLocaleString()}`
        ]);
      }

      // REAL DATA: Day Wise Report (Aggregated day-by-day cash vs digital collections)
      case 'Day Wise Report': {
        const dayMap = {};
        filteredOrders.forEach(o => {
          const d = o.dateDisplay || o.date || 'Unknown Date';
          if (!dayMap[d]) {
            dayMap[d] = {
              date: d,
              ordersCount: 0,
              cashSales: 0,
              digitalSales: 0,
              totalRev: 0
            };
          }
          dayMap[d].ordersCount += 1;
          const amt = Number(o.grandTotal ?? o.subTotal ?? 0);
          const method = (o.paymentMethod || '').toLowerCase();
          const hasCash = method === 'cash' || (o.payments && o.payments.some(p => (p.method || '').toLowerCase() === 'cash'));
          if (hasCash) {
            dayMap[d].cashSales += amt;
          } else {
            dayMap[d].digitalSales += amt;
          }
          dayMap[d].totalRev += amt;
        });
        const sortedDays = Object.values(dayMap).sort((a, b) => parseDateToMs(b.date) - parseDateToMs(a.date));
        return sortedDays.map(r => [
          r.date,
          String(r.ordersCount),
          `₹${r.cashSales.toLocaleString()}`,
          `₹${r.digitalSales.toLocaleString()}`,
          `₹${r.totalRev.toLocaleString()}`
        ]);
      }

      case 'PnL Report': {
        // 1. Calculate live POS Revenue from non-cancelled filtered orders
        let serviceSales = 0;
        let productSales = 0;
        let packageSales = 0;

        filteredOrders.forEach(o => {
          if (o.status === 'Cancelled' || o.status === 'Rejected') return;
          const items = o.items || [];
          if (items.length > 0) {
            items.forEach(item => {
              const price = Number(item.price) || 0;
              const qty = Number(item.qty) || 1;
              const disc = Number(item.discAmount) || 0;
              const lineTotal = Math.max(0, (price * qty) - disc);

              const type = (item.itemType || '').toLowerCase();
              const cat = (item.category || '').toUpperCase();
              const isProd = type === 'product' || cat === 'PRODUCT';
              const isPkg = type === 'package' || cat === 'PACKAGE';

              if (isProd) {
                productSales += lineTotal;
              } else if (isPkg) {
                packageSales += lineTotal;
              } else {
                serviceSales += lineTotal;
              }
            });
          } else {
            serviceSales += Number(o.grandTotal ?? o.subTotal ?? 0);
          }
        });

        const totalRevenue = serviceSales + productSales + packageSales;

        // 2. Classify expenses dynamically from live filtered expenses (only include real recorded expenses)
        let totalDirectExpenses = 0;
        let totalOverhead = 0;
        const expenseTypeMap = {};

        filteredExpenses.forEach(exp => {
          const amt = Number(exp.amount) || 0;
          if (amt <= 0) return;
          const typeName = exp.expenseType?.trim() || 'General Expense';
          const t = typeName.toLowerCase();
          const n = (exp.notes || exp.remark || '').toLowerCase();
          const combined = `${t} ${n}`;

          const isDirect = combined.includes('consumable') || combined.includes('stock') || combined.includes('product') || combined.includes('material') || combined.includes('inventory');

          if (!expenseTypeMap[typeName]) {
            expenseTypeMap[typeName] = {
              name: typeName,
              amount: 0,
              isDirect,
            };
          }
          expenseTypeMap[typeName].amount += amt;

          if (isDirect) {
            totalDirectExpenses += amt;
          } else {
            totalOverhead += amt;
          }
        });

        const netProfit = totalRevenue - (totalDirectExpenses + totalOverhead);

        const rows = [];

        // 1. Revenue row (only if there are orders or if everything is empty)
        if (totalRevenue > 0 || Object.keys(expenseTypeMap).length === 0) {
          rows.push([
            'Services & Products Sales',
            `₹${totalRevenue.toLocaleString()}`,
            '₹0',
            '₹0',
            `+₹${totalRevenue.toLocaleString()}`
          ]);
        }

        // 2. ONLY display rows for actual expenses recorded (all dummy zero rows removed)
        Object.values(expenseTypeMap).forEach(item => {
          rows.push([
            item.name,
            '₹0',
            item.isDirect ? `₹${item.amount.toLocaleString()}` : '₹0',
            !item.isDirect ? `₹${item.amount.toLocaleString()}` : '₹0',
            `-₹${item.amount.toLocaleString()}`
          ]);
        });

        // 3. Summary row
        rows.push([
          'NET PROFIT (EBITDA)',
          `₹${totalRevenue.toLocaleString()}`,
          `₹${totalDirectExpenses.toLocaleString()}`,
          `₹${totalOverhead.toLocaleString()}`,
          netProfit >= 0 ? `+₹${netProfit.toLocaleString()}` : `-₹${Math.abs(netProfit).toLocaleString()}`
        ]);

        return rows;
      }
      case 'Daily Stock':
        return [];

      // REAL DATA: Appointment Report (From live appointments storage)
      case 'Appointment Report': {
        const sorted = [...filteredAppointments].sort((a, b) => parseDateToMs(b.date) - parseDateToMs(a.date));
        return sorted.map(a => [
          getApptInvoiceNumber(a, orders),
          a.guest || 'Walk-in Customer',
          a.service || 'Salon Service',
          a.staff || 'Unassigned',
          a.timeSlot || '-',
          a.date || '-',
          a.status || 'Scheduled'
        ]);
      }

      // REAL DATA: Cancelled Orders (From live POS orders & Appointments with Cancelled/Rejected status)
      case 'Cancelled Orders': {
        const cancelledFromOrders = filteredOrders.filter(o => {
          const st = (o.status || '').toLowerCase();
          return st === 'cancelled' || st === 'rejected';
        });
        const cancelledFromAppts = filteredAppointments.filter(a => {
          const st = (a.status || '').toLowerCase();
          return st === 'cancelled';
        });

        const combined = [...cancelledFromOrders];
        cancelledFromAppts.forEach(a => {
          const inv = getApptInvoiceNumber(a, orders);
          const exists = combined.some(o => (o.invoiceNo && `#${o.invoiceNo}` === inv) || (o.invoiceId && `#${o.invoiceId}` === inv) || (o.id && `#${o.id}` === inv));
          if (!exists) {
            combined.push({
              invoiceNo: inv.replace(/^#/, ''),
              dateDisplay: a.date,
              guest: { name: a.guest },
              items: [{ name: a.service }],
              grandTotal: a.price,
              cancelReason: a.instruction || 'Client Rescheduled / Cancelled',
              status: 'Cancelled'
            });
          }
        });

        if (combined.length === 0) {
          return [];
        }

        const sorted = combined.sort((a, b) => parseDateToMs(b.dateDisplay || b.date) - parseDateToMs(a.dateDisplay || a.date));
        return sorted.map(o => {
          const invNo = o.invoiceNo ? (String(o.invoiceNo).startsWith('#') ? o.invoiceNo : `#${o.invoiceNo}`) : (o.invoiceId ? `#${o.invoiceId}` : `#INV-${o.id || '101'}`);
          const custName = o.guest?.name || o.customer || o.guest || 'Walk-in Customer';
          const itemsStr = (o.items && o.items.length > 0) ? o.items.map(i => i.name).join(', ') : (o.service || '1 Service');
          const amt = Number(o.grandTotal ?? o.price ?? o.subTotal ?? 0);
          const reason = o.cancelReason || o.reason || 'Customer Cancellation Request';
          return [
            invNo,
            o.dateDisplay || o.date || '18-Sep-2026',
            custName,
            itemsStr,
            `₹${amt.toLocaleString()}`,
            reason,
            'Cancelled'
          ];
        });
      }

      // REAL DATA: Cash Transactions (From live POS Cash sales and Cash Expenses)
      case 'Cash Transactions': {
        const list = [];

        // 1. Cash collections from live POS orders
        filteredOrders.forEach(o => {
          const method = (o.paymentMethod || '').toLowerCase();
          const hasCashInPayments = o.payments && o.payments.some(p => (p.method || '').toLowerCase() === 'cash');
          const isCash = method === 'cash' || hasCashInPayments;
          if (isCash) {
            let cashAmt = 0;
            if (hasCashInPayments) {
              const cp = o.payments.find(p => (p.method || '').toLowerCase() === 'cash');
              cashAmt = Number(cp?.amount) || 0;
            } else {
              cashAmt = Number(o.grandTotal ?? o.subTotal ?? 0);
            }

            const invNo = o.invoiceNo ? (String(o.invoiceNo).startsWith('#') ? o.invoiceNo : `#${o.invoiceNo}`) : (o.invoiceId ? `#${o.invoiceId}` : `#INV-${o.id || '101'}`);
            const dateStr = o.dateDisplay || o.date || '18-Sep-2026';
            const timeStr = o.time || '11:30 AM';
            const staff = (o.items && o.items[0]?.staff) || 'Counter 1';
            list.push({
              invoiceNo: invNo,
              dateTime: `${dateStr} ${timeStr}`,
              rawDate: dateStr,
              type: 'POS Cash Sale',
              staffCounter: staff,
              amount: `+₹${cashAmt.toLocaleString()}`,
              mode: 'Cash',
              status: (o.status || 'Completed') === 'Cancelled' ? 'Cancelled' : 'Completed'
            });
          }
        });

        // 2. Cash paid out from live salon expenses (petty cash)
        (filteredExpenses || []).forEach(exp => {
          if ((exp.paymode || '').toLowerCase() === 'cash') {
            const expNo = exp.voucherNo ? (String(exp.voucherNo).startsWith('#') ? exp.voucherNo : `#${exp.voucherNo}`) : (exp.id ? (String(exp.id).startsWith('#') ? exp.id : `#${exp.id}`) : '#EXP-101');
            const dateStr = exp.date || '18-Sep-2026';
            list.push({
              invoiceNo: expNo,
              dateTime: `${dateStr} 10:00 AM`,
              rawDate: dateStr,
              type: exp.expenseType ? `Expense (${exp.expenseType})` : 'Petty Cash Expense',
              staffCounter: exp.paidBy || 'Petty Cash Desk',
              amount: `-₹${(Number(exp.amount) || 0).toLocaleString()}`,
              mode: 'Cash',
              status: 'Paid'
            });
          }
        });

        if (list.length === 0) {
          return [];
        }

        list.sort((a, b) => parseDateToMs(b.rawDate) - parseDateToMs(a.rawDate));
        return list.map(t => [
          t.invoiceNo,
          t.dateTime,
          t.type,
          t.staffCounter,
          t.amount,
          t.mode,
          t.status
        ]);
      }

      default:
        return [];
    }
  };

  const columns = getReportColumns();
  const rows = getReportRows();

  const handleShowReport = () => {
    setIsRefreshing(true);
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 300);
  };

  const handleExportCSV = () => {
    if (rows.length === 0) {
      alert('No data available to export for this report.');
      return;
    }
    const header = columns.join(',');
    const body = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(`${header}\n${body}`);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `${selectedReport.replace(/\s+/g, '_')}_${toDisplayDate(appliedFromDate)}_to_${toDisplayDate(appliedToDate)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      {/* Left Sidebar: Report Directory */}
      <div className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="text-indigo-600" size={18} />
            <h2 className="font-bold text-slate-800 text-sm">Reports Library</h2>
          </div>
          <p className="text-[11px] text-slate-400">Real-time reports reading directly from operational transactions</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-4 max-h-[calc(100vh-140px)]">
          {reportCategories.map(cat => (
            <div key={cat.category} className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">
                {cat.category}
              </span>
              {cat.reports.map(rep => {
                const isActive = selectedReport === rep;
                return (
                  <button
                    key={rep}
                    onClick={() => setSelectedReport(rep)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{rep}</span>
                    {isActive && <ChevronRight size={12} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area: Filter & Data Table */}
      <div className="flex-1 flex flex-col p-4 md:p-6 space-y-4 overflow-hidden">
        {/* Top Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
            <div>
              <h1 className="text-lg font-bold text-slate-800">{selectedReport}</h1>
              <span className="text-xs text-slate-500">Real-time operational reporting & GST compliance</span>
            </div>
            <button 
              onClick={handleExportCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Download size={15} /> Export as XLSX
            </button>
          </div>

          {/* Filter Controls Row */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* From Date */}
            <div className="flex items-center gap-2 border border-slate-300 hover:border-indigo-400 focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 px-3 py-1.5 rounded-xl bg-white shadow-2xs transition-all">
              <span className="text-slate-500 font-semibold">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none text-xs cursor-pointer"
              />
            </div>

            {/* To Date */}
            <div className="flex items-center gap-2 border border-slate-300 hover:border-indigo-400 focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 px-3 py-1.5 rounded-xl bg-white shadow-2xs transition-all">
              <span className="text-slate-500 font-semibold">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none text-xs cursor-pointer"
              />
            </div>

            <button 
              type="button"
              onClick={handleShowReport}
              disabled={isRefreshing}
              className={`bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-5 py-2 rounded-xl font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                isRefreshing ? 'opacity-80 scale-95' : ''
              }`}
            >
              <Filter size={13} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? 'Updating...' : 'Show Report'}</span>
            </button>
          </div>
        </div>

        {/* Report Results Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
          <div className="overflow-x-auto p-4 flex-1">
            {rows.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <Inbox size={42} className="mx-auto mb-2.5 text-slate-300" />
                <p className="font-bold text-slate-600 text-sm">No records found for {selectedReport}</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Orders billed in the POS Quick Sale module for this date range ({toDisplayDate(appliedFromDate)} → {toDisplayDate(appliedToDate)}) will appear here live.
                </p>
              </div>
            ) : (
              <table className="w-full min-w-[750px] text-left border-collapse text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    {columns.map((col, idx) => (
                      <th key={idx} className="py-3 px-4">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-slate-50 transition-colors">
                      {row.map((cell, cellIdx) => (
                        <td 
                          key={cellIdx} 
                          className={`py-3.5 px-4 ${
                            cellIdx === 0 ? 'font-semibold text-slate-800' : 'text-slate-600'
                          } ${
                            cell.startsWith('+') ? 'text-emerald-600 font-bold' : cell.startsWith('-') ? 'text-rose-600 font-bold' : ''
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
            <span>Showing records for range <strong>{appliedFromDate}</strong> → <strong>{appliedToDate}</strong></span>
            <span className="font-semibold">{rows.length} rows loaded</span>
          </div>
        </div>
      </div>
    </div>
  );
}
