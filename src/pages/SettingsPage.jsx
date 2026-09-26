import React, { useState } from 'react';
import { Settings, Check, Clock, Store } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Generic');
  const [notification, setNotification] = useState('');

  // Generic Settings State (SRS Section 8.1)
  const [genericSettings, setGenericSettings] = useState({
    businessOpen: true,
    timingStart: '08:00 AM',
    timingEnd: '11:30 PM',
    applicableGender: 'Both', // Female, Male, Both
    weeklyOff: 'Tuesday',
  });

  const handleSaveSettings = (e) => {
    if (e) e.preventDefault();
    setNotification('Business settings updated successfully!');
    setTimeout(() => setNotification(''), 3000);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      {/* Left Settings Navigation */}
      <div className="w-full md:w-60 bg-white border-r border-slate-200 shrink-0 p-4 space-y-1">
        <div className="flex items-center gap-2 pb-4 mb-3 border-b border-slate-100">
          <Settings className="text-indigo-600" size={20} />
          <h2 className="text-base font-bold text-slate-800">Settings</h2>
        </div>

        {[
          { id: 'Generic', label: 'Generic Settings', icon: Settings },
        ].map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <item.icon size={15} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Settings Content Area */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        {notification && (
          <div className="max-w-2xl mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
            <Check size={16} className="shrink-0 text-emerald-600" />
            <span>{notification}</span>
          </div>
        )}

        {/* 1. GENERIC SETTINGS (SRS Section 8.1) */}
        {activeTab === 'Generic' && (
          <form onSubmit={handleSaveSettings} className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Store size={20} className="text-indigo-600" />
                  <span>Generic Business Settings</span>
                </h2>
                <p className="text-xs text-slate-500">Configure salon store hours, operational days, and clientele gender</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Business Open / Closed */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <span className="text-sm font-semibold text-slate-800">Business Open State</span>
                  <p className="text-xs text-slate-400">Toggle whether the salon counter is open for taking orders</p>
                </div>
                <button
                  type="button"
                  onClick={() => setGenericSettings({ ...genericSettings, businessOpen: !genericSettings.businessOpen })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    genericSettings.businessOpen ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              {/* Business Timings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1 flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400" />
                    <span>Opening Time</span>
                  </label>
                  <input
                    type="text"
                    value={genericSettings.timingStart}
                    onChange={(e) => setGenericSettings({ ...genericSettings, timingStart: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1 flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-400" />
                    <span>Closing Time</span>
                  </label>
                  <input
                    type="text"
                    value={genericSettings.timingEnd}
                    onChange={(e) => setGenericSettings({ ...genericSettings, timingEnd: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Applicable Gender */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Applicable Gender</label>
                <div className="flex gap-4">
                  {['Female', 'Male', 'Both'].map(g => (
                    <label key={g} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                      <input
                        type="radio"
                        name="gender"
                        checked={genericSettings.applicableGender === g}
                        onChange={() => setGenericSettings({ ...genericSettings, applicableGender: g })}
                        className="text-indigo-600 accent-indigo-600"
                      />
                      <span>{g}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Weekly Off */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Weekly Off</label>
                <select
                  value={genericSettings.weeklyOff}
                  onChange={(e) => setGenericSettings({ ...genericSettings, weeklyOff: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 text-slate-800 focus:outline-none focus:border-indigo-600"
                >
                  {['None', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
