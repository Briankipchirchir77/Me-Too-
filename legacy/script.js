/* ME TOO! — script.js */

const API = 'http://localhost:3000';

/* STATE */
let currentUser        = JSON.parse(localStorage.getItem('metoo_user') || 'null');
let allUsers           = [];
let demoMode           = false;
let demoFriendRequests = [];

/*DEMO DATA*/
const DEMO_USERS = [
  { id:1,  name:'Alice Wanjiru',   email:'alice@example.com',  password:'password123', age:25, bio:'Love hiking and reading. Always up for a good book club or trail walk!',        interests:['hiking','reading','travel'],          location:'Nairobi', gender:'female', friends:[] },
  { id:2,  name:'Bob Kamau',       email:'bob@example.com',    password:'password123', age:30, bio:'Tech enthusiast and gamer. Looking for friends to debate gadgets with.',       interests:['gaming','technology','coding'],        location:'Nairobi', gender:'male',   friends:[] },
  { id:3,  name:'Cynthia Omollo',  email:'cyn@example.com',    password:'password123', age:28, bio:"Foodie and travel addict. Just back from Zanzibar — let's swap stories!",     interests:['travel','food','photography'],         location:'Mombasa', gender:'female', friends:[] },
  { id:4,  name:'Derek Mwangi',    email:'derek@example.com',  password:'password123', age:33, bio:'Music producer by night, accountant by day. Love jazz and afrobeats.',        interests:['music','afrobeats','jazz'],            location:'Nairobi', gender:'male',   friends:[] },
  { id:5,  name:'Esther Njoki',    email:'esther@example.com', password:'password123', age:22, bio:'Fashion designer & artist. Looking for creative minds to collab with!',       interests:['art','fashion','design'],             location:'Nairobi', gender:'female', friends:[] },
  { id:6,  name:'Frank Odhiambo',  email:'frank@example.com',  password:'password123', age:27, bio:"Marathon runner and fitness coach. If you run, let's train together!",        interests:['running','fitness','nature'],          location:'Kisumu',  gender:'male',   friends:[] },
  { id:7,  name:'Grace Akinyi',    email:'grace@example.com',  password:'password123', age:24, bio:'Yoga instructor and wellness enthusiast. Mindfulness is my superpower.',      interests:['yoga','wellness','meditation'],        location:'Nairobi', gender:'female', friends:[] },
  { id:8,  name:'Henry Otieno',    email:'henry@example.com',  password:'password123', age:29, bio:'Wildlife photographer exploring East Africa. Always chasing golden hour.',    interests:['photography','nature','travel'],       location:'Nairobi', gender:'male',   friends:[] },
  { id:9,  name:'Irene Mutua',     email:'irene@example.com',  password:'password123', age:26, bio:'Bookworm and aspiring writer. Looking for fellow storytellers.',              interests:['reading','writing','art'],            location:'Nakuru',  gender:'female', friends:[] },
  { id:10, name:'James Karanja',   email:'james@example.com',  password:'password123', age:31, bio:'Football fanatic and weekend chef. Great at both scoring goals and meals.',   interests:['football','cooking','fitness'],        location:'Nairobi', gender:'male',   friends:[] },
  { id:11, name:'Karen Wambui',    email:'karen@example.com',  password:'password123', age:23, bio:'Environmental activist and outdoor enthusiast. Save the planet, one hike!',   interests:['nature','hiking','activism'],          location:'Thika',   gender:'female', friends:[] },
  { id:12, name:'Liam Ochieng',    email:'liam@example.com',   password:'password123', age:28, bio:'Startup founder and coffee addict. Lets build something great together.',     interests:['technology','coding','entrepreneurship'],location:'Nairobi',gender:'male',  friends:[] },
];

const EVENTS = [
  { id:1,  title:'Karura Forest Morning Hike',      category:'Outdoors', date:'Sat 26 Apr · 6:30 AM',  location:'Karura Forest, Nairobi', attendees:18, max:30, emoji:'🏔️',  color:'#d4edda' },
  { id:2,  title:'Nairobi Jazz Night',               category:'Music',    date:'Fri 25 Apr · 7:00 PM',  location:'Alliance Française, Nairobi', attendees:42, max:60, emoji:'🎷', color:'#fff3cd' },
  { id:3,  title:'Tech Meetup — AI & Future',       category:'Tech',     date:'Thu 24 Apr · 5:30 PM',  location:'iHub, Nairobi',              attendees:65, max:80, emoji:'💻', color:'#cce5ff' },
  { id:4,  title:'Nairobi Street Food Tour',        category:'Food',     date:'Sun 27 Apr · 11:00 AM', location:'Westlands, Nairobi',         attendees:12, max:20, emoji:'🍜', color:'#fde8d8' },
  { id:5,  title:'5K Run for Charity',              category:'Sports',   date:'Sat 26 Apr · 7:00 AM',  location:'Uhuru Park, Nairobi',        attendees:89, max:150,emoji:'🏃', color:'#f8d7da' },
  { id:6,  title:'Watercolour Painting Workshop',   category:'Arts',     date:'Sat 26 Apr · 2:00 PM',  location:'GoDown Arts Centre, Nairobi',attendees:9,  max:15, emoji:'🎨', color:'#e2d9f3' },
  { id:7,  title:'Mombasa Beach Volleyball',        category:'Sports',   date:'Sun 27 Apr · 9:00 AM',  location:'Diani Beach, Mombasa',       attendees:14, max:24, emoji:'🏐', color:'#f8d7da' },
  { id:8,  title:'Afrobeats Dance Class',           category:'Arts',     date:'Wed 23 Apr · 6:00 PM',  location:'Parklands, Nairobi',         attendees:22, max:30, emoji:'💃', color:'#e2d9f3' },
  { id:9,  title:'Python for Beginners Bootcamp',   category:'Tech',     date:'Sat 26 Apr · 10:00 AM', location:'Strathmore University',      attendees:35, max:50, emoji:'🐍', color:'#cce5ff' },
  { id:10, title:'Farmers Market & Brunch',         category:'Food',     date:'Sun 27 Apr · 9:00 AM',  location:'Karen, Nairobi',             attendees:55, max:100,emoji:'🥗', color:'#fde8d8' },
  { id:11, title:'Lake Nakuru Day Trip',            category:'Outdoors', date:'Sat 26 Apr · 5:00 AM',  location:'Lake Nakuru National Park',  attendees:8,  max:12, emoji:'🦩', color:'#d4edda' },
  { id:12, title:'Open Mic Night',                  category:'Music',    date:'Fri 25 Apr · 8:00 PM',  location:'The Alchemist, Westlands',   attendees:30, max:50, emoji:'🎤', color:'#fff3cd' },
];

const INTEREST_CATEGORIES = [
  { label:'Hiking',        emoji:'🏔️', kw:'hiking' },
  { label:'Music',         emoji:'🎵', kw:'music' },
  { label:'Gaming',        emoji:'🎮', kw:'gaming' },
  { label:'Art & Design',  emoji:'🎨', kw:'art' },
  { label:'Travel',        emoji:'✈️', kw:'travel' },
  { label:'Food',          emoji:'🍜', kw:'food' },
  { label:'Fitness',       emoji:'💪', kw:'fitness' },
  { label:'Reading',       emoji:'📚', kw:'reading' },
  { label:'Technology',    emoji:'💻', kw:'technology' },
  { label:'Photography',   emoji:'📷', kw:'photography' },
  { label:'Nature',        emoji:'🌿', kw:'nature' },
  { label:'Yoga',          emoji:'🧘', kw:'yoga' },
  { label:'Fashion',       emoji:'👗', kw:'fashion' },
  { label:'Cooking',       emoji:'🍳', kw:'cooking' },
  { label:'Running',       emoji:'🏃', kw:'running' },
  { label:'Jazz & Afro',   emoji:'🎷', kw:'jazz' },
];

/*UTILITIES*/
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.className = 'toast', 3000);
}
function openModal(html) {
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-overlay').classList.add('open');
}
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

const COLORS = ['#1a6b6b','#e85555','#2a4a7f','#c06b00','#5a3e8f','#2e7d32'];
function avatarEl(name, size = 64, cls = 'card-avatar') {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() : '?';
  const bg = COLORS[name.charCodeAt(0) % COLORS.length];
  const el = document.createElement('div');
  el.className = cls;
  el.style.cssText = `width:${size}px;height:${size}px;background:${bg};font-size:${size*.37}px;`;
  el.textContent = initials;
  return el;
}

/*API FETCH*/
async function apiFetch(path, opts = {}) {
  try {
    return await fetch(API + path, { headers:{'Content-Type':'application/json'}, credentials:'include', ...opts });
  } catch { return null; }
}

/*LOAD USER*/
async function loadUsers() {
  const res = await apiFetch('/users');
  if (res && res.ok) { allUsers = await res.json(); }
  else { demoMode = true; allUsers = DEMO_USERS; }
  renderProfileStrip(allUsers);
  renderUserGrid(allUsers, 'user-grid', 6);
}

/*PROFILE STRIP*/
function renderProfileStrip(users) {
  const strip = document.getElementById('profile-strip');
  strip.innerHTML = '';
  users.slice(0,12).forEach(u => {
    const el = avatarEl(u.name, 58, 'strip-avatar');
    el.title = u.name;
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => openUserModal(u));
    strip.appendChild(el);
  });
}

/* RENDER USER GRID*/
function renderUserGrid(users, gridId = 'user-grid', limit = null) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = '';
  const list = limit ? users.slice(0, limit) : users;
  if (!list.length) { grid.innerHTML = '<p class="empty-msg">No users found.</p>'; return; }

  list.forEach(u => {
    if (currentUser && u.id === currentUser.id) return;
    const card = document.createElement('div');
    card.className = 'user-card';
    const tags = (u.interests||[]).slice(0,3).map(i => `<span class="interest-tag">${i}</span>`).join('');

    let btnLabel = '🤝 Connect', btnClass = 'btn-connect', btnDisabled = '';
    if (currentUser) {
      const isFriend    = (currentUser.friends||[]).includes(u.id);
      const reqSent     = demoFriendRequests.some(r => r.from===currentUser.id && r.to===u.id);
      const reqReceived = demoFriendRequests.some(r => r.from===u.id && r.to===currentUser.id);
      if (isFriend)     { btnLabel='✅ Friends'; btnClass+=' friends'; btnDisabled='disabled'; }
      else if (reqSent) { btnLabel='⏳ Sent';   btnClass+=' sent';    btnDisabled='disabled'; }
      else if (reqReceived) { btnLabel='↩️ Accept'; }
    }

    card.innerHTML = `
      <div class="card-name">${u.name}</div>
      <div class="card-age-loc">Age ${u.age} · 📍 ${u.location}</div>
      <div class="card-bio">${u.bio||'No bio yet.'}</div>
      <div class="card-interests">${tags}</div>
      <div class="card-actions">
        <button class="${btnClass}" data-id="${u.id}" ${btnDisabled}>${btnLabel}</button>
        <button class="btn-view" data-id="${u.id}">👁 View</button>
      </div>`;
    card.insertBefore(avatarEl(u.name,64), card.firstChild);
    card.querySelector('.btn-view').addEventListener('click', () => openUserModal(u));
    const cb = card.querySelector('.btn-connect');
    if (cb && !btnDisabled) cb.addEventListener('click', () => sendFriendRequest(u));
    grid.appendChild(card);
  });
}

/*USER MODAL*/
function openUserModal(u) {
  const tags = (u.interests||[]).map(i=>`<span class="interest-tag" style="font-size:14px;padding:5px 12px;">${i}</span>`).join('');
  openModal(`
    <div class="modal-body">
      <h2>${u.name}</h2>
      <p>Age ${u.age} · 📍 ${u.location}${u.gender ? ' · '+u.gender : ''}</p>
      <div style="margin:16px 0 12px;font-size:15px;color:#5a5a72;line-height:1.7;">${u.bio||'No bio provided.'}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px;">${tags}</div>
      ${currentUser && u.id!==currentUser.id ? `<button class="form-submit" id="modal-connect-btn">🤝 Send Friend Request</button>` : ''}
    </div>`);
  const btn = document.getElementById('modal-connect-btn');
  if (btn) btn.addEventListener('click', () => { sendFriendRequest(u); closeModal(); });
}

/*FRIEND REQUESTS*/
async function sendFriendRequest(toUser) {
  if (!currentUser) { showToast('Please log in to connect!','error'); openLoginModal(); return; }
  if (demoMode) {
    if (demoFriendRequests.some(r=>r.from===currentUser.id&&r.to===toUser.id)) { showToast('Request already sent!',''); return; }
    demoFriendRequests.push({ from:currentUser.id, to:toUser.id, fromName:currentUser.name });
    showToast(`Friend request sent to ${toUser.name}! 🎉`,'success');
    renderUserGrid(allUsers,'user-grid',6);
    renderUserGrid(filterUsers(),'search-grid');
    return;
  }
  const res = await apiFetch('/friend-request',{method:'POST',body:JSON.stringify({toId:toUser.id})});
  if (res&&res.ok) { showToast(`Friend request sent to ${toUser.name}! 🎉`,'success'); }
  else { showToast('Could not send request.','error'); }
}

async function loadFriendRequests() {
  if (!currentUser) return;
  document.getElementById('logged-in-sections').classList.remove('hidden');
  const container = document.getElementById('requests-container');
  const requests  = demoMode ? demoFriendRequests.filter(r=>r.to===currentUser.id) : [];
  if (!requests.length) { container.innerHTML='<p class="empty-msg">No pending requests.</p>'; return; }
  container.innerHTML='';
  requests.forEach(r => {
    const sender = allUsers.find(u=>u.id===r.from); if (!sender) return;
    const card = document.createElement('div');
    card.className='request-card';
    card.innerHTML=`<div class="req-info"><strong>${sender.name}</strong><span>📍 ${sender.location} · Age ${sender.age}</span></div>
      <div class="req-actions">
        <button class="btn-accept" data-from="${r.from}">Accept</button>
        <button class="btn-reject" data-from="${r.from}">Decline</button>
      </div>`;
    card.querySelector('.btn-accept').addEventListener('click',()=>acceptRequest(r));
    card.querySelector('.btn-reject').addEventListener('click',()=>rejectRequest(r));
    container.appendChild(card);
  });
}
function acceptRequest(r) {
  demoFriendRequests=demoFriendRequests.filter(x=>!(x.from===r.from&&x.to===r.to));
  if (!currentUser.friends) currentUser.friends=[];
  currentUser.friends.push(r.from);
  localStorage.setItem('metoo_user',JSON.stringify(currentUser));
  showToast('You are now friends! 🎉','success');
  loadFriendRequests(); renderUserGrid(allUsers,'user-grid',6);
}
function rejectRequest(r) {
  demoFriendRequests=demoFriendRequests.filter(x=>!(x.from===r.from&&x.to===r.to));
  showToast('Request declined.',''); loadFriendRequests();
}

/*SEARCH PAGE*/
function filterUsers() {
  const kw  = (document.getElementById('kw-search')?.value||'').trim().toLowerCase();
  const loc = (document.getElementById('loc-search')?.value||'').trim().toLowerCase();
  const gender = document.querySelector('#page-search .sw-btn.active')?.dataset.gender||'any';
  const minAge = parseInt(document.getElementById('age-min')?.value)||18;
  const maxAge = parseInt(document.getElementById('age-max')?.value)||80;
  return allUsers.filter(u => {
    const ageOk = u.age>=minAge && u.age<=maxAge;
    const gOk   = gender==='any' || u.gender===gender || !u.gender;
    const lOk   = !loc  || (u.location||'').toLowerCase().includes(loc);
    const kOk   = !kw   || (u.name+' '+(u.interests||[]).join(' ')+' '+u.bio).toLowerCase().includes(kw);
    return ageOk && gOk && lOk && kOk;
  });
}

document.getElementById('do-search')?.addEventListener('click', () => {
  const filtered = filterUsers();
  renderUserGrid(filtered,'search-grid');
  const info = document.getElementById('search-results-info');
  if (info) info.textContent = `Found ${filtered.length} ${filtered.length===1?'person':'people'}`;
  showToast(`Found ${filtered.length} people!`,'success');
});

// Gender toggle in search page
document.querySelectorAll('#page-search .sw-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('#page-search .sw-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
  });
});

/*DISCOVER PAGE*/
function renderInterestCategories() {
  const wrap = document.getElementById('interest-categories');
  if (!wrap) return;
  wrap.innerHTML='';
  INTEREST_CATEGORIES.forEach(cat=>{
    const tile = document.createElement('div');
    tile.className='interest-cat';
    tile.innerHTML=`<span class="cat-emoji">${cat.emoji}</span><span class="cat-label">${cat.label}</span>`;
    tile.addEventListener('click',()=>{
      document.querySelectorAll('.interest-cat').forEach(t=>t.classList.remove('active'));
      tile.classList.add('active');
      discoverByInterest(cat);
    });
    wrap.appendChild(tile);
  });
}
function discoverByInterest(cat) {
  const results = allUsers.filter(u=>(u.interests||[]).some(i=>i.toLowerCase().includes(cat.kw)));
  const section = document.getElementById('discover-results-section');
  const title   = document.getElementById('discover-results-title');
  section.style.display='block';
  title.textContent=`${cat.emoji} ${cat.label} (${results.length})`;
  renderUserGrid(results,'discover-grid');
  section.scrollIntoView({behavior:'smooth',block:'start'});
}
document.getElementById('clear-discover')?.addEventListener('click',()=>{
  document.getElementById('discover-results-section').style.display='none';
  document.querySelectorAll('.interest-cat').forEach(t=>t.classList.remove('active'));
});

/*EVENTS PAGE*/
let rsvpSet = new Set();
function renderEvents(filter='all') {
  const grid = document.getElementById('events-grid');
  if (!grid) return;
  const list = filter==='all' ? EVENTS : EVENTS.filter(e=>e.category===filter);
  grid.innerHTML='';
  list.forEach(ev=>{
    const pct = Math.round(ev.attendees/ev.max*100);
    const rsvped = rsvpSet.has(ev.id);
    const card = document.createElement('div');
    card.className='event-card';
    card.innerHTML=`
      <div class="event-banner" style="background:${ev.color};">${ev.emoji}</div>
      <div class="event-body">
        <div class="event-category">${ev.category}</div>
        <div class="event-title">${ev.title}</div>
        <div class="event-meta">
          <span>📅 ${ev.date}</span>
          <span>📍 ${ev.location}</span>
        </div>
        <div class="event-footer">
          <div class="event-attendees">👥 ${ev.attendees}/${ev.max} going</div>
          <button class="btn-rsvp${rsvped?' rsvped':''}" data-id="${ev.id}">${rsvped?'✅ RSVP\'d':'RSVP →'}</button>
        </div>
      </div>`;
    card.querySelector('.btn-rsvp').addEventListener('click', function(){
      if (!currentUser) { showToast('Log in to RSVP!','error'); openLoginModal(); return; }
      if (rsvpSet.has(ev.id)) return;
      rsvpSet.add(ev.id); ev.attendees++;
      showToast(`You're going to "${ev.title}"! 🎉`,'success');
      renderEvents(filter);
    });
    grid.appendChild(card);
  });
}
document.getElementById('events-filter-tabs')?.addEventListener('click',e=>{
  const tab = e.target.closest('.evt-tab'); if(!tab) return;
  document.querySelectorAll('.evt-tab').forEach(t=>t.classList.remove('active'));
  tab.classList.add('active');
  renderEvents(tab.dataset.filter);
});

/*FEATURE TILES (home page)*/
document.querySelectorAll('.feat-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const action = btn.dataset.action;
    if (action==='interests')    { navigateTo('discover'); }
    else if (action==='nearby')  { navigateTo('search'); document.getElementById('loc-search')?.focus(); }
    else if (action==='events')  { navigateTo('events'); }
    else if (action==='conversations') {
      if (!currentUser) { openLoginModal(); return; }
      showToast('Send a friend request to start chatting! 💬','success');
    }
    else if (action==='verified') {
      openModal(`
        <div class="modal-body">
          <h2>🛡️ Safe & Verified</h2>
          <p>Your safety is our top priority. Here's how we keep Me Too! secure:</p>
          <ul class="safety-list">
            <li><span>✅</span><span><strong>Profile Review:</strong> Every new account is manually reviewed before going live.</span></li>
            <li><span>🔒</span><span><strong>Private Info:</strong> Your email and password are never shared with other users.</span></li>
            <li><span>🚫</span><span><strong>Block & Report:</strong> See something wrong? Block or report any profile instantly.</span></li>
            <li><span>👮</span><span><strong>Moderation:</strong> Our team monitors activity 24/7 to remove bad actors fast.</span></li>
            <li><span>💚</span><span><strong>Friend-First:</strong> All connections require mutual acceptance — no unsolicited contact.</span></li>
          </ul>
          <button class="form-submit" onclick="closeModal()">Got it, thanks!</button>
        </div>`);
    }
  });
});

/*NAVIGATION*/
const PAGES = ['home','search','discover','events'];
function navigateTo(page) {
  PAGES.forEach(p=>{
    const el = document.getElementById('page-'+p);
    if (el) el.classList.toggle('hidden', p!==page);
  });
  // hero home stuff
  document.getElementById('profile-strip')?.closest('#page-home') && null;

  // nav active state
  document.querySelectorAll('.nav-link').forEach(a=>{
    a.classList.toggle('active', a.dataset.page===page);
  });

  // lazy render on first visit
  if (page==='discover') renderInterestCategories();
  if (page==='events')   renderEvents();
  if (page==='search')   { renderUserGrid(allUsers,'search-grid'); }
  window.scrollTo({top:0,behavior:'smooth'});
}

document.querySelectorAll('.nav-link').forEach(a=>{
  a.addEventListener('click',e=>{ e.preventDefault(); navigateTo(a.dataset.page); });
});
document.getElementById('hero-join')?.addEventListener('click',openSignupModal);
document.getElementById('hero-search')?.addEventListener('click',()=>navigateTo('search'));
document.getElementById('see-all-people')?.addEventListener('click',()=>navigateTo('search'));

/* AUTH*/
function openSignupModal() {
  openModal(`
    <div class="modal-body">
      <h2>Join Me Too! 🎉</h2>
      <p>Create your free account and start connecting.</p>
      <div class="form-group"><label>Full Name</label><input type="text" id="s-name" placeholder="Your name" /></div>
      <div class="form-row">
        <div class="form-group"><label>Email</label><input type="email" id="s-email" placeholder="you@email.com" /></div>
        <div class="form-group"><label>Password</label><input type="password" id="s-pass" placeholder="Min 6 chars" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Age</label><input type="number" id="s-age" placeholder="25" min="18" max="99" /></div>
        <div class="form-group"><label>Location</label><input type="text" id="s-loc" placeholder="Nairobi" /></div>
      </div>
      <div class="form-group">
        <label>I identify as</label>
        <div class="gender-grid">
          <div class="gender-opt" data-g="female">👩 Woman</div>
          <div class="gender-opt" data-g="male">👨 Man</div>
          <div class="gender-opt" data-g="other">🌟 Other</div>
        </div>
      </div>
      <div class="form-group"><label>Bio</label><textarea id="s-bio" placeholder="A little about yourself…"></textarea></div>
      <div class="form-group"><label>Interests (comma-separated)</label><input type="text" id="s-interests" placeholder="hiking, music, gaming" /></div>
      <button class="form-submit" id="signup-submit">Create Account →</button>
      <div class="form-switch">Already have an account? <a id="switch-to-login">Log In</a></div>
    </div>`);

  let selectedGender='';
  document.querySelectorAll('.gender-opt').forEach(opt=>{
    opt.addEventListener('click',()=>{
      document.querySelectorAll('.gender-opt').forEach(o=>o.classList.remove('selected'));
      opt.classList.add('selected'); selectedGender=opt.dataset.g;
    });
  });
  document.getElementById('switch-to-login').addEventListener('click',openLoginModal);
  document.getElementById('signup-submit').addEventListener('click',async()=>{
    const name=document.getElementById('s-name').value.trim();
    const email=document.getElementById('s-email').value.trim();
    const password=document.getElementById('s-pass').value;
    const age=parseInt(document.getElementById('s-age').value);
    const location=document.getElementById('s-loc').value.trim();
    const bio=document.getElementById('s-bio').value.trim();
    const interests=document.getElementById('s-interests').value;
    if (!name||!email||!password||!age||!location){showToast('Please fill in all required fields.','error');return;}
    const payload={name,email,password,age,location,bio,interests,gender:selectedGender};
    if (demoMode) {
      if (allUsers.find(u=>u.email===email)){showToast('Email already registered!','error');return;}
      const newUser={id:allUsers.length+1,friends:[],...payload,interests:interests?interests.split(',').map(s=>s.trim()):[]};
      allUsers.push(newUser); currentUser=newUser;
      localStorage.setItem('metoo_user',JSON.stringify(newUser)); onLogin(newUser); return;
    }
    const res=await apiFetch('/signup',{method:'POST',body:JSON.stringify(payload)});
    if (!res){demoMode=true;return;}
    if (res.ok){const user=await res.json();currentUser=user;localStorage.setItem('metoo_user',JSON.stringify(user));onLogin(user);}
    else{const err=await res.json();showToast(err.message||'Signup failed','error');}
  });
}

function openLoginModal() {
  openModal(`
    <div class="modal-body">
      <h2>Welcome Back 👋</h2>
      <p>Log in to your Me Too! account.</p>
      <div class="form-group"><label>Email</label><input type="email" id="l-email" placeholder="you@email.com" /></div>
      <div class="form-group"><label>Password</label><input type="password" id="l-pass" placeholder="Your password" /></div>
      <button class="form-submit" id="login-submit">Log In →</button>
      <div class="form-switch">New here? <a id="switch-to-signup">Create account</a></div>
    </div>`);
  document.getElementById('switch-to-signup').addEventListener('click',openSignupModal);
  document.getElementById('login-submit').addEventListener('click',async()=>{
    const email=document.getElementById('l-email').value.trim();
    const password=document.getElementById('l-pass').value;
    if (!email||!password){showToast('Enter email and password.','error');return;}
    if (demoMode){
      const user=allUsers.find(u=>u.email===email&&u.password===password);
      if (!user){showToast('Invalid credentials!','error');return;}
      currentUser=user;localStorage.setItem('metoo_user',JSON.stringify(user));onLogin(user);return;
    }
    const res=await apiFetch('/login',{method:'POST',body:JSON.stringify({email,password})});
    if (!res){demoMode=true;return;}
    if (res.ok){const user=await res.json();currentUser=user;localStorage.setItem('metoo_user',JSON.stringify(user));onLogin(user);}
    else{showToast('Invalid credentials!','error');}
  });
}

function onLogin(user) {
  closeModal();
  showToast(`Welcome, ${user.name.split(' ')[0]}! 🎉`,'success');
  updateNavForUser(user);
  renderUserGrid(allUsers,'user-grid',6);
  renderMyProfile(user);
  loadFriendRequests();
}

function updateNavForUser(user) {
  const right=document.querySelector('.topnav-right');
  right.innerHTML=`<span style="color:rgba(255,255,255,.8);font-size:14px;">Hi, ${user.name.split(' ')[0]}</span>
    <button class="btn-primary" id="nav-logout">Log Out</button>`;
  document.getElementById('nav-logout').addEventListener('click',logout);
}

function renderMyProfile(user) {
  document.getElementById('logged-in-sections').classList.remove('hidden');
  document.getElementById('my-profile-container').innerHTML=`
    <div class="my-profile-box">
      <h3>${user.name}</h3>
      <p class="profile-detail"><strong>Email:</strong> ${user.email}</p>
      <p class="profile-detail"><strong>Age:</strong> ${user.age}</p>
      <p class="profile-detail"><strong>Location:</strong> ${user.location}</p>
      <p class="profile-detail"><strong>Bio:</strong> ${user.bio||'—'}</p>
      <p class="profile-detail"><strong>Interests:</strong> ${(user.interests||[]).join(', ')||'—'}</p>
      <p class="profile-detail"><strong>Friends:</strong> ${(user.friends||[]).length}</p>
    </div>`;
}

async function logout() {
  if (!demoMode) await apiFetch('/logout',{method:'POST'});
  currentUser=null; localStorage.removeItem('metoo_user');
  showToast('Logged out. See you soon! 👋','');
  const right=document.querySelector('.topnav-right');
  right.innerHTML=`<button class="btn-ghost" id="open-login">Log In</button><button class="btn-primary" id="open-signup">Join Free</button>`;
  bindNavButtons();
  document.getElementById('logged-in-sections').classList.add('hidden');
  renderUserGrid(allUsers,'user-grid',6);
}

document.getElementById('logout-btn')?.addEventListener('click',logout);

/*NAV BUTTONS & MODAL*/
function bindNavButtons() {
  document.getElementById('open-login')?.addEventListener('click',openLoginModal);
  document.getElementById('open-signup')?.addEventListener('click',openSignupModal);
}
bindNavButtons();
document.getElementById('modal-close').addEventListener('click',closeModal);
document.getElementById('modal-overlay').addEventListener('click',e=>{ if (e.target===document.getElementById('modal-overlay')) closeModal(); });

/* RESTORE SESSION & INIT*/
if (currentUser) updateNavForUser(currentUser);

loadUsers().then(()=>{
  if (currentUser) { renderMyProfile(currentUser); loadFriendRequests(); }
});