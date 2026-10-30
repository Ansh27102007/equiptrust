# EquipTrust | Institutional Resource & Equipment Sharing Platform

> **Problem Statement:** *Unlock Underused Equipment and Spaces*  
> **Challenge:** Build a trusted platform that helps institutions and communities safely share underused spaces, equipment, and technical resources.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Hackathon: 48-Hour Build](https://img.shields.io/badge/Hackathon-48h%20Build-emerald.svg)]()
[![Status: Fully Functional](https://img.shields.io/badge/Status-Complete%20End--to--End-green.svg)]()

---

## 📌 Executive Summary

Colleges, laboratories, and makerspaces frequently house state-of-the-art tools (Scanning Electron Microscopes, 5-Axis CNC Mills, SLA 3D Printers, Class 100 Cleanrooms) that remain unused 50–70% of evenings and weekends. Meanwhile, student researchers, creators, and indie hardware teams cannot afford commercial rates. Traditional room-booking tools fail because they ignore **trust, safety prerequisites, condition verification, and anti-monopolization**.

**EquipTrust** is an institutional resource-sharing platform engineered with a strict **10-step chain of custody**, **automated safety prerequisite gating**, an **anti-hoarding fair allocation engine**, and **before-and-after condition reporting**.

---

## 🚀 Live Demo & Quick Launch

### Quick Local Run (Python 3)
```bash
# Clone the repository
git clone https://github.com/your-username/equiptrust.git
cd equiptrust

# Start the application server (runs backend API & serves frontend)
python serve.py
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.

> **Zero Dependencies Required:** Runs on pure Python standard library (`http.server`, `sqlite3`, `json`) with pre-seeded SQLite database (`equiptrust.db`).

---

## 🏆 Hackathon 10-Step Workflow Matrix

EquipTrust implements the complete resource-sharing lifecycle mandated by the hackathon:

```
[1. Owner Lists Resource] ──> [2. User Discovers & Checks Eligibility]
            │                                       │
            ▼                                       ▼
[5. Owner Reviews & Allocates] <── [4. System Verifies Quota/Certs] <── [3. User Submits Request]
            │
            ├─► Approved: [7. Digital Check-In: Before Photo & Safety Checklist]
            │                   │
            │                   ▼
            │             [8. Digital Return: After Photo, Consumables & AI Delta]
            │                   │
            │                   ├─► Nominal: [10. Immutable Audit Ledger Logged]
            │                   │
            │                   └─► Issue Found: [9. Damage / Delay Incident Ticket]
            │
            └─► Waitlisted / Rejected: [Explainable Priority Formula & Feedback]
```

1. **Owner Listing**: Lab managers define equipment specs, deposit requirements, hourly slots, and mandatory safety qualifications.
2. **Discovery & Smart Search**: Real-time filtering by category, laboratory, and **"Eligible For Me"** badge.
3. **Booking Request**: User provides project title, material safety statement, and time slot.
4. **Automated Safety Gate**: Real-time verification of user certifications (e.g. *CNC Level 1*, *Bio/Radiation L2*) and rolling weekly quota limits.
5. **Lab Manager Review**: Competing requests evaluated side-by-side with transparent priority scores.
6. **Allocation & Waitlist**: One-click approval, rejection with auditable notes, or automatic waitlist position assignment.
7. **Digital Check-In**: User records pre-flight condition photo, verifies safety switches, and logs initial hour meter reading.
8. **Digital Return & Handover**: Post-operational inspection, return photo, consumable logging, and AI delta comparison.
9. **Damage / Delay Handling**: Immediate incident reporting with severity levels, photos, and maintenance flagging.
10. **Tamper-Evident Audit Trail**: Immutable chronological ledger documenting every action, actor, timestamp, and condition report.

---

## ⚖️ Fair Allocation & Anti-Monopolization Engine

To prevent individual research groups from hoarding limited high-value tools, EquipTrust enforces:
- **Weekly Rolling Quotas:** Hard cap of 8.0 peak hours/week per student researcher across shared equipment.
- **Explainable Priority Scoring:** Contested slots resolved via:
  $$\text{Priority Score} = \text{Base (100)} - 5 \times (\text{Hours Used}) + 15 \times (\text{First-Time Bonus}) + 10 \times (\text{Curricular Deadline})$$
- **Transparent Waitlist Escalation:** Real-time queue position indicators with automated promotion upon prior cancellation.

---

## 🧑‍🔬 1-Click Judge Personas

Built into the top evaluation banner for instant testing:
- **Alex Rivera (Student Researcher):** Holds *CNC Level 1* certification; eligible for Haas CNC Mill & Formlabs SLA 3D Printer.
- **Maya Chen (Biomedical Grad):** Holds *Radiation & Bio Safety L2* and *SEM Imaging Specialist*; eligible for Electron Microscope.
- **Jordan Smith (New Student):** Uncertified; demonstrates automated safety gating when attempting to book hazardous tools.
- **Dr. Evelyn Vance (Lab Manager & Owner):** Reviews requests, inspects equipment, manages fleet health, and resolves incidents.
- **Marcus Thorne (Safety & Compliance Officer):** Audits compliance, inspects chain of custody, and reviews incident tickets.

---

## 🛠️ System Architecture & Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend UI** | HTML5, Tailwind CSS, Lucide Icons, JavaScript (ES6+) | Institutional aesthetic, reactive tab routing, photo capture simulation, responsive modals. |
| **Backend API** | Python Standard Library (`http.server`, `socketserver`) | Zero-dependency REST API endpoints (`/api/resources`, `/api/bookings`, `/api/checkin`, `/api/checkout`, etc.). |
| **Database** | SQLite3 (`equiptrust.db`) | Relational persistence for Users, Resources, Bookings, Condition Reports, Incidents, and Audit Logs. |
| **Resilience Engine** | Dual-Engine State Sync | Automatically uses SQLite REST API when connected to `serve.py`; gracefully falls back to local memory if run statically. |

---

## 📋 Repository Structure

```
equiptrust/
├── backend.py                  # Core SQLite schema, seed data, and REST API handlers
├── serve.py                    # Server launcher with auto-browser launch
├── index.html                  # Main SPA interface with top persona switcher & modals
├── app.js                      # Application state machine, 10-step lifecycle, and API client
├── styles.css                  # Custom styling, status badges, and typography
├── equiptrust.db               # Pre-seeded SQLite database
├── SUBMISSION_DOCUMENTATION.md # Comprehensive 11-point project documentation report
└── README.md                   # Repository documentation
```

---

## 👤 Solo Developer & Participant Information

- **Participant Name:** Ansh
- **Role:** Solo Full-Stack Engineer, System Architect & UI/UX Designer
- **Personal Contribution:** Designed and built the entire system end-to-end within the 48-hour hackathon window, including the database schema, 10-step lifecycle state machine, fair allocation scoring algorithm, interactive condition reporting modules, and documentation.
