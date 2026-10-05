import React, { useState, useEffect } from 'react';
import { Plus, X, Eye, Edit2, Trash2, Printer, Download, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { getExpenses, saveExpenses, fetchExpensesFromBackend, deleteExpenseItem } from '../utils/expenseStorage';
import { expenseApi } from '../api/client';
import { getActiveTenant } from '../utils/saasStorage';

export default function ExpensesPage() {
  // Modals
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [notification, setNotification] = useState('');
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Add Expense form
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    expenseType: '',
    notes: '',
    paymode: 'Card',
  });

  // Edit Expense form
  const [editingExpense, setEditingExpense] = useState(null);
  const [editForm, setEditForm] = useState({
    amount: '',
    expenseType: '',
    notes: '',
    paymode: 'Card',
  });

  // Selected expense for Receipt / Invoice View
  const [selectedReceiptExpense, setSelectedReceiptExpense] = useState(null);

  // Mock Data
  const [expenses, setExpenses] = useState(getExpenses);
  const [currentTenant, setCurrentTenant] = useState(getActiveTenant);

  useEffect(() => {
    fetchExpensesFromBackend();
    const handleSync = () => {
      setExpenses(getExpenses());
      setCurrentTenant(getActiveTenant());
    };
    window.addEventListener('expensesUpdated', handleSync);
    window.addEventListener('tenantChanged', handleSync);
    return () => {
      window.removeEventListener('expensesUpdated', handleSync);
      window.removeEventListener('tenantChanged', handleSync);
    };
  }, []);

  // Handlers
  const handleAddExpense = async () => {
    if (!expenseForm.amount || !expenseForm.expenseType?.trim()) {
      alert('Please enter amount and expense type');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        amount: parseFloat(expenseForm.amount) || 0,
        expenseTypeName: expenseForm.expenseType.trim(),
        paymode: expenseForm.paymode,
        paymentMethod: expenseForm.paymode,
        description: expenseForm.notes?.trim() || '',
        remark: expenseForm.notes?.trim() || '',
        expenseDate: new Date().toISOString(),
        store: 'kalyaninagar',
      };
      const res = await expenseApi.createExpense(payload);
      const created = res?.data?.data || res?.data;
      const newExp = {
        id: created?.id || `EXP-00${Date.now()}`,
        amount: parseFloat(expenseForm.amount) || 0,
        expenseType: expenseForm.expenseType.trim(),
        notes: expenseForm.notes?.trim() || '',
        paymode: expenseForm.paymode,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
      };
      setExpenses((prev) => [newExp, ...prev.filter((e) => e.id !== newExp.id)]);
      setNotification(`Expense of ₹${newExp.amount.toLocaleString()} added successfully!`);
      setTimeout(() => setNotification(''), 3000);
      setShowAddExpenseModal(false);
      setExpenseForm({
        amount: '',
        expenseType: '',
        notes: '',
        paymode: 'Card',
      });
      await fetchExpensesFromBackend();
    } catch (err) {
      console.error('Failed to add expense:', err);
      alert('Failed to add expense: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (exp) => {
    setEditingExpense(exp);
    setEditForm({
      amount: String(exp.amount || ''),
      expenseType: exp.expenseType || '',
      notes: exp.notes || exp.remark || '',
      paymode: exp.paymode || 'Card',
    });
    setShowEditExpenseModal(true);
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!editForm.amount || !editForm.expenseType?.trim()) {
      alert('Please enter amount and expense type');
      return;
    }
    setIsSaving(true);
    try {
      const isUuid = typeof editingExpense?.id === 'string' && editingExpense.id.includes('-');
      if (isUuid) {
        await expenseApi.updateExpense(editingExpense.id, {
          amount: parseFloat(editForm.amount) || 0,
          expenseTypeName: editForm.expenseType.trim(),
          paymode: editForm.paymode,
          paymentMethod: editForm.paymode,
          description: editForm.notes?.trim() || '',
          remark: editForm.notes?.trim() || '',
        });
      }
      const updated = expenses.map((exp) => {
        if (exp.id === editingExpense?.id) {
          return {
            ...exp,
            amount: parseFloat(editForm.amount) || 0,
            expenseType: editForm.expenseType.trim(),
            notes: editForm.notes?.trim() || '',
            paymode: editForm.paymode,
          };
        }
        return exp;
      });
      setExpenses(updated);
      setNotification('Expense record updated successfully.');
      setTimeout(() => setNotification(''), 3000);
      setShowEditExpenseModal(false);
      setEditingExpense(null);
      await fetchExpensesFromBackend();
    } catch (err) {
      console.error('Failed to update expense:', err);
      alert('Failed to update expense: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) {
      return;
    }
    setIsDeletingId(id);
    try {
      const isUuid = typeof id === 'string' && id.includes('-');
      if (isUuid) {
        await expenseApi.deleteExpense(id);
      }
      setExpenses((prev) => prev.filter((exp) => exp.id !== id));
      await deleteExpenseItem(id);
      setNotification('Expense record deleted successfully.');
      setTimeout(() => setNotification(''), 3000);
      await fetchExpensesFromBackend();
    } catch (err) {
      console.error('Failed to delete expense:', err);
      alert('Failed to delete expense: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDeletingId(null);
    }
  };

  // Open Receipt Modal
  const handleOpenReceipt = (exp) => {
    setSelectedReceiptExpense(exp);
    setShowReceiptModal(true);
  };

  const totalExpenseAmt = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Active Tenant Info for Receipt
  const companyName = currentTenant?.companyName || currentTenant?.brandName || currentTenant?.name || (currentTenant?.logoTextPrefix ? `${currentTenant.logoTextPrefix}${currentTenant.logoTextSuffix || ''}` : 'SALON');
  const companyLocation = currentTenant?.location || currentTenant?.city || 'vmd, Pune';
  const companyPhone = currentTenant?.phone || currentTenant?.mobile || '';
  const companyEmail = currentTenant?.email || '';
  const companyGstin = currentTenant?.gstin || currentTenant?.gstNumber || '';

  // Download receipt text
  const handleDownloadReceipt = () => {
    if (!selectedReceiptExpense) return;
    const textData = `
================================================
          ${companyName.toUpperCase()}
   ${companyLocation}
   ${companyPhone ? `Phone: ${companyPhone} | ` : ''}${companyEmail || ''}
   ${companyGstin ? `GSTIN: ${companyGstin}` : ''}
================================================
EXPENSE PAYMENT VOUCHER / INVOICE RECEIPT
Voucher No   : VCH-${selectedReceiptExpense.id}
Date         : ${selectedReceiptExpense.date}
Payment Mode : ${selectedReceiptExpense.paymode}
Status       : PAID
------------------------------------------------
PARTICULARS:
Category     : ${selectedReceiptExpense.expenseType}
Notes        : ${selectedReceiptExpense.notes || selectedReceiptExpense.remark || '-'}
Amount Paid  : ₹${selectedReceiptExpense.amount.toLocaleString()}
================================================
Total Amount : ₹${selectedReceiptExpense.amount.toLocaleString()}
------------------------------------------------
Authorized Signature: _________________________
`;
    const element = document.createElement("a");
    const file = new Blob([textData], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Expense-Voucher-${selectedReceiptExpense.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-4 md:p-6 space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Expenses</h1>
          <p className="text-xs text-slate-500 mt-1">Track salon operational expenses and spend history</p>
        </div>

        <button
          onClick={() => setShowAddExpenseModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Total Expenses Stat Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm w-full sm:w-80">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Expenses</span>
          <div className="text-2xl font-bold text-slate-800 mt-1">₹{totalExpenseAmt.toLocaleString()}</div>
          <span className="text-[11px] text-slate-400">Total recorded spend</span>
        </div>

        {/* Expenses List Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-800">Operational Expenses</h2>
          </div>
          <div className="overflow-x-auto p-4">
            <table className="w-full min-w-[760px] text-left border-collapse">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Expense Type</th>
                  <th className="py-3 px-4">Expense Notes</th>
                  <th className="py-3 px-4">Paymode</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                      No operational expenses recorded yet. Click "+ Add Expense" above.
                    </td>
                  </tr>
                ) : (
                  expenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{exp.date}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{exp.expenseType}</td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={exp.notes || exp.remark || exp.givenTo || ''}>
                        {exp.notes || exp.remark || (exp.givenTo ? `Paid to ${exp.givenTo}` : '-')}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                          {exp.paymode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-600 whitespace-nowrap">
                        ₹{exp.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* View Receipt / Invoice Button */}
                          <button
                            onClick={() => handleOpenReceipt(exp)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                            title="View Expense Invoice / Receipt"
                          >
                            <Eye size={15} />
                            <span>View</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(exp)}
                            className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                            title="Edit Expense"
                          >
                            <Edit2 size={15} />
                            <span>Edit</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            disabled={isDeletingId === exp.id}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer disabled:opacity-50"
                            title="Delete Expense"
                          >
                            {isDeletingId === exp.id ? (
                              <Loader2 size={15} className="animate-spin text-rose-600" />
                            ) : (
                              <Trash2 size={15} />
                            )}
                            <span>{isDeletingId === exp.id ? 'Deleting...' : 'Delete'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: ADD NEW EXPENSE                                 */}
      {/* ======================================================== */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowAddExpenseModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Add New Expense</h3>
              <button onClick={() => setShowAddExpenseModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Amount (₹)*</label>
                  <input
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    placeholder="Enter amount (e.g. 1000)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Expense Type*</label>
                  <input
                    type="text"
                    value={expenseForm.expenseType}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expenseType: e.target.value })}
                    placeholder="e.g. repair and maintenance, tea, rent"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Expense Notes</label>
                <textarea
                  rows={2}
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  placeholder="Enter expense details or notes..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Paymode*</label>
                <div className="flex flex-wrap gap-4 pt-1">
                  {['Card', 'Cash', 'Bank Transfer', 'UPI'].map(pm => (
                    <label key={pm} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                      <input
                        type="radio"
                        name="paymode"
                        checked={expenseForm.paymode === pm}
                        onChange={() => setExpenseForm({ ...expenseForm, paymode: pm })}
                        className="text-indigo-600 accent-indigo-600"
                      />
                      {pm}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddExpense}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer"
              >
                Save Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIT EXPENSE                                    */}
      {/* ======================================================== */}
      {showEditExpenseModal && editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowEditExpenseModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="text-amber-600" size={18} />
                <h3 className="text-lg font-bold text-slate-800">Edit Expense</h3>
              </div>
              <button onClick={() => setShowEditExpenseModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Amount (₹)*</label>
                  <input
                    type="number"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Expense Type*</label>
                  <input
                    type="text"
                    value={editForm.expenseType}
                    onChange={(e) => setEditForm({ ...editForm, expenseType: e.target.value })}
                    placeholder="e.g. repair and maintenance"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Expense Notes</label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Enter expense details or notes..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Paymode*</label>
                <div className="flex flex-wrap gap-4 pt-1">
                  {['Card', 'Cash', 'Bank Transfer', 'UPI'].map(pm => (
                    <label key={pm} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                      <input
                        type="radio"
                        name="editPaymode"
                        checked={editForm.paymode === pm}
                        onChange={() => setEditForm({ ...editForm, paymode: pm })}
                        className="text-indigo-600 accent-indigo-600"
                      />
                      {pm}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowEditExpenseModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: VIEW EXPENSE INVOICE / VOUCHER RECEIPT          */}
      {/* ======================================================== */}
      {showReceiptModal && selectedReceiptExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowReceiptModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Top Bar */}
            <div className="flex justify-between items-center px-6 py-3.5 border-b border-slate-200 bg-white sticky top-0 z-20">
              <div className="flex items-center gap-2">
                <FileText className="text-indigo-600" size={18} />
                <h2 className="text-base font-bold text-slate-800">Expense Invoice / Receipt</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Print Expense Voucher"
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>
                <button
                  onClick={handleDownloadReceipt}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Download Voucher Text"
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Receipt Content */}
            <div className="p-6 md:p-8 text-xs text-slate-700 font-sans space-y-6" id="printable-expense-voucher">
              {/* Header: Salon Branding */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
                <div className="flex items-start gap-3.5">
                  {currentTenant?.logoUrl ? (
                    <img
                      src={currentTenant.logoUrl}
                      alt={companyName}
                      className="h-12 max-h-14 max-w-[140px] object-contain rounded-lg border border-slate-200 p-0.5 bg-white shadow-2xs shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-2xs">
                      {companyName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">{companyName}</h3>
                    <p className="text-slate-500 text-xs mt-0.5">{companyLocation}</p>
                    {companyPhone && <p className="text-slate-400 text-[11px] mt-0.5">Phone: {companyPhone}</p>}
                    {companyEmail && <p className="text-slate-400 text-[11px]">Email: {companyEmail}</p>}
                    {companyGstin && <p className="text-slate-500 text-[11px] font-mono mt-0.5">GSTIN: {companyGstin}</p>}
                  </div>
                </div>

                <div className="text-right sm:text-right">
                  <div className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 mb-2">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      PAYMENT COMPLETED
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Expense Voucher</h4>
                  <p className="font-mono text-xs text-indigo-600 font-bold mt-0.5">
                    VCH-{selectedReceiptExpense.id}
                  </p>
                  <p className="text-slate-400 text-[11px] mt-0.5">Date: {selectedReceiptExpense.date}</p>
                </div>
              </div>

              {/* Expense Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expense Type</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">{selectedReceiptExpense.expenseType}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Mode</span>
                  <span className="font-semibold text-slate-700 mt-0.5 block">{selectedReceiptExpense.paymode}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                  <span className="font-bold text-emerald-600 mt-0.5 block">PAID</span>
                </div>
              </div>

              {/* Particulars Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4 w-12 text-center">#</th>
                      <th className="py-2.5 px-4">Particulars / Category</th>
                      <th className="py-2.5 px-4">Notes & Description</th>
                      <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    <tr>
                      <td className="py-3 px-4 text-center text-slate-400 font-mono">1</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{selectedReceiptExpense.expenseType}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {selectedReceiptExpense.notes || selectedReceiptExpense.remark || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        ₹{selectedReceiptExpense.amount.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="border-t border-slate-200 bg-slate-50 font-semibold text-xs">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-4 text-right text-slate-600">Subtotal:</td>
                      <td className="py-2.5 px-4 text-right text-slate-900 font-mono">₹{selectedReceiptExpense.amount.toLocaleString()}</td>
                    </tr>
                    <tr className="border-t border-slate-200 bg-indigo-50/50">
                      <td colSpan={3} className="py-3 px-4 text-right font-bold text-slate-800 text-sm">Grand Total Paid:</td>
                      <td className="py-3 px-4 text-right font-black text-rose-600 font-mono text-base">
                        ₹{selectedReceiptExpense.amount.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures & Notes */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-500">
                <div>
                  <div className="h-12 border-b border-slate-300 border-dashed mb-2" />
                  <span className="font-semibold text-slate-700">Prepared By</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Salon Cashier / Staff</p>
                </div>
                <div>
                  <div className="h-12 border-b border-slate-300 border-dashed mb-2" />
                  <span className="font-semibold text-slate-700">Authorized Signatory</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Manager / Salon Admin</p>
                </div>
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-400">
                This is an official computer-generated expense payment voucher.
              </div>
            </div>

            {/* Modal Bottom Close */}
            <div className="flex justify-end gap-3 px-6 py-3 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
