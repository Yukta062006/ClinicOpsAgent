import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Types
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  address: string;
  dateOfBirth: string;
  medicalHistory: string[];
  allergies: string[];
  registrationDate: string;
  status: 'active' | 'inactive';
  insurance: string;
  primaryPhysician: string;
  abhaId?: string;
  aadhaar?: string;
  pan?: string;
  bloodGroup?: string;
  emergencyContact?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty?: string;
  time: string;
  date?: string;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'in-progress' | 'confirmed';
  notes: string;
  token?: string;
}

export interface QueueItem {
  id: string;
  token: string;
  patientId: string;
  patientName: string;
  doctorName?: string;
  room?: string;
  arrivalTime: string;
  status: 'waiting' | 'called' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'normal' | 'urgent';
  department: string;
  reason: string;
  estimatedWait?: string;
}

export interface Consultation {
  id: string;
  appointmentId?: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  observations: string;
  prescription: string;
  vitals: string;
  notes?: string;
  followUpDate?: string;
}

export interface ResearchArticle {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  type: 'clinical-trial' | 'review' | 'case-study' | 'guideline';
  tags: string[];
  url: string;
  abstract: string;
  summary?: string;
  findings: string[];
  limitations: string[];
  clinicalImplications?: string;
  sampleSize?: string;
  followUp?: string;
}

export interface Video {
  id: string;
  title: string;
  channel: string;
  duration: string;
  views: string;
  verified: boolean;
  category: string;
  description: string;
  url: string;
  thumbnail: string;
  saved: boolean;
  likes?: number;
  liked?: boolean;
}

export interface Game {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  duration: string;
  category: string;
  plays: number;
  highScore: number;
}

export interface LearningLesson {
  id: string;
  title: string;
  category: string;
  duration: string;
  completed: boolean;
  score: number;
  dateCompleted: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  dateUnlocked: string;
  points: number;
  icon?: string;
}

export interface HealthHabit {
  id: string;
  label: string;
  detail: string;
  category: string;
  completed: boolean;
  points: number;
}

// Data Context Interface
interface DataContextType {
  // Patients
  patients: Patient[];
  addPatient: (patient: Patient, autoCheckIn?: boolean) => Patient;
  updatePatient: (patient: Patient) => void;
  getPatientById: (id: string) => Patient | undefined;
  currentPatient: Patient;
  
  // Appointments
  appointments: Appointment[];
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (appointment: Appointment) => void;
  rescheduleAppointment: (appointmentId: string, newDate: string, newTime: string) => void;
  cancelAppointment: (appointmentId: string, reason?: string) => void;
  getAppointmentsByPatient: (patientId: string) => Appointment[];
  
  // Queue & Sequential Token
  queue: QueueItem[];
  addToQueue: (item: QueueItem) => void;
  updateQueueItem: (id: string, status: QueueItem['status']) => void;
  getNextInQueue: () => QueueItem | undefined;
  getNextSequentialToken: (department?: string) => string;
  checkInPatient: (patientId: string, doctorName?: string, department?: string, reason?: string) => QueueItem;
  callNextPatient: (doctorId?: string) => QueueItem | undefined;
  startConsultation: (queueId: string) => void;
  completeConsultation: (queueId: string, consultationData?: Partial<Consultation>) => void;
  activeToken: string;
  
  // Consultations
  consultations: Consultation[];
  addConsultation: (consultation: Consultation) => void;
  
  // Research
  researchArticles: ResearchArticle[];
  savedResearch: string[];
  toggleSaveResearch: (id: string) => void;
  getSavedArticles: () => ResearchArticle[];
  
  // Videos
  videos: Video[];
  toggleSaveVideo: (id: string) => void;
  toggleLikeVideo: (id: string) => void;
  subscribeToChannel: (channel: string) => void;
  subscribedChannels: string[];
  
  // Games & Habits
  games: Game[];
  userScores: Record<string, number>;
  saveGameScore: (gameId: string, score: number) => void;
  habits: HealthHabit[];
  toggleHabit: (habitId: string) => { completed: boolean; pointsEarned: number };
  
  // Learning
  lessons: LearningLesson[];
  achievements: Achievement[];
  userPoints: number;
  userStreak: number;
  startLesson: (lessonId: string) => void;
  completeLesson: (lessonId: string, score: number) => void;
  
  // Settings & Navigation
  soundEnabled: boolean;
  toggleSound: () => void;
  activeClinic: string;
  setActiveClinic: (clinic: string) => void;
  
  // User / Auth
  user: any;
  setUser: (user: any) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial Realistic Indian Demo Patients
const initialPatients: Patient[] = [
  {
    id: 'p-yukta',
    name: 'Yukta Ravindra Thakur',
    age: 26,
    gender: 'Female',
    phone: '+91 98201 45892',
    email: 'yukta@clinicops.com',
    address: 'Flat 402, Sea Green Apts, Marine Drive, Mumbai 400020',
    dateOfBirth: '2000-07-14',
    abhaId: '91-4821-7290-3412',
    aadhaar: 'XXXX-XXXX-4912',
    pan: 'AAAPT4912K',
    bloodGroup: 'O+',
    emergencyContact: '+91 98201 99887 (Ravindra Thakur - Father)',
    medicalHistory: ['Mild Asthma (controlled)', 'Seasonal Bronchial Allergy'],
    allergies: ['Penicillin'],
    registrationDate: '2024-01-10',
    status: 'active',
    insurance: 'ABHA / PMJAY & Star Health Insurance (Pol #SH-992014)',
    primaryPhysician: 'Dr. Sarah Sharma'
  },
  {
    id: 'p-maya',
    name: 'Maya Patel',
    age: 34,
    gender: 'Female',
    phone: '+91 98192 83746',
    email: 'maya.patel@example.com',
    address: '45 Hill Road, Bandra West, Mumbai 400050',
    dateOfBirth: '1992-06-18',
    abhaId: '14-5512-9901-2283',
    aadhaar: 'XXXX-XXXX-2283',
    pan: 'BBMPP2283L',
    bloodGroup: 'B+',
    emergencyContact: '+91 98192 11223',
    medicalHistory: ['Hypertension stage 1', 'Vitamin D deficiency'],
    allergies: ['No known allergies'],
    registrationDate: '2024-02-15',
    status: 'active',
    insurance: 'HDFC ERGO Health Optima',
    primaryPhysician: 'Dr. Elena Cooper'
  },
  {
    id: 'p-aarav',
    name: 'Aarav Sharma',
    age: 34,
    gender: 'Male',
    phone: '+91 98234 56789',
    email: 'aarav.sharma@example.com',
    address: '78 Shivaji Nagar, FC Road, Pune 411005',
    dateOfBirth: '1990-05-15',
    abhaId: '14-8832-1094-5521',
    aadhaar: 'XXXX-XXXX-8821',
    pan: 'AASPS8821M',
    bloodGroup: 'A+',
    emergencyContact: '+91 98234 11223',
    medicalHistory: ['Hypertension', 'Seasonal Rhinitis'],
    allergies: ['Sulfa drugs'],
    registrationDate: '2024-01-15',
    status: 'active',
    insurance: 'New India Assurance Mediclaim',
    primaryPhysician: 'Dr. Sarah Sharma'
  },
  {
    id: 'p-ananya',
    name: 'Ananya Patil',
    age: 29,
    gender: 'Female',
    phone: '+91 98451 23456',
    email: 'ananya.patil@example.com',
    address: '12 Koregaon Park, Lane 7, Pune 411001',
    dateOfBirth: '1995-08-22',
    abhaId: '22-4910-3382-7719',
    aadhaar: 'XXXX-XXXX-3382',
    pan: 'AAPPA3382K',
    bloodGroup: 'AB+',
    emergencyContact: '+91 98451 99887',
    medicalHistory: ['Type 2 Diabetes Mellitus (HbA1c 6.8)'],
    allergies: ['No known allergies'],
    registrationDate: '2024-02-20',
    status: 'active',
    insurance: 'ICICI Lombard Complete Health',
    primaryPhysician: 'Dr. Amit Deshmukh'
  },
  {
    id: 'p-rohan',
    name: 'Rohan Deshmukh',
    age: 42,
    gender: 'Male',
    phone: '+91 98765 43210',
    email: 'rohan.deshmukh@example.com',
    address: '55 Kothrud, DP Road, Pune 411038',
    dateOfBirth: '1982-11-05',
    abhaId: '33-7719-8820-1194',
    aadhaar: 'XXXX-XXXX-1194',
    pan: 'ARDPD1194Q',
    bloodGroup: 'O+',
    emergencyContact: '+91 98765 00998',
    medicalHistory: ['Coronary Artery Disease', 'Dyslipidemia'],
    allergies: ['Aspirin'],
    registrationDate: '2024-01-25',
    status: 'active',
    insurance: 'Bajaj Allianz Extra Care Plus',
    primaryPhysician: 'Dr. Rajesh Patil'
  },
  {
    id: 'p-sneha',
    name: 'Sneha Kulkarni',
    age: 31,
    gender: 'Female',
    phone: '+91 98345 67890',
    email: 'sneha.kulkarni@example.com',
    address: '101 J.M. Road, Deccan, Pune 411004',
    dateOfBirth: '1993-03-12',
    abhaId: '44-9901-2283-4412',
    aadhaar: 'XXXX-XXXX-4412',
    pan: 'BSKPK4412H',
    bloodGroup: 'A+',
    emergencyContact: '+91 98345 11229',
    medicalHistory: ['Hypothyroidism on Thyroxine 50mcg'],
    allergies: ['Penicillin'],
    registrationDate: '2024-03-10',
    status: 'active',
    insurance: 'Care Health Advantage',
    primaryPhysician: 'Dr. Neha Kulkarni'
  }
];

// Initial Appointments (connected with Patient Dashboard & Front Desk)
const initialAppointments: Appointment[] = [
  {
    id: 'appt-1',
    patientId: 'p-yukta',
    patientName: 'Yukta Ravindra Thakur',
    doctorId: 'doc-sarah',
    doctorName: 'Dr. Sarah Sharma',
    doctorSpecialty: 'General Medicine',
    time: '09:00 AM',
    date: '2026-10-23',
    type: 'General Checkup',
    status: 'scheduled',
    notes: 'Routine health checkup & vitals screening',
    token: 'GM-023'
  },
  {
    id: 'appt-2',
    patientId: 'p-yukta',
    patientName: 'Yukta Ravindra Thakur',
    doctorId: 'doc-amit',
    doctorName: 'Dr. Amit Deshmukh',
    doctorSpecialty: 'Pediatrics & Family Medicine',
    time: '09:30 AM',
    date: '2026-10-23',
    type: 'Follow-up Visit',
    status: 'scheduled',
    notes: 'Follow-up on allergy medications and peak flow check',
    token: 'GM-024'
  },
  {
    id: 'appt-3',
    patientId: 'p-yukta',
    patientName: 'Yukta Ravindra Thakur',
    doctorId: 'doc-neha',
    doctorName: 'Dr. Neha Kulkarni',
    doctorSpecialty: 'Specialist Consultation',
    time: '10:00 AM',
    date: '2026-10-23',
    type: 'Specialist Consultation',
    status: 'scheduled',
    notes: 'Endocrine & metabolic health assessment',
    token: 'GM-025'
  },
  {
    id: 'appt-4',
    patientId: 'p-yukta',
    patientName: 'Yukta Ravindra Thakur',
    doctorId: 'doc-rajesh',
    doctorName: 'Dr. Rajesh Patil',
    doctorSpecialty: 'Cardiology',
    time: '10:30 AM',
    date: '2026-10-23',
    type: 'Cardiology Consult',
    status: 'scheduled',
    notes: 'Preventative cardiology check & lipid evaluation',
    token: 'CD-010'
  },
  {
    id: 'appt-5',
    patientId: 'p-maya',
    patientName: 'Maya Patel',
    doctorId: 'doc-cooper',
    doctorName: 'Dr. Elena Cooper',
    doctorSpecialty: 'Family Medicine',
    time: '09:45 AM',
    date: '2026-10-23',
    type: 'Follow-up',
    status: 'confirmed',
    notes: 'Follow-up on blood pressure regulation',
    token: 'A-014'
  },
  {
    id: 'appt-6',
    patientId: 'p-aarav',
    patientName: 'Aarav Sharma',
    doctorId: 'doc-cooper',
    doctorName: 'Dr. Elena Cooper',
    doctorSpecialty: 'Family Medicine',
    time: '10:00 AM',
    date: '2026-10-23',
    type: 'Consultation',
    status: 'scheduled',
    notes: 'Bronchial asthma seasonal check',
    token: 'A-015'
  },
  {
    id: 'appt-7',
    patientId: 'p-ananya',
    patientName: 'Ananya Patil',
    doctorId: 'doc-kim',
    doctorName: 'Dr. Daniel Kim',
    doctorSpecialty: 'Internal Medicine',
    time: '10:15 AM',
    date: '2026-10-23',
    type: 'New patient',
    status: 'scheduled',
    notes: 'New patient diabetes consultation',
    token: 'B-008'
  }
];

// Initial Queue Items (Synchronized with Doctor Dashboard, Waiting Room, and Patient Dashboard)
const initialQueue: QueueItem[] = [
  {
    id: 'q-1',
    token: 'A-013',
    patientId: 'p-rohan',
    patientName: 'Grace Wilson',
    doctorName: 'Dr. Elena Cooper',
    room: 'Room 02',
    arrivalTime: '09:30 AM',
    status: 'in-progress',
    priority: 'normal',
    department: 'Room 02',
    reason: 'Follow-up visit with Dr. Cooper',
    estimatedWait: 'Now In Consultation'
  },
  {
    id: 'q-2',
    token: 'A-014',
    patientId: 'p-maya',
    patientName: 'Maya Patel',
    doctorName: 'Dr. Elena Cooper',
    room: 'Room 02',
    arrivalTime: '09:35 AM',
    status: 'called',
    priority: 'normal',
    department: 'Room 02',
    reason: 'Follow-up Dr. Elena Cooper • 09:45 AM',
    estimatedWait: 'Ready (Proceed to Room 02)'
  },
  {
    id: 'q-3',
    token: 'GM-023',
    patientId: 'p-yukta',
    patientName: 'Yukta Ravindra Thakur',
    doctorName: 'Dr. Sarah Sharma',
    room: 'Room 01',
    arrivalTime: '09:38 AM',
    status: 'waiting',
    priority: 'normal',
    department: 'General Medicine',
    reason: 'General Checkup',
    estimatedWait: '15 min'
  },
  {
    id: 'q-4',
    token: 'A-015',
    patientId: 'p-aarav',
    patientName: 'James Lewis',
    doctorName: 'Dr. Elena Cooper',
    room: 'Room 02',
    arrivalTime: '09:39 AM',
    status: 'waiting',
    priority: 'normal',
    department: 'Room 02',
    reason: 'Consultation • 10:00 AM',
    estimatedWait: '03 min'
  },
  {
    id: 'q-5',
    token: 'B-008',
    patientId: 'p-ananya',
    patientName: 'Liam Evans',
    doctorName: 'Dr. Daniel Kim',
    room: 'Room 03',
    arrivalTime: '09:28 AM',
    status: 'waiting',
    priority: 'normal',
    department: 'Room 03',
    reason: 'Clinic starts 10:00',
    estimatedWait: '14 min'
  },
  {
    id: 'q-6',
    token: 'B-009',
    patientId: 'p-sneha',
    patientName: 'Isla Thompson',
    doctorName: 'Dr. Daniel Kim',
    room: 'Room 03',
    arrivalTime: '09:36 AM',
    status: 'waiting',
    priority: 'normal',
    department: 'Room 03',
    reason: 'Routine Consultation',
    estimatedWait: '06 min'
  },
  {
    id: 'q-7',
    token: 'A-016',
    patientId: 'p-priya',
    patientName: 'Amelia Scott',
    doctorName: 'Dr. Elena Cooper',
    room: 'Room 02',
    arrivalTime: '09:40 AM',
    status: 'waiting',
    priority: 'normal',
    department: 'Room 02',
    reason: 'Prescription renewal',
    estimatedWait: '02 min'
  }
];

const initialConsultations: Consultation[] = [
  {
    id: 'c-1',
    appointmentId: 'appt-past-1',
    patientId: 'p-yukta',
    patientName: 'Yukta Ravindra Thakur',
    doctorId: 'doc-sarah',
    doctorName: 'Dr. Sarah Sharma',
    date: '2026-09-29',
    diagnosis: 'Seasonal allergic bronchitis (mild)',
    observations: 'Bilateral mild wheezing, SpO2 99%, BP 118/76 mmHg, Pulse 72 bpm',
    prescription: 'Levocetirizine 5mg OD x 7 days, Budesonide Inhaler 200mcg 1 puff BD',
    vitals: 'BP: 118/76 mmHg | SpO2: 99% | Weight: 58 kg | Temp: 98.4 F',
    notes: 'Advised avoidance of cold drinks and pollen exposure. Follow up in 4 weeks.',
    followUpDate: '2026-10-23'
  }
];

// Initial Research Articles
const initialResearch: ResearchArticle[] = [
  {
    id: '1',
    title: 'Long-term Outcomes in Diabetic Patients Following Bariatric Surgery',
    authors: 'Smith JD, Johnson ML, Williams R',
    journal: 'New England Journal of Medicine',
    year: '2024',
    type: 'clinical-trial',
    tags: ['Diabetes', 'Surgery', 'Outcomes'],
    url: 'https://www.nejm.org/doi/10.1056/NEJMoa2300001',
    abstract: 'This comprehensive study follows 500 diabetic patients over 5 years after undergoing bariatric surgery. The research demonstrates significant improvements in glycemic control, weight loss maintenance, and reduction in comorbidities compared to conservative management approaches. This study demonstrates significant and sustained improvements in glycemic control for patients with type 2 diabetes. These outcomes were maintained throughout the 5-year follow-up period, suggesting durable benefits of surgical intervention compared to traditional medical management approaches.',
    findings: [
      '78% of patients achieved remission of type 2 diabetes within 12 months post-surgery',
      'Average weight loss of 35% of total body weight maintained at 5-year follow-up',
      '52% reduction in cardiovascular events compared to control group'
    ],
    limitations: [
      'Study population primarily consisted of morbidly obese patients',
      'Limited diversity in study population (85% Caucasian)'
    ],
    clinicalImplications: 'These findings support considering bariatric surgery as an effective treatment option for patients with type 2 diabetes, particularly those who have not achieved adequate glycemic control with medical management alone. The results suggest long-term benefits beyond weight loss, including reduced cardiovascular risk and improved quality of life.',
    sampleSize: '500 patients',
    followUp: '5 years'
  },
  {
    id: '2',
    title: 'Updated Guidelines for Hypertension Management in Adults',
    authors: 'Anderson JL, Smith K, Brown M',
    journal: 'Journal of the American College of Cardiology',
    year: '2024',
    type: 'guideline',
    tags: ['Hypertension', 'Guidelines', 'Cardiology'],
    url: 'https://www.jacc.org/doi/10.1016/j.jacc.2024.01.001',
    abstract: 'Comprehensive evidence-based guidelines for hypertension management updated for 2024, including new blood pressure targets, combination therapy protocols, and lifestyle interventions tailored to diverse cardiovascular risk profiles.',
    findings: [
      'New target blood pressure of <130/80 mmHg established for adults with elevated cardiovascular risk',
      'First-line dual combination therapy recommended for stage 2 hypertension',
      'Sodium restriction to under 2,000 mg/day showed a mean 5-8 mmHg reduction in systolic BP'
    ],
    limitations: [
      'Guidelines based on randomized trial data with specific inclusion criteria',
      'Elderly populations (>80 yrs) require individualized target pressure titration'
    ],
    clinicalImplications: 'Early aggressive blood pressure control with single-pill combinations improves long-term compliance and lowers stroke incidence by 28%.',
    sampleSize: 'Meta-analysis (142,000 pts)',
    followUp: '10 years'
  },
  {
    id: '3',
    title: 'Case Study: Successful Treatment of Refractory Autoimmune Hepatitis',
    authors: 'Patel S, Robinson D, Clark E',
    journal: 'Clinical Gastroenterology and Hepatology',
    year: '2024',
    type: 'case-study',
    tags: ['Hepatology', 'Autoimmune Disease', 'Case Study'],
    url: 'https://www.cghjournal.org/doi/10.1016/j.cgh.2024.01.001',
    abstract: 'Detailed case report of a 42-year-old female patient with refractory autoimmune hepatitis unresponsive to high-dose prednisolone and azathioprine, successfully treated with a novel second-line immunomodulatory regimen.',
    findings: [
      'Complete normalization of serum transaminases and IgG within 16 weeks of therapy',
      'Repeat liver biopsy at 18 months showed histologic resolution of interface hepatitis',
      'Sustained biochemical remission achieved with zero steroid-related adverse events'
    ],
    limitations: [
      'Single-patient case evaluation limits immediate population-wide extrapolation',
      'Requires long-term monitoring for potential delayed immunosuppressive complications'
    ],
    clinicalImplications: 'Provides a viable therapeutic rescue pathway for severe autoimmune liver injury when standard-of-care antimetabolites fail.',
    sampleSize: '1 patient (In-depth)',
    followUp: '24 months'
  },
  {
    id: '4',
    title: 'Prevention and Management of Osteoporosis in Postmenopausal Women',
    authors: 'Evans J, Thomas R, Jackson L',
    journal: 'Menopause Review',
    year: '2024',
    type: 'review',
    tags: ['Endocrinology', 'Osteoporosis', "Women's Health"],
    url: 'https://www.menopausereview.com/doi/10.4111/mr.2024.23.1.1',
    abstract: 'Systematic clinical review of current diagnostic screening intervals, DEXA interpretation, vitamin D/calcium co-supplementation, and sequential antiresorptive and anabolic pharmaceutical options.',
    findings: [
      'Targeted resistance training combined with calcium and vitamin D3 reduces fragility fracture risk by 31%',
      'Sequential anabolic-to-antiresorptive therapy shows superior lumbar spine bone density increases vs bisphosphonates alone',
      'Early FRAX score screening at menopause identifies 40% more at-risk candidates'
    ],
    limitations: [
      'High variation in patient adherence to oral bisphosphonates due to GI intolerance'
    ],
    clinicalImplications: 'Screening should commence early postmenopause; combination resistance exercises should be prescribed as standard preventive medicine.',
    sampleSize: '48 cohort studies',
    followUp: '8 years'
  }
];

// Comprehensive Surgical & Educational Medical Videos
const initialVideos: Video[] = [
  // Surgical / Procedures
  {
    id: 'surg-1',
    title: 'Laparoscopic Surgery Education: Minimally Invasive Techniques',
    channel: 'Royal College of Surgeons Education',
    duration: '14:20',
    views: '450K views',
    verified: true,
    category: 'Surgical / Procedures',
    description: 'Clear educational overview of laparoscopic surgery, camera guidance, carbon dioxide insufflation, and rapid postoperative healing advantages.',
    url: 'https://www.youtube.com/embed/g6j3aQ8K8vA',
    thumbnail: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=600&auto=format&fit=crop&q=80',
    saved: true,
    likes: 38200,
    liked: true
  },
  {
    id: 'surg-2',
    title: 'Total Knee Replacement: Procedure Overview & Physical Therapy',
    channel: 'Orthopedic Health Channel',
    duration: '12:15',
    views: '890K views',
    verified: true,
    category: 'Surgical / Procedures',
    description: 'Understand articular cartilage resurfacing, biocompatible titanium/polyethylene implant positioning, and walking recovery timelines.',
    url: 'https://www.youtube.com/embed/5a6qJ_W8t4M',
    thumbnail: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80',
    saved: false,
    likes: 41200,
    liked: false
  },
  {
    id: 'surg-3',
    title: 'Cataract Surgery Explanation: Phacoemulsification & Intraocular Lenses',
    channel: 'Ophthalmic Clinical Society',
    duration: '09:45',
    views: '620K views',
    verified: true,
    category: 'Surgical / Procedures',
    description: 'How high-frequency ultrasonic energy emulsifies opacified lens proteins and implants foldable corrective monofocal or toric IOLs.',
    url: 'https://www.youtube.com/embed/PjE2i_o4k3w',
    thumbnail: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&auto=format&fit=crop&q=80',
    saved: false,
    likes: 29800,
    liked: false
  },
  {
    id: 'surg-4',
    title: 'Heart Surgery Educational Animation: Coronary Bypass (CABG)',
    channel: 'Cardiothoracic Surgery Foundation',
    duration: '16:30',
    views: '1.4M views',
    verified: true,
    category: 'Surgical / Procedures',
    description: 'Detailed anatomical animation explaining saphenous vein and internal mammary arterial grafts bypassing obstructed coronary arteries.',
    url: 'https://www.youtube.com/embed/p3p7gHnL1rQ',
    thumbnail: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=600&auto=format&fit=crop&q=80',
    saved: true,
    likes: 84300,
    liked: true
  },
  {
    id: 'surg-5',
    title: 'Appendectomy Explanation: Anatomy & Laparoscopic Removal',
    channel: 'General Surgery Academy',
    duration: '11:10',
    views: '540K views',
    verified: true,
    category: 'Surgical / Procedures',
    description: 'Why appendiceal lumen obstruction triggers acute inflammation, surgical indications, and small keyhole recovery protocols.',
    url: 'https://www.youtube.com/embed/wZAjVQWbMlE',
    thumbnail: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80',
    saved: false,
    likes: 23400,
    liked: false
  },
  {
    id: 'surg-6',
    title: 'Upper GI Endoscopy Procedure: Preparation & Examination',
    channel: 'Gastroenterology Institute',
    duration: '08:50',
    views: '410K views',
    verified: true,
    category: 'Surgical / Procedures',
    description: 'How high-definition video endoscopes inspect mucosal tissue for ulcers, gastritis, reflux changes, and tissue biopsies.',
    url: 'https://www.youtube.com/embed/fE39O_92wP4',
    thumbnail: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80',
    saved: false,
    likes: 19500,
    liked: false
  },
  {
    id: 'surg-7',
    title: 'Dental Procedures: Root Canal Therapy & Implant Restoration',
    channel: 'Dental Medicine International',
    duration: '10:20',
    views: '730K views',
    verified: true,
    category: 'Surgical / Procedures',
    description: 'Step-by-step dental pulp debridement, sterile gutta-percha sealing, and biocompatible osseointegrated dental implant installation.',
    url: 'https://www.youtube.com/embed/2Mh4gG4TqYk',
    thumbnail: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&auto=format&fit=crop&q=80',
    saved: false,
    likes: 31200,
    liked: false
  },
  // Health Education
  {
    id: 'edu-8',
    title: 'Heart Health & Blood Pressure: Preventive Arterial Care',
    channel: 'Heart Health Foundation',
    duration: '12:45',
    views: '1.2M views',
    verified: true,
    category: 'Health Education',
    description: 'Master systolic/diastolic targets, dietary sodium thresholds, arterial compliance, and daily habits that keep the myocardium resilient.',
    url: 'https://www.youtube.com/embed/p3p7gHnL1rQ',
    thumbnail: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=600&auto=format&fit=crop&q=80',
    saved: true,
    likes: 67200,
    liked: true
  },
  {
    id: 'edu-9',
    title: 'Type 2 Diabetes Management: Glycemic Balance & Medication',
    channel: 'Medical Education Hub',
    duration: '15:32',
    views: '1.8M views',
    verified: true,
    category: 'Health Education',
    description: 'Comprehensive guide to understanding insulin sensitivity, postprandial glucose curves, HbA1c tests, and dietary glycemic index.',
    url: 'https://www.youtube.com/embed/wZAjVQWbMlE',
    thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80',
    saved: false,
    likes: 92400,
    liked: false
  },
  {
    id: 'edu-10',
    title: 'Nutrition Basics: Designing a Balanced Indian & Global Plate',
    channel: 'Nutrition Experts Collective',
    duration: '18:20',
    views: '2.4M views',
    verified: true,
    category: 'Health Education',
    description: 'Essential macronutrient balancing: incorporating whole millets, legumes, colorful vegetables, and essential monounsaturated cooking oils.',
    url: 'https://www.youtube.com/embed/fE39O_92wP4',
    thumbnail: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
    saved: false,
    likes: 114000,
    liked: false
  },
  {
    id: 'edu-11',
    title: 'Exercise for Cardiovascular Health: Cardio & Strength Protocols',
    channel: 'Sports Medicine Academy',
    duration: '13:40',
    views: '650K views',
    verified: true,
    category: 'Health Education',
    description: 'How 150 minutes of weekly moderate aerobic activity optimizes vascular nitric oxide and improves insulin receptor sensitivity.',
    url: 'https://www.youtube.com/embed/9Z9mGqW_1wY',
    thumbnail: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    saved: false,
    likes: 38900,
    liked: false
  },
  {
    id: 'edu-12',
    title: 'Mental Wellness: Stress Regulation & Autonomic Nervous System',
    channel: 'Mind-Body Clinical Research',
    duration: '14:15',
    views: '980K views',
    verified: true,
    category: 'Health Education',
    description: 'Evidence-based mindfulness techniques, parasympathetic vagal stimulation, and circadian alignment for sleep quality.',
    url: 'https://www.youtube.com/embed/inpok4MKVLM',
    thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=80',
    saved: true,
    likes: 72100,
    liked: true
  },
  {
    id: 'edu-13',
    title: 'Women’s Health: Hormonal Balance, Bone Density & Screenings',
    channel: 'Women\'s Clinical Health Hub',
    duration: '17:05',
    views: '810K views',
    verified: true,
    category: 'Health Education',
    description: 'Guidance on regular gynecological checks, Pap smears, DEXA bone density preservation, and cardiovascular protection during transitions.',
    url: 'https://www.youtube.com/embed/kJQP7kiw5Fk',
    thumbnail: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&auto=format&fit=crop&q=80',
    saved: false,
    likes: 54300,
    liked: false
  },
  {
    id: 'edu-14',
    title: 'Children’s Health: Pediatric Immunization & Milestones',
    channel: 'Pediatric Care Network',
    duration: '12:50',
    views: '520K views',
    verified: true,
    category: 'Health Education',
    description: 'Essential parental guide to national immunization timelines, developmental milestones, balanced childhood nutrition, and growth charts.',
    url: 'https://www.youtube.com/embed/tgbNymZ7vqY',
    thumbnail: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&auto=format&fit=crop&q=80',
    saved: false,
    likes: 31000,
    liked: false
  },
  {
    id: 'edu-15',
    title: 'Preventive Healthcare: Lifelong Cancer & Organ Screening Protocols',
    channel: 'Preventive Oncology Council',
    duration: '16:00',
    views: '1.1M views',
    verified: true,
    category: 'Health Education',
    description: 'When and why to schedule annual metabolic profiles, colonoscopy checks, lipid panels, and blood pressure monitoring.',
    url: 'https://www.youtube.com/embed/3JZ_D3ELwOQ',
    thumbnail: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=600&auto=format&fit=crop&q=80',
    saved: false,
    likes: 68900,
    liked: false
  }
];

// Initial Health Habit Challenge items
const initialHabits = [
  { id: 'h1', label: 'Hydrate Well', detail: 'Drink at least 2 liters of water today', category: 'Hydration', completed: true, points: 10 },
  { id: 'h2', label: '30-Minute Brisk Walk', detail: 'Active cardiovascular movement outdoors or on treadmill', category: 'Fitness', completed: true, points: 10 },
  { id: 'h3', label: '10-Minute Body Stretch', detail: 'Gentle spinal and leg stretching for joint mobility', category: 'Flexibility', completed: false, points: 10 },
  { id: 'h4', label: 'Fresh Whole Fruit', detail: 'Eat an apple, papaya, or bowl of seasonal berries', category: 'Nutrition', completed: false, points: 10 },
  { id: 'h5', label: 'Sleep on Time', detail: 'Aim for 7 to 8 hours of restorative sleep before 11 PM', category: 'Recovery', completed: false, points: 10 },
  { id: 'h6', label: '5-Minute Breathing Break', detail: 'Deep 4-7-8 diaphragmatic relaxation breathing', category: 'Mental Wellness', completed: false, points: 10 }
];

// Initial Games
const initialGames: Game[] = [
  {
    id: 'balanced-eating',
    title: 'Balanced Eating Challenge',
    description: 'Everyday wellbeing • 5 questions • No timer. Master balanced nutrition groups and healthy plate composition.',
    difficulty: 'easy',
    duration: '5 min',
    category: 'Nutrition',
    plays: 3420,
    highScore: 240
  },
  {
    id: 'medicine-match',
    title: 'Medicine Match',
    description: 'Match essential medical terms, generic names, and dosage guidelines with their clinical applications.',
    difficulty: 'medium',
    duration: '8 min',
    category: 'Medical Knowledge',
    plays: 1542,
    highScore: 180
  },
  {
    id: 'anatomy-puzzle',
    title: 'Anatomy Challenge',
    description: 'Test your understanding of the cardiovascular, respiratory, and musculoskeletal systems.',
    difficulty: 'hard',
    duration: '12 min',
    category: 'Anatomy',
    plays: 1876,
    highScore: 160
  }
];

const initialLessons: LearningLesson[] = [
  { id: '1', title: 'Everyday Wellbeing', category: 'General Health', duration: '20 min', completed: true, score: 95, dateCompleted: '2026-10-08' },
  { id: '2', title: 'Sleep Savvy Basics', category: 'Rest & Recovery', duration: '15 min', completed: true, score: 90, dateCompleted: '2026-10-12' },
  { id: '3', title: 'Movement Knowledge Check', category: 'Physical Activity', duration: '15 min', completed: true, score: 80, dateCompleted: '2026-10-10' },
  { id: '4', title: 'Balanced Eating Basics', category: 'Nutrition', duration: '25 min', completed: false, score: 0, dateCompleted: '' },
  { id: '5', title: 'Heart Health Literacy', category: 'Cardiology', duration: '30 min', completed: false, score: 0, dateCompleted: '' },
];

const initialAchievements: Achievement[] = [
  { id: '1', title: 'First Step', description: 'Complete your first lesson', unlocked: true, dateUnlocked: 'Earned 08 Oct', points: 100 },
  { id: '2', title: 'Curious Mind', description: 'Read two research summaries', unlocked: true, dateUnlocked: 'Earned 10 Oct', points: 250 },
  { id: '3', title: 'Sleep Savvy', description: 'Finish the sleep basics quiz', unlocked: true, dateUnlocked: 'Earned 12 Oct', points: 200 },
  { id: '4', title: 'Nutrition Explorer', description: 'Finish the balanced eating quiz to unlock this badge', unlocked: false, dateUnlocked: 'In progress', points: 300 }
];

export function DataProvider({ children }: { children: ReactNode }) {
  // Local state initialized with fallback to realistic data
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('clinicops_patients_v2');
    return saved ? JSON.parse(saved) : initialPatients;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('clinicops_appointments_v2');
    return saved ? JSON.parse(saved) : initialAppointments;
  });

  const [queue, setQueue] = useState<QueueItem[]>(() => {
    const saved = localStorage.getItem('clinicops_queue_v2');
    return saved ? JSON.parse(saved) : initialQueue;
  });

  const [consultations, setConsultations] = useState<Consultation[]>(() => {
    const saved = localStorage.getItem('clinicops_consultations_v2');
    return saved ? JSON.parse(saved) : initialConsultations;
  });

  const [savedResearch, setSavedResearch] = useState<string[]>(() => {
    const saved = localStorage.getItem('clinicops_saved_research_v2');
    return saved ? JSON.parse(saved) : ['1'];
  });

  const [savedVideos, setSavedVideos] = useState<string[]>(() => {
    const saved = localStorage.getItem('clinicops_saved_videos_v2');
    return saved ? JSON.parse(saved) : ['2'];
  });

  const [subscribedChannels, setSubscribedChannels] = useState<string[]>(() => {
    const saved = localStorage.getItem('clinicops_subscribed_channels_v2');
    return saved ? JSON.parse(saved) : ['Heart Health Foundation'];
  });

  const [userScores, setUserScores] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('clinicops_user_scores_v2');
    return saved ? JSON.parse(saved) : { 'balanced-eating': 240, 'sleep-basics': 180, 'movement-check': 160 };
  });

  const [lessons, setLessons] = useState<LearningLesson[]>(() => {
    const saved = localStorage.getItem('clinicops_user_lessons_v2');
    return saved ? JSON.parse(saved) : initialLessons;
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem('clinicops_user_achievements_v2');
    return saved ? JSON.parse(saved) : initialAchievements;
  });

  const [userPoints, setUserPoints] = useState<number>(() => {
    const saved = localStorage.getItem('clinicops_user_points_v2');
    return saved ? parseInt(saved, 10) : 840;
  });

  const [userStreak, setUserStreak] = useState<number>(() => {
    const saved = localStorage.getItem('clinicops_user_streak_v2');
    return saved ? parseInt(saved, 10) : 5;
  });

  const [habits, setHabits] = useState<HealthHabit[]>(() => {
    const saved = localStorage.getItem('clinicops_habits_v2');
    return saved ? JSON.parse(saved) : initialHabits;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('clinicops_sound_enabled_v2');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [activeClinic, setActiveClinic] = useState<string>(() => {
    const saved = localStorage.getItem('clinicops_active_clinic');
    return saved || 'Willow Family Clinic';
  });

  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('clinicops_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    const token = localStorage.getItem('clinicops_token');
    if (token) {
      return {
        id: 'u-yukta',
        name: 'Yukta Ravindra Thakur',
        email: 'yukta@clinicops.com',
        role: 'patient',
        phone: '+91 98201 45892'
      };
    }
    return null;
  });

  // Current patient object
  const currentPatient = patients.find(p => p.id === 'p-yukta' || p.email === user?.email) || patients[0];

  // Active serving token
  const inProgressQueueItem = queue.find(q => q.status === 'in-progress' || q.status === 'called');
  const activeToken = inProgressQueueItem ? inProgressQueueItem.token : 'A-013';

  // Persistence effects
  useEffect(() => { localStorage.setItem('clinicops_patients_v2', JSON.stringify(patients)); }, [patients]);
  useEffect(() => { localStorage.setItem('clinicops_appointments_v2', JSON.stringify(appointments)); }, [appointments]);
  useEffect(() => { localStorage.setItem('clinicops_queue_v2', JSON.stringify(queue)); }, [queue]);
  useEffect(() => { localStorage.setItem('clinicops_consultations_v2', JSON.stringify(consultations)); }, [consultations]);
  useEffect(() => { localStorage.setItem('clinicops_saved_research_v2', JSON.stringify(savedResearch)); }, [savedResearch]);
  useEffect(() => { localStorage.setItem('clinicops_saved_videos_v2', JSON.stringify(savedVideos)); }, [savedVideos]);
  useEffect(() => { localStorage.setItem('clinicops_subscribed_channels_v2', JSON.stringify(subscribedChannels)); }, [subscribedChannels]);
  useEffect(() => { localStorage.setItem('clinicops_user_scores_v2', JSON.stringify(userScores)); }, [userScores]);
  useEffect(() => { localStorage.setItem('clinicops_user_lessons_v2', JSON.stringify(lessons)); }, [lessons]);
  useEffect(() => { localStorage.setItem('clinicops_user_achievements_v2', JSON.stringify(achievements)); }, [achievements]);
  useEffect(() => { localStorage.setItem('clinicops_user_points_v2', userPoints.toString()); }, [userPoints]);
  useEffect(() => { localStorage.setItem('clinicops_user_streak_v2', userStreak.toString()); }, [userStreak]);
  useEffect(() => { localStorage.setItem('clinicops_habits_v2', JSON.stringify(habits)); }, [habits]);
  useEffect(() => { localStorage.setItem('clinicops_sound_enabled_v2', JSON.stringify(soundEnabled)); }, [soundEnabled]);
  useEffect(() => { localStorage.setItem('clinicops_active_clinic', activeClinic); }, [activeClinic]);
  useEffect(() => { 
    if (user) {
      localStorage.setItem('clinicops_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('clinicops_user');
      localStorage.removeItem('clinicops_token');
    }
  }, [user]);

  // Sequential Token Generator (Strictly Sequential, Department-Aware, Persistent)
  const getNextSequentialToken = (department: string = 'General Medicine'): string => {
    let max = 0;
    // Inspect active and past queue
    queue.forEach(q => {
      const match = q.token.match(/\d+/);
      if (match) {
        const val = parseInt(match[0], 10);
        if (val > max) max = val;
      }
    });

    // Inspect appointments
    appointments.forEach(a => {
      if (a.token) {
        const match = a.token.match(/\d+/);
        if (match) {
          const val = parseInt(match[0], 10);
          if (val > max) max = val;
        }
      }
    });

    const storedLast = parseInt(localStorage.getItem('clinicops_sequential_counter') || '0', 10);
    if (storedLast > max) max = storedLast;
    
    // Ensure baseline starts realistically matching UI
    if (max < 16) max = 16;
    
    const nextNum = max + 1;
    localStorage.setItem('clinicops_sequential_counter', nextNum.toString());
    const padded = String(nextNum).padStart(3, '0');

    let prefix = 'A-';
    const deptLower = (department || '').toLowerCase();
    if (deptLower.includes('general medicine') || deptLower.includes('gm') || deptLower.includes('checkup')) {
      prefix = 'GM-';
    } else if (deptLower.includes('room 03') || deptLower.includes('kim')) {
      prefix = 'B-';
    } else if (deptLower.includes('cardio')) {
      prefix = 'CD-';
    }

    return `${prefix}${padded}`;
  };

  // Patient Actions
  const addPatient = (newPatient: Patient, autoCheckIn: boolean = false): Patient => {
    setPatients(prev => [newPatient, ...prev]);

    if (autoCheckIn) {
      const token = getNextSequentialToken(newPatient.primaryPhysician || 'General Medicine');
      const queueItem: QueueItem = {
        id: `q-${Date.now()}`,
        token,
        patientId: newPatient.id,
        patientName: newPatient.name,
        doctorName: newPatient.primaryPhysician || 'Dr. Elena Cooper',
        room: 'Room 02',
        arrivalTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'waiting',
        priority: 'normal',
        department: 'General Practice',
        reason: 'New Patient Intake',
        estimatedWait: '15 min'
      };
      setQueue(prev => [...prev, queueItem]);
    }

    return newPatient;
  };

  const updatePatient = (updatedPatient: Patient) => {
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  };

  const getPatientById = (id: string) => patients.find(p => p.id === id);

  // Appointment Actions
  const addAppointment = (newAppt: Appointment) => {
    const token = newAppt.token || getNextSequentialToken(newAppt.type);
    const appointmentWithToken: Appointment = {
      ...newAppt,
      token
    };
    setAppointments(prev => [...prev, appointmentWithToken]);
  };

  const updateAppointment = (updatedAppt: Appointment) => {
    setAppointments(prev => prev.map(a => a.id === updatedAppt.id ? updatedAppt : a));
  };

  const rescheduleAppointment = (appointmentId: string, newDate: string, newTime: string) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === appointmentId) {
        return {
          ...a,
          date: newDate,
          time: newTime,
          status: 'scheduled' as const,
          notes: `${a.notes ? a.notes + ' • ' : ''}Rescheduled to ${newDate} at ${newTime}`
        };
      }
      return a;
    }));
  };

  const cancelAppointment = (appointmentId: string, reason: string = 'Cancelled by patient') => {
    setAppointments(prev => prev.map(a => {
      if (a.id === appointmentId) {
        return {
          ...a,
          status: 'cancelled' as const,
          notes: `${a.notes ? a.notes + ' • ' : ''}${reason}`
        };
      }
      return a;
    }));

    // Update corresponding queue item if present
    setQueue(prev => prev.map(q => q.id === appointmentId || q.patientId === appointmentId ? { ...q, status: 'cancelled' } : q));
  };

  const getAppointmentsByPatient = (patientId: string) => 
    appointments.filter(a => a.patientId === patientId);

  // Queue Actions
  const addToQueue = (item: QueueItem) => {
    setQueue(prev => [...prev, item]);
  };

  const updateQueueItem = (id: string, status: QueueItem['status']) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status } : q));
  };

  const getNextInQueue = () => queue.find(q => q.status === 'waiting');

  const checkInPatient = (
    patientId: string, 
    doctorName: string = 'Dr. Elena Cooper', 
    department: string = 'General Practice', 
    reason: string = 'Consultation'
  ): QueueItem => {
    const existing = queue.find(q => q.patientId === patientId && (q.status === 'waiting' || q.status === 'called' || q.status === 'in-progress'));
    if (existing) {
      return existing;
    }

    const patient = patients.find(p => p.id === patientId);
    const token = getNextSequentialToken(department);
    const room = department.toLowerCase().includes('cardio') ? 'Room 04' : (department.toLowerCase().includes('kim') ? 'Room 03' : 'Room 02');

    const newItem: QueueItem = {
      id: `q-${Date.now()}`,
      token,
      patientId,
      patientName: patient ? patient.name : 'Registered Patient',
      doctorName,
      room,
      arrivalTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'waiting',
      priority: 'normal',
      department,
      reason,
      estimatedWait: '15 min'
    };

    setQueue(prev => [...prev, newItem]);

    // Update appointment status to checked-in if match exists
    setAppointments(prev => prev.map(a => {
      if (a.patientId === patientId && a.status === 'scheduled') {
        return { ...a, status: 'confirmed', token };
      }
      return a;
    }));

    return newItem;
  };

  const callNextPatient = (doctorId?: string): QueueItem | undefined => {
    const waitingPatient = queue.find(q => q.status === 'waiting');
    if (!waitingPatient) return undefined;

    setQueue(prev => prev.map(q => q.id === waitingPatient.id ? { ...q, status: 'called' } : q));
    
    // Play announcement chime
    if (soundEnabled && 'speechSynthesis' in window) {
      try {
        const msg = new SpeechSynthesisUtterance(`Token ${waitingPatient.token.replace('-', ' ')}, please proceed to ${waitingPatient.room || 'Room 02'}`);
        msg.rate = 0.9;
        window.speechSynthesis.speak(msg);
      } catch (e) {}
    }

    return waitingPatient;
  };

  const startConsultation = (queueId: string) => {
    setQueue(prev => prev.map(q => q.id === queueId ? { ...q, status: 'in-progress' } : q));
  };

  const completeConsultation = (queueId: string, consultationData?: Partial<Consultation>) => {
    const queueItem = queue.find(q => q.id === queueId);
    setQueue(prev => prev.map(q => q.id === queueId ? { ...q, status: 'completed' } : q));

    if (queueItem) {
      // Complete associated appointment
      setAppointments(prev => prev.map(a => {
        if (a.patientId === queueItem.patientId && (a.status === 'scheduled' || a.status === 'confirmed' || a.status === 'in-progress')) {
          return { ...a, status: 'completed' };
        }
        return a;
      }));

      // Add consultation record
      if (consultationData) {
        const newRecord: Consultation = {
          id: `c-${Date.now()}`,
          patientId: queueItem.patientId,
          patientName: queueItem.patientName,
          doctorId: consultationData.doctorId || 'doc-cooper',
          doctorName: consultationData.doctorName || queueItem.doctorName || 'Dr. Elena Cooper',
          date: new Date().toISOString().split('T')[0],
          diagnosis: consultationData.diagnosis || 'Routine clinical consultation completed',
          observations: consultationData.observations || 'Normal vitals, patient stable',
          prescription: consultationData.prescription || 'Standard care regimen advised',
          vitals: consultationData.vitals || 'BP: 120/80 mmHg | Pulse: 72 bpm',
          notes: consultationData.notes || '',
          followUpDate: consultationData.followUpDate
        };
        setConsultations(prev => [newRecord, ...prev]);
      }
    }
  };

  const addConsultation = (consultation: Consultation) => {
    setConsultations(prev => [consultation, ...prev]);
  };

  // Research Actions
  const toggleSaveResearch = (id: string) => {
    setSavedResearch(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const getSavedArticles = () => 
    initialResearch.filter(article => savedResearch.includes(article.id));

  // Video Actions
  const toggleSaveVideo = (id: string) => {
    setSavedVideos(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const toggleLikeVideo = (id: string) => {
    // Toggle liked state locally
  };

  const subscribeToChannel = (channel: string) => {
    if (!subscribedChannels.includes(channel)) {
      setSubscribedChannels(prev => [...prev, channel]);
    }
  };

  // Game & Learning Actions
  const saveGameScore = (gameId: string, score: number) => {
    setUserScores(prev => {
      const currentHigh = prev[gameId] || 0;
      return score > currentHigh ? { ...prev, [gameId]: score } : prev;
    });

    const ptsEarned = Math.round(score);
    setUserPoints(prev => prev + ptsEarned);

    // Update achievements if qualified
    setAchievements(prev => prev.map(a => {
      if (a.id === '4' && gameId === 'balanced-eating') {
        return { ...a, unlocked: true, dateUnlocked: 'Earned Today' };
      }
      return a;
    }));
  };

  const startLesson = (lessonId: string) => {
    // Placeholder for lesson tracking
  };

  const completeLesson = (lessonId: string, score: number) => {
    setLessons(prev => {
      const existing = prev.find(l => l.id === lessonId);
      if (existing) {
        return prev.map(l => l.id === lessonId ? { ...l, completed: true, score, dateCompleted: new Date().toISOString().split('T')[0] } : l);
      }
      return [...prev, { id: lessonId, title: 'Health Challenge', category: 'General', duration: '10 min', completed: true, score, dateCompleted: new Date().toISOString().split('T')[0] }];
    });

    setUserPoints(prev => prev + score);
    setUserStreak(prev => prev + 1);
  };

  const toggleHabit = (habitId: string) => {
    let earned = 0;
    let willComplete = false;
    setHabits((prev: HealthHabit[]) => prev.map((h: HealthHabit) => {
      if (h.id === habitId) {
        willComplete = !h.completed;
        earned = willComplete ? h.points : -h.points;
        return { ...h, completed: willComplete };
      }
      return h;
    }));

    if (earned > 0) {
      setUserPoints(prev => prev + earned);
    }
    return { completed: willComplete, pointsEarned: earned };
  };

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  const value: DataContextType = {
    patients,
    addPatient,
    updatePatient,
    getPatientById,
    currentPatient,

    appointments,
    addAppointment,
    updateAppointment,
    rescheduleAppointment,
    cancelAppointment,
    getAppointmentsByPatient,

    queue,
    addToQueue,
    updateQueueItem,
    getNextInQueue,
    getNextSequentialToken,
    checkInPatient,
    callNextPatient,
    startConsultation,
    completeConsultation,
    activeToken,

    consultations,
    addConsultation,

    researchArticles: initialResearch,
    savedResearch,
    toggleSaveResearch,
    getSavedArticles,

    videos: initialVideos.map(v => ({ 
      ...v, 
      saved: savedVideos.includes(v.id),
      liked: subscribedChannels.includes(v.channel)
    })),
    toggleSaveVideo,
    toggleLikeVideo,
    subscribeToChannel,
    subscribedChannels,

    games: initialGames,
    userScores,
    saveGameScore,
    habits,
    toggleHabit,

    lessons,
    achievements,
    userPoints,
    userStreak,
    startLesson,
    completeLesson,

    soundEnabled,
    toggleSound,
    activeClinic,
    setActiveClinic,

    user,
    setUser,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
