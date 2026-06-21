const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'absensi-karyawan-secret-key-2026';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new Database(path.join(__dirname, 'absensi.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'employee',
    department TEXT,
    position TEXT,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    check_in TEXT,
    check_out TEXT,
    status TEXT DEFAULT 'present',
    note TEXT,
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS leave_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    approved_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    day TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

const upload = multer({ dest: path.join(__dirname, 'public/uploads/') });

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

const hashPassword = (pw) => bcrypt.hashSync(pw, 10);
const checkPassword = (pw, hash) => bcrypt.compareSync(pw, hash);

function seedData() {
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (count > 0) return;

  const adminPw = hashPassword('admin123');
  const empPw = hashPassword('password123');

  const insertUser = db.prepare('INSERT INTO users (name, email, password, role, department, position) VALUES (?, ?, ?, ?, ?, ?)');

  insertUser.run('Admin Utama', 'admin@company.com', adminPw, 'admin', 'HRD', 'HR Manager');
  insertUser.run('Budi Santoso', 'budi@company.com', empPw, 'employee', 'Engineering', 'Software Developer');
  insertUser.run('Siti Rahayu', 'siti@company.com', empPw, 'employee', 'Marketing', 'Marketing Specialist');
  insertUser.run('Andi Pratama', 'andi@company.com', empPw, 'employee', 'Engineering', 'Frontend Developer');
  insertUser.run('Dewi Lestari', 'dewi@company.com', empPw, 'employee', 'Finance', 'Accountant');
  insertUser.run('Rizki Ramadhan', 'rizki@company.com', empPw, 'employee', 'Engineering', 'Backend Developer');
  insertUser.run('Maya Putri', 'maya@company.com', empPw, 'employee', 'HRD', 'Recruiter');
  insertUser.run('Fajar Nugroho', 'fajar@company.com', empPw, 'employee', 'Operations', 'Project Manager');

  const insertAttendance = db.prepare('INSERT INTO attendance (user_id, date, check_in, check_out, status) VALUES (?, ?, ?, ?, ?)');
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  for (let i = 2; i <= 8; i++) {
    insertAttendance.run(i, today, '08:00:00', null, 'present');
    insertAttendance.run(i, yesterday, '08:05:00', '17:00:00', 'present');
  }

  const insertSchedule = db.prepare('INSERT INTO schedule (user_id, day, start_time, end_time) VALUES (?, ?, ?, ?)');
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  for (let i = 2; i <= 8; i++) {
    days.forEach(day => insertSchedule.run(i, day, '08:00', '17:00'));
  }
}

seedData();

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !checkPassword(password, user.password)) {
    return res.status(401).json({ error: 'Email atau password salah' });
  }
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role, department: user.department, position: user.position }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department, position: user.position } });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, department, position } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Nama, email, dan password wajib diisi' });
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(400).json({ error: 'Email sudah terdaftar' });
  const result = db.prepare('INSERT INTO users (name, email, password, department, position) VALUES (?, ?, ?, ?, ?)').run(name, email, hashPassword(password), department || '', position || '');
  const token = jwt.sign({ id: result.lastInsertRowid, name, email, role: 'employee', department, position }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: result.lastInsertRowid, name, email, role: 'employee', department, position } });
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, department, position, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

app.post('/api/attendance/check-in', auth, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const existing = db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(req.user.id, today);
  if (existing) return res.status(400).json({ error: 'Sudah check-in hari ini' });
  const now = new Date().toTimeString().split(' ')[0];
  const { note, location } = req.body || {};
  const result = db.prepare('INSERT INTO attendance (user_id, date, check_in, status, note, location) VALUES (?, ?, ?, ?, ?, ?)').run(req.user.id, today, now, 'present', note || '', location || '');
  res.json({ id: result.lastInsertRowid, check_in: now, status: 'present' });
});

app.post('/api/attendance/check-out', auth, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const record = db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(req.user.id, today);
  if (!record) return res.status(400).json({ error: 'Belum check-in hari ini' });
  if (record.check_out) return res.status(400).json({ error: 'Sudah check-out hari ini' });
  const now = new Date().toTimeString().split(' ')[0];
  db.prepare('UPDATE attendance SET check_out = ? WHERE id = ?').run(now, record.id);
  res.json({ id: record.id, check_in: record.check_in, check_out: now });
});

app.get('/api/attendance/today', auth, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const record = db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(req.user.id, today);
  res.json(record || null);
});

app.get('/api/attendance/history', auth, (req, res) => {
  const { month, year } = req.query;
  const m = month || new Date().getMonth() + 1;
  const y = year || new Date().getFullYear();
  const records = db.prepare(`
    SELECT a.*, u.name as user_name, u.department
    FROM attendance a
    JOIN users u ON a.user_id = u.id
    WHERE a.user_id = ? AND strftime('%m', a.date) = ? AND strftime('%Y', a.date) = ?
    ORDER BY a.date DESC
  `).all(req.user.id, String(m).padStart(2, '0'), String(y));
  res.json(records);
});

app.get('/api/attendance/report', auth, adminOnly, (req, res) => {
  const { date, department } = req.query;
  const d = date || new Date().toISOString().split('T')[0];
  let query = `
    SELECT a.*, u.name as user_name, u.department, u.position
    FROM attendance a
    JOIN users u ON a.user_id = u.id
    WHERE a.date = ?
  `;
  const params = [d];
  if (department) {
    query += ' AND u.department = ?';
    params.push(department);
  }
  query += ' ORDER BY u.department, u.name';
  const records = db.prepare(query).all(...params);
  res.json(records);
});

app.get('/api/attendance/stats', auth, adminOnly, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const totalEmployees = db.prepare('SELECT COUNT(*) as c FROM users WHERE role = ?').get('employee').c;
  const presentToday = db.prepare('SELECT COUNT(*) as c FROM attendance WHERE date = ? AND check_in IS NOT NULL').get(today).c;
  const lateToday = db.prepare(`
    SELECT COUNT(*) as c FROM attendance
    WHERE date = ? AND check_in > '08:00:00'
  `).get(today).c;
  const absentToday = totalEmployees - presentToday;
  const departments = db.prepare(`
    SELECT u.department, COUNT(*) as total,
    SUM(CASE WHEN a.check_in IS NOT NULL THEN 1 ELSE 0 END) as present
    FROM users u
    LEFT JOIN attendance a ON u.id = a.user_id AND a.date = ?
    WHERE u.role = 'employee' AND u.department != ''
    GROUP BY u.department
  `).all(today);
  res.json({ totalEmployees, presentToday, lateToday, absentToday, departments });
});

app.get('/api/users', auth, adminOnly, (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, department, position, avatar, created_at FROM users ORDER BY name').all();
  res.json(users);
});

app.put('/api/users/:id', auth, adminOnly, (req, res) => {
  const { name, email, role, department, position } = req.body;
  db.prepare('UPDATE users SET name = ?, email = ?, role = ?, department = ?, position = ? WHERE id = ?').run(name, email, role, department, position, req.params.id);
  res.json({ success: true });
});

app.delete('/api/users/:id', auth, adminOnly, (req, res) => {
  db.prepare('DELETE FROM attendance WHERE user_id = ?').run(req.params.id);
  db.prepare('DELETE FROM schedule WHERE user_id = ?').run(req.params.id);
  db.prepare('DELETE FROM leave_requests WHERE user_id = ?').run(req.params.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/leave', auth, (req, res) => {
  const records = db.prepare(`
    SELECT l.*, u.name as user_name, u.department
    FROM leave_requests l
    JOIN users u ON l.user_id = u.id
    WHERE l.user_id = ?
    ORDER BY l.created_at DESC
  `).all(req.user.id);
  res.json(records);
});

app.post('/api/leave', auth, (req, res) => {
  const { type, start_date, end_date, reason } = req.body;
  if (!type || !start_date || !end_date) return res.status(400).json({ error: 'Lengkapi data cuti' });
  const result = db.prepare('INSERT INTO leave_requests (user_id, type, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?)').run(req.user.id, type, start_date, end_date, reason || '');
  res.json({ id: result.lastInsertRowid, status: 'pending' });
});

app.get('/api/leave/pending', auth, adminOnly, (req, res) => {
  const records = db.prepare(`
    SELECT l.*, u.name as user_name, u.department
    FROM leave_requests l
    JOIN users u ON l.user_id = u.id
    WHERE l.status = 'pending'
    ORDER BY l.created_at DESC
  `).all();
  res.json(records);
});

app.put('/api/leave/:id/approve', auth, adminOnly, (req, res) => {
  db.prepare('UPDATE leave_requests SET status = ?, approved_by = ? WHERE id = ?').run('approved', req.user.id, req.params.id);
  res.json({ success: true });
});

app.put('/api/leave/:id/reject', auth, adminOnly, (req, res) => {
  db.prepare('UPDATE leave_requests SET status = ?, approved_by = ? WHERE id = ?').run('rejected', req.user.id, req.params.id);
  res.json({ success: true });
});

app.get('/api/dashboard', auth, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const user = db.prepare('SELECT id, name, email, role, department, position FROM users WHERE id = ?').get(req.user.id);
  const todayAttendance = db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(req.user.id, today);
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const monthlyStats = db.prepare(`
    SELECT
      COUNT(*) as total_days,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
      SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
      SUM(CASE WHEN status = 'sick' THEN 1 ELSE 0 END) as sick,
      SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leave_days
    FROM attendance
    WHERE user_id = ? AND strftime('%m', date) = ? AND strftime('%Y', date) = ?
  `).get(req.user.id, String(month).padStart(2, '0'), String(year));
  const recentAttendance = db.prepare(`
    SELECT * FROM attendance WHERE user_id = ? ORDER BY date DESC LIMIT 7
  `).all(req.user.id);
  let adminStats = null;
  if (user.role === 'admin') {
    const totalEmployees = db.prepare('SELECT COUNT(*) as c FROM users WHERE role = ?').get('employee').c;
    const presentToday = db.prepare('SELECT COUNT(*) as c FROM attendance WHERE date = ? AND check_in IS NOT NULL').get(today).c;
    adminStats = { totalEmployees, presentToday, absentToday: totalEmployees - presentToday };
  }
  res.json({ user, todayAttendance, monthlyStats, recentAttendance, adminStats });
});

app.get('/api/export/csv', auth, adminOnly, (req, res) => {
  const { month, year } = req.query;
  const m = month || new Date().getMonth() + 1;
  const y = year || new Date().getFullYear();
  const records = db.prepare(`
    SELECT u.name, u.department, u.position, a.date, a.check_in, a.check_out, a.status
    FROM attendance a
    JOIN users u ON a.user_id = u.id
    WHERE strftime('%m', a.date) = ? AND strftime('%Y', a.date) = ?
    ORDER BY a.date, u.name
  `).all(String(m).padStart(2, '0'), String(y));
  let csv = 'Nama,Department,Position,Date,Check In,Check Out,Status\n';
  records.forEach(r => {
    csv += `"${r.name}","${r.department}","${r.position}","${r.date}","${r.check_in || ''}","${r.check_out || ''}","${r.status}"\n`;
  });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=absensi-${m}-${y}.csv`);
  res.send(csv);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  ╔══════════════════════════════════════╗`);
  console.log(`  ║  Absensi Karyawan v1.0               ║`);
  console.log(`  ║  http://localhost:${PORT}               ║`);
  console.log(`  ╚══════════════════════════════════════╝\n`);
  console.log(`  Admin: admin@company.com / admin123`);
  console.log(`  User:  budi@company.com / password123\n`);
});
