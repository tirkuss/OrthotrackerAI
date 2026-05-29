import { Patient, Appointment, BackupHistoryLog, ProgressLog, ChangeLog } from './types';

const DB_NAME = 'OrthoTrackerDB';
const DB_VERSION = 1;

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Patient store
      if (!db.objectStoreNames.contains('patients')) {
        db.createObjectStore('patients', { keyPath: 'id' });
      }

      // Appointments store
      if (!db.objectStoreNames.contains('appointments')) {
        db.createObjectStore('appointments', { keyPath: 'id' });
      }

      // Backup logs store
      if (!db.objectStoreNames.contains('backup_history')) {
        db.createObjectStore('backup_history', { keyPath: 'id' });
      }
    };
  });
}

// Initial clinical image hotlinks
export const IMAGES = {
  drSukrit: './dr_sukrit.png',
  drSmith: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhMpbuLCRLi4mECOF2Wezjwp1vP5813C-oUD2Bel1oLAr18s-U3a40mWDTXm1bLi-l8qB2iWq1OAgUmrGUdA_mJg2kY0RNFhVIim5qUARWqT64Rng2suLvZjlEAfC4s2n9u0zfEzLoht1AQ31nkcnS2MIFr_NW4XHf-tvBFJr2YQ3ALL4ZcW6YdMiF25ifMd0b-qrlKp1bSWPK5W2gzrTrHDhob9VB5CzLaxaXXxgS60QGvIXXURU0K_5OWPPYUTC4L39aZ24kzgEb',
  abigail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAoY26-qXt3BoaaWgwc60QMZFO8Wyc_OvUUp8lCCI2Zc1QLgc8WUPCck3_jo0rwobS0biJ0LTkBdWegAoUVHxdulqe04ZDTCxAXZh9j4m1NthVYmxY3jceF0jawj6lObIg1WJW4LY-YovJQ4YxnXnaDgi-S2Uokidq6ISQGxTvGR72wj1mpaSeWGqdtu_gF7EKowixM4dnZLzI-OEPhup75IAs5ApRiX4TLrJeGbAkZR3vr5Jlbz9UfglxSWROHXGKH21vBuj56JlX1',
  arthur: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxu_S0oDtkHPblguY9l3ybO5Os7HzMimRkVGkhB4e4Qagn924HU2QP5AfKgf2apbc_4mxGEWMDRy5-oWkMj5fUzPCiirC5eljOX1u7r0nf2I7A1ISHRma6b-LtwewQfeNiRm8IkaYmH0jHcCw4Eg2jZ09zywxPfm-P6u4VHnabqbzU0gBzHBOPgyIcH0zzKU0-1_9pawTr246vmv-vPsXUhc2r-wellztnXm3xraBRCAVpJ2HQTxqq-1z8EOSeOiWMvutxlA7rn7Ar',
  beatrice: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtE3rIlJbc50Iuagd5-JZJLHzfFMEnEkcJuNHJlkN81CHqmFkUxBA4n05TaQ_4pQa1yYHtsYE2vk_qxz-iTkzhjzhpTQRyVzmeATvu4B2QCAzknaXh8yLQlq6sHfuWJyqn8HSYp3HMIgZx7mvWBCZzbao25jMYO-8QwBfdRhifVy5PaT2W-zt6DSM5lkQwmqH9x_46KyD-KijxhZtPfVN96jeiPSGaNDCXJHwACDPb98mrVePWxB3z6X7evHgx0mnUViLB2yFYyB0n',
  intraoral1: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCgH1VMUMafLo3_eyzLVkEfc2TK5_-_B_jNbdw_d88Kf3FdX6gm3pU6CGUDvfkLdn1eDU6BbsM677F0VSl9oA-WVJMZdqEPIVQ-sMjr3o2Q27kdXmIkTa-OTEXx6FqolQ7p1vCPUYCvRLSXewAIDJv-SMq7TFZHa6-0-VUV4ZlRzAvC8mcoD0HvvS4eGPLtJtpnDih9tm7dBr9tyvSRQryrsvvtW2k4EgSrY4QxuypdRy4YCpV-GiGEaA0OAklmN4SYpCcNz-yUfwBh',
  intraoral2: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnQTswPxfcM3LfERVP6SVhh4V5kt_5WpGg4B1tcNAHEsjrj47FS7gItXO3-muVJ0sn5uc2RQFvapuaCVmAzjiFc9KpMkr5EimUNtNxbuD62kwDLxywkYPp-ZZ4UlgFoeSoRa8yleiw5qGZ8sOlwFzRghQi_r3WOtjMeJzTPgOcul7wmssJuKk_QjlEqm74kXvJ55gVwPTah8B7bMEYEHHapAAd9L60k7GZ86xBya032RAYq9VKH8uDKEp_1QgxDOt7oIq0S4xoTJrb',
  adminSarah: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFJvjYL9Fhw6Xv6XjsUKjUQPHCyoMu9qQq95qdYfsOpYMbt-5qUzzw3HW4pvVYeslQP8l5fcKpR51SqLEuEartxN0yteNRWMyKccQFMFJnmaH3rfWsv0CnQ3FWHsYa5o6aJgNjPqLUZDoZxJ54A1vCiSFe7E9dAD09H8LN1FCqjksYd96qbx3KkLn5bxr87DMwmETs-N52zArIIQOVcJHy9R1rP2LbufJ5R_I-qEetlY0Iq6X-cscs1bfQJYCkt2Lwe5Nddke2U1FR',
  orthoAppIcon: './app_icon.png'
};

const DEFAULT_PATIENTS: Patient[] = [];

const DEFAULT_APPOINTMENTS: Appointment[] = [];

const DEFAULT_BACKUPS: BackupHistoryLog[] = [];

export async function initDatabaseWithDefaults(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['patients', 'appointments', 'backup_history'], 'readwrite');
    const patientStore = tx.objectStore('patients');
    const apptStore = tx.objectStore('appointments');
    const backupStore = tx.objectStore('backup_history');

    // Completely reset database records if not yet done for v3
    if (localStorage.getItem('ortho_v3_purged_completely_v2') !== 'true') {
      patientStore.clear();
      apptStore.clear();
      backupStore.clear();
      localStorage.setItem('ortho_v3_purged_completely_v2', 'true');
      console.log('OrthoTracker DB completely reset: All patients, appointments, and backup logs purged.');
    } else {
      // Explicitly delete any legacy defaults just in case
      const dummyPatientIds = ['P-8820-EV', 'P-9101-AH', 'P-4432-AM', 'P-7764-BQ'];
      const dummyApptIds = ['A-1', 'A-2', 'A-3', 'A-4'];
      const dummyBackupIds = ['B-1', 'B-2', 'B-3'];

      dummyPatientIds.forEach(id => patientStore.delete(id));
      dummyApptIds.forEach(id => apptStore.delete(id));
      dummyBackupIds.forEach(id => backupStore.delete(id));
    }

    tx.oncomplete = () => {
      resolve();
    };

    tx.onerror = () => {
      reject(tx.error);
    };
  });
}

// Patient CRUD Wrapper
export class OrthoDatabase {
  static async getPatients(): Promise<Patient[]> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('patients', 'readonly');
      const store = tx.objectStore('patients');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as Patient[]);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  static async getPatient(id: string): Promise<Patient | undefined> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('patients', 'readonly');
      const store = tx.objectStore('patients');
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result as Patient | undefined);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  static async savePatient(patient: Patient): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('patients', 'readwrite');
      const store = tx.objectStore('patients');
      const request = store.put(patient);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  static async deletePatient(id: string): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('patients', 'readwrite');
      const store = tx.objectStore('patients');
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Get appointments
  static async getAppointments(): Promise<Appointment[]> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('appointments', 'readonly');
      const store = tx.objectStore('appointments');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as Appointment[]);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  static async saveAppointment(appt: Appointment): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('appointments', 'readwrite');
      const store = tx.objectStore('appointments');
      const request = store.put(appt);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  static async deleteAppointment(id: string): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('appointments', 'readwrite');
      const store = tx.objectStore('appointments');
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Backup History wrapper
  static async getBackupHistory(): Promise<BackupHistoryLog[]> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('backup_history', 'readonly');
      const store = tx.objectStore('backup_history');
      const request = store.getAll();

      request.onsuccess = () => {
        const result = request.result as BackupHistoryLog[];
        // Sort descending by date
        result.sort((a, b) => b.dateTime.localeCompare(a.dateTime));
        resolve(result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  static async addBackupHistoryLog(log: BackupHistoryLog): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('backup_history', 'readwrite');
      const store = tx.objectStore('backup_history');
      const request = store.put(log);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  static async overwriteDatabase(patients: Patient[], appointments: Appointment[], logs: BackupHistoryLog[]): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['patients', 'appointments', 'backup_history'], 'readwrite');
      
      const patStore = tx.objectStore('patients');
      const appStore = tx.objectStore('appointments');
      const backStore = tx.objectStore('backup_history');

      patStore.clear();
      appStore.clear();
      // Keep or clear log depending on overwrite status but generally overwrite fully
      backStore.clear();

      patients.forEach(p => patStore.put(p));
      appointments.forEach(a => appStore.put(a));
      logs.forEach(l => backStore.put(l));

      tx.oncomplete = () => {
        resolve();
      };

      tx.onerror = () => {
        reject(tx.error);
      };
    });
  }

  // Fast Bulk Database Seeder: Seeds custom counts of 5,000 to 10,000 patients in background chunks
  static async seedDatabaseCount(count: number, onProgress: (loaded: number) => void): Promise<string> {
    const db = await openDatabase();
    
    const namesPool = [
      'James Smith', 'Mary Johnson', 'John Williams', 'Patricia Brown', 'Robert Jones',
      'Jennifer Miller', 'Michael Davis', 'Elizabeth Garcia', 'William Rodriguez', 'Barbara Wilson',
      'David Martinez', 'Margot Anderson', 'Richard Taylor', 'Susan Thomas', 'Joseph Hernandez',
      'Jessica Moore', 'Thomas Martin', 'Sarah Jackson', 'Charles Martin', 'Karen Lee',
      'Eleanor Vance', 'Arthur Miller', 'Abigail Henderson', 'Beatrice Quinn', 'Liam Neeson',
      'Sophia Loren', 'Oliver Twist', 'Charlotte Bronte', 'Amelia Earhart', 'Lucas Scott',
      'Emma Watson', 'Aiden Gallagher', 'Mia Hamm', 'Ethan Hunt', 'Isabella Swan',
      'Alexander Hamilton', 'Olivia Rodrigo', 'Yusuf Islam', 'Zoe Kravitz', 'Nathan Drake',
      'Gabby Douglas', 'Elijah Wood', 'Grace Hopper', 'James Bond', 'Lily Potter'
    ];

    const complaintsPool = [
      'Spacing in maxillary anterior segment.',
      'Moderate mandibular crowding and narrow arches.',
      'Desires correction of teeth crowding utilizing invisible alignment trays.',
      'Slight Class II division 1 malocclusion alignment.',
      'Relapse of previous braces treatment; minor rotation on 21 and 22.',
      'Lower arch crowding with deep bite of 4mm.',
      'Upper canine impaction clearance alignment.',
      'Anterior crossbite correction alignment.'
    ];

    const planPool = [
      'Clear Aligners (Standard)',
      'Traditional Metal Braces',
      'Ceramic Braces',
      'Invisalign Express'
    ];

    const genders = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];
    const startTimeStamp = Date.now();

    // Perform chunked writes to keep UI responsive
    const chunkSize = 500;
    let completed = 0;

    while (completed < count) {
      const currentChunkSize = Math.min(chunkSize, count - completed);
      const tx = db.transaction('patients', 'readwrite');
      const store = tx.objectStore('patients');

      for (let i = 0; i < currentChunkSize; i++) {
        const idNum = completed + i + 10000;
        const nameIdx = Math.floor(Math.random() * namesPool.length);
        const name = `${namesPool[nameIdx]} (#${idNum})`;
        const gender = genders[Math.floor(Math.random() * genders.length)];
        const age = 14 + Math.floor(Math.random() * 45); // realistic age pool
        const email = `${namesPool[nameIdx].toLowerCase().replace(' ', '.')}@example.com`;
        const phone = `+1 (555) ${100 + Math.floor(Math.random() * 900)}-${1000 + Math.floor(Math.random() * 9000)}`;
        
        const year = 1970 + Math.floor(Math.random() * 40);
        const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
        const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
        const dob = `${year}-${month}-${day}`;

        const regDate = '2023-10-24';
        const chiefComplaint = complaintsPool[Math.floor(Math.random() * complaintsPool.length)];
        const treatmentPlan = planPool[Math.floor(Math.random() * planPool.length)];
        const treatmentStatus = Math.random() > 0.1 ? 'active' : 'completed';

        // Select arbitrary thumbnail based on index of default images
        const thumbUrls = [IMAGES.abigail, IMAGES.arthur, IMAGES.beatrice];
        const chosenThumb = thumbUrls[Math.floor(Math.random() * thumbUrls.length)];

        // Simple mock records matching orthodontic patterns
        const seededPatient: Patient = {
          id: `P-${idNum}`,
          name,
          age,
          gender,
          email,
          phone,
          registrationDate: regDate,
          dateOfBirth: dob,
          chiefComplaint,
          treatmentPlan,
          treatmentStatus,
          startDate: '2023-10-24',
          photos: [chosenThumb],
          progressLogs: [
            {
              id: `P-${idNum}-L1`,
              date: '2023-10-24',
              title: 'Initial Records Taken',
              notes: 'Patient was scanned and photoraphed. Orthodontic plan set up.',
              photos: []
            }
          ],
          changeLogs: [
            {
              id: `P-${idNum}-C1`,
              timestamp: new Date().toISOString(),
              author: 'Dr. Sukrit Thakur',
              field: 'Bulk Import',
              newValue: 'Imported',
              oldValue: 'N/A',
              description: 'Profile created via high-performance seeder.'
            }
          ]
        };

        store.put(seededPatient);
      }

      await new Promise<void>((res, rej) => {
        tx.oncomplete = () => {
          completed += currentChunkSize;
          onProgress(completed);
          res();
        };
        tx.onerror = () => rej(tx.error);
      });
    }

    const elapsed = Date.now() - startTimeStamp;
    return `${count} patients successfully pre-indexed and seeded in ${(elapsed / 1000).toFixed(2)} seconds.`;
  }
}
