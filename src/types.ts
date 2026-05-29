export interface ProgressLog {
  id: string;
  date: string;
  title: string;
  notes: string;
  photos: string[]; // Base64 strings or item urls for clinical images
}

export interface ChangeLog {
  id: string;
  timestamp: string;
  author: string;
  field: string;
  oldValue: string;
  newValue: string;
  description: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  email: string;
  phone: string;
  registrationDate: string;
  dateOfBirth: string;
  chiefComplaint: string;
  treatmentPlan: string;
  treatmentStatus: 'active' | 'retention' | 'completed' | 'draft';
  startDate: string;
  address?: string;
  clinic?: string;
  archived?: boolean;
  photos: string[]; // Base64 data urls of patient photos (not cropped)
  progressLogs: ProgressLog[];
  changeLogs: ChangeLog[];
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientStatus: string; // e.g., "Braces Adjustment • Aligner Tracking"
  timeStart: string; // "08:15 AM"
  timeEnd: string; // "08:45 AM"
  date: string; // "YYYY-MM-DD"
  location: string; // "CHAIR 02"
  status: 'Arrived' | 'Confirmed' | 'Pending' | 'Urgent';
}

export interface BackupHistoryLog {
  id: string;
  dateTime: string;
  action: string;
  initiatedBy: string;
  status: 'COMPLETED' | 'FAILED';
  fileSize: string;
}
