import React, { useState, useRef } from 'react';
import { ArrowLeft, User, MessageSquare, Calendar, Image as ImageIcon, Camera, Check, AlertCircle } from 'lucide-react';
import { Patient } from '../types';
import { compressImageFile } from '../utils';

interface AddPatientFormProps {
  onBack: () => void;
  onSubmit: (patientData: Omit<Patient, 'id' | 'progressLogs' | 'changeLogs'>) => void;
  patients?: Patient[];
  doctorName?: string;
  doctorTitle?: string;
}

export default function AddPatientForm({
  onBack,
  onSubmit,
  patients = [],
  doctorName = localStorage.getItem('ortho_doctor_name') || 'Dr. Sukrit Thakur',
  doctorTitle = 'Chief Orthodontist'
}: AddPatientFormProps) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Select Gender');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [clinic, setClinic] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [startDate, setStartDate] = useState('');
  
  // Dynamic Photo state allowing unlimited slots
  const [photos, setPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [validationError, setValidationError] = useState<string | null>(null);

  // Extract past values for autocomplete matching
  const pastAddresses = Array.from(new Set(patients.map(p => p.address).filter(Boolean))) as string[];
  const pastClinics = Array.from(new Set(patients.map(p => p.clinic).filter(Boolean))) as string[];

  const handleAddPhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileList = Array.from(files) as File[];
      try {
        const compressedResults = await Promise.all(
          fileList.map((file) => compressImageFile(file, 800, 800, 0.75))
        );
        const validCompressed = compressedResults.filter(Boolean);
        setPhotos(prev => [...prev, ...validCompressed]);
      } catch (err) {
        console.error('Failed to compress loaded patient image:', err);
        // Fallback to reading raw images if compression somehow errors out
        fileList.forEach(file => {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setPhotos(prev => [...prev, event.target.result as string]);
            }
          };
          reader.readAsDataURL(file);
        });
      }
    }
    if (e.target) e.target.value = '';
  };

  const handleRemovePhoto = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotos(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setValidationError('Full Name is required.');
      return;
    }
    if (!age || isNaN(Number(age)) || Number(age) <= 0) {
      setValidationError('Please enter a valid patient age.');
      return;
    }
    if (gender === 'Select Gender') {
      setValidationError('Please select patient gender.');
      return;
    }

    setValidationError(null);

    // Collect valid photos
    const validPhotos = photos.filter((p): p is string => p !== null);

    const formattedData = {
      name,
      age: Number(age),
      gender,
      email: email || '',
      phone: phone || '',
      address,
      clinic,
      registrationDate: new Date().toISOString().split('T')[0],
      dateOfBirth: '',
      chiefComplaint: chiefComplaint || 'Standard patient alignment tracking review.',
      treatmentPlan,
      treatmentStatus: 'active' as const,
      startDate: startDate || new Date().toISOString().split('T')[0],
      photos: validPhotos
    };

    onSubmit(formattedData);
  };

  return (
    <div className="space-y-6">
      {/* Embedded Doctor Header for add context */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 duration-150 rounded-xl px-4 py-3 border border-slate-100 dark:border-slate-800 shadow-xs">
        <button
          onClick={onBack}
          type="button"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-right">
          <p className="text-xs text-slate-400 font-semibold uppercase">Reviewing Orthodontist</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{doctorName}</p>
        </div>
      </div>

      {validationError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Format Validation Warning</p>
            <p>{validationError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Section 1: Personal Information */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-150/60 dark:border-slate-800 p-6 md:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-6">
            <User className="text-primary w-6 h-6 shrink-0" />
            <h2 className="text-[20px] font-semibold text-slate-900 dark:text-slate-100">Personal Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-6 space-y-1.5">
              <label className="text-[12px] font-semibold tracking-wider text-slate-400 uppercase">Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white outline-none transition-all text-[15px]"
                type="text"
                required
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[12px] font-semibold tracking-wider text-slate-400 uppercase">Age</label>
              <input
                value={age}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^[0-9]*$/.test(val)) setAge(val);
                }}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white outline-none transition-all text-[15px]"
                type="text"
                required
              />
            </div>

            <div className="md:col-span-4 space-y-1.5">
              <label className="text-[12px] font-semibold tracking-wider text-slate-400 uppercase">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white outline-none transition-all text-[15px] cursor-pointer"
              >
                <option value="Select Gender">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="md:col-span-6 space-y-1.5">
              <label className="text-[12px] font-semibold tracking-wider text-slate-400 uppercase">Email Address</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white outline-none transition-all text-[15px]"
                type="email"
              />
            </div>

            <div className="md:col-span-6 space-y-1.5">
              <label className="text-[12px] font-semibold tracking-wider text-slate-400 uppercase">Phone Number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white outline-none transition-all text-[15px]"
                type="tel"
              />
            </div>

            <div className="md:col-span-6 space-y-1.5">
              <label className="text-[12px] font-semibold tracking-wider text-slate-400 uppercase">Clinic</label>
              <input
                value={clinic}
                onChange={(e) => setClinic(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white outline-none transition-all text-[15px]"
                type="text"
                list="past-clinics"
                placeholder="Enter or select clinic"
              />
              <datalist id="past-clinics">
                {pastClinics.map((cl, i) => (
                  <option key={i} value={cl} />
                ))}
              </datalist>
            </div>

            <div className="md:col-span-6 space-y-1.5">
              <label className="text-[12px] font-semibold tracking-wider text-slate-400 uppercase">Home Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white outline-none transition-all text-[15px]"
                type="text"
                list="past-addresses"
                placeholder="Enter or select home address"
              />
              <datalist id="past-addresses">
                {pastAddresses.map((addr, i) => (
                  <option key={i} value={addr} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {/* Section 2: Clinical Details */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-150/60 dark:border-slate-800 p-6 md:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="text-secondary w-6 h-6 shrink-0" />
            <h3 className="text-[20px] font-semibold text-slate-900 dark:text-slate-100">Clinical Diagnosis</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold tracking-wider text-slate-400 uppercase">Chief Complaint</label>
              <textarea
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white outline-none transition-all text-[15px] resize-none"
                placeholder="Describe the patient's primary concern or reason for visit..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold tracking-wider text-slate-400 uppercase">Treatment Plan</label>
                <input
                  type="text"
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white outline-none transition-all text-[15px]"
                  placeholder="Enter treatment plan details"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold tracking-wider text-slate-400 uppercase">Start Date</label>
                <div className="relative">
                  <input
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white outline-none transition-all text-[15px] cursor-pointer"
                    type="date"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Records & Clinical Photos */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-150/60 dark:border-slate-800 p-6 md:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Camera className="text-teal-600 w-6 h-6 shrink-0" />
              <h2 className="text-[20px] font-semibold text-slate-900 dark:text-slate-100">Clinical Photos</h2>
            </div>
            <span className="text-[10px] font-semibold tracking-wide text-primary bg-sky-100 dark:bg-sky-950/60 px-3 py-1 rounded-full uppercase">
              {photos.length} Photo{photos.length !== 1 ? 's' : ''} Added
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="photo-slots-grid">
            {/* Render any added photos */}
            {photos.map((photo, index) => (
              <div
                key={index}
                className="aspect-square border border-slate-250 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center p-2 bg-slate-100 dark:bg-slate-950 relative overflow-hidden group"
              >
                <img
                  src={photo}
                  alt={`Clinical view ${index + 1}`}
                  className="w-full h-full object-contain rounded-lg pointer-events-none"
                />
                <button
                  type="button"
                  onClick={(e) => handleRemovePhoto(index, e)}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 transition-all text-xs"
                  title="Delete photograph"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* Always visible add slot */}
            <div
              onClick={handleAddPhotoClick}
              className="aspect-square border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center p-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer transition-all relative overflow-hidden group"
            >
              <div className="text-center space-y-2 p-1">
                <Camera className="w-6 h-6 mx-auto text-slate-400 group-hover:text-primary group-hover:scale-110 transition-all" />
                <span className="block text-[11px] font-semibold text-slate-400 group-hover:text-primary uppercase tracking-wide">+ Add Photo</span>
                <span className="block text-[9px] text-slate-400">Diag. Image</span>
              </div>
            </div>
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            multiple
            className="hidden"
          />

          <p className="mt-3 text-xs text-slate-400 leading-relaxed italic text-center">
            Tip: Click "+ Add Photo" to load unlimited checkup or diagnostic clinical images. Drag and drop is naturally supported by selecting clinical files.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 pt-4 pb-12 md:pb-0">
          <button
            onClick={onBack}
            type="button"
            className="flex-1 h-14 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel and Return
          </button>
          <button
            type="submit"
            className="flex-1 h-14 rounded-xl bg-primary hover:bg-primary-container text-white font-semibold shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Create Patient Profile
          </button>
        </div>
      </form>
    </div>
  );
}
