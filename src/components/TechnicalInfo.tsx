import React from 'react';
import { Terminal, Shield, Mail } from 'lucide-react';
import { IMAGES } from '../db';

interface TechnicalInfoProps {
  onContactDeveloper: () => void;
  onNavigateToDataManagement: () => void;
}

export default function TechnicalInfo({
  onContactDeveloper,
  onNavigateToDataManagement
}: TechnicalInfoProps) {
  return (
    <div className="space-y-6" id="technical-info-canvas">
      {/* Screen Title */}
      <div className="mb-6 text-center md:text-left">
        <h2 className="text-[32px] font-bold text-slate-800 dark:text-slate-100 tracking-tight">Technical Information</h2>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">System specifications and developer credentials.</p>
      </div>

      {/* Content Grid: Asymmetric Layout matching layout design */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Software Build Module */}
        <section className="md:col-span-7 bg-white dark:bg-slate-900 rounded-xl p-6 md:p-8 border border-slate-150 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-2 border-b border-slate-100 dark:border-slate-850">
            <Terminal className="text-primary dark:text-sky-400 w-7 h-7" />
            <h3 className="text-[20px] font-bold text-slate-800 dark:text-slate-100">Software Build</h3>
          </div>

          <div className="space-y-4 text-sm font-medium">
            <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Version</span>
              <span className="text-xs font-mono bg-sky-50 dark:bg-sky-950 px-3 py-1 rounded-full text-primary dark:text-sky-400 font-semibold border border-sky-100/40">v3.0.0</span>
            </div>

            <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Build Date</span>
              <span className="text-slate-700 dark:text-slate-300 font-semibold font-mono">October 24, 2023</span>
            </div>

            <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Indexing Engine</span>
              <span className="text-slate-700 dark:text-slate-300 px-3.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400">IndexedDB Client Cache</span>
            </div>

            <div className="flex justify-between items-center py-2.5">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Status</span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-slate-700 dark:text-slate-200 font-semibold">Stable Production</span>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border-l-4 border-primary">
            <p className="text-[12px] text-slate-500 dark:text-slate-400 italic leading-relaxed">
              All clinical data modules are encrypted and HIPAA compliant. Automated integrity checks passed at 04:00 AM UTC.
            </p>
          </div>

          <div className="mt-6">
            <button
              onClick={onNavigateToDataManagement}
              className="text-xs font-bold text-primary hover:text-primary-container dark:text-sky-400 underline uppercase tracking-wider block"
            >
              Open Central Clinical Vault / Data Management →
            </button>
          </div>
        </section>

        {/* Developer Info Module */}
        <section className="md:col-span-5 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-150 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
            
            {/* Developer Avatar */}
            <div className="relative w-32 h-32 mb-4 shrink-0 rounded-full overflow-hidden border-4 border-white dark:border-slate-950 shadow-md">
              <img
                src={IMAGES.drSukrit}
                alt="Dr. Sukrit Thakur"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <h3 className="text-[20px] font-bold text-slate-900 dark:text-slate-100 leading-none mt-1">Dr. Sukrit Thakur</h3>
            <p className="text-[10px] font-bold text-primary tracking-widest mt-1 mb-4 uppercase">LEAD ARCHITECT</p>
            
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Expert clinical systems architect prioritizing secure, offline-first medical and orthodontic databases.
            </p>

            <div className="w-full space-y-3 mt-4 pt-4 border-t border-slate-150 dark:border-slate-800 text-left text-xs">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Lead Developer Support Path</p>
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-mono bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-150 dark:border-slate-900">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a href="mailto:tirkuss@gmail.com" className="hover:underline hover:text-primary">tirkuss@gmail.com</a>
              </div>
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-mono bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-150 dark:border-slate-900">
                <span className="text-primary font-extrabold px-1.5 py-0.5 bg-sky-50 dark:bg-sky-950 text-[9px] rounded-md border border-sky-100 dark:border-sky-900 shrink-0">MOB</span>
                <span className="font-semibold">+91 7036018109</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer system status */}
      <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 opacity-60 border-t border-slate-200/50 dark:border-slate-800 pt-4 text-xs">
        <div className="flex items-center gap-1 font-mono text-slate-500">
          <Shield className="w-4 h-4 text-emerald-600 fill-emerald-100" />
          <span>Encrypted System Session (AES-GCM Offline)</span>
        </div>
        <div className="text-slate-500 text-center md:text-right">
          © 2026 OrthoDigital Systems. Confidential Clinical Workspace.
        </div>
      </div>
    </div>
  );
}
