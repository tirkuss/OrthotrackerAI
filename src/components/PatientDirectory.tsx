import React, { useState, useMemo } from 'react';
import { Search, Plus, UserPlus, FileText, ChevronRight, RefreshCw, BarChart2, Archive, User } from 'lucide-react';
import { Patient } from '../types';
import { IMAGES } from '../db';

interface PatientDirectoryProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onAddNewPatientOpen: () => void;
  onSync: () => void;
  onNavigateToDataManagement: () => void;
  onToggleArchive?: (patient: Patient) => void;
}

export default function PatientDirectory({
  patients,
  onSelectPatient,
  onAddNewPatientOpen,
  onSync,
  onNavigateToDataManagement,
  onToggleArchive
}: PatientDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'A-Z' | 'Z-A'>('A-Z');
  const [viewArchived, setViewArchived] = useState(false);
  const [searchTime, setSearchTime] = useState<number | null>(null);

  // Filter and group patients with performance logging
  const processedData = useMemo(() => {
    const start = performance.now();
    
    // Perform filtering
    let filtered = patients.filter(p => {
      const isArchived = p.archived === true;
      if (viewArchived !== isArchived) return false;

      const query = searchTerm.toLowerCase();
      return (
        p.name.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query) ||
        p.phone.includes(query) ||
        p.email.toLowerCase().includes(query)
      );
    });

    // Perform sorting
    filtered.sort((a, b) => {
      if (sortBy === 'A-Z') {
        return a.name.localeCompare(b.name);
      } else {
        return b.name.localeCompare(a.name);
      }
    });

    // Group alphabetically
    const groups: { [key: string]: Patient[] } = {};
    filtered.forEach(p => {
      const letter = p.name.charAt(0).toUpperCase();
      const groupKey = /^[A-Z]$/.test(letter) ? letter : '#';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(p);
    });

    const end = performance.now();
    // Only update search time if there is a query or count represents a substantial database
    if (searchTerm || patients.length > 5) {
      setSearchTime(parseFloat((end - start).toFixed(2)));
    } else {
      setSearchTime(null);
    }

    return {
      groups,
      count: filtered.length
    };
  }, [patients, searchTerm, sortBy, viewArchived]);

  return (
    <div className="flex flex-col gap-6" id="patient-directory-sec">
      {/* Search Bar Section */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-slate-800 dark:text-slate-100 text-[16px]"
          placeholder="Search clinical records by name..."
          type="text"
          id="search-patients-input"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded"
          >
            Clear
          </button>
        )}
      </div>

      {/* View Filter Switcher (Active vs Archived) */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl w-full sm:w-80 border border-slate-200/40">
        <button
          onClick={() => setViewArchived(false)}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            !viewArchived
              ? 'bg-white dark:bg-slate-900 text-primary dark:text-sky-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          Active Database
        </button>
        <button
          onClick={() => setViewArchived(true)}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            viewArchived
              ? 'bg-white dark:bg-slate-900 text-primary dark:text-sky-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          Archived Files
        </button>
      </div>

      {/* Database Stats Overlay / Performance Indicator */}
      {(patients.length > 4 || searchTime !== null) && (
        <div className="flex items-center justify-between text-xs font-mono px-2 py-1 bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 rounded-lg">
          <span>Active Scope: {patients.filter(p => !p.archived).length.toLocaleString()} | Archived: {patients.filter(p => p.archived).length.toLocaleString()}</span>
          {searchTime !== null && (
            <span className="text-emerald-600 font-semibold">
              Query matched {processedData.count} profiles in {searchTime}ms
            </span>
          )}
        </div>
      )}

      {/* Quick Action Cards (Mobile Grid) */}
      <div className="grid grid-cols-2 gap-4 md:hidden">
        <button
          onClick={onSync}
          className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 active:bg-slate-50"
        >
          <RefreshCw className="text-primary w-6 h-6 animate-spin-slow" />
          <span className="text-[11px] font-semibold tracking-wider text-slate-500">DATA SYNC</span>
        </button>
        <button
          onClick={onNavigateToDataManagement}
          className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 active:bg-slate-50"
        >
          <BarChart2 className="text-teal-600 w-6 h-6" />
          <span className="text-[11px] font-semibold tracking-wider text-slate-500">REPORTS</span>
        </button>
      </div>

      {/* Patient Directory Headders */}
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-semibold text-slate-900 dark:text-slate-100">
          {viewArchived ? 'Archived Records' : 'Patient Directory'}
        </h2>
        <div 
          onClick={() => setSortBy(prev => prev === 'A-Z' ? 'Z-A' : 'A-Z')}
          className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full cursor-pointer hover:bg-slate-200 transition-colors"
          title="Toggle Alphabetical Sort"
        >
          <span className="text-[11px] font-semibold text-slate-500 uppercase">SORT:</span>
          <span className="text-[11px] font-semibold text-primary">{sortBy}</span>
        </div>
      </div>

      {/* Empty State */}
      {processedData.count === 0 && (
        <div className="text-center py-12 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200/80 dark:border-slate-800">
          <p className="text-slate-500 mb-4 text-sm">
            {viewArchived 
              ? 'No archived clinical records found.' 
              : `No active clinical records match "${searchTerm}"`}
          </p>
          {!viewArchived && (
            <button
              onClick={onAddNewPatientOpen}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/95 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add New Patient
            </button>
          )}
        </div>
      )}

      {/* Patient List grouped by Letter */}
      <div className="space-y-6">
        {Object.keys(processedData.groups).sort().map(letter => (
          <div key={letter} className="space-y-3">
            {/* Letter Divider */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-lg shadow-2xs">
                <span className="text-[14px] font-extrabold text-slate-850 dark:text-slate-100 uppercase tracking-widest leading-none">{letter}</span>
              </div>
              <div className="h-[1px] flex-grow bg-slate-200 dark:bg-slate-800"></div>
            </div>

            {/* List Patients under this letter */}
            <div className="space-y-3">
              {processedData.groups[letter].map(patient => {
                // Get the main photo or null if none exist
                const photoSrc = patient.photos && patient.photos.length > 0 ? patient.photos[0] : null;
                return (
                  <div
                    key={patient.id}
                    onClick={() => onSelectPatient(patient)}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl shadow-xs hover:shadow-md hover:border-primary border border-slate-100 dark:border-slate-800 border-l-4 border-l-primary transition-all cursor-pointer gap-4"
                  >
                    <div className="flex items-center gap-4">
                      {/* Clinical Thumbnail */}
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200/50 dark:border-slate-750 shrink-0">
                        {photoSrc ? (
                          <img
                            src={photoSrc}
                            alt={patient.name}
                            className="w-full h-full object-cover pointer-events-none"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-650 font-bold text-xs uppercase">
                            <User className="w-5 h-5 shrink-0" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-[16px] font-semibold text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">
                          {patient.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {patient.age} Yrs • {patient.gender} • {patient.phone}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end gap-3 self-stretch sm:self-auto">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-medium tracking-wide text-slate-400 uppercase">Last Visit</p>
                        <p className="text-xs font-mono text-slate-600 dark:text-slate-300">{patient.startDate || patient.registrationDate}</p>
                      </div>

                      {/* Archive / Restore Button */}
                      {onToggleArchive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleArchive(patient);
                          }}
                          className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:text-primary dark:hover:text-sky-450 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title={patient.archived ? "Restore patient record" : "Archive patient record"}
                        >
                          <Archive className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary" />
                          <span>{patient.archived ? 'Restore' : 'Archive'}</span>
                        </button>
                      )}

                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all max-sm:hidden" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
