# Me Too! — Find Your People

**Author:** Brian Kipchirchir  
**Stack:** HTML5 · CSS3 · Vanilla JavaScript (ES6+) · Google Fonts  
**Demo:** Open `index.html` directly in any browser — no build step required.

---

## Overview

Me Too! is a frontend social-discovery web application that helps people connect based on **shared interests, hobbies, and location** — not appearance. It demonstrates real-world use of the Fetch API, DOM manipulation, event handling, form validation, and responsive UI design.

The app connects to a local JSON Server backend (`http://localhost:3000`) when available, and falls back seamlessly to built-in demo data otherwise.

---

## Project Structure

```
MeToo/
├── index.html    — Page structure and all four page sections (Home, Search, Discover, Events)
├── styles.css    — All styling: variables, layout, components, responsive rules
├── script.js     — All app logic: fetch, search, DOM updates, auth, events
├── db.json       — Sample data for json-server backend (8 users)
└── README.md     — This file
```

---

## Features

| Feature | Details |
|---|---|
| **Fetch API** | Fetches `/users` from local API; gracefully falls back to demo data with HTTP status error handling and JSON parse error handling |
| **Search** | Multi-filter: keyword/interest, location, gender toggle, age range; Enter-key support; edge-case empty-filter warning; result count display |
| **Discover** | 16 interest category tiles (Hiking, Music, Art, Tech, etc.); clicking any tile filters and displays matching users |
| **Events** | 12 event cards; category filter tabs (Sports, Arts, Tech, Food, Music, Outdoors); RSVP system with full-event detection and attendee count updates |
| **DOM Manipulation** | All cards, modals, strips, and sections built entirely via JavaScript DOM APIs — no static HTML cards |
| **Form Handling** | Sign-up form with field-specific validation messages; login with Enter-key support; gender selector; interests parsed from comma-separated input |
| **Auth** | Session stored in `localStorage`; login/logout updates nav, profile section, and all grids; duplicate email detection on signup |
| **Friend Requests** | Send, accept, decline; duplicate-request prevention; card state updates (Connect → Sent → Friends) |
| **Feature Tiles** | All 5 home tiles are functional: Interests → Discover, Near You → Search, Safe & Verified → info modal, Conversations → prompt, Events → Events page |
| **Responsive Design** | Mobile-first grid layouts; nav collapses on small screens; all pages adapt to viewport |

---

## How It Works

### Fetch API & Error Handling

```js
async function loadUsers() {
  const res = await apiFetch('/users');          // wrapped fetch with try/catch
  if (res && res.ok)       { allUsers = await res.json(); }
  else if (res && !res.ok) { /* HTTP error — show toast, use demo */ }
  else                     { /* null = network error — silent demo mode */ }
}
```

Three distinct failure paths are handled: network failure, HTTP error status, and malformed JSON.

### Search

Filters across four dimensions simultaneously:

```js
const kOk = !kw || [u.name, ...(u.interests||[]), u.bio||''].join(' ').toLowerCase().includes(kw);
```

Keyword search matches against name, all interests, and bio text. Age range auto-corrects if min > max.

### DOM Manipulation

Every user card, event card, interest tile, and friend request card is created programmatically:

```js
const card = document.createElement('div');
card.className = 'user-card';
card.innerHTML = `…`;
grid.appendChild(card);
```

### Authentication & Storage

```js
localStorage.setItem('metoo_user', JSON.stringify(user));
currentUser = JSON.parse(localStorage.getItem('metoo_user') || 'null');
```

Session persists across page refreshes. Logout clears storage and resets all UI state.

---

## Getting Started

### Option A — Open directly (demo mode)

```bash
git clone <your-repo-url>
cd MeToo
open index.html          # macOS
# or double-click index.html in your file manager
```

The app runs entirely on demo data — no setup needed.

### Option B — With live backend (json-server)

```bash
npm install -g json-server
json-server --watch db.json --port 3000
# then open index.html
```

The app auto-detects the server and switches from demo mode to live data.

---

## Demo Credentials

| Name | Email | Password |
|---|---|---|
| Alice Wanjiru | alice@example.com | password123 |
| Bob Kamau | bob@example.com | password123 |
| Cynthia Omollo | cyn@example.com | password123 |
| Derek Mwangi | derek@example.com | password123 |
| Esther Njoki | esther@example.com | password123 |
| Frank Odhiambo | frank@example.com | password123 |
| Scott Martha Awuor | scott@example.com | password123 |
| Brian Kipchirchir | briankipchirchir964@gmail.com | CHROMETE |

---

## Technologies

- **HTML5** — Semantic structure, four page sections in a single file
- **CSS3** — Custom properties (CSS variables), flexbox, grid, animations, responsive breakpoints
- **Vanilla JavaScript ES6+** — async/await, fetch, arrow functions, template literals, Set, optional chaining
- **Google Fonts** — Playfair Display (headings) + DM Sans (body)
- **JSON Server** (optional) — REST API from db.json for live data

---

## Limitations

- No real backend — data does not persist between page refreshes in demo mode
- Authentication uses plain-text passwords — not suitable for production
- Friend requests and RSVPs reset on page reload (demo mode)
- No real-time messaging or push notifications

---

## Future Improvements

- Backend with Node.js / Express and a real database (PostgreSQL or MongoDB)
- Secure authentication using JWT and bcrypt
- Real-time messaging with WebSockets
- Profile photo uploads
- Push notifications for friend requests and event reminders
- Map integration showing nearby users and event venues

---

## License

Open for learning and personal use.