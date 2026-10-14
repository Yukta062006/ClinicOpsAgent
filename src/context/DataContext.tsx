import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  time: string;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'in-progress';
  notes: string;
}

export interface QueueItem {
  id: string;
  token: string;
  patientId: string;
  patientName: string;
  arrivalTime: string;
  status: 'waiting' | 'called' | 'in-progress' | 'completed';
  priority: 'normal' | 'urgent';
  department: string;
  reason: string;
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
  findings: string[];
  limitations: string[];
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
}

// Data Context
interface DataContextType {
  // Patients
  patients: Patient[];
  addPatient: (patient: Patient) => void;
  updatePatient: (patient: Patient) => void;
  getPatientById: (id: string) => Patient | undefined;
  
  // Appointments
  appointments: Appointment[];
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (appointment: Appointment) => void;
  getAppointmentsByPatient: (patientId: string) => Appointment[];
  
  // Queue
  queue: QueueItem[];
  addToQueue: (item: QueueItem) => void;
  updateQueueItem: (id: string, status: QueueItem['status']) => void;
  getNextInQueue: () => QueueItem | undefined;
  
  // Research
  researchArticles: ResearchArticle[];
  savedResearch: string[];
  toggleSaveResearch: (id: string) => void;
  getSavedArticles: () => ResearchArticle[];
  
  // Videos
  videos: Video[];
  toggleSaveVideo: (id: string) => void;
  subscribeToChannel: (channel: string) => void;
  
  // Games
  games: Game[];
  userScores: Record<string, number>;
  saveGameScore: (gameId: string, score: number) => void;
  
  // Learning
  lessons: LearningLesson[];
  achievements: Achievement[];
  userPoints: number;
  userStreak: number;
  startLesson: (lessonId: string) => void;
  completeLesson: (lessonId: string, score: number) => void;
  
  // Settings
  soundEnabled: boolean;
  toggleSound: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial Data
const initialPatients: Patient[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    age: 34,
    gender: 'F',
    phone: '(555) 123-4567',
    email: 'alice.johnson@example.com',
    address: '123 Main St, Metropolis, NY 10001',
    dateOfBirth: '1990-05-15',
    medicalHistory: ['Hypertension', 'Seasonal allergies'],
    allergies: ['Penicillin'],
    registrationDate: '2024-01-15',
    status: 'active',
    insurance: 'Blue Cross Blue Shield',
    primaryPhysician: 'Dr. Sarah Smith'
  },
  {
    id: '2',
    name: 'Bob Smith',
    age: 45,
    gender: 'M',
    phone: '(555) 987-6543',
    email: 'bob.smith@example.com',
    address: '456 Oak Ave, Metropolis, NY 10002',
    dateOfBirth: '1979-08-22',
    medicalHistory: ['Diabetes', 'Hyperlipidemia'],
    allergies: ['No known allergies'],
    registrationDate: '2024-02-20',
    status: 'active',
    insurance: 'Aetna',
    primaryPhysician: 'Dr. John Doe'
  },
  {
    id: '3',
    name: 'Carol Williams',
    age: 28,
    gender: 'F',
    phone: '(555) 456-7890',
    email: 'carol.williams@example.com',
    address: '789 Pine Rd, Metropolis, NY 10003',
    dateOfBirth: '1996-03-10',
    medicalHistory: ['Asthma'],
    allergies: ['Shellfish'],
    registrationDate: '2024-03-10',
    status: 'active',
    insurance: 'United Healthcare',
    primaryPhysician: 'Dr. Emily Chen'
  },
  {
    id: '4',
    name: 'David Brown',
    age: 52,
    gender: 'M',
    phone: '(555) 234-5678',
    email: 'david.brown@example.com',
    address: '321 Elm St, Metropolis, NY 10004',
    dateOfBirth: '1972-11-05',
    medicalHistory: ['Heart Disease', 'Obesity'],
    allergies: ['No known allergies'],
    registrationDate: '2024-01-25',
    status: 'active',
    insurance: 'Cigna',
    primaryPhysician: 'Dr. Michael Brown'
  },
  {
    id: '5',
    name: 'Emma Davis',
    age: 31,
    gender: 'F',
    phone: '(555) 345-6789',
    email: 'emma.davis@example.com',
    address: '654 Maple Dr, Metropolis, NY 10005',
    dateOfBirth: '1993-07-18',
    medicalHistory: ['Migraine'],
    allergies: ['Sulfa drugs'],
    registrationDate: '2024-04-01',
    status: 'active',
    insurance: 'Kaiser Permanente',
    primaryPhysician: 'Dr. Sarah Smith'
  }
];

const initialAppointments: Appointment[] = [
  { id: '1', patientId: '1', patientName: 'Alice Johnson', doctorId: 'doc1', doctorName: 'Dr. Sarah Smith', time: '09:00 AM', type: 'General Checkup', status: 'scheduled', notes: 'Annual physical exam' },
  { id: '2', patientId: '2', patientName: 'Bob Smith', doctorId: 'doc2', doctorName: 'Dr. John Doe', time: '09:30 AM', type: 'Follow-up', status: 'scheduled', notes: 'Diabetes management check' },
  { id: '3', patientId: '3', patientName: 'Carol Williams', doctorId: 'doc3', doctorName: 'Dr. Emily Chen', time: '10:00 AM', type: 'Specialist Consultation', status: 'scheduled', notes: 'Asthma evaluation' },
  { id: '4', patientId: '4', patientName: 'David Brown', doctorId: 'doc4', doctorName: 'Dr. Michael Brown', time: '10:30 AM', type: 'Cardiology Consult', status: 'scheduled', notes: 'Heart disease follow-up' },
  { id: '5', patientId: '1', patientName: 'Alice Johnson', doctorId: 'doc1', doctorName: 'Dr. Sarah Smith', time: '02:00 PM', type: 'Consultation', status: 'completed', notes: 'Prescription renewal' },
];

const initialQueue: QueueItem[] = [
  { id: '1', token: '#125', patientId: '1', patientName: 'Alice Johnson', arrivalTime: '09:00 AM', status: 'completed', priority: 'normal', department: 'General Practice', reason: 'Follow-up' },
  { id: '2', token: '#126', patientId: '2', patientName: 'Bob Smith', arrivalTime: '09:15 AM', status: 'in-progress', priority: 'urgent', department: 'General Practice', reason: 'Diabetes management' },
  { id: '3', token: '#127', patientId: '3', patientName: 'Carol Williams', arrivalTime: '09:30 AM', status: 'waiting', priority: 'normal', department: 'Specialty Care', reason: 'Asthma evaluation' },
  { id: '4', token: '#128', patientId: '4', patientName: 'David Brown', arrivalTime: '09:45 AM', status: 'waiting', priority: 'normal', department: 'Cardiology', reason: 'Heart disease follow-up' },
  { id: '5', token: '#129', patientId: '5', patientName: 'Emma Davis', arrivalTime: '10:00 AM', status: 'waiting', priority: 'normal', department: 'General Practice', reason: 'Migraine treatment' },
];

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
    abstract: 'This comprehensive study follows 500 diabetic patients over 5 years after undergoing bariatric surgery. The research demonstrates significant improvements in glycemic control, weight loss maintenance, and reduction in comorbidities compared to conservative management approaches.',
    findings: ['78% of patients achieved remission of type 2 diabetes within 12 months post-surgery', 'Average weight loss of 35% of total body weight maintained at 5-year follow-up', '52% reduction in cardiovascular events compared to control group'],
    limitations: ['Study population primarily consisted of morbidly obese patients', 'Limited diversity in study population (85% Caucasian)']
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
    abstract: 'Comprehensive guidelines for hypertension management updated for 2024, including new blood pressure targets and medication recommendations.',
    findings: ['New target blood pressure of <130/80 mmHg for high-risk patients', 'First-line treatment recommendations updated', 'Lifestyle modifications emphasized'],
    limitations: ['Guidelines based on available clinical trial data', 'May require individual patient adjustments']
  }
];

const initialVideos: Video[] = [
  {
    id: '1',
    title: 'Understanding Diabetes: Types, Symptoms, and Management',
    channel: 'Medical Education Hub',
    duration: '15:32',
    views: '1.2M views',
    verified: true,
    category: 'Diabetes',
    description: 'Comprehensive guide to understanding diabetes, including different types, common symptoms, and effective management strategies.',
    url: 'https://example.com/video1',
    thumbnail: 'https://placehold.co/600x400/285640/FFFFFF?text=Diabetes+Education',
    saved: false
  },
  {
    id: '2',
    title: 'Cardiovascular Health: Prevention and Early Detection',
    channel: 'Heart Health Foundation',
    duration: '12:45',
    views: '850K views',
    verified: true,
    category: 'Cardiology',
    description: 'Learn about cardiovascular disease risk factors, prevention strategies, and the importance of early detection.',
    url: 'https://example.com/video2',
    thumbnail: 'https://placehold.co/600x400/285640/FFFFFF?text=Heart+Health',
    saved: false
  },
  {
    id: '3',
    title: 'Nutrition Basics: Building a Balanced Diet',
    channel: 'Nutrition Experts',
    duration: '18:20',
    views: '2.1M views',
    verified: true,
    category: 'Nutrition',
    description: 'Essential nutrition principles for maintaining good health. This video covers macronutrients, micronutrients, and practical meal planning tips.',
    url: 'https://example.com/video3',
    thumbnail: 'https://placehold.co/600x400/285640/FFFFFF?text=Nutrition+Basics',
    saved: false
  }
];

const initialGames: Game[] = [
  {
    id: '1',
    title: 'Medicine Match',
    description: 'Match medical terms with their correct definitions in this educational game.',
    difficulty: 'medium',
    duration: '10 min',
    category: 'Medical Knowledge',
    plays: 1542,
    highScore: 95
  },
  {
    id: '2',
    title: 'Healthy Habits',
    description: 'Learn about healthy lifestyle choices and their benefits in this interactive game.',
    difficulty: 'easy',
    duration: '15 min',
    category: 'Lifestyle',
    plays: 2387,
    highScore: 88
  },
  {
    id: '3',
    title: 'Anatomy Challenge',
    description: 'Test your knowledge of human anatomy with this interactive puzzle game.',
    difficulty: 'hard',
    duration: '20 min',
    category: 'Anatomy',
    plays: 1876,
    highScore: 92
  }
];

const initialLessons: LearningLesson[] = [
  { id: '1', title: 'Diabetes Prevention', category: 'Disease Management', duration: '45 min', completed: true, score: 95, dateCompleted: '2024-10-10' },
  { id: '2', title: 'Healthy Living', category: 'Lifestyle', duration: '40 min', completed: true, score: 88, dateCompleted: '2024-10-08' },
  { id: '3', title: 'Nutrition Basics', category: 'Nutrition', duration: '50 min', completed: true, score: 92, dateCompleted: '2024-10-05' },
];

const initialAchievements: Achievement[] = [
  { id: '1', title: 'First Steps', description: 'Complete your first health game', unlocked: true, dateUnlocked: '2024-10-01', points: 100 },
  { id: '2', title: 'Knowledge Seeker', description: 'Complete 5 health games', unlocked: true, dateUnlocked: '2024-10-05', points: 250 },
  { id: '3', title: 'Medical Master', description: 'Score 1000 points', unlocked: false, dateUnlocked: '-', points: 500 },
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('clinicops_patients');
    return saved ? JSON.parse(saved) : initialPatients;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('clinicops_appointments');
    return saved ? JSON.parse(saved) : initialAppointments;
  });

  const [queue, setQueue] = useState<QueueItem[]>(() => {
    const saved = localStorage.getItem('clinicops_queue');
    return saved ? JSON.parse(saved) : initialQueue;
  });

  const [savedResearch, setSavedResearch] = useState<string[]>(() => {
    const saved = localStorage.getItem('clinicops_saved_research');
    return saved ? JSON.parse(saved) : [];
  });

  const [savedVideos, setSavedVideos] = useState<string[]>(() => {
    const saved = localStorage.getItem('clinicops_saved_videos');
    return saved ? JSON.parse(saved) : [];
  });

  const [subscribedChannels, setSubscribedChannels] = useState<string[]>(() => {
    const saved = localStorage.getItem('clinicops_subscribed_channels');
    return saved ? JSON.parse(saved) : [];
  });

  const [userScores, setUserScores] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('clinicops_user_scores');
    return saved ? JSON.parse(saved) : {};
  });

  const [userLessons, setUserLessons] = useState<LearningLesson[]>(() => {
    const saved = localStorage.getItem('clinicops_user_lessons');
    return saved ? JSON.parse(saved) : initialLessons;
  });

  const [userAchievements, setUserAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem('clinicops_user_achievements');
    return saved ? JSON.parse(saved) : initialAchievements;
  });

  const [userPoints, setUserPoints] = useState<number>(() => {
    const saved = localStorage.getItem('clinicops_user_points');
    return saved ? parseInt(saved) : 2850;
  });

  const [userStreak, setUserStreak] = useState<number>(() => {
    const saved = localStorage.getItem('clinicops_user_streak');
    return saved ? parseInt(saved) : 14;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('clinicops_sound_enabled');
    return saved ? JSON.parse(saved) : true;
  });

  // Save to localStorage when state changes
  useEffect(() => { localStorage.setItem('clinicops_patients', JSON.stringify(patients)); }, [patients]);
  useEffect(() => { localStorage.setItem('clinicops_appointments', JSON.stringify(appointments)); }, [appointments]);
  useEffect(() => { localStorage.setItem('clinicops_queue', JSON.stringify(queue)); }, [queue]);
  useEffect(() => { localStorage.setItem('clinicops_saved_research', JSON.stringify(savedResearch)); }, [savedResearch]);
  useEffect(() => { localStorage.setItem('clinicops_saved_videos', JSON.stringify(savedVideos)); }, [savedVideos]);
  useEffect(() => { localStorage.setItem('clinicops_subscribed_channels', JSON.stringify(subscribedChannels)); }, [subscribedChannels]);
  useEffect(() => { localStorage.setItem('clinicops_user_scores', JSON.stringify(userScores)); }, [userScores]);
  useEffect(() => { localStorage.setItem('clinicops_user_lessons', JSON.stringify(userLessons)); }, [userLessons]);
  useEffect(() => { localStorage.setItem('clinicops_user_achievements', JSON.stringify(userAchievements)); }, [userAchievements]);
  useEffect(() => { localStorage.setItem('clinicops_user_points', userPoints.toString()); }, [userPoints]);
  useEffect(() => { localStorage.setItem('clinicops_user_streak', userStreak.toString()); }, [userStreak]);
  useEffect(() => { localStorage.setItem('clinicops_sound_enabled', JSON.stringify(soundEnabled)); }, [soundEnabled]);

  const addPatient = (patient: Patient) => {
    setPatients(prev => [...prev, patient]);
  };

  const updatePatient = (updatedPatient: Patient) => {
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  };

  const getPatientById = (id: string) => patients.find(p => p.id === id);

  const addAppointment = (appointment: Appointment) => {
    setAppointments(prev => [...prev, appointment]);
  };

  const updateAppointment = (updatedAppointment: Appointment) => {
    setAppointments(prev => prev.map(a => a.id === updatedAppointment.id ? updatedAppointment : a));
  };

  const getAppointmentsByPatient = (patientId: string) => appointments.filter(a => a.patientId === patientId);

  const addToQueue = (item: QueueItem) => {
    setQueue(prev => [...prev, item]);
  };

  const updateQueueItem = (id: string, status: QueueItem['status']) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status } : q));
  };

  const getNextInQueue = () => queue.find(q => q.status === 'waiting');

  const toggleSaveResearch = (id: string) => {
    setSavedResearch(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const getSavedArticles = () => 
    initialResearch.filter(article => savedResearch.includes(article.id));

  const toggleSaveVideo = (id: string) => {
    setSavedVideos(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const subscribeToChannel = (channel: string) => {
    if (!subscribedChannels.includes(channel)) {
      setSubscribedChannels(prev => [...prev, channel]);
    }
  };

  const saveGameScore = (gameId: string, score: number) => {
    setUserScores(prev => {
      const currentHigh = prev[gameId] || 0;
      return score > currentHigh ? { ...prev, [gameId]: score } : prev;
    });
  };

  const startLesson = (lessonId: string) => {
    // Mark lesson as started (in progress)
  };

  const completeLesson = (lessonId: string, score: number) => {
    // Update lesson completion
    setUserLessons(prev => {
      const existing = prev.find(l => l.id === lessonId);
      if (existing) {
        return prev.map(l => l.id === lessonId ? { ...l, completed: true, score, dateCompleted: new Date().toISOString().split('T')[0] } : l);
      }
      return [...prev, { id: lessonId, title: '', category: '', duration: '', completed: true, score, dateCompleted: new Date().toISOString().split('T')[0] }];
    });

    // Add points
    const pointsEarned = Math.round(score / 10);
    setUserPoints(prev => prev + pointsEarned);

    // Update streak if done today
    const lastLesson = prev => {
      const completedLessons = userLessons.filter(l => l.completed);
      if (completedLessons.length === 0) return 1;
      const lastDate = new Date(completedLessons[completedLessons.length - 1].dateCompleted);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 1 ? userStreak + 1 : 1;
    };
    setUserStreak(lastLesson);
  };

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  const value: DataContextType = {
    patients,
    addPatient,
    updatePatient,
    getPatientById,

    appointments,
    addAppointment,
    updateAppointment,
    getAppointmentsByPatient,

    queue,
    addToQueue,
    updateQueueItem,
    getNextInQueue,

    researchArticles: initialResearch,
    savedResearch,
    toggleSaveResearch,
    getSavedArticles,

    videos: initialVideos.map(v => ({ ...v, saved: savedVideos.includes(v.id) })),
    toggleSaveVideo,
    subscribeToChannel,

    games: initialGames,
    userScores,
    saveGameScore,

    lessons: userLessons,
    achievements: userAchievements,
    userPoints,
    userStreak,
    startLesson,
    completeLesson,

    soundEnabled,
    toggleSound,
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
