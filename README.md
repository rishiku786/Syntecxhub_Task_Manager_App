# TaskSphere 🚀

TaskSphere is a modern, full-stack Task Management application built with the **MERN** stack (MongoDB, Express, React, Node.js). It provides a beautiful Kanban-style dashboard to manage your tasks efficiently, featuring seamless drag-and-drop mechanics (conceptually), dark-mode UI with sleek glassmorphism themes, and real-time backend updates.

## 🌟 Features

- **User Authentication:** Secure JWT-based login and registration system.
- **Kanban Dashboard:** Organize tasks effortlessly.
- **Dynamic Themes:** Built-in theme switching (e.g., Glassmorphic Glow, Neon Focus) using modern CSS properties and localStorage.
- **Responsive UI:** Fully responsive and styled with TailwindCSS (or equivalent utility/vanilla approach) for maximum performance.
- **RESTful API:** Powerful backend architecture using Express and MongoDB.

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, React Router DOM, React Icons, Axios.
- **Backend:** Node.js, Express, MongoDB (Mongoose), JSON Web Tokens (JWT), bcryptjs.
- **Deployment:** Vercel (Frontend) & Render.com (Backend).

## 🚀 Getting Started Locally

### Prerequisites
Make sure you have Node.js and MongoDB installed on your system.

### 1. Clone the repository
```bash
git clone https://github.com/rishiku786/Syntecxhub_Task_Manager_App.git
cd Syntecxhub_Task_Manager_App
```

### 2. Install Dependencies
This project uses a monorepo structure. You can install all dependencies from the root:
```bash
npm run install-all
```
*(This installs root, client, and server dependencies).*

### 3. Environment Variables
Create a `.env` file in the root directory and add the following:
```env
MONGO_URI=mongodb://127.0.0.1:27017/taskmanager
JWT_SECRET=super_secret_key_123
JWT_REFRESH_SECRET=super_refresh_secret_456
PORT=5000
NODE_ENV=development
```

### 4. Run the App
Run both the React client and Express server concurrently:
```bash
npm run dev
```
- Frontend will run on `http://localhost:5173`
- Backend will run on `http://localhost:5000`

## 🌍 Deployment

The application can be deployed as two separate services:
1. **Backend (Render.com):** Deploy the `server` directory and set the environment variables (including `CLIENT_URL`).
2. **Frontend (Vercel):** Deploy the `client` directory and set the `VITE_API_URL` to point to the live Render backend.

---
*Created by [Rishav Kumar]*
