# Peregrinus - Flight Price Tracker

![Peregrinus Logo](./public/peregrinvs-logo.svg)

A professional full-stack flight price tracking application built with TypeScript that monitors flight prices and notifies users when prices drop.

## 🚀 Live Demo

[**View Live Application**](https://peregrinus.vercel.app)

## 📋 Project Overview

Peregrinus is a sophisticated flight price tracking application that helps users save money on flights by monitoring prices and sending notifications when significant price drops occur. The app features a modern, responsive design with both light and dark modes.

## 🛠 Tech Stack

**Frontend:**
- Next.js 15 with TypeScript
- TailwindCSS for styling
- React Context for state management
- Recharts for data visualization
- Lucide React for icons

**Backend:**
- Next.js API Routes with TypeScript
- PostgreSQL with Prisma ORM
- JWT authentication
- Node.js runtime

**External Services:**
- Amadeus Flight API (test environment)
- SendGrid for email notifications
- Custom web scrapers for flight data

## ✨ Features

- **User Authentication** - Secure login and registration system
- **Flight Search** - Search flights between major European cities
- **Price Tracking** - Monitor flight prices over time with interactive charts
- **Smart Notifications** - Email and in-app notifications for price drops
- **Personal Dashboard** - Manage all tracked flights in one place
- **Responsive Design** - Works perfectly on desktop and mobile devices
- **Dark/Light Mode** - User preference support

## 📸 Screenshots

### Authentication
| Login Page | Signup Page |
|------------|-------------|
| ![Login Page](./public/screenshots/login-page-desktop.jpeg) | ![Signup Page](./public/screenshots/signup-page-desktop.jpeg) |

### Flight Search
| Desktop Search | Mobile Search | Dark Mode |
|----------------|---------------|-----------|
| ![Flight Search Desktop](./public/screenshots/flight-search-page-desktop.jpeg) | ![Flight Search Mobile](./public/screenshots/flight-search-page-mobile.png) | ![Flight Search Dark](./public/screenshots/flight-search-page-desktop-2-dark-mode.jpeg) |

| Detailed Search | 
|-----------------|
| ![Detailed Search](./public/screenshots/flight-search-page-desktop-2.jpeg) |

### Flight Tracking
| Track Flight Desktop | Track Flight Mobile | Mobile Dark Mode |
|----------------------|---------------------|------------------|
| ![Track Flight Desktop](./public/screenshots/track-flight-page-desktop.jpeg) | ![Track Flight Mobile](./public/screenshots/track-flight-page-mobile.png) | ![Track Flight Mobile Dark](./public/screenshots/track-flight-page-mobile-dark-mode.png) |

### Dashboard & Analytics
| Dashboard | Price History | Dark Dashboard |
|-----------|---------------|----------------|
| ![Dashboard](./public/screenshots/dashboard-page-desktop.jpeg) | ![Price History](./public/screenshots/dashboard-flight-price-changes-page-desktop.jpeg) | ![Dark Dashboard](./public/screenshots/dashboard-page-desktop-dark-mode.jpeg) |

| Mobile Dashboard |
|------------------|
| ![Mobile Dashboard](./public/screenshots/dashboard-page-mobile.png) |

### User Management
| Notifications | User Profile | Dark Profile |
|---------------|--------------|--------------|
| ![Notifications](./public/screenshots/notifications-page-desktop.jpeg) | ![Profile](./public/screenshots/profile-page-desktop.jpeg) | ![Dark Profile](./public/screenshots/profile-page-desktop-dark-mode.jpeg) |

| Mobile Profile | Mobile Dark Profile |
|----------------|---------------------|
| ![Mobile Profile](./public/screenshots/profile-page-mobile.png) | ![Mobile Dark Profile](./public/screenshots/profile-page-mobile-dark-mode.png) |

| Mobile Notifications |
|----------------------|
| ![Mobile Notifications](./public/screenshots/notifications-page-mobile.png) |

## 🏗 Project Structure
peregrinus/
├── src/
│ ├── app/ # Next.js App Router pages
│ │ ├── api/ # API routes (auth, flights, notifications)
│ │ ├── dashboard/ # User dashboard
│ │ ├── profile/ # User profile page
│ │ └── tracking-setup/ # Flight tracking setup
│ ├── components/ # Reusable React components
│ ├── contexts/ # React context for state management
│ └── lib/ # Utility libraries and services
├── prisma/ # Database schema and migrations
└── public/ # Static assets and screenshots


## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Installation
1. Clone the repository
2. Run `npm install` to install dependencies
3. Set up environment variables in `.env` file
4. Run `npx prisma generate && npx prisma db push` to set up database
5. Run `npm run dev` to start development server

## 📊 Database Schema

The application uses PostgreSQL with the following main models:
- **User** - User accounts and authentication
- **TrackedFlight** - Flight routes being monitored
- **PriceUpdate** - Historical price data
- **Notification** - User notifications
- **UserPreferences** - User settings and preferences

## 🔌 API Endpoints

- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `POST /api/flights/search` - Search for flights
- `POST /api/flights/track` - Track a flight route
- `GET /api/notifications` - User notifications
- `POST /api/user/preferences` - User preferences

## 🎯 Deployment

The application is deployed on **Vercel** with a **PostgreSQL** database. The frontend, backend, and database are fully integrated and operational in production.

## 💡 Note

This is a portfolio project that uses mock flight data and test API keys to demonstrate full-stack development capabilities. Production flight APIs typically require paid subscriptions.

## 👨‍💻 Developer

This project was developed as part of a full-stack developer portfolio showcasing modern web development skills with TypeScript, Next.js, and PostgreSQL.

---

*Peregrinus - Smart flight tracking for savvy travelers. ✈️*