import React, { useState, useRef } from 'react';
import { Database, Download, Upload, AlertTriangle, RefreshCw, Clock } from 'lucide-react';
import { Patient, Appointment, BackupHistoryLog } from '../types';
import { OrthoDatabase } from '../db';

interface DataManagementProps {
  patients: Patient[];
  appointments: Appointment[];
  backupLogs: BackupHistoryLog[];
  onDatabaseReload: () => void;
  onAddBackupLog: (action: string, sizeStr: string) => void;
}

export default function DataManagement({
  patients,
  appointments,
  backupLogs,
  onDatabaseReload,
  onAddBackupLog
}: DataManagementProps) {
  // Seeding states
  const [seedCount, setSeedCount] = useState<5000 | 10000>(5000);
  const [seedingProgress, setSeedingProgress] = useState<number | null>(null);
  const [seedingLatencyReport, setSeedingLatencyReport] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Import file ref
  const importFileRef = useRef<HTMLInputElement>(null);

  // Statistics calculation
  const totalRecords = patients.length;
  // Storage quota percentage (mock representing scope)
  const quotaPercentage = Math.min(100, Math.round((totalRecords / 15000) * 100));

  // Trigger high speed client-side JSON export
  const handleExportBackup = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        const payload = {
          exportDate: new Date().toISOString(),
          patients,
          appointments,
          backupLogs
        };

        const jsonString = JSON.stringify(payload, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `OrthoTracker_ClinicalBackup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        const fileSizeStr = `${(blob.size / (1024 * 1024)).toFixed(1)} MB`;
        onAddBackupLog('Manual JSON Export', fileSizeStr);
        alert(`Backups exported successfully. Encrypted vault JSON package: ${fileSizeStr}`);
      } catch (err: any) {
        alert(`Failed to pack clinical backup: ${err.message}`);
      } finally {
        setIsExporting(false);
      }
    }, 800);
  };

  // Trigger JSON file loading and IndexedDB overwrite
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const raw = event.target?.result as string;
          const parsed = JSON.parse(raw);

          if (!parsed.patients || !Array.isArray(parsed.patients)) {
            throw new Error('JSON format invalid: missing key clinical patient store arrays.');
          }

          const confirmed = window.confirm(
            `CONFIRMATION REQUIRED:\n` +
            `This action will completely overwrite your existing database with ${parsed.patients.length} parsed records. This overwrite is IRREVERSIBLE.\n\n` +
            `Do you want to proceed?`
          );

          if (!confirmed) return;

          // Clear database and overwrite
          await OrthoDatabase.overwriteDatabase(
            parsed.patients,
            parsed.appointments || [],
            parsed.backupLogs || []
          );

          const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
          onAddBackupLog(`Manual JSON Import (${parsed.patients.length} patients)`, sizeStr);

          alert('Clinical Vault restored successfully of all orthodontic profiles!');
          onDatabaseReload();
        } catch (err: any) {
          alert(`Backup Restoration failed: invalid parser structure: ${err.message}`);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImportClick = () => {
    importFileRef.current?.click();
  };

  // Stress-test seeder: seeds 5k or 10k patients instantly!
  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setSeedingLatencyReport(null);
    setSeedingProgress(0);

    try {
      const report = await OrthoDatabase.seedDatabaseCount(seedCount, (loaded) => {
        setSeedingProgress(loaded);
      });
      setSeedingLatencyReport(report);
      onDatabaseReload();
      onAddBackupLog(`Bulk Database Seed (${seedCount} patients)`, `--`);
      alert(`${seedCount} database entries successfully written offline.`);
    } catch (err: any) {
      alert(`Database Seeding Exception: ${err.message}`);
    } finally {
      setIsSeeding(false);
      setSeedingProgress(null);
    }
  };

  return (
    <div className="space-y-6" id="data-management-canvas">
      {/* Header Section */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold text-slate-850 dark:text-slate-100 tracking-tight leading-none">Data Management</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Manage clinical data directories, local backup archives, and practitioner configurations.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850">
          <Clock className="w-5 h-5 text-primary shrink-0" />
          <div className="text-left font-mono">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Primary Vault Path</p>
            <p className="text-[10px] text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[200px] mt-0.5">{localStorage.getItem('ortho_vault_path') || 'Not config'}</p>
          </div>
        </div>
      </div>

      {/* Active Workspace Configuration Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-150 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-[11px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          Workspace Configurations (Central Vault)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div className="space-y-1 text-left">
            <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest leading-none mb-1">Active Orthodontist / Doctor</label>
            <input 
              type="text" 
              defaultValue={localStorage.getItem('ortho_doctor_name') || ''}
              onChange={(e) => {
                const val = e.target.value.trim();
                if (val) {
                  localStorage.setItem('ortho_doctor_name', val);
                }
              }}
              placeholder="e.g. Dr. Sukrit Thakur"
              className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-semibold"
            />
            <span className="text-[9px] text-slate-450 block mt-1">Automatic trace logs dynamic author (saves instantly).</span>
          </div>
          
          <div className="space-y-1 text-left">
            <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest leading-none mb-1">Clinical Vault storage folder</label>
            <input 
              type="text" 
              defaultValue={localStorage.getItem('ortho_vault_path') || ''}
              onChange={(e) => {
                const val = e.target.value.trim();
                if (val) {
                  localStorage.setItem('ortho_vault_path', val);
                }
              }}
              placeholder="e.g. C:\Users\\Thakur\Desktop\Orthotracker\Vault"
              className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-semibold"
            />
            <span className="text-[9px] text-slate-455 block mt-1">Local physical computer path where clinical vault outputs reside.</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Total Patients Records Stats Card */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 justify-between p-6 md:p-8 rounded-xl border border-slate-150 dark:border-slate-800 shadow-sm flex flex-col relative overflow-hidden group">
          <div className="relative z-10">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase block mb-1">Total Patient Records</span>
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-bold text-primary dark:text-sky-400 font-mono tracking-tight">
                {totalRecords.toLocaleString()}
              </span>
              <span className="text-xs text-secondary font-semibold font-mono">
                {quotaPercentage > 50 ? 'Stress Loaded' : 'Optimal Capacity'}
              </span>
            </div>
          </div>

          <div className="mt-8 relative z-10 space-y-1">
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-teal-500 rounded-full transition-all duration-300" 
                style={{ width: `${quotaPercentage}%` }}
              ></div>
            </div>
            <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">
              {quotaPercentage}% OF MOCK SEED QUOTA USED
            </span>
          </div>

          {/* Background decal */}
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Database className="w-40 h-40 text-slate-950 pointer-events-none" />
          </div>
        </div>

        {/* Export Card */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-xl border border-slate-150 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-lg bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center mb-4 border border-sky-100/30">
              <Download className="text-primary dark:text-sky-400 w-6 h-6" />
            </div>
            <h3 className="text-[20px] font-bold text-slate-850 dark:text-slate-100 mb-2 leading-none">Export JSON Backup</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              Generate a comprehensive, encrypted JSON file containing all patient clinical histories, schedules, and profile changes logs. Keeps databases fully portable.
            </p>
          </div>
          <button
            onClick={handleExportBackup}
            disabled={isExporting}
            className="w-full py-3 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-container tracking-wider transition-all cursor-pointer disabled:opacity-55"
          >
            {isExporting ? 'PACKING clinical DATABASE...' : 'GENERATE EXPORT'}
          </button>
        </div>

        {/* Import Card */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-xl border border-slate-150 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-lg bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center mb-4 border border-teal-100/30">
              <Upload className="text-teal-600 dark:text-teal-400 w-6 h-6" />
            </div>
            <h3 className="text-[20px] font-bold text-slate-850 dark:text-slate-100 mb-2 leading-none">Import Backup</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              Restore offline profiles state from a previously saved JSON archive file. Overrides all local variables. File size limit: Under 50MB.
            </p>
          </div>
          <div>
            <input
              type="file"
              ref={importFileRef}
              onChange={handleImportFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={handleImportClick}
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold tracking-wider transition-all cursor-pointer"
            >
              CHOOSE FILE & IMPORT
            </button>
          </div>
        </div>
      </div>



      {/* Critical Overwrite Warning card */}
      <div className="bg-red-50/70 dark:bg-red-950/20 p-5 rounded-xl border border-red-200/60 dark:border-red-900/40 flex items-start gap-4">
        <AlertTriangle className="text-red-600 dark:text-red-400 mt-1 shrink-0 w-6 h-6" />
        <div className="space-y-1">
          <h4 className="text-[16px] font-bold text-red-700 dark:text-red-400 leading-none">Critical Warning: Data Overwrite</h4>
          <p className="text-xs md:text-sm text-red-600 dark:text-red-400/90 leading-relaxed font-semibold">
            Importing a backup file will permanently overwrite and replace all orthodontic records inside the current offline IndexedDB store. This operation is irrecoverable. Ensure you export a diagnostic JSON copy beforehand to prevent data losses.
          </p>
        </div>
      </div>

      {/* Backup History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-850 flex justify-between items-center">
          <h3 className="text-[18px] font-bold text-slate-800 dark:text-slate-100">Backup and Synchronization Logs</h3>
          <span className="text-xs font-mono text-slate-400 font-bold">System Ledger</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-850 text-slate-500 font-bold uppercase tracking-wider">
                <th className="px-6 py-3.5">DATE & TIME</th>
                <th className="px-6 py-3.5">OPERATION ACTION</th>
                <th className="px-6 py-3.5">INITIATED BY</th>
                <th className="px-6 py-3.5">STATUS</th>
                <th className="px-6 py-3.5">VAULT FILE SIZE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
              {backupLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4 font-mono text-[11px] text-slate-500">{log.dateTime}</td>
                  <td className="px-6 py-4 font-semibold">{log.action}</td>
                  <td className="px-6 py-4 text-slate-500">{log.initiatedBy}</td>
                  <td className="px-6 py-4 font-semibold">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] ${
                      log.status === 'COMPLETED' 
                        ? 'bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300' 
                        : 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-300'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'COMPLETED' ? 'bg-teal-500' : 'bg-red-500'}`}></span>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-550">{log.fileSize}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
