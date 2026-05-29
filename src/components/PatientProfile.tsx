import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, Edit3, Save, CheckCircle, Radio, Clock, Calendar, MessageSquare, 
  BookOpen, Plus, Camera, Trash2, History, ChevronRight, User, Phone, Mail, Award, X, FileDown
} from 'lucide-react';
import { Patient, ProgressLog, ChangeLog } from '../types';
import { IMAGES } from '../db';
import { jsPDF } from 'jspdf';
import { compressImageFile } from '../utils';

interface PatientProfileProps {
  patient: Patient;
  onBack: () => void;
  onUpdatePatient: (updatedPatient: Patient) => void;
  onShowToast?: (msg: string) => void; // Optional callback for toast notifications
}

export default function PatientProfile({
  patient,
  onBack,
  onUpdatePatient,
  onShowToast
}: PatientProfileProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'changelog'>('timeline');
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields state
  const [editName, setEditName] = useState(patient.name);
  const [editPhone, setEditPhone] = useState(patient.phone);
  const [editEmail, setEditEmail] = useState(patient.email);
  const [editPlan, setEditPlan] = useState(patient.treatmentPlan);
  const [editComplaint, setEditComplaint] = useState(patient.chiefComplaint);
  const [editAge, setEditAge] = useState(String(patient.age));
  const [editStatus, setEditStatus] = useState(patient.treatmentStatus);
  const [editPhotos, setEditPhotos] = useState<string[]>(patient.photos || []);

  // Zoomed photo lightbox state
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);

  // Edit progress log states
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editLogDate, setEditLogDate] = useState('');
  const [editLogNotes, setEditLogNotes] = useState('');
  const [editLogPhotos, setEditLogPhotos] = useState<string[]>([]);

  // Synchronize state when the patient prop switches
  React.useEffect(() => {
    setEditName(patient.name);
    setEditPhone(patient.phone);
    setEditEmail(patient.email);
    setEditPlan(patient.treatmentPlan);
    setEditComplaint(patient.chiefComplaint);
    setEditAge(String(patient.age));
    setEditStatus(patient.treatmentStatus);
    setEditPhotos(patient.photos || []);
    setEditingLogId(null);
  }, [patient]);

  // Add Progress Log state
  const [showAddLog, setShowAddLog] = useState(false);
  const [logNotes, setLogNotes] = useState('');
  const [logPhotos, setLogPhotos] = useState<string[]>([]);
  const newLogPhotoInputRef = useRef<HTMLInputElement>(null);

  // Internal toast function (FIXED: no alert())
  const showToast = (msg: string) => {
    if (onShowToast) {
      onShowToast(msg);
    } else {
      console.log('[Toast]', msg);
    }
  };

  // Process and save changes with automatic generation of ChangeLog items
  const handleSaveChanges = () => {
    const changes: ChangeLog[] = [];
    const nowStr = new Date().toISOString();
    const updater = localStorage.getItem('ortho_doctor_name') || 'Dr. Sukrit Thakur'; // Dynamic clinic architect

    const compareAndLog = (field: string, oldVal: string, newVal: string) => {
      if (oldVal !== newVal) {
        changes.push({
          id: `C-AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: nowStr,
          author: updater,
          field,
          oldValue: oldVal || 'N/A',
          newValue: newVal,
          description: `Updated ${field} from "${oldVal || 'None'}" to "${newVal}"`
        });
      }
    };

    compareAndLog('Full Name', patient.name, editName);
    compareAndLog('Phone Number', patient.phone, editPhone);
    compareAndLog('Email Address', patient.email, editEmail);
    compareAndLog('Age', String(patient.age), editAge);
    compareAndLog('Treatment Plan', patient.treatmentPlan, editPlan);
    compareAndLog('Chief Complaint', patient.chiefComplaint, editComplaint);
    compareAndLog('Treatment Status', patient.treatmentStatus, editStatus);

    const oldPhotosStr = JSON.stringify(patient.photos || []);
    const newPhotosStr = JSON.stringify(editPhotos);
    const photosChanged = oldPhotosStr !== newPhotosStr;

    if (photosChanged) {
      changes.push({
        id: `C-AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: nowStr,
        author: updater,
        field: 'Diagnostic Photos',
        oldValue: `${(patient.photos || []).length} items`,
        newValue: `${editPhotos.length} items`,
        description: `Modified the patient's primary diagnostics photo list (${editPhotos.length} files attached).`
      });
    }

    if (changes.length > 0 || photosChanged) {
      const updatedLogs = [...patient.progressLogs];
      if (updatedLogs.length > 0) {
        const idx = updatedLogs.length - 1; // oldest checkup/first visit log
        updatedLogs[idx] = {
          ...updatedLogs[idx],
          photos: editPhotos
        };
      }

      const updatedPatient: Patient = {
        ...patient,
        name: editName,
        phone: editPhone,
        email: editEmail,
        age: Number(editAge) || patient.age,
        treatmentPlan: editPlan,
        chiefComplaint: editComplaint,
        treatmentStatus: editStatus as any,
        photos: editPhotos,
        progressLogs: updatedLogs,
        changeLogs: [...changes, ...patient.changeLogs]
      };
      onUpdatePatient(updatedPatient);
      showToast('Patient profile changes saved successfully.');
    }

    setIsEditing(false);
  };

  // Export profile content as PDF file using jsPDF
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      let y = 20;

      // Helper function to check page space and add a page if needed
      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > 275) {
          doc.addPage();
          y = 20;
          return true;
        }
        return false;
      };

      // Header block
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('ORTHODONTIC CLINICAL PROFILE', 14, y);
      y += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} | OrthoTracker Companion`, 14, y);
      y += 4;

      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(14, y, 196, y);
      y += 10;

      // Section 1: Demographics info
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('1. DEMOGRAPHIC & CONTACT INFORMATION', 14, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85); // slate-700

      const leftMargin = 14;
      const colWidth = 90;

      doc.text(`Patient ID: ${patient.id}`, leftMargin, y);
      doc.text(`Full Name: ${patient.name}`, leftMargin + colWidth, y);
      y += 6;

      doc.text(`Age / Gender: ${patient.age} Yrs / ${patient.gender}`, leftMargin, y);
      doc.text(`Registration Date: ${patient.registrationDate}`, leftMargin + colWidth, y);
      y += 6;

      doc.text(`Phone: ${patient.phone || 'Not Provided'}`, leftMargin, y);
      doc.text(`Email: ${patient.email || 'Not Provided'}`, leftMargin + colWidth, y);
      y += 6;

      doc.text(`Case Status: ${patient.treatmentStatus.toUpperCase()}`, leftMargin, y);
      y += 10;

      // Section 2: Chief Complaint & Treatment Plan
      checkPageBreak(50);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('2. CLINICAL ASSESSMENT & PROPOSED PLAN', 14, y);
      y += 6;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('CHIEF COMPLAINT:', 14, y);
      y += 5;

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      
      const chiefComplaintWrapped = doc.splitTextToSize(patient.chiefComplaint || 'None recorded', 180);
      doc.text(chiefComplaintWrapped, 14, y);
      y += (chiefComplaintWrapped.length * 5) + 4;

      checkPageBreak(40);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('PROPOSED TREATMENT PLAN:', 14, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);

      const planWrapped = doc.splitTextToSize(patient.treatmentPlan || 'None recorded', 180);
      doc.text(planWrapped, 14, y);
      y += (planWrapped.length * 5) + 10;

      // Section 3: Diagnostic photos
      checkPageBreak(65);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('3. CLINICAL DIAGNOSTIC PHOTOS', 14, y);
      y += 6;

      if (patient.photos && patient.photos.length > 0) {
        let photoX = 14;
        const photoSize = 40;
        for (let i = 0; i < Math.min(patient.photos.length, 4); i++) {
          const photoUrl = patient.photos[i];
          if (photoUrl && (photoUrl.startsWith('data:image') || photoUrl.startsWith('http') || photoUrl.length > 100)) {
            try {
              doc.addImage(photoUrl, 'JPEG', photoX, y, photoSize, photoSize);
              photoX += photoSize + 6;
            } catch (err) {
              console.error('Error adding photo to PDF:', err);
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(9);
              doc.text('[Diagnostic Photo]', photoX, y + 20);
              photoX += photoSize + 6;
            }
          }
        }
        y += photoSize + 10;
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text('No photos loaded in diagnostic files.', 14, y);
        y += 8;
      }

      // Section 4: Clinical Follow Up Logs
      checkPageBreak(50);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('4. CLINICAL PROGRESS & FOLLOW UP HISTORY', 14, y);
      y += 8;

      if (patient.progressLogs && patient.progressLogs.length > 0) {
        patient.progressLogs.forEach((log, index) => {
          checkPageBreak(45);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(15, 23, 42);
          doc.text(`Follow Up #${patient.progressLogs.length - index}: ${log.date}`, 14, y);
          y += 5;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(51, 65, 85);
          
          const logNotesWrapped = doc.splitTextToSize(log.notes || 'No checkup details recorded.', 180);
          doc.text(logNotesWrapped, 14, y);
          y += (logNotesWrapped.length * 5) + 4;

          // Process log level photos
          if (log.photos && log.photos.length > 0) {
            checkPageBreak(35);
            let logPhotoX = 14;
            const logPhotoSize = 25;
            for (let pIdx = 0; pIdx < Math.min(log.photos.length, 5); pIdx++) {
              try {
                doc.addImage(log.photos[pIdx], 'JPEG', logPhotoX, y, logPhotoSize, logPhotoSize);
                logPhotoX += logPhotoSize + 4;
              } catch (err) {
                console.error(err);
              }
            }
            y += logPhotoSize + 6;
          }

          y += 4; // Margin spacer
        });
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text('No clinical follow up logs recorded.', 14, y);
        y += 8;
      }

      // Footer
      checkPageBreak(25);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text('*** CONFIDENTIAL CLINICAL PATIENT DOSSIER ***', 60, 285);

      // Save PDF
      const docName = `${patient.name.toLowerCase().replace(/\s+/g, '_')}_profile.pdf`;
      doc.save(docName);
    } catch (pdfErr) {
      console.error('PDF construction error: ', pdfErr);
      showToast('A rendering error occurred during PDF assembly. Check diagnostic attachment formatting.');
    }
  };

  // Handle adding progress logs
  const handleAddLogClick = () => {
    newLogPhotoInputRef.current?.click();
  };

  const handleAddLogPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileList = Array.from(files);
      try {
        const compressedResults = await Promise.all(
          fileList.map(file => compressImageFile(file, 800, 800, 0.75))
        );
        const valid = compressedResults.filter(Boolean) as string[];
        setLogPhotos(prev => [...prev, ...valid]);
      } catch (err) {
        console.error('Failed to compress log photos:', err);
        fileList.forEach(file => {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setLogPhotos(prev => [...prev, event.target!.result as string]);
            }
          };
          reader.readAsDataURL(file);
        });
      }
    }
    if (e.target) e.target.value = '';
  };

  const handleRemoveLogPhoto = (picIdx: number) => {
    setLogPhotos(logPhotos.filter((_, idx) => idx !== picIdx));
  };

  const handleSaveProgressLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logNotes.trim()) {
      showToast('Please fill out clinical follow up notes.');
      return;
    }

    const newLog: ProgressLog = {
      id: `L-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      title: 'Follow Up',
      notes: logNotes,
      photos: logPhotos
    };

    // Write audit trace
    const visitChangeLog: ChangeLog = {
      id: `C-AUTO-${Date.now()}`,
      timestamp: new Date().toISOString(),
      author: localStorage.getItem('ortho_doctor_name') || 'Dr. Sukrit Thakur',
      field: 'Follow Up Visit Logged',
      oldValue: 'N/A',
      newValue: 'Follow Up Entered',
      description: `Logged new clinical follow up notes.`
    };

    const updatedPatient: Patient = {
      ...patient,
      progressLogs: [newLog, ...patient.progressLogs],
      changeLogs: [visitChangeLog, ...patient.changeLogs]
    };

    onUpdatePatient(updatedPatient);
    setShowAddLog(false);

    // Reset notes and files
    setLogNotes('');
    setLogPhotos([]);
    showToast('Clinical follow up notes saved successfully.');
  };

  return (
    <div className="space-y-6" id="patient-details-canvas">
      {/* Header and edit triggers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                patient.treatmentStatus === 'active' 
                  ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-400' 
                  : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
              }`}>
                {patient.treatmentStatus === 'active' ? 'ACTIVE CASE' : 'RETENTION / DRAFT'}
              </span>
            </div>
            <h2 className="text-[28px] font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none font-headline">
              {patient.name}
            </h2>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FileDown className="w-4 h-4" />
            EXPORT PROFILE (PDF)
          </button>

          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleSaveChanges}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-xs font-semibold border-2 border-primary text-primary hover:bg-primary/5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 className="w-4 h-4" />
              EDIT PROFILE
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Profile stats and edit cards */}
        <div className="md:col-span-4 space-y-6">
          
          {/* Main Photo Visual Card (not cropped) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/50 dark:border-slate-800 flex flex-col items-center">
            <div 
              className="w-40 h-40 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center border border-slate-200/60 dark:border-slate-800 mb-0 shadow-xs cursor-pointer"
              onClick={() => {
                if (patient.photos?.[0]) {
                  setZoomedPhoto(patient.photos[0]);
                }
              }}
              title={patient.photos?.[0] ? "Click to view zoomed image" : "No photo details to zoom"}
            >
              {patient.photos && patient.photos.length > 0 ? (
                <img
                  src={patient.photos[0]}
                  alt={patient.name}
                  className="w-full h-full object-cover pointer-events-none"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-slate-200 dark:bg-slate-850 flex items-center justify-center text-slate-400 dark:text-slate-600 font-semibold text-xs uppercase text-center p-3">
                  No Photo Loaded
                </div>
              )}
            </div>
          </div>

          {/* Demographics Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200/50 dark:border-slate-800 shadow-xs">
            <h3 className="text-[12px] font-bold tracking-wider text-slate-400 mb-4 uppercase flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              DEMOGRAPHICS / CONTACT info
            </h3>

            {isEditing ? (
              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Full Name</label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                    type="text"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Age</label>
                  <input
                    value={editAge}
                    onChange={(e) => setEditAge(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                    type="number"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Phone Number</label>
                  <input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                    type="text"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Email Address</label>
                  <input
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                    type="email"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Case Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Patient Diagnostic Photos Editor */}
                <div className="space-y-2 pt-3 border-t border-slate-150 dark:border-slate-850">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Diagnostic Photos Control</label>
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {editPhotos.map((photo, pIdx) => (
                      <div key={pIdx} className="relative aspect-square rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-950 border border-slate-300 dark:border-slate-850 group">
                        <img src={photo} alt="diagnostic" className="w-full h-full object-contain bg-slate-100 dark:bg-slate-900" />
                        <button
                          type="button"
                          onClick={() => {
                            setEditPhotos(prev => prev.filter((_, idx) => idx !== pIdx));
                          }}
                          className="absolute top-1 right-1 bg-red-600 hover:bg-red-750 text-white rounded-full w-4.5 h-4.5 text-[9px] flex items-center justify-center cursor-pointer shadow-md"
                          title="Remove photo"
                        >
                          ✕
                        </button>
                        {pIdx === 0 ? (
                          <span className="absolute bottom-1 left-1 bg-amber-500 text-white px-1 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest shadow-xs">
                            ★ Main
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditPhotos(prev => {
                                const next = [...prev];
                                const [selected] = next.splice(pIdx, 1);
                                return [selected, ...next];
                              });
                            }}
                            className="absolute bottom-1 left-1 bg-slate-800/80 hover:bg-slate-900 text-white px-1 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest cursor-pointer"
                            title="Set as Main Display Photo"
                          >
                            Set Main
                          </button>
                        )}
                      </div>
                    ))}
                    <label className="aspect-square rounded-lg border-2 border-dashed border-slate-350 dark:border-slate-800 hover:border-primary dark:hover:border-primary-container flex flex-col items-center justify-center text-slate-400 hover:text-primary cursor-pointer transition-colors">
                      <Plus className="w-5 h-5 mb-0.5" />
                      <span className="text-[7.5px] font-bold uppercase tracking-wider text-center">Add File</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          if (e.target.files) {
                            const fileList = Array.from(e.target.files);
                            try {
                              const compressedResults = await Promise.all(
                                fileList.map(async (file: any) => {
                                  return await compressImageFile(file, 800, 800, 0.75);
                                })
                              );
                              const validCompressed = compressedResults.filter(Boolean);
                              setEditPhotos(prev => [...prev, ...validCompressed]);
                            } catch (err) {
                              console.error('Failed to compress diagnostic photos:', err);
                              fileList.forEach((file: any) => {
                                const reader = new FileReader();
                                reader.onload = (loadEvt) => {
                                  if (loadEvt.target?.result) {
                                    setEditPhotos(prev => [...prev, loadEvt.target!.result as string]);
                                  }
                                };
                                reader.readAsDataURL(file as Blob);
                              });
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Phone Number</p>
                    <p className="text-slate-800 dark:text-slate-300 font-medium">{patient.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Email Address</p>
                    <p className="text-slate-800 dark:text-slate-300 font-medium break-all">{patient.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Registration Date</p>
                    <p className="text-slate-800 dark:text-slate-300 font-medium font-mono">{patient.registrationDate}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Award className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Age</p>
                    <p className="text-slate-800 dark:text-slate-300 font-medium font-mono">{patient.age} years old</p>
                  </div>
                </div>

                {patient.startDate && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Treatment Start Date</p>
                      <p className="text-slate-800 dark:text-slate-300 font-medium font-mono">{patient.startDate}</p>
                    </div>
                  </div>
                )}

                {patient.clinic && (
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Clinic</p>
                      <p className="text-slate-800 dark:text-slate-300 font-medium">{patient.clinic}</p>
                    </div>
                  </div>
                )}

                {patient.address && (
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Address</p>
                      <p className="text-slate-800 dark:text-slate-300 font-medium">{patient.address}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Assessment & Proposed Plans Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200/50 dark:border-slate-800 shadow-xs">
            <h3 className="text-[12px] font-bold tracking-wider text-slate-400 mb-4 uppercase flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-secondary" />
              Orthodontic Treatment Info
            </h3>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Chief Complaint</label>
                  <textarea
                    value={editComplaint}
                    onChange={(e) => setEditComplaint(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Proposed Treatment Plan</label>
                  <textarea
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100"
                    rows={4}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Chief Complaint</p>
                  <p className="text-sm text-slate-800 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-950/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800/60 leading-relaxed">
                    "{patient.chiefComplaint}"
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Proposed Treatment Plan</p>
                  <p className="text-sm text-slate-805 dark:text-slate-300 bg-sky-50/50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/40 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                    {patient.treatmentPlan || 'No treatment plan draft exists.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Timeline tabs, Progress logs, and Change logs list */}
        <div className="md:col-span-8 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800 shadow-xs">
            {/* Tabs Trigger Navigation */}
            <div className="flex border-b border-slate-200/60 dark:border-slate-850 bg-slate-50 dark:bg-slate-900">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex-1 py-3.5 text-xs font-bold tracking-wider uppercase transition-colors text-center border-b-2 flex items-center justify-center gap-1.5 ${
                  activeTab === 'timeline'
                    ? 'border-b-primary text-primary bg-white dark:bg-slate-900'
                    : 'border-b-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Clock className="w-4 h-4" />
                CLINICAL FOLLOW UP TIMELINE
              </button>
              <button
                onClick={() => setActiveTab('changelog')}
                className={`flex-1 py-3.5 text-xs font-bold tracking-wider uppercase transition-colors text-center border-b-2 flex items-center justify-center gap-1.5 ${
                  activeTab === 'changelog'
                    ? 'border-b-primary text-primary bg-white dark:bg-slate-900'
                    : 'border-b-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <History className="w-4 h-4" />
                Profile Audit Change History ({patient.changeLogs.length})
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'timeline' && (
                <div className="space-y-6">
                  {/* Toggle Log Editor */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-500 tracking-wider uppercase flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Follow Up Log
                    </h3>
                    <button
                      onClick={() => setShowAddLog(!showAddLog)}
                      className="px-3 py-1.5 bg-primary hover:bg-primary-container text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Log New
                    </button>
                  </div>

                  {/* Add Progress Log form inline */}
                  {showAddLog && (
                    <form onSubmit={handleSaveProgressLog} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-4">
                      <h4 className="text-xs font-bold tracking-wide uppercase text-slate-700 dark:text-slate-300">Enter Clinical Follow Up Details</h4>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase">Clinical Follow Up Photos</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleAddLogClick}
                            className="px-3 h-9 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Camera className="w-4 h-4" />
                            Load Photo
                          </button>
                          <span className="text-[10px] text-slate-500 font-medium">({logPhotos.length} loaded)</span>
                        </div>
                        <input
                          type="file"
                          ref={newLogPhotoInputRef}
                          onChange={handleAddLogPhotoChange}
                          accept="image/*"
                          multiple
                          className="hidden"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase">Follow Up Details</label>
                        <textarea
                          value={logNotes}
                          onChange={(e) => setLogNotes(e.target.value)}
                          className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                          placeholder="Check structural alignment, diagnostic changes, tray fitting tracking issues..."
                          rows={3}
                          required
                        />
                      </div>

                      {/* Diagnostic loaded list */}
                      {logPhotos.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                          {logPhotos.map((pUrl, idx) => (
                            <div key={idx} className="aspect-square bg-slate-200 dark:bg-slate-950 border border-slate-300 rounded-lg overflow-hidden relative">
                              <img src={pUrl} alt="visit diagnostic" className="w-full h-full object-contain pointer-events-none" />
                              <button
                                type="button"
                                onClick={() => handleRemoveLogPhoto(idx)}
                                className="absolute top-1 right-1 p-1 bg-red-600 rounded-full text-white text-[9px]"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setShowAddLog(false)}
                          className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                        >
                          Submit Follow Up
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Clinical logs list render */}
                  <div className="space-y-8 relative before:absolute before:left-3 before:top-4 before:bottom-4 before:w-px before:bg-slate-200/80 dark:before:bg-slate-800">
                    {patient.progressLogs.length === 0 ? (
                      <div className="pl-8 text-center text-slate-400 py-6 text-xs italic">
                        No checkup visit logs written for this profile yet. Click "Log New Follow Up" above to add notes.
                      </div>
                    ) : (
                      patient.progressLogs.map((log) => {
                        // Helper to compute months between starting and checkup date
                        const getMonthsDiffStr = (startStr: string, currentStr: string) => {
                          if (!startStr || !currentStr) return '';
                          const start = new Date(startStr);
                          const curr = new Date(currentStr);
                          if (isNaN(start.getTime()) || isNaN(curr.getTime())) return '';
                          
                          const diffMonths = (curr.getFullYear() - start.getFullYear()) * 12 + (curr.getMonth() - start.getMonth());
                          if (diffMonths <= 0) {
                            const diffTime = curr.getTime() - start.getTime();
                            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                            if (diffDays <= 0) return 'Start date';
                            return `${diffDays} days after start`;
                          }
                          return `${diffMonths} month${diffMonths > 1 ? 's' : ''} after start`;
                        };

                        const durationStr = patient.startDate ? getMonthsDiffStr(patient.startDate, log.date) : '';
                        const isCurrentlyEditingThisLog = editingLogId === log.id;

                        return (
                          <div key={log.id} className="relative pl-10" id={`timeline-log-${log.id}`}>
                            {/* Anchor Circle Indicator */}
                            <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary/20 flex flex-col items-center justify-center border-2 border-primary">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                            </div>

                            <div className="flex flex-col gap-2">
                              {/* Header & Controls */}
                              <div className="flex items-center justify-between flex-wrap gap-2 text-left">
                                <div>
                                  <h4 className="text-[15px] font-bold text-slate-850 dark:text-slate-100 uppercase tracking-tight">
                                    {log.date}
                                  </h4>
                                  {durationStr && (
                                    <span className="text-[10px] font-bold text-primary dark:text-sky-305 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-md mt-0.5 inline-block border border-sky-100 dark:border-sky-900/40">
                                      {durationStr}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {!isCurrentlyEditingThisLog && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingLogId(log.id);
                                        setEditLogDate(log.date || '');
                                        setEditLogNotes(log.notes || '');
                                        setEditLogPhotos(log.photos || []);
                                      }}
                                      className="text-[9px] font-bold text-primary hover:text-primary-container dark:text-sky-400 px-2 py-1 uppercase rounded-md hover:bg-primary/5 cursor-pointer"
                                    >
                                      Edit Log
                                    </button>
                                  )}
                                </div>
                              </div>

                              {isCurrentlyEditingThisLog ? (
                                <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4 rounded-xl space-y-4 shadow-md text-left mt-1">
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Follow Up Date</label>
                                    <input
                                      type="date"
                                      value={editLogDate}
                                      onChange={(e) => setEditLogDate(e.target.value)}
                                      className="w-full text-xs h-9 px-2 rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Clinical Notes</label>
                                    <textarea
                                      value={editLogNotes}
                                      onChange={(e) => setEditLogNotes(e.target.value)}
                                      className="w-full text-xs p-3 rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
                                      rows={4}
                                    />
                                  </div>

                                  {/* Edit Follow Up photos */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Checkup Photos</label>
                                    <div className="grid grid-cols-4 gap-2">
                                      {editLogPhotos.map((photo, pIdx) => (
                                        <div key={pIdx} className="relative aspect-square rounded-lg overflow-hidden bg-slate-150 border border-slate-200 dark:border-slate-800">
                                          <img src={photo} alt="diagnostic" className="w-full h-full object-cover" />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditLogPhotos(prev => prev.filter((_, idx) => idx !== pIdx));
                                            }}
                                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-750 text-white rounded-full w-4.5 h-4.5 text-[9px] flex items-center justify-center cursor-pointer"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ))}
                                      <label className="aspect-square rounded-lg border-2 border-dashed border-slate-350 hover:border-primary flex flex-col items-center justify-center text-slate-400 hover:text-primary cursor-pointer transition-colors">
                                        <Plus className="w-5 h-5 mb-0.5" />
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-center px-1">Add File</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          multiple
                                          className="hidden"
                                          onChange={async (e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                              const fileList = Array.from(e.target.files);
                                              try {
                                                const compressedResults = await Promise.all(
                                                  fileList.map(file => compressImageFile(file, 800, 800, 0.75))
                                                );
                                                const valid = compressedResults.filter(Boolean) as string[];
                                                setEditLogPhotos(prev => [...prev, ...valid]);
                                              } catch (err) {
                                                console.error('Failed to compress inline edit log photos:', err);
                                                fileList.forEach(file => {
                                                  const reader = new FileReader();
                                                  reader.onload = (loadEvt) => {
                                                    if (loadEvt.target?.result) {
                                                      setEditLogPhotos(prev => [...prev, loadEvt.target!.result as string]);
                                                    }
                                                  };
                                                  reader.readAsDataURL(file);
                                                });
                                              }
                                            }
                                          }}
                                        />
                                      </label>
                                    </div>
                                  </div>

                                  <div className="flex gap-2 justify-end text-xs">
                                    <button
                                      type="button"
                                      onClick={() => setEditingLogId(null)}
                                      className="px-3 py-1.5 border border-slate-300 text-slate-600 dark:text-slate-305 rounded-lg hover:bg-slate-150 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updatedLogs = patient.progressLogs.map(g => {
                                          if (g.id === log.id) {
                                            return {
                                              ...g,
                                              date: editLogDate,
                                              notes: editLogNotes,
                                              photos: editLogPhotos
                                            };
                                          }
                                          return g;
                                        });

                                        const audit: ChangeLog = {
                                          id: `C-AUTO-${Date.now()}`,
                                          timestamp: new Date().toISOString(),
                                          author: localStorage.getItem('ortho_doctor_name') || 'Dr. Sukrit Thakur',
                                          field: `Edited Followup on ${log.date}`,
                                          oldValue: 'Previous notes',
                                          newValue: 'Updated notes',
                                          description: `Saved manual edits to followup log date ${editLogDate}.`
                                        };

                                        const updatedPatient: Patient = {
                                          ...patient,
                                          photos: (log.id === (patient.progressLogs.length > 0 ? patient.progressLogs[patient.progressLogs.length - 1].id : null)) ? editLogPhotos : patient.photos,
                                          progressLogs: updatedLogs,
                                          changeLogs: [audit, ...patient.changeLogs]
                                        };

                                        onUpdatePatient(updatedPatient);
                                        setEditingLogId(null);
                                        showToast('Progress follow up log successfully updated.');
                                      }}
                                      className="px-3.5 py-1.5 bg-primary hover:bg-primary-container text-white font-bold rounded-lg cursor-pointer"
                                    >
                                      Save Edits
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200/50 dark:border-slate-850 border-l-4 border-l-primary shadow-xs">
                                    <p className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-left">
                                      {log.notes}
                                    </p>
                                  </div>

                                  {/* visit photo gallery */}
                                  {log.photos && log.photos.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                      {log.photos.map((photoUrl, photoIdx) => (
                                        <div
                                          key={photoIdx}
                                          className="aspect-square bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg overflow-hidden group cursor-zoom-in flex items-center justify-center"
                                          onClick={() => setZoomedPhoto(photoUrl)}
                                          title="Click to zoom clinical checkup image"
                                        >
                                          <img
                                            src={photoUrl}
                                            alt="Clinical visit view"
                                            className="w-full h-full object-contain pointer-events-none rounded-md"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'changelog' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-500 tracking-wider uppercase flex items-center gap-2">
                      <History className="text-teal-600 w-4 h-4 shrink-0" />
                      Auditable Profile Change Logs
                    </h3>
                  </div>

                  <p className="text-xs text-slate-400 italic leading-relaxed">
                     Operational changes to demographic details, orthodontic plans, complaints, or visit archives are automatically captured below for reference.
                  </p>

                  <div className="overflow-x-auto rounded-xl border border-slate-150 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-150 dark:border-slate-850">
                          <th className="p-3 font-semibold text-slate-500 uppercase tracking-wider">Date & Time</th>
                          <th className="p-3 font-semibold text-slate-500 uppercase tracking-wider">Field Changed</th>
                          <th className="p-3 font-semibold text-slate-500 uppercase tracking-wider">Old Value</th>
                          <th className="p-3 font-semibold text-slate-500 uppercase tracking-wider">New Value</th>
                          <th className="p-3 font-semibold text-slate-500 uppercase tracking-wider">Updated By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 dark:divide-slate-850 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-300">
                        {patient.changeLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-5 text-center text-slate-400 italic">
                              No audited changes recorded for this patient profile.
                            </td>
                          </tr>
                        ) : (
                          patient.changeLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40">
                              <td className="p-3 font-mono text-[11px] text-slate-500">
                                {new Date(log.timestamp).toLocaleString()}
                              </td>
                              <td className="p-3 font-semibold text-slate-700 dark:text-slate-200">
                                {log.field}
                              </td>
                              <td className="p-3 max-w-[150px] truncate text-slate-400" title={log.oldValue}>
                                {log.oldValue}
                              </td>
                              <td className="p-3 max-w-[150px] truncate font-medium text-emerald-600 dark:text-emerald-400" title={log.newValue}>
                                {log.newValue}
                              </td>
                              <td className="p-3 font-semibold text-primary">
                                {log.author}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* High-Resolution Zoomed Photo Lightbox Modal Overlay */}
      {zoomedPhoto && (
        <div className="fixed inset-0 bg-slate-950/85 z-[9999] flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col items-center">
            
            {/* Top Bar controls */}
            <div className="w-full h-12 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <span className="text-[10px] text-slate-400 font-mono font-bold tracking-wider uppercase">Clinical High-Resolution Diagnostics Image</span>
              <button 
                onClick={() => setZoomedPhoto(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 dark:hover:text-white transition-colors flex items-center justify-center cursor-pointer font-bold"
                title="Close Zoom"
              >
                ✕
              </button>
            </div>

            {/* Main Picture Context */}
            <div className="p-6 bg-slate-950/30 flex items-center justify-center max-h-[80vh] overflow-auto w-full">
              <img 
                src={zoomedPhoto} 
                alt="zoomed diagnostic" 
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg pointer-events-none"
              />
            </div>

            {/* Bottom context caption */}
            <div className="w-full h-10 px-4 flex items-center justify-center bg-slate-950/60 border-t border-slate-850">
              <span className="text-[10px] text-slate-500 font-medium">Use the "✕" button in the top-right corner or click close to return back.</span>
            </div>
          </div>
          {/* Backdrop Clicker to Close */}
          <div className="absolute inset-0 -z-10 cursor-zoom-out" onClick={() => setZoomedPhoto(null)} />
        </div>
      )}
    </div>
  );
}
