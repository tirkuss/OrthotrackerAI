import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, Check } from 'lucide-react';
import { Appointment, Patient } from '../types';

interface ScheduleViewProps {
  appointments: Appointment[];
  patients: Patient[];
  onAddNewAppointment: (appt: Omit<Appointment, 'id'>) => void;
  onSelectPatientById: (patientId: string) => void;
}

export default function ScheduleView({
  appointments,
  patients,
  onAddNewAppointment,
  onSelectPatientById
}: ScheduleViewProps) {
  // Initialize with current date
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  // Month currently viewed in the calendar
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  
  const [showAddAppt, setShowAddAppt] = useState(false);

  // Form states
  const [patientSearch, setPatientSearch] = useState('');
  const [selectPatientId, setSelectPatientId] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [timeStart, setTimeStart] = useState('08:15');
  const [duration, setDuration] = useState('30 mins');

  // Helper to format date safely as YYYY-MM-DD
  const formatToYYYYMMDD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const selectedDateStr = formatToYYYYMMDD(selectedDate);
  const todayStr = formatToYYYYMMDD(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-11
  
  // Month names
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // First day of target month
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayIndex = firstDayOfMonth.getDay(); // 0: Sunday, 1: Monday, ...
  
  // Total days in target month
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Total days in previous month
  const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

  const daysArray: { dayNum: number; isCurrentMonth: boolean; dateString: string }[] = [];
  
  // Previous month padding days
  for (let i = startDayIndex - 1; i >= 0; i--) {
    const dNum = totalDaysInPrevMonth - i;
    const prevMonthIdx = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
    daysArray.push({
      dayNum: dNum,
      isCurrentMonth: false,
      dateString: dateStr
    });
  }
  
  // Current month days
  for (let dNum = 1; dNum <= totalDaysInMonth; dNum++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
    daysArray.push({
      dayNum: dNum,
      isCurrentMonth: true,
      dateString: dateStr
    });
  }
  
  // Next month padding days
  const rem = daysArray.length % 7;
  if (rem > 0) {
    const nextDaysNeeded = 7 - rem;
    for (let dNum = 1; dNum <= nextDaysNeeded; dNum++) {
      const nextMonthIdx = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      daysArray.push({
        dayNum: dNum,
        isCurrentMonth: false,
        dateString: dateStr
      });
    }
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDayClick = (dayStr: string) => {
    const [y, m, d] = dayStr.split('-').map(Number);
    setSelectedDate(new Date(y, m - 1, d));
  };

  // Filter appointments for the selected day
  const filteredAppointments = appointments.filter(appt => appt.date === selectedDateStr);

  const matchedSuggestions = patientSearch.trim() === '' 
    ? [] 
    : patients.filter(p => 
        p.name.toLowerCase().includes(patientSearch.toLowerCase()) || 
        p.id.toLowerCase().includes(patientSearch.toLowerCase())
      );

  const handleSearchChange = (val: string) => {
    setPatientSearch(val);
    const exactMatch = patients.find(p => p.name.toLowerCase() === val.toLowerCase());
    if (exactMatch) {
      setSelectPatientId(exactMatch.id);
    } else {
      setSelectPatientId('');
    }
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (p: Patient) => {
    setPatientSearch(p.name);
    setSelectPatientId(p.id);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let chosenPatient = patients.find(p => p.id === selectPatientId);
    if (!chosenPatient && patientSearch.trim() !== '') {
      chosenPatient = patients.find(p => p.name.toLowerCase() === patientSearch.trim().toLowerCase());
    }

    if (!chosenPatient) {
      alert('Please enter a valid patient name or select from the suggestions.');
      return;
    }

    // Helper to format 24h as 12h
    const format12h = (time24: string) => {
      if (!time24) return '';
      const parts = time24.split(':');
      const h = parseInt(parts[0], 10);
      const mStr = parts[1] || '00';
      const suffix = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 === 0 ? 12 : h % 12;
      return `${String(h12).padStart(2, '0')}:${mStr} ${suffix}`;
    };

    onAddNewAppointment({
      patientId: chosenPatient.id,
      patientName: chosenPatient.name,
      patientStatus: 'Clinical Visit',
      timeStart: format12h(timeStart),
      timeEnd: duration,
      date: selectedDateStr,
      location: 'Clinic Room',
      status: 'Confirmed'
    });

    // Reset Form
    setPatientSearch('');
    setSelectPatientId('');
    setShowAddAppt(false);
    alert(`Appointment scheduled for ${chosenPatient.name}.`);
  };

  return (
    <div className="space-y-6" id="schedule-canvas">
      {/* Actual Month Calendar */}
      <section className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[24px] font-bold text-slate-900 dark:text-slate-100 font-headline">Schedule</h1>
          <div className="flex items-center gap-2 text-primary font-semibold">
            <button 
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200">
              {monthNames[month]} {year}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid Header */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-400 text-[11px] uppercase tracking-wider mb-2">
          <span>SUN</span>
          <span>MON</span>
          <span>TUE</span>
          <span>WED</span>
          <span>THU</span>
          <span>FRI</span>
          <span>SAT</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {daysArray.map((day, idx) => {
            const isSelected = day.dateString === selectedDateStr;
            const isToday = day.dateString === todayStr;
            const hasAppts = appointments.some(appt => appt.date === day.dateString);

            return (
              <button
                key={idx}
                onClick={() => handleDayClick(day.dateString)}
                className={`aspect-square sm:aspect-[4/3] relative flex flex-col items-center justify-center rounded-lg border transition-all cursor-pointer text-xs font-semibold ${
                  isSelected
                    ? 'bg-primary border-primary text-white shadow-md ring-2 ring-primary/30 font-bold scale-102'
                    : isToday
                    ? 'bg-sky-50/50 dark:bg-sky-950/20 border-primary text-primary dark:text-sky-300 font-bold'
                    : day.isCurrentMonth
                    ? 'bg-slate-50/40 dark:bg-slate-950/20 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/50 dark:border-slate-850 text-slate-800 dark:text-slate-200'
                    : 'bg-transparent border-transparent text-slate-350 dark:text-slate-650 opacity-40'
                }`}
              >
                <span>{day.dayNum}</span>
                {hasAppts && (
                  <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`} />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Appointment Creation Toggle Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
          Chronological List - {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </h2>
        <button
          onClick={() => setShowAddAppt(!showAddAppt)}
          className="px-3.5 py-1.5 bg-primary hover:bg-primary-container text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-xs transition-colors cursor-pointer animate-none"
        >
          <Plus className="w-4 h-4" />
          Schedule Slot
        </button>
      </div>

      {/* Add Appointment form section with autofill */}
      {showAddAppt && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm relative z-10">
          <h3 className="text-sm font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase">New Appointment Assignment</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 relative">
              <label className="text-[11px] font-semibold text-slate-400 uppercase">Orthodontic Patient</label>
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search patient name..."
                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:bg-white dark:focus:bg-slate-900 outline-none"
                required
              />
              {showSuggestions && matchedSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg z-50 divide-y divide-slate-100 dark:divide-slate-800">
                  {matchedSuggestions.map(p => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectSuggestion(p)}
                      className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex justify-between"
                    >
                      <span className="font-semibold">{p.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase">Time</label>
              <input
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-slate-50 dark:bg-slate-950 text-slate-805 dark:text-slate-200 text-sm focus:bg-white dark:focus:bg-slate-900 outline-none cursor-pointer font-mono font-bold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-slate-50 dark:bg-slate-950 text-slate-805 dark:text-slate-200 text-sm focus:bg-white dark:focus:bg-slate-900 outline-none cursor-pointer font-bold"
                required
              >
                <option value="15 mins">15 mins</option>
                <option value="30 mins">30 mins</option>
                <option value="45 mins">45 mins</option>
                <option value="1 hour">1 hour</option>
                <option value="1.5 hours">1.5 hours</option>
                <option value="2 hours">2 hours</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 justify-end text-xs pt-2">
            <button
              onClick={() => {
                setShowAddAppt(false);
                setShowSuggestions(false);
              }}
              type="button"
              className="px-4 py-2 border border-slate-300 text-slate-600 dark:text-slate-350 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Schedule Appointment Slot
            </button>
          </div>
        </form>
      )}

      {/* Chronological List */}
      <section className="space-y-5">
        <div className="flex items-center gap-4 text-slate-400 font-bold text-[11px] tracking-wider uppercase">
          <span>Sessions</span>
          <div className="h-[1px] flex-grow bg-slate-200 dark:bg-slate-800"></div>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-6 text-slate-500 text-xs italic">
            No scheduled appointments loaded for this date. Click "Schedule Slot" to book one.
          </div>
        ) : (
          filteredAppointments.map((appt) => {
            return (
              <div 
                key={appt.id} 
                onClick={() => {
                  onSelectPatientById(appt.patientId);
                }}
                className="relative group cursor-pointer hover:scale-[1.002] active:scale-100 transition-all text-xs"
              >
                <div className="flex bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-850 hover:shadow-sm transition-all p-4 md:p-5 justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 text-primary dark:text-sky-305 rounded-lg">
                      <Calendar className="w-4 h-4 shrink-0" />
                    </div>
                    <span className="text-[17px] font-semibold text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">
                      {appt.patientName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[14.5px] font-mono font-bold text-slate-700 dark:text-slate-300">
                        {appt.timeStart}
                      </span>
                    </div>
                    {appt.timeEnd && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 px-2 py-0.5 rounded-md font-mono">
                        {appt.timeEnd}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
