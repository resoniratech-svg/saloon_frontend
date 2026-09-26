import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, DollarSign, Lock, Unlock, ArrowDownRight, ArrowUpRight,
  CheckCircle2, Clock, AlertCircle, Plus, X, Receipt, CreditCard,
  Banknote, History, Wallet, ShieldAlert, Sparkles, Filter, ChevronRight
} from 'lucide-react';
import { getCurrentShift, openCounter, closeCounter, getShiftHistory } from '../utils/cashStorage';
import { getOrders } from '../utils/orderStorage';
import { getExpenses } from '../utils/expenseStorage';
import { getAppointments } from '../utils/appointmentStorage';
import { getCurrentUser } from '../utils/saasStorage';
import InvoiceBillModal from '../components/common/InvoiceBillModal';

export default function CashManagementPage() {
  const [currentShift, setCurrentShift] = useState(() => getCurrentShift());
  const [shiftHistory, setShiftHistory] = useState(() => getShiftHistory());
  const [allOrders, setAllOrders] = useState(() => getOrders());
  const [allExpenses, setAllExpenses] = useState(() => getExpenses());
  const [allAppointments, setAllAppointments] = useState(() => getAppointments());
  const [activeTab, setActiveTab] = useState('Revenue'); // 'Revenue' | 'Expenses' | 'History'
  const [dateFilter, setDateFilter] = useState('All'); // 'Today' | 'Month' | 'All'
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);

  // Modals
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);

  // Form states
  const [openBalanceInput, setOpenBalanceInput] = useState('5000');
  const [closeForm, setCloseForm] = useState({
    actualCash: '',
    inStoreCash: '',
    remarks: ''
  });

  const currentUser = getCurrentUser();

  // Listen for storage changes
  useEffect(() => {
    const handleSync = () => {
      setCurrentShift(getCurrentShift());
      setShiftHistory(getShiftHistory());
      setAllOrders(getOrders());
      setAllExpenses(getExpenses());
      setAllAppointments(getAppointments());
    };

    window.addEventListener('counterStatusChanged', handleSync);
    window.addEventListener('ordersUpdated', handleSync);
    window.addEventListener('expensesUpdated', handleSync);
    window.addEventListener('appointmentsUpdated', handleSync);

    return () => {
      window.removeEventListener('counterStatusChanged', handleSync);
      window.removeEventListener('ordersUpdated', handleSync);
      window.removeEventListener('expensesUpdated', handleSync);
      window.removeEventListener('appointmentsUpdated', handleSync);
    };
  }, []);

  // Helper to cross-resolve payment method if order was initially 'Pay at Salon' but was collected/paid
  const resolveOrderPayment = (order) => {
    let method = order?.paymentMethod || 'Paid';
    let status = order?.paymentStatus || 'Paid';
    let payments = order?.payments || [];

    if (!method || method.toLowerCase() === 'pay at salon' || status === 'Unpaid') {
      const cleanPhone = (p) => String(p || '').replace(/\D/g, '');
      const oPhone = cleanPhone(order?.guest?.mobile || order?.guest?.phone);
      const oName = (order?.guest?.name || order?.customer || '').trim().toLowerCase();

      const linkedAppt = (allAppointments || []).find(a => 
        (a.orderId && (String(a.orderId) === String(order.id) || String(a.orderId) === String(order.invoiceId) || String(a.orderId) === String(order.invoiceNo))) ||
        (a.invoiceId && (String(a.invoiceId) === String(order.invoiceId) || String(a.invoiceId) === String(order.id) || String(a.invoiceId) === String(order.invoiceNo))) ||
        (order.appointmentId && String(order.appointmentId) === String(a.id)) ||
        (oPhone && cleanPhone(a.mobile) && oPhone.endsWith(cleanPhone(a.mobile)) && (a.date === order.date || a.date === order.dateDisplay)) ||
        (oName && (a.guest || '').trim().toLowerCase() === oName && (a.date === order.date || a.date === order.dateDisplay))
      );

      if (linkedAppt && (linkedAppt.paymentStatus === 'Paid' || (linkedAppt.paymentMethod && linkedAppt.paymentMethod.toLowerCase() !== 'pay at salon'))) {
        method = linkedAppt.paymentMethod || 'Card';
        status = 'Paid';
        payments = [{ method, amount: order.grandTotal ?? order.subTotal ?? linkedAppt.price ?? 0 }];
      }
    }

    return { method, status, payments };
  };

  // Filter orders and expenses according to selected date filter
  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
  }, []);

  const currentMonthYear = useMemo(() => {
    const d = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]}-${d.getFullYear()}`;
  }, []);

  const filteredOrders = useMemo(() => {
    return (allOrders || []).filter(order => {
      if (!order) return false;
      const orderDate = order.dateDisplay || order.date || '';
      if (dateFilter === 'Today') {
        return orderDate.includes(todayStr) || orderDate.toLowerCase().includes('today');
      }
      if (dateFilter === 'Month') {
        return orderDate.includes(currentMonthYear);
      }
      return true;
    }).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [allOrders, dateFilter, todayStr, currentMonthYear]);

  const filteredExpenses = useMemo(() => {
    return (allExpenses || []).filter(exp => {
      if (!exp) return false;
      const expDate = exp.date || '';
      if (dateFilter === 'Today') {
        return expDate.includes(todayStr);
      }
      if (dateFilter === 'Month') {
        return expDate.includes(currentMonthYear);
      }
      return true;
    }).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [allExpenses, dateFilter, todayStr, currentMonthYear]);

  // Financial calculations
  const openingFloat = Number(currentShift?.openingBalance || 0);

  // Cash collections from POS sales
  const cashSalesTotal = useMemo(() => {
    return filteredOrders.reduce((sum, o) => {
      const res = resolveOrderPayment(o);
      const isCash = (res.method || '').toLowerCase() === 'cash' || 
                     (res.payments && res.payments.some(p => (p.method || '').toLowerCase() === 'cash'));
      const isPaid = res.status === 'Paid' || (res.method && res.method.toLowerCase() !== 'pay at salon');
      if (isCash && isPaid) {
        return sum + (Number(o.grandTotal ?? o.subTotal ?? 0));
      }
      return sum;
    }, 0);
  }, [filteredOrders, allAppointments]);

  // Digital collections (Cards, UPI, GPay, HDFC)
  const digitalSalesTotal = useMemo(() => {
    return filteredOrders.reduce((sum, o) => {
      const res = resolveOrderPayment(o);
      const isDigital = (res.method || '').toLowerCase() !== 'cash' && 
                        (res.method || '').toLowerCase() !== 'pay at salon';
      const isPaid = res.status === 'Paid';
      if (isDigital && isPaid) {
        return sum + (Number(o.grandTotal ?? o.subTotal ?? 0));
      }
      return sum;
    }, 0);
  }, [filteredOrders, allAppointments]);

  // Total gross revenue
  const totalRevenue = cashSalesTotal + digitalSalesTotal;

  // Expenses paid out of register cash (petty cash)
  const cashExpensesTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => {
      const isCash = (exp.paymode || '').toLowerCase() === 'cash';
      return isCash ? sum + (Number(exp.amount) || 0) : sum;
    }, 0);
  }, [filteredExpenses]);

  // Non-cash expenses (Bank, Card)
  const digitalExpensesTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => {
      const isNotCash = (exp.paymode || '').toLowerCase() !== 'cash';
      return isNotCash ? sum + (Number(exp.amount) || 0) : sum;
    }, 0);
  }, [filteredExpenses]);

  const totalExpenses = cashExpensesTotal + digitalExpensesTotal;

  // Mathematical Expected Cash in Drawer
  const expectedDrawerCash = openingFloat + cashSalesTotal - cashExpensesTotal;

  // Handlers for Shift Control
  const handleOpenCounterConfirm = () => {
    const val = parseFloat(openBalanceInput);
    if (isNaN(val) || val < 0) {
      alert('Please enter a valid opening float amount.');
      return;
    }
    const staffName = currentUser?.name || currentUser?.username || 'Cashier Terminal';
    openCounter(val, staffName);
    setShowOpenModal(false);
  };

  const handleOpenCloseModal = () => {
    setCloseForm({
      actualCash: String(expectedDrawerCash),
      inStoreCash: String(openingFloat),
      remarks: 'Shift closed normally'
    });
    setShowCloseModal(true);
  };

  const handleCloseCounterConfirm = () => {
    const counted = parseFloat(closeForm.actualCash);
    if (isNaN(counted) || counted < 0) {
      alert('Please enter a valid physical counted cash amount.');
      return;
    }
    const inStore = parseFloat(closeForm.inStoreCash) || 0;
    const variance = counted - expectedDrawerCash;
    const staffName = currentUser?.name || currentUser?.username || 'Cashier Terminal';

    closeCounter({
      closingBalance: counted,
      inStoreCash: inStore,
      expectedCash: expectedDrawerCash,
      variance: variance,
      remarks: closeForm.remarks,
      closedBy: staffName
    });

    setShowCloseModal(false);
  };

  const calculatedVariance = useMemo(() => {
    const counted = parseFloat(closeForm.actualCash);
    if (isNaN(counted)) return 0;
    return counted - expectedDrawerCash;
  }, [closeForm.actualCash, expectedDrawerCash]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-4 md:p-6 space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-800">Cash Management</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              currentShift?.status === 'ACTIVE'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              {currentShift?.status === 'ACTIVE' ? 'Counter Active (Open)' : 'Counter Closed'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Session: <strong className="text-slate-700 font-mono">{currentShift?.shiftId || 'SHIFT-101'}</strong> • 
            Opened: <span className="text-slate-700 font-medium">{currentShift?.openedAt || 'Today'}</span> by <strong className="text-indigo-600">{currentShift?.openedBy || 'Cashier'}</strong>
          </p>
        </div>

        {/* Date Filter & Counter Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Quick Date Filters */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {['Today', 'Month', 'All'].map(filter => (
              <button
                key={filter}
                type="button"
                onClick={() => setDateFilter(filter)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  dateFilter === filter
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {filter === 'Month' ? 'This Month' : filter}
              </button>
            ))}
          </div>

          {currentShift?.status === 'ACTIVE' ? (
            <button
              onClick={handleOpenCloseModal}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Lock size={15} />
              <span>Close Counter Shift</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setOpenBalanceInput('5000');
                setShowOpenModal(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Unlock size={15} />
              <span>Open New Counter Shift</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Opening Cash Float */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Opening Float</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Banknote size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            ₹{openingFloat.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Starting cash float in drawer</p>
        </div>

        {/* Card 2: Total Sales Revenue */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Sales Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownRight size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            ₹{totalRevenue.toLocaleString()}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
            <span className="font-semibold text-emerald-600 font-mono">₹{cashSalesTotal.toLocaleString()} Cash</span>
            <span>•</span>
            <span className="font-mono">₹{digitalSalesTotal.toLocaleString()} Digital</span>
          </div>
        </div>

        {/* Card 3: Counter Cash Expenses */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cash Expenses</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono">
            -₹{cashExpensesTotal.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Petty cash disbursed from counter</p>
        </div>

        {/* Card 4: Estimated Live Cash in Drawer */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between text-indigo-200 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Expected Drawer Cash</span>
            <div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center">
              <Wallet size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ₹{expectedDrawerCash.toLocaleString()}
          </div>
          <div className="text-[11px] text-indigo-200 mt-1">
            Float (₹{openingFloat}) + Cash (₹{cashSalesTotal}) - Out (₹{cashExpensesTotal})
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 px-6 pt-4 gap-6 bg-slate-50/50">
          {[
            { id: 'Revenue', label: 'Revenue Orders', count: filteredOrders.length },
            { id: 'Expenses', label: 'Petty Cash Expenses', count: filteredExpenses.length },
            { id: 'History', label: 'Shift Handover Logs', count: shiftHistory.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-xs md:text-sm font-bold tracking-wide transition-all relative flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'text-indigo-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === tab.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {tab.count}
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab 1: Live Revenue Orders */}
        {activeTab === 'Revenue' && (
          <div className="overflow-x-auto p-4 flex-1">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Receipt size={40} className="mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600">No revenue orders for this period</p>
                <p className="text-xs text-slate-400 mt-0.5">Orders billed in POS will appear here live</p>
              </div>
            ) : (
              <table className="w-full min-w-[760px] text-left border-collapse">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Billed Items</th>
                    <th className="py-3 px-4">Pay Mode</th>
                    <th className="py-3 px-4">Drawer Impact</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredOrders.map(order => {
                    const resolved = resolveOrderPayment(order);
                    const isCash = (resolved.method || '').toLowerCase() === 'cash' ||
                                   (resolved.payments && resolved.payments.some(p => (p.method || '').toLowerCase() === 'cash'));
                    const isPayAtSalon = (resolved.method || '').toLowerCase() === 'pay at salon';

                    return (
                      <tr key={order.id || order.invoiceNo} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                          #{order.invoiceNo || order.invoiceId || order.id}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <span className="font-semibold">{order.dateDisplay || order.date}</span>
                          {order.time && <span className="text-slate-400 block text-[11px]">{order.time}</span>}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {order.guest?.name || order.customer || 'Walk-in Guest'}
                          {order.guest?.mobile && (
                            <span className="block text-[11px] text-slate-400 font-normal">{order.guest.mobile}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {(order.items || []).map(i => i.name).join(', ') || 'Salon Service'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                            isCash
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isPayAtSalon
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {resolved.method || 'Paid'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {isCash ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <Plus size={12} /> Cash In (+₹{order.grandTotal ?? order.subTotal ?? 0})
                            </span>
                          ) : (
                            <span className="text-slate-400">Digital / No Drawer Change</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900 font-mono text-sm">
                          ₹{Number(order.grandTotal ?? order.subTotal ?? 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForInvoice(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                            title="View Full Bill Receipt"
                          >
                            <Receipt size={13} />
                            <span>Bill</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Petty Cash Expenses */}
        {activeTab === 'Expenses' && (
          <div className="overflow-x-auto p-4 flex-1">
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Receipt size={40} className="mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600">No expenses recorded for this period</p>
                <p className="text-xs text-slate-400 mt-0.5">Petty cash payments created in Expenses module will appear here</p>
              </div>
            ) : (
              <table className="w-full min-w-[760px] text-left border-collapse">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Expense ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Category & Purpose</th>
                    <th className="py-3 px-4">Paid Mode</th>
                    <th className="py-3 px-4">Drawer Impact</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredExpenses.map(exp => {
                    const isCash = (exp.paymode || '').toLowerCase() === 'cash';

                    return (
                      <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-rose-600">{exp.id}</td>
                        <td className="py-3.5 px-4 text-slate-600 font-semibold">{exp.date}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800 block text-xs">{exp.expenseType || exp.category || 'General Expense'}</span>
                          <span className="text-[11px] text-slate-500">{exp.notes || exp.title || '-'}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                            isCash
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {exp.paymode || 'Cash'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {isCash ? (
                            <span className="text-rose-600 font-semibold flex items-center gap-1">
                              - Cash Out (-₹{exp.amount})
                            </span>
                          ) : (
                            <span className="text-slate-400">Direct Bank / Card</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-rose-600 font-mono text-sm">
                          -₹{Number(exp.amount || 0).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 3: Shift Handover Logs */}
        {activeTab === 'History' && (
          <div className="overflow-x-auto p-4 flex-1">
            {shiftHistory.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <History size={40} className="mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600">No closed shifts yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Closing shifts will record shift settlement logs here</p>
              </div>
            ) : (
              <table className="w-full min-w-[850px] text-left border-collapse">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Shift ID</th>
                    <th className="py-3 px-4">Open Time & Cashier</th>
                    <th className="py-3 px-4">Close Time</th>
                    <th className="py-3 px-4 text-right">Opening Float</th>
                    <th className="py-3 px-4 text-right">Expected Cash</th>
                    <th className="py-3 px-4 text-right">Actual Counted</th>
                    <th className="py-3 px-4 text-center">Variance</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {shiftHistory.map((s, idx) => {
                    const variance = Number(s.variance || 0);

                    return (
                      <tr key={s.shiftId || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">{s.shiftId}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 block">{s.openedAt}</span>
                          <span className="text-[11px] text-slate-500">By {s.openedBy}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-semibold">{s.closedAt || 'Closed'}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-700 font-semibold">
                          ₹{Number(s.openingBalance || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-indigo-700 font-bold">
                          ₹{Number(s.expectedCash || s.closingBalance || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-900 font-bold">
                          ₹{Number(s.closingBalance || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            variance === 0
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : variance < 0
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {variance === 0 ? '✔ Balanced' : variance < 0 ? `Shortage -₹${Math.abs(variance)}` : `Excess +₹${variance}`}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 italic max-w-xs truncate">
                          {s.remarks || 'Normal shift settlement'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* OPEN COUNTER MODAL */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowOpenModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Unlock size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Open Counter Shift</h3>
                  <p className="text-xs text-slate-400">Initialize cash drawer for current shift</p>
                </div>
              </div>
              <button onClick={() => setShowOpenModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Opening Cash Float (₹)*
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={openBalanceInput}
                    onChange={(e) => setOpenBalanceInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-base font-bold font-mono focus:outline-none focus:border-indigo-600"
                    placeholder="5000"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Starting currency notes and coins kept in the register for change</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowOpenModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOpenCounterConfirm}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
              >
                Open Counter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLOSE COUNTER MODAL */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowCloseModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Close Counter & Shift Settlement</h3>
                  <p className="text-xs text-slate-400">Reconcile physical cash drawer notes</p>
                </div>
              </div>
              <button onClick={() => setShowCloseModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            {/* Reconciliation Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Opening Cash Float:</span>
                <span className="font-mono font-bold">₹{openingFloat}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>(+) Cash Sales Inflow:</span>
                <span className="font-mono font-bold">+₹{cashSalesTotal}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>(-) Cash Expenses Disbursed:</span>
                <span className="font-mono font-bold">-₹{cashExpensesTotal}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-2 text-sm">
                <span>Expected Drawer Cash:</span>
                <span className="font-mono text-indigo-700">₹{expectedDrawerCash}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Actual Physical Cash Counted (₹)*
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={closeForm.actualCash}
                    onChange={(e) => setCloseForm({ ...closeForm, actualCash: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-base font-bold font-mono focus:outline-none focus:border-indigo-600"
                    placeholder={String(expectedDrawerCash)}
                  />
                </div>
                {/* Live Variance Indicator */}
                <div className="mt-1.5 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Variance (Difference):</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    calculatedVariance === 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : calculatedVariance < 0
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {calculatedVariance === 0 ? '✔ Perfect Tally (₹0)' : calculatedVariance < 0 ? `Shortage of -₹${Math.abs(calculatedVariance)}` : `Excess of +₹${calculatedVariance}`}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Cash Retained in Drawer (Opening Float for Next Shift)
                </label>
                <input
                  type="number"
                  min="0"
                  value={closeForm.inStoreCash}
                  onChange={(e) => setCloseForm({ ...closeForm, inStoreCash: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-indigo-600"
                  placeholder="5000"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Closing Remarks / Handover Notes
                </label>
                <textarea
                  rows={2}
                  value={closeForm.remarks}
                  onChange={(e) => setCloseForm({ ...closeForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600 resize-none"
                  placeholder="e.g. All bills verified, cash handed over to salon manager"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCloseCounterConfirm}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
              >
                Confirm & Close Counter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE BILL RECEIPT MODAL */}
      <InvoiceBillModal
        isOpen={Boolean(selectedOrderForInvoice)}
        order={selectedOrderForInvoice}
        onClose={() => setSelectedOrderForInvoice(null)}
      />

    </div>
  );
}
