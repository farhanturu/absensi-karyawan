const API = '';
let token = localStorage.getItem('token');
let currentUser = null;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...opts, headers: { ...headers, ...opts.headers } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function showToast(msg, type = 'success') {
  let t = $('#toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = `toast toast-${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(t) {
  if (!t) return '-';
  return t.substring(0, 5);
}

function renderLogin() {
  $('#app').innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <div class="icon">🏢</div>
          <h1>Absensi Karyawan</h1>
          <p>Sistem manajemen absensi online</p>
        </div>
        <div class="auth-error" id="loginError"></div>
        <form id="loginForm">
          <div class="form-group">
            <label>Email</label>
            <input type="email" class="form-input" id="loginEmail" placeholder="email@company.com" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" class="form-input" id="loginPassword" placeholder="Masukkan password" required>
          </div>
          <button type="submit" class="btn btn-primary">Masuk</button>
        </form>
        <div class="auth-footer">
          <p>Demo: <strong>admin@company.com</strong> / <strong>admin123</strong></p>
          <p style="margin-top:4px">User: <strong>budi@company.com</strong> / <strong>password123</strong></p>
        </div>
      </div>
    </div>
  `;
  $('#loginForm').onsubmit = async (e) => {
    e.preventDefault();
    const errEl = $('#loginError');
    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: $('#loginEmail').value, password: $('#loginPassword').value })
      });
      token = data.token;
      localStorage.setItem('token', token);
      currentUser = data.user;
      renderApp();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.add('show');
    }
  };
}

function renderApp() {
  const isAdmin = currentUser?.role === 'admin';
  $('#app').innerHTML = `
    <button class="mobile-menu" onclick="document.querySelector('.sidebar').classList.toggle('open')">☰</button>
    <div class="app-layout">
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-brand">
            <div class="icon">🏢</div>
            <div><h2>Absensi</h2><span>v1.0</span></div>
          </div>
        </div>
        <nav class="sidebar-nav">
          <div class="nav-section">Menu</div>
          <a class="nav-item active" data-page="dashboard" onclick="navigate('dashboard')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            Dashboard
          </a>
          <a class="nav-item" data-page="absen" onclick="navigate('absen')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            Absen
          </a>
          <a class="nav-item" data-page="riwayat" onclick="navigate('riwayat')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
            Riwayat
          </a>
          <a class="nav-item" data-page="cuti" onclick="navigate('cuti')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            Cuti
          </a>
          ${isAdmin ? `
          <div class="nav-section">Admin</div>
          <a class="nav-item" data-page="laporan" onclick="navigate('laporan')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
            Laporan
          </a>
          <a class="nav-item" data-page="karyawan" onclick="navigate('karyawan')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Karyawan
          </a>
          ` : ''}
        </nav>
        <div class="sidebar-footer">
          <div class="user-card">
            <div class="user-avatar">${currentUser?.name?.charAt(0) || 'U'}</div>
            <div class="user-info">
              <div class="user-name">${currentUser?.name || ''}</div>
              <div class="user-role">${currentUser?.position || currentUser?.role}</div>
            </div>
            <button class="btn btn-icon btn-outline" onclick="logout()" title="Logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            </button>
          </div>
        </div>
      </aside>
      <main class="main-content">
        <div id="pageContent"></div>
      </main>
    </div>
    <div class="modal-overlay" id="modalOverlay" onclick="closeModal()">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title" id="modalTitle"></h3>
          <button class="modal-close" onclick="closeModal()">✕</button>
        </div>
        <div class="modal-body" id="modalBody"></div>
        <div class="modal-footer" id="modalFooter"></div>
      </div>
    </div>
  `;
  navigate('dashboard');
}

function navigate(page) {
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
  $('.sidebar')?.classList.remove('open');
  const render = { dashboard: renderDashboard, absen: renderAbsen, riwayat: renderRiwayat, cuti: renderCuti, laporan: renderLaporan, karyawan: renderKaryawan };
  (render[page] || renderDashboard)();
}

async function renderDashboard() {
  const data = await api('/api/dashboard');
  const isAdmin = currentUser?.role === 'admin';
  let html = `<div class="topbar"><h1>Dashboard</h1></div>`;

  if (isAdmin && data.adminStats) {
    html += `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header"><div class="stat-icon" style="background:var(--primary-bg);color:var(--primary)">👥</div></div>
          <div class="stat-value">${data.adminStats.totalEmployees}</div>
          <div class="stat-label">Total Karyawan</div>
        </div>
        <div class="stat-card">
          <div class="stat-header"><div class="stat-icon" style="background:var(--green-bg);color:var(--green)">✓</div></div>
          <div class="stat-value">${data.adminStats.presentToday}</div>
          <div class="stat-label">Hadir Hari Ini</div>
        </div>
        <div class="stat-card">
          <div class="stat-header"><div class="stat-icon" style="background:var(--red-bg);color:var(--red)">✕</div></div>
          <div class="stat-value">${data.adminStats.absentToday}</div>
          <div class="stat-label">Tidak Hadir</div>
        </div>
        <div class="stat-card">
          <div class="stat-header"><div class="stat-icon" style="background:var(--amber-bg);color:var(--amber)">⏰</div></div>
          <div class="stat-value">${data.todayAttendance?.check_in ? formatTime(data.todayAttendance.check_in) : '-'}</div>
          <div class="stat-label">Check-in Hari Ini</div>
        </div>
      </div>
    `;
  } else {
    html += `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header"><div class="stat-icon" style="background:var(--green-bg);color:var(--green)">✓</div></div>
          <div class="stat-value">${data.monthlyStats?.present || 0}</div>
          <div class="stat-label">Hadir Bulan Ini</div>
        </div>
        <div class="stat-card">
          <div class="stat-header"><div class="stat-icon" style="background:var(--amber-bg);color:var(--amber)">⏰</div></div>
          <div class="stat-value">${data.monthlyStats?.late || 0}</div>
          <div class="stat-label">Terlambat</div>
        </div>
        <div class="stat-card">
          <div class="stat-header"><div class="stat-icon" style="background:var(--red-bg);color:var(--red)">🤒</div></div>
          <div class="stat-value">${data.monthlyStats?.sick || 0}</div>
          <div class="stat-label">Sakit</div>
        </div>
        <div class="stat-card">
          <div class="stat-header"><div class="stat-icon" style="background:var(--purple-bg);color:var(--purple)">🏖</div></div>
          <div class="stat-value">${data.monthlyStats?.leave_days || 0}</div>
          <div class="stat-label">Cuti</div>
        </div>
      </div>
    `;
  }

  html += `
    <div class="two-col">
      <div class="card">
        <div class="card-header"><span class="card-title">Status Hari Ini</span></div>
        <div class="card-body">
          <div style="text-align:center;padding:20px 0">
            <div style="font-size:48px;margin-bottom:8px">${data.todayAttendance ? '✅' : '⏳'}</div>
            <div style="font-size:18px;font-weight:700;margin-bottom:4px">${data.todayAttendance ? 'Sudah Absen' : 'Belum Absen'}</div>
            <div style="font-size:13px;color:var(--dim)">${data.todayAttendance ? `Check-in: ${formatTime(data.todayAttendance.check_in)}${data.todayAttendance.check_out ? ' | Check-out: ' + formatTime(data.todayAttendance.check_out) : ''}` : 'Klik menu Absen untuk check-in'}</div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Riwayat Terakhir</span></div>
        <div class="card-body">
          ${data.recentAttendance.length === 0 ? '<div class="empty-state"><div class="icon">📋</div><p>Belum ada riwayat</p></div>' : ''}
          ${data.recentAttendance.slice(0, 5).map(r => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
              <div>
                <div style="font-size:13px;font-weight:600">${formatDate(r.date)}</div>
                <div style="font-size:11px;color:var(--dim)">${formatTime(r.check_in)} - ${formatTime(r.check_out) || '...'}</div>
              </div>
              <span class="badge badge-${r.status}">${r.status}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  $('#pageContent').innerHTML = html;
}

async function renderAbsen() {
  const today = await api('/api/attendance/today');
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = formatDate(now);

  let html = `<div class="topbar"><h1>Absen</h1></div>`;
  html += `
    <div class="card">
      <div class="card-body">
        <div class="attendance-clock">
          <div class="clock-time" id="clockTime">${timeStr}</div>
          <div class="clock-date">${dateStr}</div>
          <div class="clock-status ${today ? 'checked-in' : 'not-in'}">
            ${today ? '✓ Sudah Check-in' : '○ Belum Check-in'}
          </div>
          <div class="clock-actions">
            ${!today ? `
              <button class="clock-btn checkin" onclick="doCheckIn()">Check In</button>
            ` : !today.check_out ? `
              <button class="clock-btn checkout" onclick="doCheckOut()">Check Out</button>
            ` : `
              <div style="color:var(--dim);font-size:14px">Absen hari ini selesai ✓</div>
            `}
          </div>
        </div>
      </div>
    </div>
  `;

  if (today) {
    html += `
      <div class="card" style="margin-top:20px">
        <div class="card-header"><span class="card-title">Detail Absen Hari Ini</span></div>
        <div class="card-body">
          <div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">
            <div class="stat-card"><div class="stat-label">Check In</div><div class="stat-value" style="font-size:20px">${formatTime(today.check_in)}</div></div>
            <div class="stat-card"><div class="stat-label">Check Out</div><div class="stat-value" style="font-size:20px">${formatTime(today.check_out)}</div></div>
            <div class="stat-card"><div class="stat-label">Status</div><div class="stat-value" style="font-size:20px"><span class="badge badge-${today.status}">${today.status}</span></div></div>
          </div>
        </div>
      </div>
    `;
  }

  $('#pageContent').innerHTML = html;
  clearInterval(window._clockInterval);
  window._clockInterval = setInterval(() => {
    const el = $('#clockTime');
    if (el) el.textContent = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, 1000);
}

async function doCheckIn() {
  try {
    await api('/api/attendance/check-in', { method: 'POST', body: JSON.stringify({}) });
    showToast('Check-in berhasil!');
    renderAbsen();
  } catch (err) { showToast(err.message, 'error'); }
}

async function doCheckOut() {
  try {
    await api('/api/attendance/check-out', { method: 'POST', body: JSON.stringify({}) });
    showToast('Check-out berhasil!');
    renderAbsen();
  } catch (err) { showToast(err.message, 'error'); }
}

async function renderRiwayat() {
  const now = new Date();
  const records = await api(`/api/attendance/history?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
  let html = `<div class="topbar"><h1>Riwayat Absensi</h1></div>`;

  const weeks = {};
  records.forEach(r => {
    const d = new Date(r.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split('T')[0];
    if (!weeks[key]) weeks[key] = [];
    weeks[key].push(r);
  });

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  html += `<div class="card"><div class="card-header"><span class="card-title">${now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span></div><div class="card-body">`;

  if (records.length === 0) {
    html += `<div class="empty-state"><div class="icon">📋</div><p>Belum ada riwayat bulan ini</p></div>`;
  } else {
    Object.entries(weeks).forEach(([weekStart, days]) => {
      html += `<div style="margin-bottom:20px"><div style="font-size:11px;color:var(--muted);margin-bottom:8px;text-transform:uppercase">Minggu ${weekStart}</div><div class="history-grid">`;
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const rec = days.find(r => r.date === dateStr);
        const isToday = dateStr === now.toISOString().split('T')[0];
        html += `
          <div class="history-day ${rec ? rec.status : ''} ${isToday ? 'today' : ''}" ${isToday ? 'style="border-color:var(--primary)"' : ''}>
            <div class="day-name">${dayNames[i]}</div>
            <div class="day-num">${d.getDate()}</div>
            <div class="day-status">${rec ? (rec.check_in ? formatTime(rec.check_in) : rec.status) : '-'}</div>
          </div>
        `;
      }
      html += `</div></div>`;
    });
  }

  html += `</div></div>`;
  $('#pageContent').innerHTML = html;
}

async function renderCuti() {
  const records = await api('/api/leave');
  let html = `
    <div class="topbar">
      <h1>Pengajuan Cuti</h1>
      <div class="topbar-actions">
        <button class="btn btn-primary btn-sm" onclick="showLeaveModal()">+ Ajukan Cuti</button>
      </div>
    </div>
    <div class="card">
      <div class="card-body">
        <div class="table-container">
          <table>
            <thead><tr><th>Jenis</th><th>Dari</th><th>Sampai</th><th>Alasan</th><th>Status</th></tr></thead>
            <tbody>
              ${records.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:var(--dim);padding:32px">Belum ada pengajuan cuti</td></tr>' : ''}
              ${records.map(r => `
                <tr>
                  <td style="font-weight:600">${r.type}</td>
                  <td>${r.start_date}</td>
                  <td>${r.end_date}</td>
                  <td style="color:var(--dim)">${r.reason || '-'}</td>
                  <td><span class="badge badge-${r.status}">${r.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  $('#pageContent').innerHTML = html;
}

function showLeaveModal() {
  $('#modalTitle').textContent = 'Ajukan Cuti';
  $('#modalBody').innerHTML = `
    <div class="form-group">
      <label>Jenis Cuti</label>
      <select class="form-input" id="leaveType">
        <option value="Cuti Tahunan">Cuti Tahunan</option>
        <option value="Cuti Sakit">Cuti Sakit</option>
        <option value="Cuti Melahirkan">Cuti Melahirkan</option>
        <option value="Cuti Penting">Cuti Urusan Penting</option>
      </select>
    </div>
    <div class="form-group">
      <label>Dari Tanggal</label>
      <input type="date" class="form-input" id="leaveStart">
    </div>
    <div class="form-group">
      <label>Sampai Tanggal</label>
      <input type="date" class="form-input" id="leaveEnd">
    </div>
    <div class="form-group">
      <label>Alasan</label>
      <textarea class="form-input" id="leaveReason" rows="3" placeholder="Alasan cuti..."></textarea>
    </div>
  `;
  $('#modalFooter').innerHTML = `<button class="btn btn-outline btn-sm" onclick="closeModal()">Batal</button><button class="btn btn-primary btn-sm" onclick="submitLeave()">Kirim</button>`;
  $('#modalOverlay').classList.add('show');
}

async function submitLeave() {
  try {
    await api('/api/leave', {
      method: 'POST',
      body: JSON.stringify({
        type: $('#leaveType').value,
        start_date: $('#leaveStart').value,
        end_date: $('#leaveEnd').value,
        reason: $('#leaveReason').value
      })
    });
    closeModal();
    showToast('Pengajuan cuti berhasil!');
    renderCuti();
  } catch (err) { showToast(err.message, 'error'); }
}

async function renderLaporan() {
  const today = new Date().toISOString().split('T')[0];
  const records = await api(`/api/attendance/report?date=${today}`);
  let html = `
    <div class="topbar"><h1>Laporan Absensi</h1></div>
    <div class="filter-bar">
      <input type="date" id="reportDate" value="${today}" onchange="loadReport()">
    </div>
    <div class="card">
      <div class="card-body">
        <div class="table-container">
          <table>
            <thead><tr><th>Nama</th><th>Department</th><th>Posisi</th><th>Check In</th><th>Check Out</th><th>Status</th></tr></thead>
            <tbody>
              ${records.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:var(--dim);padding:32px">Tidak ada data untuk tanggal ini</td></tr>' : ''}
              ${records.map(r => `
                <tr>
                  <td style="font-weight:600">${r.user_name}</td>
                  <td>${r.department}</td>
                  <td style="color:var(--dim)">${r.position}</td>
                  <td>${formatTime(r.check_in)}</td>
                  <td>${formatTime(r.check_out)}</td>
                  <td><span class="badge badge-${r.status}">${r.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  $('#pageContent').innerHTML = html;
}

async function loadReport() {
  const date = $('#reportDate').value;
  const records = await api(`/api/attendance/report?date=${date}`);
  const tbody = $$('#pageContent tbody')[0];
  tbody.innerHTML = records.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:var(--dim);padding:32px">Tidak ada data</td></tr>' : records.map(r => `
    <tr>
      <td style="font-weight:600">${r.user_name}</td>
      <td>${r.department}</td>
      <td style="color:var(--dim)">${r.position}</td>
      <td>${formatTime(r.check_in)}</td>
      <td>${formatTime(r.check_out)}</td>
      <td><span class="badge badge-${r.status}">${r.status}</span></td>
    </tr>
  `).join('');
}

async function renderKaryawan() {
  const users = await api('/api/users');
  let html = `
    <div class="topbar">
      <h1>Manajemen Karyawan</h1>
      <div class="topbar-actions">
        <button class="btn btn-primary btn-sm" onclick="showAddEmployeeModal()">+ Tambah</button>
      </div>
    </div>
    <div class="card">
      <div class="card-body">
        <div class="table-container">
          <table>
            <thead><tr><th>Nama</th><th>Email</th><th>Department</th><th>Posisi</th><th>Role</th><th>Aksi</th></tr></thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td style="font-weight:600">${u.name}</td>
                  <td style="color:var(--dim)">${u.email}</td>
                  <td>${u.department}</td>
                  <td>${u.position}</td>
                  <td><span class="badge ${u.role === 'admin' ? 'badge-approved' : 'badge-present'}">${u.role}</span></td>
                  <td>
                    <button class="btn btn-outline btn-sm" onclick='showEditEmployee(${JSON.stringify(u)})'>Edit</button>
                    ${u.id !== currentUser.id ? `<button class="btn btn-danger btn-sm" onclick="deleteEmployee(${u.id})">Hapus</button>` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  $('#pageContent').innerHTML = html;
}

function showAddEmployeeModal() {
  $('#modalTitle').textContent = 'Tambah Karyawan';
  $('#modalBody').innerHTML = `
    <div class="form-group"><label>Nama</label><input class="form-input" id="empName" placeholder="Nama lengkap"></div>
    <div class="form-group"><label>Email</label><input type="email" class="form-input" id="empEmail" placeholder="email@company.com"></div>
    <div class="form-group"><label>Password</label><input type="password" class="form-input" id="empPassword" placeholder="Password"></div>
    <div class="form-group"><label>Department</label><input class="form-input" id="empDept" placeholder="Engineering, Marketing, etc."></div>
    <div class="form-group"><label>Posisi</label><input class="form-input" id="empPos" placeholder="Software Developer"></div>
  `;
  $('#modalFooter').innerHTML = `<button class="btn btn-outline btn-sm" onclick="closeModal()">Batal</button><button class="btn btn-primary btn-sm" onclick="addEmployee()">Tambah</button>`;
  $('#modalOverlay').classList.add('show');
}

async function addEmployee() {
  try {
    await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: $('#empName').value,
        email: $('#empEmail').value,
        password: $('#empPassword').value,
        department: $('#empDept').value,
        position: $('#empPos').value
      })
    });
    closeModal();
    showToast('Karyawan ditambahkan!');
    renderKaryawan();
  } catch (err) { showToast(err.message, 'error'); }
}

function showEditEmployee(u) {
  $('#modalTitle').textContent = 'Edit Karyawan';
  $('#modalBody').innerHTML = `
    <div class="form-group"><label>Nama</label><input class="form-input" id="empName" value="${u.name}"></div>
    <div class="form-group"><label>Email</label><input type="email" class="form-input" id="empEmail" value="${u.email}"></div>
    <div class="form-group"><label>Department</label><input class="form-input" id="empDept" value="${u.department}"></div>
    <div class="form-group"><label>Posisi</label><input class="form-input" id="empPos" value="${u.position}"></div>
    <div class="form-group"><label>Role</label><select class="form-input" id="empRole"><option value="employee" ${u.role==='employee'?'selected':''}>Employee</option><option value="admin" ${u.role==='admin'?'selected':''}>Admin</option></select></div>
  `;
  $('#modalFooter').innerHTML = `<button class="btn btn-outline btn-sm" onclick="closeModal()">Batal</button><button class="btn btn-primary btn-sm" onclick="updateEmployee(${u.id})">Simpan</button>`;
  $('#modalOverlay').classList.add('show');
}

async function updateEmployee(id) {
  try {
    await api(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: $('#empName').value,
        email: $('#empEmail').value,
        department: $('#empDept').value,
        position: $('#empPos').value,
        role: $('#empRole').value
      })
    });
    closeModal();
    showToast('Karyawan diperbarui!');
    renderKaryawan();
  } catch (err) { showToast(err.message, 'error'); }
}

async function deleteEmployee(id) {
  if (!confirm('Hapus karyawan ini?')) return;
  try {
    await api(`/api/users/${id}`, { method: 'DELETE' });
    showToast('Karyawan dihapus!');
    renderKaryawan();
  } catch (err) { showToast(err.message, 'error'); }
}

function closeModal() { $('#modalOverlay').classList.remove('show'); }

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  clearInterval(window._clockInterval);
  renderLogin();
}

async function init() {
  if (token) {
    try {
      currentUser = await api('/api/auth/me');
      renderApp();
    } catch {
      logout();
    }
  } else {
    renderLogin();
  }
}

init();
