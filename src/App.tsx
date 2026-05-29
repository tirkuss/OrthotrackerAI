import React, { useState, useEffect } from 'react';
import { 
  Grid2X2, Users, Home as HomeIcon, Calendar as CalendarIcon, User as UserIcon, 
  Settings, Bell, HelpCircle, Activity, ShieldAlert, Check, RefreshCw 
} from 'lucide-react';
import { openDatabase, initDatabaseWithDefaults, OrthoDatabase, IMAGES } from './db';
import { Patient, Appointment, BackupHistoryLog } from './types';
import PatientDirectory from './components/PatientDirectory';
import AddPatientForm from './components/AddPatientForm';
import PatientProfile from './components/PatientProfile';
import ScheduleView from './components/ScheduleView';
import TechnicalInfo from './components/TechnicalInfo';
import DataManagement from './components/DataManagement';

export default function App() {
  const [dbLoaded, setDbLoaded] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [backupLogs, setBackupLogs] = useState<BackupHistoryLog[]>([]);

  // First-time onboarding states
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('ortho_doctor_name') || !localStorage.getItem('ortho_vault_path');
  });
  const [setupDocName, setSetupDocName] = useState(() => {
    return localStorage.getItem('ortho_doctor_name') || 'Dr. Sukrit Thakur';
  });
  const [setupVaultPath, setSetupVaultPath] = useState(() => {
    return localStorage.getItem('ortho_vault_path') || 'C:\\Users\\Thakur\\Desktop\\Orthotracker\\Vault';
  });

  // Navigation states
  // 'home' | 'patients' | 'schedule' | 'profile_dev' | 'admin'
  const [activeTab, setActiveTab] = useState<'home' | 'patients' | 'schedule' | 'profile_dev' | 'admin'>('home');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAddPatient, setShowAddPatient] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initial DB loading
  const loadDatabaseData = async () => {
    try {
      const db = await openDatabase();
      await initDatabaseWithDefaults(db);
      
      const [allPatients, allAppointments, allLogs] = await Promise.all([
        OrthoDatabase.getPatients(),
        OrthoDatabase.getAppointments(),
        OrthoDatabase.getBackupHistory()
      ]);

      setPatients(allPatients);
      setAppointments(allAppointments);
      setBackupLogs(allLogs);
      setDbLoaded(true);
    } catch (err) {
      console.error('Database initial load exception: ', err);
      showToast('IndexedDB Connection Warning: Proceeding with local state fallback.');
    }
  };

  useEffect(() => {
    loadDatabaseData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync action (reloads DB and simulates HIPAA synchronization)
  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    showToast('Synchronizing offline indices with secure clinical vault...');
    
    setTimeout(async () => {
      await loadDatabaseData();
      setIsSyncing(false);
      showToast('Offline cache synchronization passed and validated.');
    }, 1200);
  };

  // Create new patient trigger
  const handleCreatePatient = async (patientData: Omit<Patient, 'id' | 'progressLogs' | 'changeLogs'>) => {
    const newId = `P-${20000 + Math.floor(Math.random() * 90000)}`;
    const newPatient: Patient = {
      ...patientData,
      id: newId,
      progressLogs: [
        {
          id: `L-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          title: 'Initial Diagnosis Set Up',
          notes: `Chief complaint noted: "${patientData.chiefComplaint}". Assigned to standard orthodontic profile tracks.`,
          photos: patientData.photos
        }
      ],
      changeLogs: [
        {
          id: `C-${Date.now()}`,
          timestamp: new Date().toISOString(),
          author: localStorage.getItem('ortho_doctor_name') || 'Dr. Sukrit Thakur',
          field: 'Demographics set up',
          oldValue: 'N/A',
          newValue: 'Active Ortho Patient',
          description: 'Profile created manually via AddPatient portal.'
        }
      ]
    };

    try {
      // Optimistically update local state (FIXED: no full reload)
      setPatients(prev => [...prev, newPatient]);
      setShowAddPatient(false);
      setSelectedPatient(newPatient);
      showToast(`Orthodontic profile created for ${newPatient.name}.`);
      
      // Save to DB in background
      await OrthoDatabase.savePatient(newPatient);
    } catch (err: any) {
      // On error, rollback and show non-blocking toast
      setPatients(prev => prev.filter(p => p.id !== newId));
      showToast(`Failed to save record: ${err.message}`);
    }
  };

  // Edit or Update Patient trigger (FIXED: optimistic update pattern)
  const handleUpdatePatient = async (updatedPatient: Patient) => {
    try {
      // Optimistically update local state immediately (FIXED: no full reload)
      setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
      setSelectedPatient(updatedPatient);
      showToast(`Changes recorded successfully on patient: ${updatedPatient.id}`);
      
      // Save to DB in background
      await OrthoDatabase.savePatient(updatedPatient);
    } catch (err: any) {
      // On error, reload to ensure consistency
      showToast(`Save error, reloading database: ${err.message}`);
      await loadDatabaseData();
    }
  };

  const handleToggleArchivePatient = async (patient: Patient) => {
    const updated = { ...patient, archived: !patient.archived };
    try {
      // Optimistic update
      setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
      showToast(updated.archived ? 'Patient archived securely.' : 'Patient restored to active roster.');
      
      // Save in background
      await OrthoDatabase.savePatient(updated);
    } catch (err: any) {
      showToast(`Archive action failed: ${err.message}`);
      await loadDatabaseData();
    }
  };

  // Create appointment trigger
  const handleCreateAppointment = async (apptData: Omit<Appointment, 'id'>) => {
    const newAppt: Appointment = {
      ...apptData,
      id: `A-${Date.now()}`
    };

    try {
      // Optimistic update
      setAppointments(prev => [...prev, newAppt]);
      showToast(`Ortho chair slot booked successfully for ${newAppt.patientName}.`);
      
      // Save in background
      await OrthoDatabase.saveAppointment(newAppt);
    } catch (err: any) {
      showToast(`Could not save appt: ${err.message}`);
    }
  };

  const handleAddBackupLog = async (action: string, sizeStr: string) => {
    const newLog: BackupHistoryLog = {
      id: `B-${Date.now()}`,
      dateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action,
      initiatedBy: localStorage.getItem('ortho_doctor_name') || 'Dr. Sukrit Thakur',
      status: 'COMPLETED',
      fileSize: sizeStr
    };
    try {
      // Optimistic update
      setBackupLogs(prev => [newLog, ...prev]);
      
      // Save in background
      await OrthoDatabase.addBackupHistoryLog(newLog);
    } catch (e) {
      console.error(e);
      showToast('Failed to log backup');
    }
  };

  // Render components based on state routing
  const renderContent = () => {
    if (!dbLoaded) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="font-mono text-sm leading-none">Starting OrthoTracker local client stores...</p>
        </div>
      );
    }

    // Individual drilled view overrides general tabs
    if (showAddPatient) {
      return (
        <AddPatientForm
          onBack={() => setShowAddPatient(false)}
          onSubmit={handleCreatePatient}
          patients={patients}
        />
      );
    }

    if (selectedPatient) {
      return (
        <PatientProfile
          patient={selectedPatient}
          onBack={() => setSelectedPatient(null)}
          onUpdatePatient={handleUpdatePatient}
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6" id="dashboard-canvas">
            {/* Clinical Jumbotron Header */}
            <div className="bg-[#5EB2F4] p-6 md:p-8 rounded-xl text-white shadow-sm relative overflow-hidden">
              <div className="relative z-10 max-w-lg space-y-3">
                <h1 className="text-[28px] md:text-[34px] font-bold tracking-tight leading-tight">
                  Orthodontic Practice Companion
                </h1>
                <p className="text-xs md:text-sm text-sky-50 leading-relaxed max-w-md font-medium">
                  Seamless orthodontic patient tracking. Manage diagnostic profiles, monitor aligner visits timeline, and generate change histories completely offline.
                </p>
                
                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setActiveTab('patients');
                      setShowAddPatient(true);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs tracking-wider transition-colors shadow-sm"
                  >
                    + NEW PATIENT
                  </button>
                  <button
                    onClick={handleSyncDatabase}
                    className="px-4 py-2 bg-[#006399] hover:bg-[#005280] text-white border-none font-extrabold rounded-lg text-xs tracking-wider transition-colors flex items-center gap-1.5 shadow-md"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    VAULT SYNC
                  </button>
                </div>
              </div>
              <div className="absolute -right-12 -bottom-12 opacity-10 pointer-events-none">
                <Activity className="w-56 h-56" />
              </div>
            </div>

            {/* Quick dashboard indicators & Upcoming schedule */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-12">
              {/* Left Column: Active Cases */}
              <div className="md:col-span-4 flex flex-col">
                <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col justify-between h-full min-h-[160px]">
                  <div>
                    <span className="text-[10px] tracking-wider font-bold text-slate-400 uppercase">ACTIVE CASES</span>
                    <p className="text-[40px] font-bold text-primary dark:text-sky-400 leading-none mt-2 font-mono">
                      {patients.filter(p => p.treatmentStatus === 'active').length.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-[10px] text-teal-600 font-semibold block mt-4 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Online Index Ready
                  </span>
                </div>
              </div>

              {/* Right Column: Upcoming */}
              <div className="md:col-span-8">
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-150 dark:border-slate-800 shadow-xs space-y-4 h-full">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold tracking-wider uppercase text-slate-500">Upcoming</h3>
                    <button onClick={() => setActiveTab('schedule')} className="text-xs font-semibold text-primary hover:underline">
                      Expand Agenda
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {appointments.slice(0, 3).map(appt => (
                      <div 
                        key={appt.id} 
                        onClick={() => {
                          const pat = patients.find(p => p.id === appt.patientId);
                          if (pat) setSelectedPatient(pat);
                          else {
                            setActiveTab('patients');
                          }
                        }}
                        className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-150 dark:border-slate-800 hover:border-primary cursor-pointer transition-colors flex justify-between"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{appt.patientName}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{appt.patientStatus}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-bold text-primary dark:text-sky-400 block">{appt.timeStart}</span>
                        </div>
                      </div>
                    ))}
                    {appointments.length === 0 && (
                      <p className="text-xs text-slate-500 italic text-center py-6">No clinical appointments loaded.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'patients':
        return (
          <PatientDirectory
            patients={patients}
            onSelectPatient={setSelectedPatient}
            onAddNewPatientOpen={() => setShowAddPatient(true)}
            onSync={handleSyncDatabase}
            onNavigateToDataManagement={() => setActiveTab('admin')}
            onToggleArchive={handleToggleArchivePatient}
          />
        );

      case 'schedule':
        return (
          <ScheduleView
            appointments={appointments}
            patients={patients}
            onAddNewAppointment={handleCreateAppointment}
            onSelectPatientById={(pId) => {
              const matched = patients.find(p => p.id === pId);
              if (matched) {
                setSelectedPatient(matched);
              } else {
                showToast('Seeding patient profile lookup...');
              }
            }}
          />
        );

      case 'profile_dev':
        return (
          <TechnicalInfo
            onContactDeveloper={() => {
              showToast('Support Line: Contact Dr. Sukrit Thakur via Email support@orthodigital.org or contact developer panels.');
            }}
            onNavigateToDataManagement={() => setActiveTab('admin')}
          />
        );

      case 'admin':
        return (
          <DataManagement
            patients={patients}
            appointments={appointments}
            backupLogs={backupLogs}
            onDatabaseReload={loadDatabaseData}
            onAddBackupLog={handleAddBackupLog}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans" id="applet-viewport">
      
      {/* Onboarding Workspace Setup & Author Configuration */}
      {showOnboarding && (
        <div className="fixed inset-0 z-100 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-150 dark:border-slate-800 p-6 md:p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-sky-50 dark:bg-sky-950/40 text-primary dark:text-sky-305 rounded-xl flex items-center justify-center mx-auto mb-2 border border-sky-100 dark:border-sky-900/60">
                <Settings className="w-6 h-6 animate-spin shrink-0" />
              </div>
              <h2 className="text-[22px] font-extrabold text-slate-850 dark:text-slate-100 tracking-tight leading-tight">
                Practice Initial Setup
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Configure OrthoTracker secure offline client storage and primary practitioner credential details.
              </p>
            </div>

            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">
                  Practitioner / Doctor Name
                </label>
                <input
                  type="text"
                  value={setupDocName}
                  onChange={(e) => setSetupDocName(e.target.value)}
                  placeholder="e.g. Dr. Sukrit Thakur"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:bg-white dark:focus:bg-slate-900"
                />
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  Used as the reviewing orthodontist and primary account user for clinical change records.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">
                  Clinical Data Vault Directory
                </label>
                <input
                  type="text"
                  value={setupVaultPath}
                  onChange={(e) => setSetupVaultPath(e.target.value)}
                  placeholder="e.g. C:\Users\Thakur\Desktop\Orthotracker\Vault"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:bg-white dark:focus:bg-slate-900"
                />
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  Local computer directory path location where offline backups and exported patient directories are persisted.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!setupDocName.trim() || !setupVaultPath.trim()) {
                  showToast('Please enter a valid clinician name and storage vault folder.');
                  return;
                }
                localStorage.setItem('ortho_doctor_name', setupDocName.trim());
                localStorage.setItem('ortho_vault_path', setupVaultPath.trim());
                setShowOnboarding(false);
                showToast('Clinical offline workspace initialized successfully.');
              }}
              className="w-full h-11 bg-[#5EB2F4] hover:bg-[#4ea2e4] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors shadow-md active:scale-98 flex items-center justify-center"
            >
              Initialize security Vault
            </button>
          </div>
        </div>
      )}

      {/* HIPAA Compliance top status ticker overlay */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-55 w-full max-w-sm px-4">
          <div className="bg-slate-900 border border-slate-800 text-white text-xs px-4 py-3 rounded-xl shadow-lg flex items-center justify-between gap-3 transition-all duration-150 animate-in fade-in">
            <span className="font-medium">{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        </div>
      )}

      {/* Top App Bar Header Wrapper */}
      <header className="fixed top-0 w-full z-45 bg-white shadow-xs flex items-center justify-between px-4 md:px-10 h-16 shrink-0 border-b border-slate-100/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky-100 overflow-hidden flex items-center justify-center border border-sky-100">
            <img 
              alt="OrthoTracker App icon" 
              className="w-full h-full object-cover pointer-events-none" 
              src={IMAGES.orthoAppIcon}
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-primary tracking-tight md:text-[22px] leading-tight">
              OrthoTracker
            </h1>
          </div>
        </div>

        {/* Global actions on top bar */}
        <div className="flex items-center gap-3">
          {/* Active indicator */}
          <div className="items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold tracking-wide uppercase font-mono hidden md:flex border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Offline Database Synchronized</span>
          </div>

          <button 
            onClick={handleSyncDatabase}
            className={`p-2 hover:bg-slate-100 rounded-full text-slate-500 relative transition-colors ${isSyncing ? 'text-primary' : ''}`}
            title="Sync offline state"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setActiveTab('profile_dev')}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors" 
            title="Software Info"
          >
            <HelpCircle className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </header>

      {/* Desktop Main Container: Side Navigation Layout */}
      <div className="flex flex-grow pt-16 pb-20 md:pb-0 font-sans" id="main-content-row">
        
        {/* Safe Side Navigation (Visible only on Desktop Screens) */}
        <nav className="hidden md:flex fixed left-0 top-16 bottom-0 w-[240px] flex-col py-6 px-4 gap-2 bg-white border-r border-slate-100 shadow-2xs z-35">
          <div className="px-3 mb-6 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
            Clinical Companion
          </div>

          <button
            onClick={() => {
              setActiveTab('home');
              setSelectedPatient(null);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-extrabold uppercase tracking-wider text-left transition-colors cursor-pointer ${
              activeTab === 'home' && !selectedPatient && !showAddPatient
                ? 'bg-sky-50 dark:bg-sky-950/40 text-primary dark:text-sky-300 border border-sky-100 dark:border-sky-900/60 shadow-xs'
                : 'text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-950 border border-transparent'
            }`}
          >
            <HomeIcon className="w-4.5 h-4.5 shrink-0" />
            <span>Home</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('patients');
              setSelectedPatient(null);
              setShowAddPatient(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-extrabold uppercase tracking-wider text-left transition-colors cursor-pointer ${
              (activeTab === 'patients' || selectedPatient || showAddPatient)
                ? 'bg-sky-50 dark:bg-sky-950/40 text-primary dark:text-sky-300 border border-sky-100 dark:border-sky-900/60 shadow-xs'
                : 'text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-950 border border-transparent'
            }`}
          >
            <Users className="w-4.5 h-4.5 shrink-0" />
            <span>Patients Directory</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('schedule');
              setSelectedPatient(null);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-extrabold uppercase tracking-wider text-left transition-colors cursor-pointer ${
              activeTab === 'schedule' && !selectedPatient
                ? 'bg-sky-50 dark:bg-sky-950/40 text-primary dark:text-sky-300 border border-sky-100 dark:border-sky-900/60 shadow-xs'
                : 'text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-950 border border-transparent'
            }`}
          >
            <CalendarIcon className="w-4.5 h-4.5 shrink-0" />
            <span>Schedule</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('profile_dev');
              setSelectedPatient(null);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-extrabold uppercase tracking-wider text-left transition-colors cursor-pointer ${
              activeTab === 'profile_dev' && !selectedPatient
                ? 'bg-sky-50 dark:bg-sky-950/40 text-primary dark:text-sky-300 border border-sky-100 dark:border-sky-900/60 shadow-xs'
                : 'text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-950 border border-transparent'
            }`}
          >
            <UserIcon className="w-4.5 h-4.5 shrink-0" />
            <span>Developer Info</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('admin');
              setSelectedPatient(null);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-extrabold uppercase tracking-wider text-left transition-colors cursor-pointer ${
              activeTab === 'admin' && !selectedPatient
                ? 'bg-sky-50 dark:bg-sky-950/40 text-primary dark:text-sky-300 border border-sky-100 dark:border-sky-900/60 shadow-xs'
                : 'text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-950 border border-transparent'
            }`}
          >
            <Settings className="w-4.5 h-4.5 shrink-0" />
            <span>Admin</span>
          </button>
        </nav>

        {/* Core Content Area */}
        <main className="flex-grow md:ml-[240px] px-4 md:px-10 py-6 max-w-5xl mx-auto w-full transition-all">
          {renderContent()}
        </main>
      </div>

      {/* Embedded FAB for shortcut (Patients) */}
      {!showAddPatient && !selectedPatient && activeTab === 'patients' && (
        <button
          onClick={() => setShowAddPatient(true)}
          className="fixed bottom-24 right-5 md:right-10 w-14 h-14 bg-primary hover:bg-primary-container text-white rounded-2xl shadow-lg flex items-center justify-center transition-colors z-40"
          title="Add New Patient Profile"
        >
          <UserIcon className="w-6 h-6 stroke-[3px]" />
        </button>
      )}

      {/* Bottom Navigation (Mobile Only view) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 h-[72px] pb-safe bg-white border-t border-slate-200/50 shadow-lg flex justify-around items-center px-2">
        <button
          onClick={() => {
            setActiveTab('home');
            setSelectedPatient(null);
            setShowAddPatient(false);
          }}
          className={`flex flex-col items-center justify-center px-3 py-1 bg-transparent border-none ${
            activeTab === 'home' && !selectedPatient && !showAddPatient
              ? 'text-primary'
              : 'text-slate-400'
          }`}
        >
          <Grid2X2 className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-bold tracking-wider uppercase mt-1">Home</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('patients');
            setSelectedPatient(null);
            setShowAddPatient(false);
          }}
          className={`flex flex-col items-center justify-center px-3 py-1 bg-transparent border-none ${
            (activeTab === 'patients' || selectedPatient || showAddPatient)
              ? 'text-primary'
              : 'text-slate-400'
          }`}
        >
          <Users className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-bold tracking-wider uppercase mt-1">Patients</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('schedule');
            setSelectedPatient(null);
            setShowAddPatient(false);
          }}
          className={`flex flex-col items-center justify-center px-3 py-1 bg-transparent border-none ${
            activeTab === 'schedule' && !selectedPatient && !showAddPatient
              ? 'text-primary'
              : 'text-slate-400'
          }`}
        >
          <CalendarIcon className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-bold tracking-wider uppercase mt-1">Schedule</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('admin');
            setSelectedPatient(null);
            setShowAddPatient(false);
          }}
          className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl border-none ${
            activeTab === 'admin'
              ? 'bg-sky-100 text-primary'
              : 'text-slate-400'
          }`}
        >
          <Settings className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-bold tracking-wider uppercase mt-1">Admin</span>
        </button>
      </nav>
    </div>
  );
}
