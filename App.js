/* ============================================================
   Data model — Metro Manila Multi-City Registry
   ============================================================ */
let activeCity = '';
let SUPPORTED_LOCATIONS = [];

async function loadSupportedLocations() {
  const response = await fetch(`${ADMIN_API_URL}?action=locations`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Supported locations are unavailable.');
  const data = await response.json();
  SUPPORTED_LOCATIONS = Array.isArray(data.locations) ? data.locations : [];
  const options = '<option value="">Select a supported location</option>' + SUPPORTED_LOCATIONS
    .map((location) => `<option value="${location.id}">${location.name}</option>`).join('');
  ['reg-location', 'new-user-location', 'command-location-select', 'reports-location-select', 'ann-location-select'].forEach((id) => {
    const select = document.getElementById(id);
    if (select) select.innerHTML = options;
  });
  if (!activeCity && SUPPORTED_LOCATIONS[0]) activeCity = SUPPORTED_LOCATIONS[0].city;
  const defaultLocationId = locationIdForCity(activeCity) || SUPPORTED_LOCATIONS[0]?.id || '';
  ['command-location-select', 'reports-location-select', 'ann-location-select'].forEach((id) => {
    const select = document.getElementById(id);
    if (select) select.value = defaultLocationId;
  });
}

function locationForId(locationId) {
  return SUPPORTED_LOCATIONS.find((location) => location.id === locationId) || null;
}

function locationIdForCity(city) {
  const value = String(city || '').trim().toLowerCase();
  return SUPPORTED_LOCATIONS.find((location) => [location.id, location.name, location.city, ...(location.aliases || [])]
    .some((candidate) => String(candidate).trim().toLowerCase() === value))?.id || '';
}

const METRO_MANILA_DATA = {
  "Malabon City": {
    "Concepcion": { risk: "high", affected: 121408, teams: 3, centers: [
      { id: "c1", name: "Concepcion Elementary School", capacity: 1200, evacuees: 860 },
      { id: "c2", name: "Sto. Niño Multi-Purpose Hall", capacity: 500, evacuees: 310 }
    ]},
    "Baritan": { risk: "high", affected: 64220, teams: 2, centers: [
      { id: "b1", name: "Baritan Barangay Hall", capacity: 400, evacuees: 250 },
      { id: "b2", name: "Amang Rodriguez Elementary School", capacity: 900, evacuees: 410 }
    ]},
    "Acacia": { risk: "medium", affected: 18340, teams: 1, centers: [
      { id: "a1", name: "Acacia Covered Court", capacity: 300, evacuees: 95 }
    ]},
    "Panghulo": { risk: "medium", affected: 22110, teams: 1, centers: [
      { id: "p1", name: "Panghulo Elementary School", capacity: 700, evacuees: 180 }
    ]},
    "Longos": { risk: "low", affected: 4200, teams: 0, centers: [
      { id: "l1", name: "Longos Elementary School", capacity: 600, evacuees: 0 }
    ]}
  },
  "Quezon City": {
    "Batasan Hills": { risk: "high", affected: 165000, teams: 5, centers: [
      { id: "qc1", name: "Batasan Hills National High School", capacity: 2000, evacuees: 1100 }
    ]},
    "Commonwealth": { risk: "medium", affected: 98000, teams: 2, centers: [
      { id: "qc2", name: "Commonwealth Elementary School", capacity: 1500, evacuees: 450 }
    ]},
    "Bagong Silangan": { risk: "high", affected: 82000, teams: 3, centers: [
      { id: "qc3", name: "Bagong Silangan Elementary School", capacity: 1200, evacuees: 780 }
    ]}
  },
  "Manila City": {
    "Barangay 1": { risk: "high", affected: 45000, teams: 2, centers: [
      { id: "mnl1", name: "Tondo Sports Complex", capacity: 800, evacuees: 520 }
    ]},
    "Barangay 2": { risk: "medium", affected: 31000, teams: 1, centers: [
      { id: "mnl2", name: "Gagalangin Covered Court", capacity: 500, evacuees: 210 }
    ]}
  },
  "Caloocan City": {
    "Barangay 1": { risk: "medium", affected: 32000, teams: 1, centers: [
      { id: "cal1", name: "Caloocan High School", capacity: 1000, evacuees: 210 }
    ]},
    "Barangay 2": { risk: "low", affected: 14000, teams: 0, centers: [
      { id: "cal2", name: "Maypajo Elementary School", capacity: 600, evacuees: 0 }
    ]}
  },
  "Navotas City": {
    "San Jose": { risk: "high", affected: 54000, teams: 3, centers: [
      { id: "nav1", name: "Navotas Sports Complex", capacity: 1200, evacuees: 930 }
    ]},
    "Daanghari": { risk: "medium", affected: 28000, teams: 1, centers: [
      { id: "nav2", name: "Daanghari Elementary School", capacity: 600, evacuees: 190 }
    ]}
  }
};

let REPORTS = [
  {id:1, city:"Malabon City", barangay:"Concepcion", severity:"high", reporter:"NLP System", source:"nlp", platform:"Facebook", time:"11 min ago", desc:"Detected a public post describing knee-level water along Rizal St., rising fast.", status:"pending", photo:true},
  {id:2, city:"Malabon City", barangay:"Concepcion", severity:"medium", reporter:"NLP System", source:"nlp", platform:"X (Twitter)", time:"38 min ago", desc:"Detected a public post mentioning ankle-deep water near the covered market entrance.", status:"pending", photo:false},
  {id:3, city:"Malabon City", barangay:"Concepcion", severity:"high", reporter:"A. Dizon", source:"citizen", time:"1 hr ago", desc:"Street flooding blocking the main road to the barangay hall.", status:"verified", photo:false},
  {id:4, city:"Malabon City", barangay:"Concepcion", severity:"low", reporter:"R. Santos", source:"citizen", time:"2 hr ago", desc:"Minor pooling near the basketball court, receding.", status:"rejected", photo:false},
  {id:5, city:"Malabon City", barangay:"Concepcion", severity:"medium", reporter:"NLP System", source:"nlp", platform:"Facebook", time:"3 hr ago", desc:"Detected a public post about water rising near the creek behind Purok 3.", status:"pending", photo:true},
  {id:6, city:"Malabon City", barangay:"Baritan", severity:"high", reporter:"NLP System", source:"nlp", platform:"Facebook", time:"46 min ago", desc:"Detected multiple public posts reporting street flooding near the barangay hall.", status:"pending", photo:true},
  {id:7, city:"Malabon City", barangay:"Baritan", severity:"medium", reporter:"M. Cruz", source:"citizen", time:"2 hr ago", desc:"Water rising near the covered court, ankle-deep.", status:"verified", photo:false},
  {id:8, city:"Quezon City", barangay:"Batasan Hills", severity:"high", reporter:"NLP System", source:"nlp", platform:"Facebook", time:"15 min ago", desc:"Water level rising rapidly near the river bank.", status:"pending", photo:true}
];

let ANNOUNCEMENTS = [
  {id:1, city:"Malabon City", barangay:"Concepcion", title:"Evacuate low-lying areas near Rizal St.", body:"Water levels are rising quickly. Residents in low-lying sections should move to Concepcion Elementary School now.", status:"published", date:"Today, 2:14 PM"},
  {id:2, city:"Malabon City", barangay:"Concepcion", title:"Rescue teams on standby", body:"A rescue team is active in Concepcion. Call the barangay hotline if you need pickup assistance.", status:"published", date:"Today, 1:02 PM"},
  {id:3, city:"Malabon City", barangay:"Concepcion", title:"Advisory — heavy rainfall expected", body:"PAGASA forecasts heavy rain through tonight. Prepare go-bags and monitor local updates.", status:"draft", date:"Today, 9:40 AM"},
  {id:4, city:"Malabon City", barangay:"Baritan", title:"Road closure near barangay hall", body:"The main road to the barangay hall is impassable. Use the Tinajeros Ave. detour.", status:"published", date:"Today, 12:30 PM"},
  {id:5, city:"Quezon City", barangay:"Batasan Hills", title:"Emergency evacuation alert", body:"Residents in flood-prone zones proceed to Batasan Hills National High School.", status:"published", date:"Today, 3:00 PM"}
];

/* ============================================================
   ACL Engine — Helper Functions & Matrix Rules
   ============================================================ */
function getModulePermission(auth, moduleKey) {
  if (!auth || !auth.acls) return 'no_access';
  return (auth.acls[moduleKey] || 'no_access').toLowerCase();
}

function canViewModule(auth, moduleKey) {
  const lvl = getModulePermission(auth, moduleKey);
  return lvl === 'full' || lvl === 'edit' || lvl === 'view';
}

function canCreateModule(auth, moduleKey) {
  const lvl = getModulePermission(auth, moduleKey);
  return lvl === 'full' || lvl === 'edit';
}

function canEditModule(auth, moduleKey) {
  return getModulePermission(auth, moduleKey) === 'full';
}

function canApproveModule(auth, moduleKey) {
  const lvl = getModulePermission(auth, moduleKey);
  return lvl === 'full' || lvl === 'edit';
}

function canRejectModule(auth, moduleKey) {
  const lvl = getModulePermission(auth, moduleKey);
  return lvl === 'full' || lvl === 'edit';
}

function canDeleteModule(auth, moduleKey) {
  return getModulePermission(auth, moduleKey) === 'full';
}

function canAdminModule(auth, moduleKey) {
  return getModulePermission(auth, moduleKey) === 'full';
}

const VIEW_MODULE_MAP = {
  command: 'admin_overview',
  evacuees: 'products',
  reports: 'approval_board',
  'all-reports': 'approval_board',
  announcements: 'announcements',
  logs: 'approval_board_hr',
  users: 'admin_overview'
};

/* Registered accounts for local testing / offline fallback */
let ACCOUNTS = [
  {
    email: "miguel.torres@bahaba.ph",
    password: "Bahaba@2026",
    name: "Miguel Torres",
    initials: "MT",
    org: "BAHABA Platform Admin",
    city: "Metro Manila (All Cities)",
    ip: "IP: 10.0.4.2",
    status: "active",
    acls: {
      admin_overview: 'full',
      announcements: 'full',
      products: 'full',
      approval_board: 'full',
      approval_board_hr: 'full'
    }
  },
  {
    email: "elena.villareal@malabon.gov.ph",
    password: "Concepcion@2026",
    name: "Elena Villareal",
    initials: "EV",
    org: "Brgy. Concepcion",
    city: "Malabon City",
    barangay: "Concepcion",
    ip: "IP: 121.54.12.8",
    status: "active",
    acls: {
      admin_overview: 'view',
      announcements: 'edit',
      products: 'edit',
      approval_board: 'edit',
      approval_board_hr: 'no_access'
    }
  },
  {
    email: "qc.admin@quezoncity.gov.ph",
    password: "Batasan@2026",
    name: "Marco Rivera",
    initials: "MR",
    org: "Brgy. Batasan Hills",
    city: "Quezon City",
    barangay: "Batasan Hills",
    ip: "IP: 121.54.18.12",
    status: "active",
    acls: {
      admin_overview: 'view',
      announcements: 'edit',
      products: 'edit',
      approval_board: 'edit',
      approval_board_hr: 'no_access'
    }
  }
];

let APP_USERS = [];
const ADMIN_API_URL = 'http://localhost:8001/api.php';

function bindUserManagerFilters(){
  const adminSearch = document.getElementById('admin-user-search');
  const adminStatus = document.getElementById('admin-user-status-filter');
  const appSearch = document.getElementById('app-user-search');
  const appStatus = document.getElementById('app-user-status-filter');

  if (adminSearch) {
    adminSearch.addEventListener('input', renderUserManager);
  }
  if (adminStatus) {
    adminStatus.addEventListener('change', renderUserManager);
  }
  if (appSearch) {
    appSearch.addEventListener('input', renderUserManager);
  }
  if (appStatus) {
    appStatus.addEventListener('change', renderUserManager);
  }
}

async function loadAdminAccounts() {
  try {
    const [adminResponse, appUserResponse] = await Promise.all([
      fetch(`${ADMIN_API_URL}?action=users`, { credentials: 'include' }),
      fetch(`${ADMIN_API_URL}?action=app-users`, { credentials: 'include' })
    ]);

    if (adminResponse.ok) {
      const data = await adminResponse.json();
      const rows = Array.isArray(data.users) ? data.users : [];
      if (rows.length) {
        ACCOUNTS = rows.map((user) => ({
          email: user.email,
          password: '********',
          name: user.name,
          initials: (user.name || 'U').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'U',
          org: user.org || (user.role === 'platform-admin' ? 'BAHABA Platform Admin' : `Brgy. ${user.barangay || 'Barangay'}`),
          role: user.role,
          city: user.city || 'Malabon City',
          assigned_location: user.assigned_location || '',
          barangay: user.barangay || undefined,
          ip: user.ip || 'IP: DB Synced',
          status: user.status || 'active',
          acls: typeof user.acls === 'object' && user.acls ? user.acls : {
            admin_overview: user.role === 'platform-admin' ? 'full' : 'view',
            announcements: user.role === 'platform-admin' ? 'full' : 'edit',
            products: user.role === 'platform-admin' ? 'full' : 'edit',
            approval_board: user.role === 'platform-admin' ? 'full' : 'edit',
            approval_board_hr: user.role === 'platform-admin' ? 'full' : 'no_access'
          }
        }));
      }
    }

    if (appUserResponse.ok) {
      const data = await appUserResponse.json();
      const rows = Array.isArray(data.users) ? data.users : [];
      APP_USERS = rows.map((user) => {
        const selectedLocation = locationForId(user.selected_location);
        return {
          id: user.id,
          name: user.username || user.email,
          email: user.email,
          city: selectedLocation?.name || user.city || 'Unassigned',
          location: selectedLocation?.name || user.location || user.city || 'Unassigned',
          selected_location: user.selected_location || '',
          status: user.status || (user.email_verified_at ? 'verified' : 'pending')
        };
      });
    }
  } catch (error) {
    console.warn('Using local account fallback:', error);
  }
}

let session = null;
let currentModuleId = null;
let reportsFilter = "pending";
let annFilter = "all";
let NLP_EVENTS = [];
let NLP_STATS = { total: 0, flood: 0, nonFlood: 0, highSeverity: 0, avgConfidence: 0 };
let nlpPollTimer = null;
let nlpFeedStatus = 'connecting';
let nlpLastUpdated = '';
let nlpFeedMessage = '';
let nlpIngestionConfigured = false;
let ALL_PLATFORM_REPORTS = [];
let ALL_NLP_EVENTS = [];
let ALL_NLP_STATS = { total: 0, flood: 0, nonFlood: 0, highSeverity: 0, avgConfidence: 0 };
let allNlpIngestionConfigured = false;
let allNlpServiceHealth = {};
let allReportsDemoFallback = false;
let allReportsLastUpdated = '';
let allReportsFeedError = '';

// Session persistence
const SESSION_STORAGE_KEY = 'bahaba_admin_session';
const SESSION_STORAGE_EXPIRY_KEY = 'bahaba_admin_session_expiry';
const SESSION_EXPIRY_DAYS = 30; // Keep session for 30 days

function saveSessionToStorage(sessionData) {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + SESSION_EXPIRY_DAYS);
    localStorage.setItem(SESSION_STORAGE_EXPIRY_KEY, expiryDate.getTime().toString());
  } catch (e) {
    console.warn('Failed to save session to localStorage:', e);
  }
}

function getSessionFromStorage() {
  try {
    const expiry = localStorage.getItem(SESSION_STORAGE_EXPIRY_KEY);
    if (!expiry || new Date().getTime() > parseInt(expiry)) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(SESSION_STORAGE_EXPIRY_KEY);
      return null;
    }
    const sessionData = localStorage.getItem(SESSION_STORAGE_KEY);
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (e) {
    console.warn('Failed to restore session from localStorage:', e);
    return null;
  }
}

function clearSessionFromStorage() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_EXPIRY_KEY);
  } catch (e) {
    console.warn('Failed to clear session from localStorage:', e);
  }
}

// Initialize session on page load
window.addEventListener('DOMContentLoaded', function() {
  const savedSession = getSessionFromStorage();
  if (savedSession) {
    enterConsole(savedSession);
    loadAdminAccounts();
  }
});

/* ============================================================
   Metro Manila barangays Dictionary
   ============================================================ */
function numberedBarangays(count){
  const list = [];
  for(let i=1;i<=count;i++) list.push("Barangay "+i);
  return list;
}

const METRO_MANILA_BARANGAYS = {
  "Caloocan City": numberedBarangays(188),
  "Las Piñas City": ["Almanza Uno","Almanza Dos","B.F. International Village","Daniel Fajardo","Elias Aldana","Ilaya","Manuyo Uno","Manuyo Dos","Pamplona Uno","Pamplona Dos","Pamplona Tres","Pilar","Pulang Lupa Uno","Pulang Lupa Dos","Talon Uno","Talon Dos","Talon Tres","Talon Kuatro","Talon Singko","Zapote"],
  "Makati City": ["Bangkal","Bel-Air","Carmona","Cembo","Comembo","Dasmariñas","East Rembo","Forbes Park","Guadalupe Nuevo","Guadalupe Viejo","Kasilawan","La Paz","Magallanes","Olympia","Palanan","Pembo","Pinagkaisahan","Pio del Pilar","Pitogo","Poblacion","Post Proper Northside","Post Proper Southside","Rizal","San Antonio","San Isidro","San Lorenzo","Santa Cruz","Singkamas","South Cembo","Tejeros","Urdaneta","Valenzuela","West Rembo"],
  "Malabon City": ["Acacia","Baritan","Bayan-bayanan","Catmon","Concepcion","Dampalit","Flores","Hulong Duhat","Ibaba","Longos","Maysilo","Muzon","Niugan","Panghulo","Potrero","San Agustin","Santolan","Tañong","Tinajeros","Tonsuya","Tugatog"],
  "Mandaluyong City": ["Addition Hills","Bagong Silang","Barangka Drive","Barangka Ibaba","Barangka Ilaya","Barangka Itaas","Buayang Bato","Burol","Daang Bakal","Hagdang Bato Itaas","Hagdang Bato Libis","Harapin ang Bukas","Highway Hills","Hulo","Mabini-J. Rizal","Malamig","Mauway","Namayan","New Zañiga","Old Zañiga","Pag-asa","Plainview","Pleasant Hills","Poblacion","San Jose","Vergara","Wack-Wack Greenhills"],
  "Manila City": numberedBarangays(897),
  "Marikina City": ["Barangka","Calumpang","Concepcion Uno","Concepcion Dos","Fortune","Industrial Valley","Jesus de la Peña","Malanday","Marikina Heights","Nangka","Parang","San Roque","Santa Elena","Santo Niño","Tañong","Tumana"],
  "Muntinlupa City": ["Alabang","Ayala Alabang","Bayanan","Buli","Cupang","Poblacion","Putatan","Sucat","Tunasan"],
  "Navotas City": ["Bagumbayan North","Bagumbayan South","Bangculasi","Daanghari","Navotas East","Navotas West","North Bay Boulevard North","North Bay Boulevard South","San Jose","San Rafael Village","Sipac-Almacen","Tangos North","Tangos South","Tanza"],
  "Parañaque City": ["Baclaran","BF Homes","Don Bosco","Don Galo","La Huerta","Marcelo Green","Merville","Moonwalk","San Antonio","San Dionisio","San Isidro","San Martin de Porres","Santo Niño","Sun Valley","Tambo","Vitalez"],
  "Pasay City": numberedBarangays(201),
  "Pasig City": ["Bagong Ilog","Bagong Katipunan","Bambang","Buting","Caniogan","Dela Paz","Kalawaan","Kapasigan","Kapitolyo","Malinao","Manggahan","Maybunga","Oranbo","Palatiw","Pinagbubuhay","Pineda","Rosario","Sagad","San Antonio","San Joaquin","San Jose","San Miguel","San Nicolas","Santa Cruz","Santa Lucia","Santa Rosa","Santo Tomas","Santolan","Sumilang","Ugong"],
  "Pateros": ["Aguho","Magtanggol","Martires del 96","Poblacion","San Pedro","San Roque","Santa Ana","Santo Rosario-Kanluran","Santo Rosario-Silangan","Tabacalera"],
  "Quezon City": ["Alicia","Bagong Pag-asa","Bahay Toro","Balingasa","Bungad","Damar","Damayan","Del Monte","Katipunan","Lourdes","Maharlika","Manresa","Maribolo","Masambong","Matalahib","N.S. Amoranto","Nayong Kanluran","North Triangle","Paang Bundok","Pag-ibig sa Nayon","Paltok","Paraiso","Phil-Am","Project 6","Ramon Magsaysay","Saint Peter","Salvacion","San Antonio","San Isidro Labrador","San Jose","Santa Cruz","Santa Teresita","Santo Cristo","Sienna","Talayan","Vasra","Veterans Village","West Triangle","Batasan Hills","Commonwealth","Bagong Silangan"],
  "San Juan City": ["Addition Hills","Balong-Bato","Batis","Corazon de Jesus","Ermitaño","Greenhills","Halo-Halo","Isabelita","Kabayanan","Little Baguio","Maytunas","Onse","Pasadeña","Pedro Cruz","Progreso","Rivera","Salapan","San Perfecto","Santa Lucia","Tibagan","West Crame"],
  "Taguig City": ["Bagumbayan","Bambang","Calzada","Central Bicutan","Central Signal Village","Fort Bonifacio","Hagonoy","Ibayo-Tipas","Ligid-Tipas","Lower Bicutan","Maharlika Village","Napindan","New Lower Bicutan","North Daang Hari","North Signal Village","Palingon","Pinagsama","San Miguel","Santa Ana","Signal Village","South Daang Hari","South Signal Village","Tanyag","Tuktukan","Upper Bicutan","Ususan","Wawa","Western Bicutan"],
  "Valenzuela City": ["Arkong Bato","Bagbaguin","Balangkas","Bignay","Bisig","Canumay East","Canumay West","Coloong","Dalandanan","Gen. T. de Leon","Isla","Karuhatan","Lawang Bato","Lingunan","Mabolo","Malanday","Malinta","Mapulang Lupa","Marulas","Maysan","Palasan","Parada","Pariancillo Villa","Paso de Blas","Pasolo","Poblacion","Pulo","Punturin","Rincon","Tagalag","Ugong","Viente Reales","Wawang Pulo"]
};

const METRO_MANILA_CITIES = Object.keys(METRO_MANILA_BARANGAYS);

/* Scoping Helper Functions */
function currentCity() {
  const assigned = locationForId(session?.assigned_location);
  if (assigned) return assigned.city;
  if (session && session.city && session.city !== "Metro Manila (All Cities)") {
    return session.city;
  }
  return activeCity || SUPPORTED_LOCATIONS[0]?.city || '';
}

function getCityBarangays(cityName = currentCity()) {
  if (METRO_MANILA_DATA[cityName]) {
    return METRO_MANILA_DATA[cityName];
  }
  // Fallback structure for cities without sample data yet
  const bList = METRO_MANILA_BARANGAYS[cityName] || [];
  const generated = {};
  bList.slice(0, 3).forEach((bName, idx) => {
    generated[bName] = {
      risk: idx === 0 ? "high" : idx === 1 ? "medium" : "low",
      affected: (idx + 1) * 15000,
      teams: 2,
      centers: [
        { id: `c_${cityName}_${idx}`, name: `${bName} Evacuation Center`, capacity: 800, evacuees: (idx + 1) * 200 }
      ]
    };
  });
  return generated;
}

function scopedBarangays() {
  const cityData = getCityBarangays();
  if (canAdminModule(session, 'admin_overview')) {
    return Object.keys(cityData);
  }
  return [session.barangay];
}

/* ============================================================
   Audit Log State
   ============================================================ */
let AUDIT_LOG = [
  {time:"Aug 20, 2026, 4:12 PM", user:"Elena Villareal (Brgy. Concepcion, Malabon)", module:"Evacuees", action:"Update", description:'Evacuee count for "Concepcion Elementary School" changed to 860.', ip:"IP: 121.54.12.8", status:"success"},
  {time:"Aug 20, 2026, 4:05 PM", user:"BAHABA NLP System", module:"Reports", action:"Auto-detect", description:'New report auto-filed for Barangay Concepcion from a public Facebook post.', ip:"IP: 10.0.4.9 (automated)", status:"success"},
  {time:"Aug 20, 2026, 3:47 PM", user:"Elena Villareal (Brgy. Concepcion, Malabon)", module:"Reports", action:"Verify", description:'Report #3 in Barangay Concepcion marked as verified.', ip:"IP: 121.54.12.8", status:"success"},
  {time:"Aug 20, 2026, 3:02 PM", user:"Elena Villareal (Brgy. Concepcion, Malabon)", module:"Announcements", action:"Publish", description:'Announcement "Rescue teams on standby" published.', ip:"IP: 121.54.12.8", status:"success"},
  {time:"Aug 20, 2026, 2:20 PM", user:"BAHABA NLP System", module:"Reports", action:"Auto-detect", description:'New report auto-filed for Barangay Baritan from public posts on Facebook.', ip:"IP: 10.0.4.9 (automated)", status:"success"},
  {time:"Aug 20, 2026, 1:15 PM", user:"Elena Villareal (Brgy. Concepcion, Malabon)", module:"Reports", action:"Reject", description:'Report #4 in Barangay Concepcion marked as rejected.', ip:"IP: 121.54.12.8", status:"success"},
  {time:"Aug 20, 2026, 11:30 AM", user:"Miguel Torres (BAHABA Platform Admin)", module:"Account", action:"Sign in", description:"Platform admin signed in to the console.", ip:"IP: 10.0.4.2", status:"success"}
];

/* ============================================================
   Device ID & Authentication
   ============================================================ */
let pendingAccountType = 'lgu';
const PASSWORD_MAX_LENGTH = 12;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_ALLOWED_PATTERN = /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]+$/;

function getDeviceId() {
  let deviceId = localStorage.getItem('bahaba_device_id');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('bahaba_device_id', deviceId);
  }
  return deviceId;
}

function validatePassword(password){
  if(password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH){
    return `Password must be ${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters long.`;
  }
  if(!PASSWORD_ALLOWED_PATTERN.test(password)){
    return "Password can only contain letters, numbers, and special characters (no spaces).";
  }
  return null;
}

function switchAuth(view){
  document.querySelectorAll('.auth-view').forEach(v=>v.classList.remove('active'));
  document.getElementById('auth-'+view).classList.add('active');
  ['login-alert','register-alert','forgot-alert'].forEach(id=>{
    const el = document.getElementById(id); if(el){ el.className='form-alert'; el.textContent=''; }
  });
}

function togglePassword(inputId, btn){
  const input = document.getElementById(inputId);
  const isText = input.type === 'text';
  input.type = isText ? 'password' : 'text';
  btn.classList.toggle('showing', !isText);
}

function toggleDemoHint(){
  document.getElementById('demo-hint-body').classList.toggle('open');
}

function selectAccountType(type){
  pendingAccountType = type;
  document.getElementById('type-option-lgu').classList.toggle('selected', type==='lgu');
  document.getElementById('type-option-creator').classList.toggle('selected', type==='creator');
  document.getElementById('lgu-fields').style.display = 'block';
  document.getElementById('register-note').style.display = 'block';
}

function populateRegCitySelect(){
  const sel = document.getElementById('reg-location');
  if(!sel) return;
  sel.innerHTML = '<option value="">Select a supported location</option>' + SUPPORTED_LOCATIONS
    .map((location) => `<option value="${location.id}">${location.name}</option>`).join('');
}

function showAlert(id, type, msg){
  const el = document.getElementById(id);
  el.className = 'form-alert ' + type + ' show';
  el.textContent = msg;
}

async function handleLogin(e){
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch(ADMIN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        action: 'login',
        email,
        password
      })
    });

    if (res.ok) {
      const data = await res.json();
      const user = data.user;
      if (!user) {
        throw new Error('No user returned');
      }

      const acct = {
        email: user.email,
        password,
        name: user.name,
        initials: (user.name || 'U').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'U',
        org: user.org,
        city: user.city || 'Malabon City',
        assigned_location: user.assigned_location || '',
        barangay: user.barangay || undefined,
        status: user.status || 'active',
        acls: user.acls || {}
      };

      if (acct.status === 'pending') {
        showAlert('login-alert', 'error', "This account is awaiting approval from the BAHABA team. You'll get an email once it's verified.");
        return;
      }

      enterConsole(acct);
      return;
    }
  } catch (err) {
    console.warn('Admin DB login failed, using local fallback.', err);
  }

  const acct = ACCOUNTS.find(a=>a.email.toLowerCase()===email);
  if(!acct || acct.password !== password){
    showAlert('login-alert', 'error', 'Incorrect email or password. Please try again.');
    return;
  }
  if(acct.status === 'pending'){
    showAlert('login-alert', 'error', "This account is awaiting approval from the BAHABA team. You'll get an email once it's verified.");
    return;
  }
  enterConsole(acct);
}

async function handleRegister(e){
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const password = document.getElementById('reg-password').value;
  const password2 = document.getElementById('reg-password2').value;
  const assignedLocation = document.getElementById('reg-location').value;

  const passwordError = validatePassword(password);
  if(passwordError){
    showAlert('register-alert', 'error', passwordError);
    return;
  }
  if(password !== password2){
    showAlert('register-alert', 'error', 'Passwords do not match.');
    return;
  }
  if(pendingAccountType !== 'lgu'){
    showAlert('register-alert', 'error', 'Platform administrator accounts can only be created by an existing platform administrator.');
    return;
  }
  if(!locationForId(assignedLocation)){
    showAlert('register-alert', 'error', 'Choose one of the supported locations.');
    return;
  }

  try {
    const response = await fetch(ADMIN_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'register', name, email, password, assigned_location: assignedLocation })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Registration could not be submitted.');
    document.getElementById('pending-barangay-name').textContent = locationForId(assignedLocation).name;
    switchAuth('pending');
    e.target.reset();
  } catch(error) {
    showAlert('register-alert', 'error', error.message);
  }
}

function handleForgotPassword(e){
  e.preventDefault();
  const email = document.getElementById('forgot-email').value.trim();
  
  fetch('/forgot-password-notify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ email })
  }).catch(()=>{});

  document.getElementById('reset-sent-email').textContent = email;
  switchAuth('reset-sent');
}

async function refreshPermissions() {
  try {
    const res = await fetch('/permissions/refresh', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        enterConsole(data.user);
        return;
      }
    }
  } catch (e) {
    console.warn('Backend refresh endpoint unreachable, using active session.');
  }
}

function enterConsole(acct){
  session = acct;
  const assignedLocation = locationForId(acct.assigned_location);
  session.city = assignedLocation?.city || acct.city || '';
  if (session.city && session.city !== "Metro Manila (All Cities)") {
    activeCity = session.city;
  }
  session.activeBarangay = acct.barangay || Object.keys(getCityBarangays(activeCity))[0] || 'All barangays';
  loadAdminAccounts().catch(() => {});
  logAction("Account", "Sign in", `User signed in to the console.`);
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-shell').classList.add('active');
  applyPermissions();
  populateBarangaySelects();
  
  // Save session to localStorage for persistence across refreshes
  saveSessionToStorage(session);
  
  const initialView = Object.keys(VIEW_MODULE_MAP).find(v => canViewModule(session, VIEW_MODULE_MAP[v])) || 'command';
  go(initialView);
}

async function signOut(){
  try {
    await fetch(ADMIN_API_URL, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({action:'logout'})
    });
  } catch(e){}

  stopNlpPolling();
  session = null;
  clearSessionFromStorage();
  closeAllDropdowns();
  document.getElementById('app-shell').classList.remove('active');
  document.getElementById('login-screen').style.display = 'flex';
  switchAuth('login');
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
}

populateRegCitySelect();
selectAccountType('lgu');
loadSupportedLocations().then(() => {
  const role = document.getElementById('new-user-role');
  if (role) role.addEventListener('change', () => {
    const locationSelect = document.getElementById('new-user-location');
    locationSelect.disabled = role.value === 'platform-admin';
    locationSelect.required = role.value === 'lgu-admin';
  });
}).catch((error) => console.warn(error.message));
loadAdminAccounts().catch(()=>{});

function applyPermissions(){
  document.getElementById('account-btn-label').textContent = session.org;

  document.querySelectorAll('.sb-link').forEach(link=>{
    const v = link.dataset.view;
    const mod = VIEW_MODULE_MAP[v];
    const allowed = canViewModule(session, mod);
    link.classList.toggle('disabled', !allowed);
    const lock = link.querySelector('[data-lock-icon]');
    if(lock) lock.style.display = allowed ? 'none' : 'inline-flex';
  });

  const allReportsLink = document.querySelector('.sb-link[data-view="all-reports"]');
  if(allReportsLink) allReportsLink.style.display = canAdminModule(session, 'admin_overview') ? 'flex' : 'none';

  document.getElementById('tb-bell-badge').textContent = bellCount();
}

function bellCount(){
  if(canAdminModule(session, 'admin_overview')) return Math.min(AUDIT_LOG.length, 99);
  return REPORTS.filter(r=>r.city===currentCity() && r.barangay===session.barangay && r.status==='pending').length;
}

function populateBarangaySelects(){
  const list = scopedBarangays();
  ['evac-barangay-select','reports-barangay-select','ann-barangay-select'].forEach(id=>{
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = list.map(b=>`<option value="${b}">Brgy. ${b}</option>`).join('');
    el.value = session.activeBarangay;
    el.disabled = list.length <= 1;
    el.style.display = list.length <= 1 ? 'none' : '';
  });
}

/* ============================================================
   Navigation & View Routing Guard
   ============================================================ */
function go(viewName){
  const modKey = VIEW_MODULE_MAP[viewName];
  if(!canViewModule(session, modKey)) {
    showToast('Permission denied: No access to this module');
    return;
  }
  if(viewName === 'all-reports' && !canAdminModule(session, 'admin_overview')) {
    showToast('All Reports is restricted to the BAHABA platform admin');
    return;
  }
  closeAllDropdowns();
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.sb-link').forEach(l=>l.classList.remove('active'));
  document.querySelector(`.view[data-view="${viewName}"]`).classList.add('active');
  const link = document.querySelector(`.sb-link[data-view="${viewName}"]`);
  if(link) link.classList.add('active');

  const titles = {command:'Command Center', evacuees:'Evacuees', reports:'Reports', 'all-reports':'All Reports', announcements:'Announcements', logs:'System Logs & Security', users:'Account Manager'};
  document.getElementById('tb-title').textContent = titles[viewName];
  document.getElementById('tb-scope').textContent = canAdminModule(session, 'admin_overview') ? `All Metro Manila Cities (${activeCity})` : `${session.city} — Brgy. ${session.barangay}`;
  document.getElementById('tb-bell-badge').textContent = bellCount();

  if(viewName==='command') renderCommand();
  if(viewName==='evacuees') renderEvacuees();
  if(viewName==='reports') { renderReports(); fetchReports(); startNlpPolling(); }
  else if(viewName==='all-reports') { renderAllReports(); startAllReportsPolling(); }
  else stopNlpPolling();
  if(viewName==='announcements') { fetchAnnouncements(); renderAnnouncements(); }
  if(viewName==='logs') { fetchLogs(); renderLogs(); }
  if(viewName==='users') renderUserManager();
  document.querySelector('.main').scrollTop = 0;
}

function renderUserManager(){
  const isAdmin = canAdminModule(session, 'admin_overview');
  if (!isAdmin) {
    showToast('Permission denied: Platform admin access required');
    return;
  }

  const adminSearch = (document.getElementById('admin-user-search')?.value || '').trim().toLowerCase();
  const adminStatusFilter = document.getElementById('admin-user-status-filter')?.value || 'all';
  const appSearch = (document.getElementById('app-user-search')?.value || '').trim().toLowerCase();
  const appStatusFilter = document.getElementById('app-user-status-filter')?.value || 'all';

  const adminList = ACCOUNTS || [];
  const appList = APP_USERS || [];
  const totalAdmin = adminList.length;
  const activeAdmin = adminList.filter(a => a.status !== 'disabled').length;
  const totalApp = appList.length;
  const verifiedApp = appList.filter(u => (u.status || '').toLowerCase() === 'verified').length;

  document.getElementById('user-manager-summary').innerHTML = `
    <div class="metric-card"><div class="metric-num">${totalAdmin}</div><div class="metric-label">Admin Users</div></div>
    <div class="metric-card"><div class="metric-num">${activeAdmin}</div><div class="metric-label">Active Admins</div></div>
    <div class="metric-card"><div class="metric-num">${totalApp}</div><div class="metric-label">App Users</div></div>
    <div class="metric-card"><div class="metric-num">${verifiedApp}</div><div class="metric-label">Verified App Users</div></div>
  `;

  const filteredAdmin = adminList.filter((account) => {
    const role = account.acls && account.acls.admin_overview === 'full' ? 'Platform Admin' : 'LGU / Barangay';
    const status = (account.status || 'active') === 'disabled' ? 'disabled' : 'active';
    const text = `${account.name} ${account.email} ${role} ${account.city || ''}`.toLowerCase();
    return text.includes(adminSearch) && (adminStatusFilter === 'all' || status === adminStatusFilter);
  });

  const filteredApp = appList.filter((user) => {
    const status = (user.status || 'pending').toLowerCase();
    const text = `${user.name} ${user.email} ${user.location || user.city || ''}`.toLowerCase();
    return text.includes(appSearch) && (appStatusFilter === 'all' || status === appStatusFilter);
  });

  const adminTable = document.getElementById('user-manager-admin-table-body');
  adminTable.innerHTML = filteredAdmin.map((account) => {
    const role = account.acls && account.acls.admin_overview === 'full' ? 'Platform Admin' : 'LGU / Barangay';
    const status = (account.status || 'active') === 'disabled' ? 'Disabled' : 'Active';
    return `
      <tr>
        <td>${account.name}</td>
        <td>${account.email}</td>
        <td>${role}</td>
        <td>${account.role === 'platform-admin' ? 'All supported locations' : `<select aria-label="Assigned location for ${account.email}" onchange="updateAdminLocation('${account.email}', this.value)"><option value="">Assign location</option>${SUPPORTED_LOCATIONS.map((location) => `<option value="${location.id}" ${account.assigned_location === location.id ? 'selected' : ''}>${location.name}</option>`).join('')}</select>`}</td>
        <td>${status}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-outline btn-sm" onclick="toggleUserStatus('${account.email}')">${status === 'Active' ? 'Disable' : 'Enable'}</button>
            <button class="btn btn-danger btn-sm" onclick="deleteUserAccount('${account.email}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  const appTable = document.getElementById('user-manager-app-table-body');
  appTable.innerHTML = filteredApp.map((user) => {
    const appStatus = (user.status || 'pending').toLowerCase() === 'verified' ? 'Verified' : 'Pending';
    return `
      <tr>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>App User</td>
        <td>${user.location || user.city || '—'}</td>
        <td>${appStatus}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-outline btn-sm" onclick="openAppUserProfile('${user.email}')">View</button>
            <button class="btn btn-primary btn-sm" onclick="openAppUserProfile('${user.email}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteAppUserAccount('${user.id}', '${user.email}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openAppUserProfile(email){
  const user = APP_USERS.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!user) return;

  const modal = document.getElementById('app-user-profile-modal');
  const content = document.getElementById('app-user-profile-content');
  const form = document.getElementById('app-user-edit-form');

  content.innerHTML = `
    <div style="display:grid; gap:10px; margin-bottom:16px;">
      <div><strong>Name:</strong> ${user.name || '—'}</div>
      <div><strong>Email:</strong> ${user.email || '—'}</div>
      <div><strong>City:</strong> ${user.city || '—'}</div>
      <div><strong>Location:</strong> ${user.location || '—'}</div>
      <div><strong>Region:</strong> ${user.region || '—'}</div>
      <div><strong>Status:</strong> ${(user.status || 'pending').toLowerCase() === 'verified' ? 'Verified' : 'Pending'}</div>
    </div>
  `;

  document.getElementById('app-user-edit-name').value = user.name || '';
  document.getElementById('app-user-edit-email').value = user.email || '';
  document.getElementById('app-user-edit-city').value = user.city || '';
  document.getElementById('app-user-edit-location').value = user.location || '';
  document.getElementById('app-user-edit-status').value = (user.status || 'pending').toLowerCase();
  form.dataset.email = user.email;
  modal.style.display = 'flex';
}

function closeAppUserProfile(){
  const modal = document.getElementById('app-user-profile-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function saveAppUserProfile(event){
  event.preventDefault();
  const form = document.getElementById('app-user-edit-form');
  const originalEmail = form.dataset.email;
  const updatedName = document.getElementById('app-user-edit-name').value.trim();
  const updatedEmail = document.getElementById('app-user-edit-email').value.trim();
  const updatedCity = document.getElementById('app-user-edit-city').value.trim();
  const updatedLocation = document.getElementById('app-user-edit-location').value.trim();
  const updatedStatus = document.getElementById('app-user-edit-status').value;

  if (!updatedName || !updatedEmail) {
    showToast('Name and email are required');
    return;
  }

  const index = APP_USERS.findIndex((user) => user.email.toLowerCase() === originalEmail.toLowerCase());
  if (index !== -1) {
    APP_USERS[index].name = updatedName;
    APP_USERS[index].email = updatedEmail;
    APP_USERS[index].city = updatedCity || APP_USERS[index].city;
    APP_USERS[index].location = updatedLocation || APP_USERS[index].location;
    APP_USERS[index].status = updatedStatus;
  }

  closeAppUserProfile();
  renderUserManager();
  showToast('App user details updated');
}


async function toggleUserStatus(email){
  if (!canAdminModule(session, 'admin_overview')) {
    showToast('Permission denied: only full admins can update account status');
    return;
  }
  const user = ACCOUNTS.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!user) return;

  const nextStatus = user.status === 'disabled' ? 'active' : 'disabled';
  user.status = nextStatus;

  try {
    const response = await fetch(ADMIN_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'users', mode: 'update', email: user.email, status: nextStatus })
    });
    if (!response.ok) {
      throw new Error('Update failed');
    }
  } catch (error) {
    console.warn('Status change was not persisted to DB:', error);
  }

  renderUserManager();
  showToast(`${user.name} ${user.status === 'disabled' ? 'disabled' : 'enabled'}`);
}

async function deleteUserAccount(email){
  if (!canAdminModule(session, 'admin_overview')) {
    showToast('Permission denied: only full admins can delete accounts');
    return;
  }
  const index = ACCOUNTS.findIndex((item) => item.email.toLowerCase() === email.toLowerCase());
  if (index === -1) return;
  if (email.toLowerCase() === session.email.toLowerCase()) {
    showToast('You cannot delete the currently signed-in account');
    return;
  }

  try {
    const response = await fetch(ADMIN_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'users', mode: 'delete', email })
    });
    if (!response.ok) {
      throw new Error('Delete failed');
    }
  } catch (error) {
    console.warn('Account delete was not persisted to DB:', error);
  }

  ACCOUNTS.splice(index, 1);
  renderUserManager();
  showToast('User removed from the admin list');
}

async function deleteAppUserAccount(userId, email){
  if (!canAdminModule(session, 'admin_overview')) {
    showToast('Permission denied: only full admins can delete app user accounts');
    return;
  }
  
  const confirmDelete = confirm(`Are you sure you want to delete this app user account (${email})? This action cannot be undone.`);
  if (!confirmDelete) return;
  
  const index = APP_USERS.findIndex((user) => user.id === userId || user.email.toLowerCase() === email.toLowerCase());
  if (index === -1) return;

  try {
    const response = await fetch(ADMIN_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'app-user-delete', user_id: userId, email })
    });
    if (!response.ok) {
      throw new Error('Delete failed');
    }
  } catch (error) {
    console.warn('App user account delete was not persisted to DB:', error);
    showToast('Error deleting account');
    return;
  }

  APP_USERS.splice(index, 1);
  renderUserManager();
  showToast(`App user ${email} has been deleted`);
}

async function addUserAccount(event){
  event.preventDefault();
  if (!canAdminModule(session, 'admin_overview')) {
    showToast('Permission denied: only full admins can add accounts');
    return;
  }

  const name = document.getElementById('new-user-name').value.trim();
  const email = document.getElementById('new-user-email').value.trim().toLowerCase();
  const role = document.getElementById('new-user-role').value;
  const assignedLocation = document.getElementById('new-user-location').value;
  const password = document.getElementById('new-user-password').value;

  if (!name || !email || !password) {
    showToast('Complete all required account fields');
    return;
  }
  if (ACCOUNTS.some((item) => item.email.toLowerCase() === email)) {
    showToast('This email already exists in the admin list');
    return;
  }
  const location = locationForId(assignedLocation);
  if (role === 'lgu-admin' && !location) {
    showToast('Choose a supported assigned location');
    return;
  }

  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'U';
  const roleBase = {
    'platform-admin': {
      org: 'BAHABA Platform Admin',
      city: 'Metro Manila (All Cities)',
      acls: { admin_overview: 'full', announcements: 'full', products: 'full', approval_board: 'full', approval_board_hr: 'full' }
    },
    'lgu-admin': {
      org: `${location?.name || 'LGU'} LGU`,
      city: location?.city || '',
      acls: { admin_overview: 'view', announcements: 'edit', products: 'edit', approval_board: 'edit', approval_board_hr: 'no_access' }
    }
  }[role] || {
    org: 'BAHABA Platform Admin',
    city: 'Metro Manila (All Cities)',
    acls: { admin_overview: 'full', announcements: 'full', products: 'full', approval_board: 'full', approval_board_hr: 'full' }
  };

  const payload = {
    action: 'users',
    mode: 'add',
    name,
    email,
    password,
    role,
    city: roleBase.city,
    assigned_location: role === 'lgu-admin' ? assignedLocation : null,
    org: roleBase.org,
  };

  try {
    const response = await fetch(ADMIN_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || 'Server rejected the admin user');
    }
  } catch (error) {
    showToast(error.message || 'Admin account could not be saved');
    return;
  }

  ACCOUNTS.push({
    email,
    password,
    name,
    initials,
    org: roleBase.org,
    city: roleBase.city,
    assigned_location: role === 'lgu-admin' ? assignedLocation : '',
    ip: 'IP: 10.0.4.' + (20 + ACCOUNTS.length),
    status: 'active',
    acls: roleBase.acls
  });

  document.getElementById('new-user-form').reset();
  renderUserManager();
  showToast(`${name} was added to the account manager`);
}

function riskMeta(risk){
  return {
    high:{label:'High', cls:'risk-high', fill:'85%'},
    medium:{label:'Medium', cls:'risk-medium', fill:'50%'},
    low:{label:'Low', cls:'risk-low', fill:'22%'},
    none:{label:'None', cls:'risk-none', fill:'6%'}
  }[risk] || {label:'Normal', cls:'risk-none', fill:'6%'};
}

/* ============================================================
   Topbar Dropdowns
   ============================================================ */
function toggleDropdown(which){
  if(which==='module') renderModulePanel();
  if(which==='account') renderAccountPanel();
  if(which==='bell'){ closeAllDropdowns(); return; }
  const panel = document.getElementById(which==='module' ? 'module-panel' : 'account-panel');
  const isOpen = panel.classList.contains('open');
  closeAllDropdowns();
  if(!isOpen) panel.classList.add('open');
}
function closeAllDropdowns(){
  document.getElementById('module-panel').classList.remove('open');
  document.getElementById('account-panel').classList.remove('open');
}
document.addEventListener('click', (e)=>{
  if(!e.target.closest('.tb-dropdown-wrap')) closeAllDropdowns();
});

function renderModulePanel(){
  if(!session) return;
  const panel = document.getElementById('module-panel');
  const available = [
    {id:'command', label:'Operations Module', mod:'admin_overview'},
    {id:'users', label:'Account Manager', mod:'admin_overview'},
    {id:'logs', label:'Platform Admin Module', mod:'approval_board_hr'}
  ].filter(m => canViewModule(session, m.mod));

  panel.innerHTML = available.map(m=>
    `<div class="tb-dropdown-item" onclick="go('${m.id}')">${m.label}</div>`
  ).join('');
}

function renderAccountPanel(){
  if(!session) return;
  const panel = document.getElementById('account-panel');
  panel.innerHTML = `
    <div style="display:flex; gap:10px; align-items:center; padding:8px 10px 12px; border-bottom:1px solid var(--line); margin-bottom:6px;">
      <div class="tb-avatar">${session.initials}</div>
      <div><div style="font-weight:700; font-size:13px;">${session.name}</div><div style="font-size:11.5px; color:var(--ink-soft);">${session.org}</div></div>
    </div>
    <div class="tb-dropdown-item" onclick="signOut()" style="color:var(--coral-600);">Switch account</div>
  `;
}

/* ============================================================
   Command Center
   ============================================================ */
async function loadCommandCenter(){
  if(!session) return;
  const selector = document.getElementById('command-location-select');
  const isPlatformAdmin = canAdminModule(session, 'admin_overview');
  const locationId = isPlatformAdmin
    ? (selector.value || SUPPORTED_LOCATIONS[0]?.id)
    : session.assigned_location;
  const location = locationForId(locationId);
  const label = document.getElementById('command-location-label');
  if(label) label.textContent = location ? location.name : 'Location not assigned';
  if(selector){
    selector.style.display = isPlatformAdmin ? '' : 'none';
    selector.disabled = !isPlatformAdmin;
    if(isPlatformAdmin && locationId) selector.value = locationId;
  }
  if(!locationId){
    showCommandCenterMessage('This account has no supported location assignment. Ask a platform administrator to update it.');
    return;
  }

  try{
    const response = await fetch(`${ADMIN_API_URL}?action=command-center&location=${encodeURIComponent(locationId)}`, {credentials:'include'});
    const data = await response.json().catch(() => ({}));
    if(!response.ok) throw new Error(data.error || 'Command Center information could not be loaded.');
    const center = data.commandCenter || {};
    const fields = {
      name: 'command-center-name',
      hotline: 'command-center-hotline',
      telephone: 'command-center-telephone',
      mobile_number: 'command-center-mobile',
      email: 'command-center-email',
      facebook_page: 'command-center-facebook',
      address: 'command-center-address',
      emergency_contact: 'command-center-emergency',
      other_information: 'command-center-other',
    };
    Object.entries(fields).forEach(([field, id]) => { document.getElementById(id).value = center[field] || ''; });
    showCommandCenterMessage('');
  }catch(error){
    showCommandCenterMessage(error.message, true);
  }
}

function showCommandCenterMessage(message, isError = false){
  const alert = document.getElementById('command-center-alert');
  if(!alert) return;
  alert.textContent = message;
  alert.className = message ? `form-alert ${isError ? 'error' : 'success'} show` : 'form-alert';
}

async function saveCommandCenter(event){
  event.preventDefault();
  const locationId = canAdminModule(session, 'admin_overview')
    ? document.getElementById('command-location-select').value
    : session.assigned_location;
  if(!locationForId(locationId)){
    showCommandCenterMessage('Choose a supported location before saving.', true);
    return;
  }
  const payload = {
    action: 'command-center-save',
    location_id: locationId,
    name: document.getElementById('command-center-name').value.trim(),
    hotline: document.getElementById('command-center-hotline').value.trim(),
    telephone: document.getElementById('command-center-telephone').value.trim(),
    mobile_number: document.getElementById('command-center-mobile').value.trim(),
    email: document.getElementById('command-center-email').value.trim(),
    facebook_page: document.getElementById('command-center-facebook').value.trim(),
    address: document.getElementById('command-center-address').value.trim(),
    emergency_contact: document.getElementById('command-center-emergency').value.trim(),
    other_information: document.getElementById('command-center-other').value.trim(),
  };
  try{
    const response = await fetch(ADMIN_API_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json', Accept:'application/json'},
      credentials:'include',
      body:JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if(!response.ok) throw new Error(result.error || 'Command Center changes were rejected.');
    showCommandCenterMessage('Command Center information saved.');
    logAction('Command Center', 'Update', `Command Center information updated for ${locationForId(locationId).name}.`);
  }catch(error){
    showCommandCenterMessage(error.message, true);
  }
}

function renderCommand(){
  const isFullAdmin = canAdminModule(session, 'admin_overview');
  const cCity = currentCity();
  
  document.getElementById('command-banner').innerHTML = isFullAdmin ? `
    <div class="locked-banner">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="flex-shrink:0;"><path d="M12 2l8 4v6c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6l8-4Z"/><path d="M9 12.5l2 2 4-4.5"/></svg>
      <div><b>Full platform access.</b> You are viewing Metro Manila flood management operations. Currently displaying: <b>${cCity}</b>.</div>
    </div>` : '';

  const scope = scopedBarangays();
  const cityData = getCityBarangays(cCity);

  document.getElementById('command-sub').textContent = isFullAdmin
    ? `Live flood status across active barangays in ${cCity}.`
    : `Live flood status for Barangay ${session.barangay}, ${session.city}.`;
  document.getElementById('command-panel-title').textContent = `Barangay Status — ${cCity}`;

  const totals = scope.reduce((acc,b)=>{
    const d = cityData[b] || { affected: 0, centers: [], teams: 0 };
    const centerEvac = (d.centers || []).reduce((s,c)=>s+c.evacuees,0);
    acc.affected += d.affected || 0; 
    acc.evacuees += centerEvac; 
    acc.centers += (d.centers || []).length; 
    acc.teams += d.teams || 0;
    return acc;
  }, {affected:0, evacuees:0, centers:0, teams:0});

  document.getElementById('command-metrics').innerHTML = `
    <div class="metric-card"><div class="metric-num danger">${totals.affected.toLocaleString()}</div><div class="metric-label">Affected Residents</div></div>
    <div class="metric-card"><div class="metric-num">${totals.evacuees.toLocaleString()}</div><div class="metric-label">Current Evacuees</div></div>
    <div class="metric-card"><div class="metric-num">${totals.centers}</div><div class="metric-label">Evacuation Centers</div></div>
    <div class="metric-card"><div class="metric-num">${totals.teams}</div><div class="metric-label">Teams Deployed</div></div>
  `;

  document.getElementById('command-ledger').innerHTML = scope.map(b=>{
    const d = cityData[b] || { risk: "none", affected: 0, centers: [], teams: 0 };
    const rm = riskMeta(d.risk);
    const centerEvac = (d.centers || []).reduce((s,c)=>s+c.evacuees,0);
    const clickable = isFullAdmin;
    return `<div class="ledger-row ${d.risk}" ${clickable ? `style="cursor:pointer;" onclick="jumpToBarangay('${b}')"` : ''}>
      <div>
        <div class="ledger-name">Barangay ${b}</div>
        <div class="ledger-sub">${cCity}</div>
      </div>
      <span class="tide-badge ${rm.cls}" style="margin-left:14px;"><span class="tide-vial"><span class="tide-fill" style="height:${rm.fill};"></span></span>${rm.label}</span>
      <div class="ledger-stats">
        <div class="ledger-stat"><div class="n">${d.affected.toLocaleString()}</div><div class="l">Affected</div></div>
        <div class="ledger-stat"><div class="n">${centerEvac.toLocaleString()}</div><div class="l">Evacuees</div></div>
        <div class="ledger-stat"><div class="n">${d.teams}</div><div class="l">Teams</div></div>
      </div>
    </div>`;
  }).join('');
  loadCommandCenter();
}

function jumpToBarangay(b){
  session.activeBarangay = b;
  populateBarangaySelects();
  go('evacuees');
}

/* ============================================================
   Evacuees
   ============================================================ */
function renderEvacuees(){
  const sel = document.getElementById('evac-barangay-select');
  const b = sel.value || session.activeBarangay;
  session.activeBarangay = b;
  const cCity = currentCity();

  const canEditCount = canCreateModule(session, 'products');
  document.getElementById('evac-scope-banner').innerHTML = canAdminModule(session, 'products') ? `
    <div class="locked-banner">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21v-6h6v6"/></svg>
      <div>Platform admin — updating evacuation centers in <b>${cCity}</b>.</div>
    </div>` : `
    <div class="locked-banner">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s7-6.5 7-11.5a7 7 0 0 0-14 0C5 14.5 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.4"/></svg>
      <div>Managing centers for <b>Barangay ${b}, ${cCity}</b>.</div>
    </div>`;

  const cityData = getCityBarangays(cCity);
  const data = cityData[b] || { centers: [] };
  
  document.getElementById('evac-grid').innerHTML = data.centers.map(c=>{
    const pct = Math.min(100, Math.round((c.evacuees/c.capacity)*100));
    const fillCls = pct>=90 ? 'full' : pct>=65 ? 'warn' : '';
    return `<div class="evac-card">
      <div class="evac-card-head">
        <div><div class="evac-title">${c.name}</div><div class="evac-loc">Brgy. ${b}, ${cCity}</div></div>
      </div>
      <div class="cap-bar-track"><div class="cap-bar-fill ${fillCls}" style="width:${pct}%;"></div></div>
      <div class="evac-nums"><span>${c.evacuees.toLocaleString()} evacuees</span><span>${c.capacity.toLocaleString()} capacity</span></div>
      ${canEditCount ? `
      <div class="evac-edit-row">
        <input type="number" min="0" max="${c.capacity}" value="${c.evacuees}" id="evac-input-${c.id}">
        <button class="btn btn-outline btn-sm" onclick="updateEvacCount('${b}','${c.id}')">Update count</button>
      </div>` : ''}
    </div>`;
  }).join('');
}

function updateEvacCount(b, centerId){
  if (!canCreateModule(session, 'products')) {
    showToast('Permission denied: Cannot modify counts');
    return;
  }
  const cCity = currentCity();
  const input = document.getElementById(`evac-input-${centerId}`);
  const val = Math.max(0, parseInt(input.value || '0', 10));
  const cityData = getCityBarangays(cCity);
  const center = cityData[b].centers.find(c=>c.id===centerId);
  center.evacuees = Math.min(val, center.capacity);
  renderEvacuees();
  logAction("Evacuees", "Update", `Evacuee count for "${center.name}" (Brgy. ${b}, ${cCity}) changed to ${center.evacuees.toLocaleString()}.`);
  showToast(`${center.name} updated — ${center.evacuees.toLocaleString()} evacuees`);
}

/* ============================================================
   Reports
   ============================================================ */
function escapeNlpText(value){
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[char]));
}

function normalizedPlace(value){
  return String(value || '').trim().toLowerCase().replace(/\s+city$/i, '').replace(/\s+/g, ' ');
}

function formatNlpTime(value){
  if(!value) return '—';
  const parsed = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? escapeNlpText(value) : parsed.toLocaleString([], {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'});
}

function safeSocialPostUrl(value){
  try{
    const url = new URL(String(value || ''));
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  }catch{
    return '';
  }
}

function renderNlpMonitor(){
  const statsHolder = document.getElementById('nlp-stats');
  const eventHolder = document.getElementById('nlp-events-list');
  if(!statsHolder || !eventHolder) return;

  const selectedBarangay = document.getElementById('reports-barangay-select')?.value || session?.activeBarangay || '';
  const city = normalizedPlace(currentCity());
  const events = NLP_EVENTS.filter(event => {
    const eventCity = normalizedPlace(event.city);
    const cityMatch = !eventCity || eventCity === city || city === 'metro manila (all cities)';
    const barangayMatch = !event.barangay || !selectedBarangay || normalizedPlace(event.barangay) === normalizedPlace(selectedBarangay);
    return cityMatch && barangayMatch;
  });

  statsHolder.innerHTML = `
    <div class="nlp-stat-card"><span>Posts analyzed · 24h</span><strong>${Number(NLP_STATS.total || 0).toLocaleString()}</strong></div>
    <div class="nlp-stat-card flood"><span>Flood signals</span><strong>${Number(NLP_STATS.flood || 0).toLocaleString()}</strong></div>
    <div class="nlp-stat-card urgent"><span>High severity</span><strong>${Number(NLP_STATS.highSeverity || 0).toLocaleString()}</strong></div>
    <div class="nlp-stat-card confidence"><span>Average confidence</span><strong>${Number(NLP_STATS.avgConfidence || 0).toFixed(1)}%</strong></div>
  `;

  const status = document.getElementById('nlp-live-badge');
  const statusLabel = document.getElementById('nlp-live-label');
  if(status) status.className = `nlp-live-badge ${nlpFeedStatus}`;
  if(statusLabel) statusLabel.textContent = nlpFeedStatus === 'live' ? 'Live' : nlpFeedStatus === 'offline' ? 'Feed offline' : 'Connecting';
  const resultsCount = document.getElementById('nlp-results-count');
  if(resultsCount) resultsCount.textContent = nlpLastUpdated ? `${events.length} matching results · synced ${nlpLastUpdated}` : 'Waiting for first sync';
  const alert = document.getElementById('nlp-feed-alert');
  if(alert){
    alert.style.display = nlpFeedStatus === 'offline' ? 'block' : 'none';
    alert.textContent = nlpFeedMessage || 'The live NLP API is unavailable. The monitor will retry automatically.';
  }

  if(!events.length){
    eventHolder.innerHTML = `<tr><td colspan="6" class="nlp-empty">${NLP_EVENTS.length ? 'No NLP results match this city or barangay yet.' : nlpIngestionConfigured ? 'The NLP receiver is ready, but no Facebook/X post collector is connected yet. Connect an authorized source collector to send posts to the inference service.' : 'NLP ingestion is not configured yet.'}</td></tr>`;
    return;
  }

  eventHolder.innerHTML = events.map(event => {
    const severityClass = String(event.severity || '').toLowerCase();
    const urgencyClass = String(event.urgency || '').toLowerCase();
    const confidence = Math.max(0, Math.min(100, Number(event.confidence_percent) || 0));
    const place = [event.barangay ? `Brgy. ${event.barangay}` : '', event.city || '', event.location || ''].filter(Boolean).join(' · ');
    const postUrl = safeSocialPostUrl(event.post_url);
    return `<tr>
      <td class="nlp-post-cell"><div class="nlp-source-mark">${escapeNlpText(event.source || 'NLP').slice(0, 1).toUpperCase()}</div><div class="nlp-post-copy"><strong>${escapeNlpText(event.post_text || '')}</strong><small>${escapeNlpText(event.source || 'NLP')}${place ? ` · ${escapeNlpText(place)}` : ''}</small>${postUrl ? `<a class="nlp-original-link" href="${escapeNlpText(postUrl)}" target="_blank" rel="noopener noreferrer">Open original post ↗</a>` : ''}</div></td>
      <td><span class="nlp-classification ${event.classification === 'Flood' ? 'is-flood' : 'is-non-flood'}">${escapeNlpText(event.classification || 'Unknown')}</span></td>
      <td><span class="nlp-chip nlp-severity-${severityClass}">${escapeNlpText(event.severity || '—')}</span></td>
      <td><span class="nlp-chip nlp-urgency-${urgencyClass}">${escapeNlpText(event.urgency || '—')}</span></td>
      <td><div class="nlp-confidence"><span>${confidence.toFixed(1)}%</span><i><b style="width:${confidence}%"></b></i></div></td>
      <td class="nlp-time">${formatNlpTime(event.detected_at)}</td>
    </tr>`;
  }).join('');
}

async function refreshNlpEvents(){
  const params = new URLSearchParams({action:'nlp-events', limit:'100'});
  const city = currentCity();
  const barangay = document.getElementById('reports-barangay-select')?.value || session?.activeBarangay || '';
  const locationId = session?.assigned_location || locationIdForCity(city);
  if(locationId) params.set('location', locationId);
  else if(city) params.set('city', city);
  if(barangay && barangay !== 'All barangays') params.set('barangay', barangay);
  try{
    const response = await fetch(`${ADMIN_API_URL}?${params.toString()}`, {credentials:'include', headers:{Accept:'application/json'}});
    const payload = await response.json().catch(() => ({}));
    if(!response.ok){
      const error = new Error(payload.error || 'NLP event feed unavailable');
      error.status = response.status;
      throw error;
    }
    NLP_EVENTS = Array.isArray(payload.events) ? payload.events : [];
    NLP_STATS = {...NLP_STATS, ...(payload.stats || {})};
    nlpIngestionConfigured = Boolean(payload.ingestionConfigured);
    nlpFeedStatus = nlpIngestionConfigured ? 'live' : 'offline';
    nlpFeedMessage = nlpIngestionConfigured ? '' : 'The NLP receiver is not configured: api/config.php has no nlp_ingest_token. Add a strong token and configure the detector to POST results to api.php?action=nlp-ingest.';
    nlpLastUpdated = new Date().toLocaleTimeString([], {hour:'numeric', minute:'2-digit', second:'2-digit'});
  }catch(error){
    nlpFeedStatus = 'offline';
    nlpIngestionConfigured = false;
    nlpFeedMessage = error.status === 401
      ? 'Admin session is missing or expired. Sign in again through the BAHABA-ADMIN site at http://localhost:8001/; opening index.html as a file does not establish the API session.'
      : error.status === 403
        ? 'Your account does not have permission to view the NLP monitor. Ask a platform administrator to check your Reports access.'
        : error.status
          ? `NLP API request failed (${error.status}): ${error.message}`
          : 'Cannot connect to the admin API at localhost:8001. Start the BAHABA-ADMIN PHP server and keep it running; the monitor will retry automatically.';
    console.warn('NLP monitor refresh failed:', error.message);
  }
  renderNlpMonitor();
}

function startNlpPolling(){
  stopNlpPolling();
  refreshNlpEvents();
  nlpPollTimer = window.setInterval(refreshNlpEvents, 5000);
}

function startAllReportsPolling(){
  stopNlpPolling();
  refreshAllReports();
  nlpPollTimer = window.setInterval(refreshAllReports, 5000);
}

function stopNlpPolling(){
  if(nlpPollTimer){ window.clearInterval(nlpPollTimer); nlpPollTimer = null; }
}

function normalizePlatformReport(report){
  const source = String(report.source || 'citizen').toLowerCase() === 'nlp' ? 'nlp' : 'citizen';
  return {
    key: `report-${report.id}`,
    source,
    sourceLabel: report.platform || (source === 'nlp' ? 'NLP' : 'Resident'),
    city: report.city || 'Location unavailable',
    barangay: report.barangay || 'Unspecified barangay',
    text: report.description || '',
    status: report.status || 'pending',
    severity: String(report.severity || 'medium').toLowerCase(),
    urgency: '',
    confidence: null,
    postUrl: safeSocialPostUrl(report.original_post_url || report.post_url || report.url),
    timestamp: report.created_at || '',
    reporter: report.reporter || (source === 'nlp' ? 'NLP System' : 'Resident'),
    classification: source === 'nlp' ? 'Flood report' : 'Resident report',
  };
}

function normalizeNlpPlatformEvent(event){
  const severity = String(event.severity || '').toLowerCase();
  return {
    key: `nlp-${event.id || event.source_post_id || `${event.source}-${event.detected_at}`}`,
    source: 'nlp',
    sourceLabel: event.source || 'NLP',
    city: event.city || event.location || 'Location unavailable',
    barangay: event.barangay || '',
    text: event.post_text || '',
    status: 'new',
    severity: severity === 'mid' ? 'medium' : severity || 'low',
    urgency: event.urgency || '',
    confidence: Number(event.confidence_percent) || 0,
    timestamp: event.detected_at || event.received_at || '',
    postUrl: safeSocialPostUrl(event.post_url),
    reporter: 'NLP System',
    classification: event.classification || 'Flood signal',
  };
}

function platformReportFallback(){
  return REPORTS.map(report => ({...normalizePlatformReport({
    ...report,
    description: report.desc,
    created_at: report.time,
  }), key:`demo-${report.id}`, demo:true}));
}

async function refreshAllReports(){
  try{
    const response = await fetch(`${ADMIN_API_URL}?action=all-reports`, {credentials:'include', headers:{Accept:'application/json'}});
    const payload = await response.json().catch(() => ({}));
    if(!response.ok){
      const error = new Error(payload.error || 'Could not load all reports');
      error.status = response.status;
      throw error;
    }

    const reports = Array.isArray(payload.reports) ? payload.reports.map(normalizePlatformReport) : [];
    const nlpEvents = Array.isArray(payload.nlpEvents) ? payload.nlpEvents.map(normalizeNlpPlatformEvent) : [];
    ALL_NLP_EVENTS = Array.isArray(payload.nlpEvents) ? payload.nlpEvents : [];
    ALL_NLP_STATS = {...ALL_NLP_STATS, ...(payload.nlpStats || {})};
    allNlpIngestionConfigured = Boolean(payload.ingestionConfigured);
    allNlpServiceHealth = payload.nlpService || {};
    const serverRows = [...reports, ...nlpEvents].sort((left, right) => {
      const leftTime = Date.parse(String(left.timestamp).replace(' ', 'T')) || 0;
      const rightTime = Date.parse(String(right.timestamp).replace(' ', 'T')) || 0;
      return rightTime - leftTime;
    });
    allReportsDemoFallback = serverRows.length === 0;
    ALL_PLATFORM_REPORTS = serverRows.length ? serverRows : platformReportFallback();
    allReportsFeedError = '';
    allReportsLastUpdated = new Date().toLocaleTimeString([], {hour:'numeric', minute:'2-digit', second:'2-digit'});
  }catch(error){
    allReportsFeedError = error.status === 401
      ? 'Admin session is missing or expired. Sign in again to load platform-wide reports.'
      : error.status === 403
        ? 'Your account is not authorized to view reports across all locations.'
        : `The all-reports API could not be reached: ${error.message}`;
      allNlpIngestionConfigured = false;
      allNlpServiceHealth = {};
    allReportsDemoFallback = true;
    ALL_PLATFORM_REPORTS = platformReportFallback();
    console.warn('All-reports refresh failed:', error.message);
  }
  renderAllNlpMonitor();
  renderAllReports();
}

function renderAllNlpMonitor(){
  const holder = document.getElementById('all-nlp-events-list');
  if(!holder) return;

  const status = document.getElementById('all-nlp-live-badge');
  const statusLabel = document.getElementById('all-nlp-live-label');
  const ingestionNotReady = !allNlpIngestionConfigured && !allReportsFeedError;
  const facebookConfigured = Boolean(allNlpServiceHealth.facebook_collector_configured);
  const facebookWebhookConfigured = Boolean(allNlpServiceHealth.facebook_webhook_configured);
  const facebookCollectionMode = String(allNlpServiceHealth.facebook_collection_mode || 'not_configured');
  const facebookWebhookUrl = String(allNlpServiceHealth.facebook_webhook_public_url || 'https://YOUR-PUBLIC-HTTPS-HOST/webhooks/facebook');
  const facebookRunning = Boolean(allNlpServiceHealth.facebook_collector_running);
  const facebookError = String(allNlpServiceHealth.facebook_last_error || '');
  const waitingForCollector = !allReportsFeedError && !ingestionNotReady && ALL_NLP_EVENTS.length === 0;
  const collectorNotReady = waitingForCollector && !facebookConfigured;
  const collectorIssue = waitingForCollector && facebookConfigured && !facebookRunning;
  const facebookPollingMode = facebookCollectionMode === 'polling';
  const webhookWaiting = waitingForCollector && facebookWebhookConfigured && facebookRunning;
  if(status) status.className = `nlp-live-badge ${allReportsFeedError || ingestionNotReady || collectorIssue ? 'offline' : waitingForCollector ? 'ready' : 'live'}`;
  if(statusLabel) statusLabel.textContent = allReportsFeedError ? 'Feed offline' : ingestionNotReady ? 'Ingestion not configured' : collectorIssue ? 'Collector issue' : collectorNotReady ? 'Waiting for Meta setup' : webhookWaiting ? 'Webhook ready · waiting for event' : waitingForCollector && facebookPollingMode ? 'Polling Page · ~60 sec' : waitingForCollector ? 'Facebook collector ready' : 'Live · all locations';

  const statsHolder = document.getElementById('all-nlp-stats');
  if(statsHolder){
    statsHolder.innerHTML = `
      <div class="nlp-stat-card"><span>Posts analyzed · 24h</span><strong>${Number(ALL_NLP_STATS.total || 0).toLocaleString()}</strong></div>
      <div class="nlp-stat-card flood"><span>Flood signals</span><strong>${Number(ALL_NLP_STATS.flood || 0).toLocaleString()}</strong></div>
      <div class="nlp-stat-card urgent"><span>High severity</span><strong>${Number(ALL_NLP_STATS.highSeverity || 0).toLocaleString()}</strong></div>
      <div class="nlp-stat-card confidence"><span>Average confidence</span><strong>${Number(ALL_NLP_STATS.avgConfidence || 0).toFixed(1)}%</strong></div>
    `;
  }

  const alert = document.getElementById('all-nlp-feed-alert');
  if(alert){
    alert.style.display = allReportsFeedError || ingestionNotReady || waitingForCollector ? 'block' : 'none';
    alert.textContent = allReportsFeedError
      || (ingestionNotReady ? 'Post detection cannot reach this dashboard yet: the admin API has no NLP ingestion token configured.' : '')
      || (collectorIssue ? `Facebook Page collector is enabled but stopped. ${escapeNlpText(facebookError || 'Check service logs and Page API permissions.')}` : '')
      || (collectorNotReady ? 'The NLP models are ready, but Facebook webhook setup is missing. Add your Page ID, Page access token, Meta App Secret, a random webhook verify token, and a public HTTPS callback URL to nlp-service/.env; subscribe the Page feed in Meta.' : '')
      || (webhookWaiting ? `Webhook mode is ready. In Meta for Developers, subscribe the Page to feed changes and set its callback URL to ${escapeNlpText(facebookWebhookUrl)}. This local callback must be exposed through public HTTPS for Meta to reach it.` : '')
      || (waitingForCollector && facebookPollingMode ? 'Facebook Page polling is active (about once per minute); it is not push-real-time. Configure the Meta webhook callback for immediate post notifications.' : '')
      || (waitingForCollector ? 'The Facebook Page collector is running and waiting for new eligible Page posts.' : '');
  }
  const count = document.getElementById('all-nlp-results-count');
  if(count) count.textContent = allReportsLastUpdated ? `${ALL_NLP_EVENTS.length} detections across all locations · synced ${allReportsLastUpdated}` : 'Waiting for first sync';

  if(!ALL_NLP_EVENTS.length){
    holder.innerHTML = `<tr><td colspan="7" class="nlp-empty">${allReportsFeedError ? escapeNlpText(allReportsFeedError) : ingestionNotReady ? 'NLP ingestion is not configured, so results cannot reach the dashboard.' : collectorIssue ? `The Facebook Page collector stopped: ${escapeNlpText(facebookError || 'check service logs and Page API permissions')}` : collectorNotReady ? 'Configure a Page ID, Page access token, Meta App Secret, verify token, and public HTTPS webhook callback; then subscribe the Page feed in Meta.' : webhookWaiting ? 'Real-time webhook is ready; subscribe the Page feed in Meta and point its public HTTPS callback to the configured webhook URL.' : waitingForCollector && facebookPollingMode ? 'Polling mode checks periodically. Configure and subscribe the Meta Page webhook for real-time notifications.' : waitingForCollector ? 'The Facebook Page collector is waiting for eligible posts.' : 'No NLP posts have been received yet.'}</td></tr>`;
    return;
  }

  holder.innerHTML = ALL_NLP_EVENTS.map(event => {
    const confidence = Math.max(0, Math.min(100, Number(event.confidence_percent) || 0));
    const severityClass = String(event.severity || '').toLowerCase();
    const urgencyClass = String(event.urgency || '').toLowerCase();
    const place = [event.barangay ? `Brgy. ${event.barangay}` : '', event.city || '', event.location || ''].filter(Boolean).join(' · ');
    const postUrl = safeSocialPostUrl(event.post_url);
    return `<tr>
      <td class="nlp-post-cell"><div class="nlp-source-mark">${escapeNlpText(event.source || 'NLP').slice(0,1).toUpperCase()}</div><div class="nlp-post-copy"><strong>${escapeNlpText(event.post_text || '')}</strong><small>${escapeNlpText(event.source || 'NLP')}${place ? ` · ${escapeNlpText(place)}` : ''}</small></div></td>
      <td><span class="nlp-classification ${event.classification === 'Flood' ? 'is-flood' : 'is-non-flood'}">${escapeNlpText(event.classification || 'Unknown')}</span></td>
      <td><span class="nlp-chip nlp-severity-${severityClass}">${escapeNlpText(event.severity || '—')}</span></td>
      <td><span class="nlp-chip nlp-urgency-${urgencyClass}">${escapeNlpText(event.urgency || '—')}</span></td>
      <td><div class="nlp-confidence"><span>${confidence.toFixed(1)}%</span><i><b style="width:${confidence}%"></b></i></div></td>
      <td class="nlp-time">${formatNlpTime(event.detected_at)}</td>
      <td>${postUrl ? `<a class="nlp-open-post" href="${escapeNlpText(postUrl)}" target="_blank" rel="noopener noreferrer">Open post ↗</a>` : '<span class="nlp-no-link" title="The detector did not provide a post URL">No source link</span>'}</td>
    </tr>`;
  }).join('');
}

function renderAllReports(){
  const holder = document.getElementById('all-reports-list');
  if(!holder) return;

  const query = (document.getElementById('all-reports-search')?.value || '').trim().toLowerCase();
  const sourceFilter = document.getElementById('all-reports-source')?.value || 'all';
  const statusFilter = document.getElementById('all-reports-status')?.value || 'all';
  const rows = ALL_PLATFORM_REPORTS.filter(report => {
    const matchesSource = sourceFilter === 'all' || report.source === sourceFilter;
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const haystack = [report.text, report.city, report.barangay, report.sourceLabel, report.reporter, report.classification, report.severity, report.urgency]
      .join(' ').toLowerCase();
    return matchesSource && matchesStatus && (!query || haystack.includes(query));
  });

  const total = ALL_PLATFORM_REPORTS.length;
  const newSignals = ALL_PLATFORM_REPORTS.filter(report => report.status === 'new' || report.status === 'pending').length;
  const floodSignals = ALL_PLATFORM_REPORTS.filter(report => report.source === 'nlp' && /flood/i.test(report.classification)).length;
  const highSeverity = ALL_PLATFORM_REPORTS.filter(report => report.severity === 'high').length;
  const metrics = document.getElementById('all-reports-metrics');
  if(metrics){
    metrics.innerHTML = `
      <div class="metric-card"><div class="metric-num">${total.toLocaleString()}</div><div class="metric-label">All-location reports</div></div>
      <div class="metric-card"><div class="metric-num">${newSignals.toLocaleString()}</div><div class="metric-label">Pending / new signals</div></div>
      <div class="metric-card"><div class="metric-num danger">${floodSignals.toLocaleString()}</div><div class="metric-label">NLP flood detections</div></div>
      <div class="metric-card"><div class="metric-num">${highSeverity.toLocaleString()}</div><div class="metric-label">High severity</div></div>
    `;
  }

  const sync = document.getElementById('all-reports-sync');
  if(sync){
    const notice = allReportsFeedError
      ? `<span class="all-reports-error">${escapeNlpText(allReportsFeedError)}</span>`
      : allReportsDemoFallback
        ? '<span class="all-reports-demo">Showing built-in sample reports because the database has no report records yet.</span>'
        : '';
    sync.innerHTML = `${notice}<span>${allReportsLastUpdated ? `Last synced ${escapeNlpText(allReportsLastUpdated)} · ` : ''}Refreshes every 5 seconds</span>`;
  }

  if(!rows.length){
    holder.innerHTML = `<div class="empty-state"><div class="t">${total ? 'No reports match these filters.' : 'No reports received yet.'}</div><div class="s">Global reports include every city and barangay.</div></div>`;
    return;
  }

  holder.innerHTML = rows.map(report => {
    const risk = riskMeta(report.severity);
    const location = `${report.barangay ? `Brgy. ${report.barangay} · ` : ''}${report.city}`;
    const confidence = report.confidence === null ? '' : ` · ${Number(report.confidence).toFixed(1)}% confidence`;
    const urgency = report.urgency ? ` · ${escapeNlpText(report.urgency)} urgency` : '';
    const statusLabel = report.status === 'new' ? 'New NLP signal' : `${report.status[0].toUpperCase()}${report.status.slice(1)}`;
    const originalPost = report.postUrl
      ? `<a class="nlp-original-link" href="${escapeNlpText(report.postUrl)}" target="_blank" rel="noopener noreferrer">Open original post ↗</a>`
      : report.source === 'nlp' ? '<small class="nlp-no-link">Original post URL not provided</small>' : '';
    return `<div class="report-row all-report-row">
      <div class="report-thumb">${report.source === 'nlp' ? 'NLP' : 'R'}</div>
      <div class="report-body">
        <div class="report-top">
          <span class="report-loc">${escapeNlpText(location)}</span>
          <span class="tide-badge ${risk.cls}"><span class="tide-vial"><span class="tide-fill" style="height:${risk.fill};"></span></span>${escapeNlpText(risk.label)}</span>
          <span class="status-pill ${report.status === 'verified' ? 'status-verified' : report.status === 'rejected' ? 'status-rejected' : 'status-pending'}">${escapeNlpText(statusLabel)}</span>
          <span class="source-tag ${report.source === 'nlp' ? 'source-nlp' : 'source-citizen'}">${report.source === 'nlp' ? `NLP · ${escapeNlpText(report.sourceLabel)}` : 'Resident report'}</span>
        </div>
        <div class="report-meta">${escapeNlpText(report.classification)} · ${escapeNlpText(report.reporter)} · ${formatNlpTime(report.timestamp)}${confidence}${urgency}${report.demo ? ' · sample' : ''}</div>
        <div class="report-desc">${escapeNlpText(report.text)}</div>
        ${originalPost}
      </div>
    </div>`;
  }).join('');
}

function renderReportsFilterChips(){
  const chips = [
    {id:'pending', label:'Pending'},
    {id:'verified', label:'Verified'},
    {id:'rejected', label:'Rejected'},
    {id:'all', label:'All'}
  ];
  document.getElementById('reports-filter').innerHTML = chips.map(c=>
    `<div class="cfilter ${reportsFilter===c.id?'active':''}" onclick="setReportsFilter('${c.id}')">${c.label}</div>`
  ).join('');
}
function setReportsFilter(id){ reportsFilter = id; renderReports(); }

async function fetchReports(){
  try{
    const locationId = session.assigned_location || locationIdForCity(currentCity());
    const response = await fetch(`${ADMIN_API_URL}?action=reports&location=${encodeURIComponent(locationId)}`, {credentials:'include'});
    const data = await response.json().catch(() => ({}));
    if(!response.ok) throw new Error(data.error || 'Reports could not be loaded.');
    REPORTS = (Array.isArray(data.reports) ? data.reports : []).map((report) => ({
      id: Number(report.id),
      city: report.city,
      barangay: report.barangay,
      severity: String(report.severity || 'medium').toLowerCase(),
      reporter: report.reporter,
      source: report.source,
      platform: report.platform,
      time: report.created_at ? new Date(report.created_at).toLocaleString() : '',
      desc: report.description,
      status: report.status,
      photo: Boolean(Number(report.photo)),
    }));
    renderReports();
  }catch(error){
    REPORTS = [];
    renderReports();
    showToast(error.message);
  }
}

function renderReports(){
  renderNlpMonitor();
  renderReportsFilterChips();
  const sel = document.getElementById('reports-barangay-select');
  const scopeB = sel.value || session.activeBarangay;
  session.activeBarangay = scopeB;
  const cCity = currentCity();
  
  let list = REPORTS.filter(r => (r.city === cCity || !r.city) && r.barangay === scopeB);
  if(reportsFilter !== 'all') list = list.filter(r=>r.status===reportsFilter);

  const canApprove = canApproveModule(session, 'approval_board');
  const canReject = canRejectModule(session, 'approval_board');

  const holder = document.getElementById('reports-list');
  if(!list.length){
    holder.innerHTML = `<div class="empty-state">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 6L9 17l-5-5"/></svg>
      <div class="t">No reports match this filter yet.</div>
    </div>`;
    return;
  }
  const statusLabel = {pending:'Pending', verified:'Verified', rejected:'Rejected'};
  holder.innerHTML = list.map(r=>{
    const rm = riskMeta(r.severity);
    const sourceTag = r.source === 'nlp'
      ? `<span class="source-tag source-nlp"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="7" width="16" height="12" rx="2.5"/><path d="M9 3v4M15 3v4M9 13h.01M15 13h.01"/></svg>NLP · ${r.platform}</span>`
      : `<span class="source-tag source-citizen"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/></svg>Resident report</span>`;
    return `<div class="report-row">
      <div class="report-thumb">${r.photo ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="6" width="18" height="14" rx="2.4"/><circle cx="9" cy="12" r="2.4"/><path d="M14 10l3.5 6H7l2.5-4.2z"/></svg>` : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 6h16M4 12h16M4 18h10"/></svg>`}</div>
      <div class="report-body">
        <div class="report-top">
          <span class="report-loc">Brgy. ${r.barangay} (${cCity})</span>
          <span class="tide-badge ${rm.cls}"><span class="tide-vial"><span class="tide-fill" style="height:${rm.fill};"></span></span>${rm.label}</span>
          <span class="status-pill status-${r.status}">${statusLabel[r.status]}</span>
          ${sourceTag}
        </div>
        <div class="report-meta">${r.source==='nlp' ? 'Detected by NLP System' : `Reported by ${r.reporter}`} · ${r.time}</div>
        <div class="report-desc">${r.desc}</div>
      </div>
      <div class="report-actions">
        ${r.status==='pending' ? `
          ${canReject ? `<button class="btn btn-outline btn-sm" onclick="setReportStatus(${r.id},'rejected')">Reject</button>` : ''}
          ${canApprove ? `<button class="btn btn-primary btn-sm" onclick="setReportStatus(${r.id},'verified')">Verify</button>` : ''}
        ` : (canApprove || canReject) ? `<button class="btn btn-outline btn-sm" onclick="setReportStatus(${r.id},'pending')">Reopen</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

async function setReportStatus(id, status){
  if (status === 'verified' && !canApproveModule(session, 'approval_board')) {
    showToast('Permission denied: Cannot verify reports');
    return;
  }
  if (status === 'rejected' && !canRejectModule(session, 'approval_board')) {
    showToast('Permission denied: Cannot reject reports');
    return;
  }
  const r = REPORTS.find(x=>x.id===id);
  if(!r) return;
  try{
    const response = await fetch(ADMIN_API_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json', Accept:'application/json'},
      credentials:'include',
      body:JSON.stringify({action:'report-status', id, status}),
    });
    const result = await response.json().catch(() => ({}));
    if(!response.ok) throw new Error(result.error || 'Report status update was rejected.');
  }catch(error){
    showToast(error.message);
    return;
  }
  r.status = status;
  renderReports();
  const actionLabel = status==='verified' ? 'Verify' : status==='rejected' ? 'Reject' : 'Reopen';
  logAction("Reports", actionLabel, `Report #${id} in Barangay ${r.barangay} (${currentCity()}) marked as ${status}.`);
  showToast(status==='verified' ? 'Report verified' : status==='rejected' ? 'Report rejected' : 'Report reopened');
}

/* ============================================================
   Announcements (API Integration & Fallback)
   ============================================================ */
function renderAnnFilterChips(){
  const chips = [
    {id:'all', label:'All'},
    {id:'published', label:'Published'},
    {id:'draft', label:'Drafts'}
  ];
  document.getElementById('ann-filter').innerHTML = chips.map(c=>
    `<div class="cfilter ${annFilter===c.id?'active':''}" onclick="setAnnFilter('${c.id}')">${c.label}</div>`
  ).join('');
}
function setAnnFilter(id){ annFilter = id; renderAnnouncements(); }

async function fetchAnnouncements() {
  try {
    const locationId = session.assigned_location || locationIdForCity(currentCity());
    const res = await fetch(`${ADMIN_API_URL}?action=announcements&location=${encodeURIComponent(locationId)}`, { headers: { Accept: 'application/json' }, credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.announcements)) {
        ANNOUNCEMENTS = data.announcements.map(a => ({
          id: a.id,
          city: a.city || currentCity(),
          barangay: a.barangay || session.activeBarangay,
          title: a.title,
          body: a.content || a.body,
          status: a.status || 'draft',
          date: new Date(a.created_at).toLocaleString()
        }));
        renderAnnouncements();
      }
    }
  } catch (err) {}
}

function renderAnnouncements(){
  renderAnnFilterChips();
  const sel = document.getElementById('ann-barangay-select');
  const b = sel.value || session.activeBarangay;
  session.activeBarangay = b;
  const cCity = currentCity();
  document.getElementById('ann-sub').textContent = `Publish updates for residents in Barangay ${b}, ${cCity}.`;

  let list = ANNOUNCEMENTS.filter(a => (a.city === cCity || !a.city) && a.barangay === b);
  if(annFilter !== 'all') list = list.filter(a=>a.status===annFilter);
  list = [...list].sort((a,b2)=>b2.id-a.id);

  const canPublish = canApproveModule(session, 'announcements');
  const holder = document.getElementById('ann-list');

  if(!list.length){
    holder.innerHTML = `<div class="empty-state">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
      <div class="t">No announcements yet.</div>
    </div>`;
    return;
  }
  holder.innerHTML = list.map(a=>`
    <div class="ann-row">
      <div class="ann-head">
        <span class="ann-title">${a.title}</span>
        <span class="scope-tag">Brgy. ${a.barangay} (${cCity})</span>
        ${a.status==='draft' ? '<span class="scope-tag draft-tag">Draft</span>' : ''}
      </div>
      <div class="ann-body">${a.body}</div>
      <div class="ann-meta">
        <span>${a.date}</span>
        ${(a.status==='draft' && canPublish) ? `<a style="color:var(--blue-600); font-weight:700; cursor:pointer;" onclick="publishAnnouncement(${a.id})">Publish now</a>` : ''}
      </div>
    </div>`).join('');
}

function openAnnComposer(){
  if (!canCreateModule(session, 'announcements')) {
    showToast('Permission denied: Cannot compose announcements');
    return;
  }
  document.getElementById('ann-composer').style.display = 'block';
}

function closeAnnComposer(){
  document.getElementById('ann-composer').style.display = 'none';
  document.getElementById('ann-title').value = '';
  document.getElementById('ann-body').value = '';
}

async function saveAnnouncement(status){
  if (status === 'published' && !canApproveModule(session, 'announcements')) {
    showToast('Permission denied: Cannot publish');
    return;
  }
  const title = document.getElementById('ann-title').value.trim();
  const body = document.getElementById('ann-body').value.trim();
  const b = session.activeBarangay;
  const cCity = currentCity();
  if(!title || !body){ showToast('Add a title and message first'); return; }

  try {
    const response = await fetch(ADMIN_API_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json', Accept:'application/json'},
      credentials:'include',
      body:JSON.stringify({action:'announcement', location_id:session.assigned_location || locationIdForCity(cCity), city:cCity, barangay:b, title, body, status}),
    });
    const result = await response.json().catch(() => ({}));
    if(!response.ok) throw new Error(result.error || 'Announcement was not saved.');
  } catch(error) {
    showToast(error.message);
    return;
  }
  closeAnnComposer();
  await fetchAnnouncements();
  logAction("Announcements", status==='published' ? 'Publish' : 'Save draft', `Announcement "${title}" ${status==='published' ? 'published' : 'saved as draft'} for Barangay ${b}, ${cCity}.`);
  showToast(status==='published' ? 'Announcement published' : 'Draft saved');
}

async function publishAnnouncement(id){
  if (!canApproveModule(session, 'announcements')) {
    showToast('Permission denied: Cannot publish');
    return;
  }
  const a = ANNOUNCEMENTS.find(x=>x.id===id);
  if(!a) return;
  try{
    const response = await fetch(ADMIN_API_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json', Accept:'application/json'},
      credentials:'include',
      body:JSON.stringify({action:'announcement-status', id, status:'published'}),
    });
    const result = await response.json().catch(() => ({}));
    if(!response.ok) throw new Error(result.error || 'Announcement update was rejected.');
  }catch(error){
    showToast(error.message);
    return;
  }
  a.status = 'published';
  renderAnnouncements();
  logAction("Announcements", "Publish", `Announcement "${a.title}" published for Barangay ${a.barangay}, ${currentCity()}.`);
  showToast('Announcement published');
}

/* ============================================================
   System Logs & Security (API Integration & Filtering)
   ============================================================ */
function logAction(module, action, description){
  if(!session) return;
  AUDIT_LOG.unshift({
    time:"Just now",
    user:`${session.name} (${session.org})`,
    module, action, description,
    ip: session.ip,
    status:"success"
  });
}

function applyLogFilters(){ 
  fetchLogs();
  renderLogs(); 
}

function clearLogFilters(){
  document.getElementById('logs-search').value = '';
  document.getElementById('logs-module-filter').value = 'all';
  document.getElementById('logs-status-filter').value = 'all';
  document.getElementById('logs-start-date').value = '';
  document.getElementById('logs-end-date').value = '';
  fetchLogs();
  renderLogs();
}

async function fetchLogs() {
  const q = document.getElementById('logs-search')?.value.trim() || '';
  const moduleF = document.getElementById('logs-module-filter')?.value || 'all';
  const statusF = document.getElementById('logs-status-filter')?.value || 'all';
  const startDate = document.getElementById('logs-start-date')?.value || '';
  const endDate = document.getElementById('logs-end-date')?.value || '';

  const params = new URLSearchParams();
  if (q) params.append('search', q);
  if (moduleF !== 'all') params.append('module', moduleF);
  if (statusF !== 'all') params.append('status', statusF);
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  try {
    const res = await fetch(`/admin/logs?${params.toString()}`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      if (data.logs?.data) {
        AUDIT_LOG = data.logs.data.map(l => ({
          time: new Date(l.created_at).toLocaleString(),
          user: l.user ? l.user.name : 'System',
          module: l.module,
          action: l.action,
          description: l.description,
          ip: l.ip_address || 'N/A',
          status: l.status || 'success'
        }));
        renderLogs();
      }
    }
  } catch (err) {}
}

function renderLogs(){
  const q = document.getElementById('logs-search').value.trim().toLowerCase();
  const moduleF = document.getElementById('logs-module-filter').value;
  const statusF = document.getElementById('logs-status-filter').value;

  let list = AUDIT_LOG.filter(l=>{
    if(moduleF !== 'all' && l.module !== moduleF) return false;
    if(statusF !== 'all' && l.status !== statusF) return false;
    if(q && !(l.user.toLowerCase().includes(q) || l.description.toLowerCase().includes(q))) return false;
    return true;
  });

  const tbody = document.getElementById('logs-tbody');
  const empty = document.getElementById('logs-empty');
  if(!list.length){
    tbody.innerHTML = '';
    empty.innerHTML = `<div class="empty-state">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 6L9 17l-5-5"/></svg>
      <div class="t">No log entries match this filter.</div>
    </div>`;
    return;
  }
  empty.innerHTML = '';
  tbody.innerHTML = list.map(l=>`
    <tr>
      <td class="mono" style="white-space:nowrap; color:var(--ink-soft);">${l.time}</td>
      <td style="white-space:nowrap; font-weight:600;">${l.user}</td>
      <td>${l.module}<br><span class="log-desc-link">${l.action}</span></td>
      <td style="max-width:340px;">${l.description}</td>
      <td><span class="log-ip">${l.ip}</span></td>
      <td><span class="log-status">${l.status.toUpperCase()}</span></td>
    </tr>`).join('');
}

function exportLogs(){
  if (!canAdminModule(session, 'approval_board_hr')) {
    showToast('Permission denied: Cannot export logs');
    return;
  }

  const q = document.getElementById('logs-search')?.value.trim() || '';
  const moduleF = document.getElementById('logs-module-filter')?.value || 'all';
  const statusF = document.getElementById('logs-status-filter')?.value || 'all';
  const startDate = document.getElementById('logs-start-date')?.value || '';
  const endDate = document.getElementById('logs-end-date')?.value || '';

  const params = new URLSearchParams();
  if (q) params.append('search', q);
  if (moduleF !== 'all') params.append('module', moduleF);
  if (statusF !== 'all') params.append('status', statusF);
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  window.open(`/admin/logs/export?${params.toString()}`, '_blank');
  showToast('Logs export started');
}

/* ============================================================
   Notifications & Toasts
   ============================================================ */
let toastTimer;
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 2400);
}

function changeAdminLocation(selectId){
  if(!canAdminModule(session, 'admin_overview')) return;
  const location = locationForId(document.getElementById(selectId)?.value);
  if(!location) return;
  activeCity = location.city;
  ['command-location-select', 'reports-location-select', 'ann-location-select'].forEach((id) => {
    const select = document.getElementById(id);
    if(select && selectId !== id) select.value = location.id;
  });
  populateBarangaySelects();
  if(selectId === 'command-location-select') renderCommand();
  if(selectId === 'reports-location-select') { fetchReports(); refreshNlpEvents(); }
  if(selectId === 'ann-location-select') { fetchAnnouncements(); renderAnnouncements(); }
}

async function updateAdminLocation(email, locationId){
  if(!canAdminModule(session, 'admin_overview')) return;
  if(!locationForId(locationId)) return;
  try{
    const response = await fetch(ADMIN_API_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json', Accept:'application/json'},
      credentials:'include',
      body:JSON.stringify({action:'users', mode:'update', email, role:'lgu-admin', assigned_location:locationId}),
    });
    const result = await response.json().catch(() => ({}));
    if(!response.ok) throw new Error(result.error || 'Location assignment was rejected.');
    await loadAdminAccounts();
    renderUserManager();
    showToast(`Admin location set to ${locationForId(locationId).name}`);
  }catch(error){
    showToast(error.message);
    await loadAdminAccounts();
    renderUserManager();
  }
}