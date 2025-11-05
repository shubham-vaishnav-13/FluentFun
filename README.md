# FluentFun - Language Learning Platform

> A comprehensive MERN-based language learning platform with AI-powered content evaluation, gamification, and interactive learning modules.

## 🏗️ Architecture Overview

### 1. Project Folder Structure

```
FluentFun/
├── backend/                    # Express + MongoDB API
│   ├── src/
│   │   ├── controllers/       # Route handlers
│   │   ├── models/            # Mongoose schemas
│   │   ├── routes/            # API endpoints
│   │   ├── middlewares/       # Auth, validation
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Helpers
│   │   ├── db/                # DB connection
│   │   ├── app.js             # Express app
│   │   └── index.js           # Server entry
│   ├── public/                # Uploads
│   └── package.json
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── context/           # Auth, Theme
│   │   ├── services/          # API calls
│   │   ├── utils/             # Helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── redme.md                   # This file
└── .gitignore
```

## 🚀 Setup Guide

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas account
- Cloudinary account
- Google OAuth credentials
- Google Generative AI API key

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create .env file:**
```bash
cp .env.example .env
```

4. **Configure environment variables in `.env`:**
```
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
DB_NAME=FFDB
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash-latest
```

5. **Start the server:**
```bash
npm start
```

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create .env file:**
```bash
cp .env.example .env
```

4. **Configure environment variables in `.env`:**
```
VITE_API_URL=http://localhost:3000/api/v1
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

5. **Start the development server:**
```bash
npm run dev
```

### Database Backup

Create a backup of your MongoDB database:
```bash
cd backend
node backup.js
```

This will create a timestamped folder with all collections as JSON files.


---

## 📊 Core Features Implemented

### 1. **Authentication & Authorization**
- User registration/login with JWT tokens
- Google OAuth integration
- Role-based access (Admin, User)
- Protected routes and middleware

### 2. **User Management**
- Profile management with avatar upload (Cloudinary)
- XP system with level progression (250 XP per level)
- Streak tracking for daily engagement
- Leaderboard system with global rankings

### 3. **Content Modules**

#### **Interactive Quizzes**
- Multi-language support (English, Hindi, Gujarati, French, Spanish, German)
- Multiple difficulty levels (Beginner, Intermediate, Advanced)
- Category-based organization
- Score tracking and attempt history
- Progressive unlocking based on minimum scores

#### **Writing Challenges**
- Rubric-based AI evaluation using Google Generative AI
- Word limits and time constraints
- Multi-language prompts (6 languages)
- Category support (essay, informal, business, academic)
- Detailed scoring feedback

#### **Speaking Challenges** (Framework Ready)
- Audio-based practice structure
- Evaluation criteria: pronunciation, fluency, vocabulary, grammar
- Time-limited exercises

### 4. **Admin Dashboard**

#### **Content Management:**
- Create/edit/delete quizzes
- Create/edit/delete writing challenges
- Create/edit/delete speaking challenges
- Bulk import from JSON files

#### **User Management:**
- View all users with activity status
- Deactivate/delete users
- Track user progression

#### **Analytics:**
- User growth and engagement metrics
- Content performance statistics
- Completion rates and average scores
- Daily active users tracking

### 5. **Gamification System**
- **XP & Levels:** Earn XP from quiz attempts and writing submissions
- **Achievements:** Unlock badges (Quiz Master, Word Smith, Streak Keeper, etc.)
- **Leaderboard:** Global rankings based on XP
- **Daily Streaks:** Maintain consecutive day engagement
- **Progress Visualization:** Level progress bars and XP trackers

### 6. **Language Preferences**
- 6 supported languages with ISO-like codes (en, hi, gu, fr, es, de)
- Per-user language selection
- Language-filtered content delivery

### 7. **UI/UX Features**
- **Theme System:** Light/Dark mode toggle
- **Animations:** Framer Motion for smooth transitions
- **Responsive Design:** Mobile-first Tailwind CSS
- **Glass Morphism:** Modern frosted glass effects
- **Toast Notifications:** React Hot Toast for user feedback
- **Loading States:** Skeleton loaders and spinners

---

## 🔌 API Endpoints

### User Routes
```
POST   /api/v1/users/register          - Register new user
POST   /api/v1/users/login             - User login
GET    /api/v1/users/logout            - Logout
GET    /api/v1/users/me                - Get current user
PATCH  /api/v1/users/me                - Update profile
GET    /api/v1/users/leaderboard       - Get rankings
```

### Content Routes
```
GET    /api/v1/content/quizzes         - Get quizzes (paginated, filtered)
GET    /api/v1/content/quizzes/counts  - Get quiz counts by difficulty
POST   /api/v1/content/quizzes/attempt - Submit quiz attempt
GET    /api/v1/content/progression     - Get quiz progression for track
GET    /api/v1/content/writing-challenges
POST   /api/v1/content/writing-challenges/:id/submit
```

### Admin Routes
```
GET    /api/v1/admin/dashboard/stats   - Dashboard analytics
GET    /api/v1/admin/users             - List all users
PATCH  /api/v1/admin/users/:userId/status
DELETE /api/v1/admin/users/:userId

POST   /api/v1/admin/quizzes           - Create quiz
PATCH  /api/v1/admin/quizzes/:quizId   - Update quiz
DELETE /api/v1/admin/quizzes/:quizId

POST   /api/v1/admin/writing-challenges
PATCH  /api/v1/admin/writing-challenges/:id
DELETE /api/v1/admin/writing-challenges/:id
```

---

## 📦 Database Models

| Model | Purpose |
|-------|---------|
| `User` | User profiles, XP, streaks, preferences |
| `Quiz` | Quiz content with questions and answers |
| `QuizAttempt` | User quiz submissions and scores |
| `WritingChallenge` | Writing prompts with rubric criteria |
| `Submission` | Writing submissions with AI scores |
| `SpeakingChallenge` | Speaking practice prompts |
| `Language` | Supported languages metadata |

---

## 🚀 Tech Stack

### Frontend
- **React 18** + **Vite** (fast build tool)
- **Tailwind CSS** + Glass Morphism effects
- **Framer Motion** (animations)
- **React Router v6** (navigation)
- **Axios** (API client)
- **React Hot Toast** (notifications)

### Backend
- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose** ODM
- **JWT** authentication
- **Cloudinary** (file uploads)
- **Google Generative AI** (essay scoring)
- **Passport.js** (OAuth)

### Deployment
- **MongoDB Atlas** (cloud database)
- **Cloudinary CDN** (media storage)
- Environment-based configuration

---

## 🔑 Key Implementation Highlights

### AI Integration
- **Essay Evaluation:** Uses Google Generative AI (Gemini) to score writing based on rubric criteria
- **Dynamic Prompting:** Custom system prompts for different challenge types and languages
- **Score Extraction:** Robust JSON parsing from AI responses

### Error Handling
- Custom `ApiError` and `ApiResponse` utilities
- `asyncHandler` wrapper for route handlers
- Middleware-based error catching

### Security Features
- JWT token verification on protected routes
- Admin role verification middleware
- CORS configuration for cross-origin requests
- Secure password handling (bcrypt ready)
- File upload validation

---

## 📱 Responsive Components
- Mobile-optimized navigation
- Adaptive grid layouts
- Touch-friendly buttons and inputs
- Collapsible mobile menus

---

## 🎯 Key User Flows

1. **New User:** Register → Select Languages → Dashboard → Choose Content (Quiz/Writing)
2. **Quiz:** Browse by Language/Difficulty → Attempt → Get Score + XP → Track Progression
3. **Writing:** Select Challenge → Write Response → AI Evaluation → Get Detailed Feedback + XP
4. **Admin:** Dashboard Overview → Manage Content → Create/Edit/Delete → View Analytics

---

---

## ✨ Summary

FluentFun is a **production-ready** language learning platform featuring:
- ✅ Multi-language support with personalized learning paths
- ✅ AI-powered content evaluation for accurate feedback
- ✅ Engaging gamification with XP, levels, and achievements
- ✅ Comprehensive admin dashboard for content & user management
- ✅ Responsive design with modern UI/UX
- ✅ Secure authentication and role-based access control
- ✅ Scalable MERN architecture
- ✅ **Ready to deploy to Render + Vercel**

---

---

**Built with ❤️ by Shubham Vaishnav**

