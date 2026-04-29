# Role 4 — Maps & Seasonal Tracker
**Owner:** Ching-Yen Lee (Candice)  
**Last updated:** 2026-04-29

---

## Teammate Backend (ichanner) — What was built

**Repo:** https://github.com/ichanner/backend  
**Port:** 4000 (Role 4 runs on 3000)

This is a pure REST API — no HTML pages, just JSON endpoints. Role 4's server-rendered Handlebars app reads from the same MongoDB database that this backend writes to.

### What it covers

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Users | `GET/PATCH /api/users/:id` |
| Businesses | Full CRUD on `/api/businesses` |
| Products | Nested under `/api/businesses/:id/products` |
| Reviews | Nested under `/api/businesses/:id/reviews` |
| Questions & Answers | Nested under `/api/businesses/:id/questions` |

### Database schema (Mongoose — matches the group proposal exactly)

```
Business
  ├── name, category, dataSource, neighborhood, address
  ├── location  { type: "Point", coordinates: [lng, lat] }
  ├── healthGrade, isVerified
  ├── products[]
  │     ├── _id (UUID string), name, description, culture
  │     └── stockReports[]  { userId, inStock, reportedAt }
  ├── reviews[]   { _id, userId, rating, comment, createdAt }
  └── questions[] { _id, userId, questionText, createdAt,
                    answers: [{ _id, userId, answerText, createdAt }] }

User
  └── firstName, lastName, email, hashedPassword, role,
      followedCultures[], mustBuyList[]
```

### Key fields Role 4 must use (not the old names)

| Role 4 used to write | Correct field (per proposal & teammate) |
|----------------------|------------------------------------------|
| `products.holidayTag` | `products.culture` |
| `products.itemName` | `products.name` |
| `products.inStock` (boolean) | derive from `products.stockReports` array |
| `cuisine` (root) | `category` |

---

---

## What was built today

### 1. Full backend (data + routes)
| File | What it does |
|------|-------------|
| `config/mongoConnection.js` | MongoDB client wrapper |
| `config/mongoCollections.js` | Lazy collection accessors |
| `data/businesses.js` | All MongoDB queries — map feed, holiday filter, geo-near |
| `routes/map.js` | `GET /map` page + `GET /api/businesses` JSON feed |
| `routes/seasonal.js` | `GET /seasonal` landing + `GET /seasonal/:tag` results + JSON feed |

### 2. Real NYC data seed (`seed-real.js`)
- Pulls live data from the **DOHMH Restaurant Inspection dataset** (NYC Open Data, no API key needed)
- Deduplicates by `camis` ID both within and across cuisine categories
- Covers **17 cuisine types × ~7–10 restaurants = 122 real NYC businesses**
- Each business stored with GeoJSON `location`, sub-document `products[]` with `holidayTag`, `photoUrl`, and `cuisine`
- Creates two required MongoDB indexes: `location: "2dsphere"` and `"products.holidayTag": 1`

**Cuisine → holiday tag mapping used in seed:**

| Cuisine | Holiday Tags |
|---------|-------------|
| Chinese, Korean, Chinese/Cuban | Lunar New Year, Mid-Autumn, Chuseok |
| Indian | Diwali, Holi |
| Pakistani, Bangladeshi | Ramadan, Eid, Pohela Boishakh |
| Jewish/Kosher | Passover, Hanukkah, Rosh Hashanah |
| Middle Eastern, Lebanese, Egyptian, Moroccan | Ramadan, Eid |
| Iranian | Nowruz, Ramadan |
| Mexican | Día de los Muertos, Las Posadas |
| Caribbean | Carnival, Christmas |
| Ethiopian | Ethiopian Christmas (Genna), Ethiopian New Year (Enkutatash) |
| Filipino | Christmas, Fiesta |

### 3. Interactive Leaflet map (`public/js/map.js`)
- Centered on NYC, zoom 11 (all 5 boroughs visible)
- `maxBounds` prevents panning outside NYC
- Fetches `/api/businesses` — supports `?neighborhood=` and `?holidayTag=` filters
- Markers with XSS-safe popups linking to `/businesses/:id`
- Parallel accessible `<ul>` list view for screen readers
- Full error handling at every step

### 4. Seasonal Tracker UI
- **Landing page** (`/seasonal`): NYC hero banner + holiday card grid with photos
- **Results page** (`/seasonal/:tag`): Business card grid with restaurant photos, product chips (green = in stock, gray = out of stock)
- All holiday tags are read from the database — no hardcoded list in the UI

### 5. NYC editorial design system (`public/css/map.css`)
- **Colors:** charcoal nav (`#1A1818`) + warm stone background (`#F4EFE8`) + taxi yellow accent (`#F5B800`) + brownstone brick (`#8B3530`)
- **Fonts:** Playfair Display (serif headlines) + Inter (body) via Google Fonts
- **Photos:** Unsplash CDN by cuisine/holiday; CSS gradient fallback if image fails to load
- Fully responsive (mobile breakpoint at 768px)
- Accessibility: `aria-label`, `role`, `visually-hidden`, `aria-busy`

---

## Live URLs (localhost:3000)

| URL | Page |
|-----|------|
| `/map` | Interactive Leaflet map with filter bar |
| `/map?neighborhood=Flushing` | Filtered by neighborhood |
| `/map?holidayTag=Lunar%20New%20Year` | Seasonal overlay on map |
| `/seasonal` | Holiday picker landing page |
| `/seasonal/Diwali` | Server-rendered business list for Diwali |
| `/api/businesses` | JSON feed for the map |
| `/api/seasonal/Ramadan` | JSON feed for a holiday |

---

## What I need from other team members

### 🔴 Role 2 (Data Seeding) — most critical
My backend is fully written and working with seed data. When Role 2 seeds the real database, they need to match this schema:

```js
// businesses collection
{
  name: String,
  neighborhood: String,          // e.g. "Flushing", "Jackson Heights"
  location: {
    type: "Point",
    coordinates: [lng, lat]      // GeoJSON order: longitude first!
  },
  cuisine: String,               // e.g. "Chinese", "Indian"
  photoUrl: String,              // optional Unsplash URL
  products: [
    {
      itemName: String,
      inStock: Boolean,
      lastReported: String,      // ISO date "YYYY-MM-DD"
      holidayTag: String         // e.g. "Lunar New Year", "Diwali"
    }
  ]
}
```

**Also need Role 2 to add these indexes to their seed script:**
```js
db.businesses.createIndex({ location: "2dsphere" });
db.businesses.createIndex({ "products.holidayTag": 1 });
```

### 🟡 Role 3 (UI/UX & Layout)
- When the shared `main.handlebars` layout is ready, replace `views/layouts/main.handlebars` with theirs
- Need them to add two nav links: `/map` and `/seasonal`
- Need their shared `error` view to replace `views/error.handlebars`
- I've built a temporary layout in the meantime — all pages work now

### 🟡 Role 5 (Business detail page)
- Map marker popups and seasonal result cards link to `/businesses/:id`
- Those links return 404 until Role 5 builds that route
- Everything else on my pages works fine without it

### 🟢 Role 1 (Auth) — optional enhancement
- Not needed for core map/seasonal functionality
- If we want to personalize the map based on `followedCultures`, we'd need the session object from Role 1

---

## TODOs for tomorrow

### Bug / UX fix
- [ ] **Photo duplication:** Restaurant cards on the seasonal results page and holiday cards on the landing page both use food photos — they look similar and feel repetitive. Fix plan:
  - Holiday cards → keep food/festival scene photos (current approach is good)
  - Restaurant cards → switch to a street-view or storefront style photo per cuisine, OR use a generic restaurant interior photo. Consider fetching a Google Street View Static image using the business address, or use a distinct visual treatment (colored gradient header with the cuisine name text instead of a photo).

### Nice-to-have
- [ ] Add cuisine filter chips on the `/seasonal` landing page (quick filter by culture)
- [ ] Add marker clustering on the map when zoomed out (Leaflet.markercluster plugin)
- [ ] "Near me" button on map page using browser geolocation → hits `/api/businesses/near?lng=&lat=`
- [ ] Animate the holiday cards on scroll (CSS `@keyframes` + IntersectionObserver)

---

## How to run locally

```bash
# 1. Install dependencies
npm install

# 2. Make sure MongoDB is running locally
# (mongodb://localhost:27017/nyc_roots_and_flavors)

# 3. Seed the database with real NYC data
node seed-real.js

# 4. Start the server
npm start
# → http://localhost:3000
```

---

## Files changed today

```
role4-map-seasonal/
├── package.json              ← new
├── app.js                    ← new
├── seed.js                   ← new (simple 5-business test seed)
├── seed-real.js              ← new (122 real businesses from DOHMH API)
├── config/
│   ├── mongoConnection.js    ← unchanged
│   └── mongoCollections.js   ← unchanged
├── data/
│   └── businesses.js         ← updated projection (added photoUrl, cuisine)
├── routes/
│   ├── map.js                ← unchanged
│   └── seasonal.js           ← updated (added HOLIDAY_META with photos)
├── views/
│   ├── layouts/
│   │   └── main.handlebars   ← new (Google Fonts + dark editorial nav)
│   ├── map.handlebars        ← updated (new CSS class structure)
│   ├── seasonal-index.handlebars  ← updated (hero + holiday card grid)
│   ├── seasonal.handlebars   ← updated (business card grid with photos)
│   └── error.handlebars      ← new
└── public/
    ├── css/map.css           ← complete rewrite (NYC design system)
    └── js/map.js             ← unchanged
```
