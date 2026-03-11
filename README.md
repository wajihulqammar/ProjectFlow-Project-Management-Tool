<div align="center">

<img src="https://img.shields.io/badge/ProjectFlow-v1.0.0-7c5af6?style=for-the-badge&logo=lightning&logoColor=white" />

# ⚡ ProjectFlow

### A modern, full-stack project management tool built for teams that ship.

Plan, track, and deliver your best work — with real-time collaboration, beautiful Kanban boards, and powerful analytics.

<br/>

![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=flat-square&logo=socketdotio&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

<br/>

</div>

---

## 📸 Preview

<table>
  <tr>
    <td><img src="Images/1.png" alt="Preview 1" width="400"/></td>
    <td><img src="Images/2.png" alt="Preview 2" width="400"/></td>
  </tr>
  <tr>
    <td><img src="Images/3.png" alt="Preview 3" width="400"/></td>
    <td><img src="Images/4.png" alt="Preview 4" width="400"/></td>
  </tr>
  <tr>
    <td><img src="Images/5.png" alt="Preview 5" width="400"/></td>
    <td><img src="Images/6.png" alt="Preview 6" width="400"/></td>
  </tr>
  <tr>
    <td><img src="Images/7.png" alt="Preview 7" width="400"/></td>
    <td><img src="Images/8.png" alt="Preview 8" width="400"/></td>
  </tr>
  <tr>
    <td><img src="Images/9.png" alt="Preview 9" width="400"/></td>
    <td><img src="Images/10.png" alt="Preview 10" width="400"/></td>
  </tr>
  <tr>
    <td><img src="Images/11.png" alt="Preview 11" width="400"/></td>
    <td><img src="Images/12.png" alt="Preview 12" width="400"/></td>
  </tr>
</table>
---

## ✨ Features

### 🗂 Project Management
- Create projects with custom emoji, color, priority, and due dates
- Track progress with live completion percentages
- Manage team members with role-based access (Owner, Manager, Member, Viewer)
- Favorite projects for quick sidebar access

### 📋 Task Management
- **Kanban Board** — drag-and-drop tasks across columns with real-time sync
- **List View** — grouped task list with one-click completion
- **Calendar View** — month and week views with tasks plotted by due date
- Rich task details: priority, type, assignees, checklists, due dates, tags
- Task types: Task, Bug, Feature, Improvement, Epic, Story
- Priority levels: Urgent, High, Medium, Low, None
- Comment threads with emoji reactions
- Auto-incrementing task numbers per project (`#1`, `#2`, ...)

### 📊 Analytics & Dashboard
- Personal dashboard with live stats (active projects, open tasks, overdue, done this week)
- 7-day task completion trend chart
- Priority distribution pie chart
- Project progress bar charts
- Activity feed across all your projects

### ⚡ Real-Time Collaboration
- Live online presence indicators
- Instant task updates broadcast to all project members via Socket.IO
- Comment notifications
- Live connection status indicator

### 🔐 Authentication
- JWT-based authentication (30-day tokens)
- Register / Login with validation
- Profile management (name, job title, bio, avatar)
- Password change

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| Next.js 14 (App Router) | React framework with file-based routing |
| React 18 | UI component library |
| TypeScript | Type safety |
| Tailwind CSS | Utility-first styling |
| TanStack Query | Data fetching, caching, and sync |
| @dnd-kit | Accessible drag-and-drop for Kanban |
| Socket.IO Client | Real-time communication |
| Recharts | Dashboard analytics charts |
| Framer Motion | Animations |
| Zustand | Global state management |
| React Hook Form + Zod | Form handling and validation |
| Axios | HTTP client |
| date-fns | Date utilities |
| Lucide React | Icon library |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js | JavaScript runtime |
| Express.js | Web framework and REST API |
| MongoDB | NoSQL database |
| Mongoose | MongoDB object modeling |
| Socket.IO | Real-time bidirectional events |
| JWT (jsonwebtoken) | Authentication tokens |
| bcryptjs | Password hashing |
| express-validator | Input validation |
| Helmet | Security headers |
| Morgan | HTTP request logging |
| Nodemon | Auto-restart in development |

---

## 📁 Project Structure

```
projectflow/
│
├── backend/                        # Node.js + Express API server
│   ├── server.js                   # Entry point — Express + Socket.IO setup
│   ├── .env                        # Environment variables (not committed)
│   ├── middleware/
│   │   └── auth.js                 # JWT authentication middleware
│   ├── models/                     # Mongoose schemas
│   │   ├── User.js                 # User accounts
│   │   ├── Project.js              # Projects with columns and members
│   │   ├── Task.js                 # Tasks with full metadata
│   │   ├── Comment.js              # Task comments with reactions
│   │   └── Activity.js            # Activity/audit log
│   └── routes/                     # REST API endpoints
│       ├── auth.js                 # /api/auth/*
│       ├── projects.js             # /api/projects/*
│       ├── tasks.js                # /api/tasks/*
│       ├── comments.js             # /api/comments/*
│       ├── users.js                # /api/users/*
│       ├── activities.js           # /api/activities/*
│       └── dashboard.js            # /api/dashboard
│
└── frontend/                       # Next.js application
    └── src/
        ├── app/                    # Pages (file = URL route)
        │   ├── page.tsx            # / → redirects to /dashboard
        │   ├── login/              # /login
        │   └── (app)/              # Protected routes (requires auth)
        │       ├── dashboard/      # /dashboard
        │       ├── projects/       # /projects
        │       │   └── [id]/       # /projects/:id
        │       ├── my-tasks/       # /my-tasks
        │       ├── analytics/      # /analytics
        │       ├── team/           # /team
        │       └── settings/       # /settings
        ├── components/
        │   ├── layout/
        │   │   ├── Sidebar.tsx     # Navigation sidebar
        │   │   └── Header.tsx      # Top header with search
        │   ├── projects/
        │   │   ├── KanbanBoard.tsx         # Drag-and-drop Kanban
        │   │   ├── TaskListView.tsx        # List view
        │   │   ├── CalendarView.tsx        # Calendar view
        │   │   └── CreateProjectModal.tsx  # New project modal
        │   ├── tasks/
        │   │   ├── CreateTaskModal.tsx     # New task modal
        │   │   └── TaskDetailModal.tsx     # Task detail + comments
        │   └── ui/
        │       └── UserAvatar.tsx          # Avatar component
        ├── context/
        │   ├── AuthContext.tsx      # Authentication state
        │   └── SocketContext.tsx    # Socket.IO connection
        ├── lib/
        │   ├── api.ts              # Axios instance + all API helpers
        │   └── utils.ts            # Utility functions + config
        └── styles/
            └── globals.css         # Global styles + CSS variables
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have these installed:
- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB](https://www.mongodb.com/try/download/community) (local) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/projectflow.git
cd projectflow
```

### 2. Setup the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/projectflow
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=30d
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

> 💡 For MongoDB Atlas, replace `MONGO_URI` with your connection string:
> `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/projectflow`

Start the backend server:

```bash
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
🚀 ProjectFlow server running on port 5000
📡 Socket.IO ready
```

### 3. Setup the Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend/` folder:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

### 4. Open the app

Visit **[http://localhost:3000](http://localhost:3000)** and register a new account.

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create a new account |
| `POST` | `/api/auth/login` | Login and receive JWT token |
| `GET` | `/api/auth/me` | Get current logged-in user |
| `PUT` | `/api/auth/update-profile` | Update profile information |
| `PUT` | `/api/auth/change-password` | Change password |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects` | List all user's projects |
| `POST` | `/api/projects` | Create a new project |
| `GET` | `/api/projects/:id` | Get project by ID |
| `PUT` | `/api/projects/:id` | Update project |
| `DELETE` | `/api/projects/:id` | Delete project |
| `POST` | `/api/projects/:id/members` | Add member to project |
| `DELETE` | `/api/projects/:id/members/:userId` | Remove member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks?projectId=` | Get tasks for a project |
| `POST` | `/api/tasks` | Create a new task |
| `GET` | `/api/tasks/:id` | Get task by ID |
| `PUT` | `/api/tasks/:id` | Update task |
| `PATCH` | `/api/tasks/reorder` | Reorder tasks (Kanban DnD) |
| `DELETE` | `/api/tasks/:id` | Delete task |
| `GET` | `/api/tasks/:id/comments` | Get task comments |
| `POST` | `/api/tasks/:id/comments` | Add a comment |

### Dashboard & Others
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard` | Get dashboard stats and data |
| `GET` | `/api/users` | List all users |
| `GET` | `/api/users/search?q=` | Search users by name/email |
| `GET` | `/api/activities?projectId=` | Get activity feed |

---

## 🌐 Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `task:created` | Server → Client | New task created in project |
| `task:updated` | Server → Client | Task updated |
| `task:deleted` | Server → Client | Task deleted |
| `project:created` | Server → Client | New project created |
| `project:updated` | Server → Client | Project updated |
| `user:online` | Server → Client | User came online |
| `user:offline` | Server → Client | User went offline |
| `users:online` | Server → Client | List of currently online users |

---

## 🎨 Design System

- **Primary color:** Violet `#7c5af6`
- **Background:** Deep navy `hsl(222, 15%, 8%)`
- **Typography:** DM Sans (UI) + JetBrains Mono (code/numbers)
- **Border radius:** 10px cards, 16px modals
- **Theme:** Dark-first with CSS custom properties

---

## 🔮 Roadmap

- [ ] Calendar view Gantt chart
- [ ] File attachments (upload to S3)
- [ ] Email notifications
- [ ] Google / GitHub OAuth
- [ ] Time tracking per task
- [ ] Recurring tasks
- [ ] Project templates
- [ ] CSV / PDF export
- [ ] Mobile responsive improvements
- [ ] Dark / Light theme toggle

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ using the MERN stack + Next.js

⭐ **Star this repo if you found it helpful!**

</div>
