# Kanban Task Management App

A full-stack Kanban-style Task Management application built for personal and team productivity with workload balancing, team collaboration, and AI-powered task breakdown and assistant features.

---

## 🛠️ Tech Stack

- **Frontend**: React.js 18, Vite 5, Tailwind CSS, React Router DOM v6, Axios, `@dnd-kit/core` & `@dnd-kit/sortable`
- **Backend**: Node.js, Express.js, REST API architecture
- **Database & ORM**: PostgreSQL (hosted on [Neon](https://neon.tech)), Prisma ORM (v5.22.0)
- **Authentication**: JWT (JSON Web Tokens) with `bcryptjs` password hashing and role-based access control
- **AI Integrations**: OpenAI GPT-3.5 API integration with honest heuristic rule-based fallbacks when an API key is not supplied

---

## ✨ Features Implemented

1. **Authentication & Authorization**:
   - User registration and login with encrypted passwords.
   - JWT-based authorization header token validation.
2. **Project & Team Collaboration**:
   - Create projects with title and description.
   - Project membership management: add team members by email.
   - Automatic project ownership assignments.
3. **Kanban Board & Task Management**:
   - 3-column Kanban board: **To-Do**, **In Progress**, and **Done**.
   - Drag-and-drop task movement across columns with state persistence.
   - Create, edit, and delete tasks with priority tags (Low, Medium, High), due dates, assignees, and descriptions.
   - Real-time column task counters.
4. **Priority Filtering**:
   - Dynamic filtering by **All**, **Low**, **Medium**, and **High** priority.
5. **Workload Balancing (Burnout Warning)**:
   - Real-time tracking of active in-progress tasks per team member.
   - **Visual alert**: Any user assigned to more than 5 tasks in "In Progress" has their avatar pulse red (`animate-pulse-red`) in the team sidebar.
6. **AI Features**:
   - **AI Task Breakdown**: Breaks down complex tasks into 3–5 actionable subtasks. Operates with OpenAI GPT-3.5 or provides an intelligent heuristic fallback if `VITE_AI_API_KEY` is not configured.
   - **AI Task Assistant**: Floating agile coach chatbot to answer questions about workload balancing, prioritization, and sprint planning.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### 1. Environment Setup

#### Backend (`backend/.env`)
Create a `backend/.env` file with the following variables:
```env
DATABASE_URL="postgresql://<user>:<password>@<host>/<dbname>?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://<user>:<password>@<host>/<dbname>?sslmode=require"
JWT_SECRET="super-secret-jwt-key"
PORT=3001
```

#### Frontend (`frontend/.env`)
Optional environment variable for live OpenAI completions:
```env
VITE_AI_API_KEY="sk-..."
```
*(If omitted, the app will run in honest demo/heuristic mode).*

---

### 2. Database Migrations

Run database migrations via Prisma:
```bash
cd backend
npx prisma migrate dev --name init
# or to apply existing migrations:
npx prisma db push
```

---

### 3. Running the Application

#### Start Backend:
```bash
cd backend
npm start
# Server will run on http://localhost:3001
```

#### Start Frontend:
```bash
cd frontend
npm run dev
# Vite client will run on http://localhost:5173
```

#### Production Build:
```bash
cd frontend
npm run build
```
