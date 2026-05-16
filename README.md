# Church Quiz Competition Platform

A modern, responsive Church Quiz Competition website with an Admin Panel for quiz management and a user-friendly Participant interface. Built with the MERN stack (MongoDB, Express, React, Node.js).

## Features
- **Admin Dashboard**: Create, edit, publish/unpublish quizzes.
- **Auto & Manual Grading**: Automatically grades MCQs, Checkboxes, Matching, and allows manual grading for short answers.
- **Participant Gateway**: Password-protected site access.
- **Live Timer**: Configurable time limits for quizzes.

## Local Development

1. **Clone the repository**
2. **Setup Backend**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Make sure you have MongoDB running locally or provide a MongoDB Atlas URI in .env
   npm run dev
   ```
3. **Setup Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Deployment Architecture

- **Frontend**: Vercel
- **Backend**: Render
- **Database**: MongoDB Atlas

### 1. Setup Database (MongoDB Atlas)
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Get your connection string (URI).
3. Ensure you allow network access from anywhere (`0.0.0.0/0`) or configure specific IP access.

### 2. Deploying the Backend (Render)
1. Push this repository to GitHub.
2. Go to your [Render Dashboard](https://dashboard.render.com/) and click **New -> Web Service**.
3. Connect your GitHub repository.
4. In the configuration:
   - **Name**: `church-quiz-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Open the **Environment Variables** section and add:
   - `MONGODB_URI` (Your MongoDB Atlas connection string)
   - `JWT_SECRET` (A strong random string for admin auth)
   - `SITE_PASSWORD` (e.g. `churchquiz2026`)
6. Click **Create Web Service**. 
7. Note down the deployed Render URL (e.g., `https://church-quiz-backend.onrender.com`).

### 3. Deploying the Frontend (Vercel)
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New -> Project**.
2. Import the exact same GitHub repository.
3. Change the **Root Directory** to `frontend`.
4. Ensure the Framework Preset is set to **Vite**.
5. Open the **Environment Variables** section and add:
   - `VITE_API_URL` -> Set this to the backend URL you generated in step 2 (e.g., `https://church-quiz-backend.onrender.com`).
6. Click **Deploy**.

Your application is now fully live!
