/**
 * EquipTrust - Frontend Application State & Controller
 * Implements the complete 10-Step Institutional Resource Sharing Lifecycle
 */

// Application State
let currentUser = null;
let allUsers = [];
let allResources = [];
let allBookings = [];
let allConditionReports = [];
let allIncidents = [];
let allAuditLogs = [];
let fairnessPolicy = {};

let filterCategory = 'ALL';
let filterOnlyEligible = false;
let currentTab = 'catalog';

const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? ''
  : ''; // Relative API

// Sample equipment photos for photo simulation
const SAMPLE_PHOTOS = [
  "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600",
  "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600",
  "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600",
  "https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?w=600"
];

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadAllData();
  // Default to Alex (Student Researcher) for judge evaluation
  switchPersona('user_alex');
  lucide.createIcons();
});

// ============================================================
// DATA FETCHING & API LAYER
// ============================================================

async function loadAllData() {
  try {
    const [uRes, rRes, bRes, cRes, iRes, aRes, fRes] = await Promise.all([
      fetch('/api/users').then(r => r.json()),
      fetch('/api/resources').then(r => r.json()),
      fetch('/api/bookings').then(r => r.json()),
      fetch('/api/condition-reports').then(r => r.json()),
      fetch('/api/incidents').then(r => r.json()),
      fetch('/api/audit-logs').then(r => r.json()),
      fetch('/api/fairness').then(r => r.json())
    ]);

    allUsers = uRes;
    allResources = rRes;
    allBookings = bRes;
    allConditionReports = cRes;
    allIncidents = iRes;
    allAuditLogs = aRes;
    fairnessPolicy = fRes;

    renderActiveTab();
    updateBadges();
  } catch (err) {
    console.warn("API fetch error, falling back to local fallback data:", err);
    initFallbackData();
  }
}

// Fallback in case of static hosting without server
function initFallbackData() {
  allUsers = [
    {
      id: "user_alex", name: "Alex Rivera", email: "alex.rivera@university.edu", role: "STUDENT_RESEARCHER",
      department: "Robotics & Mechanical Eng", institution: "Central Polytechnic University",
      certifications: ["CNC Machine Level 1", "Laser Safety Protocol", "General Workshop Safety"],
      weekly_hours_used: 2.5, max_weekly_hours: 8.0, priority_score: 95,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    },
    {
      id: "user_maya", name: "Maya Chen", email: "maya.chen@university.edu", role: "STUDENT_RESEARCHER",
      department: "Biomedical Engineering", institution: "Central Polytechnic University",
      certifications: ["Radiation & Bio Safety L2", "SEM Imaging Specialist", "General Workshop Safety"],
      weekly_hours_used: 4.0, max_weekly_hours: 8.0, priority_score: 110,
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150"
    },
    {
      id: "user_jordan", name: "Jordan Smith", email: "jordan.s@university.edu", role: "STUDENT_RESEARCHER",
      department: "Computer Science & IoT", institution: "Central Polytechnic University",
      certifications: ["General Workshop Safety"],
      weekly_hours_used: 0.0, max_weekly_hours: 8.0, priority_score: 120,
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"
    },
    {
      id: "user_evelyn", name: "Dr. Evelyn Vance", email: "e.vance@university.edu", role: "LAB_MANAGER",
      department: "Advanced Fabrication & Materials Lab", institution: "Central Polytechnic University",
      certifications: ["Master Safety Officer", "All Equipment Certified", "Lab Director"],
      weekly_hours_used: 0.0, max_weekly_hours: 40.0, priority_score: 999,
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
    },
    {
      id: "user_marcus", name: "Marcus Thorne", email: "m.thorne@university.edu", role: "SAFETY_OFFICER",
      department: "Campus Safety & Compliance Board", institution: "Central Polytechnic University",
      certifications: ["OSHA Compliance Inspector", "Risk & Liability Officer"],
      weekly_hours_used: 0.0, max_weekly_hours: 40.0, priority_score: 999,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
    }
  ];

  allResources = [
    {
      id: "res_cnc_01", name: "Haas VF-2 5-Axis CNC Mill", category: "Machining & Prototyping",
      owner_id: "user_evelyn", owner_name: "Dr. Evelyn Vance", department: "Mechanical & Aerospace Eng",
      institution: "Central Polytechnic University", location: "Fabrication Wing, Bay 4B",
      description: "High-precision 5-axis vertical machining center for titanium, aluminum, and aerospace composite milling.",
      hourly_rate: 0.0, deposit_required: 150.0, status: "AVAILABLE", min_qualification: "CNC Machine Level 1",
      max_consecutive_hours: 4.0, weekly_quota_hours: 8.0, requires_supervision: 1, current_condition_rating: 4.9,
      image_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600",
      specs: { "Spindle Speed": "10,000 RPM", "Travel (X/Y/Z)": "30 x 16 x 20 in", "Table Size": "36 x 14 in", "Coolant": "Flood with mist filtration" }
    },
    {
      id: "res_sem_01", name: "FEI Quanta 200 Environmental SEM", category: "Microscopy & Characterization",
      owner_id: "user_evelyn", owner_name: "Dr. Evelyn Vance", department: "Materials Science & Nanotech",
      institution: "Central Polytechnic University", location: "Nanoscale Research Pavilion, Room 108",
      description: "High-resolution variable pressure scanning electron microscope for conductive and non-conductive specimen imaging.",
      hourly_rate: 0.0, deposit_required: 200.0, status: "AVAILABLE", min_qualification: "SEM Imaging Specialist",
      max_consecutive_hours: 3.0, weekly_quota_hours: 6.0, requires_supervision: 1, current_condition_rating: 5.0,
      image_url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600",
      specs: { "Resolution": "3.0 nm at 30 kV", "Detectors": "SED, BSED, LFD", "Vacuum Modes": "High, Low, ESEM", "Magnification": "Up to 1,000,000x" }
    },
    {
      id: "res_sla_01", name: "Formlabs Form 4 SLA 3D Printer", category: "3D Printing & Additive",
      owner_id: "user_evelyn", owner_name: "Dr. Evelyn Vance", department: "Innovation Makerspace",
      institution: "Central Polytechnic University", location: "Student Makerspace Hub, Bench 12",
      description: "Industrial-grade Low Force Display (LFD) stereolithography 3D printer for engineering-grade resin prototypes.",
      hourly_rate: 0.0, deposit_required: 50.0, status: "AVAILABLE", min_qualification: "General Workshop Safety",
      max_consecutive_hours: 6.0, weekly_quota_hours: 12.0, requires_supervision: 0, current_condition_rating: 4.8,
      image_url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600",
      specs: { "Build Volume": "20.0 x 12.5 x 21.0 cm", "Layer Thickness": "25-300 microns", "Resins Supported": "Tough 2000, Rigid 10K, Clear", "Print Speed": "Up to 100 mm/hr" }
    },
    {
      id: "res_clean_01", name: "Class 100 / ISO 5 Laminar Flow Clean Bench", category: "Specialized Environment",
      owner_id: "user_evelyn", owner_name: "Dr. Evelyn Vance", department: "Microfabrication Cleanroom",
      institution: "Central Polytechnic University", location: "Cleanroom Complex, Bay 2",
      description: "Ultra-filtered sterile workspace equipped with HEPA filtration and nitrogen guns for semiconductor and microfluidic assembly.",
      hourly_rate: 0.0, deposit_required: 100.0, status: "AVAILABLE", min_qualification: "Radiation & Bio Safety L2",
      max_consecutive_hours: 4.0, weekly_quota_hours: 8.0, requires_supervision: 1, current_condition_rating: 4.95,
      image_url: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600",
      specs: { "Cleanliness Class": "ISO 5 (Class 100)", "Airflow": "Horizontal Laminar, 90 FPM", "Filter Efficiency": "99.99% at 0.3 micron", "Services": "Vacuum, DI Water, Nitrogen" }
    }
  ];

  allBookings = [
    {
      id: "bk_001", resource_id: "res_cnc_01", resource_name: "Haas VF-2 5-Axis CNC Mill",
      user_id: "user_alex", user_name: "Alex Rivera", user_department: "Robotics & Mechanical Eng",
      start_time: "Today 14:00", end_time: "Today 17:00", duration_hours: 3.0,
      project_title: "Formula Student Steering Knuckle Milling",
      purpose_statement: "Fabrication of lightweight 7075-T6 aluminum suspension uprights.",
      status: "PENDING_REVIEW", waitlist_position: 0, priority_score: 95, rejection_reason: null, manager_notes: null,
      created_at: "2026-10-30 08:30"
    },
    {
      id: "bk_002", resource_id: "res_sem_01", resource_name: "FEI Quanta 200 Environmental SEM",
      user_id: "user_maya", user_name: "Maya Chen", user_department: "Biomedical Engineering",
      start_time: "Tomorrow 10:00", end_time: "Tomorrow 13:00", duration_hours: 3.0,
      project_title: "Electrospun Nanofiber Scaffold Morphology",
      purpose_statement: "Characterization of porous electrospun PCL polymers.",
      status: "APPROVED", waitlist_position: 0, priority_score: 110, rejection_reason: null, manager_notes: "Pre-flight calibration confirmed.",
      created_at: "2026-10-29 14:00"
    }
  ];

  allAuditLogs = [
    { id: 1, timestamp: "2026-10-30 11:00", actor_name: "Dr. Evelyn Vance", actor_role: "LAB_MANAGER", action_type: "RESOURCE_LISTED", resource_name: "Haas VF-2 5-Axis CNC Mill", details: "Resource listed with CNC Level 1 prerequisite and 8h quota." },
    { id: 2, timestamp: "2026-10-30 11:15", actor_name: "Alex Rivera", actor_role: "STUDENT_RESEARCHER", action_type: "BOOKING_REQUESTED", resource_name: "Haas VF-2 5-Axis CNC Mill", details: "Booking requested for 3.0h. CNC Level 1 verified." }
  ];

  allIncidents = [];
  fairnessPolicy = {
    users: allUsers.filter(u => u.role === 'STUDENT_RESEARCHER')
  };
}

// ============================================================
// PERSONA & USER CONTEXT SWITCHER
// ============================================================

function switchPersona(userId) {
  const user = allUsers.find(u => u.id === userId);
  if (!user) return;
  currentUser = user;

  // Highlight active button in top bar
  document.querySelectorAll('.persona-btn').forEach(btn => {
    btn.classList.remove('bg-sky-600', 'text-white', 'border-sky-400');
    btn.classList.add('bg-slate-800', 'text-slate-200', 'border-slate-700');
  });
  const activeBtn = document.getElementById(`btn-${userId}`);
  if (activeBtn) {
    activeBtn.classList.remove('bg-slate-800', 'text-slate-200', 'border-slate-700');
    activeBtn.classList.add('bg-sky-600', 'text-white', 'border-sky-400');
  }

  // Render user profile pill in header
  renderUserPill();
  renderActiveTab();
  updateBadges();

  showNotification(`Switched persona to ${currentUser.name} (${formatRole(currentUser.role)})`, 'info');
}

function formatRole(role) {
  switch (role) {
    case 'STUDENT_RESEARCHER': return 'Student Researcher';
    case 'LAB_MANAGER': return 'Lab Manager & Owner';
    case 'SAFETY_OFFICER': return 'Safety & Compliance Admin';
    default: return role;
  }
}

function renderUserPill() {
  const container = document.getElementById('active-user-pill');
  if (!container || !currentUser) return;

  const isStudent = currentUser.role === 'STUDENT_RESEARCHER';
  const quotaPercent = Math.min(100, Math.round((currentUser.weekly_hours_used / currentUser.max_weekly_hours) * 100));

  container.innerHTML = `
    <img src="${currentUser.avatar}" class="w-9 h-9 rounded-xl object-cover border border-slate-200">
    <div class="text-left">
      <div class="flex items-center gap-1.5">
        <span class="text-xs font-bold text-slate-900">${currentUser.name}</span>
        <span class="text-[10px] font-semibold px-1.5 py-0.2 rounded ${
          isStudent ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
        }">${formatRole(currentUser.role)}</span>
      </div>
      <div class="flex items-center gap-2 text-[11px] text-slate-500">
        <span>${currentUser.department}</span>
        ${isStudent ? `
          <span>•</span>
          <span class="font-medium ${quotaPercent >= 80 ? 'text-amber-600' : 'text-slate-600'}">
            Quota: ${currentUser.weekly_hours_used} / ${currentUser.max_weekly_hours}h
          </span>
        ` : ''}
      </div>
    </div>
  `;

  // Render user certs list in catalog filter
  const certsContainer = document.getElementById('user-certs-list');
  if (certsContainer) {
    certsContainer.innerHTML = currentUser.certifications.map(c => `
      <span class="inline-flex items-center px-2 py-0.5 rounded-md font-medium text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
        <i data-lucide="award" class="w-2.5 h-2.5 mr-1 text-sky-600"></i> ${c}
      </span>
    `).join('');
  }
  lucide.createIcons();
}

// ============================================================
// TAB NAVIGATION
// ============================================================

function showTab(tabId) {
  currentTab = tabId;

  // Toggle active styling on nav buttons
  document.querySelectorAll('.nav-tab').forEach(b => {
    b.classList.remove('text-sky-700', 'bg-sky-50', 'active');
    b.classList.add('text-slate-600');
  });
  const activeNav = document.getElementById(`tab-${tabId}`);
  if (activeNav) {
    activeNav.classList.add('text-sky-700', 'bg-sky-50', 'active');
    activeNav.classList.remove('text-slate-600');
  }

  // Toggle tab views
  document.querySelectorAll('.tab-view').forEach(v => v.classList.add('hidden'));
  const view = document.getElementById(`view-${tabId}`);
  if (view) view.classList.remove('hidden');

  renderActiveTab();
  lucide.createIcons();
}

function renderActiveTab() {
  switch (currentTab) {
    case 'catalog':
      renderResourceCatalog();
      break;
    case 'my-bookings':
      renderMyBookings();
      break;
    case 'manager':
      renderManagerDashboard();
      break;
    case 'fairness':
      renderFairnessView();
      break;
    case 'audit':
      renderAuditLogs();
      break;
  }
  lucide.createIcons();
}

function updateBadges() {
  // Pending bookings count for manager
  const pendingCount = allBookings.filter(b => b.status === 'PENDING_REVIEW').length;
  const badgeManager = document.getElementById('badge-manager-pending');
  if (badgeManager) {
    badgeManager.innerText = pendingCount;
    badgeManager.style.display = pendingCount > 0 ? 'inline-block' : 'none';
  }

  // My active bookings count
  if (currentUser) {
    const myCount = allBookings.filter(b => b.user_id === currentUser.id && ['APPROVED', 'PENDING_REVIEW', 'CHECKED_IN'].includes(b.status)).length;
    const badgeMy = document.getElementById('badge-my-bookings');
    if (badgeMy) {
      badgeMy.innerText = myCount;
      badgeMy.style.display = myCount > 0 ? 'inline-block' : 'none';
    }
  }
}

// ============================================================
// TAB 1: RESOURCE CATALOG & DISCOVERY (Steps 1 & 2)
// ============================================================

function filterResources() {
  const query = document.getElementById('search-input')?.value.toLowerCase() || '';
  filterCategory = document.getElementById('category-filter')?.value || 'ALL';
  renderResourceCatalog(query);
}

function toggleEligibleOnly() {
  filterOnlyEligible = !filterOnlyEligible;
  const btn = document.getElementById('filter-eligible-btn');
  if (btn) {
    if (filterOnlyEligible) {
      btn.classList.add('bg-emerald-50', 'border-emerald-300', 'text-emerald-800');
      btn.classList.remove('text-slate-600');
    } else {
      btn.classList.remove('bg-emerald-50', 'border-emerald-300', 'text-emerald-800');
      btn.classList.add('text-slate-600');
    }
  }
  renderResourceCatalog();
}

function checkUserEligibility(requiredCert) {
  if (!currentUser) return false;
  if (currentUser.role === 'LAB_MANAGER' || currentUser.role === 'SAFETY_OFFICER') return true;
  if (!requiredCert || requiredCert === 'None' || requiredCert === 'General Workshop Safety') return true;
  return currentUser.certifications.includes(requiredCert);
}

function renderResourceCatalog(searchQuery = '') {
  const container = document.getElementById('resource-grid');
  if (!container) return;

  let filtered = allResources.filter(res => {
    const matchesSearch = res.name.toLowerCase().includes(searchQuery) ||
                          res.category.toLowerCase().includes(searchQuery) ||
                          res.description.toLowerCase().includes(searchQuery) ||
                          res.department.toLowerCase().includes(searchQuery);
    const matchesCat = filterCategory === 'ALL' || res.category === filterCategory;
    const isEligible = checkUserEligibility(res.min_qualification);
    const matchesEligible = !filterOnlyEligible || isEligible;
    return matchesSearch && matchesCat && matchesEligible;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 p-8">
        <i data-lucide="package-search" class="w-10 h-10 text-slate-300 mx-auto mb-2"></i>
        <h4 class="font-bold text-slate-700">No equipment matches your filters</h4>
        <p class="text-xs text-slate-500 mt-1">Try relaxing your search terms or toggling "Eligible For Me".</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  container.innerHTML = filtered.map(res => {
    const isEligible = checkUserEligibility(res.min_qualification);
    const statusClass = `badge-${res.status.toLowerCase()}`;
    const statusLabel = res.status.replace('_', ' ');

    return `
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden card-shadow card-hover flex flex-col justify-between transition-all">
        <div>
          <!-- Resource Image & Header Badges -->
          <div class="relative aspect-video bg-slate-100 overflow-hidden">
            <img src="${res.image_url}" class="w-full h-full object-cover">
            <div class="absolute top-3 left-3 flex flex-wrap gap-1.5">
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusClass} flex items-center gap-1 shadow-sm">
                <span class="w-1.5 h-1.5 rounded-full ${res.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
                ${statusLabel}
              </span>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-slate-700 backdrop-blur shadow-sm border border-slate-200">
                ${res.category}
              </span>
            </div>
            <div class="absolute bottom-2 right-2 bg-black/60 backdrop-blur text-white px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1">
              <i data-lucide="star" class="w-3 h-3 text-amber-400 fill-amber-400"></i> ${res.current_condition_rating.toFixed(1)} Condition
            </div>
          </div>

          <!-- Body Content -->
          <div class="p-5">
            <div class="flex items-start justify-between gap-2 mb-1.5">
              <h3 class="font-bold text-base text-slate-900 leading-snug">${res.name}</h3>
            </div>
            
            <p class="text-xs text-slate-500 flex items-center gap-1 mb-2">
              <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400 flex-shrink-0"></i>
              <span>${res.location} (${res.department})</span>
            </p>

            <p class="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">${res.description}</p>

            <!-- Eligibility Banner -->
            <div class="p-2.5 rounded-xl border mb-3 flex items-center justify-between text-xs ${
              isEligible 
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800' 
                : 'bg-amber-50/60 border-amber-200 text-amber-900'
            }">
              <div class="flex items-center gap-1.5">
                <i data-lucide="${isEligible ? 'check-circle' : 'alert-circle'}" class="w-4 h-4 flex-shrink-0 ${isEligible ? 'text-emerald-600' : 'text-amber-600'}"></i>
                <div>
                  <span class="font-bold">${isEligible ? 'Eligible to Book' : 'Training Required'}:</span>
                  <span class="text-[11px] block text-slate-600">${res.min_qualification}</span>
                </div>
              </div>
              ${!isEligible ? `
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 uppercase">Blocked</span>
              ` : `
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 uppercase">Verified</span>
              `}
            </div>

            <!-- Operational Limits Grid -->
            <div class="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-600">
              <div class="flex items-center gap-1">
                <i data-lucide="clock" class="w-3 h-3 text-slate-400"></i>
                <span>Max: <strong>${res.max_consecutive_hours}h / slot</strong></span>
              </div>
              <div class="flex items-center gap-1">
                <i data-lucide="shield" class="w-3 h-3 text-slate-400"></i>
                <span>${res.requires_supervision ? 'Staff Supervised' : 'Autonomous Op'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="p-5 pt-0">
          <button onclick="openBookingModal('${res.id}')" class="w-full py-2.5 px-4 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm ${
            isEligible
              ? 'bg-sky-600 hover:bg-sky-500 text-white'
              : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
          }">
            <i data-lucide="calendar-plus" class="w-4 h-4"></i>
            <span>${isEligible ? 'Request Access Slot' : 'View Requirements & Request'}</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
  lucide.createIcons();
}

// ============================================================
// STEP 3 & 4: BOOKING REQUEST & ELIGIBILITY VERIFICATION
// ============================================================

function openBookingModal(resourceId) {
  const res = allResources.find(r => r.id === resourceId);
  if (!res || !currentUser) return;

  const isEligible = checkUserEligibility(res.min_qualification);

  document.getElementById('modal-book-res-id').value = res.id;
  document.getElementById('modal-book-title').innerText = `Request Access: ${res.name}`;
  
  // Set default start time to 2 hours from now
  const now = new Date();
  now.setHours(now.getHours() + 2);
  now.setMinutes(0);
  const tzOffset = now.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(now.getTime() - tzOffset)).toISOString().slice(0, 16);
  document.getElementById('modal-book-start').value = localISOTime;

  // Eligibility banner in modal
  const badgeContainer = document.getElementById('modal-book-eligibility-badge');
  badgeContainer.className = `mb-4 p-3 rounded-xl text-xs flex items-center gap-2 border ${
    isEligible ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
  }`;
  badgeContainer.innerHTML = isEligible ? `
    <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600 flex-shrink-0"></i>
    <div>
      <span class="font-bold">Automated Safety Eligibility Passed:</span>
      <p class="text-[11px] text-emerald-700">You hold the required qualification (<strong>${res.min_qualification}</strong>). Fair quota allowance available.</p>
    </div>
  ` : `
    <i data-lucide="alert-octagon" class="w-4 h-4 text-rose-600 flex-shrink-0"></i>
    <div>
      <span class="font-bold">Prerequisite Safety Gate Locked:</span>
      <p class="text-[11px] text-rose-700">This equipment requires '<strong>${res.min_qualification}</strong>'. Submitting will flag this request for mandatory lab supervisor review.</p>
    </div>
  `;

  updateBookingQuotaGauge();
  openModal('modal-booking');
  lucide.createIcons();
}

function updateBookingEndTime() {
  updateBookingQuotaGauge();
}

function updateBookingQuotaGauge() {
  if (!currentUser) return;
  const duration = parseFloat(document.getElementById('modal-book-duration')?.value || 2.0);
  const currentUsed = currentUser.weekly_hours_used;
  const maxQuota = currentUser.max_weekly_hours;
  const projected = currentUsed + duration;
  const pct = Math.min(100, Math.round((projected / maxQuota) * 100));

  const textEl = document.getElementById('modal-book-quota-text');
  const barEl = document.getElementById('modal-book-quota-bar');

  if (textEl && barEl) {
    textEl.innerText = `${currentUsed.toFixed(1)}h used + ${duration}h req = ${projected.toFixed(1)} / ${maxQuota.toFixed(1)}h`;
    barEl.style.width = `${pct}%`;
    barEl.className = projected > maxQuota ? 'bg-rose-600 h-full' : (pct >= 80 ? 'bg-amber-500 h-full' : 'bg-sky-600 h-full');
  }
}

async function submitBookingRequest(e) {
  e.preventDefault();
  const resourceId = document.getElementById('modal-book-res-id').value;
  const projectTitle = document.getElementById('modal-book-project').value;
  const purpose = document.getElementById('modal-book-purpose').value;
  const startTime = document.getElementById('modal-book-start').value;
  const duration = parseFloat(document.getElementById('modal-book-duration').value);

  const startDt = new Date(startTime);
  const endDt = new Date(startDt.getTime() + duration * 60 * 60 * 1000);
  const endTime = endDt.toISOString().slice(0, 16);

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: currentUser.id,
        resource_id: resourceId,
        project_title: projectTitle,
        purpose_statement: purpose,
        start_time: startTime,
        end_time: endTime,
        duration_hours: duration
      })
    });
    const data = await res.json();

    if (data.error) {
      showNotification(data.error, 'error');
      return;
    }

    closeModal('modal-booking');
    showNotification(
      data.status === 'WAITLISTED'
        ? `Slot has existing reservation! Automatically placed at Waitlist Position #${data.waitlist_position}.`
        : `Booking request submitted! Lab Manager notified for approval.`,
      data.status === 'WAITLISTED' ? 'warning' : 'success'
    );

    await loadAllData();
    showTab('my-bookings');
  } catch (err) {
    console.error(err);
    // Offline / fallback handler
    const resObj = allResources.find(r => r.id === resourceId);
    allBookings.unshift({
      id: `bk_${Date.now()}`,
      resource_id: resourceId,
      resource_name: resObj ? resObj.name : 'Equipment',
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_department: currentUser.department,
      start_time: startTime,
      end_time: endTime,
      duration_hours: duration,
      project_title: projectTitle,
      purpose_statement: purpose,
      status: 'PENDING_REVIEW',
      waitlist_position: 0,
      priority_score: currentUser.priority_score,
      created_at: new Date().toISOString()
    });
    currentUser.weekly_hours_used += duration;
    closeModal('modal-booking');
    showNotification("Booking submitted (Local Demo Mode).", 'success');
    renderActiveTab();
    updateBadges();
  }
}

// ============================================================
// STEP 5 & 6: LAB MANAGER REVIEW & ALLOCATION DASHBOARD
// ============================================================

function renderManagerDashboard() {
  renderReviewQueue();
  renderFleetHealth();
  renderIncidentsList();
}

function renderReviewQueue() {
  const container = document.getElementById('manager-review-queue');
  if (!container) return;

  const pending = allBookings.filter(b => b.status === 'PENDING_REVIEW' || b.status === 'WAITLISTED');

  if (pending.length === 0) {
    container.innerHTML = `
      <div class="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <i data-lucide="check-circle-2" class="w-8 h-8 text-emerald-500 mx-auto mb-2"></i>
        <h4 class="font-bold text-slate-700 text-sm">All requests reviewed!</h4>
        <p class="text-xs text-slate-500">No pending reservations or waitlist contentions in queue.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  container.innerHTML = pending.map(b => {
    const isWaitlisted = b.status === 'WAITLISTED';
    return `
      <div class="p-4 rounded-xl border border-slate-200 bg-white card-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="space-y-1 flex-1">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-900 text-sm">${b.resource_name}</span>
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isWaitlisted ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
            }">${isWaitlisted ? `Waitlist #${b.waitlist_position}` : 'Pending Review'}</span>
            <span class="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
              Priority: ${b.priority_score} pts
            </span>
          </div>

          <div class="text-xs text-slate-600">
            <strong>${b.user_name}</strong> (${b.user_department}) • Requested for: <strong>${b.duration_hours}h</strong>
          </div>

          <p class="text-xs text-slate-500 italic">"${b.project_title} — ${b.purpose_statement}"</p>
          <div class="text-[11px] text-slate-400">Scheduled: ${b.start_time} to ${b.end_time}</div>
        </div>

        <div class="flex items-center gap-2 w-full md:w-auto justify-end">
          <button onclick="handleManagerAction('${b.id}', 'REJECT')" class="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition">
            Reject
          </button>
          <button onclick="handleManagerAction('${b.id}', 'WAITLIST')" class="px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition">
            Waitlist
          </button>
          <button onclick="handleManagerAction('${b.id}', 'APPROVE')" class="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1">
            <i data-lucide="check" class="w-3.5 h-3.5"></i> Approve Slot
          </button>
        </div>
      </div>
    `;
  }).join('');
  lucide.createIcons();
}

async function handleManagerAction(bookingId, action) {
  let notes = '';
  if (action === 'REJECT') {
    notes = prompt("Please enter the reason for rejection (required for auditable accountability):", "Schedule contention with undergraduate laboratory coursework");
    if (!notes) return;
  }

  try {
    const res = await fetch('/api/bookings/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: bookingId,
        action: action,
        manager_id: currentUser.id,
        manager_name: currentUser.name,
        notes: notes
      })
    });
    await res.json();
    showNotification(`Booking ${action.toLowerCase()}ed successfully.`, 'success');
    await loadAllData();
    renderActiveTab();
  } catch (err) {
    console.error(err);
    const bk = allBookings.find(b => b.id === bookingId);
    if (bk) bk.status = action === 'APPROVE' ? 'APPROVED' : (action === 'REJECT' ? 'REJECTED' : 'WAITLISTED');
    showNotification(`Booking ${action}ed (Local Demo Mode).`, 'success');
    renderActiveTab();
  }
}

function renderFleetHealth() {
  const container = document.getElementById('manager-fleet-list');
  if (!container) return;

  container.innerHTML = allResources.map(res => `
    <div class="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-3 text-xs">
      <div class="flex items-center gap-3">
        <img src="${res.image_url}" class="w-10 h-10 rounded-lg object-cover">
        <div>
          <h4 class="font-bold text-slate-900">${res.name}</h4>
          <span class="text-slate-500 text-[11px]">${res.location}</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="font-semibold text-slate-700">${res.current_condition_rating.toFixed(1)} ★</span>
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
          res.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : (res.status === 'IN_USE' ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800')
        }">${res.status}</span>
      </div>
    </div>
  `).join('');
}

function renderIncidentsList() {
  const container = document.getElementById('manager-incidents-list');
  if (!container) return;

  if (allIncidents.length === 0) {
    container.innerHTML = `
      <div class="py-6 text-center text-slate-400 text-xs">
        <i data-lucide="shield-check" class="w-6 h-6 text-emerald-500 mx-auto mb-1"></i>
        <span>No open damage tickets. All systems nominal.</span>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  container.innerHTML = allIncidents.map(inc => `
    <div class="p-3 rounded-xl border border-rose-200 bg-rose-50/50 text-xs space-y-2">
      <div class="flex items-center justify-between">
        <span class="font-bold text-rose-900">${inc.title}</span>
        <span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-200 text-rose-900">${inc.severity}</span>
      </div>
      <p class="text-slate-600 text-[11px]">${inc.description}</p>
      <div class="flex items-center justify-between pt-1 border-t border-rose-100 text-[10px] text-slate-500">
        <span>Resource: ${inc.resource_name} (Cost: $${inc.estimated_cost})</span>
        ${inc.resolution_status === 'OPEN' ? `
          <button onclick="resolveIncident('${inc.id}')" class="px-2 py-0.5 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-500">
            Resolve Ticket
          </button>
        ` : `
          <span class="text-emerald-700 font-bold">Resolved ✓</span>
        `}
      </div>
    </div>
  `).join('');
  lucide.createIcons();
}

async function resolveIncident(incidentId) {
  const verdict = prompt("Enter resolution verdict (e.g. 'Tool replaced, calibration checked'):", "Inspected by Dr. Vance. Collet re-torqued. Cleared for operation.");
  if (!verdict) return;

  try {
    await fetch('/api/incidents/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        incident_id: incidentId,
        verdict: verdict,
        manager_id: currentUser.id,
        manager_name: currentUser.name
      })
    });
    showNotification("Incident resolved and resource marked AVAILABLE.", 'success');
    await loadAllData();
    renderActiveTab();
  } catch (err) {
    const inc = allIncidents.find(i => i.id === incidentId);
    if (inc) inc.resolution_status = 'RESOLVED';
    showNotification("Incident resolved (Local Demo Mode).", 'success');
    renderActiveTab();
  }
}

// ============================================================
// STEP 7, 8 & 9: MY BOOKINGS, CHECK-IN & RETURN FLOW
// ============================================================

function renderMyBookings() {
  const container = document.getElementById('my-bookings-list');
  if (!container || !currentUser) return;

  // Filter bookings for current user, OR show all if manager
  const userBookings = allBookings.filter(b => b.user_id === currentUser.id || currentUser.role === 'LAB_MANAGER');

  if (userBookings.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center bg-white rounded-2xl border border-slate-200 p-8">
        <i data-lucide="calendar" class="w-10 h-10 text-slate-300 mx-auto mb-2"></i>
        <h4 class="font-bold text-slate-700">No reservations found</h4>
        <p class="text-xs text-slate-500 mt-1">Browse equipment in the catalog to schedule your first session.</p>
        <button onclick="showTab('catalog')" class="mt-4 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold">
          Browse Catalog
        </button>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  container.innerHTML = userBookings.map(b => {
    const isApproved = b.status === 'APPROVED';
    const isCheckedIn = b.status === 'CHECKED_IN';
    const isCompleted = b.status === 'COMPLETED';
    const isPending = b.status === 'PENDING_REVIEW';
    const isWaitlisted = b.status === 'WAITLISTED';

    return `
      <div class="bg-white rounded-2xl border border-slate-200 p-5 card-shadow space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-bold text-slate-900 text-base">${b.resource_name}</h3>
              <span class="text-xs font-bold px-2 py-0.5 rounded-full ${
                isApproved ? 'bg-emerald-100 text-emerald-800' :
                isCheckedIn ? 'bg-sky-100 text-sky-800 animate-pulse' :
                isCompleted ? 'bg-slate-100 text-slate-700' :
                isWaitlisted ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
              }">${b.status.replace('_', ' ')}</span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">${b.project_title} • Booked by: <strong>${b.user_name}</strong></p>
          </div>

          <!-- Action Buttons for 10-step journey -->
          <div class="flex items-center gap-2">
            ${isApproved ? `
              <button onclick="openCheckInModal('${b.id}')" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5">
                <i data-lucide="camera" class="w-4 h-4"></i>
                <span>Step 7: Start Digital Check-In</span>
              </button>
            ` : ''}

            ${isCheckedIn ? `
              <button onclick="openCheckOutModal('${b.id}')" class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5">
                <i data-lucide="check-square" class="w-4 h-4"></i>
                <span>Step 8: Complete Return & Handover</span>
              </button>
            ` : ''}

            ${isCompleted ? `
              <span class="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <i data-lucide="check-circle-2" class="w-4 h-4"></i> Complete Journey Logged
              </span>
            ` : ''}
          </div>
        </div>

        <!-- Session Schedule & Manager Notes -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 text-xs border border-slate-100">
          <div>
            <span class="text-slate-400 block text-[10px]">TIME WINDOW</span>
            <span class="font-medium text-slate-700">${b.start_time} to ${b.end_time}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px]">DURATION / CHARGE</span>
            <span class="font-medium text-slate-700">${b.duration_hours}h (Sponsored Educational Access)</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[10px]">STATUS / NOTES</span>
            <span class="font-medium text-slate-700">${b.manager_notes || 'Awaiting lab supervisor authorization'}</span>
          </div>
        </div>

        <!-- Render Condition Reports if checked in or completed -->
        ${renderBookingConditionHistory(b.id)}
      </div>
    `;
  }).join('');
  lucide.createIcons();
}

function renderBookingConditionHistory(bookingId) {
  const reports = allConditionReports.filter(c => c.booking_id === bookingId);
  if (reports.length === 0) return '';

  return `
    <div class="mt-3 pt-3 border-t border-slate-100 space-y-2">
      <span class="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
        <i data-lucide="shield" class="w-3 h-3 text-sky-600"></i> Chain of Custody & Condition Records
      </span>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${reports.map(r => `
          <div class="p-2.5 rounded-xl border border-slate-200 bg-white text-xs flex gap-3">
            <img src="${r.photo_url}" class="w-16 h-16 rounded-lg object-cover flex-shrink-0">
            <div class="space-y-0.5 flex-1">
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-900">${r.report_type === 'CHECK_IN' ? 'Check-In Baseline' : 'Return Handover'}</span>
                <span class="text-[10px] text-slate-400">${r.timestamp}</span>
              </div>
              <div class="text-[11px] text-slate-600">Rating: <strong>${r.condition_rating} ★</strong> • Meter: <strong>${r.meter_reading}h</strong></div>
              <p class="text-[11px] text-slate-500 italic">"${r.wear_notes}"</p>
              ${r.ai_delta_summary ? `
                <div class="text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded font-medium mt-1">
                  AI: ${r.ai_delta_summary}
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Check-in modal trigger
function openCheckInModal(bookingId) {
  const bk = allBookings.find(b => b.id === bookingId);
  if (!bk) return;

  document.getElementById('modal-checkin-booking-id').value = bk.id;
  document.getElementById('modal-checkin-res-name').innerText = `Resource: ${bk.resource_name}`;
  openModal('modal-checkin');
}

async function submitCheckIn(e) {
  e.preventDefault();
  const bookingId = document.getElementById('modal-checkin-booking-id').value;
  const rating = parseFloat(document.getElementById('modal-checkin-rating').value);
  const meter = parseFloat(document.getElementById('modal-checkin-meter').value);
  const notes = document.getElementById('modal-checkin-notes').value;
  const photo = document.getElementById('checkin-preview-img').src;

  try {
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: bookingId,
        user_id: currentUser.id,
        user_name: currentUser.name,
        condition_rating: rating,
        meter_reading: meter,
        wear_notes: notes,
        photo_url: photo
      })
    });
    await res.json();
    closeModal('modal-checkin');
    showNotification("Step 7 Complete: Pre-flight check-in verified and station unlocked!", 'success');
    await loadAllData();
    renderActiveTab();
  } catch (err) {
    const bk = allBookings.find(b => b.id === bookingId);
    if (bk) bk.status = 'CHECKED_IN';
    closeModal('modal-checkin');
    showNotification("Check-in verified (Local Demo Mode).", 'success');
    renderActiveTab();
  }
}

// Check-out / return modal trigger
function openCheckOutModal(bookingId) {
  const bk = allBookings.find(b => b.id === bookingId);
  if (!bk) return;

  document.getElementById('modal-checkout-booking-id').value = bk.id;
  document.getElementById('modal-checkout-res-name').innerText = `Resource: ${bk.resource_name}`;
  openModal('modal-checkout');
}

async function submitCheckOut(e) {
  e.preventDefault();
  const bookingId = document.getElementById('modal-checkout-booking-id').value;
  const meter = parseFloat(document.getElementById('modal-checkout-meter').value);
  const cleanliness = document.getElementById('modal-checkout-cleanliness').value;
  const notes = document.getElementById('modal-checkout-notes').value;
  const photo = document.getElementById('checkout-preview-img').src;

  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: bookingId,
        user_id: currentUser.id,
        user_name: currentUser.name,
        condition_rating: cleanliness === 'CLEAN' ? 5.0 : 4.5,
        meter_reading: meter,
        cleanliness: cleanliness,
        wear_notes: notes,
        photo_url: photo
      })
    });
    const data = await res.json();
    closeModal('modal-checkout');
    showNotification(`Step 8 Complete: Return confirmed! ${data.ai_delta || ''}`, 'success');
    await loadAllData();
    renderActiveTab();
  } catch (err) {
    const bk = allBookings.find(b => b.id === bookingId);
    if (bk) bk.status = 'COMPLETED';
    closeModal('modal-checkout');
    showNotification("Return verified (Local Demo Mode).", 'success');
    renderActiveTab();
  }
}

// Incident from Checkout
function triggerIncidentFromCheckout() {
  const bookingId = document.getElementById('modal-checkout-booking-id').value;
  const bk = allBookings.find(b => b.id === bookingId);
  closeModal('modal-checkout');
  openIncidentModal(bk?.resource_id || 'res_cnc_01', bk?.resource_name || 'Haas CNC Mill', bookingId);
}

// ============================================================
// STEP 9: INCIDENTS & DAMAGE REPORTING
// ============================================================

function openIncidentModal(resourceId, resourceName, bookingId = '') {
  document.getElementById('modal-inc-booking-id').value = bookingId || 'GENERAL';
  document.getElementById('modal-inc-res-id').value = resourceId;
  document.getElementById('modal-inc-res-name').value = resourceName;
  openModal('modal-incident');
}

async function submitIncident(e) {
  e.preventDefault();
  const bookingId = document.getElementById('modal-inc-booking-id').value;
  const resId = document.getElementById('modal-inc-res-id').value;
  const resName = document.getElementById('modal-inc-res-name').value;
  const severity = document.getElementById('modal-inc-severity').value;
  const title = document.getElementById('modal-inc-title').value;
  const desc = document.getElementById('modal-inc-desc').value;
  const cost = parseFloat(document.getElementById('modal-inc-cost').value);

  try {
    await fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: bookingId,
        resource_id: resId,
        resource_name: resName,
        user_id: currentUser.id,
        user_name: currentUser.name,
        severity: severity,
        title: title,
        description: desc,
        estimated_cost: cost
      })
    });
    closeModal('modal-incident');
    showNotification(`Incident reported [${severity}]. Lab Manager alerted and equipment flagged.`, 'warning');
    await loadAllData();
    renderActiveTab();
  } catch (err) {
    allIncidents.unshift({
      id: `inc_${Date.now()}`,
      resource_name: resName,
      title: title,
      severity: severity,
      description: desc,
      estimated_cost: cost,
      resolution_status: 'OPEN'
    });
    closeModal('modal-incident');
    showNotification("Incident reported (Local Demo Mode).", 'warning');
    renderActiveTab();
  }
}

// ============================================================
// TAB 4: FAIR ALLOCATION VIEW
// ============================================================

function renderFairnessView() {
  const tbody = document.getElementById('fairness-quota-tbody');
  if (!tbody) return;

  const students = allUsers.filter(u => u.role === 'STUDENT_RESEARCHER');

  tbody.innerHTML = students.map(u => {
    const pct = Math.min(100, Math.round((u.weekly_hours_used / u.max_weekly_hours) * 100));
    const isExceeded = u.weekly_hours_used >= u.max_weekly_hours;
    const isWarning = pct >= 75 && !isExceeded;

    return `
      <tr class="hover:bg-slate-50/60 transition">
        <td class="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
          <img src="${u.avatar}" class="w-6 h-6 rounded-full object-cover">
          <span>${u.name}</span>
        </td>
        <td class="py-3 px-4 text-slate-600">${u.department}</td>
        <td class="py-3 px-4">
          <div class="flex items-center gap-2">
            <div class="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
              <div class="h-full ${isExceeded ? 'bg-rose-500' : (isWarning ? 'bg-amber-500' : 'bg-emerald-500')}" style="width: ${pct}%"></div>
            </div>
            <span class="font-mono text-slate-700">${u.weekly_hours_used.toFixed(1)} / ${u.max_weekly_hours}h</span>
          </div>
        </td>
        <td class="py-3 px-4 font-mono font-bold text-slate-800">${u.priority_score} pts</td>
        <td class="py-3 px-4">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
            isExceeded ? 'bg-rose-100 text-rose-800' : (isWarning ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')
          }">
            ${isExceeded ? 'Quota Cap Reached' : (isWarning ? 'High Volume' : 'Nominal')}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

// ============================================================
// TAB 5: AUDIT LOG (Step 10)
// ============================================================

function renderAuditLogs() {
  const container = document.getElementById('audit-log-list');
  const countEl = document.getElementById('audit-total-count');
  const filter = document.getElementById('audit-filter')?.value || 'ALL';
  if (!container) return;

  const filtered = allAuditLogs.filter(log => filter === 'ALL' || log.action_type === filter);
  if (countEl) countEl.innerText = `Showing ${filtered.length} auditable events`;

  if (filtered.length === 0) {
    container.innerHTML = `<div class="p-8 text-center text-slate-400 text-xs">No audit events match this filter.</div>`;
    return;
  }

  container.innerHTML = filtered.map(log => {
    let badgeColor = 'bg-slate-100 text-slate-700';
    if (log.action_type.includes('APPROVED') || log.action_type.includes('CONFIRMED')) badgeColor = 'bg-emerald-100 text-emerald-800';
    if (log.action_type.includes('REQUESTED')) badgeColor = 'bg-sky-100 text-sky-800';
    if (log.action_type.includes('REJECTED') || log.action_type.includes('FLAGGED')) badgeColor = 'bg-rose-100 text-rose-800';
    if (log.action_type.includes('WAITLIST')) badgeColor = 'bg-amber-100 text-amber-800';

    return `
      <div class="p-4 hover:bg-slate-50 transition flex items-start justify-between gap-4 text-xs">
        <div class="space-y-1 flex-1">
          <div class="flex items-center gap-2">
            <span class="font-bold px-2 py-0.5 rounded text-[10px] font-mono ${badgeColor}">
              ${log.action_type}
            </span>
            <span class="font-semibold text-slate-900">${log.resource_name || 'System Resource'}</span>
          </div>
          <p class="text-slate-600">${log.details}</p>
          <div class="text-[10px] text-slate-400 flex items-center gap-2">
            <span>Actor: <strong>${log.actor_name}</strong> (${formatRole(log.actor_role)})</span>
          </div>
        </div>
        <div class="text-[11px] font-mono text-slate-400 flex-shrink-0">
          ${log.timestamp}
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
// TAB 6: OWNER LISTING CREATOR (Step 1)
// ============================================================

async function submitNewResource(e) {
  e.preventDefault();
  const name = document.getElementById('new-res-name').value;
  const category = document.getElementById('new-res-cat').value;
  const location = document.getElementById('new-res-loc').value;
  const minQual = document.getElementById('new-res-cert').value;
  const desc = document.getElementById('new-res-desc').value;
  const maxHours = parseFloat(document.getElementById('new-res-max-hours').value);
  const quota = parseFloat(document.getElementById('new-res-quota').value);
  const deposit = parseFloat(document.getElementById('new-res-deposit').value);

  try {
    await fetch('/api/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name,
        category: category,
        location: location,
        min_qualification: minQual,
        description: desc,
        max_consecutive_hours: maxHours,
        weekly_quota_hours: quota,
        deposit_required: deposit,
        owner_id: currentUser.id,
        owner_name: currentUser.name
      })
    });
    showNotification("Step 1 Complete: New institutional resource published!", 'success');
    await loadAllData();
    showTab('catalog');
  } catch (err) {
    allResources.unshift({
      id: `res_${Date.now()}`,
      name: name,
      category: category,
      location: location,
      min_qualification: minQual,
      description: desc,
      max_consecutive_hours: maxHours,
      weekly_quota_hours: quota,
      deposit_required: deposit,
      status: 'AVAILABLE',
      current_condition_rating: 5.0,
      image_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600"
    });
    showNotification("New resource listed (Local Demo Mode).", 'success');
    renderActiveTab();
    showTab('catalog');
  }
}

// ============================================================
// HELPER UTILITIES & UI CONTROLS
// ============================================================

function openModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.remove('hidden');
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.add('hidden');
}

function openJudgeGuideModal() {
  openModal('modal-judge-guide');
}

function randomizePhoto(imgElementId) {
  const el = document.getElementById(imgElementId);
  if (!el) return;
  const next = SAMPLE_PHOTOS[Math.floor(Math.random() * SAMPLE_PHOTOS.length)];
  el.src = next;
  showNotification("Simulated camera snapshot updated.", 'info');
}

async function resetDemoData() {
  if (!confirm("Reset database to initial clean demo state?")) return;
  try {
    await fetch('/api/reset-demo', { method: 'POST' });
    await loadAllData();
    switchPersona('user_alex');
    showNotification("Demo environment reset to initial state.", 'success');
  } catch (err) {
    initFallbackData();
    switchPersona('user_alex');
    showNotification("Local demo reset.", 'success');
  }
}

function showNotification(msg, type = 'info') {
  const bar = document.getElementById('notification-bar');
  const msgEl = document.getElementById('notif-message');
  const iconEl = document.getElementById('notif-icon');
  if (!bar || !msgEl) return;

  msgEl.innerText = msg;
  bar.className = 'mb-6 p-4 rounded-xl border flex items-center justify-between text-sm transition-all shadow-sm';

  if (type === 'success') {
    bar.classList.add('bg-emerald-50', 'border-emerald-200', 'text-emerald-900');
    iconEl.setAttribute('data-lucide', 'check-circle-2');
  } else if (type === 'warning') {
    bar.classList.add('bg-amber-50', 'border-amber-200', 'text-amber-900');
    iconEl.setAttribute('data-lucide', 'alert-triangle');
  } else if (type === 'error') {
    bar.classList.add('bg-rose-50', 'border-rose-200', 'text-rose-900');
    iconEl.setAttribute('data-lucide', 'alert-circle');
  } else {
    bar.classList.add('bg-sky-50', 'border-sky-200', 'text-sky-900');
    iconEl.setAttribute('data-lucide', 'info');
  }

  bar.classList.remove('hidden');
  lucide.createIcons();

  clearTimeout(window._notifTimer);
  window._notifTimer = setTimeout(() => {
    dismissNotification();
  }, 6000);
}

function dismissNotification() {
  const bar = document.getElementById('notification-bar');
  if (bar) bar.classList.add('hidden');
}
