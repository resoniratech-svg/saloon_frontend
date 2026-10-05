import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, Check, X, Shield, Clock, Building,
  Edit2, CheckCircle2, ChevronDown, Calendar, FileText, User,
  Phone, Mail, Eye, Trash2, UserCheck, Briefcase, Filter,
  AlertCircle, Loader2
} from 'lucide-react';
import {
  getMasterStaff,
  saveMasterStaff,
  addStaffMember,
  updateStaffMember,
  deleteStaffMember,
  toggleStaffStatusInBackend,
  syncStaffFromBackend,
  getStoredStaffExperience,
} from '../utils/staffStorage';

export default function StaffManagementPage() {
  const [staffList, setStaffList] = useState(() => getMasterStaff());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [notification, setNotification] = useState('');
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [isSavingStaff, setIsSavingStaff] = useState(false);
  const [salaryStatuses, setSalaryStatuses] = useState({});

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
    // 1. Initial backend sync from PostgreSQL
    setIsLoadingStaff(true);
    syncStaffFromBackend()
      .then((liveList) => {
        if (Array.isArray(liveList)) {
          setStaffList(liveList);
        }
      })
      .finally(() => {
        setIsLoadingStaff(false);
      });

    const handleSync = () => {
      const list = getMasterStaff();
      setStaffList(list);
    };

    window.addEventListener('staffUpdated', handleSync);
    window.addEventListener('tenantChanged', () => {
      handleSync();
      syncStaffFromBackend();
    });
    return () => {
      window.removeEventListener('staffUpdated', handleSync);
      window.removeEventListener('tenantChanged', handleSync);
    };
  }, []);

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3500);
  };

  const handleSelectStaff = (staffMember) => {
    setSelectedStaffId(staffMember.id);
    const nameParts = (staffMember.name || '').trim().split(' ');
    const exp = (staffMember.workExperience && staffMember.workExperience.length > 0)
      ? staffMember.workExperience
      : getStoredStaffExperience(staffMember.id);
    const docs = Array.isArray(staffMember.documents)
      ? staffMember.documents.map(d => ({
          id: d.id,
          type: d.type || d.documentType || 'Identity Proof',
          documentType: d.documentType || d.type || 'Identity Proof',
          number: d.number || d.documentNumber || '',
          documentNumber: d.documentNumber || d.number || '',
          url: d.url || d.documentUrl || '',
        }))
      : [];

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
      workExperience: exp,
      documents: docs,
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
    const target = staffList.find(s => s.id === staffId);
    const newStatus = target ? target.active === false : false;
    const updated = staffList.map(s => (s.id === staffId ? { ...s, active: newStatus } : s));
    setStaffList(updated);
    saveMasterStaff(updated);
    toggleStaffStatusInBackend(staffId, newStatus);
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

  const handleSaveStaffForm = async (e) => {
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

    try {
      setIsSavingStaff(true);
      if (selectedStaffId) {
        // Editing existing staff
        await updateStaffMember(selectedStaffId, {
          ...staffFormData,
          name: fullName,
          phone: staffFormData.mobile,
          position: resolvedPosition,
          designation: resolvedDesignation,
        });
        showToast(`Staff "${fullName}" updated successfully!`);
      } else {
        // Creating new staff
        const nextEmpNum = 'EMP-' + String(100 + staffList.length + 1).padStart(3, '0');
        await addStaffMember({
          ...staffFormData,
          empNo: nextEmpNum,
          name: fullName,
          phone: staffFormData.mobile,
          position: resolvedPosition,
          designation: resolvedDesignation,
        });
        showToast(`New Staff "${fullName}" created successfully!`);
      }

      await syncStaffFromBackend();
      setStaffList(getMasterStaff());
      setShowStaffModal(false);
    } catch (err) {
      console.error('Save staff error:', err);
      alert(err.message || 'Failed to save staff member to database.');
    } finally {
      setIsSavingStaff(false);
    }
  };

  const handleDeleteStaff = async (staffId) => {
    const target = staffList.find(st => st.id === staffId);
    const targetName = target ? target.name : 'this staff member';
    if (window.confirm(`Are you sure you want to delete "${targetName}"?`)) {
      const updated = await deleteStaffMember(staffId);
      setStaffList(updated);
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
            <h1 className="text-xl font-bold text-slate-800">Staff Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage salon stylists, attendance schedules, and shift timings</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateStaff}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-95"
        >
          <Plus size={15} /> Add Staff
        </button>
      </div>

      {/* STAFF DIRECTORY */}
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
                  {isLoadingStaff ? (
                    <tr>
                      <td colSpan="7" className="py-14 text-center text-slate-500 text-xs">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 size={24} className="animate-spin text-indigo-600" />
                          <span className="font-medium text-slate-600">Loading staff from database...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredStaffList.length === 0 ? (
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
                                onClick={() => {
                                  const exp = (st.workExperience && st.workExperience.length > 0)
                                    ? st.workExperience
                                    : getStoredStaffExperience(st.id);
                                  const docs = Array.isArray(st.documents)
                                    ? st.documents.map(d => ({
                                        id: d.id,
                                        type: d.type || d.documentType || 'Identity Proof',
                                        documentType: d.documentType || d.type || 'Identity Proof',
                                        number: d.number || d.documentNumber || '',
                                        documentNumber: d.documentNumber || d.number || '',
                                        url: d.url || d.documentUrl || '',
                                      }))
                                    : [];
                                  setViewingStaff({ ...st, workExperience: exp, documents: docs });
                                }}
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
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Reporting Manager:</span>
                    <span className="font-semibold text-slate-800">{viewingStaff.reportingTo || 'Owner'}</span>
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
                          <span className="font-medium text-slate-700">{doc.type || doc.documentType || 'Document'}</span>
                          <span className="font-mono text-slate-600">{doc.number || doc.documentNumber || '-'}</span>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Designation / Role</label>
                    <input 
                      type="text"
                      value={staffFormData.designation || staffFormData.position}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStaffFormData(p => ({ ...p, designation: val, position: val }));
                      }}
                      placeholder="e.g. Hair Specialist, Senior Stylist, Beautician"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-sky-500"
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
                            <span className="font-bold text-slate-800">{doc.type || doc.documentType || 'Document'}</span>: <span className="font-mono text-slate-600">{doc.number || doc.documentNumber || '-'}</span>
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
                  disabled={isSavingStaff}
                  className="px-7 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  {isSavingStaff && <Loader2 size={14} className="animate-spin" />}
                  {isSavingStaff ? 'Saving...' : (isEditingStaff ? 'Save Changes' : 'Create Staff Member')}
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
