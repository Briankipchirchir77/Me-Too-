# Me Too! — Find Your People

**Author:** Brian Kipchirchir
**Stack:** React (Vite) · Flask · SQLAlchemy · PostgreSQL · JWT auth (bcrypt-hashed passwords)

---

## Overview

Me Too! is a social-discovery app that helps people connect based on **shared interests, hobbies, and location** — not appearance. Browse people near you, search/filter by interest, location, age and gender, discover people by interest category, RSVP to local events, and send/accept friend requests.

This is a full-stack rewrite of an earlier vanilla-JS prototype (still available in [`legacy/`](legacy/) for reference). The current app is a two-service architecture:

- **`frontend/`** — a React (Vite) single-page app.
- **`backend/`** — a Flask REST API backed by PostgreSQL via SQLAlchemy, with JWT-based authentication and bcrypt password hashing.

---

## Project Structure

```
Too!/
├── backend/            — Flask API, SQLAlchemy models, migrations, tests
│   ├── app/
│   │   ├── models.py       — User, Interest, FriendRequest, Event, EventRsvp
│   │   ├── routes/         — auth, users, friends, events, interests blueprints
│   │   ├── config.py       — Dev/Test/Prod config (reads from .env)
│   │   └── seed.py         — `flask seed` demo data command
│   ├── migrations/      — Alembic migrations (Flask-Migrate)
│   └── tests/           — pytest suite
├── frontend/            — React app (Vite), one page per route
│   └── src/
│       ├── api/            — fetch client + per-resource API calls
│       ├── context/        — Auth / Modal / Toast providers
│       ├── components/     — Navbar, cards, modals, etc.
│       └── pages/          — Home, Search, Discover, Events
├── legacy/              — the original static HTML/CSS/JS prototype
└── docs/screenshots/     — app screenshots
```

---

## Features

| Feature | Details |
|---|---|
| **Auth** | Signup/login with bcrypt-hashed passwords and JWT access tokens (no plaintext passwords, no client-trusted session data) |
| **Search** | Server-side filtering by keyword, location, gender, and age range, with pagination |
| **Discover** | Browse by interest category with live counts pulled from the database |
| **Events** | Category filter tabs, RSVP with server-enforced capacity limits and duplicate-RSVP prevention |
| **Friend Requests** | Send, accept, decline; duplicate/self-request prevention; friends derived from accepted requests |
| **Admin** | `is_admin`-gated event management (create/edit/delete) at `/admin`, hidden from the nav for regular users |
| **Validation & errors** | Consistent JSON error responses; meaningful 400/401/404/409 statuses instead of silent failures |

---

## Getting Started

### 1. Backend (Flask + PostgreSQL)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# create a local Postgres role + database (adjust to your setup)
sudo -u postgres createuser -s "$(whoami)"
sudo -u postgres createdb -O "$(whoami)" metoo_dev

cp .env.example .env      # edit DATABASE_URL / JWT_SECRET_KEY if needed
export FLASK_APP=wsgi.py
flask db upgrade          # create tables
flask seed                # load demo users, interests, and events
flask run                 # http://localhost:5000
```

Run the test suite (uses an in-memory SQLite DB, no Postgres required):

```bash
pytest
```

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
cp .env.example .env       # VITE_API_URL, defaults to http://localhost:5000/api
npm run dev                 # http://localhost:5173
```

Open `http://localhost:5173` with the backend running — sign up for a new account, or log in with one of the seeded demo accounts below.

---

## Demo Credentials

Seeded by `flask seed`:

| Name | Email | Password |
|---|---|---|
| Alice Wanjiru | alice@example.com | password123 |
| Bob Kamau | bob@example.com | password123 |
| Cynthia Omollo | cyn@example.com | password123 |
| Derek Mwangi | derek@example.com | password123 |
| Esther Njoki | esther@example.com | password123 |
| Frank Odhiambo | frank@example.com | password123 |
| Scott Martha Awuor | scott@example.com | password123 |
| Brian Kipchirchir (admin) | briankipchirchir964@gmail.com | CHROMETE |

---

## API Overview

All endpoints are prefixed with `/api`. JSON in, JSON out; protected routes expect `Authorization: Bearer <token>`.

- `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`
- `GET /users?q=&location=&gender=&min_age=&max_age=&interest=&page=&per_page=`, `GET /users/<id>`
- `GET /interests`
- `POST /friends/requests`, `GET /friends/requests`, `POST /friends/requests/<id>/accept`, `POST /friends/requests/<id>/decline`, `GET /friends`
- `GET /events?category=`, `POST /events/<id>/rsvp`, `DELETE /events/<id>/rsvp`
- Admin-only (`is_admin` account required): `POST /events`, `PATCH /events/<id>`, `DELETE /events/<id>`

---

## Screenshots

![Screenshot 1](docs/screenshots/screenshot-1.png)
![Screenshot 2](docs/screenshots/screenshot-2.png)
![Screenshot 3](docs/screenshots/screenshot-3.png)
![Screenshot 4](docs/screenshots/screenshot-4.png)

*(from the earlier prototype UI — the React rebuild keeps the same look and feel)*

## License

MIT — see [LICENSE](LICENSE). Open for learning and personal use.
