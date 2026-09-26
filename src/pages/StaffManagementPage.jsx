import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users, Plus, Search, Check, X, Shield, Clock, Building,
  Edit2, CheckCircle2, ChevronDown, Calendar, FileText, User,
  Phone, Mail, Eye, Trash2, UserCheck, Briefcase, Filter,
  DollarSign, Download, Printer, AlertCircle, FileSpreadsheet,
  ArrowRight, Landmark, BadgeCheck, Send
} from 'lucide-react';
import { getMasterStaff, saveMasterStaff } from '../utils/staffStorage';
import { getActiveTenant } from '../utils/saasStorage';

export default function StaffManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabParam === 'salary' ? 'salary' : tabParam === 'payslips' ? 'payslips' : 'staff'
  );

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams(tabKey === 'staff' ? {} : { tab: tabKey });
  };

  const [staffList, setStaffList] = useState(() => getMasterStaff());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [notification, setNotification] = useState('');

  // Selected & Modal States
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [viewingStaff, setViewingStaff] = useState(null);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [isEditingStaff, setIsEditingStaff] = useState(false);

  // Sub-modals
  const [showWeeklyOffModal, setShowWeeklyOffModal] = useState(false);
  const [showAddExpModal, setShowAddExpModal] = useState(false);
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newExp, setNewExp] = useState({ company: '', role: '', duration: '' });
  const [newDoc, setNewDoc] = useState({ type: 'Aadhar Card', number: '' });

  // Payroll States
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = ['2025', '2026', '2027'];
  const [selectedMonth, setSelectedMonth] = useState('August');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [payslipStaffId, setPayslipStaffId] = useState(() => (staffList[0]?.id || null));
  const [showSlip, setShowSlip] = useState(true);
  const [whatsAppNotice, setWhatsAppNotice] = useState(false);

  // Dynamic salary status map: { [staffId]: 'Processed' | 'Pending' }
  const [salaryStatuses, setSalaryStatuses] = useState({
    1: 'Processed',
    2: 'Processed',
    3: 'Processed',
    4: 'Pending',
    5: 'Pending',
  });

  const emptyStaffForm = {
    id: null,
    firstName: '',
    lastName: '',
    name: '',
    mobile: '',
    email: '',
    dob: '',
    position: '',
    gender: 'Male',
    role: '',
    username: '',
    useMobileAsUsername: false,
    password: '',
    active: true,
    enableAppointments: true,
    showAppointmentsInDashboard: true,
    weeklyOff: 'Monday',
    workExperience: [],
    documents: [],
    joiningDate: '',
    designation: '',
    uanNumber: '',
    reportingTo: '',
    workingHours: '',
    bankName: '',
    branch: '',
    accountNumber: '',
    ifsc: '',
  };

  const [staffFormData, setStaffFormData] = useState(emptyStaffForm);

  useEffect(() => {
    const handleSync = () => {
      const list = getMasterStaff();
      setStaffList(list);
      if (list.length > 0 && !payslipStaffId) {
        setPayslipStaffId(list[0].id);
      }
    };

    window.addEventListener('staffUpdated', handleSync);
    window.addEventListener('tenantChanged', handleSync);
    return () => {
      window.removeEventListener('staffUpdated', handleSync);
      window.removeEventListener('tenantChanged', handleSync);
    };
  }, [payslipStaffId]);

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3500);
  };

  const handleSelectStaff = (staffMember) => {
    setSelectedStaffId(staffMember.id);
    const nameParts = (staffMember.name || '').trim().split(' ');
    setStaffFormData({
      id: staffMember.id,
      firstName: staffMember.firstName || nameParts[0] || '',
      lastName: staffMember.lastName || nameParts.slice(1).join(' ') || '',
      name: staffMember.name || '',
      mobile: staffMember.phone || staffMember.mobile || '',
      email: staffMember.email || '',
      dob: staffMember.dob || '',
      position: staffMember.position || staffMember.designation || '',
      gender: staffMember.gender || 'Male',
      active: staffMember.active !== undefined ? staffMember.active : true,
      enableAppointments: staffMember.enableAppointments !== undefined ? staffMember.enableAppointments : true,
      showAppointmentsInDashboard: staffMember.showAppointmentsInDashboard !== undefined ? staffMember.showAppointmentsInDashboard : true,
      weeklyOff: staffMember.weeklyOff || 'Monday',
      workExperience: staffMember.workExperience || [],
      documents: staffMember.documents || [],
      joiningDate: staffMember.joiningDate || '',
      designation: staffMember.designation || '',
      uanNumber: staffMember.uanNumber || '',
      reportingTo: staffMember.reportingTo || '',
      workingHours: staffMember.workingHours || '',
      bankName: staffMember.bankName || '',
      branch: staffMember.branch || '',
      accountNumber: staffMember.accountNumber || '',
      ifsc: staffMember.ifsc || '',
    });
  };

  const handleOpenCreateStaff = () => {
    setSelectedStaffId(null);
    setStaffFormData(emptyStaffForm);
    setIsEditingStaff(false);
    setShowStaffModal(true);
  };

  const handleOpenEditStaff = (staffMember) => {
    handleSelectStaff(staffMember);
    setIsEditingStaff(true);
    setShowStaffModal(true);
  };

  const handleToggleStatus = (staffId) => {
    const updated = staffList.map(s => (s.id === staffId ? { ...s, active: s.active === false ? true : false } : s));
    setStaffList(updated);
    saveMasterStaff(updated);
    showToast('Staff status updated successfully.');
  };

  const handleToggleSalaryStatus = (staffId) => {
    setSalaryStatuses(prev => {
      const current = prev[staffId] || 'Pending';
      const next = current === 'Processed' ? 'Pending' : 'Processed';
      return { ...prev, [staffId]: next };
    });
    showToast('Salary processing status updated.');
  };

  const handleCancelStaff = () => {
    setShowStaffModal(false);
    setStaffFormData(emptyStaffForm);
  };

  const handleSaveStaffForm = (e) => {
    if (e) e.preventDefault();
    const fullName = `${staffFormData.firstName} ${staffFormData.lastName}`.trim() || staffFormData.name.trim();
    if (!fullName) {
      alert('Please enter First Name.');
      return;
    }
    if (!staffFormData.mobile.trim()) {
      alert('Please enter Mobile Number.');
      return;
    }

    const resolvedPosition = staffFormData.position?.trim() || staffFormData.designation?.trim() || 'Stylist';
    const resolvedDesignation = staffFormData.designation?.trim() || staffFormData.position?.trim() || 'Stylist';

    let updated;
    if (selectedStaffId) {
      // Editing existing staff
      updated = staffList.map(s => {
        if (s.id === selectedStaffId) {
          return {
            ...s,
            ...staffFormData,
            name: fullName,
            phone: staffFormData.mobile,
            position: resolvedPosition,
            designation: resolvedDesignation,
            role: 'Stylist',
          };
        }
        return s;
      });
      showToast(`Staff "${fullName}" updated successfully!`);
    } else {
      // Creating new staff
      const nextEmpNum = 'EMP-' + String(100 + staffList.length + 1).padStart(3, '0');
      const newStaff = {
        ...staffFormData,
        id: Date.now(),
        empNo: nextEmpNum,
        name: fullName,
        phone: staffFormData.mobile,
        position: resolvedPosition,
        designation: resolvedDesignation,
        role: 'Stylist',
      };
      updated = [newStaff, ...staffList];
      showToast(`New Staff "${fullName}" created successfully!`);
    }

    setStaffList(updated);
    saveMasterStaff(updated);
    setShowStaffModal(false);
  };

  const handleDeleteStaff = (staffId) => {
    const target = staffList.find(st => st.id === staffId);
    const targetName = target ? target.name : 'this staff member';
    if (window.confirm(`Are you sure you want to delete "${targetName}"?`)) {
      const updated = staffList.filter(st => st.id !== staffId);
      setStaffList(updated);
      saveMasterStaff(updated);
      showToast('Staff member removed successfully.');
    }
  };

  // Helper for computing base salary, commission, deduction, and net pay
  const getStaffSalaryInfo = (st) => {
    const base = Number(st.basicSalary) || (st.gender === 'Female' ? 22000 : 25000);
    const comm = Number(st.commission) || Math.round(base * 0.28);
    const ded = Number(st.deductions) || 1200;
    const net = base + comm - ded;
    const status = salaryStatuses[st.id] || 'Processed';
    return { base, comm, ded, net, status };
  };

  // Metrics
  const totalStaffCount = staffList.length;
  const activeStaffCount = staffList.filter(s => s.active !== false).length;
  const appointmentReadyCount = staffList.filter(s => s.active !== false && s.enableAppointments !== false).length;
  const inactiveCount = staffList.filter(s => s.active === false).length;

  // Payroll Metrics
  const totalPayrollBudget = staffList.reduce((sum, st) => sum + getStaffSalaryInfo(st).net, 0);
  const totalBaseSalary = staffList.reduce((sum, st) => sum + getStaffSalaryInfo(st).base, 0);
  const totalCommissions = staffList.reduce((sum, st) => sum + getStaffSalaryInfo(st).comm, 0);

  // Filtered Staff List
  const filteredStaffList = staffList.filter(s => {
    const nameMatch = (s.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = (s.phone || s.mobile || '').includes(searchQuery);
    const posMatch = (s.position || s.designation || '').toLowerCase().includes(searchQuery.toLowerCase());
    const queryMatches = nameMatch || phoneMatch || posMatch;

    const roleMatches = roleFilter === 'All' || (s.position || s.designation || '') === roleFilter;
    const statusMatches =
      statusFilter === 'All' ||
      (statusFilter === 'Active' && s.active !== false) ||
      (statusFilter === 'Inactive' && s.active === false);

    return queryMatches && roleMatches && statusMatches;
  });

  const uniquePositions = Array.from(new Set(staffList.map(s => s.position || s.designation || 'Stylist').filter(Boolean)));

  // Selected staff object for payslip
  const currentPayslipStaff = staffList.find(s => String(s.id) === String(payslipStaffId)) || staffList[0];
  const payslipSalary = currentPayslipStaff ? getStaffSalaryInfo(currentPayslipStaff) : { base: 25000, comm: 8500, ded: 1500, net: 32000, status: 'Processed' };

  // Tenant branding
  const tenant = getActiveTenant();
  const primaryBranch = tenant?.branches?.find(b => b.isPrimary) || tenant?.branches?.[0];
  const companyName = tenant?.companyName || tenant?.brandName || (tenant?.logoTextPrefix ? `${tenant.logoTextPrefix}${tenant.logoTextSuffix}` : 'ABCD');
  const companyLocation = tenant?.location || primaryBranch?.name || 'vmd, Pune';
  const companyPhone = tenant?.phone || tenant?.mobile || '';
  const companyGstin = tenant?.gstin || tenant?.gstNumber || '';

  const handlePrintPayslip = () => {
    window.print();
  };

  const handleDownloadPayslipTxt = () => {
    if (!currentPayslipStaff) return;
    const textData = `
=============================================================
                     PAYSLIP / SALARY RECEIPT
                     ${companyName.toUpperCase()}
           Location: ${companyLocation}
           ${companyPhone ? `Contact: ${companyPhone}` : ''}
           ${companyGstin ? `GSTIN: ${companyGstin}` : ''}
=============================================================
Month & Year: ${selectedMonth} ${selectedYear}
Employee Name: ${currentPayslipStaff.name}
Employee ID: ${currentPayslipStaff.empNo || `EMP-${currentPayslipStaff.id}`}
Designation: ${currentPayslipStaff.designation || currentPayslipStaff.position || 'Stylist'}
Mobile: ${currentPayslipStaff.phone || currentPayslipStaff.mobile || '-'}
Bank Name: ${currentPayslipStaff.bankName || 'HDFC Bank'}
Account Number: ${currentPayslipStaff.accountNumber || 'XXXXXXXX4829'}
IFSC Code: ${currentPayslipStaff.ifsc || 'HDFC0001234'}
UAN Number: ${currentPayslipStaff.uanNumber || '100987654321'}
-------------------------------------------------------------
EARNINGS BREAKDOWN:
  1. Basic Salary                     : ₹${payslipSalary.base.toLocaleString()}
  2. Service & Retail Commission     : +₹${payslipSalary.comm.toLocaleString()}
-------------------------------------------------------------
DEDUCTIONS:
  1. Professional Tax / TDS / Advance : -₹${payslipSalary.ded.toLocaleString()}
-------------------------------------------------------------
NET SALARY PAYABLE                    : ₹${payslipSalary.net.toLocaleString()}
Status                                : ${payslipSalary.status}
=============================================================
`;
    const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Payslip_${currentPayslipStaff.name.replace(/\s+/g, '_')}_${selectedMonth}_${selectedYear}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Payslip for ${currentPayslipStaff.name} downloaded successfully!`);
  };

  const handleSendWhatsApp = () => {
    setWhatsAppNotice(true);
    setTimeout(() => setWhatsAppNotice(false), 4000);
  };

  const handleExportSalariesCSV = () => {
    const header = 'Staff Name,Designation,Basic Salary,Commission,Deductions,Net Pay,Status\n';
    const rows = staffList.map(st => {
      const s = getStaffSalaryInfo(st);
      return `"${st.name}","${st.designation || st.position || 'Stylist'}",${s.base},${s.comm},${s.ded},${s.net},"${s.status}"`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Salaries_${selectedMonth}_${selectedYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Salary report exported for ${selectedMonth} ${selectedYear}!`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          {notification}
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Users size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Staff & Payroll Hub</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage salon stylists, attendance schedules, monthly payroll, and payslips</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => handleTabChange('staff')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Users size={14} /> Staff Members
            </button>
            <button
              onClick={() => handleTabChange('salary')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'salary'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <DollarSign size={14} /> Salary Management
            </button>
            <button
              onClick={() => handleTabChange('payslips')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'payslips'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <FileText size={14} /> Monthly Payslips
            </button>
          </div>

          {activeTab === 'staff' && (
            <button
              onClick={handleOpenCreateStaff}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
            >
              <Plus size={15} /> Add Staff
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: STAFF DIRECTORY                                   */}
      {/* ======================================================== */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Total Staff</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-800 mt-2">{totalStaffCount}</div>
              <span className="text-[11px] text-slate-400 font-medium">Registered members</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Active on Duty</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserCheck size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-2">{activeStaffCount}</div>
              <span className="text-[11px] text-emerald-600/80 font-medium">Available for shifts</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">In Appointments</span>
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Calendar size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-sky-600 mt-2">{appointmentReadyCount}</div>
              <span className="text-[11px] text-slate-400 font-medium">Assigned in calendar</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Inactive</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Clock size={16} />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-500 mt-2">{inactiveCount}</div>
              <span className="text-[11px] text-slate-400 font-medium">Disabled or on leave</span>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by name, phone, or position..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Position Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700">
                <Briefcase size={14} className="text-slate-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Positions</option>
                  {uniquePositions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700">
                <Filter size={14} className="text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left border-collapse text-sm">
                <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-5">Staff Member</th>
                    <th className="py-3.5 px-4">Gender</th>
                    <th className="py-3.5 px-4">Mobile Number</th>
                    <th className="py-3.5 px-4">Position</th>
                    <th className="py-3.5 px-4">Weekly Off</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaffList.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400 text-xs">
                        No staff members match the selected search and filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStaffList.map((st) => {
                      const initials = (st.name || 'Staff')
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase();
                      const position = st.position || st.designation || 'Stylist';
                      const mobile = st.phone || st.mobile || '-';
                      const gender = st.gender || 'Male';
                      const isActive = st.active !== false;

                      return (
                        <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Name & Avatar */}
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                {initials}
                              </div>
                              <div>
                                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                  {st.name}
                                  {st.enableAppointments !== false && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" title="Available for appointments" />
                                  )}
                                </div>
                                {st.email ? (
                                  <div className="text-[11px] text-slate-400">{st.email}</div>
                                ) : (
                                  <div className="text-[11px] text-slate-400 font-mono">{st.empNo || 'EMP'}</div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Gender */}
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                              gender === 'Female' ? 'bg-pink-50 text-pink-700 border border-pink-200' :
                              gender === 'Male' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                              'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}>
                              {gender}
                            </span>
                          </td>

                          {/* Mobile */}
                          <td className="py-3.5 px-4 font-mono text-slate-700 text-xs">
                            {mobile}
                          </td>

                          {/* Position */}
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {position}
                            </span>
                          </td>

                          {/* Weekly Off */}
                          <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                            {st.weeklyOff || 'Monday'}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(st.id)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                              }`}
                              title="Click to toggle status"
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              <span>{isActive ? 'Active' : 'Inactive'}</span>
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setViewingStaff(st)}
                                className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                title="View Full Profile"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleOpenEditStaff(st)}
                                className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Staff"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteStaff(st.id)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Staff"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: SALARY & COMMISSION MANAGEMENT                    */}
      {/* ======================================================== */}
      {activeTab === 'salary' && (
        <div className="space-y-6">
          {/* Controls Bar & Month/Year Switcher */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
                <Calendar size={14} className="text-indigo-600" />
                <span>Period:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {months.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <span className="text-xs text-slate-400">
                Showing computed salary & commissions for {selectedMonth} {selectedYear}
              </span>
            </div>

            <button
              onClick={handleExportSalariesCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Download size={14} /> Export Salaries CSV
            </button>
          </div>

          {/* Salary Metric Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-xs font-bold text-slate-500">Total Net Payable</span>
              <div className="text-2xl font-black text-indigo-700 mt-1">₹{totalPayrollBudget.toLocaleString()}</div>
              <span className="text-[11px] text-slate-400 font-medium">Net disbursed salary this month</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-xs font-bold text-slate-500">Total Base Salary</span>
              <div className="text-2xl font-black text-slate-800 mt-1">₹{totalBaseSalary.toLocaleString()}</div>
              <span className="text-[11px] text-slate-400 font-medium">Fixed base pay pool</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-xs font-bold text-slate-500">Service & Product Commission</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">+₹{totalCommissions.toLocaleString()}</div>
              <span className="text-[11px] text-slate-400 font-medium">Incentives earned from POS</span>
            </div>
          </div>

          {/* Salary Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left border-collapse text-sm">
                <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-5">Staff Member</th>
                    <th className="py-3.5 px-4">Designation</th>
                    <th className="py-3.5 px-4 text-right">Basic Salary</th>
                    <th className="py-3.5 px-4 text-right">Commission</th>
                    <th className="py-3.5 px-4 text-right">Deductions</th>
                    <th className="py-3.5 px-4 text-right font-bold text-slate-900">Net Payable</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffList.map((st) => {
                    const sal = getStaffSalaryInfo(st);
                    const isProcessed = sal.status === 'Processed';

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-slate-800">{st.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{st.phone || st.mobile || '-'}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 font-medium">
                          {st.designation || st.position || 'Stylist'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">
                          ₹{sal.base.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-600">
                          +₹{sal.comm.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-rose-500">
                          -₹{sal.ded.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                          ₹{sal.net.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSalaryStatus(st.id)}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer transition-all ${
                              isProcessed
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                            }`}
                            title="Click to toggle processed/pending"
                          >
                            {sal.status}
                          </button>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <button
                            onClick={() => {
                              setPayslipStaffId(st.id);
                              setShowSlip(true);
                              handleTabChange('payslips');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            <FileText size={13} />
                            <span>View Payslip</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MONTHLY PAYSLIPS GENERATOR                        */}
      {/* ======================================================== */}
      {activeTab === 'payslips' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Select Staff Member</label>
              <select
                value={payslipStaffId || ''}
                onChange={(e) => {
                  setPayslipStaffId(Number(e.target.value) || e.target.value);
                  setShowSlip(true);
                }}
                className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold bg-white text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer min-w-[200px]"
              >
                {staffList.map(st => (
                  <option key={st.id} value={st.id}>{st.name} ({st.designation || st.position || 'Staff'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold bg-white text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                {months.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold bg-white text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end pt-5">
              <button
                onClick={() => setShowSlip(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-xs transition-all cursor-pointer"
              >
                Generate Payslip
              </button>
            </div>
          </div>

          {/* Generated Branded Payslip */}
          {showSlip && currentPayslipStaff && (
            <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
              {/* Salon Branding Header */}
              <div className="flex justify-between items-start pb-5 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black tracking-tight text-indigo-900">
                      {companyName}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase">
                      Official Payslip
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {companyLocation} {companyPhone ? `• Phone: ${companyPhone}` : ''}
                  </p>
                  {companyGstin && (
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">GSTIN: {companyGstin}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintPayslip}
                    className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 transition-colors cursor-pointer"
                    title="Print Payslip"
                  >
                    <Printer size={16} />
                  </button>
                  <button
                    onClick={handleDownloadPayslipTxt}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Download size={14} /> Download
                  </button>
                  <button
                    onClick={handleSendWhatsApp}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl transition-colors cursor-pointer"
                    title="Send via WhatsApp"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>

              {whatsAppNotice && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>Payslip PDF sent to {currentPayslipStaff.name}'s WhatsApp number ({currentPayslipStaff.phone || currentPayslipStaff.mobile || 'Registered Phone'})!</span>
                </div>
              )}

              {/* Employee Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Employee Name</span>
                  <span className="font-bold text-slate-800 text-sm">{currentPayslipStaff.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Designation</span>
                  <span className="font-semibold text-slate-700">{currentPayslipStaff.designation || currentPayslipStaff.position || 'Stylist'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Pay Period</span>
                  <span className="font-semibold text-indigo-700">{selectedMonth} {selectedYear}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Payment Status</span>
                  <span className={`font-bold ${payslipSalary.status === 'Processed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {payslipSalary.status}
                  </span>
                </div>
              </div>

              {/* Bank & Compliance Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/40 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400">Bank:</span>{' '}
                  <span className="font-semibold text-slate-700">{currentPayslipStaff.bankName || 'HDFC Bank'}</span>
                </div>
                <div>
                  <span className="text-slate-400">A/C:</span>{' '}
                  <span className="font-mono font-semibold text-slate-700">{currentPayslipStaff.accountNumber || 'XXXXXXXX4829'}</span>
                </div>
                <div>
                  <span className="text-slate-400">IFSC:</span>{' '}
                  <span className="font-mono font-semibold text-slate-700 uppercase">{currentPayslipStaff.ifsc || 'HDFC0001234'}</span>
                </div>
              </div>

              {/* Earnings & Deductions Breakdown */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-sm py-2.5 border-b border-slate-100">
                  <div>
                    <span className="font-medium text-slate-700">Basic Salary</span>
                    <p className="text-[11px] text-slate-400">Fixed monthly retainer</p>
                  </div>
                  <span className="font-mono font-bold text-slate-800">₹{payslipSalary.base.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-sm py-2.5 border-b border-slate-100">
                  <div>
                    <span className="font-medium text-slate-700">Service & Retail Commission</span>
                    <p className="text-[11px] text-slate-400">POS completed appointments & retail incentive</p>
                  </div>
                  <span className="font-mono font-bold text-emerald-600">+₹{payslipSalary.comm.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-sm py-2.5 border-b border-slate-100">
                  <div>
                    <span className="font-medium text-slate-700">Professional Deductions / TDS</span>
                    <p className="text-[11px] text-slate-400">Statutory deductions and advance recovery</p>
                  </div>
                  <span className="font-mono font-bold text-rose-500">-₹{payslipSalary.ded.toLocaleString()}</span>
                </div>

                {/* Net Salary Payable */}
                <div className="flex justify-between items-center text-base py-3.5 bg-gradient-to-r from-indigo-50/80 to-slate-50 px-5 rounded-xl border border-indigo-100">
                  <div>
                    <span className="font-bold text-slate-800 block">Net Salary Payable</span>
                    <span className="text-[11px] text-slate-500">Credited to registered bank account</span>
                  </div>
                  <span className="font-mono font-black text-indigo-700 text-xl">
                    ₹{payslipSalary.net.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VIEW STAFF DETAILS (Eye Icon)                     */}
      {/* ======================================================== */}
      {viewingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setViewingStaff(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-base">
                  {(viewingStaff.name || 'Staff').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-800">{viewingStaff.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      viewingStaff.active !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {viewingStaff.active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{viewingStaff.position || viewingStaff.designation || 'Stylist'}</span>
                    <span>•</span>
                    <span>{viewingStaff.gender || 'Male'}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setViewingStaff(null)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {/* SECTION 1: PERSONAL & CONTACT */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Personal & Contact Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60 sm:border-b-0">
                    <span className="text-slate-500 font-medium">Mobile Number:</span>
                    <span className="font-semibold text-slate-800 font-mono">{viewingStaff.phone || viewingStaff.mobile || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60 sm:border-b-0">
                    <span className="text-slate-500 font-medium">Email Address:</span>
                    <span className="font-semibold text-slate-800">{viewingStaff.email || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Date of Birth:</span>
                    <span className="font-semibold text-slate-800">{viewingStaff.dob || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Gender:</span>
                    <span className="font-semibold text-slate-800">{viewingStaff.gender || 'Male'}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: SALON OPERATIONS & SCHEDULE */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Salon Operations & Schedule</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60 sm:border-b-0">
                    <span className="text-slate-500 font-medium">Weekly Off:</span>
                    <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{viewingStaff.weeklyOff || 'Monday'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60 sm:border-b-0">
                    <span className="text-slate-500 font-medium">Working Hours:</span>
                    <span className="font-semibold text-slate-800">{viewingStaff.workingHours || 'Standard (8 hrs)'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Enable Appointments:</span>
                    <span className={`font-semibold ${viewingStaff.enableAppointments !== false ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {viewingStaff.enableAppointments !== false ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Show in Dashboard:</span>
                    <span className={`font-semibold ${viewingStaff.showAppointmentsInDashboard !== false ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {viewingStaff.showAppointmentsInDashboard !== false ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: EMPLOYMENT & COMPLIANCE */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Employment & Payroll</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60 sm:border-b-0">
                    <span className="text-slate-500 font-medium">Designation:</span>
                    <span className="font-semibold text-slate-800">{viewingStaff.designation || viewingStaff.position || 'Staff'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60 sm:border-b-0">
                    <span className="text-slate-500 font-medium">Joining Date:</span>
                    <span className="font-semibold text-slate-800">{viewingStaff.joiningDate || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60 sm:border-b-0">
                    <span className="text-slate-500 font-medium">Reporting Manager:</span>
                    <span className="font-semibold text-slate-800">{viewingStaff.reportingTo || 'Owner'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">UAN Number:</span>
                    <span className="font-semibold text-slate-800 font-mono">{viewingStaff.uanNumber || 'Not set'}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: BANK DETAILS */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Bank Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60 sm:border-b-0">
                    <span className="text-slate-500 font-medium">Bank Name:</span>
                    <span className="font-semibold text-slate-800">{viewingStaff.bankName || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60 sm:border-b-0">
                    <span className="text-slate-500 font-medium">Branch:</span>
                    <span className="font-semibold text-slate-800">{viewingStaff.branch || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Account Number:</span>
                    <span className="font-semibold text-slate-800 font-mono">{viewingStaff.accountNumber || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">IFSC Code:</span>
                    <span className="font-semibold text-slate-800 font-mono uppercase">{viewingStaff.ifsc || 'Not set'}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 5: WORK EXPERIENCE & DOCUMENTS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Work Experience</h4>
                  {viewingStaff.workExperience?.length > 0 ? (
                    <div className="space-y-1.5">
                      {viewingStaff.workExperience.map((exp, idx) => (
                        <div key={idx} className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                          <div className="font-semibold text-slate-800">{exp.company}</div>
                          <div className="text-slate-500 text-[11px]">{exp.role} • {exp.duration}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-lg border border-slate-100">None added</div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">KYC Documents</h4>
                  {viewingStaff.documents?.length > 0 ? (
                    <div className="space-y-1.5">
                      {viewingStaff.documents.map((doc, idx) => (
                        <div key={idx} className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs flex justify-between">
                          <span className="font-medium text-slate-700">{doc.type}</span>
                          <span className="font-mono text-slate-600">{doc.number}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-lg border border-slate-100">None uploaded</div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const s = viewingStaff;
                  setViewingStaff(null);
                  handleOpenEditStaff(s);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Edit2 size={14} /> Edit Staff Member
              </button>
              <button
                type="button"
                onClick={() => setViewingStaff(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT STAFF                               */}
      {/* ======================================================== */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={handleCancelStaff} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800">
                  {isEditingStaff ? `Edit Staff - ${staffFormData.name || staffFormData.firstName}` : 'Create New Staff Member'}
                </h3>
              </div>
              <button 
                onClick={handleCancelStaff} 
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveStaffForm} className="p-6 overflow-y-auto space-y-6 text-sm flex-1">
              {/* STATUS TOGGLES */}
              <div className="flex flex-wrap items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div 
                    onClick={() => setStaffFormData(p => ({ ...p, active: !p.active }))}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                      staffFormData.active ? 'bg-sky-500' : 'bg-slate-300'
                    }`}
                  >
                    <div 
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        staffFormData.active ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">Active</span>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 font-medium">
                  <input 
                    type="checkbox"
                    checked={staffFormData.enableAppointments}
                    onChange={(e) => setStaffFormData(p => ({ ...p, enableAppointments: e.target.checked }))}
                    className="w-4 h-4 rounded text-sky-500 focus:ring-sky-400 accent-sky-500"
                  />
                  <span>Enable Appointments</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 font-medium">
                  <input 
                    type="checkbox"
                    checked={staffFormData.showAppointmentsInDashboard}
                    onChange={(e) => setStaffFormData(p => ({ ...p, showAppointmentsInDashboard: e.target.checked }))}
                    className="w-4 h-4 rounded text-sky-500 focus:ring-sky-400 accent-sky-500"
                  />
                  <span>Show in Dashboard</span>
                </label>
              </div>

              {/* SECTION 1: PERSONAL INFORMATION */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Personal Information</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">First Name *</label>
                    <input 
                      type="text"
                      required
                      value={staffFormData.firstName}
                      onChange={(e) => setStaffFormData(p => ({ ...p, firstName: e.target.value }))}
                      placeholder="Enter First Name"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Last Name</label>
                    <input 
                      type="text"
                      value={staffFormData.lastName}
                      onChange={(e) => setStaffFormData(p => ({ ...p, lastName: e.target.value }))}
                      placeholder="Enter Last Name"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mobile Number *</label>
                    <input 
                      type="tel"
                      required
                      value={staffFormData.mobile}
                      onChange={(e) => setStaffFormData(p => ({ ...p, mobile: e.target.value }))}
                      placeholder="Enter Mobile"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address</label>
                    <input 
                      type="email"
                      value={staffFormData.email}
                      onChange={(e) => setStaffFormData(p => ({ ...p, email: e.target.value }))}
                      placeholder="staff@salon.com"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date of Birth</label>
                    <input 
                      type="date"
                      value={staffFormData.dob}
                      onChange={(e) => setStaffFormData(p => ({ ...p, dob: e.target.value }))}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Position / Job Title</label>
                    <input 
                      type="text"
                      value={staffFormData.position}
                      onChange={(e) => setStaffFormData(p => ({ ...p, position: e.target.value }))}
                      placeholder="e.g. Senior Stylist, Beautician"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Gender</label>
                  <div className="flex items-center gap-6 pt-1">
                    {['Male', 'Female', 'Other'].map(g => (
                      <label key={g} className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                        <input 
                          type="radio"
                          name="formStaffGender"
                          checked={staffFormData.gender === g}
                          onChange={() => setStaffFormData(p => ({ ...p, gender: g }))}
                          className="w-4 h-4 text-sky-500 focus:ring-sky-400 accent-sky-500"
                        />
                        <span>{g}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 2: SCHEDULE & SHIFTS */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Weekly Schedule</h4>
                    <p className="text-xs text-slate-400">Designate the weekly off day for roster planning</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowWeeklyOffModal(true)}
                    className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Weekly Off ({staffFormData.weeklyOff || 'Monday'})
                  </button>
                </div>
              </div>

              {/* SECTION 3: JOINING DETAILS */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Joining & Employment Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Joining Date</label>
                    <input 
                      type="date"
                      value={staffFormData.joiningDate}
                      onChange={(e) => setStaffFormData(p => ({ ...p, joiningDate: e.target.value }))}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Designation</label>
                    <input 
                      type="text"
                      value={staffFormData.designation}
                      onChange={(e) => setStaffFormData(p => ({ ...p, designation: e.target.value }))}
                      placeholder="Designation"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">UAN Number</label>
                    <input 
                      type="text"
                      value={staffFormData.uanNumber}
                      onChange={(e) => setStaffFormData(p => ({ ...p, uanNumber: e.target.value }))}
                      placeholder="UAN Number"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Reporting Manager</label>
                    <input 
                      type="text"
                      value={staffFormData.reportingTo}
                      onChange={(e) => setStaffFormData(p => ({ ...p, reportingTo: e.target.value }))}
                      placeholder="e.g. Owner, Store Manager"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Daily Working Hours</label>
                    <input 
                      type="text"
                      value={staffFormData.workingHours}
                      onChange={(e) => setStaffFormData(p => ({ ...p, workingHours: e.target.value }))}
                      placeholder="e.g. 8 hrs"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: BANK DETAILS */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Bank & Payroll Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bank Name</label>
                    <input 
                      type="text"
                      value={staffFormData.bankName}
                      onChange={(e) => setStaffFormData(p => ({ ...p, bankName: e.target.value }))}
                      placeholder="Bank Name"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Branch</label>
                    <input 
                      type="text"
                      value={staffFormData.branch}
                      onChange={(e) => setStaffFormData(p => ({ ...p, branch: e.target.value }))}
                      placeholder="Branch"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Account Number</label>
                    <input 
                      type="text"
                      value={staffFormData.accountNumber}
                      onChange={(e) => setStaffFormData(p => ({ ...p, accountNumber: e.target.value }))}
                      placeholder="Account Number"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">IFSC Code</label>
                    <input 
                      type="text"
                      value={staffFormData.ifsc}
                      onChange={(e) => setStaffFormData(p => ({ ...p, ifsc: e.target.value }))}
                      placeholder="IFSC Code"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 font-mono uppercase focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: EXPERIENCE & DOCUMENTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Work Experience</h4>
                    <button 
                      type="button"
                      onClick={() => setShowAddExpModal(true)}
                      className="w-6 h-6 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  {staffFormData.workExperience && staffFormData.workExperience.length > 0 ? (
                    <div className="space-y-1.5">
                      {staffFormData.workExperience.map((exp, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs border border-slate-100">
                          <div>
                            <span className="font-bold text-slate-800">{exp.company}</span>
                            <span className="text-slate-500 ml-1.5">({exp.role})</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setStaffFormData(p => ({ ...p, workExperience: p.workExperience.filter((_, idx) => idx !== i) }))}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No experience added.</p>
                  )}
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Documents</h4>
                    <button 
                      type="button"
                      onClick={() => setShowAddDocModal(true)}
                      className="w-6 h-6 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  {staffFormData.documents && staffFormData.documents.length > 0 ? (
                    <div className="space-y-1.5">
                      {staffFormData.documents.map((doc, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs border border-slate-100">
                          <div>
                            <span className="font-bold text-slate-800">{doc.type}</span>: <span className="font-mono text-slate-600">{doc.number}</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setStaffFormData(p => ({ ...p, documents: p.documents.filter((_, idx) => idx !== i) }))}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No documents uploaded.</p>
                  )}
                </div>
              </div>

              {/* FOOTER BUTTONS */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={handleCancelStaff}
                  className="px-5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-7 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  {isEditingStaff ? 'Save Changes' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SELECT WEEKLY OFF                                 */}
      {/* ======================================================== */}
      {showWeeklyOffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowWeeklyOffModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Select Weekly Off</h3>
              <button onClick={() => setShowWeeklyOffModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 pt-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    setStaffFormData(p => ({ ...p, weeklyOff: day }));
                    setShowWeeklyOffModal(false);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left flex items-center justify-between cursor-pointer ${
                    staffFormData.weeklyOff === day
                      ? 'bg-sky-500 text-white font-semibold shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>{day}</span>
                  {staffFormData.weeklyOff === day && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD WORK EXPERIENCE                                */}
      {/* ======================================================== */}
      {showAddExpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowAddExpModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Add Work Experience</h3>
              <button onClick={() => setShowAddExpModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Company / Salon Name</label>
                <input
                  type="text"
                  value={newExp.company}
                  onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                  placeholder="e.g. Naturals Salon"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Role / Position</label>
                <input
                  type="text"
                  value={newExp.role}
                  onChange={(e) => setNewExp({ ...newExp, role: e.target.value })}
                  placeholder="e.g. Hair Stylist"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Duration</label>
                <input
                  type="text"
                  value={newExp.duration}
                  onChange={(e) => setNewExp({ ...newExp, duration: e.target.value })}
                  placeholder="e.g. 2 Years"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddExpModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newExp.company.trim()) {
                    alert('Please enter company name.');
                    return;
                  }
                  setStaffFormData(p => ({
                    ...p,
                    workExperience: [...(p.workExperience || []), newExp]
                  }));
                  setNewExp({ company: '', role: '', duration: '' });
                  setShowAddExpModal(false);
                }}
                className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-semibold cursor-pointer shadow-xs"
              >
                Add Experience
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD DOCUMENT                                       */}
      {/* ======================================================== */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowAddDocModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Add Document</h3>
              <button onClick={() => setShowAddDocModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Document Type</label>
                <select
                  value={newDoc.type}
                  onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="Aadhar Card">Aadhar Card</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Resume">Resume</option>
                  <option value="Certification">Certification</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Document Number / Reference</label>
                <input
                  type="text"
                  value={newDoc.number}
                  onChange={(e) => setNewDoc({ ...newDoc, number: e.target.value })}
                  placeholder="Enter document number or ID"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddDocModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newDoc.number.trim()) {
                    alert('Please enter document number.');
                    return;
                  }
                  setStaffFormData(p => ({
                    ...p,
                    documents: [...(p.documents || []), newDoc]
                  }));
                  setNewDoc({ type: 'Aadhar Card', number: '' });
                  setShowAddDocModal(false);
                }}
                className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-semibold cursor-pointer shadow-xs"
              >
                Add Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
