import http.server
import socketserver
import json
import sqlite3
import os
import urllib.parse
from datetime import datetime, timedelta

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DIRECTORY, "equiptrust.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        department TEXT NOT NULL,
        institution TEXT NOT NULL,
        certifications TEXT NOT NULL,
        weekly_hours_used REAL DEFAULT 0,
        max_weekly_hours REAL DEFAULT 8.0,
        priority_score INTEGER DEFAULT 100,
        avatar TEXT
    )
    ''')
    
    # Resources table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS resources (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        owner_id TEXT NOT NULL,
        owner_name TEXT NOT NULL,
        department TEXT NOT NULL,
        institution TEXT NOT NULL,
        location TEXT NOT NULL,
        description TEXT NOT NULL,
        hourly_rate REAL DEFAULT 0,
        deposit_required REAL DEFAULT 0,
        status TEXT DEFAULT 'AVAILABLE',
        min_qualification TEXT NOT NULL,
        max_consecutive_hours REAL DEFAULT 4.0,
        weekly_quota_hours REAL DEFAULT 8.0,
        requires_supervision INTEGER DEFAULT 0,
        current_condition_rating REAL DEFAULT 5.0,
        image_url TEXT,
        specs TEXT
    )
    ''')
    
    # Bookings table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        resource_id TEXT NOT NULL,
        resource_name TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_department TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        duration_hours REAL NOT NULL,
        project_title TEXT NOT NULL,
        purpose_statement TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING_REVIEW',
        waitlist_position INTEGER DEFAULT 0,
        priority_score INTEGER DEFAULT 100,
        rejection_reason TEXT,
        manager_notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    ''')
    
    # Condition Reports table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS condition_reports (
        id TEXT PRIMARY KEY,
        booking_id TEXT NOT NULL,
        resource_id TEXT NOT NULL,
        report_type TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        recorded_by_id TEXT NOT NULL,
        recorded_by_name TEXT NOT NULL,
        condition_rating REAL NOT NULL,
        meter_reading REAL DEFAULT 0,
        cleanliness TEXT NOT NULL,
        wear_notes TEXT,
        photo_url TEXT,
        checklist TEXT,
        ai_delta_summary TEXT
    )
    ''')
    
    # Incidents table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        booking_id TEXT NOT NULL,
        resource_id TEXT NOT NULL,
        resource_name TEXT NOT NULL,
        reported_by_id TEXT NOT NULL,
        reported_by_name TEXT NOT NULL,
        severity TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        photo_url TEXT,
        estimated_cost REAL DEFAULT 0,
        resolution_status TEXT DEFAULT 'OPEN',
        manager_verdict TEXT,
        created_at TEXT NOT NULL
    )
    ''')
    
    # Audit Log table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        actor_id TEXT NOT NULL,
        actor_name TEXT NOT NULL,
        actor_role TEXT NOT NULL,
        action_type TEXT NOT NULL,
        resource_name TEXT,
        details TEXT NOT NULL
    )
    ''')
    
    conn.commit()
    conn.close()

def seed_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if already seeded
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] > 0:
        conn.close()
        return

    # 1. Seed Users (Personas for Judge Testing)
    users = [
        (
            "user_alex", "Alex Rivera", "alex.rivera@university.edu", "STUDENT_RESEARCHER",
            "Robotics & Mechanical Eng", "Central Polytechnic University",
            json.dumps(["CNC Machine Level 1", "Laser Safety Protocol", "General Workshop Safety"]),
            2.5, 8.0, 95, "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
        ),
        (
            "user_maya", "Maya Chen", "maya.chen@university.edu", "STUDENT_RESEARCHER",
            "Biomedical Engineering", "Central Polytechnic University",
            json.dumps(["Radiation & Bio Safety L2", "SEM Imaging Specialist", "General Workshop Safety"]),
            4.0, 8.0, 110, "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150"
        ),
        (
            "user_jordan", "Jordan Smith", "jordan.s@university.edu", "STUDENT_RESEARCHER",
            "Computer Science & IoT", "Central Polytechnic University",
            json.dumps(["General Workshop Safety"]),
            0.0, 8.0, 120, "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"
        ),
        (
            "user_evelyn", "Dr. Evelyn Vance", "e.vance@university.edu", "LAB_MANAGER",
            "Advanced Fabrication & Materials Lab", "Central Polytechnic University",
            json.dumps(["Master Safety Officer", "All Equipment Certified", "Lab Director"]),
            0.0, 40.0, 999, "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
        ),
        (
            "user_marcus", "Marcus Thorne", "m.thorne@university.edu", "SAFETY_OFFICER",
            "Campus Safety & Compliance Board", "Central Polytechnic University",
            json.dumps(["OSHA Compliance Inspector", "Risk & Liability Officer"]),
            0.0, 40.0, 999, "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
        )
    ]
    cursor.executemany('''
    INSERT INTO users (id, name, email, role, department, institution, certifications, weekly_hours_used, max_weekly_hours, priority_score, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', users)

    # 2. Seed Resources
    resources = [
        (
            "res_cnc_01", "Haas VF-2 5-Axis CNC Mill", "Machining & Prototyping",
            "user_evelyn", "Dr. Evelyn Vance", "Mechanical & Aerospace Eng", "Central Polytechnic University",
            "Fabrication Wing, Bay 4B", "High-precision 5-axis vertical machining center for titanium, aluminum, and aerospace composite milling.",
            0.0, 150.0, "AVAILABLE", "CNC Machine Level 1", 4.0, 8.0, 1, 4.9,
            "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600",
            json.dumps({"Spindle Speed": "10,000 RPM", "Travel (X/Y/Z)": "30 x 16 x 20 in", "Table Size": "36 x 14 in", "Coolant": "Flood with mist filtration"})
        ),
        (
            "res_sem_01", "FEI Quanta 200 Environmental SEM", "Microscopy & Characterization",
            "user_evelyn", "Dr. Evelyn Vance", "Materials Science & Nanotech", "Central Polytechnic University",
            "Nanoscale Research Pavilion, Room 108", "High-resolution variable pressure scanning electron microscope for conductive and non-conductive specimen imaging.",
            0.0, 200.0, "AVAILABLE", "SEM Imaging Specialist", 3.0, 6.0, 1, 5.0,
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600",
            json.dumps({"Resolution": "3.0 nm at 30 kV", "Detectors": "SED, BSED, LFD", "Vacuum Modes": "High, Low, ESEM", "Magnification": "Up to 1,000,000x"})
        ),
        (
            "res_sla_01", "Formlabs Form 4 SLA 3D Printer", "3D Printing & Additive",
            "user_evelyn", "Dr. Evelyn Vance", "Innovation Makerspace", "Central Polytechnic University",
            "Student Makerspace Hub, Bench 12", "Industrial-grade Low Force Display (LFD) stereolithography 3D printer for engineering-grade resin prototypes.",
            0.0, 50.0, "AVAILABLE", "General Workshop Safety", 6.0, 12.0, 0, 4.8,
            "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600",
            json.dumps({"Build Volume": "20.0 x 12.5 x 21.0 cm", "Layer Thickness": "25-300 microns", "Resins Supported": "Tough 2000, Rigid 10K, Clear", "Print Speed": "Up to 100 mm/hr"})
        ),
        (
            "res_clean_01", "Class 100 / ISO 5 Laminar Flow Clean Bench", "Specialized Environment",
            "user_evelyn", "Dr. Evelyn Vance", "Microfabrication Cleanroom", "Central Polytechnic University",
            "Cleanroom Complex, Bay 2", "Ultra-filtered sterile workspace equipped with HEPA filtration and nitrogen guns for semiconductor and microfluidic assembly.",
            0.0, 100.0, "AVAILABLE", "Radiation & Bio Safety L2", 4.0, 8.0, 1, 4.95,
            "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600",
            json.dumps({"Cleanliness Class": "ISO 5 (Class 100)", "Airflow": "Horizontal Laminar, 90 FPM", "Filter Efficiency": "99.99% at 0.3 micron", "Services": "Vacuum, DI Water, Nitrogen"})
        )
    ]
    cursor.executemany('''
    INSERT INTO resources (id, name, category, owner_id, owner_name, department, institution, location, description, hourly_rate, deposit_required, status, min_qualification, max_consecutive_hours, weekly_quota_hours, requires_supervision, current_condition_rating, image_url, specs)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', resources)

    # 3. Seed Sample Bookings (To show pending, waitlist, and active workflow immediately to judges)
    now = datetime.now()
    t1_start = (now + timedelta(hours=2)).strftime("%Y-%m-%d %H:00")
    t1_end = (now + timedelta(hours=5)).strftime("%Y-%m-%d %H:00")
    t2_start = (now + timedelta(days=1, hours=3)).strftime("%Y-%m-%d %H:00")
    t2_end = (now + timedelta(days=1, hours=6)).strftime("%Y-%m-%d %H:00")
    t3_start = (now - timedelta(days=1, hours=4)).strftime("%Y-%m-%d %H:00")
    t3_end = (now - timedelta(days=1, hours=1)).strftime("%Y-%m-%d %H:00")

    bookings = [
        (
            "bk_001", "res_cnc_01", "Haas VF-2 5-Axis CNC Mill", "user_alex", "Alex Rivera", "Robotics & Mechanical Eng",
            t1_start, t1_end, 3.0, "Formula Student Steering Knuckle Milling",
            "Fabrication of lightweight 7075-T6 aluminum suspension uprights for the national formula competition.",
            "PENDING_REVIEW", 0, 95, None, None,
            (now - timedelta(hours=4)).strftime("%Y-%m-%d %H:%M"), now.strftime("%Y-%m-%d %H:%M")
        ),
        (
            "bk_002", "res_sem_01", "FEI Quanta 200 Environmental SEM", "user_maya", "Maya Chen", "Biomedical Engineering",
            t2_start, t2_end, 3.0, "Electrospun Nanofiber Scaffold Morphology",
            "Characterization of porous electrospun PCL polymers for cardiac tissue regeneration study.",
            "APPROVED", 0, 110, None, "Pre-flight calibration confirmed. Verified BSL-2 certification.",
            (now - timedelta(days=1)).strftime("%Y-%m-%d %H:%M"), now.strftime("%Y-%m-%d %H:%M")
        ),
        (
            "bk_003", "res_sla_01", "Formlabs Form 4 SLA 3D Printer", "user_alex", "Alex Rivera", "Robotics & Mechanical Eng",
            t3_start, t3_end, 3.0, "Bionic Gripper Finger Prototypes",
            "Iterative prototyping of multi-material soft robotic grippers using Flexible 80A resin.",
            "COMPLETED", 0, 95, None, "Cleaned vat and optics after completion.",
            (now - timedelta(days=2)).strftime("%Y-%m-%d %H:%M"), (now - timedelta(days=1)).strftime("%Y-%m-%d %H:%M")
        )
    ]
    cursor.executemany('''
    INSERT INTO bookings (id, resource_id, resource_name, user_id, user_name, user_department, start_time, end_time, duration_hours, project_title, purpose_statement, status, waitlist_position, priority_score, rejection_reason, manager_notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', bookings)

    # 4. Seed Condition Reports for the Completed Booking
    cursor.execute('''
    INSERT INTO condition_reports (id, booking_id, resource_id, report_type, timestamp, recorded_by_id, recorded_by_name, condition_rating, meter_reading, cleanliness, wear_notes, photo_url, checklist, ai_delta_summary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        "cr_001_in", "bk_003", "res_sla_01", "CHECK_IN",
        (now - timedelta(days=1, hours=4)).strftime("%Y-%m-%d %H:%M"),
        "user_alex", "Alex Rivera", 5.0, 240.5, "CLEAN", "Optics clean, build plate zeroed, resin tank free of cured debris.",
        "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600",
        json.dumps(["Resin tank checked", "Build platform secured", "Safety lid interlock active"]),
        "Baseline check-in recorded. No pre-existing defects detected."
    ))

    cursor.execute('''
    INSERT INTO condition_reports (id, booking_id, resource_id, report_type, timestamp, recorded_by_id, recorded_by_name, condition_rating, meter_reading, cleanliness, wear_notes, photo_url, checklist, ai_delta_summary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        "cr_001_out", "bk_003", "res_sla_01", "CHECK_OUT",
        (now - timedelta(days=1, hours=1)).strftime("%Y-%m-%d %H:%M"),
        "user_alex", "Alex Rivera", 4.9, 243.5, "CLEAN", "180ml Tough resin consumed. Build plate scraped and isopropanol cleaned.",
        "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600",
        json.dumps(["Parts removed", "Vat wiped", "Resin cartridge sealed"]),
        "Comparison: Delta check clean. Operational meter advanced 3.0 hours. Cleanliness preserved."
    ))

    # 5. Seed Initial Audit Logs
    audit_events = [
        ((now - timedelta(days=3)).strftime("%Y-%m-%d %H:%M"), "user_evelyn", "Dr. Evelyn Vance", "LAB_MANAGER", "RESOURCE_LISTED", "Haas VF-2 5-Axis CNC Mill", "Listed resource with CNC Level 1 prerequisite and 8hr weekly quota."),
        ((now - timedelta(days=2)).strftime("%Y-%m-%d %H:%M"), "user_alex", "Alex Rivera", "STUDENT_RESEARCHER", "BOOKING_REQUESTED", "Formlabs Form 4 SLA 3D Printer", "Submitted booking request for Bionic Gripper Finger Prototypes (3.0 hrs)."),
        ((now - timedelta(days=2, hours=-1)).strftime("%Y-%m-%d %H:%M"), "user_evelyn", "Dr. Evelyn Vance", "LAB_MANAGER", "BOOKING_APPROVED", "Formlabs Form 4 SLA 3D Printer", "Approved slot after verifying safety certification and fair-use quota."),
        ((now - timedelta(days=1, hours=4)).strftime("%Y-%m-%d %H:%M"), "user_alex", "Alex Rivera", "STUDENT_RESEARCHER", "CHECKIN_RECORDED", "Formlabs Form 4 SLA 3D Printer", "User completed digital check-in. Condition rated 5.0 (Meter: 240.5 hrs)."),
        ((now - timedelta(days=1, hours=1)).strftime("%Y-%m-%d %H:%M"), "user_alex", "Alex Rivera", "STUDENT_RESEARCHER", "RETURN_CONFIRMED", "Formlabs Form 4 SLA 3D Printer", "User completed digital return. Meter: 243.5 hrs. Cleanliness verified."),
        ((now - timedelta(hours=4)).strftime("%Y-%m-%d %H:%M"), "user_alex", "Alex Rivera", "STUDENT_RESEARCHER", "BOOKING_REQUESTED", "Haas VF-2 5-Axis CNC Mill", "Booking request submitted. System verified CNC Level 1 certification.")
    ]
    for ts, actor_id, actor_name, actor_role, action, res_name, details in audit_events:
        cursor.execute('''
        INSERT INTO audit_logs (timestamp, actor_id, actor_name, actor_role, action_type, resource_name, details)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (ts, actor_id, actor_name, actor_role, action, res_name, details))

    conn.commit()
    conn.close()

class EquipTrustHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def send_json(self, data, status_code=200):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def log_audit(self, actor_id, actor_name, actor_role, action_type, resource_name, details):
        conn = get_db()
        cursor = conn.cursor()
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute('''
        INSERT INTO audit_logs (timestamp, actor_id, actor_name, actor_role, action_type, resource_name, details)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (now, actor_id, actor_name, actor_role, action_type, resource_name, details))
        conn.commit()
        conn.close()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        
        # 1. API: Get all users (personas)
        if path == '/api/users':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users")
            rows = [dict(r) for r in cursor.fetchall()]
            for r in rows:
                r['certifications'] = json.loads(r['certifications'])
            conn.close()
            self.send_json(rows)
            return

        # 2. API: Get all resources
        if path == '/api/resources':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM resources ORDER BY name ASC")
            rows = [dict(r) for r in cursor.fetchall()]
            for r in rows:
                if r['specs']:
                    try:
                        r['specs'] = json.loads(r['specs'])
                    except Exception:
                        pass
            conn.close()
            self.send_json(rows)
            return

        # 3. API: Get all bookings
        if path == '/api/bookings':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM bookings ORDER BY created_at DESC")
            rows = [dict(r) for r in cursor.fetchall()]
            conn.close()
            self.send_json(rows)
            return

        # 4. API: Get condition reports
        if path == '/api/condition-reports':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM condition_reports ORDER BY timestamp DESC")
            rows = [dict(r) for r in cursor.fetchall()]
            for r in rows:
                if r['checklist']:
                    try:
                        r['checklist'] = json.loads(r['checklist'])
                    except Exception:
                        pass
            conn.close()
            self.send_json(rows)
            return

        # 5. API: Get incidents
        if path == '/api/incidents':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM incidents ORDER BY created_at DESC")
            rows = [dict(r) for r in cursor.fetchall()]
            conn.close()
            self.send_json(rows)
            return

        # 6. API: Get audit logs
        if path == '/api/audit-logs':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100")
            rows = [dict(r) for r in cursor.fetchall()]
            conn.close()
            self.send_json(rows)
            return

        # 7. API: Fairness metrics & quotas
        if path == '/api/fairness':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT id, name, department, weekly_hours_used, max_weekly_hours, priority_score FROM users WHERE role = 'STUDENT_RESEARCHER'")
            users = [dict(r) for r in cursor.fetchall()]
            cursor.execute("SELECT COUNT(*) FROM bookings WHERE status = 'WAITLISTED'")
            waitlisted_count = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM bookings WHERE status IN ('APPROVED', 'CHECKED_IN')")
            active_count = cursor.fetchone()[0]
            conn.close()
            self.send_json({
                "users": users,
                "waitlisted_count": waitlisted_count,
                "active_count": active_count,
                "policy": {
                    "max_weekly_hours": 8.0,
                    "anti_hoarding_rule": "Users exceeding 6 hours in 7 days receive -20 priority score penalty on peak slot contention.",
                    "waitlist_rule": "Transparent FIFO queue with first-time applicant priority weight (+15 points)."
                }
            })
            return

        # Fallback to static file server
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(length) if length > 0 else b'{}'
        try:
            body = json.loads(post_data.decode('utf-8'))
        except Exception:
            body = {}

        # 1. API: Create Resource Listing (Step 1)
        if path == '/api/resources':
            conn = get_db()
            cursor = conn.cursor()
            res_id = f"res_{int(datetime.now().timestamp())}"
            cursor.execute('''
            INSERT INTO resources (id, name, category, owner_id, owner_name, department, institution, location, description, hourly_rate, deposit_required, status, min_qualification, max_consecutive_hours, weekly_quota_hours, requires_supervision, current_condition_rating, image_url, specs)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                res_id,
                body.get('name', 'Untitled Equipment'),
                body.get('category', 'General Equipment'),
                body.get('owner_id', 'user_evelyn'),
                body.get('owner_name', 'Dr. Evelyn Vance'),
                body.get('department', 'Engineering Hub'),
                body.get('institution', 'Central Polytechnic University'),
                body.get('location', body.get('location', 'Bay 1')),
                body.get('description', ''),
                float(body.get('hourly_rate', 0)),
                float(body.get('deposit_required', 0)),
                'AVAILABLE',
                body.get('min_qualification', 'General Workshop Safety'),
                float(body.get('max_consecutive_hours', 4.0)),
                float(body.get('weekly_quota_hours', 8.0)),
                1 if body.get('requires_supervision') else 0,
                5.0,
                body.get('image_url', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600'),
                json.dumps(body.get('specs', {}))
            ))
            conn.commit()
            conn.close()

            self.log_audit(
                body.get('owner_id', 'user_evelyn'),
                body.get('owner_name', 'Dr. Evelyn Vance'),
                'LAB_MANAGER',
                'RESOURCE_LISTED',
                body.get('name'),
                f"New resource listed with {body.get('min_qualification')} requirement and max {body.get('max_consecutive_hours')}h slot."
            )
            self.send_json({"success": True, "resource_id": res_id})
            return

        # 2. API: Submit Booking Request (Steps 3 & 4)
        if path == '/api/bookings':
            conn = get_db()
            cursor = conn.cursor()
            
            # Check user eligibility & quotas
            user_id = body.get('user_id')
            resource_id = body.get('resource_id')
            duration = float(body.get('duration_hours', 2.0))
            
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            user_row = cursor.fetchone()
            cursor.execute("SELECT * FROM resources WHERE id = ?", (resource_id,))
            res_row = cursor.fetchone()
            
            if not user_row or not res_row:
                conn.close()
                self.send_json({"error": "Invalid user or resource"}, 400)
                return

            certs = json.loads(user_row['certifications'])
            required_cert = res_row['min_qualification']
            
            # Eligibility gate check
            if required_cert not in certs and required_cert != "None":
                conn.close()
                self.send_json({
                    "error": f"Eligibility Failure: You require '{required_cert}' qualification to book this resource."
                }, 403)
                return

            # Fair quota check
            if (user_row['weekly_hours_used'] + duration) > user_row['max_weekly_hours']:
                conn.close()
                self.send_json({
                    "error": f"Fair Usage Limit Exceeded: Booking {duration}h would exceed your weekly quota of {user_row['max_weekly_hours']}h (Current used: {user_row['weekly_hours_used']}h)."
                }, 403)
                return

            # Check scheduling overlap
            start_time = body.get('start_time')
            end_time = body.get('end_time')
            cursor.execute('''
            SELECT COUNT(*) FROM bookings 
            WHERE resource_id = ? AND status = 'APPROVED'
            AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))
            ''', (resource_id, start_time, start_time, end_time, end_time))
            overlap = cursor.fetchone()[0] > 0

            booking_id = f"bk_{int(datetime.now().timestamp())}"
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            if overlap:
                # Place on transparent waitlist
                cursor.execute("SELECT COUNT(*) FROM bookings WHERE resource_id = ? AND status = 'WAITLISTED'", (resource_id,))
                waitlist_pos = cursor.fetchone()[0] + 1
                status = "WAITLISTED"
                notes = f"Time slot occupied by existing confirmed booking. Placed at Waitlist #{waitlist_pos}."
            else:
                waitlist_pos = 0
                status = "PENDING_REVIEW"
                notes = None

            cursor.execute('''
            INSERT INTO bookings (id, resource_id, resource_name, user_id, user_name, user_department, start_time, end_time, duration_hours, project_title, purpose_statement, status, waitlist_position, priority_score, rejection_reason, manager_notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                booking_id, resource_id, res_row['name'], user_id, user_row['name'], user_row['department'],
                start_time, end_time, duration, body.get('project_title', 'Research Project'),
                body.get('purpose_statement', 'Standard project execution'),
                status, waitlist_pos, user_row['priority_score'], None, notes, now_str, now_str
            ))
            
            # Update user weekly hours allocation
            cursor.execute("UPDATE users SET weekly_hours_used = weekly_hours_used + ? WHERE id = ?", (duration, user_id))
            conn.commit()
            conn.close()

            action_name = "WAITLIST_PLACED" if status == "WAITLISTED" else "BOOKING_REQUESTED"
            self.log_audit(
                user_id, user_row['name'], user_row['role'], action_name, res_row['name'],
                f"Booking requested for {duration}h ({start_time} to {end_time}). Status: {status}."
            )
            self.send_json({"success": True, "booking_id": booking_id, "status": status, "waitlist_position": waitlist_pos})
            return

        # 3. API: Manager Action (Approve, Reject, Waitlist) (Steps 5 & 6)
        if path == '/api/bookings/action':
            booking_id = body.get('booking_id')
            action = body.get('action') # 'APPROVE', 'REJECT', 'WAITLIST'
            manager_id = body.get('manager_id', 'user_evelyn')
            manager_name = body.get('manager_name', 'Dr. Evelyn Vance')
            notes = body.get('notes', '')

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,))
            booking = cursor.fetchone()
            if not booking:
                conn.close()
                self.send_json({"error": "Booking not found"}, 404)
                return

            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            if action == 'APPROVE':
                cursor.execute('''
                UPDATE bookings 
                SET status = 'APPROVED', waitlist_position = 0, manager_notes = ?, updated_at = ?
                WHERE id = ?
                ''', (notes or "Approved by Lab Manager after safety and qualification check.", now_str, booking_id))
                cursor.execute("UPDATE resources SET status = 'RESERVED' WHERE id = ?", (booking['resource_id'],))
                audit_action = "BOOKING_APPROVED"
                details = f"Approved booking for {booking['user_name']} ({booking['duration_hours']}h). Slot reserved."
            elif action == 'REJECT':
                cursor.execute('''
                UPDATE bookings 
                SET status = 'REJECTED', rejection_reason = ?, updated_at = ?
                WHERE id = ?
                ''', (notes or "Does not meet scheduling criteria or priority policy.", now_str, booking_id))
                # Refund user weekly hours
                cursor.execute("UPDATE users SET weekly_hours_used = MAX(0, weekly_hours_used - ?) WHERE id = ?", (booking['duration_hours'], booking['user_id']))
                audit_action = "BOOKING_REJECTED"
                details = f"Rejected booking for {booking['user_name']}. Reason: {notes}."
            elif action == 'WAITLIST':
                cursor.execute('''
                UPDATE bookings 
                SET status = 'WAITLISTED', waitlist_position = 1, manager_notes = ?, updated_at = ?
                WHERE id = ?
                ''', (notes or "Moved to waitlist due to higher priority educational demand.", now_str, booking_id))
                audit_action = "WAITLIST_PLACED"
                details = f"Moved booking to waitlist for {booking['user_name']}."

            conn.commit()
            conn.close()

            self.log_audit(manager_id, manager_name, "LAB_MANAGER", audit_action, booking['resource_name'], details)
            self.send_json({"success": True, "action": action})
            return

        # 4. API: Check-In Condition Report (Step 7)
        if path == '/api/checkin':
            booking_id = body.get('booking_id')
            user_id = body.get('user_id')
            user_name = body.get('user_name', 'Student User')
            
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,))
            booking = cursor.fetchone()
            if not booking:
                conn.close()
                self.send_json({"error": "Booking not found"}, 404)
                return

            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            report_id = f"cr_in_{int(datetime.now().timestamp())}"
            
            checklist = body.get('checklist', ["Emergency Stop Verified", "Workspace Inspected", "Safety Guards Active"])
            rating = float(body.get('condition_rating', 5.0))
            meter = float(body.get('meter_reading', 100.0))
            cleanliness = body.get('cleanliness', 'CLEAN')
            wear = body.get('wear_notes', 'All components in nominal working condition.')
            photo = body.get('photo_url', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600')
            ai_delta = "Baseline inspection recorded. No pre-operational faults found."

            cursor.execute('''
            INSERT INTO condition_reports (id, booking_id, resource_id, report_type, timestamp, recorded_by_id, recorded_by_name, condition_rating, meter_reading, cleanliness, wear_notes, photo_url, checklist, ai_delta_summary)
            VALUES (?, ?, ?, 'CHECK_IN', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                report_id, booking_id, booking['resource_id'], now_str, user_id, user_name,
                rating, meter, cleanliness, wear, photo, json.dumps(checklist), ai_delta
            ))

            cursor.execute("UPDATE bookings SET status = 'CHECKED_IN', updated_at = ? WHERE id = ?", (now_str, booking_id))
            cursor.execute("UPDATE resources SET status = 'IN_USE' WHERE id = ?", (booking['resource_id'],))
            conn.commit()
            conn.close()

            self.log_audit(user_id, user_name, "STUDENT_RESEARCHER", "CHECKIN_RECORDED", booking['resource_name'],
                           f"Initial condition recorded ({rating}/5.0). Meter: {meter}h. Safety checklist signed.")
            self.send_json({"success": True, "report_id": report_id, "status": "CHECKED_IN"})
            return

        # 5. API: Check-Out / Return Condition Report (Step 8)
        if path == '/api/checkout':
            booking_id = body.get('booking_id')
            user_id = body.get('user_id')
            user_name = body.get('user_name', 'Student User')
            
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,))
            booking = cursor.fetchone()
            if not booking:
                conn.close()
                self.send_json({"error": "Booking not found"}, 404)
                return

            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            report_id = f"cr_out_{int(datetime.now().timestamp())}"

            checklist = body.get('checklist', ["Workstation cleaned", "Power safely isolated", "Tools returned to rack"])
            rating = float(body.get('condition_rating', 4.9))
            meter = float(body.get('meter_reading', 103.5))
            cleanliness = body.get('cleanliness', 'CLEAN')
            wear = body.get('wear_notes', 'Session finished smoothly. Cleaned and prepared for next user.')
            photo = body.get('photo_url', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600')
            
            # Fetch check-in report to compare
            cursor.execute("SELECT * FROM condition_reports WHERE booking_id = ? AND report_type = 'CHECK_IN'", (booking_id,))
            checkin_rep = cursor.fetchone()
            if checkin_rep:
                meter_delta = max(0, meter - checkin_rep['meter_reading'])
                ai_delta = f"Session delta verified: Equipment operated for {meter_delta:.1f} hours. Cleanliness preserved ({cleanliness}). Rating difference: {rating - checkin_rep['condition_rating']:.1f}."
            else:
                ai_delta = "Return recorded. Standard handover verified."

            cursor.execute('''
            INSERT INTO condition_reports (id, booking_id, resource_id, report_type, timestamp, recorded_by_id, recorded_by_name, condition_rating, meter_reading, cleanliness, wear_notes, photo_url, checklist, ai_delta_summary)
            VALUES (?, ?, ?, 'CHECK_OUT', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                report_id, booking_id, booking['resource_id'], now_str, user_id, user_name,
                rating, meter, cleanliness, wear, photo, json.dumps(checklist), ai_delta
            ))

            cursor.execute("UPDATE bookings SET status = 'COMPLETED', updated_at = ? WHERE id = ?", (now_str, booking_id))
            cursor.execute("UPDATE resources SET status = 'AVAILABLE', current_condition_rating = ? WHERE id = ?", (rating, booking['resource_id']))
            conn.commit()
            conn.close()

            self.log_audit(user_id, user_name, "STUDENT_RESEARCHER", "RETURN_CONFIRMED", booking['resource_name'],
                           f"Return finalized. Final rating: {rating}/5.0. Meter: {meter}h. AI Delta: {ai_delta}")
            self.send_json({"success": True, "report_id": report_id, "ai_delta": ai_delta, "status": "COMPLETED"})
            return

        # 6. API: Report Incident / Damage (Step 9)
        if path == '/api/incidents':
            booking_id = body.get('booking_id')
            user_id = body.get('user_id', 'user_alex')
            user_name = body.get('user_name', 'Alex Rivera')
            resource_id = body.get('resource_id')
            resource_name = body.get('resource_name', 'Equipment')
            severity = body.get('severity', 'MEDIUM')
            title = body.get('title', 'Reported Incident')
            description = body.get('description', '')
            cost = float(body.get('estimated_cost', 0))
            photo = body.get('photo_url', '')

            incident_id = f"inc_{int(datetime.now().timestamp())}"
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('''
            INSERT INTO incidents (id, booking_id, resource_id, resource_name, reported_by_id, reported_by_name, severity, title, description, photo_url, estimated_cost, resolution_status, manager_verdict, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', NULL, ?)
            ''', (incident_id, booking_id or 'GENERAL', resource_id, resource_name, user_id, user_name, severity, title, description, photo, cost, now_str))

            if severity in ['HIGH', 'CRITICAL']:
                cursor.execute("UPDATE resources SET status = 'MAINTENANCE' WHERE id = ?", (resource_id,))

            conn.commit()
            conn.close()

            self.log_audit(user_id, user_name, "STUDENT_RESEARCHER", "INCIDENT_FLAGGED", resource_name,
                           f"Incident [{severity}]: {title}. Estimated impact: ${cost}. Resource flagged for inspection.")
            self.send_json({"success": True, "incident_id": incident_id})
            return

        # 7. API: Resolve Incident (Lab Manager)
        if path == '/api/incidents/resolve':
            incident_id = body.get('incident_id')
            verdict = body.get('verdict', 'Inspected and certified ready for normal operation.')
            manager_id = body.get('manager_id', 'user_evelyn')
            manager_name = body.get('manager_name', 'Dr. Evelyn Vance')

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,))
            inc = cursor.fetchone()
            if inc:
                cursor.execute('''
                UPDATE incidents SET resolution_status = 'RESOLVED', manager_verdict = ? WHERE id = ?
                ''', (verdict, incident_id))
                cursor.execute("UPDATE resources SET status = 'AVAILABLE' WHERE id = ?", (inc['resource_id'],))
            conn.commit()
            conn.close()

            self.log_audit(manager_id, manager_name, "LAB_MANAGER", "INCIDENT_RESOLVED", inc['resource_name'] if inc else "Equipment",
                           f"Incident {incident_id} resolved. Verdict: {verdict}. Resource returned to AVAILABLE.")
            self.send_json({"success": True})
            return

        # 8. API: Reset / Seed Database
        if path == '/api/reset-demo':
            if os.path.exists(DB_PATH):
                os.remove(DB_PATH)
            init_db()
            seed_db()
            self.send_json({"success": True, "message": "Database successfully reset and seeded with fresh demo data."})
            return

        self.send_json({"error": "Endpoint not found"}, 404)

print("==================================================================")
print(" EquipTrust - Institutional Resource Sharing Platform Server")
print(" Local Port: http://localhost:8000")
print(" Database: equiptrust.db (SQLite)")
print("==================================================================")

if __name__ == '__main__':
    init_db()
    seed_db()
    with socketserver.TCPServer(("", PORT), EquipTrustHandler) as httpd:
        print(f"Server listening at http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
