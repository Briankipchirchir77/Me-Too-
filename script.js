/* ═══════════════════════════════════════════════
   ME TOO! — app.js  (frontend only, no server needed)
   Works with a local Express backend on port 3000,
   but gracefully falls back to in-memory demo data.
═══════════════════════════════════════════════ */

const API = 'http://localhost:3000';

/* ── STATE ── */
let currentUser  = JSON.parse(localStorage.getItem('metoo_user') || 'null');
let allUsers     = [];
let friendRequests = [];

/* ═══════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════ */
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => { t.className = 'toast'; }, 3000);
}

function openModal(html) {
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

/* Avatar: colourful initials circle */
const COLORS = ['#1a6b6b','#e85555','#2a4a7f','#c06b00','#5a3e8f','#2e7d32'];
function avatarEl(name, size = 64) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() : '?';
  const bg = COLORS[name.charCodeAt(0) % COLORS.length];
  const el = document.createElement('div');
  el.className = 'card-avatar';
  el.style.cssText = `width:${size}px;height:${size}px;background:${bg};font-size:${size*0.37}px;`;
  el.textContent = initials;
  return el;
}

function stripAvatar(name, size = 58) {
  const el = avatarEl(name, size);
  el.className = 'strip-avatar';
  el.title = name;
  el.style.width = size + 'px';
  el.style.height = size + 'px';
  const bg = COLORS[name.charCodeAt(0) % COLORS.length];
  el.style.background = bg;
  el.style.fontSize = (size * 0.37) + 'px';
  el.style.cursor = 'pointer';
  return el;
}

/* ═══════════════════════════════════════════════
   API HELPERS — fall back to demo mode if server down
═══════════════════════════════════════════════ */
async function apiFetch(path, opts = {}) {
  try {
    const res = await fetch(API + path, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      ...opts,
    });
    return res;
  } catch {
    return null; // server not running → demo mode
  }
}

/* ═══════════════════════════════════════════════
   DEMO DATA (used when server is offline)
═══════════════════════════════════════════════ */
const DEMO_USERS = [
  { id:1, name:'Alice Wanjiru', email:'alice@example.com', password:'password123', age:25, bio:'Love hiking and reading. Always up for a good book club or trail walk!', interests:['hiking','reading','travel'], location:'Nairobi', gender:'female', friends:[] },
  { id:2, name:'Bob Kamau',     email:'bob@example.com',   password:'password123', age:30, bio:'Tech enthusiast and gamer. Looking for friends to debate gadgets with.', interests:['gaming','technology','coding'], location:'Nairobi', gender:'male', friends:[] },
  { id:3, name:'Cynthia Omollo',email:'cyn@example.com',   password:'password123', age:28, bio:'Foodie and travel addict. Just back from Zanzibar — let\'s swap stories!', interests:['travel','food','photography'], location:'Mombasa', gender:'female', friends:[] },
  { id:4, name:'Derek Mwangi',  email:'derek@example.com', password:'password123', age:33, bio:'Music producer by night, accountant by day. Love jazz and afrobeats.', interests:['music','afrobeats','jazz'], location:'Nairobi', gender:'male', friends:[] },
  { id:5, name:'Esther Njoki',  email:'esther@example.com',password:'password123', age:22, bio:'Fashion designer & artist. Looking for creative minds to collab with!', interests:['art','fashion','design'], location:'Nairobi', gender:'female', friends:[] },
  { id:6, name:'Frank Odhiambo',email:'frank@example.com', password:'password123', age:27, bio:'Marathon runner. If you run, let\'s train together!', interests:['running','fitness','nature'], location:'Kisumu', gender:'male', friends:[] },
];

let demoMode = false;
let demoFriendRequests = [];

/* ═══════════════════════════════════════════════
   LOAD USERS
═══════════════════════════════════════════════ */
async function loadUsers() {
  const res = await apiFetch('/users');
  if (res && res.ok) {
    allUsers = await res.json();
  } else {
    demoMode = true;
    allUsers = DEMO_USERS;
  }
  renderUserGrid(allUsers);
  renderProfileStrip(allUsers);
}

/* ═══════════════════════════════════════════════
   RENDER PROFILE STRIP
═══════════════════════════════════════════════ */
function renderProfileStrip(users) {
  const strip = document.getElementById('profile-strip');
  strip.innerHTML = '';
  users.slice(0, 12).forEach(u => {
    const el = stripAvatar(u.name);
    el.addEventListener('click', () => openUserModal(u));
    strip.appendChild(el);
  });
}

/* ═══════════════════════════════════════════════
   RENDER USER GRID
═══════════════════════════════════════════════ */
function renderUserGrid(users) {
  const grid = document.getElementById('user-grid');
  grid.innerHTML = '';

  if (!users.length) {
    grid.innerHTML = '<p class="empty-msg">No users found for those filters.</p>';
    return;
  }

  users.forEach(u => {
    if (currentUser && u.id === currentUser.id) return; // skip self

    const card = document.createElement('div');
    card.className = 'user-card';

    const avatar = avatarEl(u.name, 64);

    const tags = (u.interests || []).slice(0,3).map(i =>
      `<span class="interest-tag">${i}</span>`).join('');

    let btnLabel = '🤝 Connect';
    let btnClass = 'btn-connect';
    let btnDisabled = '';

    if (currentUser) {
      const isFriend   = (currentUser.friends || []).includes(u.id);
      const reqSent    = demoFriendRequests.some(r => r.from === currentUser.id && r.to === u.id);
      const reqReceived= demoFriendRequests.some(r => r.from === u.id && r.to === currentUser.id);

      if (isFriend)    { btnLabel = '✅ Friends';   btnClass += ' friends';   btnDisabled = 'disabled'; }
      else if (reqSent){ btnLabel = '⏳ Sent';      btnClass += ' sent';      btnDisabled = 'disabled'; }
      else if (reqReceived) { btnLabel = '↩️ Accept'; }
    }

    card.innerHTML = `
      <div class="card-name">${u.name}</div>
      <div class="card-age-loc">Age ${u.age} · 📍 ${u.location}</div>
      <div class="card-bio">${u.bio || 'No bio yet.'}</div>
      <div class="card-interests">${tags}</div>
      <div class="card-actions">
        <button class="${btnClass}" data-id="${u.id}" ${btnDisabled}>${btnLabel}</button>
        <button class="btn-view" data-id="${u.id}">👁 View</button>
      </div>`;

    card.insertBefore(avatar, card.firstChild);

    card.querySelector('.btn-view').addEventListener('click', () => openUserModal(u));
    const connectBtn = card.querySelector('.btn-connect');
    if (connectBtn && !btnDisabled) {
      connectBtn.addEventListener('click', () => sendFriendRequest(u));
    }

    grid.appendChild(card);
  });
}

/* ── OPEN USER PROFILE MODAL ── */
function openUserModal(u) {
  const tags = (u.interests || []).map(i =>
    `<span class="interest-tag" style="font-size:14px;padding:5px 12px;">${i}</span>`).join('');

  openModal(`
    <div class="modal-body">
      <h2>${u.name}</h2>
      <p>Age ${u.age} · 📍 ${u.location}${u.gender ? ' · ' + u.gender : ''}</p>
      <div style="margin:16px 0 12px;font-size:15px;color:#5a5a72;line-height:1.7;">${u.bio || 'No bio provided.'}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px;">${tags}</div>
      ${currentUser && u.id !== currentUser.id
        ? `<button class="form-submit" id="modal-connect-btn">🤝 Send Friend Request</button>`
        : ''}
    </div>`);

  const btn = document.getElementById('modal-connect-btn');
  if (btn) btn.addEventListener('click', () => { sendFriendRequest(u); closeModal(); });
}

/* ═══════════════════════════════════════════════
   FRIEND REQUESTS
═══════════════════════════════════════════════ */
async function sendFriendRequest(toUser) {
  if (!currentUser) {
    showToast('Please log in to connect!', 'error');
    openLoginModal();
    return;
  }

  if (demoMode) {
    demoFriendRequests.push({ from: currentUser.id, to: toUser.id, fromName: currentUser.name });
    showToast(`Friend request sent to ${toUser.name}! 🎉`, 'success');
    renderUserGrid(allUsers);
    return;
  }

  const res = await apiFetch('/friend-request', {
    method: 'POST',
    body: JSON.stringify({ toId: toUser.id }),
  });
  if (res && res.ok) {
    showToast(`Friend request sent to ${toUser.name}! 🎉`, 'success');
    renderUserGrid(allUsers);
  } else {
    showToast('Could not send request.', 'error');
  }
}

async function loadFriendRequests() {
  if (!currentUser) return;
  const section = document.getElementById('requests-section');
  const container = document.getElementById('requests-container');
  section.style.display = 'block';

  let requests = demoMode
    ? demoFriendRequests.filter(r => r.to === currentUser.id)
    : [];

  if (!demoMode) {
    const res = await apiFetch('/friend-requests');
    if (res && res.ok) requests = await res.json();
  }

  friendRequests = requests;

  if (!requests.length) {
    container.innerHTML = '<p class="empty-msg">No pending requests.</p>';
    return;
  }

  container.innerHTML = '';
  requests.forEach(r => {
    const sender = allUsers.find(u => u.id === r.from);
    if (!sender) return;
    const card = document.createElement('div');
    card.className = 'request-card';
    card.innerHTML = `
      <div class="req-info">
        <strong>${sender.name}</strong>
        <span>📍 ${sender.location} · Age ${sender.age}</span>
      </div>
      <div class="req-actions">
        <button class="btn-accept" data-from="${r.from}">Accept</button>
        <button class="btn-reject" data-from="${r.from}">Decline</button>
      </div>`;
    card.querySelector('.btn-accept').addEventListener('click', () => acceptRequest(r));
    card.querySelector('.btn-reject').addEventListener('click', () => rejectRequest(r));
    container.appendChild(card);
  });
}

function acceptRequest(r) {
  if (demoMode) {
    demoFriendRequests = demoFriendRequests.filter(x => !(x.from === r.from && x.to === r.to));
    if (!currentUser.friends) currentUser.friends = [];
    currentUser.friends.push(r.from);
    localStorage.setItem('metoo_user', JSON.stringify(currentUser));
    showToast('You are now friends! 🎉', 'success');
    loadFriendRequests();
    renderUserGrid(allUsers);
  }
}

function rejectRequest(r) {
  demoFriendRequests = demoFriendRequests.filter(x => !(x.from === r.from && x.to === r.to));
  showToast('Request declined.', '');
  loadFriendRequests();
}

/* ═══════════════════════════════════════════════
   SEARCH / FILTER
═══════════════════════════════════════════════ */
document.getElementById('do-search').addEventListener('click', () => {
  const gender = document.querySelector('.sw-btn.active')?.dataset.gender || 'any';
  const minAge = parseInt(document.getElementById('age-min').value) || 18;
  const maxAge = parseInt(document.getElementById('age-max').value) || 80;
  const loc    = document.getElementById('location-search').value.trim().toLowerCase();

  let filtered = allUsers.filter(u => {
    const ageOk = u.age >= minAge && u.age <= maxAge;
    const gOk   = gender === 'any' || u.gender === gender || !u.gender;
    const lOk   = !loc || (u.location || '').toLowerCase().includes(loc);
    return ageOk && gOk && lOk;
  });

  renderUserGrid(filtered);
  document.getElementById('users-section').scrollIntoView({ behavior: 'smooth' });
  showToast(`Found ${filtered.length} people!`, 'success');
});

/* Toggle gender buttons */
document.querySelectorAll('.sw-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sw-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

/* ═══════════════════════════════════════════════
   AUTH MODALS
═══════════════════════════════════════════════ */
function openSignupModal() {
  openModal(`
    <div class="modal-body">
      <h2>Join Me Too! 🎉</h2>
      <p>Create your free account and start connecting.</p>

      <div class="form-group">
        <label>Full Name</label>
        <input type="text" id="s-name" placeholder="Your name" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="s-email" placeholder="you@email.com" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="s-pass" placeholder="Min 6 chars" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Age</label>
          <input type="number" id="s-age" placeholder="25" min="18" max="99" />
        </div>
        <div class="form-group">
          <label>Location</label>
          <input type="text" id="s-loc" placeholder="Nairobi" />
        </div>
      </div>
      <div class="form-group">
        <label>I identify as</label>
        <div class="gender-grid">
          <div class="gender-opt" data-g="female">👩 Woman</div>
          <div class="gender-opt" data-g="male">👨 Man</div>
          <div class="gender-opt" data-g="other">🌟 Other</div>
        </div>
      </div>
      <div class="form-group">
        <label>Bio</label>
        <textarea id="s-bio" placeholder="A little about yourself…"></textarea>
      </div>
      <div class="form-group">
        <label>Interests (comma-separated)</label>
        <input type="text" id="s-interests" placeholder="hiking, music, gaming" />
      </div>
      <button class="form-submit" id="signup-submit">Create Account →</button>
      <div class="form-switch">Already have an account? <a id="switch-to-login">Log In</a></div>
    </div>`);

  /* gender selector */
  let selectedGender = '';
  document.querySelectorAll('.gender-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.gender-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedGender = opt.dataset.g;
    });
  });

  document.getElementById('switch-to-login').addEventListener('click', openLoginModal);

  document.getElementById('signup-submit').addEventListener('click', async () => {
    const name      = document.getElementById('s-name').value.trim();
    const email     = document.getElementById('s-email').value.trim();
    const password  = document.getElementById('s-pass').value;
    const age       = parseInt(document.getElementById('s-age').value);
    const location  = document.getElementById('s-loc').value.trim();
    const bio       = document.getElementById('s-bio').value.trim();
    const interests = document.getElementById('s-interests').value;

    if (!name || !email || !password || !age || !location) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    const payload = { name, email, password, age, location, bio, interests, gender: selectedGender };

    if (demoMode) {
      if (allUsers.find(u => u.email === email)) {
        showToast('Email already registered!', 'error'); return;
      }
      const newUser = { id: allUsers.length + 1, friends: [], ...payload,
        interests: interests ? interests.split(',').map(s => s.trim()) : [] };
      allUsers.push(newUser);
      currentUser = newUser;
      localStorage.setItem('metoo_user', JSON.stringify(newUser));
      onLogin(newUser);
      return;
    }

    const res = await apiFetch('/signup', { method:'POST', body: JSON.stringify(payload) });
    if (!res) { demoMode = true; return; }
    if (res.ok) {
      const user = await res.json();
      currentUser = user;
      localStorage.setItem('metoo_user', JSON.stringify(user));
      onLogin(user);
    } else {
      const err = await res.json();
      showToast(err.message || 'Signup failed', 'error');
    }
  });
}

function openLoginModal() {
  openModal(`
    <div class="modal-body">
      <h2>Welcome Back 👋</h2>
      <p>Log in to your Me Too! account.</p>
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="l-email" placeholder="you@email.com" />
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" id="l-pass" placeholder="Your password" />
      </div>
      <button class="form-submit" id="login-submit">Log In →</button>
      <div class="form-switch">New here? <a id="switch-to-signup">Create account</a></div>
    </div>`);

  document.getElementById('switch-to-signup').addEventListener('click', openSignupModal);

  document.getElementById('login-submit').addEventListener('click', async () => {
    const email    = document.getElementById('l-email').value.trim();
    const password = document.getElementById('l-pass').value;

    if (!email || !password) { showToast('Enter email and password.', 'error'); return; }

    if (demoMode) {
      const user = allUsers.find(u => u.email === email && u.password === password);
      if (!user) { showToast('Invalid credentials!', 'error'); return; }
      currentUser = user;
      localStorage.setItem('metoo_user', JSON.stringify(user));
      onLogin(user);
      return;
    }

    const res = await apiFetch('/login', { method:'POST', body: JSON.stringify({ email, password }) });
    if (!res) { demoMode = true; return; }
    if (res.ok) {
      const user = await res.json();
      currentUser = user;
      localStorage.setItem('metoo_user', JSON.stringify(user));
      onLogin(user);
    } else {
      showToast('Invalid credentials!', 'error');
    }
  });
}

/* ── POST-LOGIN ── */
function onLogin(user) {
  closeModal();
  showToast(`Welcome, ${user.name.split(' ')[0]}! 🎉`, 'success');
  updateNavForUser(user);
  renderUserGrid(allUsers);
  renderMyProfile(user);
  loadFriendRequests();
}

function updateNavForUser(user) {
  const right = document.querySelector('.topnav-right');
  right.innerHTML = `
    <span style="color:rgba(255,255,255,.8);font-size:14px;">Hi, ${user.name.split(' ')[0]}</span>
    <button class="btn-primary" id="nav-logout">Log Out</button>`;
  document.getElementById('nav-logout').addEventListener('click', logout);
}

/* ── MY PROFILE SECTION ── */
function renderMyProfile(user) {
  const section = document.getElementById('my-profile-section');
  const container = document.getElementById('my-profile-container');
  section.style.display = 'block';

  container.innerHTML = `
    <div class="my-profile-box">
      <h3>${user.name}</h3>
      <p class="profile-detail"><strong>Email:</strong> ${user.email}</p>
      <p class="profile-detail"><strong>Age:</strong> ${user.age}</p>
      <p class="profile-detail"><strong>Location:</strong> ${user.location}</p>
      <p class="profile-detail"><strong>Bio:</strong> ${user.bio || '—'}</p>
      <p class="profile-detail"><strong>Interests:</strong> ${(user.interests || []).join(', ') || '—'}</p>
      <p class="profile-detail"><strong>Friends:</strong> ${(user.friends || []).length}</p>
    </div>`;
}

/* ── LOGOUT ── */
async function logout() {
  if (!demoMode) await apiFetch('/logout', { method: 'POST' });
  currentUser = null;
  localStorage.removeItem('metoo_user');
  showToast('Logged out. See you soon! 👋', '');
  const right = document.querySelector('.topnav-right');
  right.innerHTML = `
    <button class="btn-ghost" id="open-login">Log In</button>
    <button class="btn-primary" id="open-signup">Join Free</button>`;
  bindNavButtons();
  document.getElementById('requests-section').style.display = 'none';
  document.getElementById('my-profile-section').style.display = 'none';
  renderUserGrid(allUsers);
}

/* ── LOGOUT from section button ── */
document.getElementById('logout-btn').addEventListener('click', logout);

/* ═══════════════════════════════════════════════
   NAV BUTTON BINDINGS
═══════════════════════════════════════════════ */
function bindNavButtons() {
  document.getElementById('open-login') ?.addEventListener('click', openLoginModal);
  document.getElementById('open-signup')?.addEventListener('click', openSignupModal);
}
bindNavButtons();

/* search link in nav */
document.getElementById('nav-search-link')?.addEventListener('click', e => {
  e.preventDefault();
  document.getElementById('location-search').focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* Modal close */
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

/* ═══════════════════════════════════════════════
   RESTORE SESSION
═══════════════════════════════════════════════ */
if (currentUser) {
  updateNavForUser(currentUser);
}

/* ═══════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════ */
loadUsers().then(() => {
  if (currentUser) {
    renderMyProfile(currentUser);
    loadFriendRequests();
  }
});
