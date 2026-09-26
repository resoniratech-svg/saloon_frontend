import React from 'react';
import { Construction } from 'lucide-react';

const PlaceholderPage = ({ title = 'Page' }) => {
  return (
    <div className="flex items-center justify-center h-full w-full bg-slate-50 p-4">
      <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full mx-auto mt-20 text-center border border-slate-200">
        <div className="flex justify-center mb-4">
          <div className="bg-indigo-50 p-4 rounded-full">
            <Construction className="text-indigo-600" size={48} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
        <p className="text-slate-500">This module is coming soon</p>
      </div>
    </div>
  );
};

export default PlaceholderPage;
