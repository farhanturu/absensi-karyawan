# Absensi Karyawan

> Sistem Absensi Karyawan — Login, Check-in/Check-out, Dashboard, Laporan, Manajemen Karyawan

![Status](https://img.shields.io/badge/status-active-brightgreen?style=flat-square)
![Node](https://img.shields.io/badge/Node.js-18+-green?style=flat-square)
![SQLite](https://img.shields.io/badge/SQLite-3-blue?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

## Features

- **Authentication** — Login/Register with JWT
- **Check-in/Check-out** — Real-time clock, one-click absen
- **Dashboard** — Stats, charts, recent activity
- **Riwayat** — Weekly calendar view
- **Cuti** — Leave request & approval
- **Laporan** — Attendance report (admin)
- **Karyawan** — Employee management (admin)
- **Export CSV** — Download attendance data

## Demo

```
Admin:  admin@company.com / admin123
User:   budi@company.com / password123
```

## Quick Start

```bash
git clone https://github.com/farhanturu/absensi-karyawan.git
cd absensi-karyawan
npm install
npm start
```

Open `http://localhost:3000`

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** SQLite (better-sqlite3)
- **Auth:** JWT, bcryptjs
- **Frontend:** Vanilla JS, CSS Variables

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/register` | No | Register |
| GET | `/api/auth/me` | Yes | Get current user |
| POST | `/api/attendance/check-in` | Yes | Check in |
| POST | `/api/attendance/check-out` | Yes | Check out |
| GET | `/api/attendance/today` | Yes | Today's status |
| GET | `/api/attendance/history` | Yes | Attendance history |
| GET | `/api/attendance/report` | Admin | Daily report |
| GET | `/api/attendance/stats` | Admin | Statistics |
| GET | `/api/users` | Admin | List users |
| PUT | `/api/users/:id` | Admin | Update user |
| DELETE | `/api/users/:id` | Admin | Delete user |
| GET | `/api/leave` | Yes | My leave requests |
| POST | `/api/leave` | Yes | Submit leave |
| GET | `/api/leave/pending` | Admin | Pending leaves |
| PUT | `/api/leave/:id/approve` | Admin | Approve leave |
| PUT | `/api/leave/:id/reject` | Admin | Reject leave |
| GET | `/api/dashboard` | Yes | Dashboard data |
| GET | `/api/export/csv` | Admin | Export CSV |

## Project Structure

```
absensi-karyawan/
├── server.js           # Backend API
├── package.json        # Dependencies
├── absensi.db          # SQLite database (auto-created)
└── public/
    ├── index.html      # Frontend entry
    ├── style.css       # Styles
    └── app.js          # Frontend logic
```

## License

MIT

---

*Built by PaongLabs AI Agent*
