import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;
const JWT_SECRET = 'clinicops-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new Database('./clinicops.db', { verbose: console.log });

// Initialize database tables
function initDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      specialty TEXT,
      department TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Patients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE REFERENCES users(id),
      date_of_birth TEXT,
      gender TEXT,
      address TEXT,
      emergency_contact TEXT,
      blood_type TEXT,
      allergies TEXT,
      medical_history TEXT,
      insurance_provider TEXT,
      policy_number TEXT,
      registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active'
    )
  `);

  // Appointments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES users(id),
      doctor_id TEXT NOT NULL REFERENCES users(id),
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      type TEXT NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'scheduled',
      token_number INTEGER,
      checked_in BOOLEAN DEFAULT FALSE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Queue table
  db.exec(`
    CREATE TABLE IF NOT EXISTS queue (
      id TEXT PRIMARY KEY,
      appointment_id TEXT UNIQUE REFERENCES appointments(id),
      token TEXT UNIQUE NOT NULL,
      patient_id TEXT NOT NULL REFERENCES users(id),
      doctor_id TEXT REFERENCES users(id),
      department TEXT,
      priority TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'waiting',
      arrival_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      called_time DATETIME,
      started_time DATETIME,
      completed_time DATETIME,
      estimated_wait INTEGER
    )
  `);

  // Saved research articles
  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_articles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      article_id TEXT NOT NULL,
      title TEXT NOT NULL,
      authors TEXT,
      journal TEXT,
      year TEXT,
      category TEXT,
      saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, article_id)
    )
  `);

  // Game scores
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_scores (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      game_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      moves INTEGER,
      time_taken INTEGER,
      completed BOOLEAN DEFAULT TRUE,
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Learning progress
  db.exec(`
    CREATE TABLE IF NOT EXISTS learning_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      lesson_id TEXT NOT NULL,
      lesson_title TEXT NOT NULL,
      category TEXT,
      completed BOOLEAN DEFAULT FALSE,
      score INTEGER,
      points_earned INTEGER,
      completed_at DATETIME,
      UNIQUE(user_id, lesson_id)
    )
  `);

  // User points
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_points (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE REFERENCES users(id),
      total_points INTEGER DEFAULT 0,
      streak_days INTEGER DEFAULT 0,
      last_activity_date TEXT
    )
  `);

  // Default admin user
  const adminExists = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@clinicops.com');
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    const adminId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, email, password, name, role, specialty) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(adminId, 'admin@clinicops.com', hashedPassword, 'Admin User', 'doctor', 'Administration');
  }
}

// Initialize database
initDatabase();

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Role-based middleware
function requireRole(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// ============ AUTHENTICATION ROUTES ============
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role, phone, specialty, department } = req.body;
    
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    
    db.prepare(`
      INSERT INTO users (id, email, password, name, role, phone, specialty, department)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, email, hashedPassword, name, role, phone, specialty, department);
    
    // Create patient record if role is patient
    if (role === 'patient') {
      const patientId = uuidv4();
      db.prepare(`
        INSERT INTO patients (id, user_id) VALUES (?, ?)
      `).run(patientId, userId);
      
      // Initialize user points
      db.prepare(`
        INSERT INTO user_points (id, user_id) VALUES (?, ?)
      `).run(uuidv4(), userId);
    }
    
    const token = jwt.sign(
      { id: userId, email, name, role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true, 
      token, 
      user: { id: userId, email, name, role, phone, specialty, department } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true, 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role,
        phone: user.phone,
        specialty: user.specialty,
        department: user.department
      } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, name, role, phone, specialty, department FROM users WHERE id = ?').get(req.user.id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PATIENT ROUTES ============
app.get('/api/patients', authenticateToken, requireRole(['frontdesk', 'doctor']), (req, res) => {
  try {
    const search = req.query.search || '';
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    let query = `
      SELECT u.id, u.name, u.email, u.phone, u.role, 
             p.date_of_birth, p.gender, p.address, p.emergency_contact,
             p.blood_type, p.allergies, p.registration_date
      FROM users u
      LEFT JOIN patients p ON u.id = p.user_id
      WHERE u.role = 'patient'
    `;
    
    const params = [];
    
    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }
    
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const patients = db.prepare(query).all(...params);
    
    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM users WHERE role = 'patient'`;
    if (search) {
      countQuery += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
    }
    
    const countParams = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];
    const countResult = db.prepare(countQuery).get(...countParams);
    
    res.json({ 
      success: true, 
      patients, 
      total: countResult.total 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/patients', authenticateToken, requireRole(['frontdesk']), async (req, res) => {
  try {
    const { 
      name, email, phone, date_of_birth, gender, address, 
      emergency_contact, blood_type, allergies, medical_history,
      insurance_provider, policy_number 
    } = req.body;
    
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Name, email, and phone are required' });
    }
    
    // Create user record
    const userId = uuidv4();
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    db.prepare(`
      INSERT INTO users (id, email, password, name, role, phone)
      VALUES (?, ?, ?, ?, 'patient', ?)
    `).run(userId, email, hashedPassword, name, phone);
    
    // Create patient record
    const patientId = uuidv4();
    db.prepare(`
      INSERT INTO patients (
        id, user_id, date_of_birth, gender, address, emergency_contact,
        blood_type, allergies, medical_history, insurance_provider, policy_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      patientId, userId, date_of_birth, gender, address, emergency_contact,
      blood_type, allergies, medical_history, insurance_provider, policy_number
    );
    
    // Initialize user points
    db.prepare(`
      INSERT INTO user_points (id, user_id) VALUES (?, ?)
    `).run(uuidv4(), userId);
    
    res.json({ 
      success: true, 
      patient: { 
        id: userId, 
        name, email, phone, date_of_birth, gender, address,
        emergency_contact, blood_type, allergies, medical_history,
        insurance_provider, policy_number,
        tempPassword
      } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ APPOINTMENT ROUTES ============
app.get('/api/appointments', authenticateToken, (req, res) => {
  try {
    const { status, date, doctor_id, patient_id, type } = req.query;
    const user = req.user;
    
    let query = `
      SELECT a.*, 
             p.name as patient_name, p.email as patient_email, p.phone as patient_phone,
             d.name as doctor_name, d.specialty as doctor_specialty
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Role-based filtering
    if (user.role === 'doctor') {
      query += ` AND a.doctor_id = ?`;
      params.push(user.id);
    } else if (user.role === 'patient') {
      query += ` AND a.patient_id = ?`;
      params.push(user.id);
    }
    
    if (status) {
      query += ` AND a.status = ?`;
      params.push(status);
    }
    
    if (date) {
      query += ` AND a.appointment_date = ?`;
      params.push(date);
    }
    
    if (doctor_id) {
      query += ` AND a.doctor_id = ?`;
      params.push(doctor_id);
    }
    
    if (patient_id) {
      query += ` AND a.patient_id = ?`;
      params.push(patient_id);
    }
    
    if (type) {
      query += ` AND a.type = ?`;
      params.push(type);
    }
    
    query += ` ORDER BY a.appointment_date, a.appointment_time`;
    
    const appointments = db.prepare(query).all(...params);
    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/appointments', authenticateToken, requireRole(['frontdesk', 'patient']), (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_date, appointment_time, type, reason, token_number } = req.body;
    const user = req.user;
    
    // Front desk can schedule for any patient, patients can only schedule for themselves
    if (user.role === 'patient' && user.id !== patient_id) {
      return res.status(403).json({ error: 'Patients can only schedule appointments for themselves' });
    }
    
    // Generate token number if not provided
    let finalTokenNumber = token_number;
    if (!finalTokenNumber) {
      const lastAppointment = db.prepare(`
        SELECT token_number FROM appointments 
        WHERE appointment_date = ? AND doctor_id = ?
        ORDER BY token_number DESC LIMIT 1
      `).get(appointment_date, doctor_id);
      
      finalTokenNumber = lastAppointment ? lastAppointment.token_number + 1 : 1;
    }
    
    const appointmentId = uuidv4();
    db.prepare(`
      INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_time, type, reason, token_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(appointmentId, patient_id, doctor_id, appointment_date, appointment_time, type, reason, finalTokenNumber);
    
    // Add to queue if checked in immediately
    if (req.body.check_in_immediately) {
      const queueId = uuidv4();
      db.prepare(`
        INSERT INTO queue (id, appointment_id, token, patient_id, doctor_id, department, status)
        VALUES (?, ?, ?, ?, ?, 'General Practice', 'waiting')
      `).run(queueId, appointmentId, `#${finalTokenNumber}`, patient_id, doctor_id);
    }
    
    const newAppointment = db.prepare(`
      SELECT a.*, p.name as patient_name, d.name as doctor_name
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      WHERE a.id = ?
    `).get(appointmentId);
    
    res.json({ success: true, appointment: newAppointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/appointments/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const user = req.user;
    
    const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Authorization
    if (user.role === 'patient' && appointment.patient_id !== user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    if (user.role === 'doctor' && appointment.doctor_id !== user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const updateFields = [];
    const params = [];
    
    if (status) {
      updateFields.push('status = ?');
      params.push(status);
    }
    
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      params.push(notes);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(id);
    
    db.prepare(`
      UPDATE appointments 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `).run(...params);
    
    // Update queue if appointment is completed or cancelled
    if (status === 'completed' || status === 'cancelled') {
      db.prepare(`
        UPDATE queue 
        SET status = ?,
            completed_time = CURRENT_TIMESTAMP
        WHERE appointment_id = ?
      `).run(status === 'completed' ? 'completed' : 'cancelled', id);
    }
    
    const updatedAppointment = db.prepare(`
      SELECT a.*, p.name as patient_name, d.name as doctor_name
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      WHERE a.id = ?
    `).get(id);
    
    res.json({ success: true, appointment: updatedAppointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ QUEUE ROUTES ============
app.get('/api/queue', authenticateToken, (req, res) => {
  try {
    const { status, doctor_id, department } = req.query;
    const user = req.user;
    
    let query = `
      SELECT q.*, 
             p.name as patient_name, p.phone as patient_phone,
             d.name as doctor_name,
             a.appointment_date, a.appointment_time, a.type as appointment_type
      FROM queue q
      JOIN users p ON q.patient_id = p.id
      JOIN users d ON q.doctor_id = d.id
      LEFT JOIN appointments a ON q.appointment_id = a.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Role-based filtering
    if (user.role === 'doctor') {
      query += ` AND q.doctor_id = ?`;
      params.push(user.id);
    }
    
    if (status) {
      query += ` AND q.status = ?`;
      params.push(status);
    }
    
    if (doctor_id) {
      query += ` AND q.doctor_id = ?`;
      params.push(doctor_id);
    }
    
    if (department) {
      query += ` AND q.department = ?`;
      params.push(department);
    }
    
    query += ` ORDER BY q.arrival_time`;
    
    const queue = db.prepare(query).all(...params);
    res.json({ success: true, queue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/queue/call-next', authenticateToken, requireRole(['doctor', 'frontdesk']), (req, res) => {
  try {
    const { doctor_id } = req.body;
    const user = req.user;
    
    const doctorToUse = doctor_id || user.id;
    
    // Find next waiting patient for this doctor
    const nextPatient = db.prepare(`
      SELECT * FROM queue 
      WHERE doctor_id = ? AND status = 'waiting'
      ORDER BY arrival_time 
      LIMIT 1
    `).get(doctorToUse);
    
    if (!nextPatient) {
      return res.status(404).json({ error: 'No patients waiting' });
    }
    
    // Update to called status
    db.prepare(`
      UPDATE queue 
      SET status = 'called', called_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nextPatient.id);
    
    // Update appointment status
    if (nextPatient.appointment_id) {
      db.prepare(`
        UPDATE appointments SET status = 'in-progress' WHERE id = ?
      `).run(nextPatient.appointment_id);
    }
    
    const updatedPatient = db.prepare(`
      SELECT q.*, p.name as patient_name, p.phone as patient_phone,
             d.name as doctor_name
      FROM queue q
      JOIN users p ON q.patient_id = p.id
      JOIN users d ON q.doctor_id = d.id
      WHERE q.id = ?
    `).get(nextPatient.id);
    
    res.json({ 
      success: true, 
      patient: updatedPatient,
      sound: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/queue/:id/status', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;
    
    const queueItem = db.prepare('SELECT * FROM queue WHERE id = ?').get(id);
    if (!queueItem) {
      return res.status(404).json({ error: 'Queue item not found' });
    }
    
    // Authorization
    if (user.role === 'doctor' && queueItem.doctor_id !== user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const validStatuses = ['waiting', 'called', 'in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const timestampColumn = 
      status === 'called' ? 'called_time' :
      status === 'in-progress' ? 'started_time' :
      status === 'completed' ? 'completed_time' : null;
    
    let updateQuery = `UPDATE queue SET status = ?`;
    const params = [status];
    
    if (timestampColumn) {
      updateQuery += `, ${timestampColumn} = CURRENT_TIMESTAMP`;
    }
    
    updateQuery += ` WHERE id = ?`;
    params.push(id);
    
    db.prepare(updateQuery).run(...params);
    
    // Update appointment status if applicable
    if (queueItem.appointment_id) {
      let appointmentStatus = 
        status === 'in-progress' ? 'in-progress' :
        status === 'completed' ? 'completed' :
        status === 'cancelled' ? 'cancelled' : 'scheduled';
      
      db.prepare(`
        UPDATE appointments SET status = ? WHERE id = ?
      `).run(appointmentStatus, queueItem.appointment_id);
    }
    
    const updatedQueueItem = db.prepare(`
      SELECT q.*, p.name as patient_name, d.name as doctor_name
      FROM queue q
      JOIN users p ON q.patient_id = p.id
      JOIN users d ON q.doctor_id = d.id
      WHERE q.id = ?
    `).get(id);
    
    res.json({ success: true, queueItem: updatedQueueItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ DASHBOARD STATISTICS ============
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  try {
    const user = req.user;
    const date = new Date().toISOString().split('T')[0];
    
    let stats = {};
    
    if (user.role === 'doctor') {
      const doctorStats = db.prepare(`
        SELECT 
          COUNT(*) as total_patients_today,
          SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_appointments,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_consultations
        FROM appointments 
        WHERE doctor_id = ? AND appointment_date = ?
      `).get(user.id, date);
      
      const queueStats = db.prepare(`
        SELECT 
          COUNT(*) as active_queue,
          SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) as waiting,
          SUM(CASE WHEN status = 'called' THEN 1 ELSE 0 END) as called,
          SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress
        FROM queue 
        WHERE doctor_id = ? AND DATE(arrival_time) = ?
      `).get(user.id, date);
      
      stats = {
        total_patients_today: doctorStats.total_patients_today || 0,
        appointments_today: doctorStats.scheduled_appointments || 0,
        completed_consultations: doctorStats.completed_consultations || 0,
        active_queue: queueStats.active_queue || 0,
        waiting: queueStats.waiting || 0,
        called: queueStats.called || 0,
        in_progress: queueStats.in_progress || 0
      };
    } else if (user.role === 'patient') {
      const patientStats = db.prepare(`
        SELECT 
          COUNT(*) as total_appointments,
          SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as upcoming_appointments,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as past_appointments
        FROM appointments 
        WHERE patient_id = ?
      `).get(user.id);
      
      const currentQueue = db.prepare(`
        SELECT * FROM queue 
        WHERE patient_id = ? AND status IN ('waiting', 'called', 'in-progress')
        ORDER BY arrival_time DESC LIMIT 1
      `).get(user.id);
      
      stats = {
        total_appointments: patientStats.total_appointments || 0,
        upcoming_appointments: patientStats.upcoming_appointments || 0,
        past_appointments: patientStats.past_appointments || 0,
        current_token: currentQueue ? currentQueue.token : null,
        current_wait_status: currentQueue ? currentQueue.status : 'none'
      };
    } else {
      const frontDeskStats = db.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE role = 'patient') as total_patients,
          (SELECT COUNT(*) FROM appointments WHERE appointment_date = ? AND status = 'scheduled') as appointments_today,
          (SELECT COUNT(*) FROM queue WHERE DATE(arrival_time) = ? AND status = 'waiting') as active_queue,
          (SELECT COUNT(*) FROM appointments WHERE appointment_date = ? AND status = 'completed') as completed_consultations
      `).get(date, date, date);
      
      stats = {
        total_patients: frontDeskStats.total_patients || 0,
        appointments_today: frontDeskStats.appointments_today || 0,
        active_queue: frontDeskStats.active_queue || 0,
        completed_consultations: frontDeskStats.completed_consultations || 0
      };
    }
    
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PATIENT ENGAGEMENT MODULES ============
app.get('/api/articles/saved', authenticateToken, (req, res) => {
  try {
    const savedArticles = db.prepare(`
      SELECT * FROM saved_articles WHERE user_id = ? ORDER BY saved_at DESC
    `).all(req.user.id);
    res.json({ success: true, articles: savedArticles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/articles/save', authenticateToken, (req, res) => {
  try {
    const { article_id, title, authors, journal, year, category } = req.body;
    
    const existing = db.prepare('SELECT * FROM saved_articles WHERE user_id = ? AND article_id = ?')
      .get(req.user.id, article_id);
    
    if (existing) {
      db.prepare('DELETE FROM saved_articles WHERE id = ?').run(existing.id);
      res.json({ success: true, saved: false });
    } else {
      const savedId = uuidv4();
      db.prepare(`
        INSERT INTO saved_articles (id, user_id, article_id, title, authors, journal, year, category)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(savedId, req.user.id, article_id, title, authors, journal, year, category);
      res.json({ success: true, saved: true });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/games/scores', authenticateToken, (req, res) => {
  try {
    const { game_id } = req.query;
    
    let query = 'SELECT * FROM game_scores WHERE user_id = ?';
    const params = [req.user.id];
    
    if (game_id) {
      query += ' AND game_id = ?';
      params.push(game_id);
    }
    
    query += ' ORDER BY played_at DESC LIMIT 10';
    
    const scores = db.prepare(query).all(...params);
    const highScores = db.prepare(`
      SELECT game_id, MAX(score) as high_score
      FROM game_scores 
      WHERE user_id = ?
      GROUP BY game_id
    `).all(req.user.id);
    
    const highScoreMap = {};
    highScores.forEach(score => {
      highScoreMap[score.game_id] = score.high_score;
    });
    
    res.json({ success: true, scores, highScores: highScoreMap });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/games/save-score', authenticateToken, (req, res) => {
  try {
    const { game_id, score, moves, time_taken } = req.body;
    
    const scoreId = uuidv4();
    db.prepare(`
      INSERT INTO game_scores (id, user_id, game_id, score, moves, time_taken)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(scoreId, req.user.id, game_id, score, moves, time_taken);
    
    const pointsEarned = Math.floor(score / 10);
    if (pointsEarned > 0) {
      db.prepare(`
        UPDATE user_points 
        SET total_points = total_points + ?,
            last_activity_date = DATE('now'),
            streak_days = CASE 
              WHEN DATE(last_activity_date) = DATE('now', '-1 day') THEN streak_days + 1
              ELSE 1
            END
        WHERE user_id = ?
      `).run(pointsEarned, req.user.id);
    }
    
    res.json({ success: true, pointsEarned });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/learning/progress', authenticateToken, (req, res) => {
  try {
    const progress = db.prepare(`
      SELECT * FROM learning_progress WHERE user_id = ? ORDER BY completed_at DESC
    `).all(req.user.id);
    
    const points = db.prepare('SELECT * FROM user_points WHERE user_id = ?').get(req.user.id);
    
    res.json({ 
      success: true, 
      progress, 
      points: points || { total_points: 0, streak_days: 0 } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/learning/complete-lesson', authenticateToken, (req, res) => {
  try {
    const { lesson_id, lesson_title, category, score } = req.body;
    
    const existing = db.prepare(`
      SELECT * FROM learning_progress WHERE user_id = ? AND lesson_id = ?
    `).get(req.user.id, lesson_id);
    
    if (existing) {
      db.prepare(`
        UPDATE learning_progress 
        SET score = ?, completed = TRUE, completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(score, existing.id);
    } else {
      const progressId = uuidv4();
      const pointsEarned = Math.floor(score / 5);
      
      db.prepare(`
        INSERT INTO learning_progress (id, user_id, lesson_id, lesson_title, category, score, completed, points_earned, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, TRUE, ?, CURRENT_TIMESTAMP)
      `).run(progressId, req.user.id, lesson_id, lesson_title, category, score, pointsEarned);
      
      if (pointsEarned > 0) {
        db.prepare(`
          UPDATE user_points 
          SET total_points = total_points + ?,
              last_activity_date = DATE('now'),
              streak_days = CASE 
                WHEN DATE(last_activity_date) = DATE('now', '-1 day') THEN streak_days + 1
                ELSE 1
              END
          WHERE user_id = ?
        `).run(pointsEarned, req.user.id);
      }
    }
    
    res.json({ success: true, score });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});