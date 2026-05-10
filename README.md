# NYC Roots & Flavors

A multicultural community-driven web application that helps users discover authentic minority-owned restaurants and specialty shops across New York City.

Developed as the Final Project for CS546 Web Programming.

---

# Team Members

- Suraj Atluri
- Ian Channer
- Leshui Hu
- Ching-Yen Lee
- Dev Shah

---

# Project Overview

NYC Roots & Flavors is a web application designed to help multicultural communities discover authentic minority-owned businesses, cultural foods, and specialty ingredients throughout New York City.

Unlike traditional review platforms, this application focuses on culturally specific products and experiences that are often difficult to find on mainstream platforms.

The platform combines NYC Open Data datasets with community-generated content to create a collaborative discovery experience for multicultural communities.

Features include:
- Minority-owned business discovery
- Restaurant health inspection grades
- Specialty cultural product listings
- Real-time stock availability reporting
- Product reviews and Q&A discussions
- Personalized cultural dashboards
- Interactive neighborhood mapping

---

# Security & Validation

The application follows a 3-Layer Validation Strategy:

1. Client-Side Validation
2. Route-Level Validation
3. Database-Level Validation

This layered approach helps prevent invalid data insertion, malformed requests, injection attacks, and unauthorized input manipulation.

---

# XSS Protection & Security Measures

- Handlebars auto-escaping for user-generated content
- Content Security Policy (CSP)
- Session secrets stored using environment variables
- Authentication middleware for protected routes

---

# Interactive Map & Geospatial Features

Business locations are stored using GeoJSON coordinates and indexed using MongoDB’s 2dsphere indexing system.

This enables:
- Efficient geographic searching
- Neighborhood filtering
- Real-world coordinate mapping
- Location-based business discovery

---

# Environment Setup

Create a `.env` file in the root directory:

```env
SESSION_SECRET=your_session_secret
MONGO_SERVER_URL=mongodb://127.0.0.1:27017/nyc-roots-flavors
PORT=3000
```

---

# Installation & Setup

```bash
npm install
npm run seed
npm start
```

Open:

```text
http://localhost:3000
```

---

# Database Seeding

The seed task:
- Creates demo users
- Creates admin account
- Loads NYC restaurant/business data
- Populates sample products and reviews

Run:

```bash
npm run seed
```

---

# GitHub Repository

https://github.com/HlR00/CS546-B-Web-Programming-Final-Project.git
